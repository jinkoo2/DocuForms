import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactMarkdown from 'react-markdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, submissionsApi } from '../../services/api';
import MarkdownEditor from '../editor/MarkdownEditor';
import FormRenderer from '../editor/FormRenderer';
import { FormSubmission } from '../../types';

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
  const [tabValue, setTabValue] = useState<'form' | 'submissions'>('form');
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [viewSubmission, setViewSubmission] = useState<FormSubmission | null>(null);
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

  const parseProps = (propsString: string): Record<string, any> => {
    const parsePropValue = (raw: string): any => {
      const trimmed = raw.trim();

      try {
        return JSON.parse(trimmed);
      } catch {
        // fall through
      }

      if (trimmed.includes(':')) {
        const candidate = trimmed.startsWith('{') ? trimmed : `{${trimmed}}`;
        const normalized = candidate
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"');
        try {
          return JSON.parse(normalized);
        } catch {
          // fall through
        }
      }

      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      if (!isNaN(Number(trimmed))) return Number(trimmed);

      return raw;
    };

    const props: Record<string, any> = {};
    let idx = 0;
    const len = propsString.length;

    const skipSpaces = () => {
      while (idx < len && /\s/.test(propsString[idx]!)) idx++;
    };

    const readName = () => {
      const start = idx;
      while (idx < len && /[A-Za-z0-9_]/.test(propsString[idx]!)) idx++;
      return propsString.slice(start, idx);
    };

    const readQuoted = () => {
      idx++; // skip opening "
      let out = '';
      while (idx < len && propsString[idx] !== '"') {
        out += propsString[idx];
        idx++;
      }
      idx++; // skip closing "
      return out;
    };

    const readBraced = () => {
      idx++; // skip opening {
      let out = '';
      let depth = 1;
      while (idx < len && depth > 0) {
        const ch = propsString[idx]!;
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (depth > 0) out += ch;
        idx++;
      }
      return out;
    };

    while (idx < len) {
      skipSpaces();
      if (idx >= len) break;
      const name = readName();
      if (!name) break;
      skipSpaces();
      if (propsString[idx] === '=') {
        idx++; // skip =
        skipSpaces();
        const next = propsString[idx];
        if (next === '"') {
          const rawValue = readQuoted();
          props[name] = parsePropValue(rawValue);
        } else if (next === '{') {
          const rawValue = readBraced();
          props[name] = parsePropValue(rawValue);
        } else {
          const rawValue = readName();
          props[name] = parsePropValue(rawValue);
        }
      } else {
        props[name] = true;
      }
    }

    return props;
  };

  const validateUniqueIds = (contentValue: string): { ok: boolean; duplicates: string[] } => {
    const lines = contentValue.split('\n');
    const ids = new Set<string>();
    const dups = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.trim().startsWith('<') && !line.includes('>')) {
        let buffered = line;
        while (i + 1 < lines.length && !lines[i].includes('>')) {
          i += 1;
          buffered += '\n' + lines[i];
          if (lines[i].includes('>')) break;
        }
        line = buffered;
      }

      const selfClosingMatch = line.match(/<(\w+)([\s\S]*?)\s*\/>/);
      const openingMatch = line.match(/<(\w+)([\s\S]*?)>/);
      const match = selfClosingMatch || openingMatch;
      if (!match) continue;
      const [, , propsString] = match;
      const props = parseProps(propsString || '');
      const id = props.id;
      if (!id) continue;
      if (ids.has(id)) {
        dups.add(id);
      } else {
        ids.add(id);
      }
    }

    return { ok: dups.size === 0, duplicates: Array.from(dups) };
  };

  const saveNow = useCallback(
    (id: number, contentValue: string) => {
      const { ok, duplicates } = validateUniqueIds(contentValue);
      if (!ok) {
        window.alert(`Duplicate id(s) found in document: ${duplicates.join(', ')}`);
        return;
      }
      updateDocumentMutation.mutate({ id, content: contentValue });
    },
    [updateDocumentMutation]
  );

  const handleManualSave = useCallback(() => {
    if (!documentId) return;
    const currentContent = content ?? '';
    const lastSaved = lastSavedContentRef.current[documentId] ?? '';
    if (currentContent !== lastSaved) {
      const { ok, duplicates } = validateUniqueIds(currentContent);
      if (!ok) {
        window.alert(`Duplicate id(s) found in document: ${duplicates.join(', ')}`);
        return;
      }
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

  // Reset tab when switching documents
  useEffect(() => {
    setTabValue('form');
  }, [documentId]);

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

  // Submissions list (loaded when Submissions tab is active)
  const {
    data: submissionsData,
    isLoading: isLoadingSubmissions,
    isError: isSubmissionsError,
    error: submissionsError,
  } = useQuery<FormSubmission[]>({
    queryKey: ['submissions', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const res = await submissionsApi.getAll(documentId);
      return res.data;
    },
    enabled: !!documentId && tabValue === 'submissions',
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: (id: number) => submissionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', documentId] });
      if (viewSubmission && viewSubmission.id) {
        setViewSubmission(null);
      }
    },
  });

  const handleDeleteSubmission = (id: number) => {
    if (!documentId) return;
    const confirmed = window.confirm('Delete this submission?');
    if (!confirmed) return;
    deleteSubmissionMutation.mutate(id);
  };

  const renderFormTab = () => {
    if (isEditMode) {
      return (
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
      );
    }

    return (
      <>
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
      </>
    );
  };

  const renderSubmissionsTab = () => {
    if (!documentId) return null;
    if (isLoadingSubmissions) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (isSubmissionsError) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load submissions: {String(submissionsError)}
        </Alert>
      );
    }

    if (!submissionsData || submissionsData.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No submissions yet.
        </Typography>
      );
    }

    const sorted = [...submissionsData].sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );

    const answersToRecord = (answers: any[] = []) =>
      answers.reduce<Record<string, any>>((acc, curr) => {
        if (curr && curr.id !== undefined) {
          acc[String(curr.id)] = curr.value ?? curr;
        }
        return acc;
      }, {});

    const getResultMeta = (answers: any[]): { label: 'Fail' | 'Warning' | 'Pass'; color: string } => {
      const results = (answers || [])
        .map((a) => (a?.result ? String(a.result).toLowerCase() : null))
        .filter((r): r is string => !!r);
      if (results.includes('fail')) return { label: 'Fail', color: 'error.main' };
      if (results.includes('warning')) return { label: 'Warning', color: 'warning.main' };
      return { label: 'Pass', color: 'success.main' };
    };

    return (
      <Table size="small" sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>Submission #</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Date / Time</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Commands</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((sub) => (
            <TableRow key={sub.id} hover>
              <TableCell>{sub.id}</TableCell>
              <TableCell>{sub.user_id}</TableCell>
              <TableCell>{new Date(sub.submitted_at).toLocaleString()}</TableCell>
              {(() => {
                const meta = getResultMeta(sub.answers);
                return (
                  <TableCell sx={{ color: meta.color, fontWeight: 600 }}>
                    {meta.label}
                  </TableCell>
                );
              })()}
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View">
                    <IconButton size="small" onClick={() => setViewSubmission(sub)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteSubmission(sub.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

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
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6">
            {document?.title || 'Document'}
          </Typography>
        </Box>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ mb: 2 }}
        >
          <Tab label="Form Document" value="form" />
          <Tab label="Submissions" value="submissions" />
        </Tabs>

        {tabValue === 'form' ? renderFormTab() : renderSubmissionsTab()}
        <Dialog
          open={!!viewSubmission}
          onClose={() => setViewSubmission(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {viewSubmission
              ? `Submission #${viewSubmission.id} by ${viewSubmission.user_id}`
              : ''}
          </DialogTitle>
          <DialogContent dividers>
            {viewSubmission && (
              <Box sx={{ py: 1 }}>
                <FormRenderer
                  key={viewSubmission.id}
                  content={content}
                  formAnswers={
                    Array.isArray(viewSubmission.answers)
                      ? viewSubmission.answers.reduce<Record<string, any>>((acc, curr) => {
                          if (curr && curr.id !== undefined) {
                            acc[String(curr.id)] = curr.value ?? curr;
                          }
                          return acc;
                        }, {})
                      : {}
                  }
                  onFormAnswerChange={() => {}}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewSubmission(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
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

