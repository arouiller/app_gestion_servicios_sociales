import api from './api';

const provinciaService = {
  async getAll() {
    const { data } = await api.get('/admin/provincias');
    return data;
  },

  async create(data) {
    const response = await api.post('/admin/provincias', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/admin/provincias/${id}`, data);
    return response.data;
  },

  async getReferencias(id) {
    try {
      const response = await api.get(`/admin/provincias/${id}/referencias`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referencias:', error);
      throw error;
    }
  },

  async delete(id, options = {}) {
    const { force = false } = options;
    const url = force ? `/admin/provincias/${id}?force=true` : `/admin/provincias/${id}`;
    const response = await api.delete(url);
    return response.data;
  }
};

export default provinciaService;
