const express = require('express');
const { ConfiguracionApp } = require('../models');
const db = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const queryExecController = require('../controllers/queryExecController');

const router = express.Router();

// Tipos de notificación y configuración válidos
const VALID_TYPES = ['error', 'warning', 'success', 'info', 'debounce_delay_ms', 'items_per_page', 'audit_enabled', 'audit_retention_days', 'redondeo_precision'];

// GET /api/admin/configuracion - Público (lectura de configuración)
router.get('/configuracion', async (req, res) => {
  try {
    const config = await ConfiguracionApp.findAll();
    const configObj = {};
    config.forEach((c) => {
      configObj[c.tipo_notificacion] = c.duracion_ms;
    });
    res.json({ success: true, data: configObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/configuracion/:tipo
router.put('/configuracion/:tipo', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { duracion_ms } = req.body;
    const tipo = req.params.tipo;

    if (duracion_ms === undefined || duracion_ms < 0) {
      return res.status(400).json({
        success: false,
        message: 'duracion_ms debe ser un número >= 0',
      });
    }

    // Validar que tipo sea válido
    if (!VALID_TYPES.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de configuración inválido. Valores permitidos: ${VALID_TYPES.join(', ')}`,
      });
    }

    // Validaciones específicas por tipo
    if (tipo === 'items_per_page') {
      if (duracion_ms !== 0 && (duracion_ms < 5 || duracion_ms > 1000)) {
        return res.status(400).json({
          success: false,
          message: 'items_per_page debe ser 0 (sin paginado) o entre 5 y 1000',
        });
      }
    } else if (tipo === 'debounce_delay_ms') {
      if (duracion_ms < 100 || duracion_ms > 10000) {
        return res.status(400).json({
          success: false,
          message: 'debounce_delay_ms debe estar entre 100 y 10000 ms',
        });
      }
    } else if (tipo === 'audit_enabled') {
      if (duracion_ms !== 0 && duracion_ms !== 1) {
        return res.status(400).json({
          success: false,
          message: 'audit_enabled debe ser 0 o 1',
        });
      }
    } else if (tipo === 'audit_retention_days') {
      if (duracion_ms < 1 || duracion_ms > 365) {
        return res.status(400).json({
          success: false,
          message: 'audit_retention_days debe estar entre 1 y 365 días',
        });
      }
    } else if (tipo === 'redondeo_precision') {
      if (duracion_ms <= 0 || !Number.isFinite(duracion_ms)) {
        return res.status(400).json({
          success: false,
          message: 'redondeo_precision debe ser un valor positivo (ej: 0.01, 1, 10, 100, 500)',
        });
      }
    }

    const config = await ConfiguracionApp.findOne({
      where: { tipo_notificacion: tipo },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configuración '${tipo}' no existe`,
      });
    }

    await config.update({ duracion_ms });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/auditoria - Listar registros de auditoría
router.get('/auditoria', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { search, usuario_id, fecha_desde, fecha_hasta, limit = 50, offset = 0 } = req.query;
    const { Op } = require('sequelize');
    const where = {};

    if (search) {
      where.endpoint = { [Op.like]: `%${search}%` };
    }

    if (usuario_id) {
      where.usuario_id = usuario_id;
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_hora = {};
      if (fecha_desde) {
        where.fecha_hora[Op.gte] = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.fecha_hora[Op.lte] = new Date(fecha_hasta + 'T23:59:59');
      }
    }

    const { count, rows } = await db.AuditLog.findAndCountAll({
      where,
      include: [{ model: db.Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }],
      order: [['fecha_hora', 'DESC']],
      limit: Math.min(parseInt(limit) || 50, 200),
      offset: parseInt(offset) || 0,
    });

    res.json({ success: true, data: { rows, count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/query-exec - Ejecutar queries SQL (Admin only)
router.post('/query-exec', verifyToken, requireAdmin, queryExecController.executeQuery);

// Provincias CRUD (lazy load controllers)
router.get('/provincias', verifyToken, requireAdmin, (req, res, next) => {
  const provinciaController = require('../controllers/provinciaController');
  provinciaController.list(req, res).catch(next);
});

router.post('/provincias', verifyToken, requireAdmin, (req, res, next) => {
  const provinciaController = require('../controllers/provinciaController');
  provinciaController.create(req, res).catch(next);
});

router.get('/provincias/:id/referencias', verifyToken, requireAdmin, (req, res, next) => {
  const provinciaController = require('../controllers/provinciaController');
  provinciaController.getReferencias(req, res).catch(next);
});

router.put('/provincias/:id', verifyToken, requireAdmin, (req, res, next) => {
  const provinciaController = require('../controllers/provinciaController');
  provinciaController.update(req, res).catch(next);
});

router.delete('/provincias/:id', verifyToken, requireAdmin, (req, res, next) => {
  const provinciaController = require('../controllers/provinciaController');
  provinciaController.delete(req, res).catch(next);
});

// Localidades CRUD (lazy load controllers)
router.get('/provincias/:id/localidades', verifyToken, requireAdmin, (req, res, next) => {
  const localidadController = require('../controllers/localidadController');
  localidadController.byProvincia(req, res).catch(next);
});

router.get('/localidades', verifyToken, requireAdmin, (req, res, next) => {
  const localidadController = require('../controllers/localidadController');
  localidadController.list(req, res).catch(next);
});

router.post('/localidades', verifyToken, requireAdmin, (req, res, next) => {
  const localidadController = require('../controllers/localidadController');
  localidadController.create(req, res).catch(next);
});

router.get('/localidades/:id/referencias', verifyToken, requireAdmin, (req, res, next) => {
  const localidadController = require('../controllers/localidadController');
  localidadController.getReferencias(req, res).catch(next);
});

router.put('/localidades/:id', verifyToken, requireAdmin, (req, res, next) => {
  const localidadController = require('../controllers/localidadController');
  localidadController.update(req, res).catch(next);
});

router.delete('/localidades/:id', verifyToken, requireAdmin, (req, res, next) => {
  const localidadController = require('../controllers/localidadController');
  localidadController.delete(req, res).catch(next);
});

module.exports = router;
