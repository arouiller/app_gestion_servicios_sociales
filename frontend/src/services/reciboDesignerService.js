import { api } from './api';

export const reciboDesignerService = {
  getActiveTemplate: async () => {
    const response = await api.get('/admin/recibos/templates/active');
    return response.data;
  },

  getPlaceholders: async () => {
    const response = await api.get('/admin/recibos/placeholders');
    return response.data;
  },

  getVersions: async (templateGroupId) => {
    const response = await api.get('/admin/recibos/templates/versions', {
      params: { templateGroupId },
    });
    return response.data;
  },

  saveTemplate: async (templateData) => {
    const response = await api.post('/admin/recibos/templates/save', templateData);
    return response.data;
  },
};
