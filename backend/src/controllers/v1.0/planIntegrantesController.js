const db = require('../../models');

// ── POST /api/v1.0/plan-integrantes ─────────────────────────────────────────
// Agregar un integrante a un plan

const crear = async (req, res) => {
  const { plan_numero, persona_id, rol, zona_id } = req.body;

  // Validar que no existe duplicado
  const existente = await db.PlanIntegrante.findOne({
    where: { plan_numero, persona_id },
  });

  if (existente) {
    return res.status(409).json({
      success: false,
      message: 'Este afiliado ya está asignado al plan',
    });
  }

  // Validar rol válido
  if (!['titular', 'adherente'].includes(rol)) {
    return res.status(400).json({
      success: false,
      message: 'Rol inválido. Debe ser "titular" o "adherente"',
    });
  }

  const integrante = await db.PlanIntegrante.create({
    plan_numero,
    persona_id,
    rol,
    zona_id: zona_id || null,
    credencial: 'T', // Default credencial
  });

  return res.status(201).json({
    success: true,
    data: integrante,
  });
};

// ── PUT /api/v1.0/plan-integrantes/:id ──────────────────────────────────────
// Actualizar rol de un integrante

const actualizar = async (req, res) => {
  const { id } = req.params;
  const { rol, zona_id } = req.body;

  const integrante = await db.PlanIntegrante.findByPk(id);

  if (!integrante) {
    return res.status(404).json({
      success: false,
      message: 'Integrante no encontrado',
    });
  }

  // Validar rol válido if provided
  if (rol && !['titular', 'adherente'].includes(rol)) {
    return res.status(400).json({
      success: false,
      message: 'Rol inválido. Debe ser "titular" o "adherente"',
    });
  }

  const updateData = {};
  if (rol) updateData.rol = rol;
  if (zona_id !== undefined) updateData.zona_id = zona_id || null;

  await integrante.update(updateData);

  return res.json({
    success: true,
    data: integrante,
  });
};

// ── DELETE /api/v1.0/plan-integrantes/:id ──────────────────────────────────
// Eliminar un integrante de un plan

const eliminar = async (req, res) => {
  const { id } = req.params;

  const integrante = await db.PlanIntegrante.findByPk(id);

  if (!integrante) {
    return res.status(404).json({
      success: false,
      message: 'Integrante no encontrado',
    });
  }

  await integrante.destroy();

  return res.json({
    success: true,
    message: 'Integrante eliminado correctamente',
  });
};

// ── GET /api/v1.0/plan-integrantes/plan/:planNumero ────────────────────────
// Obtener todos los integrantes de un plan

const obtenerPorPlan = async (req, res) => {
  const { planNumero } = req.params;

  const integrantes = await db.PlanIntegrante.findAll({
    where: { plan_numero: planNumero },
    include: [
      {
        model: db.Persona,
        attributes: ['id', 'nombre', 'apellido', 'numero_documento'],
      },
    ],
  });

  return res.json({
    success: true,
    data: integrantes,
  });
};

module.exports = { crear, actualizar, eliminar, obtenerPorPlan };
