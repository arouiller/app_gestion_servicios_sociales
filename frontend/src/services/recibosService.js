import api from './api';

const recibosService = {
  /**
   * POST /api/recibos/generar
   * Genera recibos para un período
   * @param {object} data - { periodo: "2026-04-01", planes: [], force?: boolean }
   *
   * Posibles respuestas:
   * - 201 (éxito): { success: true, recibos: [...], mensaje: "..." }
   * - 409 (período existe): { success: false, existe: true, cantidad: X, mensaje: "..." }
   * - Otros errores: error en response.data
   */
  generar: async (data) => {
    try {
      const response = await api.post('/recibos/generar', data);
      return response.data;
    } catch (error) {
      // Manejar 409 como respuesta válida (período ya existe)
      if (error.response?.status === 409) {
        return error.response.data;
      }

      // Otros errores
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

  /**
   * GET /api/recibos?plan_numero=X
   * Lista recibos de un plan específico
   */
  listByPlanNumero: async (planNumero) => {
    try {
      const response = await api.get('/recibos', { params: { plan_numero: planNumero } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recibos for plan:', error);
      return [];
    }
  },
};

export default recibosService;
