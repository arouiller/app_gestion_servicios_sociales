import api from '../api';

export const recibosService = {
  /**
   * POST /api/recibos/generar
   * Genera recibos para un período
   */
  generar: async (periodo, planes = []) => {
    const response = await api.post('/recibos/generar', {
      periodo,
      planes,
    });
    return response.data;
  },

  /**
   * GET /api/recibos?periodo=YYYY-MM-DD
   * Lista recibos de un período
   */
  list: async (periodo) => {
    const response = await api.get('/recibos', {
      params: { periodo },
    });
    return response.data;
  },

  /**
   * GET /api/recibos/:id
   * Detalle de un recibo
   */
  getById: async (id) => {
    const response = await api.get(`/recibos/${id}`);
    return response.data;
  },
};

export default recibosService;
