const { Zona, Provincia, PlanIntegrante, sequelize } = require('../models');
const logger = require('../utils/logger');

// GET /api/zonas - Listar todas las zonas con provincia
exports.list = async (req, res) => {
  try {
    const { provincia_id } = req.query;

    const where = {};
    if (provincia_id) where.provincia_id = provincia_id;

    const zonas = await Zona.findAll({
      where,
      include: [{
        model: Provincia,
        as: 'provincia',
        attributes: ['id', 'nombre', 'codigo']
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: zonas
    });
  } catch (error) {
    logger.error('Error listing zonas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar zonas'
    });
  }
};

// GET /api/provincias/:id/zonas - Listar zonas de una provincia
exports.byProvincia = async (req, res) => {
  try {
    const { id } = req.params;

    const provincia = await Provincia.findByPk(id);
    if (!provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    const zonas = await Zona.findAll({
      where: { provincia_id: id },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: zonas
    });
  } catch (error) {
    logger.error('Error listing zonas by provincia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar zonas'
    });
  }
};

// POST /api/zonas - Crear nueva zona
exports.create = async (req, res) => {
  try {
    const { provincia_id, codigo, nombre } = req.body;

    if (!provincia_id || !codigo || !nombre) {
      return res.status(422).json({
        success: false,
        message: 'Provincia, código y nombre son requeridos'
      });
    }

    // Validar que provincia existe
    const provincia = await Provincia.findByPk(provincia_id);
    if (!provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    // Validar unicidad de código dentro de provincia
    const existe = await Zona.findOne({
      where: { provincia_id, codigo }
    });

    if (existe) {
      return res.status(409).json({
        success: false,
        message: `El código "${codigo}" ya existe en esta provincia`
      });
    }

    const zona = await Zona.create({
      provincia_id,
      codigo,
      nombre,
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Zona creada exitosamente',
      data: zona
    });
  } catch (error) {
    logger.error('Error creating zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear zona'
    });
  }
};

// PUT /api/zonas/:id - Editar zona
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, activo } = req.body;

    const zona = await Zona.findByPk(id);
    if (!zona) {
      return res.status(404).json({
        success: false,
        message: 'Zona no encontrada'
      });
    }

    // Validar unicidad de código si cambió
    if (codigo !== zona.codigo) {
      const existe = await Zona.findOne({
        where: {
          provincia_id: zona.provincia_id,
          codigo
        }
      });
      if (existe) {
        return res.status(409).json({
          success: false,
          message: `El código "${codigo}" ya existe en esta provincia`
        });
      }
    }

    await zona.update({
      codigo: codigo || zona.codigo,
      nombre: nombre || zona.nombre,
      activo: activo !== undefined ? activo : zona.activo
    });

    res.json({
      success: true,
      message: 'Zona actualizada exitosamente',
      data: zona
    });
  } catch (error) {
    logger.error('Error updating zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar zona'
    });
  }
};

// DELETE /api/zonas/:id - Eliminar zona
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const zona = await Zona.findByPk(id);
    if (!zona) {
      return res.status(404).json({
        success: false,
        message: 'Zona no encontrada'
      });
    }

    // Validar que no tenga planes asociados
    const planes_count = await PlanIntegrante.count({
      where: { zona_id: id }
    });

    if (planes_count > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar la zona. Tiene ${planes_count} plan(es) asociado(s)`,
        planes_count
      });
    }

    await zona.destroy();

    res.json({
      success: true,
      message: 'Zona eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar zona'
    });
  }
};
