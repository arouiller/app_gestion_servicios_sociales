import api from './api';

const auditService = {
  listar: async (params = {}) => {
    const { data } = await api.get('/admin/auditoria', { params });
    return data.data; // { rows, count }
  },
};

export default auditService;
