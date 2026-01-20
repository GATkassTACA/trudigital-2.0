import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const auth = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  signup: (data: { email: string; password: string; name: string; organizationName: string }) =>
    api.post('/api/auth/signup', data),
  me: () => api.get('/api/auth/me'),
};

export const generate = {
  create: (data: {
    prompt: string;
    preset?: string;
    style?: string;
    samples?: number;
    saveToLibrary?: boolean;
    enhance?: boolean;
  }) => api.post('/api/generate', data),
  history: (limit = 20, offset = 0) =>
    api.get(`/api/generate/history?limit=${limit}&offset=${offset}`),
  presets: () => api.get('/api/generate/presets'),
  balance: () => api.get('/api/generate/balance'),
};

export const content = {
  list: (folderId?: string) =>
    api.get(`/api/content${folderId ? `?folderId=${folderId}` : ''}`),
  get: (id: string) => api.get(`/api/content/${id}`),
  delete: (id: string) => api.delete(`/api/content/${id}`),
  upload: (dataUrl: string, name?: string) =>
    api.post('/api/content/upload', { dataUrl, name, type: 'IMAGE' }),
  folders: () => api.get('/api/content/folders/list'),
  createFolder: (name: string, parentId?: string) =>
    api.post('/api/content/folders', { name, parentId }),
};

export const displays = {
  list: () => api.get('/api/displays'),
  get: (id: string) => api.get(`/api/displays/${id}`),
  create: (data: { name: string; orientation?: string; location?: string }) =>
    api.post('/api/displays', data),
  update: (id: string, data: any) => api.patch(`/api/displays/${id}`, data),
  delete: (id: string) => api.delete(`/api/displays/${id}`),
};

export const weather = {
  get: (location: string, units: 'imperial' | 'metric' = 'imperial') =>
    api.get(`/api/weather?location=${encodeURIComponent(location)}&units=${units}`),
  getByCoords: (lat: number, lon: number, units: 'imperial' | 'metric' = 'imperial') =>
    api.get(`/api/weather/coords?lat=${lat}&lon=${lon}&units=${units}`),
};

export const playlists = {
  list: () => api.get('/api/playlists'),
  get: (id: string) => api.get(`/api/playlists/${id}`),
  create: (name: string) => api.post('/api/playlists', { name }),
  update: (id: string, data: any) => api.patch(`/api/playlists/${id}`, data),
  delete: (id: string) => api.delete(`/api/playlists/${id}`),
  addItem: (id: string, contentId: string, duration?: number) =>
    api.post(`/api/playlists/${id}/items`, { contentId, duration }),
  removeItem: (id: string, itemId: string) =>
    api.delete(`/api/playlists/${id}/items/${itemId}`),
  reorder: (id: string, items: { id: string; order: number }[]) =>
    api.put(`/api/playlists/${id}/reorder`, { items }),
};
