import api from './api';

const configService = {
  getConfiguracion: async () => {
    const { data } = await api.get('/admin/configuracion');
    return data.data;
  },

  actualizarConfiguracion: async (tipo, duracion_ms) => {
    const { data } = await api.put(`/admin/configuracion/${tipo}`, { duracion_ms });
    return data.data;
  },
};

export default configService;
