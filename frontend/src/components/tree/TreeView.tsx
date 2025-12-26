import React, { useState, useEffect } from 'react';
import { TreeView as MuiTreeView } from '@mui/x-tree-view/TreeView';
import { Box, Typography, Dialog, TextField, Button } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nodesApi, documentsApi } from '../../services/api';
import { TreeNode, Document } from '../../types';
import CustomTreeNode from './TreeNode';

interface TreeViewProps {
  onNodeSelect: (nodeId: number | null) => void;
  onDocumentSelect: (documentId: number | null) => void;
  isEditMode: boolean;
  selectedNodeId: number | null;
  selectedDocumentId: number | null;
}

const TreeView: React.FC<TreeViewProps> = ({
  onNodeSelect,
  onDocumentSelect,
  isEditMode,
  selectedNodeId,
  selectedDocumentId,
}) => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string[]>(['node-root']);
  const [selected, setSelected] = useState<string | null>('node-root');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'node' | 'document' | null>(
    null
  );
  const [parentId, setParentId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  const { data: nodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      const response = await nodesApi.getAll();
      return response.data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await documentsApi.getAll();
      return response.data;
    },
  });

  const createNodeMutation = useMutation({
    mutationFn: nodesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      setDialogOpen(false);
      setName('');
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
      setTitle('');
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: nodesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleAddNode = (parentId: number | null) => {
    setDialogType('node');
    setParentId(parentId && parentId > 0 ? parentId : null);
    setEditId(null);
    setName('');
    setDialogOpen(true);
  };

  const handleAddDocument = (nodeId: number) => {
    setDialogType('document');
    setParentId(nodeId);
    setEditId(null);
    setTitle('');
    setDialogOpen(true);
  };

  const handleEdit = (id: number, isDocument: boolean) => {
    if (isDocument) {
      const doc = documents?.find((d: Document) => d.id === id);
      if (doc) {
        setDialogType('document');
        setEditId(id);
        setParentId(doc.node_id);
        setTitle(doc.title);
        setDialogOpen(true);
      }
    } else {
      const node = findNodeById(nodes || [], id);
      if (node) {
        setDialogType('node');
        setEditId(id);
        setParentId(node.parent_id);
        setName(node.name);
        setDialogOpen(true);
      }
    }
  };

  const handleDelete = (id: number, isDocument: boolean) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      if (isDocument) {
        deleteDocumentMutation.mutate(id);
      } else {
        deleteNodeMutation.mutate(id);
      }
    }
  };

  const handleDialogSubmit = () => {
    if (dialogType === 'node') {
      if (editId) {
        // Update logic would go here
        setDialogOpen(false);
      } else {
        createNodeMutation.mutate({ name, parent_id: parentId });
      }
    } else if (dialogType === 'document') {
      if (editId) {
        // Update logic would go here
        setDialogOpen(false);
      } else {
        createDocumentMutation.mutate({
          node_id: parentId!,
          title,
          content: '# New Document\n\n',
        });
      }
    }
  };

  const findNodeById = (nodes: TreeNode[], id: number): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const buildTree = (nodes: TreeNode[], parentId: number | null = null) => {
    return nodes
      .filter((node) => node.parent_id === parentId)
      .map((node) => {
        const children = buildTree(nodes, node.id);
        const nodeDocuments =
          documents?.filter((doc: Document) => doc.node_id === node.id) || [];

        return (
          <CustomTreeNode
            key={`node-${node.id}`}
            node={node}
            nodeId={`node-${node.id}`}
            isEditMode={isEditMode}
            onAddNode={handleAddNode}
            onAddDocument={handleAddDocument}
            onEdit={handleEdit}
            onDelete={handleDelete}
          >
            {children}
            {nodeDocuments.map((doc: Document) => (
              <CustomTreeNode
                key={`doc-${doc.id}`}
                node={doc}
                nodeId={`doc-${doc.id}`}
                isDocument
                isEditMode={isEditMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </CustomTreeNode>
        );
      });
  };

  if (!nodes) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const treeItems = buildTree(nodes);

  const rootNode: TreeNode = {
    id: -1,
    name: '/',
    parent_id: null,
    created_at: '',
    updated_at: '',
    children: [],
    documents: [],
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Forms
      </Typography>
      <MuiTreeView
        expanded={expanded}
        onNodeToggle={(event: React.SyntheticEvent, nodeIds: string[]) => {
          setExpanded(nodeIds);
        }}
        selected={selected}
        onNodeSelect={(event: React.SyntheticEvent, nodeId: string | null) => {
          setSelected(nodeId);
          if (nodeId === 'node-root') {
            onNodeSelect(null);
            onDocumentSelect(null);
            return;
          }
          if (nodeId && nodeId.startsWith('node-')) {
            const id = parseInt(nodeId.replace('node-', ''));
            onNodeSelect(id);
            onDocumentSelect(null);
          } else if (nodeId && nodeId.startsWith('doc-')) {
            const id = parseInt(nodeId.replace('doc-', ''));
            onDocumentSelect(id);
            onNodeSelect(null);
          }
        }}
      >
        <CustomTreeNode
          key="node-root"
          node={rootNode}
          nodeId="node-root"
          isEditMode={isEditMode}
          isRoot
          onAddNode={handleAddNode}
          onAddDocument={handleAddDocument}
        >
          {treeItems}
        </CustomTreeNode>
      </MuiTreeView>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <Box sx={{ p: 3, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editId ? 'Edit' : 'Create'}{' '}
            {dialogType === 'node' ? 'Node' : 'Document'}
          </Typography>
          {dialogType === 'node' ? (
            <TextField
              label="Node Name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              fullWidth
              sx={{ mb: 2 }}
            />
          ) : (
            <TextField
              label="Document Title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleDialogSubmit}
              disabled={
                (dialogType === 'node' && !name) ||
                (dialogType === 'document' && !title)
              }
            >
              {editId ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default TreeView;

