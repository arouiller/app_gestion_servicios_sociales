const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const planesController = require('../controllers/planesController');

// GET /api/planes?search=...&estado=ACTIVO&limit=10
// Búsqueda de planes por número de afiliado o nombre del titular
router.get('/', verifyToken, planesController.list);

// GET /api/planes/historial-cuota
// Historial global de cambios de cuota
router.get('/historial-cuota', verifyToken, planesController.getHistorialCuota);

// GET /api/planes/filter/:filtro
// Obtiene planes filtrados por tipo_plan, cobrador, os, estado
router.get('/filter/:filtro', verifyToken, planesController.filter);

// PATCH /api/planes/bulk-update-cuota
// Actualiza masivamente valor_cuota de planes
router.patch('/bulk-update-cuota', verifyToken, planesController.bulkUpdateCuota);

// GET /api/planes/count/:filtro
// Preview: cuenta de planes a ser afectados por filtro
router.get('/count/:filtro', verifyToken, planesController.countByFilter);

module.exports = router;
