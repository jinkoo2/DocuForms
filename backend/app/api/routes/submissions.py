import logging
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from app.models.database import FormSubmission, Document, get_db
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

VALID_RESULTS = {"pass", "warning", "fail"}


def _normalize_answers(raw: Any) -> list:
    """Ensure answers are a list of plain dicts with id/label/value/result."""
    if raw is None:
        return []

    # Convert Pydantic models to dicts
    if hasattr(raw, "model_dump"):
        raw = raw.model_dump()

    # Already a list
    if isinstance(raw, list):
        normalized = []
        for idx, item in enumerate(raw):
            if hasattr(item, "model_dump"):
                item = item.model_dump()
            if isinstance(item, dict):
                result = item.get("result")
                normalized.append(
                    {
                        "id": item.get("id") or item.get("field_id") or item.get("name") or str(idx),
                        "label": item.get("label") or item.get("id") or item.get("field_id") or item.get("name") or "",
                        "value": item.get("value", item.get("answer")),
                        "result": result if result in VALID_RESULTS else "pass",
                    }
                )
            else:
                normalized.append(
                    {
                        "id": str(idx),
                        "label": str(idx),
                        "value": item,
                        "result": "pass",
                    }
                )
        return normalized

    # Dict of key -> value (legacy shape)
    if isinstance(raw, dict):
        return [
          {
              "id": str(key),
              "label": str(key),
              "value": value,
              "result": "pass",
          }
          for key, value in raw.items()
        ]

    # Fallback single value
    return [
        {
            "id": "value",
            "label": "value",
            "value": raw,
            "result": "pass",
        }
    ]


@router.get("/", response_model=List[SubmissionResponse])
def get_submissions(
    document_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get all submissions, optionally filtered by document_id"""
    query = db.query(FormSubmission)
    if document_id:
        query = query.filter(FormSubmission.document_id == document_id)

    # Non-admins can only see their own submissions
    if "Admins" not in current_user.get("groups", []):
        query = query.filter(FormSubmission.user_id == current_user["id"])

    submissions = query.all()
    # Normalize answers for response compatibility (legacy rows stored as dict)
    for sub in submissions:
        sub.answers = _normalize_answers(sub.answers)
    return submissions


@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a specific submission by ID"""
    submission = (
        db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Non-admins can only see their own submissions
    if (
        "Admins" not in current_user.get("groups", [])
        and submission.user_id != current_user["id"]
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    submission.answers = _normalize_answers(submission.answers)
    return submission


@router.delete("/{submission_id}", status_code=204)
def delete_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a submission (owners or admins only)."""
    submission = (
        db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if "Admins" not in current_user.get("groups", []) and submission.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(submission)
    db.commit()
    return Response(status_code=204)


@router.post("/", response_model=SubmissionResponse)
def create_submission(
    submission: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new form submission"""
    logger.info(
        "create_submission called with document_id=%s user_id=%s answers=%s",
        submission.document_id,
        current_user.get("id"),
        submission.answers,
    )
    # Verify document exists
    document = (
        db.query(Document).filter(Document.id == submission.document_id).first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Normalize answers to plain dicts to store JSON (Pydantic models aren't serializable)
    normalized_answers = _normalize_answers(submission.answers)

    db_submission = FormSubmission(
        document_id=submission.document_id,
        user_id=current_user["id"],
        answers=normalized_answers,
    )
    try:
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        logger.info(
            "Submission saved to database with id=%s for user_id=%s",
            db_submission.id,
            current_user.get("id"),
        )
    except Exception:
        db.rollback()
        logger.exception(
            "Failed to save submission for document_id=%s user_id=%s",
            submission.document_id,
            current_user.get("id"),
        )
        raise
    return db_submission

