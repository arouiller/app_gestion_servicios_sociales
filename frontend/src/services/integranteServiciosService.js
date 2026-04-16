import api from './api';

const integranteServiciosService = {
  // GET /api/v1.0/servicios-adicionales - List all available services
  async listarServicios() {
    try {
      const response = await api.get('/v1.0/servicios-adicionales');
      return response.data.data || [];
    } catch (error) {
      console.error('Error listing services:', error);
      throw error;
    }
  },

  // GET /api/v1.0/integrante/:planIntegranteId/servicios - Get services for an integrante
  async obtenerServiciosIntegrante(planIntegranteId) {
    try {
      const response = await api.get(`/v1.0/integrante/${planIntegranteId}/servicios`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching integrante services:', error);
      throw error;
    }
  },

  // POST /api/v1.0/integrante/:planIntegranteId/servicios - Add service to integrante
  async agregarServicio(planIntegranteId, servicioNumero) {
    try {
      const response = await api.post(`/v1.0/integrante/${planIntegranteId}/servicios`, {
        servicio_numero: servicioNumero,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  },

  // DELETE /api/v1.0/integrante/:planIntegranteId/servicios/:servicioNumero - Remove service
  async eliminarServicio(planIntegranteId, servicioNumero) {
    try {
      const response = await api.delete(`/v1.0/integrante/${planIntegranteId}/servicios/${servicioNumero}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },
};

export default integranteServiciosService;
