from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.user import UserResponse, UserUpdate
from app.api.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["id"],
        username=current_user.get("username", ""),
        email=current_user.get("email"),
        groups=current_user.get("groups", []),
    )


@router.get("/", response_model=List[UserResponse])
def get_users(admin: bool = Depends(require_admin)):
    """Get all users (Admin only)"""
    # In a real implementation, you'd fetch users from Keycloak
    # For now, return empty list
    return []


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_update: UserUpdate,
    admin: bool = Depends(require_admin),
):
    """Update user (Admin only)"""
    # In a real implementation, you'd update user in Keycloak
    # For now, return a placeholder
    raise HTTPException(status_code=501, detail="Not implemented yet")

