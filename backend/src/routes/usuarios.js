const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/usuariosController');

const router = express.Router();

// GET /api/usuarios/:id
// Obtener datos del usuario actual
router.get('/:id', verifyToken, controller.obtener);

// PUT /api/usuarios/:id
// Actualizar datos del usuario (tema preferido)
router.put('/:id', verifyToken, controller.actualizar);

module.exports = router;
