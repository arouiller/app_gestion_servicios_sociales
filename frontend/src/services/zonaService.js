import axios from 'axios';

const API_URL = '/api/admin';

const zonaService = {
  async getAll(provinciaId) {
    const params = provinciaId ? { provincia_id: provinciaId } : {};
    const response = await axios.get(`${API_URL}/zonas`, { params });
    return response.data;
  },

  async getByProvincia(provinciaId) {
    const response = await axios.get(`${API_URL}/provincias/${provinciaId}/zonas`);
    return response.data;
  },

  async create(data) {
    const response = await axios.post(`${API_URL}/zonas`, data);
    return response.data;
  },

  async update(id, data) {
    const response = await axios.put(`${API_URL}/zonas/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_URL}/zonas/${id}`);
    return response.data;
  }
};

export default zonaService;
