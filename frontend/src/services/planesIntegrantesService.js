import api from './api';

const planesIntegrantesService = {
  // Obtener todos los integrantes de un plan
  obtenerPorPlan: async (planNumero) => {
    const { data } = await api.get(`/v1.0/plan-integrantes/plan/${planNumero}`);
    return data.data;
  },

  // Agregar un integrante a un plan
  crear: async (payload) => {
    const { data } = await api.post('/v1.0/plan-integrantes', payload);
    return data.data;
  },

  // Actualizar rol de un integrante
  actualizar: async (integranteId, payload) => {
    const { data } = await api.put(`/v1.0/plan-integrantes/${integranteId}`, payload);
    return data.data;
  },

  // Eliminar un integrante de un plan
  eliminar: async (integranteId) => {
    const { data } = await api.delete(`/v1.0/plan-integrantes/${integranteId}`);
    return data;
  },

  // Crear múltiples integrantes de una vez
  crearMultiples: async (planNumero, integrantes) => {
    try {
      const results = await Promise.all(
        integrantes.map((integrante) =>
          planesIntegrantesService.crear({
            plan_numero: planNumero,
            persona_id: integrante.persona_id,
            rol: integrante.rol,
            zona_id: integrante.zona_id || null,
          })
        )
      );
      return results;
    } catch (error) {
      console.error('Error creating multiple integrantes:', error);
      throw error;
    }
  },
};

export default planesIntegrantesService;
