import axios from 'axios';

const API_URL = '/api/admin';

const provinciaService = {
  async getAll() {
    const response = await axios.get(`${API_URL}/provincias`);
    return response.data;
  },

  async create(data) {
    const response = await axios.post(`${API_URL}/provincias`, data);
    return response.data;
  },

  async update(id, data) {
    const response = await axios.put(`${API_URL}/provincias/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_URL}/provincias/${id}`);
    return response.data;
  }
};

export default provinciaService;
