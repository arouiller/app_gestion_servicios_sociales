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

  async delete(id) {
    const response = await api.delete(`/admin/localidades/${id}`);
    return response.data;
  }
};

export default localidadService;
