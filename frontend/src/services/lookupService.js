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
   * DELETE /api/lookup/:entidad/:id
   * Elimina un registro de lookup
   */
  delete: async (entidad, id) => {
    const response = await api.delete(`/lookup/${entidad}/${id}`);
    return response.data;
  },

  // ── Métodos específicos para planes v1.0 ──

  /**
   * Obtener tipos de plan
   */
  getTiposDePlan: async () => {
    try {
      const { data } = await api.get('/lookup/tipo_plan');
      return data.data || [];
    } catch (error) {
      console.error('Error loading tipos de plan:', error);
      return [];
    }
  },

  /**
   * Obtener cobradores
   */
  getCobradores: async () => {
    try {
      const { data } = await api.get('/lookup/cobrador');
      return data.data || [];
    } catch (error) {
      console.error('Error loading cobradores:', error);
      return [];
    }
  },

  /**
   * Obtener obras sociales
   */
  getObrasSociales: async () => {
    try {
      const { data } = await api.get('/lookup/obra_social');
      return data.data || [];
    } catch (error) {
      console.error('Error loading obras sociales:', error);
      return [];
    }
  },

  /**
   * Obtener tipos de grupo
   */
  getTiposDeGrupo: async () => {
    try {
      const { data } = await api.get('/lookup/tipo_grupo');
      return data.data || [];
    } catch (error) {
      console.error('Error loading tipos de grupo:', error);
      return [];
    }
  },

  /**
   * Cargar todos los lookups necesarios para planes en paralelo
   */
  loadAllLookupsForPlans: async () => {
    try {
      const [tiposDeplan, cobradores, obrasSociales, tiposDeGrupo] = await Promise.all([
        lookupService.getTiposDePlan(),
        lookupService.getCobradores(),
        lookupService.getObrasSociales(),
        lookupService.getTiposDeGrupo(),
      ]);

      return {
        tiposDeplan,
        cobradores,
        obrasSociales,
        tiposDeGrupo,
      };
    } catch (error) {
      console.error('Error loading all lookups:', error);
      return {
        tiposDeplan: [],
        cobradores: [],
        obrasSociales: [],
        tiposDeGrupo: [],
      };
    }
  },
};

export default lookupService;
