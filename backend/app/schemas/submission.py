from pydantic import BaseModel
from typing import Any, List, Literal
from datetime import datetime


class ControlAnswer(BaseModel):
    id: str
    label: str
    value: Any
    result: Literal["pass", "warning", "fail"]


class SubmissionBase(BaseModel):
    document_id: int
    answers: List[ControlAnswer]


class SubmissionCreate(SubmissionBase):
    class Config:
        json_schema_extra = {
            "example": {
                "document_id": 123,
                "answers": [
                    {
                        "id": "control-1",
                        "label": "Has incident response plan",
                        "value": "Yes, dated 2024-10-01",
                        "result": "pass",
                    },
                    {
                        "id": "control-2",
                        "label": "Backups tested in last 90 days",
                        "value": "Test scheduled next week",
                        "result": "warning",
                    },
                ],
            }
        }


class SubmissionResponse(SubmissionBase):
    id: int
    user_id: str
    submitted_at: datetime

    class Config:
        from_attributes = True

