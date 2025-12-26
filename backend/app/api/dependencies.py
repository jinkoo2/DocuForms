from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.services.keycloak_service import KeycloakService

security = HTTPBearer()
keycloak_service = KeycloakService()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verify token and return user info"""
    token = credentials.credentials
    try:
        user_info = keycloak_service.verify_token(token)
        return user_info
    except Exception as e:
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

