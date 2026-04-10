import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import authService from '../../../../services/authService';
import './DatosPersonales.scss';

function DatosPersonales() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    password_actual: '',
    password_nueva: '',
    confirmar_password: '',
  });

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [cambiarPassword, setCambiarPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setErrores({});

    const payload = {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
    };

    if (cambiarPassword) {
      payload.password_actual = form.password_actual;
      payload.password_nueva = form.password_nueva;
      payload.confirmar_password = form.confirmar_password;
    }

    try {
      const data = await authService.updatePerfil(payload);
      updateUser(data.user);
      setMensaje({ tipo: 'success', texto: data.message });
      if (cambiarPassword) {
        setForm((prev) => ({ ...prev, password_actual: '', password_nueva: '', confirmar_password: '' }));
        setCambiarPassword(false);
      }
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) {
        setErrores(res.errors);
      } else {
        setMensaje({ tipo: 'error', texto: res?.message || 'Error al actualizar el perfil.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="datos-personales">
      <div className="datos-personales__header">
        <div className="datos-personales__avatar">{initials}</div>
        <div>
          <h2 className="datos-personales__title">Datos Personales</h2>
          <p className="datos-personales__subtitle">
            Actualizá tu información de cuenta
          </p>
        </div>
      </div>

      {mensaje && (
        <div className={`datos-personales__alert datos-personales__alert--${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <form className="datos-personales__form" onSubmit={handleSubmit} noValidate>
        <div className="datos-personales__section-label">Información personal</div>

        <div className="datos-personales__grid">
          <div className="datos-personales__field">
            <label>Nombre *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              maxLength={100}
            />
            {errores.nombre && <span className="datos-personales__error">{errores.nombre}</span>}
          </div>

          <div className="datos-personales__field">
            <label>Apellido *</label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              maxLength={100}
            />
            {errores.apellido && <span className="datos-personales__error">{errores.apellido}</span>}
          </div>

          <div className="datos-personales__field datos-personales__field--full">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              maxLength={255}
            />
            {errores.email && <span className="datos-personales__error">{errores.email}</span>}
          </div>
        </div>

        <div className="datos-personales__divider" />

        <div className="datos-personales__section-label">
          Contraseña
          <button
            type="button"
            className="datos-personales__toggle-pass"
            onClick={() => {
              setCambiarPassword((v) => !v);
              setErrores({});
            }}
          >
            {cambiarPassword ? 'Cancelar cambio' : 'Cambiar contraseña'}
          </button>
        </div>

        {cambiarPassword && (
          <div className="datos-personales__grid">
            <div className="datos-personales__field datos-personales__field--full">
              <label>Contraseña actual *</label>
              <input
                type="password"
                name="password_actual"
                value={form.password_actual}
                onChange={handleChange}
                autoComplete="current-password"
              />
              {errores.password_actual && (
                <span className="datos-personales__error">{errores.password_actual}</span>
              )}
            </div>

            <div className="datos-personales__field">
              <label>Nueva contraseña *</label>
              <input
                type="password"
                name="password_nueva"
                value={form.password_nueva}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errores.password_nueva && (
                <span className="datos-personales__error">{errores.password_nueva}</span>
              )}
              <span className="datos-personales__hint">Mín. 8 caracteres, una mayúscula y un número</span>
            </div>

            <div className="datos-personales__field">
              <label>Confirmar nueva contraseña *</label>
              <input
                type="password"
                name="confirmar_password"
                value={form.confirmar_password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errores.confirmar_password && (
                <span className="datos-personales__error">{errores.confirmar_password}</span>
              )}
            </div>
          </div>
        )}

        <div className="datos-personales__actions">
          <button
            type="submit"
            className="datos-personales__btn datos-personales__btn--primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <div className="datos-personales__meta">
        <div className="datos-personales__meta-item">
          <span className="datos-personales__meta-label">Rol</span>
          <span className={`datos-personales__badge datos-personales__badge--${user?.rol}`}>
            {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
          </span>
        </div>
        <div className="datos-personales__meta-item">
          <span className="datos-personales__meta-label">Estado</span>
          <span className="datos-personales__badge datos-personales__badge--activo">Activo</span>
        </div>
      </div>
    </div>
  );
}

export default DatosPersonales;
