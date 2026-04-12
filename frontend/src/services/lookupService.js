import api from './api';

const lookupService = {
  // GET lista de entidades
  list: async (entidad) => {
    const response = await api.get(`/lookup/${entidad}`);
    return response.data;
  },

  // POST crear nueva entidad
  create: async (entidad, data) => {
    const response = await api.post(`/lookup/${entidad}`, data);
    return response.data;
  },

  // PUT actualizar entidad
  update: async (entidad, numero, data) => {
    const response = await api.put(`/lookup/${entidad}/${numero}`, data);
    return response.data;
  },

  // DELETE eliminar entidad
  delete: async (entidad, numero) => {
    const response = await api.delete(`/lookup/${entidad}/${numero}`);
    return response.data;
  },
};

export default lookupService;
