const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const db = require('../../models');

// ── GET /api/v1.0/planes ───────────────────────────────────────────────────────
// Listar planes con filtros opcionales (estado, cobrador, obraSocial, tipoGrupo)

const listar = async (req, res) => {
  const { estado, cobrador_numero, os_numero, tipo_de_grupo_numero } = req.query;
  const where = {};

  if (estado) where.estado = estado;
  if (cobrador_numero) where.cobrador_numero = cobrador_numero;
  if (os_numero) where.os_numero = os_numero;
  if (tipo_de_grupo_numero) where.tipo_de_grupo_numero = tipo_de_grupo_numero;

  const planes = await db.PlanV1.findAll({
    where,
    include: [
      { model: db.TipoDePlan, attributes: ['tipo_plan_numero', 'tipo_plan_nombre'] },
      { model: db.Cobrador, attributes: ['cobrador_numero', 'cobrador_apellido', 'cobrador_nombre'] },
      { model: db.TipoDeGrupo, attributes: ['tipo_de_grupo_numero', 'tipo_de_grupo_nombre'] },
      { model: db.ObraSocial, attributes: ['os_numero', 'os_nombre'] },
    ],
    order: [['plan_numero', 'DESC']],
  });

  return res.json({ success: true, data: planes });
};

// ── GET /api/v1.0/planes/por-persona/:personaId ────────────────────────────────
// Obtener todos los planes en los que una persona es integrante

const getByPersona = async (req, res) => {
  const { personaId } = req.params;

  const planes = await db.PlanV1.findAll({
    include: [
      {
        model: db.PlanIntegrante,
        where: { persona_id: personaId },
        include: [
          { model: db.Persona, attributes: ['id', 'apellido', 'nombre'] },
        ],
      },
      { model: db.TipoDePlan, attributes: ['tipo_plan_numero', 'tipo_plan_nombre'] },
      { model: db.Cobrador, attributes: ['cobrador_numero', 'cobrador_apellido', 'cobrador_nombre'] },
      { model: db.ObraSocial, attributes: ['os_numero', 'os_nombre'] },
    ],
  });

  return res.json({ success: true, data: planes });
};

// ── GET /api/v1.0/planes/:planNumero ────────────────────────────────────────────

const obtener = async (req, res) => {
  const { planNumero } = req.params;

  const plan = await db.PlanV1.findByPk(planNumero, {
    include: [
      {
        model: db.PlanIntegrante,
        include: [{ model: db.Persona, attributes: ['id', 'apellido', 'nombre'] }],
      },
      { model: db.TipoDePlan, attributes: ['tipo_plan_numero', 'tipo_plan_nombre'] },
      { model: db.Cobrador, attributes: ['cobrador_numero', 'cobrador_apellido', 'cobrador_nombre'] },
      { model: db.TipoDeGrupo, attributes: ['tipo_de_grupo_numero', 'tipo_de_grupo_nombre'] },
      { model: db.ObraSocial, attributes: ['os_numero', 'os_nombre'] },
      {
        model: db.Recibo,
        attributes: ['id', 'periodo', 'valor_cuota', 'fecha_emision'],
        order: [['fecha_emision', 'DESC']],
      },
    ],
  });

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan no encontrado' });
  }

  return res.json({ success: true, data: plan });
};

// ── POST /api/v1.0/planes (admin) ────────────────────────────────────────────────
// Crear un nuevo plan

const crear = async (req, res) => {
  const {
    tipo_plan_numero,
    cobrador_numero,
    tipo_de_grupo_numero,
    os_numero,
    numero_afiliado,
    telefono_1,
    telefono_2,
    domicilio,
    localidad,
    valor_cuota,
    estado,
  } = req.body;

  // Verificar que el número de afiliado sea único
  const existente = await db.PlanV1.findOne({ where: { numero_afiliado } });
  if (existente) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un plan con ese número de afiliado',
      errors: { numero_afiliado: 'Ya existe un plan con ese número de afiliado' },
    });
  }

  const plan = await db.PlanV1.create({
    tipo_plan_numero,
    cobrador_numero,
    tipo_de_grupo_numero,
    os_numero,
    numero_afiliado,
    telefono_1,
    telefono_2,
    domicilio,
    localidad,
    valor_cuota,
    estado: estado || 'ACTIVO',
  });

  return res.status(201).json({
    success: true,
    message: 'Plan creado exitosamente',
    data: plan,
  });
};

// ── PUT /api/v1.0/planes/:planNumero (admin) ────────────────────────────────────

const actualizar = async (req, res) => {
  const { planNumero } = req.params;

  const plan = await db.PlanV1.findByPk(planNumero);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan no encontrado' });
  }

  // Si se intenta cambiar el número de afiliado, verificar unicidad
  if (req.body.numero_afiliado && req.body.numero_afiliado !== plan.numero_afiliado) {
    const existente = await db.PlanV1.findOne({
      where: { numero_afiliado: req.body.numero_afiliado },
    });
    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un plan con ese número de afiliado',
        errors: { numero_afiliado: 'Ya existe un plan con ese número de afiliado' },
      });
    }
  }

  const camposPermitidos = [
    'tipo_plan_numero',
    'cobrador_numero',
    'tipo_de_grupo_numero',
    'os_numero',
    'numero_afiliado',
    'telefono_1',
    'telefono_2',
    'domicilio',
    'localidad',
    'valor_cuota',
    'estado',
  ];

  const actualizaciones = {};
  camposPermitidos.forEach((campo) => {
    if (req.body[campo] !== undefined) actualizaciones[campo] = req.body[campo];
  });

  await plan.update(actualizaciones);

  return res.json({
    success: true,
    message: 'Plan actualizado correctamente',
    data: plan,
  });
};

// ── DELETE /api/v1.0/planes/:planNumero (admin) ────────────────────────────────

const eliminar = async (req, res) => {
  const { planNumero } = req.params;

  const plan = await db.PlanV1.findByPk(planNumero);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan no encontrado' });
  }

  await plan.destroy();

  return res.json({ success: true, message: 'Plan eliminado correctamente' });
};

// ── GET /api/v1.0/planes/numero-afiliado/max ────────────────────────────────────
// Get the max affiliate number to suggest the next one

const getMaxAfiliadoNumber = async (req, res) => {
  try {
    const result = await db.PlanV1.findOne({
      attributes: [[sequelize.fn('MAX', sequelize.col('numero_afiliado')), 'maxNumber']],
      raw: true,
    });
    const maxNumber = result?.maxNumber ? parseInt(result.maxNumber, 10) : 0;
    return res.json({ success: true, data: { maxNumber, suggestedNumber: maxNumber + 1 } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching max affiliate number' });
  }
};

module.exports = {
  listar,
  getByPersona,
  obtener,
  crear,
  actualizar,
  eliminar,
  getMaxAfiliadoNumber,
};
