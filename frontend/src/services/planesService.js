import api from './api';

const planesService = {
  /**
   * GET /api/planes/filter/:filtro
   * Obtiene planes filtrados con paginación
   * @param {string} filtro - todos, tipo_plan, cobrador, os, estado
   * @param {object} params - { page, limit, sortBy, order, tipo_plan_numero, cobrador_numero, os_numero, estado }
   */
  getByFilter: async (filtro, params = {}) => {
    try {
      const { page = 1, limit = 15, sortBy, order, ...otherParams } = params;
      const queryParams = {
        page,
        limit,
        ...otherParams,
        ...(sortBy && { sortBy }),
        ...(order && { order }),
      };
      const response = await api.get(`/planes/filter/${filtro}`, { params: queryParams });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * GET /api/planes/count/:filtro
   * Preview: cuenta de planes a ser afectados por filtro
   * @param {string} filtro - tipo_plan, cobrador, os, estado
   * @param {object} params - parámetros de filtro
   */
  countByFilter: async (filtro, params = {}) => {
    try {
      const response = await api.get(`/planes/count/${filtro}`, { params });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        count: 0,
      };
    }
  },

  /**
   * PATCH /api/planes/bulk-update-cuota
   * Actualiza masivamente el valor_cuota
   * @param {object} data - { plan_numeros?, nuevo_valor, filtro?, tipo_plan_numero?, ... }
   */
  bulkUpdateCuota: async (data) => {
    try {
      const response = await api.patch('/planes/bulk-update-cuota', data);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        updated: 0,
        affectedPlanes: [],
      };
    }
  },

  /**
   * GET /api/planes/historial-cuota
   * Historial global de cambios de cuota
   * @param {number} planNumero - (opcional) filtra por plan específico
   */
  getHistorialCuota: async (planNumero = null) => {
    try {
      const params = planNumero ? { plan_numero: planNumero } : {};
      const response = await api.get('/planes/historial-cuota', { params });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: [],
      };
    }
  },

  /**
   * GET /api/planes?search=...&estado=ACTIVO&limit=10
   * Búsqueda de planes por número de afiliado o nombre del titular
   * @param {string} searchTerm - texto a buscar (afiliado o nombre)
   * @param {number} limit - máximo de resultados (default 10)
   */
  searchPlanes: async (searchTerm, limit = 10) => {
    try {
      const { data } = await api.get('/planes', {
        params: {
          search: searchTerm,
          estado: 'ACTIVO',
          limit: limit
        }
      });
      // Si el backend retorna { data: [...] }, extraer el array
      return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
      console.error('Error searching planes:', error);
      return [];
    }
  },

  /**
   * GET /api/planes/:id
   * Obtiene detalle completo de un plan
   * @param {number} planId - ID del plan
   */
  getPlanDetail: async (planId) => {
    try {
      const { data } = await api.get(`/planes/${planId}`);
      return data.data || data;
    } catch (error) {
      console.error('Error fetching plan detail:', error);
      return null;
    }
  },
};

export default planesService;
