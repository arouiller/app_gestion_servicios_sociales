import api from './api';

const planesService = {
  // GET lista de planes con filtros
  list: async (filters = {}) => {
    const response = await api.get('/planes', { params: filters });
    return response.data;
  },

  // GET detalle de un plan
  detail: async (id) => {
    const response = await api.get(`/planes/${id}`);
    return response.data;
  },

  // GET siguiente número de afiliado
  obtenerSiguienteNumeroAfiliado: async () => {
    const response = await api.get('/planes/siguiente-numero-afiliado');
    return response.data.siguiente;
  },

  // POST crear plan
  create: async (data) => {
    const response = await api.post('/planes', data);
    return response.data;
  },

  // PUT actualizar plan
  update: async (id, data) => {
    const response = await api.put(`/planes/${id}`, data);
    return response.data;
  },

  // DELETE eliminar plan
  delete: async (id) => {
    const response = await api.delete(`/planes/${id}`);
    return response.data;
  },
};

export default planesService;
