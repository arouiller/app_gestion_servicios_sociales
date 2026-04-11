/**
 * Rutas de grupos familiares.
 * Todas las rutas requieren autenticación de empleado (verifyToken).
 * Solo DELETE de afiliados requiere requireAdmin.
 */

const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/gruposController');
const historialController = require('../controllers/historialController');

const router = express.Router();

router.use(verifyToken);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.put('/:id', controller.actualizar);
router.post('/:id/desvincular/:afiliadoId', controller.desvincular);
router.get('/:id/historial', historialController.listarHistorial);

module.exports = router;
