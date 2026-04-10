const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
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

// GET /api/afiliados/me — perfil propio del usuario autenticado
router.get('/me', verifyToken, controller.me);

// GET /api/afiliados — listado paginado (solo admin)
router.get('/', verifyToken, requireAdmin, controller.listar);

// GET /api/afiliados/:id — detalle (solo admin)
router.get('/:id', verifyToken, requireAdmin, controller.obtener);

// POST /api/afiliados — crear (cualquier usuario autenticado)
router.post('/', verifyToken, validate(crearSchema), controller.crear);

// PUT /api/afiliados/:id — actualizar (propio o admin)
router.put('/:id', verifyToken, controller.actualizar);

// DELETE /api/afiliados/:id — eliminar (solo admin)
router.delete('/:id', verifyToken, requireAdmin, controller.eliminar);

module.exports = router;
