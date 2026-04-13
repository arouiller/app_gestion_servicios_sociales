const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const personasController = require('../controllers/v1.0/personasController');

// GET /api/personas?search=texto
// Búsqueda de personas
router.get('/', verifyToken, personasController.search);

// GET /api/personas/listar?page=1&limit=10&search=texto
// Listar personas con paginación
router.get('/listar', verifyToken, personasController.listar);

// POST /api/personas
// Crear nueva persona (admin only)
router.post('/', verifyToken, requireAdmin, personasController.crear);

// PUT /api/personas/:personaId
// Actualizar persona (admin only)
router.put('/:personaId', verifyToken, requireAdmin, personasController.actualizar);

module.exports = router;
