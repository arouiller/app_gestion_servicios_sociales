import api from './api';

/**
 * Service para API de templates de recibos
 * Todos los endpoints bajo /api/admin/recibos/templates
 */
const templateService = {
  /**
   * GET /api/admin/recibos/templates
   * Listar todos los templates
   */
  getTemplates: async () => {
    try {
      const response = await api.get('/admin/recibos/templates');
      return {
        success: response.data.success,
        data: response.data.data,
        count: response.data.count
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: []
      };
    }
  },

  /**
   * GET /api/admin/recibos/templates/:id
   * Obtener template específico
   */
  getTemplate: async (id) => {
    try {
      const response = await api.get(`/admin/recibos/templates/${id}`);
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * POST /api/admin/recibos/templates
   * Crear nuevo template
   */
  createTemplate: async (data) => {
    try {
      const response = await api.post('/admin/recibos/templates', data);
      return {
        success: response.data.success,
        templateId: response.data.templateId,
        message: response.data.message,
        warning: response.data.warning
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * PUT /api/admin/recibos/templates/:id
   * Actualizar template existente
   */
  updateTemplate: async (id, data) => {
    try {
      const response = await api.put(`/admin/recibos/templates/${id}`, data);
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * PATCH /api/admin/recibos/templates/:id/activar
   * Activar template (desactivar anterior)
   */
  activateTemplate: async (id) => {
    try {
      const response = await api.patch(`/admin/recibos/templates/${id}/activar`);
      return {
        success: response.data.success,
        message: response.data.message,
        activo: response.data.activo
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * DELETE /api/admin/recibos/templates/:id
   * Eliminar template
   */
  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(`/admin/recibos/templates/${id}`);
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * POST /api/admin/recibos/templates/:id/duplicar
   * Duplicar template
   */
  duplicateTemplate: async (id, nombreCopia = null) => {
    try {
      const data = nombreCopia ? { nombre_copia: nombreCopia } : {};
      const response = await api.post(`/admin/recibos/templates/${id}/duplicar`, data);
      return {
        success: response.data.success,
        templateId: response.data.templateId,
        nombre: response.data.nombre
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * GET /api/admin/recibos/placeholders
   * Listar todos los placeholders disponibles categorizados
   */
  getPlaceholders: async () => {
    try {
      const response = await api.get('/admin/recibos/placeholders');
      return {
        success: response.data.success,
        placeholders: response.data.placeholders
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        placeholders: {}
      };
    }
  },

  /**
   * POST /api/admin/recibos/templates/:templateId/generar-pdf
   * Generar PDF con datos de persona o ficticios
   * Retorna binario (blob)
   */
  generatePdf: async (templateId, personaId = null, usarDatosFicticios = false) => {
    try {
      const data = {};
      if (personaId && !usarDatosFicticios) {
        data.persona_id = personaId;
      } else {
        data.usar_datos_ficticios = true;
      }

      const response = await api.post(
        `/admin/recibos/templates/${templateId}/generar-pdf`,
        data,
        { responseType: 'blob' }
      );

      return {
        success: true,
        blob: response.data,
        contentType: response.headers['content-type']
      };
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retry_after;
        return {
          success: false,
          message: `Demasiadas solicitudes. Intenta en ${retryAfter} segundos.`,
          retryAfter
        };
      }
      if (error.response?.status === 503) {
        return {
          success: false,
          message: 'Funcionalidad de PDF no disponible en este servidor',
          unavailable: true
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }
};

export default templateService;
