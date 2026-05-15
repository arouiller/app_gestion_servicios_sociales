import api from './api';

const localidadService = {
  async getAll(provinciaId) {
    const params = provinciaId ? { provincia_id: provinciaId } : {};
    const { data } = await api.get('/localidades', { params });
    return data;
  },

  async getByProvincia(provinciaId) {
    const { data } = await api.get(`/localidades/by-provincia/${provinciaId}`);
    return data;
  },

  async create(data) {
    const response = await api.post('/localidades', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/localidades/${id}`, data);
    return response.data;
  },

  async getReferencias(id) {
    try {
      const response = await api.get(`/localidades/${id}/referencias`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referencias:', error);
      throw error;
    }
  },

  async delete(id, options = {}) {
    const { force = false } = options;
    const url = force ? `/localidades/${id}?force=true` : `/localidades/${id}`;
    const response = await api.delete(url);
    return response.data;
  }
};

export default localidadService;
