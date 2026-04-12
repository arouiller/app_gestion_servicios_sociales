const db = require('../models');
const { Op } = require('sequelize');

exports.search = async (req, res, next) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === '') {
      return res.json([]);
    }

    const personas = await db.Persona.findAll({
      where: {
        [Op.or]: [
          { apellido: { [Op.like]: `%${search}%` } },
          { nombre: { [Op.like]: `%${search}%` } },
          { numero_documento: { [Op.like]: `%${search}%` } },
        ],
      },
      attributes: ['id', 'apellido', 'nombre', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'fecha_cobertura'],
      limit: 10,
    });

    res.json(personas);
  } catch (err) {
    next(err);
  }
};
