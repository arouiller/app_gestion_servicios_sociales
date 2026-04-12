const Plan = require('../models/Plan');

// ── GET /api/planes ─────────────────────────────────────────────────────────
// Todos los usuarios autenticados pueden ver los planes.

const listar = async (req, res) => {
  const { estado } = req.query;
  const where = {};
  if (estado) {
    where.estado = estado;
  } else {
    // Por defecto solo muestra activos a usuarios no-admin
    if (req.userRole !== 'admin') where.estado = 'activo';
  }

  const planes = await Plan.findAll({
    where,
    order: [['precio_mensual', 'ASC']],
  });

  return res.json({ success: true, data: planes });
};

// ── GET /api/planes/:id ─────────────────────────────────────────────────────

const obtener = async (req, res) => {
  const plan = await Plan.findByPk(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan no encontrado' });
  }
  return res.json({ success: true, data: plan });
};

// ── POST /api/planes  (admin) ───────────────────────────────────────────────

const crear = async (req, res) => {
  const {
    nombre, descripcion, precio_mensual, cobertura,
    beneficios, duracion_meses, limite_dependientes,
  } = req.body;

  const existente = await Plan.findOne({ where: { nombre: nombre.trim() } });
  if (existente) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un plan con ese nombre',
      errors: { nombre: 'Ya existe un plan con ese nombre' },
    });
  }

  const plan = await Plan.create({
    nombre: nombre.trim(),
    descripcion: descripcion || null,
    precio_mensual,
    cobertura: cobertura || null,
    beneficios: beneficios || null,
    duracion_meses: duracion_meses || 12,
    limite_dependientes: limite_dependientes || 5,
    estado: 'activo',
  });

  return res.status(201).json({
    success: true,
    message: 'Plan creado exitosamente',
    data: plan,
  });
};

// ── PUT /api/planes/:id  (admin) ────────────────────────────────────────────

const actualizar = async (req, res) => {
  const plan = await Plan.findByPk(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan no encontrado' });
  }

  if (req.body.nombre && req.body.nombre.trim() !== plan.nombre) {
    const existente = await Plan.findOne({ where: { nombre: req.body.nombre.trim() } });
    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un plan con ese nombre',
        errors: { nombre: 'Ya existe un plan con ese nombre' },
      });
    }
  }

  const camposPermitidos = [
    'nombre', 'descripcion', 'precio_mensual', 'cobertura',
    'beneficios', 'duracion_meses', 'limite_dependientes', 'estado',
  ];

  const actualizaciones = {};
  camposPermitidos.forEach((campo) => {
    if (req.body[campo] !== undefined) actualizaciones[campo] = req.body[campo];
  });
  if (actualizaciones.nombre) actualizaciones.nombre = actualizaciones.nombre.trim();

  await plan.update(actualizaciones);

  return res.json({
    success: true,
    message: 'Plan actualizado correctamente',
    data: plan,
  });
};

// ── DELETE /api/planes/:id  (admin) ────────────────────────────────────────

const eliminar = async (req, res) => {
  const plan = await Plan.findByPk(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan no encontrado' });
  }
  await plan.destroy();
  return res.json({ success: true, message: 'Plan eliminado correctamente' });
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
