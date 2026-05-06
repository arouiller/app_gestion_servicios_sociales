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

  async delete(id) {
    const response = await api.delete(`/admin/provincias/${id}`);
    return response.data;
  }
};

export default provinciaService;
