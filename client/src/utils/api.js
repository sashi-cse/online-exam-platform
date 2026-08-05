import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Automatically sends and receives HTTP-Only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer token from localStorage as fallback if set
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
