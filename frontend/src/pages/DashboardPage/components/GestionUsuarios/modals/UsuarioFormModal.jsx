import React, { useState, useCallback, useMemo } from 'react';
import ConfirmCloseDialog from '../../../../../components/ConfirmCloseDialog/ConfirmCloseDialog';
import { useModalEscapeKey } from '../../../../../hooks/useModalEscapeKey';
import './UsuarioFormModal.scss';

export default function UsuarioFormModal({ onSubmit, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const hasChanges = useMemo(() => email !== '', [email]);

  const handleEscapeWithChanges = useCallback(() => {
    setShowConfirmClose(true);
  }, []);

  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    onClose?.();
  }, [onClose]);

  const handleCancelClose = useCallback(() => {
    setShowConfirmClose(false);
  }, []);

  useModalEscapeKey(true, hasChanges, onClose, hasChanges ? handleEscapeWithChanges : undefined);

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
    <>
      <div className="usuario-form-modal__overlay">
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
              onClick={() => {
                if (hasChanges) {
                  setShowConfirmClose(true);
                } else {
                  onClose?.();
                }
              }}
              disabled={loading}
              className="usuario-form-modal__btn-cancel"
            >
              Cancelar
            </button>
          </div>
        </form>
        </div>
      </div>

      <ConfirmCloseDialog
        isOpen={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title="¿Cerrar sin guardar?"
      />
    </>
  );
}
