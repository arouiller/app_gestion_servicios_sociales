const Afiliado = require('../models/Afiliado');
const GrupoFamiliar = require('../models/GrupoFamiliar');
const HistorialGrupoFamiliar = require('../models/HistorialGrupoFamiliar');
const Usuario = require('../models/Usuario');

// ── GET /api/grupos-familiares/:id/historial ────────────────────────────────
// Accesible a cualquier empleado autenticado.

const listarHistorial = async (req, res) => {
  const grupoId = parseInt(req.params.id, 10);

  const grupo = await GrupoFamiliar.findByPk(grupoId);
  if (!grupo) {
    return res.status(404).json({ success: false, message: 'Grupo familiar no encontrado' });
  }

  const entradas = await HistorialGrupoFamiliar.findAll({
    where: { grupo_id: grupoId },
    order: [['fecha', 'DESC']],
  });

  if (entradas.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const afiliadoIds = [...new Set(entradas.map((e) => e.afiliado_id))];
  const usuarioIds  = [...new Set(entradas.map((e) => e.usuario_id))];

  const [afiliados, usuarios] = await Promise.all([
    Afiliado.findAll({
      where: { id: afiliadoIds },
      attributes: ['id', 'nombre', 'apellido'],
    }),
    Usuario.findAll({
      where: { id: usuarioIds },
      attributes: ['id', 'nombre', 'apellido'],
    }),
  ]);

  const afiliadoMap = Object.fromEntries(afiliados.map((a) => [a.id, a.toJSON()]));
  const usuarioMap  = Object.fromEntries(usuarios.map((u) => [u.id, u.toJSON()]));

  const data = entradas.map((e) => ({
    id: e.id,
    accion: e.accion,
    fecha: e.fecha,
    notas: e.notas,
    afiliado: afiliadoMap[e.afiliado_id] || null,
    ejecutado_por: usuarioMap[e.usuario_id] || null,
  }));

  return res.json({ success: true, data });
};

module.exports = { listarHistorial };
