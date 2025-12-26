from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NodeBase(BaseModel):
    name: str


class NodeCreate(NodeBase):
    parent_id: Optional[int] = None


class NodeUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None


class NodeResponse(NodeBase):
    id: int
    parent_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NodeTreeResponse(NodeResponse):
    children: List["NodeTreeResponse"] = []
    documents: List["DocumentResponse"] = []


from app.schemas.document import DocumentResponse

NodeTreeResponse.model_rebuild()

