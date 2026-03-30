import json
import logging
import os
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

POLICY_PATH = os.path.join(os.path.dirname(__file__), "mobile-update-policy.json")
EXCLUDED_PATHS = ["/v1/health", "/docs", "/openapi.json"]


def _load_policy() -> dict:
    with open(POLICY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _parse_version(version_str: str | None) -> tuple[int, ...] | None:
    if not version_str:
        return None
    try:
        return tuple(int(x) for x in version_str.split("."))
    except (ValueError, AttributeError):
        return None


def _resolve_platform_policy(policy: dict, application_id: str, platform: str) -> dict | None:
    apps = policy.get("MobileUpdatePolicy", {}).get("Apps", {})
    app_policy = apps.get(application_id)
    if app_policy is None:
        logger.warning("Unknown application ID: %s", application_id)
        return None

    platform_key = "Ios" if platform.lower() == "ios" else "Android" if platform.lower() == "android" else None
    if platform_key is None:
        logger.warning("Unknown platform: %s", platform)
        return None

    return app_policy.get(platform_key)


def _is_update_required(current_version: tuple[int, ...], platform_policy: dict) -> bool:
    min_supported = _parse_version(platform_policy.get("MinSupportedVersion"))
    if min_supported is None:
        return False
    return current_version < min_supported


def _is_newer_version_available(current_version: tuple[int, ...], build_number: int, platform_policy: dict) -> bool:
    latest_version = _parse_version(platform_policy.get("LatestVersion"))
    if latest_version is None:
        return False

    if current_version < latest_version:
        return True

    latest_build = platform_policy.get("LatestBuildNumber")
    if latest_build is not None and current_version == latest_version and build_number < latest_build:
        return True

    return False


def _build_update_required_response(platform_policy: dict) -> JSONResponse:
    return JSONResponse(
        status_code=418,
        content={
            "updateRequired": True,
            "updateAvailable": True,
            "latestVersion": platform_policy.get("LatestVersion"),
            "latestBuildNumber": platform_policy.get("LatestBuildNumber"),
            "storeUrl": platform_policy.get("StoreUrl"),
        },
    )


class UpdateCheckMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if any(request.url.path.startswith(p) for p in EXCLUDED_PATHS):
            return await call_next(request)

        application_id = request.headers.get("x-application-id", "")
        app_version = request.headers.get("x-app-version", "")
        build_number_str = request.headers.get("x-build-number", "")
        platform = request.headers.get("x-phone-os", "")

        if not all([application_id, app_version, build_number_str, platform]):
            return await call_next(request)

        try:
            build_number = int(build_number_str)
        except ValueError:
            logger.warning("Invalid build number format: %s", build_number_str)
            return await call_next(request)

        current_version = _parse_version(app_version)
        if current_version is None:
            return await call_next(request)

        try:
            policy = _load_policy()
        except Exception:
            logger.exception("Error loading mobile update policy")
            return await call_next(request)

        platform_policy = _resolve_platform_policy(policy, application_id, platform)
        if platform_policy is None:
            return await call_next(request)

        if _is_update_required(current_version, platform_policy):
            return _build_update_required_response(platform_policy)

        response = await call_next(request)

        if _is_newer_version_available(current_version, build_number, platform_policy):
            response.headers["x-update-available"] = "true"
            if platform_policy.get("LatestVersion"):
                response.headers["x-latest-version"] = platform_policy["LatestVersion"]
            if platform_policy.get("LatestBuildNumber") is not None:
                response.headers["x-latest-build"] = str(platform_policy["LatestBuildNumber"])
            if platform_policy.get("StoreUrl"):
                response.headers["x-store-url"] = platform_policy["StoreUrl"]

        return response
