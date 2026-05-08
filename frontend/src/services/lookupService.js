import api from './api';

const lookupService = {
  /**
   * GET /api/lookup/:entidad
   * Obtiene la lista de registros para una entidad de lookup con paginación
   * @param {string} entidad - Nombre de la entidad
   * @param {object} options - { page, limit, sortBy, order } parámetros de paginación y ordenamiento
   */
  list: async (entidad, options = {}) => {
    const { page = 1, limit = 15, sortBy, order } = options;
    const params = {
      page,
      limit,
    };
    if (sortBy) params.sortBy = sortBy;
    if (order) params.order = order;
    const response = await api.get(`/lookup/${entidad}`, { params });
    return response.data;
  },

  /**
   * Alias para list() - mismo comportamiento
   */
  getByEntity: async (entidad) => {
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
   * GET /api/lookup/:entidad/:id/referencias
   * Obtiene cantidad de referencias a un registro sin intentar eliminarlo
   */
  getReferencias: async (entidad, id) => {
    try {
      const response = await api.get(`/lookup/${entidad}/${id}/referencias`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referencias:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/lookup/:entidad/:id
   * Elimina un registro de lookup
   *
   * Parámetros opcionales:
   * - force: boolean (default: false) - si true, ejecuta eliminación en cascada
   */
  delete: async (entidad, id, options = {}) => {
    const { force = false } = options;
    const url = force ? `/lookup/${entidad}/${id}?force=true` : `/lookup/${entidad}/${id}`;
    const response = await api.delete(url);
    return response.data;
  },

  // ── Métodos específicos para planes v1.0 ──

  /**
   * Obtener tipos de plan
   * Soporta ambos formatos: array directo (legacy) o { success, data, ... } (paginado)
   */
  getTiposDePlan: async () => {
    try {
      const response = await api.get('/lookup/tipos-de-plan');
      // Si es array directo (legacy), retornarlo
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Si es estructura paginada, extraer array del campo data
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading tipos de plan:', error);
      return [];
    }
  },

  /**
   * Obtener cobradores
   * Soporta ambos formatos: array directo (legacy) o { success, data, ... } (paginado)
   */
  getCobradores: async () => {
    try {
      const response = await api.get('/lookup/cobradores');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading cobradores:', error);
      return [];
    }
  },

  /**
   * Obtener obras sociales
   * Soporta ambos formatos: array directo (legacy) o { success, data, ... } (paginado)
   */
  getObrasSociales: async () => {
    try {
      const response = await api.get('/lookup/obras-sociales');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading obras sociales:', error);
      return [];
    }
  },

  /**
   * Obtener tipos de grupo
   * Soporta ambos formatos: array directo (legacy) o { success, data, ... } (paginado)
   */
  getTiposDeGrupo: async () => {
    try {
      const response = await api.get('/lookup/tipos-de-grupo');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading tipos de grupo:', error);
      return [];
    }
  },

  /**
   * Obtener zonas
   * Soporta ambos formatos: array directo (legacy) o { success, data, ... } (paginado)
   */
  getZonas: async () => {
    try {
      const response = await api.get('/lookup/zonas');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading zonas:', error);
      return [];
    }
  },

  /**
   * Cargar todos los lookups necesarios para planes en paralelo
   */
  loadAllLookupsForPlans: async () => {
    try {
      const [tiposDeplan, cobradores, obrasSociales, tiposDeGrupo, zonas] = await Promise.all([
        lookupService.getTiposDePlan(),
        lookupService.getCobradores(),
        lookupService.getObrasSociales(),
        lookupService.getTiposDeGrupo(),
        lookupService.getZonas(),
      ]);

      return {
        tiposDeplan,
        cobradores,
        obrasSociales,
        tiposDeGrupo,
        zonas,
      };
    } catch (error) {
      console.error('Error loading all lookups:', error);
      return {
        tiposDeplan: [],
        cobradores: [],
        obrasSociales: [],
        tiposDeGrupo: [],
        zonas: [],
      };
    }
  },
};

export default lookupService;
