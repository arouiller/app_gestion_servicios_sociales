const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validate');
const controller = require('../controllers/v1.0/planesController');

const router = express.Router();

const crearSchema = {
  tipo_plan_numero: [rules.required('El tipo de plan')],
  cobrador_numero: [rules.required('El cobrador')],
  tipo_de_grupo_numero: [rules.required('El tipo de grupo')],
  os_numero: [rules.required('La obra social')],
  numero_afiliado: [
    rules.required('El número de afiliado'),
    rules.minLength(1, 'El número de afiliado'),
    rules.maxLength(50, 'El número de afiliado'),
  ],
  valor_cuota: [rules.required('El valor de cuota')],
};

router.get('/', verifyToken, controller.listar);
router.get('/por-persona/:personaId', verifyToken, controller.getByPersona);
router.get('/numero-afiliado/max', verifyToken, controller.getMaxAfiliadoNumber);
router.get('/:planNumero/historial-cuota', verifyToken, controller.getHistorialCuota);
router.get('/:planNumero', verifyToken, controller.obtener);
router.post('/', verifyToken, validate(crearSchema), controller.crear);
router.put('/:planNumero', verifyToken, controller.actualizar);
router.delete('/:planNumero', verifyToken, controller.eliminar);

module.exports = router;
