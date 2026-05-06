const { Zona, Provincia, PlanIntegrante } = require('../models');

const zonaController = {
  async list(req, res) {
    try {
      const { provincia_id } = req.query;
      const where = {};

      if (provincia_id) {
        where.provincia_id = provincia_id;
      }

      const zonas = await Zona.findAll({
        where,
        include: [{ model: Provincia, as: 'provincia', attributes: ['id', 'nombre', 'codigo'] }],
        order: [['nombre', 'ASC']]
      });

      res.json({ success: true, data: zonas });
    } catch (error) {
      console.error('Error listing zonas:', error);
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

      const zonas = await Zona.findAll({
        where: { provincia_id: id },
        order: [['nombre', 'ASC']]
      });

      res.json({ success: true, data: zonas });
    } catch (error) {
      console.error('Error listing zonas by provincia:', error);
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

      const zona = await Zona.create({
        provincia_id,
        codigo: codigo.trim(),
        nombre: nombre.trim()
      });

      res.status(201).json({ success: true, data: zona });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'El código ya existe para esta provincia'
        });
      }
      console.error('Error creating zona:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { codigo, nombre } = req.body;

      const zona = await Zona.findByPk(id);
      if (!zona) {
        return res.status(404).json({ success: false, message: 'Zona no encontrada' });
      }

      if (codigo) zona.codigo = codigo.trim();
      if (nombre) zona.nombre = nombre.trim();

      await zona.save();
      res.json({ success: true, data: zona });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'El código ya existe para esta provincia'
        });
      }
      console.error('Error updating zona:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const zona = await Zona.findByPk(id);
      if (!zona) {
        return res.status(404).json({ success: false, message: 'Zona no encontrada' });
      }

      const planesCount = await PlanIntegrante.count({ where: { zona_id: id } });
      if (planesCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar zona con planes asociados'
        });
      }

      await zona.destroy();
      res.json({ success: true, message: 'Zona eliminada' });
    } catch (error) {
      console.error('Error deleting zona:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = zonaController;
