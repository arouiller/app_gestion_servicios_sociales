import api from './api';

const queryExecService = {
  executeQuery: async (query) => {
    const { data } = await api.post('/admin/query-exec', { query });
    return data;
  },
};

export default queryExecService;
