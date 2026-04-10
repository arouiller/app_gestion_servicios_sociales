import api from './api';

const planesService = {
  listar: async (params = {}) => {
    const { data } = await api.get('/planes', { params });
    return data.data;
  },

  obtener: async (id) => {
    const { data } = await api.get(`/planes/${id}`);
    return data.data;
  },

  crear: async (payload) => {
    const { data } = await api.post('/planes', payload);
    return data;
  },

  actualizar: async (id, payload) => {
    const { data } = await api.put(`/planes/${id}`, payload);
    return data;
  },

  eliminar: async (id) => {
    const { data } = await api.delete(`/planes/${id}`);
    return data;
  },
};

export default planesService;
