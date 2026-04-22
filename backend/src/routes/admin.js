const express = require('express');
const { ConfiguracionApp } = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Tipos de notificación y configuración válidos
const VALID_TYPES = ['error', 'warning', 'success', 'info', 'debounce_delay_ms', 'items_per_page'];

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
      if (duracion_ms < 5 || duracion_ms > 100) {
        return res.status(400).json({
          success: false,
          message: 'items_per_page debe estar entre 5 y 100',
        });
      }
    } else if (tipo === 'debounce_delay_ms') {
      if (duracion_ms < 100 || duracion_ms > 10000) {
        return res.status(400).json({
          success: false,
          message: 'debounce_delay_ms debe estar entre 100 y 10000 ms',
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

module.exports = router;
