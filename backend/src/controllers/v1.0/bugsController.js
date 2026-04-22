const { Op } = require('sequelize');
const db = require('../../models');

const listar = async (req, res, next) => {
  try {
    const { estado, usuario_id, search } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (usuario_id) where.usuario_id = usuario_id;
    if (search) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } },
      ];
    }

    const bugs = await db.Bug.findAll({
      where,
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido'],
        },
      ],
      order: [['fecha_creacion', 'DESC']],
    });

    return res.json({ success: true, data: bugs });
  } catch (error) {
    next(error);
  }
};

const obtener = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bug = await db.Bug.findByPk(id, {
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido'],
        },
      ],
    });

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug no encontrado' });
    }

    return res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    const { titulo, descripcion, tipo, version } = req.body;

    if (!descripcion || descripcion.trim().length === 0) {
      return res.status(422).json({
        success: false,
        message: 'La descripción es requerida',
        errors: { descripcion: 'La descripción es requerida' },
      });
    }

    // Generar número secuencial
    const lastBug = await db.Bug.findOne({
      order: [['id', 'DESC']],
    });
    const nextNum = lastBug ? parseInt(lastBug.numero.replace('BUG-', '')) + 1 : 1;
    const numero = `BUG-${String(nextNum).padStart(4, '0')}`;

    const bug = await db.Bug.create({
      numero,
      usuario_id: req.userId,
      titulo: titulo || null,
      descripcion,
      tipo: tipo || 'BUG',
      version: version || null,
      estado: 'REGISTRADO',
    });

    // Cargar usuario asociado
    const bugCompleto = await db.Bug.findByPk(bug.id, {
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido'],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Bug registrado exitosamente',
      data: bugCompleto,
    });
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, version } = req.body;

    if (!estado) {
      return res.status(422).json({
        success: false,
        message: 'El estado es requerido',
      });
    }

    const bug = await db.Bug.findByPk(id);

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug no encontrado' });
    }

    const transicionesPermitidas = {
      REGISTRADO: ['DESARROLLADO', 'DESESTIMADO'],
      DESARROLLADO: ['CERRADO'],
      DESESTIMADO: ['CERRADO'],
      CERRADO: [],
    };

    if (!transicionesPermitidas[bug.estado]?.includes(estado)) {
      return res.status(422).json({
        success: false,
        message: `No se puede cambiar de ${bug.estado} a ${estado}`,
      });
    }

    const updateData = { estado };
    if (version !== undefined) updateData.version = version;

    await bug.update(updateData);

    const bugActualizado = await db.Bug.findByPk(id, {
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido'],
        },
      ],
    });

    return res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      data: bugActualizado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  obtener,
  crear,
  cambiarEstado,
};
