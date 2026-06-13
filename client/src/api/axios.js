import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bugtrack_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // expired/invalid token -> force re-login (but not for failed login attempts)
    if (err.response?.status === 401 && !err.config.url.includes('/auth/')) {
      localStorage.removeItem('bugtrack_token');
      localStorage.removeItem('bugtrack_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
