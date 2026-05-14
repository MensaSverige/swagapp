import os
import time
import logging
import jwt
import requests

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
GITHUB_REPO_OWNER = "mensasverige"
GITHUB_REPO_NAME = "swagapp"

_installation_token_cache: dict[str, float | str] = {}


def _app_id() -> str | None:
    return os.getenv("GITHUB_APP_ID") or None


def _private_key() -> str | None:
    pem = os.getenv("GITHUB_APP_PRIVATE_KEY")
    if not pem:
        return None
    return pem.replace("\\n", "\n")


def is_configured() -> bool:
    return bool(_app_id() and _private_key())


def _generate_app_jwt() -> str:
    app_id = _app_id()
    pem = _private_key()
    if not app_id or not pem:
        raise RuntimeError("GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY is missing")
    now = int(time.time())
    payload = {"iat": now - 30, "exp": now + 9 * 60, "iss": app_id}
    return jwt.encode(payload, pem, algorithm="RS256")


def _installation_id(app_jwt: str) -> int:
    res = requests.get(
        f"{GITHUB_API}/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/installation",
        headers={
            "Authorization": f"Bearer {app_jwt}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=15,
    )
    if res.status_code != 200:
        raise RuntimeError(
            f"Failed to fetch installation id: {res.status_code} {res.text}"
        )
    return int(res.json()["id"])


def _installation_token() -> str:
    cached = _installation_token_cache.get("token")
    expires_at = _installation_token_cache.get("expires_at", 0)
    if cached and isinstance(expires_at, (int, float)) and time.time() < expires_at - 60:
        return str(cached)

    app_jwt = _generate_app_jwt()
    installation_id = _installation_id(app_jwt)
    res = requests.post(
        f"{GITHUB_API}/app/installations/{installation_id}/access_tokens",
        headers={
            "Authorization": f"Bearer {app_jwt}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=15,
    )
    if res.status_code not in (200, 201):
        raise RuntimeError(
            f"Failed to mint installation token: {res.status_code} {res.text}"
        )
    data = res.json()
    token = data["token"]
    expires_iso = data.get("expires_at", "")
    # GitHub installation tokens are valid for 1h; cache for 50min
    _installation_token_cache["token"] = token
    _installation_token_cache["expires_at"] = time.time() + 50 * 60
    _installation_token_cache["expires_iso"] = expires_iso
    return token


def _auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_installation_token()}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def create_issue(title: str, body: str, labels: list[str] | None = None) -> dict:
    payload: dict = {"title": title, "body": body}
    if labels:
        payload["labels"] = labels
    res = requests.post(
        f"{GITHUB_API}/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/issues",
        json=payload,
        headers=_auth_headers(),
        timeout=15,
    )
    if res.status_code not in (200, 201):
        raise RuntimeError(
            f"Failed to create issue: {res.status_code} {res.text}"
        )
    return res.json()


def search_issues_by_hash(user_hash: str, per_page: int = 30) -> list[dict]:
    query = f'repo:{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME} in:body "{user_hash}"'
    res = requests.get(
        f"{GITHUB_API}/search/issues",
        params={"q": query, "per_page": per_page, "sort": "created", "order": "desc"},
        headers=_auth_headers(),
        timeout=15,
    )
    if res.status_code != 200:
        raise RuntimeError(
            f"Failed to search issues: {res.status_code} {res.text}"
        )
    return res.json().get("items", [])


def list_feedback_issues(per_page: int = 50) -> list[dict]:
    res = requests.get(
        f"{GITHUB_API}/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/issues",
        params={
            "labels": "feedback-from-app",
            "state": "all",
            "per_page": per_page,
            "sort": "created",
            "direction": "desc",
        },
        headers=_auth_headers(),
        timeout=15,
    )
    if res.status_code != 200:
        raise RuntimeError(
            f"Failed to list feedback issues: {res.status_code} {res.text}"
        )
    return [
        i for i in res.json() if "pull_request" not in i
    ]


def get_issue(issue_number: int) -> dict:
    res = requests.get(
        f"{GITHUB_API}/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/issues/{issue_number}",
        headers=_auth_headers(),
        timeout=15,
    )
    if res.status_code != 200:
        raise RuntimeError(
            f"Failed to fetch issue: {res.status_code} {res.text}"
        )
    return res.json()


def list_issue_comments(issue_number: int) -> list[dict]:
    res = requests.get(
        f"{GITHUB_API}/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/issues/{issue_number}/comments",
        params={"per_page": 100},
        headers=_auth_headers(),
        timeout=15,
    )
    if res.status_code != 200:
        raise RuntimeError(
            f"Failed to list comments: {res.status_code} {res.text}"
        )
    return res.json()


def create_issue_comment(issue_number: int, body: str) -> dict:
    res = requests.post(
        f"{GITHUB_API}/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/issues/{issue_number}/comments",
        json={"body": body},
        headers=_auth_headers(),
        timeout=15,
    )
    if res.status_code not in (200, 201):
        raise RuntimeError(
            f"Failed to create comment: {res.status_code} {res.text}"
        )
    return res.json()
