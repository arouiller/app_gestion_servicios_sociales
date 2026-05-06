const db = require('../../models');

// ── POST /api/v1.0/plan-integrantes ─────────────────────────────────────────
// Agregar un integrante a un plan

const crear = async (req, res) => {
  const { plan_numero, persona_id, rol } = req.body;

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
    credencial: 'T', // Default credencial
  });

  return res.status(201).json({
    success: true,
    data: integrante,
  });
};

// ── PUT /api/v1.0/plan-integrantes/:id ──────────────────────────────────────
// Actualizar integrante

const actualizar = async (req, res) => {
  const { id } = req.params;
  const { orden } = req.body;

  const integrante = await db.PlanIntegrante.findByPk(id);

  if (!integrante) {
    return res.status(404).json({
      success: false,
      message: 'Integrante no encontrado',
    });
  }

  const updateData = {};
  if (orden !== undefined) updateData.orden = orden;

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

// ── POST /api/v1.0/plan-integrantes/reorder ────────────────────────────────
// Reordenar integrantes de un plan

const reorder = async (req, res) => {
  const { planNumero, integrantes } = req.body;

  if (!planNumero || !Array.isArray(integrantes)) {
    return res.status(400).json({
      success: false,
      message: 'planNumero e integrantes array son requeridos',
    });
  }

  const transaction = await db.sequelize.transaction();

  try {
    // Actualizar orden y rol basado en posición para cada integrante
    for (let index = 0; index < integrantes.length; index++) {
      const integrante = integrantes[index];
      const rol = index === 0 ? 'titular' : 'adherente'; // Primero = titular, resto = adherente

      await db.PlanIntegrante.update(
        {
          orden: integrante.orden,
          rol,
        },
        {
          where: { id: integrante.id, plan_numero: planNumero },
          transaction,
        }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Integrantes reordenados exitosamente',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error reordering integrantes:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { crear, actualizar, eliminar, obtenerPorPlan, reorder };
