const GrupoFamiliar = require('../models/GrupoFamiliar');
const Afiliado = require('../models/Afiliado');

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

module.exports = { listar, obtener, actualizar };
