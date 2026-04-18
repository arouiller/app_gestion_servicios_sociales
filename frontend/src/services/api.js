import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Adjuntar JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expiró, limpiar y redirigir
// Detectar success: false y disparar notificación
api.interceptors.response.use(
  (response) => {
    // Detectar success: false y disparar notificación
    if (response.data?.success === false && !response.config.headers['X-Skip-Notification']) {
      const notificationContext = window.__notificationContext;
      if (notificationContext) {
        notificationContext.addNotification({
          type: 'error',
          message: response.data.message || 'Error en la solicitud',
        });
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('jwt_token')) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

export default api;
