import axios from 'axios';

// Get the API base URL
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  // Development - localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // Production - always use Render backend
  return 'https://smartlearning-backend-2.onrender.com/api';
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
