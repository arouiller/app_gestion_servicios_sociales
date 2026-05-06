import api from './api';

const ENDPOINT = '/provincias';

const provinciaService = {
  /**
   * GET /api/provincias
   * Listar todas las provincias con sus zonas
   */
  getAll: async () => {
    try {
      const response = await api.get(ENDPOINT);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching provincias:', error);
      throw error;
    }
  },

  /**
   * POST /api/provincias
   * Crear nueva provincia
   * @param {object} provincia - { nombre, codigo }
   */
  create: async (provincia) => {
    try {
      const response = await api.post(ENDPOINT, {
        nombre: provincia.nombre,
        codigo: provincia.codigo,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating provincia:', error);
      throw error;
    }
  },

  /**
   * PUT /api/provincias/:id
   * Actualizar provincia existente
   * @param {number} id - ID de la provincia
   * @param {object} provincia - { nombre, codigo, activo }
   */
  update: async (id, provincia) => {
    try {
      const response = await api.put(`${ENDPOINT}/${id}`, {
        nombre: provincia.nombre,
        codigo: provincia.codigo,
        activo: provincia.activo,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating provincia:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/provincias/:id
   * Eliminar provincia
   * @param {number} id - ID de la provincia
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting provincia:', error);
      throw error;
    }
  },
};

export default provinciaService;
