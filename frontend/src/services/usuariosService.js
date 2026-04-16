import api from './api';

const usuariosService = {
  // Obtener datos del usuario actual
  obtener: async (usuarioId) => {
    const { data } = await api.get(`/usuarios/${usuarioId}`);
    return data.data;
  },

  // Actualizar tema preferido del usuario
  actualizarTema: async (usuarioId, tema) => {
    const { data } = await api.put(`/usuarios/${usuarioId}`, {
      tema_preferido: tema,
    });
    return data.data;
  },

  // Actualizar datos del usuario (genérico)
  actualizar: async (usuarioId, payload) => {
    const { data } = await api.put(`/usuarios/${usuarioId}`, payload);
    return data.data;
  },

  // Listar todos los usuarios (admin only)
  list: async () => {
    try {
      const response = await api.get('/api/usuarios');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      throw error;
    }
  },

  // Crear nuevo usuario (admin only)
  crear: async (email) => {
    try {
      const response = await api.post('/api/usuarios', { email });
      return response.data.data;
    } catch (error) {
      console.error('Error creating usuario:', error);
      throw error;
    }
  },

  // Cambiar rol del usuario (admin only)
  cambiarRol: async (id, rol) => {
    try {
      const response = await api.put(`/api/usuarios/${id}/rol`, { rol });
      return response.data.data;
    } catch (error) {
      console.error('Error changing rol:', error);
      throw error;
    }
  },

  // Blanquear contraseña del usuario (admin only)
  blanquearPassword: async (id) => {
    try {
      const response = await api.post(`/api/usuarios/${id}/blanquear-password`);
      return response.data.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Cambiar contraseña (para usuarios con password_blanqueada)
  resetPassword: async (email, passwordNueva) => {
    try {
      const response = await api.post('/api/auth/password-reset', {
        email,
        password_nueva: passwordNueva,
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },
};

export default usuariosService;
