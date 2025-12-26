import React, { useState } from 'react';
import { TreeItem, TreeItemProps, treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { Box, IconButton, Typography, Menu, MenuItem } from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Description as FileIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { TreeNode as TreeNodeType, Document } from '../../types';

interface CustomTreeNodeProps extends TreeItemProps {
  node: TreeNodeType | Document;
  isDocument?: boolean;
  isEditMode?: boolean;
  isRoot?: boolean;
  onAddNode?: (parentId: number) => void;
  onAddDocument?: (nodeId: number) => void;
  onEdit?: (id: number, isDocument: boolean) => void;
  onDelete?: (id: number, isDocument: boolean) => void;
}

const CustomTreeNode: React.FC<CustomTreeNodeProps> = ({
  node,
  nodeId,
  children,
  isDocument = false,
  isEditMode = false,
  isRoot = false,
  onAddNode,
  onAddDocument,
  onEdit,
  onDelete,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ mouseX: number; mouseY: number } | null>(null);

  const closeMenu = () => setMenuPosition(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    // Always override the browser context menu
    e.preventDefault();
    e.stopPropagation();
    if (isDocument || !isEditMode) return;
    setMenuPosition({
      mouseX: e.clientX - 2,
      mouseY: e.clientY - 4,
    });
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDocument) return;
    const treeNode = node as TreeNodeType;
    if (onAddNode) {
      onAddNode(treeNode.id);
    }
    closeMenu();
  };

  const handleAddDocument = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDocument) return;
    const treeNode = node as TreeNodeType;
    if (onAddDocument) {
      onAddDocument(treeNode.id);
    }
    closeMenu();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(node.id, isDocument);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(node.id, isDocument);
    }
  };

  const label = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 0.5,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {isDocument ? (
        <FileIcon sx={{ mr: 1, fontSize: 20 }} />
      ) : (
        <FolderIcon sx={{ mr: 1, fontSize: 20 }} />
      )}
      <Typography variant="body2" sx={{ flexGrow: 1 }}>
        {isDocument ? (node as Document).title : (node as TreeNodeType).name}
      </Typography>
      {isEditMode && !isRoot && isHovered && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {!isDocument && (
            <>
              <IconButton size="small" onClick={handleAdd}>
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleAddDocument}>
                <FileIcon fontSize="small" />
              </IconButton>
            </>
          )}
          <IconButton size="small" onClick={handleEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <TreeItem
      nodeId={nodeId}
      label={label}
      onContextMenu={handleContextMenu}
      sx={{
        [`& .${treeItemClasses.content}`]: {
          padding: 0.5,
        },
      }}
      {...props}
    >
      {children}
      {!isDocument && isEditMode && (
        <Menu
          open={menuPosition !== null}
          onClose={closeMenu}
          onClick={(e) => e.stopPropagation()}
          keepMounted
          anchorReference="anchorPosition"
          anchorPosition={
            menuPosition
              ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={(e: React.MouseEvent) => handleAdd(e)}>New Node</MenuItem>
          <MenuItem onClick={(e: React.MouseEvent) => handleAddDocument(e)}>New Form</MenuItem>
        </Menu>
      )}
    </TreeItem>
  );
};

export default CustomTreeNode;

