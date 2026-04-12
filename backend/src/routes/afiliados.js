const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validate');
const controller = require('../controllers/afiliadosController');

const router = express.Router();

// ── Esquemas de validación ───────────────────────────────────────────────────

const crearSchema = {
  nombre: [
    rules.required('El nombre'),
    rules.minLength(2, 'El nombre'),
    rules.maxLength(100, 'El nombre'),
  ],
  apellido: [
    rules.required('El apellido'),
    rules.minLength(2, 'El apellido'),
    rules.maxLength(100, 'El apellido'),
  ],
  tipo_documento: [
    rules.required('El tipo de documento'),
  ],
  numero_documento: [
    rules.required('El número de documento'),
    rules.minLength(6, 'El número de documento'),
    rules.maxLength(20, 'El número de documento'),
  ],
};

// ── Rutas ────────────────────────────────────────────────────────────────────

// GET /api/afiliados — listado paginado (cualquier empleado)
router.get('/', verifyToken, controller.listar);

// GET /api/afiliados/:id — detalle (cualquier empleado)
router.get('/:id', verifyToken, controller.obtener);

// POST /api/afiliados — crear (cualquier empleado)
router.post('/', verifyToken, validate(crearSchema), controller.crear);

// PUT /api/afiliados/:id — actualizar (cualquier empleado)
router.put('/:id', verifyToken, controller.actualizar);

// DELETE /api/afiliados/:id — eliminar (cualquier empleado)
router.delete('/:id', verifyToken, controller.eliminar);

module.exports = router;
