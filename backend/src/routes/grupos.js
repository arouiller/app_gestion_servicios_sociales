/**
 * Rutas de grupos familiares.
 * GET  /api/grupos-familiares/:id/historial    — cualquier usuario autenticado
 * GET  /api/grupos-familiares                  — admin only
 * GET  /api/grupos-familiares/:id              — admin only
 * PUT  /api/grupos-familiares/:id              — admin only
 * POST /api/grupos-familiares/:id/desvincular/:afiliadoId  — admin only
 */

const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/gruposController');
const historialController = require('../controllers/historialController');

const router = express.Router();

// Rutas accesibles a cualquier usuario autenticado (antes del middleware admin)
router.get('/:id/historial', verifyToken, historialController.listarHistorial);

// Rutas solo admin
router.use(verifyToken, requireAdmin);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.put('/:id', controller.actualizar);
router.post('/:id/desvincular/:afiliadoId', controller.desvincular);

module.exports = router;
