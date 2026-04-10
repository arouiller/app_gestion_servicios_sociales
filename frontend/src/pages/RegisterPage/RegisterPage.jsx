import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.scss';

const INITIAL_FORM = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  confirmar_password: '',
};

// ── Utilidades de validación del cliente ──────────────────────────────────────

function getPasswordStrength(pw) {
  if (!pw) return null;
  const long = pw.length >= 12;
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = [pw.length >= 8, hasUpper, hasNumber, hasSpecial, long].filter(Boolean).length;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  return 'strong';
}

const STRENGTH_LABEL = { weak: 'Débil', fair: 'Regular', strong: 'Fuerte' };

function validateField(name, value, form) {
  switch (name) {
    case 'nombre':
    case 'apellido': {
      const label = name === 'nombre' ? 'El nombre' : 'El apellido';
      if (!value.trim()) return `${label} es requerido`;
      if (value.trim().length < 2) return `${label} debe tener al menos 2 caracteres`;
      return '';
    }
    case 'email':
      if (!value.trim()) return 'El email es requerido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
      return '';
    case 'password':
      if (!value) return 'La contraseña es requerida';
      if (value.length < 8) return 'Mínimo 8 caracteres';
      if (!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula';
      if (!/[0-9]/.test(value)) return 'Debe contener al menos un número';
      return '';
    case 'confirmar_password':
      if (!value) return 'Confirmá la contraseña';
      if (value !== form.password) return 'Las contraseñas no coinciden';
      return '';
    default:
      return '';
  }
}

function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pwStrength = getPasswordStrength(form.password);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Re-validar confirmar_password en tiempo real cuando cambia password
  useEffect(() => {
    if (touched.confirmar_password) {
      setErrors((e) => ({
        ...e,
        confirmar_password: validateField('confirmar_password', form.confirmar_password, form),
      }));
    }
  }, [form.password]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    setGlobalError('');

    if (touched[name]) {
      setErrors((err) => ({
        ...err,
        [name]: validateField(name, value, newForm),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((err) => ({
      ...err,
      [name]: validateField(name, value, form),
    }));
  };

  const validateAll = () => {
    const allErrors = {};
    for (const name of Object.keys(INITIAL_FORM)) {
      const err = validateField(name, form[name], form);
      if (err) allErrors[name] = err;
    }
    setErrors(allErrors);
    setTouched(Object.keys(INITIAL_FORM).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setLoading(true);
    setGlobalError('');

    try {
      await register(form);
      setSuccess(true);
      // Redirigir al login después de 2.5 s
      setTimeout(() => navigate('/login', { state: { registered: true } }), 2500);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setErrors((prev) => ({ ...prev, ...data.errors }));
        setGlobalError(data.message || 'Corregí los errores e intentá de nuevo');
      } else {
        setGlobalError(data?.message || 'Error al crear la cuenta. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page__bg-shape auth-page__bg-shape--1" />
        <div className="auth-page__bg-shape auth-page__bg-shape--2" />
        <div className="auth-card" style={{ maxWidth: 420, textAlign: 'center', gap: '1rem' }}>
          <div style={{ fontSize: 3.5 + 'rem', color: 'var(--color-secondary)' }}>
            <FiCheckCircle />
          </div>
          <h2 style={{ fontWeight: 800, color: 'var(--color-text)' }}>
            ¡Cuenta creada!
          </h2>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Tu cuenta fue creada exitosamente.
            <br />
            Redirigiendo al inicio de sesión...
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <div className="auth-submit__spinner" style={{ width: 24, height: 24, borderWidth: 3, borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
          </div>
        </div>
        <p className="auth-footer">
          GestSocial &copy; {new Date().getFullYear()}
        </p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg-shape auth-page__bg-shape--1" />
      <div className="auth-page__bg-shape auth-page__bg-shape--2" />
      <div className="auth-page__bg-shape auth-page__bg-shape--3" />

      <div className="auth-card" style={{ maxWidth: 480 }}>

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo__icon">GS</div>
          <span className="auth-logo__text">GestSocial</span>
        </div>

        {/* Encabezado */}
        <div className="auth-header">
          <h1 className="auth-header__title">Crear cuenta</h1>
          <p className="auth-header__subtitle">
            Completá el formulario para registrarte en el sistema.
          </p>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="auth-alert auth-alert--error">
            <FiAlertCircle className="auth-alert__icon" />
            <span className="auth-alert__text">{globalError}</span>
            <button className="auth-alert__close" onClick={() => setGlobalError('')}>&times;</button>
          </div>
        )}

        {/* Formulario */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Nombre y Apellido */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label" htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="given-name"
                className={`form-group__input${errors.nombre && touched.nombre ? ' form-group__input--error' : ''}`}
                placeholder="Juan"
                value={form.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              {errors.nombre && touched.nombre && (
                <span className="form-group__error"><FiAlertCircle size={12} /> {errors.nombre}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-group__label" htmlFor="apellido">Apellido</label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                autoComplete="family-name"
                className={`form-group__input${errors.apellido && touched.apellido ? ' form-group__input--error' : ''}`}
                placeholder="Pérez"
                value={form.apellido}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              {errors.apellido && touched.apellido && (
                <span className="form-group__error"><FiAlertCircle size={12} /> {errors.apellido}</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-group__label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`form-group__input${errors.email && touched.email ? ' form-group__input--error' : ''}`}
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
            {errors.email && touched.email && (
              <span className="form-group__error"><FiAlertCircle size={12} /> {errors.email}</span>
            )}
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label className="form-group__label" htmlFor="password">Contraseña</label>
            <div className="form-group__input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`form-group__input form-group__input--with-icon${errors.password && touched.password ? ' form-group__input--error' : ''}`}
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              <button
                type="button"
                className="form-group__toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password && touched.password && (
              <span className="form-group__error"><FiAlertCircle size={12} /> {errors.password}</span>
            )}
            {/* Indicador de fortaleza */}
            {form.password && (
              <div className="pw-strength">
                <div className="pw-strength__bars">
                  {['weak', 'fair', 'strong'].map((level, i) => {
                    const levels = { weak: 1, fair: 2, strong: 3 };
                    const currentLevel = levels[pwStrength] || 0;
                    const isActive = i < currentLevel;
                    return (
                      <div
                        key={level}
                        className={`pw-strength__bar${isActive ? ` pw-strength__bar--active-${pwStrength}` : ''}`}
                      />
                    );
                  })}
                </div>
                <span className={`pw-strength__label pw-strength__label--${pwStrength}`}>
                  {STRENGTH_LABEL[pwStrength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="form-group">
            <label className="form-group__label" htmlFor="confirmar_password">Confirmá la contraseña</label>
            <div className="form-group__input-wrap">
              <input
                id="confirmar_password"
                name="confirmar_password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={`form-group__input form-group__input--with-icon${errors.confirmar_password && touched.confirmar_password ? ' form-group__input--error' : ''}`}
                placeholder="Repetí la contraseña"
                value={form.confirmar_password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              <button
                type="button"
                className="form-group__toggle-pw"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
              >
                {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.confirmar_password && touched.confirmar_password && (
              <span className="form-group__error"><FiAlertCircle size={12} /> {errors.confirmar_password}</span>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <><span className="auth-submit__spinner" /> Creando cuenta...</>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        {/* Link a login */}
        <p className="auth-switch">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login">Iniciá sesión</Link>
        </p>

        <Link to="/" className="auth-back">
          &larr; Volver al inicio
        </Link>
      </div>

      <p className="auth-footer">
        GestSocial &copy; {new Date().getFullYear()} · Sistema de gestión de servicios sociales
      </p>
    </div>
  );
}

export default RegisterPage;
