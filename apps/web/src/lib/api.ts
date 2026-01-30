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
    quality?: 'standard' | 'ultra';
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
  uploadFile: (file: File, name?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    return api.post('/api/content/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
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

// Brand Kit API
export const brandkit = {
  get: () => api.get('/api/brandkit'),
  update: (data: {
    brandColors?: string[];
    logoUrl?: string | null;
    logoLightUrl?: string | null;
    brandFonts?: string[];
    brandName?: string | null;
    tagline?: string | null;
  }) => api.patch('/api/brandkit', data),
  uploadLogo: (dataUrl: string, type: 'primary' | 'light' = 'primary') =>
    api.post('/api/brandkit/logo', { dataUrl, type }),
  deleteLogo: (type: 'primary' | 'light') =>
    api.delete(`/api/brandkit/logo/${type}`),
  extractColors: (dataUrl: string) =>
    api.post('/api/brandkit/extract-colors', { dataUrl }),
};

// AI Auto-Design API
export const autodesign = {
  create: (data: {
    logo: string; // Base64 data URL
    text: string;
    businessType?: string;
    preset?: string;
    style?: string;
  }) => api.post('/api/autodesign', data),
  get: (generationId: string) => api.get(`/api/autodesign/${generationId}`),
};

// AI Editing APIs
export const edit = {
  // Image editing
  removeBackground: (image: string) =>
    api.post('/api/edit/remove-background', { image }),
  erase: (image: string, mask: string) =>
    api.post('/api/edit/erase', { image, mask }),
  inpaint: (image: string, mask: string, prompt: string) =>
    api.post('/api/edit/inpaint', { image, mask, prompt }),
  searchReplace: (image: string, searchPrompt: string, replacePrompt: string) =>
    api.post('/api/edit/search-replace', { image, searchPrompt, replacePrompt }),
  replaceBackground: (image: string, backgroundPrompt: string) =>
    api.post('/api/edit/replace-background', { image, backgroundPrompt }),
  outpaint: (image: string, direction: string, pixels?: number, prompt?: string) =>
    api.post('/api/edit/outpaint', { image, direction, pixels, prompt }),
  smartResize: (image: string, currentWidth: number, currentHeight: number, targetWidth: number, targetHeight: number, prompt?: string) =>
    api.post('/api/edit/smart-resize', { image, currentWidth, currentHeight, targetWidth, targetHeight, prompt }),
  upscale: (image: string, mode?: 'fast' | 'conservative', prompt?: string) =>
    api.post('/api/edit/upscale', { image, mode, prompt }),

  // AI copywriting
  copywriter: (context: string, tone?: string, type?: string, brandName?: string) =>
    api.post('/api/edit/copywriter', { context, tone, type, brandName }),
  suggestPlacement: (image: string, canvasWidth: number, canvasHeight: number) =>
    api.post('/api/edit/suggest-placement', { image, canvasWidth, canvasHeight }),
  designAssist: (image: string, context: string, canvasWidth: number, canvasHeight: number, tone?: string, brandName?: string) =>
    api.post('/api/edit/design-assist', { image, context, canvasWidth, canvasHeight, tone, brandName }),

  // Get capabilities
  capabilities: () => api.get('/api/edit/capabilities'),
};

// Scheduling API
export const schedules = {
  list: () => api.get('/api/schedules'),
  get: (id: string) => api.get(`/api/schedules/${id}`),
  create: (data: {
    name: string;
    description?: string;
    type?: 'ALWAYS' | 'TIME_RANGE' | 'DATE_RANGE' | 'DAY_OF_WEEK' | 'DATETIME_RANGE';
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
    daysOfWeek?: number[];
    priority?: number;
    isActive?: boolean;
  }) => api.post('/api/schedules', data),
  update: (id: string, data: any) => api.patch(`/api/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/api/schedules/${id}`),
  assign: (scheduleId: string, playlistItemId: string) =>
    api.post(`/api/schedules/${scheduleId}/assign`, { playlistItemId }),
  unassign: (scheduleId: string, playlistItemId: string) =>
    api.post(`/api/schedules/${scheduleId}/unassign`, { playlistItemId }),
  getActive: (displayId: string) => api.get(`/api/schedules/active/${displayId}`),
  presets: () => api.get('/api/schedules/presets/list'),
};
