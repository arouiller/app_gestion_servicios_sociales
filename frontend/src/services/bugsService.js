import api from './api';

const bugsService = {
  listar: async (params = {}) => {
    const { data } = await api.get('/v1.0/bugs', { params });
    return data.data;
  },

  obtener: async (id) => {
    const { data } = await api.get(`/v1.0/bugs/${id}`);
    return data.data;
  },

  crear: async (payload) => {
    const { data } = await api.post('/v1.0/bugs', payload);
    return data.data;
  },

  cambiarEstado: async (id, estado, version) => {
    const payload = { estado };
    if (version !== undefined) payload.version = version;
    const { data } = await api.put(`/v1.0/bugs/${id}/estado`, payload);
    return data.data;
  },
};

export default bugsService;
