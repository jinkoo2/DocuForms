from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import FormSubmission, Document, get_db
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


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

    return query.all()


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

    return submission


@router.post("/", response_model=SubmissionResponse)
def create_submission(
    submission: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new form submission"""
    # Verify document exists
    document = (
        db.query(Document).filter(Document.id == submission.document_id).first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db_submission = FormSubmission(
        document_id=submission.document_id,
        user_id=current_user["id"],
        answers=submission.answers,
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission

