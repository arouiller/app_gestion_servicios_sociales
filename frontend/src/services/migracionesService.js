import api from './api';

const migracionesService = {
  /**
   * Retorna la versión actual de la BD y el conteo de registros por tabla.
   */
  getStats: async () => {
    const { data } = await api.get('/migrations/stats');
    return data.data;
  },

  /**
   * Retorna todas las versiones disponibles con su estado (aplicada/pendiente).
   */
  list: async () => {
    const { data } = await api.get('/migrations');
    return data.data;
  },

  /**
   * Retorna el historial completo de eventos de migración.
   */
  getHistory: async () => {
    const { data } = await api.get('/migrations/history');
    return data.data;
  },

  /**
   * Aplica la siguiente migración pendiente.
   */
  upgrade: async () => {
    const { data } = await api.post('/migrations/up');
    return data;
  },

  /**
   * Revierte la última migración aplicada.
   */
  downgrade: async () => {
    const { data } = await api.post('/migrations/down');
    return data;
  },

  /**
   * Re-ejecuta la migración de la versión actual (downgrade + upgrade en una transacción).
   */
  reapply: async () => {
    const { data } = await api.post('/migrations/reapply');
    return data;
  },
};

export default migracionesService;
