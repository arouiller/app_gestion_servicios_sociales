const { Provincia, Localidad, PlanV1 } = require('../models');

const provinciaController = {
  async list(req, res) {
    try {
      const provincias = await Provincia.findAll({
        include: [{ model: Localidad, as: 'localidades', attributes: ['id', 'codigo', 'nombre', 'activo'] }],
        order: [['nombre', 'ASC']]
      });
      res.json({ success: true, data: provincias });
    } catch (error) {
      console.error('Error listing provincias:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const { nombre, codigo } = req.body;

      if (!nombre || !codigo) {
        return res.status(400).json({ success: false, message: 'nombre y codigo son requeridos' });
      }

      const provincia = await Provincia.create({ nombre: nombre.trim(), codigo: codigo.trim() });
      res.status(201).json({ success: true, data: provincia });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, message: 'El nombre o código ya existe' });
      }
      console.error('Error creating provincia:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, codigo } = req.body;

      const provincia = await Provincia.findByPk(id);
      if (!provincia) {
        return res.status(404).json({ success: false, message: 'Provincia no encontrada' });
      }

      if (nombre) provincia.nombre = nombre.trim();
      if (codigo) provincia.codigo = codigo.trim();

      await provincia.save();
      res.json({ success: true, data: provincia });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, message: 'El nombre o código ya existe' });
      }
      console.error('Error updating provincia:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getReferencias(req, res) {
    try {
      const { id } = req.params;
      const { sequelize } = require('../config/database');

      const provincia = await Provincia.findByPk(id);
      if (!provincia) {
        return res.status(404).json({ success: false, message: 'Provincia no encontrada' });
      }

      // Query raw: contar planes asociados a localidades de esta provincia
      const result = await sequelize.query(
        `SELECT COUNT(*) as \`count\` FROM planes p
         INNER JOIN localidades l ON p.localidad_id = l.id
         WHERE l.provincia_id = ?`,
        {
          replacements: [id],
          type: require('sequelize').QueryTypes.SELECT,
          raw: true
        }
      );

      const referencias = parseInt(result[0]?.count) || 0;

      res.json({
        success: true,
        referencias,
        referenciaEn: 'planes'
      });
    } catch (error) {
      console.error('Error getting referencias for provincia:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { force } = req.query;
      const forceDelete = force === 'true' || force === '1';

      const provincia = await Provincia.findByPk(id);
      if (!provincia) {
        return res.status(404).json({ success: false, message: 'Provincia no encontrada' });
      }

      // Contar planes asociados a localidades de esta provincia
      const referencias = await PlanV1.count({
        include: [{
          model: Localidad,
          as: 'localidad',
          where: { provincia_id: id },
          attributes: []
        }]
      });

      // Si hay referencias y no es force delete, retornar 409
      if (referencias > 0 && !forceDelete) {
        return res.status(409).json({
          success: false,
          error: 'No se puede eliminar, está en uso',
          message: `Hay ${referencias} ${referencias === 1 ? 'plan' : 'planes'} asociados a localidades de esta provincia. ¿Deseas proceder eliminando las referencias?`,
          referencias,
          referenciaEn: 'planes'
        });
      }

      // Si es force delete, ejecutar en transacción
      if (forceDelete && referencias > 0) {
        const transaction = await require('../models').sequelize.transaction();

        try {
          // Obtener IDs de localidades de esta provincia
          const localidadesIds = await Localidad.findAll({
            where: { provincia_id: id },
            attributes: ['id'],
            raw: true,
            transaction
          });

          const ids = localidadesIds.map(l => l.id);

          // Desasociar planes (localidad_id = NULL)
          if (ids.length > 0) {
            await PlanV1.update(
              { localidad_id: null },
              { where: { localidad_id: ids }, transaction }
            );
          }

          // Eliminar localidades
          await Localidad.destroy({
            where: { provincia_id: id },
            transaction
          });

          // Eliminar provincia
          await provincia.destroy({ transaction });

          await transaction.commit();
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      } else {
        // Eliminación simple (sin referencias)
        await provincia.destroy();
      }

      res.json({
        success: true,
        message: 'Provincia eliminada correctamente',
        referencesAffected: referencias
      });
    } catch (error) {
      console.error('Error deleting provincia:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = provinciaController;
