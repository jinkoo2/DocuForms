import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

// Initialize Sentry
Sentry.init({
  dsn: 'https://70bc709d10a64129999c3b89da043d7f@bugsink.apps.myphysics.net/2',
  integrations: [
    Sentry.browserTracingIntegration({
      // Only add tracing headers to our own API, not Keycloak
      // This prevents CORS errors with Keycloak
      tracePropagationTargets: [
        'localhost:8000', // Backend API
        /^https:\/\/bugsink\.apps\.myphysics\.net/, // Sentry server
        // Explicitly exclude Keycloak (localhost:8080)
      ],
      // Don't create spans or add headers for Keycloak requests
      shouldCreateSpanForRequest: (url) => {
        // Exclude Keycloak URLs
        if (url.includes('localhost:8080') || url.includes('keycloak') || url.includes(':8080')) {
          return false;
        }
        return true;
      },
    }),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Mark if we have a Keycloak callback (but don't clear URL yet - Keycloak needs it)
// This flag helps prevent MainLayout from triggering login() during callback processing
// Skip this if using mock auth
const USE_MOCK_AUTH = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                      localStorage.getItem('useMockAuth') === 'true';

if (!USE_MOCK_AUTH) {
  const hasKeycloakCallback = window.location.hash.includes('code=') || 
                              window.location.search.includes('code=') ||
                              (window.location.hash.includes('state=') && window.location.hash.includes('session_state='));

  if (hasKeycloakCallback) {
    localStorage.setItem('keycloak_processing_callback', 'true');
  }
} else {
  // Clear any leftover callback flags when using mock auth
  localStorage.removeItem('keycloak_processing_callback');
  // Clear any Keycloak callback URLs from the address bar
  if (window.location.hash.includes('code=') || window.location.search.includes('code=')) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

