import React, { useState, useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { Box, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../../hooks/useAuth';
import Header from './Header';
import Footer from './Footer';
import TreeView from '../tree/TreeView';
import ContentPanel from './ContentPanel';
import PropertiesPanel from './PropertiesPanel';
import { submissionsApi } from '../../services/api';
import { ControlAnswer } from '../../types';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, login, error, clearError, isAdmin } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [submitResult, setSubmitResult] = useState<
    | { status: 'success'; message: string }
    | { status: 'error'; message: string }
    | null
  >(null);
  const latestContentRef = useRef<string>('');
  // Custom resizable layout state (percentages)
  const [leftWidth, setLeftWidth] = useState(30);
  const [centerWidth, setCenterWidth] = useState(40);
  const [rightWidth, setRightWidth] = useState(30);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const onDragLeft = (deltaPx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const totalPx = container.getBoundingClientRect().width;
    if (totalPx <= 0) return;
    const deltaPct = (deltaPx / totalPx) * 100;
    const newLeft = clamp(leftWidth + deltaPct, 10, 70);
    const remaining = 100 - rightWidth;
    const newCenter = clamp(remaining - newLeft, 10, 80);
    setLeftWidth(newLeft);
    setCenterWidth(newCenter);
  };

  const onDragRight = (deltaPx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const totalPx = container.getBoundingClientRect().width;
    if (totalPx <= 0) return;
    const deltaPct = (deltaPx / totalPx) * 100;
    const newRight = clamp(rightWidth - deltaPct, 10, 70);
    const remaining = 100 - leftWidth;
    const newCenter = clamp(remaining - newRight, 10, 80);
    setRightWidth(newRight);
    setCenterWidth(newCenter);
  };

  const startDrag = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    side: 'left' | 'right'
  ) => {
    e.preventDefault();
    const startX = e.clientX;

    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      if (side === 'left') onDragLeft(delta);
      else onDragRight(delta);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  useEffect(() => {
    // Skip if using mock auth (no need to trigger login)
    const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                       localStorage.getItem('useMockAuth') === 'true';
    if (useMockAuth) {
      return;
    }

    // Check if we're processing a Keycloak callback (using flag from index.tsx)
    const hasCallback = localStorage.getItem('keycloak_processing_callback') === 'true' ||
                       window.location.hash.includes('code=') || 
                       window.location.search.includes('code=') ||
                       (window.location.hash.includes('state=') && window.location.hash.includes('session_state='));
    
    // Don't trigger login if:
    // 1. Still loading (wait for auth check to complete)
    // 2. Already authenticated
    // 3. Processing a callback (let useAuth handle it to prevent redirect loop)
    if (isLoading || isAuthenticated || hasCallback) {
      return;
    }
    
    // Only trigger login if not authenticated and not processing callback
    login();
  }, [isLoading, isAuthenticated, login]);

  // Auto-enable edit mode for admins (run before any early returns)
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setIsEditMode(true);
    }
  }, [isAuthenticated, isAdmin]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Error Modal Component
  const ErrorModal = () => (
    <Dialog
      open={!!error}
      onClose={clearError}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" color="error">
          Authentication Error
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Error:</strong> {error?.message || 'Unknown error occurred'}
        </Typography>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Error Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                backgroundColor: '#f5f5f5',
                padding: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                maxHeight: '400px',
              }}
            >
              {JSON.stringify(error?.details || {}, null, 2)}
            </Box>
          </AccordionDetails>
        </Accordion>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Check the browser console for more details. This error has been logged to Sentry.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={clearError} color="primary">
          Close
        </Button>
        <Button
          onClick={() => {
            clearError();
            window.location.reload();
          }}
          color="primary"
          variant="contained"
        >
          Reload Page
        </Button>
      </DialogActions>
    </Dialog>
  );

  const buildControlAnswers = (): ControlAnswer[] => {
    return Object.entries(formAnswers).map(([fieldId, rawValue]) => {
      const value =
        rawValue && typeof rawValue === 'object' && 'value' in rawValue
          ? (rawValue as any).value
          : rawValue;

      const maybeResult =
        rawValue && typeof rawValue === 'object' && 'result' in rawValue
          ? (rawValue as any).result
          : null;

      const normalizedResult: ControlAnswer['result'] =
        maybeResult === 'pass' || maybeResult === 'warning' || maybeResult === 'fail'
          ? maybeResult
          : 'pass';

      const label =
        rawValue && typeof rawValue === 'object' && 'label' in rawValue
          ? String((rawValue as any).label)
          : fieldId;

      return {
        id: fieldId,
        label,
        value,
        result: normalizedResult,
      };
    });
  };

  const handleSubmit = async () => {
    if (!selectedDocument || Object.keys(formAnswers).length === 0) return;
    try {
      const answersPayload = buildControlAnswers();
      // Log payload for debugging submissions
      // Note: console.log is intentional for visibility during dev
      // eslint-disable-next-line no-console
      console.log('Submitting form payload', {
        document_id: selectedDocument,
        answers: answersPayload,
      });
      const res = await submissionsApi.create({
        document_id: selectedDocument,
        answers: answersPayload,
      });
      const submission = res.data;
      setSubmitResult({
        status: 'success',
        message: `Submission successful (id ${submission.id}).`,
      });
    } catch (err: any) {
      let detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to submit. Please try again.';

      if (Array.isArray(detail)) {
        detail = detail
          .map((d) => (d?.msg ? `${d.msg}` : JSON.stringify(d)))
          .join('; ');
      } else if (detail && typeof detail === 'object') {
        detail = detail.detail || detail.message || JSON.stringify(detail);
      }

      setSubmitResult({
        status: 'error',
        message: typeof detail === 'string' ? detail : String(detail),
      });
    }
  };

  const handleDocumentSelect = (documentId: number | null) => {
    setSelectedDocument(documentId);
    setSelectedNode(null);
  };

  const handleNodeSelect = (nodeId: number | null) => {
    // Ignore null node selections (TreeView may emit after document select)
    if (nodeId === null) return;
    setSelectedNode(nodeId);
    setSelectedDocument(null);
  };

  return (
    <>
      <ErrorModal />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
        />
        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            width: '100%',
          }}
        >
          {/* Left Panel - Tree View */}
          <Box
            sx={{
              width: `${leftWidth}%`,
              minWidth: '10%',
              maxWidth: '70%',
              overflow: 'auto',
              borderRight: 1,
              borderColor: 'divider',
            }}
          >
            <TreeView
              onNodeSelect={handleNodeSelect}
              onDocumentSelect={handleDocumentSelect}
              isEditMode={isEditMode}
              selectedNodeId={selectedNode}
              selectedDocumentId={selectedDocument}
            />
          </Box>

          {/* Resize Handle - Left/Center */}
          <Box
            onMouseDown={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => startDrag(e, 'left')}
            sx={{
              width: '8px',
              cursor: 'col-resize',
              backgroundColor: 'transparent',
              flexShrink: 0,
            }}
          />

          {/* Center Panel - Content */}
          <Box
            sx={{
              width: `${centerWidth}%`,
              minWidth: '10%',
              maxWidth: '80%',
              overflow: 'auto',
            }}
          >
            <ContentPanel
              nodeId={selectedNode}
              documentId={selectedDocument}
              isEditMode={isEditMode}
              formAnswers={formAnswers}
              onFormAnswerChange={setFormAnswers}
              onContentUpdate={(val) => {
                latestContentRef.current = val;
              }}
              onSubmit={
                selectedDocument && Object.keys(formAnswers).length > 0
                  ? handleSubmit
                  : undefined
              }
              submitResult={submitResult}
              clearSubmitResult={() => setSubmitResult(null)}
            />
          </Box>

          {/* Resize Handle - Center/Right */}
          <Box
            onMouseDown={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => startDrag(e, 'right')}
            sx={{
              width: '8px',
              cursor: 'col-resize',
              backgroundColor: 'transparent',
              flexShrink: 0,
            }}
          />

          {/* Right Panel - Properties */}
          <Box
            sx={{
              width: `${rightWidth}%`,
              minWidth: '10%',
              maxWidth: '70%',
              overflow: 'auto',
              borderLeft: 1,
              borderColor: 'divider',
            }}
          >
            <PropertiesPanel
              nodeId={selectedNode}
              documentId={selectedDocument}
              isEditMode={isEditMode}
              getCurrentContent={() => latestContentRef.current}
            />
          </Box>
        </Box>
        <Footer />
      </Box>
    </>
  );
};

export default MainLayout;

