import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.scss';

const INITIAL_FORM = { email: '', password: '' };

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  // Mensaje si la sesión expiró
  const sessionExpired = new URLSearchParams(location.search).get('expired') === '1';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.password) e.password = 'La contraseña es requerida';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: '' }));
    setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

    setLoading(true);
    setGlobalError('');

    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
        setGlobalError(data.message || 'Credenciales incorrectas');
      } else {
        setGlobalError(data?.message || 'Error al iniciar sesión. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg-shape auth-page__bg-shape--1" />
      <div className="auth-page__bg-shape auth-page__bg-shape--2" />
      <div className="auth-page__bg-shape auth-page__bg-shape--3" />

      <div className="auth-card" style={{ maxWidth: 420 }}>

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo__icon">GS</div>
          <span className="auth-logo__text">GestSocial</span>
        </div>

        {/* Encabezado */}
        <div className="auth-header">
          <h1 className="auth-header__title">Iniciar sesión</h1>
          <p className="auth-header__subtitle">
            Ingresá con tu email y contraseña para acceder al sistema.
          </p>
        </div>

        {/* Alerta sesión expirada */}
        {sessionExpired && !globalError && (
          <div className="auth-alert auth-alert--error">
            <FiAlertCircle className="auth-alert__icon" />
            <span className="auth-alert__text">Tu sesión expiró. Por favor ingresá nuevamente.</span>
          </div>
        )}

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

          {/* Email */}
          <div className="form-group">
            <label className="form-group__label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`form-group__input${errors.email ? ' form-group__input--error' : ''}`}
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.email && (
              <span className="form-group__error">
                <FiAlertCircle size={12} /> {errors.email}
              </span>
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
                autoComplete="current-password"
                className={`form-group__input form-group__input--with-icon${errors.password ? ' form-group__input--error' : ''}`}
                placeholder="Tu contraseña"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
              />
              <button
                type="button"
                className="form-group__toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="form-group__error">
                <FiAlertCircle size={12} /> {errors.password}
              </span>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <><span className="auth-submit__spinner" /> Ingresando...</>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        {/* Link a registro */}
        <p className="auth-switch">
          ¿No tenés cuenta?{' '}
          <Link to="/register">Crear una cuenta</Link>
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

export default LoginPage;
