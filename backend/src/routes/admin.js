const express = require('express');
const { ConfiguracionApp } = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Tipos de notificación y configuración válidos
const VALID_TYPES = ['error', 'warning', 'success', 'info', 'debounce_delay_ms'];

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

    if (duracion_ms === undefined || duracion_ms < 0) {
      return res.status(400).json({
        success: false,
        message: 'duracion_ms debe ser un número >= 0',
      });
    }

    // Validar que tipo_notificacion sea válido
    if (!VALID_TYPES.includes(req.params.tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de notificación inválido. Valores permitidos: ${VALID_TYPES.join(', ')}`,
      });
    }

    const config = await ConfiguracionApp.findOne({
      where: { tipo_notificacion: req.params.tipo },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Tipo de notificación '${req.params.tipo}' no existe`,
      });
    }

    await config.update({ duracion_ms });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
