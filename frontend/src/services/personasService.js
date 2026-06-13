import api from './api';

const personasService = {
  /**
   * Buscar Personas por nombre/apellido
   * GET /api/personas?search=searchTerm
   */
  searchPersonas: async (searchTerm) => {
    try {
      const response = await api.get('/personas', {
        params: { search: searchTerm }
      });
      return {
        success: response.data.success,
        data: response.data.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: []
      };
    }
  },

  /**
   * Obtener Persona completa con todos sus datos
   * GET /api/personas/:id
   */
  getPersona: async (id) => {
    try {
      const response = await api.get(`/personas/${id}`);
      return {
        success: response.data.success,
        data: response.data.data || null
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: null
      };
    }
  }
};

export default personasService;
