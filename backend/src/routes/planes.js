const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const planesController = require('../controllers/planesController');

// GET /api/planes?estado=ACTIVO&limit=10
// Listado de planes pre-cargado
router.get('/', verifyToken, planesController.list);

// GET /api/planes/:id
// Obtiene detalle completo de un plan por ID
router.get('/:id', verifyToken, planesController.getById);

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
