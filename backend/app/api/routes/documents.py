from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import Document, TreeNode, get_db
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.api.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("/", response_model=List[DocumentResponse])
def get_documents(
    node_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Get all documents, optionally filtered by node_id"""
    query = db.query(Document)
    if node_id:
        query = query.filter(Document.node_id == node_id)
    return query.all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get a specific document by ID"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/", response_model=DocumentResponse)
def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
):
    """Create a new document (auth bypassed for now)"""
    # Verify node exists
    node = db.query(TreeNode).filter(TreeNode.id == document.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    db_document = Document(**document.dict())
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
):
    """Update a document (auth bypassed for now)"""
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = document_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_document, field, value)

    # Increment version on content update
    if "content" in update_data:
        db_document.version += 1

    db.commit()
    db.refresh(db_document)
    return db_document


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    """Delete a document (auth bypassed for now)"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

