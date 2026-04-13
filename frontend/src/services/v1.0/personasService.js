import api from '../api';

export const personasService = {
  /**
   * GET /api/personas?search=texto
   * Busca personas por apellido, nombre o número de documento
   */
  search: async (searchText) => {
    const response = await api.get('/personas', {
      params: { search: searchText },
    });
    return response.data;
  },
};

export default personasService;
