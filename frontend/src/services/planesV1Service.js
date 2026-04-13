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
};

export default planesV1Service;
