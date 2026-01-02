import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nodesApi, documentsApi } from '../../services/api';

interface PropertiesPanelProps {
  nodeId: number | null;
  documentId: number | null;
  isEditMode: boolean;
  getCurrentContent?: () => string;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  nodeId,
  documentId,
  isEditMode,
  getCurrentContent,
}) => {
  const queryClient = useQueryClient();
  const [nodeName, setNodeName] = useState('');
  const { data: node } = useQuery({
    queryKey: ['node', nodeId],
    queryFn: async () => {
      if (!nodeId) return null;
      const response = await nodesApi.getById(nodeId);
      return response.data;
    },
    enabled: !!nodeId,
  });

  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const response = await documentsApi.getById(documentId);
      return response.data;
    },
    enabled: !!documentId,
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({
      id,
      title,
      content,
    }: {
      id: number;
      title?: string;
      content?: string;
    }) => documentsApi.update(id, { title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      nodesApi.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['node', nodeId] });
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });

  useEffect(() => {
    if (node && typeof node.name === 'string') {
      setNodeName(node.name);
    }
  }, [node]);

  const [documentTitle, setDocumentTitle] = useState('');

  useEffect(() => {
    if (document && typeof document.title === 'string') {
      setDocumentTitle(document.title);
    }
  }, [document]);

  if (!nodeId && !documentId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No item selected
        </Typography>
      </Box>
    );
  }

  if (documentId && document) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Document Properties
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            disabled={!isEditMode}
            fullWidth
          />
          <TextField
            label="Version"
            value={document.version}
            disabled
            fullWidth
          />
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(document.created_at).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Updated: {new Date(document.updated_at).toLocaleDateString()}
          </Typography>
          {isEditMode && (
            <Button
              variant="contained"
              color="primary"
              disabled={updateDocumentMutation.isPending || !documentTitle.trim()}
              onClick={() => {
                if (!documentId) return;
                updateDocumentMutation.mutate({
                  id: documentId,
                  title: documentTitle.trim(),
                  content: getCurrentContent?.(),
                });
              }}
            >
              Save Changes
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  if (nodeId && node) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Node Properties
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            disabled={!isEditMode}
            fullWidth
          />
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(node.created_at).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Updated: {new Date(node.updated_at).toLocaleDateString()}
          </Typography>
          {isEditMode && (
            <Button
              variant="contained"
              color="primary"
              disabled={updateNodeMutation.isPending || !nodeName.trim()}
              onClick={() => {
                if (!nodeId) return;
                updateNodeMutation.mutate({ id: nodeId, name: nodeName.trim() });
              }}
            >
              Save Changes
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return null;
};

export default PropertiesPanel;

