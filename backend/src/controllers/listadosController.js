const db = require('../models');
const { Op } = require('sequelize');

const listadosController = {
  async getAll(req, res, next) {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      let where = {};

      // Filtro de búsqueda (texto en número de plan o tipo)
      if (search) {
        where = {
          [Op.or]: [
            db.sequelize.where(
              db.sequelize.cast(db.sequelize.col('PlanV1.plan_numero'), 'CHAR'),
              Op.like,
              `%${search}%`
            ),
            db.sequelize.where(
              db.sequelize.col('TipoDePlan.tipo_plan_nombre'),
              Op.like,
              `%${search}%`
            ),
          ],
        };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await db.PlanV1.findAndCountAll({
        where,
        include: [
          {
            model: db.TipoDePlan,
            as: 'TipoDePlan',
            attributes: ['tipo_plan_numero', 'tipo_plan_nombre'],
          },
          {
            model: db.Zona,
            as: 'zonaRelation',
            attributes: ['id', 'nombre', 'codigo'],
            include: [
              {
                model: db.Provincia,
                as: 'provincia',
                attributes: ['id', 'nombre', 'codigo'],
              },
            ],
          },
          {
            model: db.PlanIntegrante,
            as: 'PlanIntegrantes',
            attributes: ['id', 'persona_id', 'rol', 'orden'],
            include: [
              {
                model: db.Persona,
                attributes: [
                  'id',
                  'nombre',
                  'apellido',
                  'numero_documento',
                  'fecha_nacimiento',
                ],
              },
            ],
            order: [['orden', 'ASC']],
          },
        ],
        order: [['plan_numero', 'ASC']],
        limit: parseInt(limit),
        offset,
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error in listadosController.getAll:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async porZona(req, res, next) {
    try {
      const { zona_id } = req.params;
      const { search, page = 1, limit = 10 } = req.query;

      // Validar zona existe
      const zona = await db.Zona.findByPk(zona_id);
      if (!zona) {
        return res.status(404).json({
          success: false,
          message: 'Zona no encontrada',
        });
      }

      let where = { zona_id: zona_id };

      // Filtro de búsqueda (texto en número de plan o tipo)
      if (search) {
        where = {
          [Op.and]: [
            where,
            {
              [Op.or]: [
                db.sequelize.where(
                  db.sequelize.cast(db.sequelize.col('PlanV1.plan_numero'), 'CHAR'),
                  Op.like,
                  `%${search}%`
                ),
                db.sequelize.where(
                  db.sequelize.col('TipoDePlan.tipo_plan_nombre'),
                  Op.like,
                  `%${search}%`
                ),
              ],
            },
          ],
        };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await db.PlanV1.findAndCountAll({
        where,
        include: [
          {
            model: db.TipoDePlan,
            as: 'TipoDePlan',
            attributes: ['tipo_plan_numero', 'tipo_plan_nombre'],
          },
          {
            model: db.Zona,
            as: 'zonaRelation',
            attributes: ['id', 'nombre', 'codigo'],
            include: [
              {
                model: db.Provincia,
                as: 'provincia',
                attributes: ['id', 'nombre', 'codigo'],
              },
            ],
          },
          {
            model: db.PlanIntegrante,
            as: 'PlanIntegrantes',
            attributes: ['id', 'persona_id', 'rol', 'orden'],
            include: [
              {
                model: db.Persona,
                attributes: [
                  'id',
                  'nombre',
                  'apellido',
                  'numero_documento',
                  'fecha_nacimiento',
                ],
              },
            ],
            order: [['orden', 'ASC']],
          },
        ],
        order: [['plan_numero', 'ASC']],
        limit: parseInt(limit),
        offset,
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error in listadosController.porZona:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = listadosController;
