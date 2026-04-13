import api from '../api';

const planesService = {
  // Get all planes with optional filters
  getPlanes: async (params = {}) => {
    const { data } = await api.get('/planes-v1', { params });
    return data.data;
  },

  // Get planes for a specific persona
  getByPersona: async (personaId) => {
    const { data } = await api.get(`/planes-v1/por-persona/${personaId}`);
    return data.data;
  },

  // Get a specific plan by plan number
  obtener: async (planNumero) => {
    const { data } = await api.get(`/planes-v1/${planNumero}`);
    return data.data;
  },

  // Create a new plan (admin only)
  crear: async (payload) => {
    const { data } = await api.post('/planes-v1', payload);
    return data;
  },

  // Update a plan (admin only)
  actualizar: async (planNumero, payload) => {
    const { data } = await api.put(`/planes-v1/${planNumero}`, payload);
    return data;
  },

  // Delete a plan (admin only)
  eliminar: async (planNumero) => {
    const { data } = await api.delete(`/planes-v1/${planNumero}`);
    return data;
  },
};

export default planesService;
