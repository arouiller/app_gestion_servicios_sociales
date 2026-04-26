import api from './api';

const authService = {
  login: async ({ email, password, password_blanqueada = false }) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      password_blanqueada
    });
    if (response.data.success && response.data.jwt) {
      localStorage.setItem('jwt_token', response.data.jwt);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updatePerfil: async (payload) => {
    const response = await api.put('/auth/perfil', payload);
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem('jwt_token'),

  isAuthenticated: () => !!localStorage.getItem('jwt_token'),
};

export default authService;
