import api from './api';

const ENDPOINT = '/zonas';

const zonaService = {
  /**
   * GET /api/zonas
   * Listar todas las zonas (opcionalmente filtrar por provincia)
   * @param {number} provinciaId - ID de provincia (opcional)
   */
  getAll: async (provinciaId = null) => {
    try {
      const url = provinciaId
        ? `${ENDPOINT}?provincia_id=${provinciaId}`
        : ENDPOINT;
      const response = await api.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching zonas:', error);
      throw error;
    }
  },

  /**
   * GET /api/provincias/:provinciaId/zonas
   * Listar zonas de una provincia específica
   * @param {number} provinciaId - ID de la provincia
   */
  getByProvincia: async (provinciaId) => {
    try {
      const response = await api.get(`/provincias/${provinciaId}/zonas`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching zonas by provincia:', error);
      throw error;
    }
  },

  /**
   * POST /api/zonas
   * Crear nueva zona
   * @param {object} zona - { provincia_id, codigo, nombre }
   */
  create: async (zona) => {
    try {
      const response = await api.post(ENDPOINT, {
        provincia_id: zona.provincia_id,
        codigo: zona.codigo,
        nombre: zona.nombre,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating zona:', error);
      throw error;
    }
  },

  /**
   * PUT /api/zonas/:id
   * Actualizar zona existente
   * @param {number} id - ID de la zona
   * @param {object} zona - { codigo, nombre, activo }
   */
  update: async (id, zona) => {
    try {
      const response = await api.put(`${ENDPOINT}/${id}`, {
        codigo: zona.codigo,
        nombre: zona.nombre,
        activo: zona.activo,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating zona:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/zonas/:id
   * Eliminar zona
   * @param {number} id - ID de la zona
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting zona:', error);
      throw error;
    }
  },
};

export default zonaService;
