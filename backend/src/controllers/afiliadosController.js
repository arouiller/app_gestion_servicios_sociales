const { Op } = require('sequelize');
const Afiliado = require('../models/Afiliado');

// ── GET /api/afiliados  (admin) ─────────────────────────────────────────────

const listar = async (req, res) => {
  const { page = 1, limit = 10, estado, search } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const where = {};
  if (estado) where.estado = estado;
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${search}%` } },
      { apellido: { [Op.like]: `%${search}%` } },
      { numero_documento: { [Op.like]: `%${search}%` } },
      { email_contacto: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Afiliado.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset,
    order: [['fecha_creacion', 'DESC']],
  });

  return res.json({
    success: true,
    data: rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: count,
      pages: Math.ceil(count / parseInt(limit, 10)),
    },
  });
};

// ── GET /api/afiliados/me  (cualquier usuario autenticado) ──────────────────

const me = async (req, res) => {
  const afiliado = await Afiliado.findOne({ where: { usuario_id: req.userId } });
  if (!afiliado) {
    return res.status(404).json({
      success: false,
      message: 'No tenés un perfil de afiliado registrado',
    });
  }
  return res.json({ success: true, data: afiliado });
};

// ── GET /api/afiliados/:id  (admin) ────────────────────────────────────────

const obtener = async (req, res) => {
  const afiliado = await Afiliado.findByPk(req.params.id);
  if (!afiliado) {
    return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
  }
  return res.json({ success: true, data: afiliado });
};

// ── POST /api/afiliados ─────────────────────────────────────────────────────

const crear = async (req, res) => {
  const {
    nombre, apellido, fecha_nacimiento, tipo_documento, numero_documento,
    genero, direccion, ciudad, provincia, codigo_postal, telefonos, email_contacto,
  } = req.body;

  // Verificar documento único
  const existente = await Afiliado.findOne({ where: { numero_documento } });
  if (existente) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un afiliado con ese número de documento',
      errors: { numero_documento: 'Ya existe un afiliado con ese número de documento' },
    });
  }

  // Un usuario no-admin solo puede crear su propio perfil (uno por usuario)
  let usuario_id;
  if (req.userRole === 'admin' && req.body.usuario_id) {
    usuario_id = req.body.usuario_id;
  } else {
    usuario_id = req.userId;
    const yaExiste = await Afiliado.findOne({ where: { usuario_id } });
    if (yaExiste) {
      return res.status(409).json({
        success: false,
        message: 'Ya tenés un perfil de afiliado registrado',
      });
    }
  }

  const afiliado = await Afiliado.create({
    usuario_id,
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    fecha_nacimiento: fecha_nacimiento || null,
    tipo_documento,
    numero_documento: numero_documento.trim(),
    genero: genero || null,
    direccion: direccion || null,
    ciudad: ciudad || null,
    provincia: provincia || null,
    codigo_postal: codigo_postal || null,
    telefonos: telefonos || null,
    email_contacto: email_contacto || null,
    estado: 'activo',
  });

  return res.status(201).json({
    success: true,
    message: 'Afiliado creado exitosamente',
    data: afiliado,
  });
};

// ── PUT /api/afiliados/:id ──────────────────────────────────────────────────

const actualizar = async (req, res) => {
  const afiliado = await Afiliado.findByPk(req.params.id);
  if (!afiliado) {
    return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
  }

  // Un usuario no-admin solo puede editar su propio perfil
  if (req.userRole !== 'admin' && afiliado.usuario_id !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'No tenés permiso para modificar este afiliado',
    });
  }

  // Verificar unicidad de documento si cambió
  if (req.body.numero_documento && req.body.numero_documento !== afiliado.numero_documento) {
    const existente = await Afiliado.findOne({ where: { numero_documento: req.body.numero_documento } });
    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un afiliado con ese número de documento',
        errors: { numero_documento: 'Ya existe un afiliado con ese número de documento' },
      });
    }
  }

  const camposPermitidos = [
    'nombre', 'apellido', 'fecha_nacimiento', 'tipo_documento', 'numero_documento',
    'genero', 'direccion', 'ciudad', 'provincia', 'codigo_postal', 'telefonos', 'email_contacto',
  ];
  if (req.userRole === 'admin') camposPermitidos.push('estado', 'usuario_id');

  const actualizaciones = {};
  camposPermitidos.forEach((campo) => {
    if (req.body[campo] !== undefined) actualizaciones[campo] = req.body[campo];
  });

  await afiliado.update(actualizaciones);

  return res.json({
    success: true,
    message: 'Afiliado actualizado correctamente',
    data: afiliado,
  });
};

// ── DELETE /api/afiliados/:id  (admin) ─────────────────────────────────────

const eliminar = async (req, res) => {
  const afiliado = await Afiliado.findByPk(req.params.id);
  if (!afiliado) {
    return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
  }
  await afiliado.destroy();
  return res.json({ success: true, message: 'Afiliado eliminado correctamente' });
};

module.exports = { listar, me, obtener, crear, actualizar, eliminar };
