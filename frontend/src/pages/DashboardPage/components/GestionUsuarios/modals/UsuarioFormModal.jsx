import React, { useState } from 'react';
import './UsuarioFormModal.scss';

export default function UsuarioFormModal({ onSubmit, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(email);
    } catch (err) {
      setError(err.message || 'Error al crear usuario');
      setLoading(false);
    }
  };

  return (
    <div className="usuario-form-modal__overlay" onClick={onClose}>
      <div
        className="usuario-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="usuario-form-modal__title">Nuevo Usuario</h3>

        <form onSubmit={handleSubmit}>
          <div className="usuario-form-modal__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@example.com"
              disabled={loading}
            />
          </div>

          {error && <p className="usuario-form-modal__error">{error}</p>}

          <div className="usuario-form-modal__actions">
            <button
              type="submit"
              disabled={loading}
              className="usuario-form-modal__btn-submit"
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="usuario-form-modal__btn-cancel"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
