const { Op } = require('sequelize');
const Afiliado = require('../models/Afiliado');
const GrupoFamiliar = require('../models/GrupoFamiliar');
const HistorialGrupoFamiliar = require('../models/HistorialGrupoFamiliar');

// ── GET /api/afiliados ──────────────────────────────────────────────────────

const listar = async (req, res) => {
  const { page = 1, limit = 10, estado, search } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const where = {};
  if (estado) where.estado = estado;
  if (req.query.rol) where.rol = req.query.rol;
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

  const grupos = await GrupoFamiliar.findAll({ attributes: ['id', 'nombre', 'estado'] });
  const grupoMap = Object.fromEntries(grupos.map((g) => [g.id, g]));

  const data = rows.map((a) => ({
    ...a.toJSON(),
    grupo: a.grupo_familiar_id ? grupoMap[a.grupo_familiar_id] || null : null,
  }));

  return res.json({
    success: true,
    data,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: count,
      pages: Math.ceil(count / parseInt(limit, 10)),
    },
  });
};

// ── GET /api/afiliados/:id ──────────────────────────────────────────────────

const obtener = async (req, res) => {
  const afiliado = await Afiliado.findByPk(req.params.id);
  if (!afiliado) {
    return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
  }

  let grupo = null;
  if (afiliado.grupo_familiar_id) {
    grupo = await GrupoFamiliar.findByPk(afiliado.grupo_familiar_id);
  }

  return res.json({ success: true, data: { ...afiliado.toJSON(), grupo } });
};

// ── POST /api/afiliados ─────────────────────────────────────────────────────

const crear = async (req, res) => {
  const {
    nombre, apellido, fecha_nacimiento, tipo_documento, numero_documento,
    genero, direccion, ciudad, provincia, codigo_postal, telefonos, email_contacto,
  } = req.body;

  const rol = req.body.rol || 'titular';

  const existente = await Afiliado.findOne({ where: { numero_documento } });
  if (existente) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un afiliado con ese número de documento',
      errors: { numero_documento: 'Ya existe un afiliado con ese número de documento' },
    });
  }

  let grupo_familiar_id = req.body.grupo_familiar_id || null;

  if (rol === 'beneficiario') {
    if (!grupo_familiar_id) {
      return res.status(400).json({
        success: false,
        message: 'Un beneficiario debe pertenecer a un grupo familiar',
        errors: { grupo_familiar_id: 'El grupo familiar es requerido para un beneficiario' },
      });
    }
    const grupoExiste = await GrupoFamiliar.findByPk(grupo_familiar_id);
    if (!grupoExiste) {
      return res.status(404).json({ success: false, message: 'Grupo familiar no encontrado' });
    }
  } else if (rol === 'titular' && !grupo_familiar_id) {
    const nuevoGrupo = await GrupoFamiliar.create({
      nombre: `Familia ${apellido.trim()}`,
    });
    grupo_familiar_id = nuevoGrupo.id;
  }

  const afiliado = await Afiliado.create({
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
    rol,
    grupo_familiar_id,
  });

  await HistorialGrupoFamiliar.create({
    grupo_id: grupo_familiar_id,
    afiliado_id: afiliado.id,
    accion: 'ingreso',
    usuario_id: req.userId,
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
    'estado', 'rol', 'grupo_familiar_id',
  ];

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

// ── DELETE /api/afiliados/:id ───────────────────────────────────────────────

const eliminar = async (req, res) => {
  const afiliado = await Afiliado.findByPk(req.params.id);
  if (!afiliado) {
    return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
  }
  await afiliado.destroy();
  return res.json({ success: true, message: 'Afiliado eliminado correctamente' });
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
