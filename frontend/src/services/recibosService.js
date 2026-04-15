import api from './api';

const recibosService = {
  /**
   * POST /api/recibos/generar
   * Genera recibos para un período
   * @param {object} data - { periodo: "2026-04-01", planes: [] }
   */
  generar: async (data) => {
    try {
      const response = await api.post('/recibos/generar', data);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        recibos: [],
      };
    }
  },

  /**
   * GET /api/recibos?periodo=YYYY-MM-DD
   * Lista recibos de un período con sus integrantes
   */
  list: async (periodo) => {
    try {
      const response = await api.get('/recibos', { params: { periodo } });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * GET /api/recibos/:id
   * Obtiene detalle de un recibo con sus integrantes
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/recibos/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

export default recibosService;
