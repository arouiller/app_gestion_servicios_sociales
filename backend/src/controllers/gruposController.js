const sequelize = require('../config/database');
const GrupoFamiliar = require('../models/GrupoFamiliar');
const Afiliado = require('../models/Afiliado');
const HistorialGrupoFamiliar = require('../models/HistorialGrupoFamiliar');

// ── GET /api/grupos-familiares  (admin) ────────────────────────────────────

const listar = async (req, res) => {
  const grupos = await GrupoFamiliar.findAll({
    order: [['fecha_creacion', 'DESC']],
  });

  const data = await Promise.all(
    grupos.map(async (g) => {
      const titular = await Afiliado.findOne({
        where: { grupo_familiar_id: g.id, rol: 'titular' },
        attributes: ['id', 'nombre', 'apellido', 'tipo_documento', 'numero_documento'],
      });
      const total_miembros = await Afiliado.count({ where: { grupo_familiar_id: g.id } });
      return { ...g.toJSON(), titular, total_miembros };
    })
  );

  return res.json({ success: true, data });
};

// ── GET /api/grupos-familiares/:id  (admin) ────────────────────────────────

const obtener = async (req, res) => {
  const grupo = await GrupoFamiliar.findByPk(req.params.id);
  if (!grupo) {
    return res.status(404).json({ success: false, message: 'Grupo familiar no encontrado' });
  }

  const miembros = await Afiliado.findAll({
    where: { grupo_familiar_id: grupo.id },
    order: [
      ['rol', 'ASC'],    // titular primero, luego beneficiarios
      ['apellido', 'ASC'],
    ],
  });

  return res.json({ success: true, data: { ...grupo.toJSON(), miembros } });
};

// ── PUT /api/grupos-familiares/:id  (admin) ────────────────────────────────

const actualizar = async (req, res) => {
  const grupo = await GrupoFamiliar.findByPk(req.params.id);
  if (!grupo) {
    return res.status(404).json({ success: false, message: 'Grupo familiar no encontrado' });
  }

  const { nombre, estado } = req.body;
  if (nombre !== undefined) grupo.nombre = nombre.trim();
  if (estado !== undefined) grupo.estado = estado;
  await grupo.save();

  return res.json({ success: true, message: 'Grupo actualizado correctamente', data: grupo });
};

// ── POST /api/grupos-familiares/:id/desvincular/:afiliadoId  (admin) ─────────

const desvincular = async (req, res) => {
  const grupoId    = parseInt(req.params.id, 10);
  const afiliadoId = parseInt(req.params.afiliadoId, 10);

  const grupo = await GrupoFamiliar.findByPk(grupoId);
  if (!grupo) {
    return res.status(404).json({ success: false, message: 'Grupo familiar no encontrado' });
  }

  const afiliado = await Afiliado.findByPk(afiliadoId);
  if (!afiliado) {
    return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
  }
  if (afiliado.grupo_familiar_id !== grupoId) {
    return res.status(400).json({ success: false, message: 'El afiliado no pertenece a este grupo' });
  }
  if (afiliado.rol !== 'beneficiario') {
    return res.status(400).json({ success: false, message: 'Solo se puede desvincular a un beneficiario' });
  }

  await sequelize.transaction(async (t) => {
    // Crear nuevo grupo para el ex-beneficiario
    const nuevoGrupo = await GrupoFamiliar.create(
      { nombre: `Familia ${afiliado.apellido} ${afiliado.nombre}` },
      { transaction: t },
    );

    // Actualizar el afiliado: promover a titular del nuevo grupo
    await afiliado.update(
      { rol: 'titular', grupo_familiar_id: nuevoGrupo.id },
      { transaction: t },
    );

    // Registrar baja en el grupo original
    await HistorialGrupoFamiliar.create(
      {
        grupo_id:    grupoId,
        afiliado_id: afiliadoId,
        accion:      'baja',
        usuario_id:  req.userId,
      },
      { transaction: t },
    );

    // Registrar ingreso en el nuevo grupo
    await HistorialGrupoFamiliar.create(
      {
        grupo_id:    nuevoGrupo.id,
        afiliado_id: afiliadoId,
        accion:      'ingreso',
        usuario_id:  req.userId,
      },
      { transaction: t },
    );
  });

  await afiliado.reload();

  return res.json({
    success: true,
    message: `${afiliado.nombre} ${afiliado.apellido} fue desvinculado y promovido a titular`,
    data: afiliado,
  });
};

module.exports = { listar, obtener, actualizar, desvincular };
