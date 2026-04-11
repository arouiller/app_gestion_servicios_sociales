import api from './api';

const afiliadosService = {
  /**
   * Retorna el perfil de afiliado del usuario autenticado.
   */
  me: async () => {
    const { data } = await api.get('/afiliados/me');
    return data.data;
  },

  /**
   * Listado paginado de afiliados (admin).
   * @param {object} params - { page, limit, estado, search }
   */
  listar: async (params = {}) => {
    const { data } = await api.get('/afiliados', { params });
    return data;
  },

  /**
   * Detalle de un afiliado por ID (admin).
   */
  obtener: async (id) => {
    const { data } = await api.get(`/afiliados/${id}`);
    return data.data;
  },

  /**
   * Crea un nuevo afiliado.
   */
  crear: async (payload) => {
    const { data } = await api.post('/afiliados', payload);
    return data;
  },

  /**
   * Actualiza los datos de un afiliado.
   */
  actualizar: async (id, payload) => {
    const { data } = await api.put(`/afiliados/${id}`, payload);
    return data;
  },

  /**
   * Elimina un afiliado (admin).
   */
  eliminar: async (id) => {
    const { data } = await api.delete(`/afiliados/${id}`);
    return data;
  },

  /**
   * Lista todos los grupos familiares con su titular (admin).
   */
  listarGrupos: async () => {
    const { data } = await api.get('/grupos-familiares');
    return data.data;
  },

  /**
   * Detalle de un grupo familiar con todos sus miembros (admin).
   */
  obtenerGrupo: async (id) => {
    const { data } = await api.get(`/grupos-familiares/${id}`);
    return data.data;
  },

  /**
   * Actualiza nombre o estado de un grupo familiar (admin).
   */
  actualizarGrupo: async (id, payload) => {
    const { data } = await api.put(`/grupos-familiares/${id}`, payload);
    return data;
  },

  /**
   * Desvincula un beneficiario de su grupo (admin).
   * El beneficiario pasa a ser titular de un nuevo grupo creado automáticamente.
   */
  desvincularBeneficiario: async (grupoId, afiliadoId) => {
    const { data } = await api.post(`/grupos-familiares/${grupoId}/desvincular/${afiliadoId}`);
    return data;
  },

  /**
   * Historial de membresía de un grupo familiar.
   * Accesible a cualquier usuario autenticado.
   */
  obtenerHistorialGrupo: async (grupoId) => {
    const { data } = await api.get(`/grupos-familiares/${grupoId}/historial`);
    return data.data;
  },
};

export default afiliadosService;
