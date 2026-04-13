const db = require('../../models');

// ── GET /api/v1.0/servicios-adicionales ─────────────────────────────────────────
// Obtener lista de servicios disponibles

const listarServicios = async (req, res, next) => {
  try {
    const servicios = await db.Servicio.findAll({
      attributes: ['servicio_numero', 'servicio_nombre'],
      order: [['servicio_nombre', 'ASC']],
    });

    return res.json({ success: true, data: servicios });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1.0/integrante/:planIntegranteId/servicios ──────────────────────
// Obtener servicios de un integrante específico

const obtenerServiciosIntegrante = async (req, res, next) => {
  try {
    const { planIntegranteId } = req.params;

    // Validar que el ID sea numérico
    const id = parseInt(planIntegranteId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID de integrante inválido' });
    }

    // Obtener los servicios del integrante
    const servicios = await db.IntegranteServicio.findAll({
      where: { plan_integrante_id: id },
      include: [
        { model: db.Servicio, attributes: ['servicio_numero', 'servicio_nombre'] },
      ],
      attributes: ['id', 'plan_integrante_id', 'servicio_numero', 'fecha_asignacion'],
    });

    return res.json({ success: true, data: servicios });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1.0/integrante/:planIntegranteId/servicios (admin) ────────────
// Agregar un servicio a un integrante

const agregarServicio = async (req, res, next) => {
  try {
    const { planIntegranteId } = req.params;
    const { servicio_numero } = req.body;

    // Validar que el ID sea numérico
    const id = parseInt(planIntegranteId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID de integrante inválido' });
    }

    // Verificar que el integrante existe
    const integrante = await db.PlanIntegrante.findByPk(id);
    if (!integrante) {
      return res.status(404).json({ success: false, message: 'Integrante no encontrado' });
    }

    // Verificar que el servicio existe
    const servicio = await db.Servicio.findByPk(servicio_numero);
    if (!servicio) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    // Verificar que el servicio no esté ya asignado
    const existente = await db.IntegranteServicio.findOne({
      where: { plan_integrante_id: id, servicio_numero },
    });
    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Este servicio ya está asignado al integrante',
      });
    }

    // Crear el servicio para el integrante
    const integranteServicio = await db.IntegranteServicio.create({
      plan_integrante_id: id,
      servicio_numero,
      fecha_asignacion: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Servicio asignado exitosamente',
      data: integranteServicio,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/v1.0/integrante/:planIntegranteId/servicios/:servicioNumero (admin) ──
// Eliminar un servicio de un integrante

const eliminarServicio = async (req, res, next) => {
  try {
    const { planIntegranteId, servicioNumero } = req.params;

    // Validar que los IDs sean numéricos
    const integranteId = parseInt(planIntegranteId, 10);
    const servicio = parseInt(servicioNumero, 10);

    if (isNaN(integranteId) || isNaN(servicio)) {
      return res.status(400).json({ success: false, message: 'IDs inválidos' });
    }

    // Buscar y eliminar el servicio
    const integranteServicio = await db.IntegranteServicio.findOne({
      where: { plan_integrante_id: integranteId, servicio_numero: servicio },
    });

    if (!integranteServicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado para este integrante',
      });
    }

    await integranteServicio.destroy();

    return res.json({ success: true, message: 'Servicio eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarServicios,
  obtenerServiciosIntegrante,
  agregarServicio,
  eliminarServicio,
};
