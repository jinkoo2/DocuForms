import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, Stack } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../../services/api';
import MarkdownEditor from '../editor/MarkdownEditor';
import FormRenderer from '../editor/FormRenderer';

interface ContentPanelProps {
  nodeId: number | null;
  documentId: number | null;
  isEditMode: boolean;
  formAnswers: Record<string, any>;
  onFormAnswerChange: (answers: Record<string, any>) => void;
}

const ContentPanel: React.FC<ContentPanelProps> = ({
  nodeId,
  documentId,
  isEditMode,
  formAnswers,
  onFormAnswerChange,
}) => {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const response = await documentsApi.getById(documentId);
      return response.data;
    },
    enabled: !!documentId,
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      documentsApi.update(id, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  useEffect(() => {
    if (document) {
      setContent(document.content);
    } else {
      setContent('');
    }
  }, [document]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!nodeId && !documentId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Select a node or document to view content
        </Typography>
      </Box>
    );
  }

  if (documentId) {
    if (isEditMode) {
      return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {document?.title || 'Document'}
          </Typography>
          <Stack spacing={2} sx={{ height: '100%' }}>
            <Box sx={{ minHeight: '70vh' }}>
              <MarkdownEditor
                content={content}
                onChange={setContent}
                readOnly={false}
              />
            </Box>
            <Box>
              <Button
                variant="contained"
                color="primary"
                disabled={
                  updateDocumentMutation.isPending ||
                  content === undefined ||
                  content === null
                }
                onClick={() => {
                  if (!documentId) return;
                  updateDocumentMutation.mutate({
                    id: documentId,
                    content,
                  });
                }}
              >
                Save
              </Button>
            </Box>
          </Stack>
        </Box>
      );
    } else {
      return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {document?.title || 'Document'}
          </Typography>
          <FormRenderer
            content={content}
            formAnswers={formAnswers}
            onFormAnswerChange={onFormAnswerChange}
          />
        </Box>
      );
    }
  }

  // Show node children
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6">Node Content</Typography>
      <Typography variant="body2" color="text.secondary">
        Select a document to view or edit
      </Typography>
    </Box>
  );
};

export default ContentPanel;

