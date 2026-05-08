import api from './api';

const localidadService = {
  async getAll(provinciaId) {
    const params = provinciaId ? { provincia_id: provinciaId } : {};
    const { data } = await api.get('/admin/localidades', { params });
    return data;
  },

  async getByProvincia(provinciaId) {
    const { data } = await api.get(`/admin/provincias/${provinciaId}/localidades`);
    return data;
  },

  async create(data) {
    const response = await api.post('/admin/localidades', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/admin/localidades/${id}`, data);
    return response.data;
  },

  async getReferencias(id) {
    try {
      const response = await api.get(`/admin/localidades/${id}/referencias`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referencias:', error);
      throw error;
    }
  },

  async delete(id, options = {}) {
    const { force = false } = options;
    const url = force ? `/admin/localidades/${id}?force=true` : `/admin/localidades/${id}`;
    const response = await api.delete(url);
    return response.data;
  }
};

export default localidadService;
