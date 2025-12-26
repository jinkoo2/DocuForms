from pydantic import BaseModel
from typing import List, Optional


class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    groups: List[str] = []

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    groups: Optional[List[str]] = None

