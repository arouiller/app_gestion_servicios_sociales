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

/**
 * POST /api/personas
 * Crea una nueva persona
 */
exports.crear = async (req, res, next) => {
  try {
    const { nombre, apellido, tipo_documento, numero_documento, fecha_nacimiento, fecha_cobertura } = req.body;

    const persona = await db.Persona.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      tipo_documento,
      numero_documento: numero_documento.trim(),
      fecha_nacimiento,
      fecha_cobertura,
    });

    return res.status(201).json({ success: true, data: persona });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/personas/:personaId
 * Actualiza una persona existente
 */
exports.actualizar = async (req, res, next) => {
  try {
    const { personaId } = req.params;
    const persona = await db.Persona.findByPk(personaId);

    if (!persona) {
      return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    }

    const { nombre, apellido, tipo_documento, numero_documento, fecha_nacimiento, fecha_cobertura } = req.body;

    await persona.update({
      nombre: nombre?.trim() || persona.nombre,
      apellido: apellido?.trim() || persona.apellido,
      tipo_documento: tipo_documento || persona.tipo_documento,
      numero_documento: numero_documento?.trim() || persona.numero_documento,
      fecha_nacimiento: fecha_nacimiento || persona.fecha_nacimiento,
      fecha_cobertura: fecha_cobertura || persona.fecha_cobertura,
    });

    return res.json({ success: true, data: persona });
  } catch (error) {
    next(error);
  }
};
