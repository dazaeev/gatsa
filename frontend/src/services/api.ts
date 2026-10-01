import axios from 'axios';

const api = axios.create({
  baseURL: typeof window === 'undefined' 
    ? 'http://localhost:8080/api/v1'  // Server-side (Node Next.js)
    : '/api/v1',                        // Client-side (Browser via Next rewrites / proxy)
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('gatsa_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Limpiar credenciales inválidas o expiradas si el acceso es denegado
      if (window.location.pathname.startsWith('/admin-dashboard') || window.location.pathname.startsWith('/portal-cliente')) {
        localStorage.removeItem('gatsa_token');
        localStorage.removeItem('gatsa_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
