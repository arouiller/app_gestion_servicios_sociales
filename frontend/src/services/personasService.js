import api from './api';

const personasService = {
  // Buscar personas por nombre, apellido, dni
  buscar: async (params = {}) => {
    const { data } = await api.get('/personas/buscar', { params });
    return data.data;
  },

  // Crear persona
  crear: async (payload) => {
    const { data } = await api.post('/personas', payload);
    return data.data;
  },

  // Actualizar persona
  actualizar: async (personaId, payload) => {
    const { data } = await api.put(`/personas/${personaId}`, payload);
    return data.data;
  },
};

export default personasService;
