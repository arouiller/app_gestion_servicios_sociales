const { Provincia, Localidad } = require('../models');

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

  async delete(req, res) {
    try {
      const { id } = req.params;

      const provincia = await Provincia.findByPk(id);
      if (!provincia) {
        return res.status(404).json({ success: false, message: 'Provincia no encontrada' });
      }

      const localidadesCount = await Localidad.count({ where: { provincia_id: id, activo: true } });
      if (localidadesCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar provincia con localidades activas'
        });
      }

      await provincia.destroy();
      res.json({ success: true, message: 'Provincia eliminada' });
    } catch (error) {
      console.error('Error deleting provincia:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = provinciaController;
