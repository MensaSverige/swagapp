import hmac
import hashlib
import logging
import os
import re
import shutil
import uuid
from typing import List, Optional, Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from v1.request_filter import validate_request
from v1 import github_app
from v1.db.feedback_votes import set_vote, get_tally, get_tallies
from v1.db.feedback_user_index import register_user as register_feedback_user

FEEDBACK_ATTACHMENT_DIR = "/static/img/feedback"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

logger = logging.getLogger(__name__)

feedback_v1 = APIRouter(prefix="/v1")

USER_HASH_MARKER = "<!-- swagapp-user-hash:"
USER_HASH_MARKER_END = "-->"
USER_HASH_PATTERN = re.compile(
    r"<!--\s*swagapp-user-hash:\s*([a-f0-9]+)\s*-->", re.IGNORECASE
)


class FeedbackCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=1, max_length=20000)
    kind: Optional[str] = Field(default=None, pattern="^(idea|bug|feedback)$")


class VoteIn(BaseModel):
    value: Literal[-1, 0, 1]


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=20000)


class FeedbackAuthor(BaseModel):
    type: Literal["app_user", "github"]
    label: str  # pseudonym or github login


class VoteTally(BaseModel):
    up: int
    down: int
    score: int
    my_vote: int


class FeedbackItem(BaseModel):
    number: int
    title: str
    body: str
    html_url: str
    state: str
    created_at: str
    labels: List[str] = []
    comments: int
    author: FeedbackAuthor
    mine: bool
    votes: VoteTally


class FeedbackComment(BaseModel):
    id: int
    body: str
    created_at: str
    author: FeedbackAuthor
    mine: bool


def _user_hash(user: dict) -> str:
    secret = os.getenv("SECRET_KEY", "swagapp-feedback-fallback-salt")
    member_number = user.get("memberNumber") or user.get("member_number")
    if member_number:
        ident = f"member:{member_number}"
    else:
        ident = f"user:{user.get('userId')}"
    h = hmac.new(
        secret.encode("utf-8"), ident.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    # Persist the hash→user mapping every time we generate the hash for a
    # request. This lets admins look up authorship for moderation
    # (e.g. who posted abusive content on the public GitHub repo).
    register_feedback_user(user, h)
    return h


def _wrap_body_with_hash(body: str, user_hash: str) -> str:
    return f"{body.strip()}\n\n{USER_HASH_MARKER} {user_hash} {USER_HASH_MARKER_END}\n"


def _extract_hash(body: str | None) -> str | None:
    if not body:
        return None
    m = USER_HASH_PATTERN.search(body)
    return m.group(1).lower() if m else None


def _strip_hash_from_body(body: str | None) -> str:
    if not body:
        return ""
    return USER_HASH_PATTERN.sub("", body).rstrip()


def _author_for(item_body: str | None, comment_user_login: str | None, current_user_hash: str) -> tuple[FeedbackAuthor, bool]:
    """Determine author info for an issue body or comment body.

    Returns (author, mine).
    If the body carries an app-user hash marker, the author is anonymized
    (pseudonym derived from the hash) and `mine` reflects whether it
    matches the current user.
    Otherwise the author is a real GitHub user and `mine` is False.
    """
    h = _extract_hash(item_body)
    if h:
        return FeedbackAuthor(type="app_user", label=f"Användare {h[:6]}"), h == current_user_hash
    login = comment_user_login or "github-user"
    return FeedbackAuthor(type="github", label=login), False


def _issue_to_item(issue: dict, current_user_hash: str, tally: dict) -> FeedbackItem:
    author, mine = _author_for(issue.get("body"), None, current_user_hash)
    return FeedbackItem(
        number=issue["number"],
        title=issue["title"],
        body=_strip_hash_from_body(issue.get("body")),
        html_url=issue["html_url"],
        state=issue["state"],
        created_at=issue["created_at"],
        labels=[l.get("name", "") for l in issue.get("labels", [])],
        comments=issue.get("comments", 0),
        author=author,
        mine=mine,
        votes=VoteTally(**tally),
    )


class AttachmentResponse(BaseModel):
    url: str


@feedback_v1.post("/feedback/attachments", response_model=AttachmentResponse)
async def upload_feedback_attachment(
    file: UploadFile = File(...),
    current_user: dict = Depends(validate_request),
):
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Endast bildfiler (JPG, PNG, GIF, WEBP) tillåts.",
        )

    os.makedirs(FEEDBACK_ATTACHMENT_DIR, exist_ok=True)
    name = f"{uuid.uuid4().hex}{extension}"
    disk_path = os.path.join(FEEDBACK_ATTACHMENT_DIR, name)
    with open(disk_path, "wb") as out:
        shutil.copyfileobj(file.file, out)

    base = os.getenv("PUBLIC_BASE_URL", "https://app.events.mensa.se/api").rstrip("/")
    public_url = f"{base}/static/img/feedback/{name}"
    return AttachmentResponse(url=public_url)


@feedback_v1.post("/feedback", response_model=FeedbackItem)
async def create_feedback(
    payload: FeedbackCreate,
    current_user: dict = Depends(validate_request),
):
    if not github_app.is_configured():
        raise HTTPException(status_code=503, detail="Feedback service not configured.")

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

    tally = get_tally(issue["number"], user_hash)
    return _issue_to_item(issue, user_hash, tally)


@feedback_v1.get("/feedback", response_model=List[FeedbackItem])
async def list_feedback(
    scope: Literal["all", "mine"] = "all",
    current_user: dict = Depends(validate_request),
):
    if not github_app.is_configured():
        raise HTTPException(status_code=503, detail="Feedback service not configured.")
    user_hash = _user_hash(current_user)
    try:
        if scope == "mine":
            raw = github_app.search_issues_by_hash(user_hash)
        else:
            raw = github_app.list_feedback_issues()
    except Exception as e:
        logger.exception("Failed to list GitHub feedback issues")
        raise HTTPException(status_code=502, detail=f"GitHub error: {e}") from e

    numbers = [it["number"] for it in raw]
    tallies = get_tallies(numbers, user_hash)
    return [
        _issue_to_item(it, user_hash, tallies.get(it["number"], {"up": 0, "down": 0, "score": 0, "my_vote": 0}))
        for it in raw
    ]


@feedback_v1.post("/feedback/{number}/vote", response_model=VoteTally)
async def vote_on_feedback(
    number: int,
    payload: VoteIn,
    current_user: dict = Depends(validate_request),
):
    user_hash = _user_hash(current_user)
    set_vote(number, user_hash, payload.value)
    return VoteTally(**get_tally(number, user_hash))


@feedback_v1.get("/feedback/{number}/comments", response_model=List[FeedbackComment])
async def list_comments(
    number: int,
    current_user: dict = Depends(validate_request),
):
    if not github_app.is_configured():
        raise HTTPException(status_code=503, detail="Feedback service not configured.")
    user_hash = _user_hash(current_user)
    try:
        comments = github_app.list_issue_comments(number)
    except Exception as e:
        logger.exception("Failed to list comments")
        raise HTTPException(status_code=502, detail=f"GitHub error: {e}") from e

    result: List[FeedbackComment] = []
    for c in comments:
        author, mine = _author_for(c.get("body"), (c.get("user") or {}).get("login"), user_hash)
        result.append(
            FeedbackComment(
                id=c["id"],
                body=_strip_hash_from_body(c.get("body")),
                created_at=c["created_at"],
                author=author,
                mine=mine,
            )
        )
    return result


@feedback_v1.post("/feedback/{number}/comments", response_model=FeedbackComment)
async def create_comment(
    number: int,
    payload: CommentCreate,
    current_user: dict = Depends(validate_request),
):
    if not github_app.is_configured():
        raise HTTPException(status_code=503, detail="Feedback service not configured.")
    user_hash = _user_hash(current_user)
    body_with_hash = _wrap_body_with_hash(payload.body, user_hash)
    try:
        c = github_app.create_issue_comment(number, body_with_hash)
    except Exception as e:
        logger.exception("Failed to create comment")
        raise HTTPException(status_code=502, detail=f"GitHub error: {e}") from e

    author, mine = _author_for(c.get("body"), (c.get("user") or {}).get("login"), user_hash)
    return FeedbackComment(
        id=c["id"],
        body=_strip_hash_from_body(c.get("body")),
        created_at=c["created_at"],
        author=author,
        mine=mine,
    )
