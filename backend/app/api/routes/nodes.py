from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.database import TreeNode, get_db
from app.schemas.node import NodeCreate, NodeUpdate, NodeResponse, NodeTreeResponse
from app.api.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/nodes", tags=["nodes"])


def build_tree(nodes: List[TreeNode], parent_id: int | None = None) -> List[NodeTreeResponse]:
    """Build tree structure from flat list"""
    children = [n for n in nodes if n.parent_id == parent_id]
    result = []
    for child in children:
        child_data = NodeTreeResponse(
            id=child.id,
            name=child.name,
            parent_id=child.parent_id,
            created_at=child.created_at,
            updated_at=child.updated_at,
            children=build_tree(nodes, child.id),
            documents=[],  # Will be populated separately if needed
        )
        result.append(child_data)
    return result


@router.get("/", response_model=List[NodeTreeResponse])
def get_nodes(db: Session = Depends(get_db)):
    """Get all tree nodes in hierarchical structure"""
    nodes = db.query(TreeNode).all()
    return build_tree(nodes)


@router.get("/{node_id}", response_model=NodeResponse)
def get_node(node_id: int, db: Session = Depends(get_db)):
    """Get a specific node by ID"""
    node = db.query(TreeNode).filter(TreeNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.post("/", response_model=NodeResponse)
def create_node(
    node: NodeCreate,
    db: Session = Depends(get_db),
):
    """Create a new tree node (auth bypassed for now)"""
    db_node = TreeNode(**node.dict())
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    return db_node


@router.put("/{node_id}", response_model=NodeResponse)
def update_node(
    node_id: int,
    node_update: NodeUpdate,
    db: Session = Depends(get_db),
):
    """Update a tree node (auth bypassed for now)"""
    db_node = db.query(TreeNode).filter(TreeNode.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")

    update_data = node_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_node, field, value)

    db.commit()
    db.refresh(db_node)
    return db_node


@router.delete("/{node_id}")
def delete_node(
    node_id: int,
    db: Session = Depends(get_db),
):
    """Delete a tree node (auth bypassed for now)"""
    node = db.query(TreeNode).filter(TreeNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    db.delete(node)
    db.commit()
    return {"message": "Node deleted successfully"}

