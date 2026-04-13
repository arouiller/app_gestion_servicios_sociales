import api from '../api';

const planesService = {
  // Get all planes with optional filters
  getPlanes: async (params = {}) => {
    const { data } = await api.get('/v1.0/planes', { params });
    return data.data;
  },

  // Get planes for a specific persona
  getByPersona: async (personaId) => {
    const { data } = await api.get(`/v1.0/planes/por-persona/${personaId}`);
    return data.data;
  },

  // Get a specific plan by plan number
  obtener: async (planNumero) => {
    const { data } = await api.get(`/v1.0/planes/${planNumero}`);
    return data.data;
  },

  // Create a new plan (admin only)
  crear: async (payload) => {
    const { data } = await api.post('/v1.0/planes', payload);
    return data;
  },

  // Update a plan (admin only)
  actualizar: async (planNumero, payload) => {
    const { data } = await api.put(`/v1.0/planes/${planNumero}`, payload);
    return data;
  },

  // Delete a plan (admin only)
  eliminar: async (planNumero) => {
    const { data } = await api.delete(`/v1.0/planes/${planNumero}`);
    return data;
  },
};

export default planesService;
