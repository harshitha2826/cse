import axios from 'axios';

// Fallback to production Railway backend URL when building/running in production
const defaultUrl = import.meta.env.PROD
  ? 'https://skillbridge-backend-production-f054.up.railway.app/api'
  : 'http://localhost:5000';

const rawBase = import.meta.env.VITE_API_URL || defaultUrl;
const baseURL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token to requests
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

export default api;
