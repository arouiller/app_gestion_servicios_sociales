import api from './api';

const lookupService = {
  /**
   * GET /api/lookup/:entidad
   * Obtiene la lista de registros para una entidad de lookup
   */
  list: async (entidad) => {
    const response = await api.get(`/lookup/${entidad}`);
    return response.data;
  },

  /**
   * POST /api/lookup/:entidad
   * Crea un nuevo registro de lookup
   */
  create: async (entidad, data) => {
    const response = await api.post(`/lookup/${entidad}`, data);
    return response.data;
  },

  /**
   * PUT /api/lookup/:entidad/:id
   * Actualiza un registro de lookup
   */
  update: async (entidad, id, data) => {
    const response = await api.put(`/lookup/${entidad}/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /api/lookup/:entidad/:id
   * Elimina un registro de lookup
   */
  delete: async (entidad, id) => {
    const response = await api.delete(`/lookup/${entidad}/${id}`);
    return response.data;
  },
};

export default lookupService;
