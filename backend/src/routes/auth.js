const express = require('express');
const { verifyToken, generateToken } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validate');
const Usuario = require('../models/Usuario');

const router = express.Router();

// ── Esquemas de validación ───────────────────────────────────────────────────

const registerSchema = {
  nombre: [rules.required('El nombre'), rules.minLength(2, 'El nombre'), rules.maxLength(100, 'El nombre')],
  apellido: [rules.required('El apellido'), rules.minLength(2, 'El apellido'), rules.maxLength(100, 'El apellido')],
  email: [rules.required('El email'), rules.email()],
  password: [rules.password()],
  confirmar_password: [rules.required('La confirmación de contraseña'), rules.match('password', 'La confirmación de contraseña')],
};

const loginSchema = {
  email: [rules.required('El email'), rules.email()],
  password: [rules.required('La contraseña')],
};

// ── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', validate(registerSchema), async (req, res) => {
  const { nombre, apellido, email, password } = req.body;

  // Verificar email único
  const existente = await Usuario.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existente) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe una cuenta con ese email',
      errors: { email: 'Ya existe una cuenta con ese email' },
    });
  }

  // Hashear contraseña y crear usuario
  const password_hash = await Usuario.hashPassword(password);

  const usuario = await Usuario.create({
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    email: email.toLowerCase().trim(),
    password_hash,
    rol: 'usuario',
    estado: 'activo',
  });

  return res.status(201).json({
    success: true,
    message: 'Cuenta creada exitosamente. Ya podés iniciar sesión.',
    user: usuario.toSafeJSON(),
  });
});

// ── POST /api/auth/login ────────────────────────────────────────────────────

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  // Buscar usuario
  const usuario = await Usuario.findOne({ where: { email: email.toLowerCase().trim() } });

  // Respuesta genérica para no revelar si el email existe
  const credencialesInvalidas = {
    success: false,
    message: 'Email o contraseña incorrectos',
    errors: { general: 'Email o contraseña incorrectos' },
  };

  if (!usuario) return res.status(401).json(credencialesInvalidas);

  // Verificar que tiene contraseña (podría ser un usuario OAuth sin password)
  if (!usuario.password_hash) {
    return res.status(401).json({
      success: false,
      message: 'Esta cuenta no tiene contraseña configurada',
    });
  }

  const passwordValida = await usuario.verificarPassword(password);
  if (!passwordValida) return res.status(401).json(credencialesInvalidas);

  // Verificar estado de la cuenta
  if (usuario.estado !== 'activo') {
    return res.status(403).json({
      success: false,
      message: 'Tu cuenta está suspendida. Contactá al administrador.',
    });
  }

  await Usuario.registrarLogin(usuario.id).catch(() => {});

  const token = generateToken(usuario.toSafeJSON());

  return res.json({
    success: true,
    message: 'Sesión iniciada correctamente',
    user: usuario.toSafeJSON(),
    jwt: token,
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────

router.get('/me', verifyToken, async (req, res) => {
  const usuario = await Usuario.findByPk(req.userId, {
    attributes: { exclude: ['password_hash'] },
  });

  if (!usuario) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  return res.json({ success: true, data: usuario });
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────

router.post('/logout', verifyToken, (req, res) => {
  // JWT es stateless: el cliente elimina el token
  return res.json({ success: true, message: 'Sesión cerrada correctamente' });
});

module.exports = router;
