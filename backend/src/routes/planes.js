const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validate');
const controller = require('../controllers/planesController');

const router = express.Router();

const crearSchema = {
  nombre: [
    rules.required('El nombre del plan'),
    rules.minLength(2, 'El nombre del plan'),
    rules.maxLength(150, 'El nombre del plan'),
  ],
  precio_mensual: [
    rules.required('El precio mensual'),
  ],
};

router.get('/', verifyToken, controller.listar);
router.get('/:id', verifyToken, controller.obtener);
router.post('/', verifyToken, requireAdmin, validate(crearSchema), controller.crear);
router.put('/:id', verifyToken, requireAdmin, controller.actualizar);
router.delete('/:id', verifyToken, requireAdmin, controller.eliminar);

module.exports = router;
