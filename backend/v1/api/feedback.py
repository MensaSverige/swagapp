import hmac
import hashlib
import logging
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from v1.request_filter import validate_request
from v1 import github_app

logger = logging.getLogger(__name__)

feedback_v1 = APIRouter(prefix="/v1")

USER_HASH_MARKER = "<!-- swagapp-user-hash:"
USER_HASH_MARKER_END = "-->"


class FeedbackCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=1, max_length=20000)
    kind: Optional[str] = Field(default=None, pattern="^(idea|bug|feedback)$")


class FeedbackItem(BaseModel):
    number: int
    title: str
    body: str
    html_url: str
    state: str
    created_at: str
    labels: List[str] = []


def _user_hash(user: dict) -> str:
    secret = os.getenv("SECRET_KEY", "swagapp-feedback-fallback-salt")
    member_number = user.get("memberNumber") or user.get("member_number")
    if member_number:
        ident = f"member:{member_number}"
    else:
        ident = f"user:{user.get('userId')}"
    return hmac.new(
        secret.encode("utf-8"), ident.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def _wrap_body_with_hash(body: str, user_hash: str) -> str:
    return f"{body.strip()}\n\n{USER_HASH_MARKER} {user_hash} {USER_HASH_MARKER_END}\n"


def _strip_hash_from_body(body: str) -> str:
    idx = body.find(USER_HASH_MARKER)
    if idx == -1:
        return body
    return body[:idx].rstrip()


@feedback_v1.post("/feedback", response_model=FeedbackItem)
async def create_feedback(
    payload: FeedbackCreate,
    current_user: dict = Depends(validate_request),
):
    if not github_app.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Feedback service not configured on the server.",
        )

    user_hash = _user_hash(current_user)
    body_with_hash = _wrap_body_with_hash(payload.body, user_hash)
    labels = ["feedback-from-app"]
    if payload.kind:
        labels.append(payload.kind)

    try:
        issue = github_app.create_issue(payload.title, body_with_hash, labels)
    except Exception as e:
        logger.exception("Failed to create GitHub issue for feedback")
        raise HTTPException(status_code=502, detail=f"GitHub error: {e}") from e

    return FeedbackItem(
        number=issue["number"],
        title=issue["title"],
        body=_strip_hash_from_body(issue.get("body") or ""),
        html_url=issue["html_url"],
        state=issue["state"],
        created_at=issue["created_at"],
        labels=[l.get("name", "") for l in issue.get("labels", [])],
    )


@feedback_v1.get("/feedback", response_model=List[FeedbackItem])
async def list_feedback(current_user: dict = Depends(validate_request)):
    if not github_app.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Feedback service not configured on the server.",
        )
    user_hash = _user_hash(current_user)
    try:
        items = github_app.search_issues_by_hash(user_hash)
    except Exception as e:
        logger.exception("Failed to list GitHub feedback issues")
        raise HTTPException(status_code=502, detail=f"GitHub error: {e}") from e

    return [
        FeedbackItem(
            number=it["number"],
            title=it["title"],
            body=_strip_hash_from_body(it.get("body") or ""),
            html_url=it["html_url"],
            state=it["state"],
            created_at=it["created_at"],
            labels=[l.get("name", "") for l in it.get("labels", [])],
        )
        for it in items
    ]
