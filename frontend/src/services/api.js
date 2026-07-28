import axios from 'axios';

// Use environment variable for production (set in Vercel/Render dashboard)
// Fall back to localhost for development
const getBaseUrl = () => {
  // If REACT_APP_API_URL is set (e.g., in Vercel environment variables), use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  // In development, frontend runs on port 3000, backend on 5000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // If the page is loaded over HTTPS (Vercel production), use Render backend
  if (window.location.protocol === 'https:') {
    return 'https://smartlearning-backend-2.onrender.com/api';
  }
  // When accessed from another device (e.g., mobile phone on same network)
  return `http://${hostname}:5000/api`;
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received (CORS or network issue)
      console.error('Network/CORS Error: No response received from server');
      error.message = 'Network error: Unable to reach the server. Please check your connection.';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Resources API
export const resourceAPI = {
  upload: (formData) =>
    api.post('/resources', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (category) => api.get('/resources', { params: category ? { category } : {} }),
  download: (id) => api.get(`/resources/${id}/download`, { responseType: 'blob' }),
  preview: (id) => api.get(`/resources/${id}/preview`, { responseType: 'blob' }),
  getPreviewUrl: (id) => `${API_URL}/resources/${id}/preview`,
  delete: (id) => api.delete(`/resources/${id}`),
};

// Tests API
export const testAPI = {
  create: (data) => api.post('/tests', data),
  getAll: () => api.get('/tests'),
  getById: (id) => api.get(`/tests/${id}`),
  submit: (id, answers) => api.post(`/tests/${id}/submit`, { answers }),
  getMyResults: () => api.get('/tests/results/mine'),
  getAllResults: () => api.get('/tests/results/all'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllTestResults: () => api.get('/admin/test-results'),
  deleteResource: (id) => api.delete(`/admin/resources/${id}`),
  deleteTest: (id) => api.delete(`/admin/tests/${id}`),
};

// Quran API
export const quranAPI = {
  getProgress: () => api.get('/quran/progress'),
  updatePage: (page) => api.put('/quran/progress/page', { page }),
  markPageComplete: (page) => api.post('/quran/progress/complete', { page }),
  getStats: () => api.get('/quran/progress/stats'),
  logError: (data) => api.post('/quran/errors', data),
  getErrorStats: () => api.get('/quran/errors/stats'),
};

export default api;
