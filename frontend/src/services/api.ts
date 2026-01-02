import axios from 'axios';
import { ControlAnswer } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bypass auth for now
api.interceptors.request.use((config) => {
  // Do not attach Authorization
  // Add a header to indicate bypass (backend can ignore auth if it checks this)
  (config.headers as any)['X-Bypass-Auth'] = 'true';
  return config;
});

export default api;

// Nodes API
export const nodesApi = {
  getAll: () => api.get('/api/nodes'),
  getById: (id: number) => api.get(`/api/nodes/${id}`),
  create: (data: { name: string; parent_id?: number | null }) =>
    api.post('/api/nodes', data),
  update: (id: number, data: { name: string }) =>
    api.put(`/api/nodes/${id}`, data),
  delete: (id: number) => api.delete(`/api/nodes/${id}`),
};

// Documents API
export const documentsApi = {
  getAll: (nodeId?: number) => {
    const url = nodeId ? `/api/documents?node_id=${nodeId}` : '/api/documents';
    return api.get(url);
  },
  getById: (id: number) => api.get(`/api/documents/${id}`),
  create: (data: { node_id: number; title: string; content: string }) =>
    api.post('/api/documents', data),
  update: (id: number, data: { title?: string; content?: string }) =>
    api.put(`/api/documents/${id}`, data),
  delete: (id: number) => api.delete(`/api/documents/${id}`),
};

// Submissions API
export const submissionsApi = {
  getAll: (documentId?: number) => {
    const url = documentId
      ? `/api/submissions?document_id=${documentId}`
      : '/api/submissions';
    return api.get(url);
  },
  getById: (id: number) => api.get(`/api/submissions/${id}`),
  create: (data: { document_id: number; answers: ControlAnswer[] }) =>
    api.post('/api/submissions', data),
};

// Users API
export const usersApi = {
  getCurrent: () => api.get('/api/users/me'),
  getAll: () => api.get('/api/users'),
  update: (id: string, data: { groups?: string[] }) =>
    api.put(`/api/users/${id}`, data),
};

