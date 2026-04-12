const express = require('express');
const { verifyToken } = require('../middleware/auth');
const planesController = require('../controllers/planesController');

const router = express.Router();

// ── Middleware: Verificar token en todas las rutas ──────────────────────────────
router.use(verifyToken);

// ── GET /api/planes/siguiente-numero-afiliado ────────────────────────────────
// IMPORTANTE: Registrar ANTES que GET /api/planes/:id
router.get('/siguiente-numero-afiliado', planesController.obtenerSiguienteNumeroAfiliado);

// ── GET /api/planes ──────────────────────────────────────────────────────────
router.get('/', planesController.list);

// ── POST /api/planes ─────────────────────────────────────────────────────────
router.post('/', planesController.create);

// ── GET /api/planes/:id ──────────────────────────────────────────────────────
router.get('/:id', planesController.detail);

// ── PUT /api/planes/:id ──────────────────────────────────────────────────────
router.put('/:id', planesController.update);

// ── DELETE /api/planes/:id ──────────────────────────────────────────────────
router.delete('/:id', planesController.delete);

module.exports = router;
