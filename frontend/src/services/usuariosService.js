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
};

export default usuariosService;
