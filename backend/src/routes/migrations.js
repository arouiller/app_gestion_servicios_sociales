/**
 * Rutas de migraciones — solo accesibles para admin.
 * GET  /api/migrations          Lista todas las migraciones y su estado
 * GET  /api/migrations/stats    Versión actual + conteo de registros por tabla
 * GET  /api/migrations/history  Historial completo de eventos
 * POST /api/migrations/up       Aplica la siguiente migración pendiente
 * POST /api/migrations/down     Revierte la última migración aplicada
 */

const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const manager = require('../migrations/migrationManager');

const router = express.Router();

router.use(verifyToken, requireAdmin);

// GET /api/migrations
router.get('/', async (req, res) => {
  const migrations = await manager.list();
  res.json({ success: true, data: migrations });
});

// GET /api/migrations/stats
router.get('/stats', async (req, res) => {
  const stats = await manager.getDbStats();
  res.json({ success: true, data: stats });
});

// GET /api/migrations/history
router.get('/history', async (req, res) => {
  const history = await manager.getHistory();
  res.json({ success: true, data: history });
});

// POST /api/migrations/up
router.post('/up', async (req, res) => {
  const result = await manager.upgrade();
  if (!result) {
    return res.json({ success: true, message: 'No hay migraciones pendientes.', data: null });
  }
  res.json({ success: true, message: `Migración ${result.version} aplicada correctamente.`, data: result });
});

// POST /api/migrations/down
router.post('/down', async (req, res) => {
  const result = await manager.downgrade();
  if (!result) {
    return res.json({ success: true, message: 'No hay migraciones para revertir.', data: null });
  }
  res.json({ success: true, message: `Migración ${result.version} revertida correctamente.`, data: result });
});

module.exports = router;
