from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://docuforms:changeme@localhost:5432/docuforms")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class TreeNode(Base):
    __tablename__ = "tree_nodes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("tree_nodes.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = relationship("TreeNode", remote_side=[id], backref="children")
    documents = relationship("Document", back_populates="node", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("tree_nodes.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)  # MDX content
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    node = relationship("TreeNode", back_populates="documents")
    submissions = relationship("FormSubmission", back_populates="document", cascade="all, delete-orphan")


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(String, nullable=False)  # From Keycloak
    answers = Column(JSON, nullable=False)  # Store form answers as JSON
    submitted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="submissions")


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
