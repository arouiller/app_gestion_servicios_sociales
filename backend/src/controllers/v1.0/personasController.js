const db = require('../../models');
const { Op } = require('sequelize');

/**
 * GET /api/personas?search=texto
 * Busca personas por apellido, nombre o numero_documento
 * Máximo 10 resultados, sin paginación
 */
exports.search = async (req, res, next) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === '') {
      return res.status(400).json({
        error: 'El parámetro search es requerido',
      });
    }

    const personas = await db.Persona.findAll({
      where: {
        [Op.or]: [
          { apellido: { [Op.like]: `%${search}%` } },
          { nombre: { [Op.like]: `%${search}%` } },
          { numero_documento: { [Op.like]: `%${search}%` } },
        ],
      },
      attributes: [
        'id',
        'apellido',
        'nombre',
        'tipo_documento',
        'numero_documento',
        'fecha_nacimiento',
        'fecha_cobertura',
      ],
      limit: 10,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    });

    res.status(200).json(personas);
  } catch (error) {
    next(error);
  }
};
