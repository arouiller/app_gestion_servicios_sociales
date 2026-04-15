import api from './api';

/**
 * Service para API de migraciones de base de datos
 * Endpoints protegidos por requireAdmin middleware
 */
const migrationsAPI = {
  /**
   * GET /api/migrations/list
   * Retorna lista de versiones disponibles y versión actual
   */
  list: async () => {
    const { data } = await api.get('/migrations/list');
    return data;
  },

  /**
   * GET /api/migrations/history
   * Retorna historial completo de migraciones ejecutadas
   */
  history: async () => {
    const { data } = await api.get('/migrations/history');
    return data;
  },

  /**
   * GET /api/migrations/stats
   * Retorna estadísticas de la base de datos (versión actual y conteos de tablas)
   */
  stats: async () => {
    const { data } = await api.get('/migrations/stats');
    return data;
  },

  /**
   * GET /api/migrations/preview/:version/:direction
   * Retorna preview del SQL sin ejecutar
   * @param {string} version - Versión destino (ej: "1.0.2")
   * @param {string} direction - "upgrade" o "downgrade"
   */
  preview: async (version, direction) => {
    const { data } = await api.get(`/migrations/preview/${version}/${direction}`);
    return data;
  },

  /**
   * POST /api/migrations/execute
   * Ejecuta la migración en transacción
   * @param {string} direction - "upgrade" o "downgrade"
   */
  execute: async (direction) => {
    const { data } = await api.post('/migrations/execute', { direction });
    return data;
  },
};

export default migrationsAPI;
