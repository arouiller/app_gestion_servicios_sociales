const { Localidad, Provincia, PlanIntegrante, PlanV1 } = require('../models');

const localidadController = {
  async list(req, res) {
    try {
      const { provincia_id } = req.query;
      const where = {};

      if (provincia_id) {
        where.provincia_id = provincia_id;
      }

      const localidades = await Localidad.findAll({
        where,
        include: [{ model: Provincia, as: 'provincia', attributes: ['id', 'nombre', 'codigo'] }],
        order: [['nombre', 'ASC']]
      });

      res.json({ success: true, data: localidades });
    } catch (error) {
      console.error('Error listing localidades:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async byProvincia(req, res) {
    try {
      const { id } = req.params;

      const provincia = await Provincia.findByPk(id);
      if (!provincia) {
        return res.status(404).json({ success: false, message: 'Provincia no encontrada' });
      }

      const localidades = await Localidad.findAll({
        where: { provincia_id: id },
        order: [['nombre', 'ASC']]
      });

      res.json({ success: true, data: localidades });
    } catch (error) {
      console.error('Error listing localidades by provincia:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const { provincia_id, codigo, nombre } = req.body;

      if (!provincia_id || !codigo || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'provincia_id, codigo y nombre son requeridos'
        });
      }

      const provincia = await Provincia.findByPk(provincia_id);
      if (!provincia) {
        return res.status(404).json({ success: false, message: 'Provincia no encontrada' });
      }

      const localidad = await Localidad.create({
        provincia_id,
        codigo: codigo.trim(),
        nombre: nombre.trim()
      });

      res.status(201).json({ success: true, data: localidad });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'El código ya existe para esta provincia'
        });
      }
      console.error('Error creating localidad:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { codigo, nombre } = req.body;

      const localidad = await Localidad.findByPk(id);
      if (!localidad) {
        return res.status(404).json({ success: false, message: 'Localidad no encontrada' });
      }

      if (codigo) localidad.codigo = codigo.trim();
      if (nombre) localidad.nombre = nombre.trim();

      await localidad.save();
      res.json({ success: true, data: localidad });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'El código ya existe para esta provincia'
        });
      }
      console.error('Error updating localidad:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getReferencias(req, res) {
    try {
      const { id } = req.params;
      const { sequelize } = require('../config/database');

      const localidad = await Localidad.findByPk(id);
      if (!localidad) {
        return res.status(404).json({ success: false, message: 'Localidad no encontrada' });
      }

      // Query raw: contar planes asociados a esta localidad
      const result = await sequelize.query(
        `SELECT COUNT(*) as \`count\` FROM planes WHERE localidad_id = ?`,
        {
          replacements: [id],
          type: require('sequelize').QueryTypes.SELECT,
          raw: true
        }
      );

      console.log('[DEBUG] localidad getReferencias - id:', id);
      console.log('[DEBUG] localidad getReferencias - raw result:', result);
      console.log('[DEBUG] localidad getReferencias - result[0]:', result[0]);
      console.log('[DEBUG] localidad getReferencias - result[0]?.count:', result[0]?.count);

      const referencias = parseInt(result[0]?.count) || 0;

      res.json({
        success: true,
        referencias,
        referenciaEn: 'planes'
      });
    } catch (error) {
      console.error('Error getting referencias for localidad:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { force } = req.query;
      const forceDelete = force === 'true' || force === '1';

      const localidad = await Localidad.findByPk(id);
      if (!localidad) {
        return res.status(404).json({ success: false, message: 'Localidad no encontrada' });
      }

      // Contar referencias a planes
      const referencias = await PlanV1.count({
        where: { localidad_id: id }
      });

      // Si hay referencias y no es force delete, retornar 409
      if (referencias > 0 && !forceDelete) {
        return res.status(409).json({
          success: false,
          error: 'No se puede eliminar, está en uso',
          message: `Hay ${referencias} ${referencias === 1 ? 'plan' : 'planes'} usando esta localidad. ¿Deseas proceder eliminando las referencias?`,
          referencias,
          referenciaEn: 'planes'
        });
      }

      // Si es force delete, desasociar planes primero
      if (forceDelete && referencias > 0) {
        await PlanV1.update(
          { localidad_id: null },
          { where: { localidad_id: id } }
        );
      }

      await localidad.destroy();
      res.json({
        success: true,
        message: 'Localidad eliminada correctamente',
        referencesAffected: referencias
      });
    } catch (error) {
      console.error('Error deleting localidad:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = localidadController;
