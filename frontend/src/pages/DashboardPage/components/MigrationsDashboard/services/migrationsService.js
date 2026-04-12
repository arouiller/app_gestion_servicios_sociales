import api from '../../../../../services/api';

const BASE_URL = '/api/migrations';

export const migrationsAPI = {
  /**
   * GET /api/migrations/list
   * Returns: { success, data: { versions, currentVersion } }
   */
  list: async () => {
    const response = await api.get(`${BASE_URL}/list`);
    return response.data;
  },

  /**
   * GET /api/migrations/history
   * Returns: { success, data: { history } }
   */
  history: async () => {
    const response = await api.get(`${BASE_URL}/history`);
    return response.data;
  },

  /**
   * GET /api/migrations/stats
   * Returns: { success, data: { currentVersion, tables, timestamp } }
   */
  stats: async () => {
    const response = await api.get(`${BASE_URL}/stats`);
    return response.data;
  },

  /**
   * GET /api/migrations/preview/:version/:direction
   * direction: "upgrade" | "downgrade"
   * Returns: { success, data: { version, direction, sql, description, nextVersion } }
   */
  preview: async (version, direction) => {
    const response = await api.get(`${BASE_URL}/preview/${version}/${direction}`);
    return response.data;
  },

  /**
   * POST /api/migrations/execute/:version/:direction
   * direction: "upgrade" | "downgrade"
   * Returns: { success, message, data: { version, description, direction, durationMs } }
   */
  execute: async (version, direction) => {
    const response = await api.post(`${BASE_URL}/execute/${version}/${direction}`);
    return response.data;
  },
};

export default migrationsAPI;
