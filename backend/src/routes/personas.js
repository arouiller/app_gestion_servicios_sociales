const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const personasController = require('../controllers/v1.0/personasController');

// GET /api/personas?search=texto
// Búsqueda de personas
router.get('/', verifyToken, personasController.search);

// POST /api/personas
// Crear nueva persona
router.post('/', verifyToken, personasController.crear);

// PUT /api/personas/:personaId
// Actualizar persona
router.put('/:personaId', verifyToken, personasController.actualizar);

module.exports = router;
