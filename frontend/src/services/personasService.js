import api from './api';

const personasService = {
  // Buscar personas por nombre, apellido, dni
  // Acepta un string de búsqueda o un objeto con los criterios
  buscar: async (params = {}) => {
    try {
      let queryParams = {};

      // Si es un string, usar directamente
      if (typeof params === 'string') {
        queryParams = { search: params };
      } else {
        // Si es un objeto, combinar los criterios en un solo parámetro 'search'
        const criterios = [params.nombre, params.apellido, params.numero_documento]
          .filter(v => v && v.trim())
          .join(' ');

        if (criterios) {
          queryParams = { search: criterios };
        } else {
          return []; // Sin criterios, retornar array vacío
        }
      }

      const response = await api.get('/personas', { params: queryParams });

      // El backend retorna directamente un array, no un objeto con propiedad 'data'
      // Si la respuesta es un array, retornarlo directamente
      // Si es un objeto con 'data', retornar response.data.data (la estructura envuelta)
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      console.error('Error en buscar personas:', error);
      throw error;
    }
  },

  // Crear persona
  crear: async (payload) => {
    const { data } = await api.post('/personas', payload);
    return data.data;
  },

  // Actualizar persona
  actualizar: async (personaId, payload) => {
    const { data } = await api.put(`/personas/${personaId}`, payload);
    return data.data;
  },
};

export default personasService;
