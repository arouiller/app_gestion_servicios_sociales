const { Provincia, Zona, PlanIntegrante, sequelize } = require('../models');
const logger = require('../utils/logger');

// GET /api/provincias - Listar todas las provincias con sus zonas
exports.list = async (req, res) => {
  try {
    const provincias = await Provincia.findAll({
      include: [{
        model: Zona,
        as: 'zonas',
        attributes: ['id', 'codigo', 'nombre', 'activo']
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: provincias
    });
  } catch (error) {
    logger.error('Error listing provincias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar provincias'
    });
  }
};

// POST /api/provincias - Crear nueva provincia
exports.create = async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || !codigo) {
      return res.status(422).json({
        success: false,
        message: 'Nombre y código son requeridos'
      });
    }

    // Validar unicidad
    const existe = await Provincia.findOne({
      where: { codigo }
    });

    if (existe) {
      return res.status(409).json({
        success: false,
        message: `El código "${codigo}" ya existe`
      });
    }

    const provincia = await Provincia.create({
      nombre,
      codigo,
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Provincia creada exitosamente',
      data: provincia
    });
  } catch (error) {
    logger.error('Error creating provincia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear provincia'
    });
  }
};

// PUT /api/provincias/:id - Editar provincia
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, activo } = req.body;

    const provincia = await Provincia.findByPk(id);
    if (!provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    // Validar unicidad de código si cambió
    if (codigo !== provincia.codigo) {
      const existe = await Provincia.findOne({
        where: { codigo }
      });
      if (existe) {
        return res.status(409).json({
          success: false,
          message: `El código "${codigo}" ya existe`
        });
      }
    }

    await provincia.update({
      nombre: nombre || provincia.nombre,
      codigo: codigo || provincia.codigo,
      activo: activo !== undefined ? activo : provincia.activo
    });

    res.json({
      success: true,
      message: 'Provincia actualizada exitosamente',
      data: provincia
    });
  } catch (error) {
    logger.error('Error updating provincia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar provincia'
    });
  }
};

// DELETE /api/provincias/:id - Eliminar provincia
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const provincia = await Provincia.findByPk(id, {
      include: [{
        model: Zona,
        as: 'zonas',
        where: { activo: true },
        required: false
      }]
    });

    if (!provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    // Validar que no tenga zonas activas
    if (provincia.zonas && provincia.zonas.length > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar la provincia. Tiene ${provincia.zonas.length} zona(s) activa(s)`,
        zonas_count: provincia.zonas.length
      });
    }

    await provincia.destroy();

    res.json({
      success: true,
      message: 'Provincia eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting provincia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar provincia'
    });
  }
};
