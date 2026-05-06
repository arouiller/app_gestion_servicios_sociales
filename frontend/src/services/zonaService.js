import api from './api';

const zonaService = {
  async getAll(provinciaId) {
    const params = provinciaId ? { provincia_id: provinciaId } : {};
    const { data } = await api.get('/admin/zonas', { params });
    return data;
  },

  async getByProvincia(provinciaId) {
    const { data } = await api.get(`/admin/provincias/${provinciaId}/zonas`);
    return data;
  },

  async create(data) {
    const response = await api.post('/admin/zonas', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/admin/zonas/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/admin/zonas/${id}`);
    return response.data;
  }
};

export default zonaService;
