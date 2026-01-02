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

  const { data: nodesRaw } = useQuery({
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
    onError: (err) => {
      console.error('Failed to create node', err);
      alert('Failed to create node. Please try again.');
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
    onError: (err) => {
      console.error('Failed to delete node', err);
      alert('Failed to delete node. Please try again.');
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      nodesApi.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      setDialogOpen(false);
      setName('');
    },
    onError: (err) => {
      console.error('Failed to update node', err);
      alert('Failed to update node. Please try again.');
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleAddNode = (parentId: number | null) => {
    // Root is represented as -1 in the tree; send null to backend for root
    const normalizedParent = parentId && parentId > 0 ? parentId : null;
    setDialogType('node');
    setParentId(normalizedParent);
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
        updateNodeMutation.mutate({ id: editId, name });
      } else {
        const normalizedParent = parentId && parentId > 0 ? parentId : null;
        const payload = { name, parent_id: normalizedParent };
        createNodeMutation.mutate(
          payload,
          {
            onSuccess: () => {
              // Expand the parent so the new child is visible
              if (parentId !== null && parentId !== undefined) {
                setExpanded((prev) =>
                  Array.from(new Set([...prev, `node-${parentId}`]))
                );
              }
            },
          }
        );
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

  // Normalize ids recursively (API already returns nested tree)
  const normalizeTree = (node: any): TreeNode => ({
    ...node,
    id: Number(node.id),
    parent_id: node.parent_id === null ? null : Number(node.parent_id),
    children: Array.isArray(node.children)
      ? node.children.map((c: any) => normalizeTree(c))
      : [],
    documents: Array.isArray(node.documents) ? node.documents : [],
  });

  const nodes = nodesRaw ? nodesRaw.map((n: any) => normalizeTree(n)) : null;

  const renderTree = (node: TreeNode) => {
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
        {node.children?.map((child: TreeNode) => renderTree(child))}
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
  };

  if (!nodes) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const treeItems = nodes || [];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Forms
        </Typography>
        {isEditMode && (
          <Button
            size="small"
            variant="contained"
            onClick={() => handleAddNode(null)}
            title="Add Top Node"
            sx={{ minWidth: 36, px: 1 }}
          >
            +
          </Button>
        )}
      </Box>
      <MuiTreeView
        expanded={expanded}
        onNodeToggle={(event: React.SyntheticEvent, nodeIds: string[]) => {
          setExpanded(nodeIds);
        }}
        selected={selected}
        onNodeSelect={(event: React.SyntheticEvent, nodeId: string | null) => {
          setSelected(nodeId);
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
        {treeItems.map((node: TreeNode) => renderTree(node))}
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

