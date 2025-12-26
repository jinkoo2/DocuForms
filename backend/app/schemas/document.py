from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentBase(BaseModel):
    title: str
    content: str


class DocumentCreate(DocumentBase):
    node_id: int


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: int
    node_id: int
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
