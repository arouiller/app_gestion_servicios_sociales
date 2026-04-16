const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * GET /api/usuarios
 * Listar todos los usuarios (admin only)
 */
exports.list = async (req, res, next) => {
  try {
    const usuarios = await db.Usuario.findAll({
      attributes: ['id', 'email', 'nombre', 'apellido', 'rol', 'password_blanqueada', 'fecha_creacion'],
      order: [['fecha_creacion', 'DESC']],
    });

    return res.json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/usuarios
 * Crear nuevo usuario (admin only)
 * Body: { email }
 */
exports.crear = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email es requerido' });
    }

    // Validar email único
    const usuarioExistente = await db.Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ success: false, message: 'Email ya existe' });
    }

    // Crear usuario con password temporal (blanqueada)
    const passwordTemporal = Math.random().toString(36).substring(2, 15);
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    const usuario = await db.Usuario.create({
      email,
      nombre: 'JOHN',
      apellido: 'DOE',
      password_hash: passwordHash,
      rol: 'usuario',
      password_blanqueada: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        password_blanqueada: usuario.password_blanqueada,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/usuarios/:id/rol
 * Cambiar rol del usuario (admin only)
 * Body: { rol: 'admin' | 'usuario' }
 */
exports.cambiarRol = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!rol || !['admin', 'usuario'].includes(rol)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }

    const usuario = await db.Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Prevenir que se elimine el último admin
    if (usuario.rol === 'admin' && rol !== 'admin') {
      const adminCount = await db.Usuario.count({ where: { rol: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'No se puede eliminar el último admin' });
      }
    }

    await usuario.update({ rol });

    return res.json({
      success: true,
      message: 'Rol actualizado correctamente',
      data: { id: usuario.id, email: usuario.email, rol: usuario.rol },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/usuarios/:id/blanquear-password
 * Blanquear contraseña del usuario (admin only)
 */
exports.blanquearPassword = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await db.Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Generar password temporal
    const passwordTemporal = Math.random().toString(36).substring(2, 15);
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    await usuario.update({
      password: passwordHash,
      password_blanqueada: true,
    });

    return res.json({
      success: true,
      message: 'Contraseña blanqueada correctamente',
      data: { id: usuario.id, email: usuario.email, password_blanqueada: usuario.password_blanqueada },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/password-reset
 * Cambiar contraseña (para usuarios con password_blanqueada o reset)
 * Body: { email, password_nueva }
 * (En flujo real sería con token, aquí simplificado para demo)
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, password_nueva } = req.body;

    if (!email || !password_nueva) {
      return res.status(400).json({ success: false, message: 'Email y nueva contraseña son requeridos' });
    }

    const usuario = await db.Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (!usuario.password_blanqueada) {
      return res.status(400).json({ success: false, message: 'Usuario no requiere cambio de contraseña' });
    }

    const passwordHash = await bcrypt.hash(password_nueva, 10);

    await usuario.update({
      password: passwordHash,
      password_blanqueada: false,
    });

    return res.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
      data: { id: usuario.id, email: usuario.email },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/usuarios/:id
 * Actualizar datos del usuario (tema preferido)
 */
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tema_preferido } = req.body;

    // Validar que el usuario existe
    const usuario = await db.Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Validar tema si se proporciona
    const temasValidos = ['claro', 'oscuro', 'azul', 'verde'];
    if (tema_preferido && !temasValidos.includes(tema_preferido)) {
      return res.status(400).json({
        success: false,
        message: 'Tema inválido. Temas válidos: claro, oscuro, azul, verde',
      });
    }

    // Actualizar solo los campos permitidos
    const camposPermitidos = ['tema_preferido'];
    const actualizaciones = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        actualizaciones[campo] = req.body[campo];
      }
    });

    if (Object.keys(actualizaciones).length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    await usuario.update(actualizaciones);

    return res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: usuario.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/usuarios/:id
 * Obtener datos del usuario actual
 */
exports.obtener = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await db.Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({
      success: true,
      data: usuario.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
