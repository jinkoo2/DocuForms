import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Button, Stack, FormControlLabel, Switch } from '@mui/material';
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
  onContentUpdate?: (content: string) => void;
  onSubmit?: () => void;
  submitResult?: { status: 'success' | 'error'; message: string } | null;
  clearSubmitResult?: () => void;
}

const ContentPanel: React.FC<ContentPanelProps> = ({
  nodeId,
  documentId,
  isEditMode,
  formAnswers,
  onFormAnswerChange,
  onContentUpdate,
  onSubmit,
  submitResult,
  clearSubmitResult,
}) => {
  const [content, setContent] = useState('');
  const [isAutoSave, setIsAutoSave] = useState(true);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const draftsRef = React.useRef<Record<number, string>>({});
  const prevDocumentIdRef = React.useRef<number | null>(null);
  const lastLoadedDocIdRef = React.useRef<number | null>(null);
  const lastSavedContentRef = React.useRef<Record<number, string>>({});
  const [lastSavedTick, setLastSavedTick] = useState(0);
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
      draftsRef.current[variables.id] = variables.content ?? '';
      lastSavedContentRef.current[variables.id] = variables.content ?? '';
      setLastSavedTick((t) => t + 1);
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const saveNow = useCallback(
    (id: number, contentValue: string) => {
      updateDocumentMutation.mutate({ id, content: contentValue });
    },
    [updateDocumentMutation]
  );

  const handleManualSave = useCallback(() => {
    if (!documentId) return;
    const currentContent = content ?? '';
    const lastSaved = lastSavedContentRef.current[documentId] ?? '';
    if (currentContent !== lastSaved) {
      updateDocumentMutation.mutate({
        id: documentId,
        content: currentContent,
      });
    }
  }, [documentId, content, updateDocumentMutation]);

  // Local dirty state: content differs from last saved for this document
  const isDirty = React.useMemo(() => {
    if (!documentId) return false;
    const currentContent = content ?? '';
    const lastSaved = lastSavedContentRef.current[documentId] ?? '';
    return currentContent !== lastSaved;
  }, [content, documentId, lastSavedTick]);

  // Persist unsaved edits when switching away from a document
  useEffect(() => {
    const prevId = prevDocumentIdRef.current;
    if (prevId && prevId !== documentId) {
      draftsRef.current[prevId] = content;
    }
    prevDocumentIdRef.current = documentId;
  }, [documentId, content]);

  // Load content when document changes, preferring any draft we stored
  useEffect(() => {
    if (!documentId) {
      setContent('');
      onContentUpdate?.('');
      lastLoadedDocIdRef.current = null;
      return;
    }

    const draft = draftsRef.current[documentId];
    if (draft !== undefined) {
      setContent(draft);
      onContentUpdate?.(draft);
      // If we're loading a draft, check if it matches last saved content
      // If not, we'll need to track what was last saved separately
      // For now, we'll only update lastSavedContentRef when we actually save
      lastLoadedDocIdRef.current = documentId;
      return;
    }

    // Only set from server content when the document actually changed;
    // avoid overwriting local edits on refetch for the same doc.
    if (document && lastLoadedDocIdRef.current !== documentId) {
      setContent(document.content);
      onContentUpdate?.(document.content);
      lastSavedContentRef.current[documentId] = document.content ?? '';
      setLastSavedTick((t) => t + 1);
      lastLoadedDocIdRef.current = documentId;
    }
  }, [documentId, document, onContentUpdate]);

  useAutoSave({
    enabled: isAutoSave,
    documentId,
    isEditMode,
    content,
    save: saveNow,
    lastSavedContent: lastSavedContentRef.current[documentId ?? -1] ?? '',
  });

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">
              {document?.title || 'Document'}
            </Typography>
          </Box>
          <Stack spacing={2} sx={{ height: '100%' }}>
            <Box sx={{ minHeight: '70vh' }}>
              <MarkdownEditor
                content={content}
                onChange={(val) => {
                  setContent(val);
                  onContentUpdate?.(val);
                }}
                readOnly={false}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAutoSave}
                    onChange={(e) => setIsAutoSave(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto Save"
              />
              {!isAutoSave && (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={
                    updateDocumentMutation.isPending ||
                    !isDirty
                  }
                  onClick={handleManualSave}
                >
                  Save
                </Button>
              )}
            </Box>
          </Stack>
        </Box>
      );
    } else {
      return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">
              {document?.title || 'Document'}
            </Typography>
          </Box>
          <FormRenderer
            content={content}
            formAnswers={formAnswers}
            onFormAnswerChange={onFormAnswerChange}
            onRequiredFieldsChange={setRequiredFields}
          />
          {submitResult && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="body2"
                color={submitResult.status === 'success' ? 'success.main' : 'error.main'}
              >
                {submitResult.message}
              </Typography>
            </Box>
          )}
          {onSubmit && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={onSubmit}
                disabled={
                  !documentId ||
                  requiredFields.some((key) => {
                    const val = formAnswers?.[key];
                    if (val === null || val === undefined) return true;
                    if (typeof val === 'number' && Number.isNaN(val)) return true;
                    if (typeof val === 'string' && val.trim() === '') return true;
                    return false;
                  })
                }
              >
                Submit
              </Button>
            </Box>
          )}
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

// Auto-save edits when enabled
function useAutoSave(
  opts: {
    enabled: boolean;
    documentId: number | null;
    isEditMode: boolean;
    content: string;
    save: (id: number, content: string) => void;
    lastSavedContent: string;
  }
) {
  const { enabled, documentId, isEditMode, content, save, lastSavedContent } = opts;
  useEffect(() => {
    if (!enabled || !isEditMode || !documentId) return;
    const handler = setTimeout(() => {
      if (typeof content === 'string') {
        // Only save if content has changed since last save
        if (content !== lastSavedContent) {
          save(documentId, content);
        }
      }
    }, 1000); // simple debounce
    return () => clearTimeout(handler);
  }, [enabled, isEditMode, documentId, content, save, lastSavedContent]);
}

export default ContentPanel;

