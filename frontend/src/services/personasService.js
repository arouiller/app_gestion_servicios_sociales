import api from './api';

const personasService = {
  // GET buscar personas
  search: async (searchText) => {
    const response = await api.get('/personas', { params: { search: searchText } });
    return response.data;
  },
};

export default personasService;
