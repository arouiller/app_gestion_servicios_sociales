import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ChangePasswordRequired.scss';
import usuariosService from '../../services/usuariosService';

export default function ChangePasswordRequired() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Obtener email del estado de navegación
  useEffect(() => {
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !passwordNueva || !passwordConfirm) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (passwordNueva !== passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordNueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await usuariosService.resetPassword(email, passwordNueva);
      // Redirigir a login con email pre-cargado
      navigate('/login', {
        state: {
          message: 'Contraseña actualizada. Por favor, inicia sesión nuevamente.',
          email: email
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
      setLoading(false);
    }
  };

  return (
    <div className="change-password-required">
      <div className="change-password-required__container">
        <h1 className="change-password-required__title">
          Cambiar Contraseña Requerido
        </h1>
        <p className="change-password-required__subtitle">
          Es tu primer acceso. Por favor, establece una nueva contraseña.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="change-password-required__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="tu@email.com"
              disabled={true}
              title="El email no puede ser modificado"
            />
          </div>

          <div className="change-password-required__field">
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              id="password"
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              placeholder="Contraseña"
              disabled={loading}
            />
          </div>

          <div className="change-password-required__field">
            <label htmlFor="confirm">Confirmar Contraseña</label>
            <input
              id="confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirmar contraseña"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="change-password-required__error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="change-password-required__btn-submit"
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
