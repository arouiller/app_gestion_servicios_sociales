import api from './api';

const planesV1Service = {
  // Listar todos los planes
  listar: async (params = {}) => {
    const { data } = await api.get('/v1.0/planes', { params });
    return data.data;
  },

  // Obtener un plan con afiliados y recibos
  obtener: async (planNumero) => {
    const { data } = await api.get(`/v1.0/planes/${planNumero}`);
    return data.data;
  },

  // Crear nuevo plan
  crear: async (payload) => {
    const { data } = await api.post('/v1.0/planes', payload);
    return data.data;
  },

  // Crear plan + personas + integrantes en una única transacción
  crearCompleto: async (payload) => {
    const { data } = await api.post('/v1.0/planes/crear-completo', payload);
    return data.data;
  },

  // Actualizar plan + sincronizar integrantes + reordenar en una única transacción
  actualizarCompleto: async (planNumero, payload) => {
    const { data } = await api.post(`/v1.0/planes/actualizar-completo/${planNumero}`, payload);
    return data.data;
  },

  // Actualizar plan
  actualizar: async (planNumero, payload) => {
    const { data } = await api.put(`/v1.0/planes/${planNumero}`, payload);
    return data.data;
  },

  // Obtener número de afiliado máximo y sugerido
  getMaxAfiliadoNumber: async () => {
    const { data } = await api.get('/v1.0/planes/numero-afiliado/max');
    return data.data;
  },

  // Suspender plan (cambiar a SUSPENDIDO)
  suspender: async (planNumero) => {
    return planesV1Service.actualizar(planNumero, { estado: 'SUSPENDIDO' });
  },

  // Eliminar plan permanentemente con cascada
  deletePermanently: async (planNumero) => {
    const { data } = await api.delete(`/v1.0/planes/${planNumero}`);
    return data.data;
  },

  // Obtener historial de cambios de cuota
  obtenerHistorialCuota: async (planNumero) => {
    const { data } = await api.get(`/v1.0/planes/${planNumero}/historial-cuota`);
    return data.data;
  },

  // Obtener planes de una persona (por persona ID)
  getByPersona: async (personaId) => {
    const { data } = await api.get(`/v1.0/planes/por-persona/${personaId}`);
    return data.data;
  },
};

export default planesV1Service;
