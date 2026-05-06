import api from './api';

const listadosService = {
  getPorZona: async (zonaId, search = '', page = 1, limit = 10) => {
    const { data } = await api.get(`/v1.0/listados/por-zona/${zonaId}`, {
      params: { search, page, limit },
    });
    return data;
  },
};

export default listadosService;
