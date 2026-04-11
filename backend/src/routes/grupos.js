/**
 * Rutas de grupos familiares — solo accesibles para admin.
 * GET  /api/grupos-familiares        Lista todos los grupos con su titular
 * GET  /api/grupos-familiares/:id    Detalle del grupo con todos sus miembros
 * PUT  /api/grupos-familiares/:id    Actualiza nombre o estado del grupo
 */

const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/gruposController');

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.put('/:id', controller.actualizar);

module.exports = router;
