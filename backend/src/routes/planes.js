const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const planesController = require('../controllers/planesController');

// GET /api/planes/filter/:filtro
// Obtiene planes filtrados por tipo_plan, cobrador, os, estado
router.get('/filter/:filtro', verifyToken, planesController.filter);

// PATCH /api/planes/bulk-update-cuota
// Actualiza masivamente valor_cuota de planes (admin only)
router.patch('/bulk-update-cuota', verifyToken, requireAdmin, planesController.bulkUpdateCuota);

// GET /api/planes/count/:filtro
// Preview: cuenta de planes a ser afectados por filtro
router.get('/count/:filtro', verifyToken, planesController.countByFilter);

module.exports = router;
