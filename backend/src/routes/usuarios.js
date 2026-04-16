const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/usuariosController');

const router = express.Router();

// Middleware para verificar que el usuario es admin
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere rol admin' });
  }
  next();
};

// GET /api/usuarios
// Listar todos los usuarios (admin only)
router.get('/', verifyToken, requireAdmin, controller.list);

// POST /api/usuarios
// Crear nuevo usuario (admin only)
router.post('/', verifyToken, requireAdmin, controller.crear);

// PUT /api/usuarios/:id/rol
// Cambiar rol del usuario (admin only)
router.put('/:id/rol', verifyToken, requireAdmin, controller.cambiarRol);

// POST /api/usuarios/:id/blanquear-password
// Blanquear contraseña (admin only)
router.post('/:id/blanquear-password', verifyToken, requireAdmin, controller.blanquearPassword);

// GET /api/usuarios/:id
// Obtener datos del usuario actual
router.get('/:id', verifyToken, controller.obtener);

// PUT /api/usuarios/:id
// Actualizar datos del usuario (tema preferido)
router.put('/:id', verifyToken, controller.actualizar);

module.exports = router;
