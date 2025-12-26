from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class SubmissionBase(BaseModel):
    document_id: int
    answers: Dict[str, Any]


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionResponse(SubmissionBase):
    id: int
    user_id: str
    submitted_at: datetime

    class Config:
        from_attributes = True

