/**
 * Reglas de validación reutilizables
 */
const rules = {
  required: (label) => (val) =>
    !val || String(val).trim() === '' ? `${label} es requerido` : null,

  minLength: (min, label) => (val) =>
    !val || String(val).trim().length < min
      ? `${label} debe tener al menos ${min} caracteres`
      : null,

  maxLength: (max, label) => (val) =>
    val && String(val).trim().length > max
      ? `${label} no puede superar los ${max} caracteres`
      : null,

  email: () => (val) =>
    !val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim())
      ? 'El email no tiene un formato válido'
      : null,

  password: () => (val) => {
    if (!val) return 'La contraseña es requerida';
    if (val.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(val)) return 'La contraseña debe contener al menos una mayúscula';
    if (!/[0-9]/.test(val)) return 'La contraseña debe contener al menos un número';
    return null;
  },

  match: (fieldName, label) => (val, body) =>
    val !== body[fieldName] ? `${label} no coincide` : null,

  numeric: (label) => (val) =>
    val && !/^\d+$/.test(String(val).trim())
      ? `${label} debe contener solo números`
      : null,
};

/**
 * Middleware factory: valida req.body con un esquema de reglas
 *
 * Uso:
 *   router.post('/register', validate({
 *     nombre:   [rules.required('Nombre'), rules.minLength(2, 'Nombre')],
 *     email:    [rules.required('Email'), rules.email()],
 *     password: [rules.password()],
 *   }), handler)
 */
const validate = (schema) => (req, res, next) => {
  const errors = {};

  for (const [field, checks] of Object.entries(schema)) {
    const value = req.body[field];
    for (const check of checks) {
      const error = check(value, req.body);
      if (error) {
        errors[field] = error;
        break; // un error por campo
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Datos inválidos',
      errors,
    });
  }

  next();
};

module.exports = { validate, rules };
