const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/v1.0/planIntegrantesController');

const router = express.Router();

// Obtener integrantes de un plan (requiere auth)
router.get('/plan/:planNumero', verifyToken, controller.obtenerPorPlan);

// CRUD operations (requieren admin)
router.post('/', verifyToken, requireAdmin, controller.crear);
router.put('/:id', verifyToken, requireAdmin, controller.actualizar);
router.delete('/:id', verifyToken, requireAdmin, controller.eliminar);
router.post('/reorder', verifyToken, requireAdmin, controller.reorder);

module.exports = router;
