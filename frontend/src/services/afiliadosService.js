import api from './api';

const afiliadosService = {
  listar: async (params = {}) => {
    const { data } = await api.get('/afiliados', { params });
    return data;
  },

  obtener: async (id) => {
    const { data } = await api.get(`/afiliados/${id}`);
    return data.data;
  },

  crear: async (payload) => {
    const { data } = await api.post('/afiliados', payload);
    return data;
  },

  actualizar: async (id, payload) => {
    const { data } = await api.put(`/afiliados/${id}`, payload);
    return data;
  },

  eliminar: async (id) => {
    const { data } = await api.delete(`/afiliados/${id}`);
    return data;
  },

  listarGrupos: async () => {
    const { data } = await api.get('/grupos-familiares');
    return data.data;
  },

  obtenerGrupo: async (id) => {
    const { data } = await api.get(`/grupos-familiares/${id}`);
    return data.data;
  },

  actualizarGrupo: async (id, payload) => {
    const { data } = await api.put(`/grupos-familiares/${id}`, payload);
    return data;
  },

  desvincularBeneficiario: async (grupoId, afiliadoId) => {
    const { data } = await api.post(`/grupos-familiares/${grupoId}/desvincular/${afiliadoId}`);
    return data;
  },

  obtenerHistorialGrupo: async (grupoId) => {
    const { data } = await api.get(`/grupos-familiares/${grupoId}/historial`);
    return data.data;
  },
};

export default afiliadosService;
