from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.services.keycloak_service import KeycloakService

security = HTTPBearer(auto_error=False)
keycloak_service = KeycloakService()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Verify token and return user info. Allows bypass via X-Bypass-Auth header for local dev."""
    if request.headers.get("X-Bypass-Auth", "").lower() == "true":
        return {
            "id": "mock-user",
            "username": "mock",
            "email": "mock@example.com",
            "groups": ["Admins"],
        }

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )

    token = credentials.credentials
    try:
        user_info = keycloak_service.verify_token(token)
        return user_info
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


async def require_admin(
    current_user: dict = Depends(get_current_user),
) -> bool:
    """Check if user is in Admins group"""
    groups = current_user.get("groups", [])
    if "Admins" not in groups:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return True

