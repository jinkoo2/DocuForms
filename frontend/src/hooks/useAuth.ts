import { useState, useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react';
import Keycloak from 'keycloak-js';
import { User } from '../types';

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'docuforms',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'docuforms-client',
};

// Mock user for development (bypasses Keycloak)
const MOCK_USER: User = {
  id: 'mock-admin-user-id',
  username: 'adminuser',
  email: 'adminuser@example.com',
  groups: ['Admins'],
};

// Enable mock mode via environment variable or localStorage
const USE_MOCK_AUTH = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                      localStorage.getItem('useMockAuth') === 'true';

// Create Keycloak instance as a singleton
let keycloakInstance: Keycloak | null = null;

const getKeycloakInstance = (): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<{ message: string; details: any } | null>(null);
  const initRef = useRef(false);

  // Mock auth mode - bypass Keycloak
  useEffect(() => {
    if (USE_MOCK_AUTH) {
      setIsAuthenticated(true);
      setIsLoading(false);
      setUser(MOCK_USER);
      setIsAdmin(true); // Mock user is in Admins group
      // Set a mock token for API calls
      localStorage.setItem('access_token', 'mock-token-for-development');
      return;
    }
  }, []);

  useEffect(() => {
    // Skip Keycloak entirely if using mock auth
    if (USE_MOCK_AUTH) {
      return;
    }

    const keycloak = getKeycloakInstance();

    // Check if we're processing a Keycloak callback
    const callbackFlag = localStorage.getItem('keycloak_processing_callback') === 'true';
    const hashHasCode = window.location.hash.includes('code=');
    const hashHasState = window.location.hash.includes('state=') && window.location.hash.includes('session_state=');
    const searchHasCode = window.location.search.includes('code=');
    const hasCallback = callbackFlag || hashHasCode || searchHasCode || hashHasState;
    
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Callback check',
      level: 'info',
      data: { hasCallback },
    });

    // Check if Keycloak is already initialized
    // Once init() is called, authenticated will be set (true or false)
    const isInitialized = keycloak.authenticated !== undefined;
    
    // Check if keycloak instance is valid
    if (!keycloak) {
      const error = new Error('Keycloak instance is undefined');
      Sentry.captureException(error, {
        tags: { component: 'useAuth', action: 'keycloak_check' },
      });
      setError({ message: 'Keycloak instance is not available.', details: {} });
      setIsLoading(false);
      return;
    }

    // If already initialized, update state and clear callback if present
    if (isInitialized) {
      if (!keycloak) {
        const errorMsg = 'Keycloak instance is undefined in initialized path';
        console.error('[useAuth]', errorMsg);
        setError({
          message: errorMsg,
          details: { path: 'initialized_state_update' },
        });
        Sentry.captureException(new Error(errorMsg), {
          tags: { component: 'useAuth', action: 'state_update' },
        });
        setIsLoading(false);
        return;
      }
      
      setIsAuthenticated(keycloak.authenticated || false);
      setIsLoading(false);
      if (keycloak.authenticated) {
        const token = keycloak.token || '';
        if (token) {
          localStorage.setItem('access_token', token);
        }
        loadUserInfo(keycloak);
      }
      
      // Clear callback URL and flag if present
      if (hasCallback) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        localStorage.removeItem('keycloak_processing_callback');
      }
      return;
    }

    // Prevent multiple initializations - critical for React StrictMode
    // This must be checked BEFORE calling init()
    if (initRef.current) {
      return;
    }
    
    // Mark as initializing immediately to prevent double init
    initRef.current = true;

    // Initialize Keycloak
    // If we have a callback, use 'login-required' to force processing it
    // Otherwise use 'check-sso' to check existing session
    const initOptions: Keycloak.KeycloakInitOptions = hasCallback 
      ? { 
          onLoad: 'login-required' as Keycloak.KeycloakOnLoad,
          checkLoginIframe: false,
          pkceMethod: 'S256' as Keycloak.KeycloakPkceMethod,
        }
      : { 
          onLoad: 'check-sso' as Keycloak.KeycloakOnLoad,
          checkLoginIframe: false,
          pkceMethod: 'S256' as Keycloak.KeycloakPkceMethod,
        };
    
    if (!keycloak || typeof keycloak.init !== 'function') {
      const error = new Error('Keycloak instance is invalid before init');
      setError({
        message: error.message,
        details: { keycloakType: typeof keycloak, hasInit: typeof keycloak?.init },
      });
      Sentry.captureException(error, {
        tags: { component: 'useAuth', action: 'keycloak_init' },
        extra: { keycloakType: typeof keycloak, hasInit: typeof keycloak?.init },
      });
      setIsLoading(false);
      initRef.current = false;
      return;
    }
    
    keycloak
      .init(initOptions)
      .then((authenticated) => {
        setIsAuthenticated(authenticated);
        setIsLoading(false);

        if (authenticated && keycloak) {
          const token = keycloak.token || '';
          if (token) {
            localStorage.setItem('access_token', token);
          }
          loadUserInfo(keycloak);
          if (keycloak.tokenParsed) {
            Sentry.setUser({
              id: keycloak.tokenParsed.sub,
              username: keycloak.tokenParsed.preferred_username,
              email: keycloak.tokenParsed.email,
            });
          }
        }
        
        // Clear callback URL and flag AFTER Keycloak has successfully processed it
        if (hasCallback) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          localStorage.removeItem('keycloak_processing_callback');
        }
      })
      .catch((error) => {
        Sentry.captureException(error, {
          tags: { component: 'useAuth', action: 'init_error' },
          extra: { hasCallback },
        });
        setError({ 
          message: error?.message || 'Keycloak initialization failed.', 
          details: { hasCallback } 
        });
        setIsLoading(false);
        // Reset initRef on error so we can retry, but only if not a callback processing error
        if (!hasCallback) {
          initRef.current = false;
        }
      });
  }, []);

  const loadUserInfo = async (kc: Keycloak = getKeycloakInstance()) => {
    if (kc.authenticated && kc.tokenParsed) {
      const tokenParsed = kc.tokenParsed as any;
      const groups = tokenParsed.groups || [];
      const isUserAdmin = groups.includes('Admins');

      setUser({
        id: tokenParsed.sub,
        username: tokenParsed.preferred_username || '',
        email: tokenParsed.email || '',
        groups,
      });
      setIsAdmin(isUserAdmin);
    }
  };

  const login = () => {
    if (USE_MOCK_AUTH) {
      setIsAuthenticated(true);
      setUser(MOCK_USER);
      setIsAdmin(true);
      localStorage.setItem('access_token', 'mock-token-for-development');
      return;
    }
    const keycloak = getKeycloakInstance();
    // Use just the base URL - Keycloak will redirect back to the current page
    keycloak.login({
      redirectUri: 'http://localhost:3000',
    });
  };

  const logout = () => {
    if (USE_MOCK_AUTH) {
      localStorage.removeItem('access_token');
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      return;
    }
    const keycloak = getKeycloakInstance();
    // Use just the base URL for logout redirect
    keycloak.logout({
      redirectUri: 'http://localhost:3000',
    });
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
  };

  const refreshToken = () => {
    if (USE_MOCK_AUTH) {
      // No need to refresh mock tokens
      return;
    }
    const keycloak = getKeycloakInstance();
    if (!keycloak) {
      return;
    }
    keycloak.updateToken(30).then((refreshed) => {
      if (refreshed && keycloak.token) {
        localStorage.setItem('access_token', keycloak.token);
      }
    }).catch((error) => {
      // Silently handle token refresh errors
      console.warn('[useAuth] Token refresh failed:', error);
    });
  };

  // Refresh token periodically (only for real Keycloak auth, not mock)
  useEffect(() => {
    if (USE_MOCK_AUTH) {
      return;
    }
    if (isAuthenticated) {
      const interval = setInterval(refreshToken, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    user,
    isAdmin,
    error,
    clearError: () => setError(null),
    login,
    logout,
  };
};

