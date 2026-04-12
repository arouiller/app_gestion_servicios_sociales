import React from 'react';
import '../styles/PreviewModal.scss';

function PreviewModal({ isOpen, preview, onConfirm, onCancel, isLoading }) {
  if (!isOpen || !preview) return null;

  const { version, direction, sql, description, nextVersion } = preview;

  const directionLabel = direction === 'upgrade' ? '↑ Upgrade' : '↓ Downgrade';
  const actionLabel = direction === 'upgrade' ? 'Aplicar' : 'Revertir';

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal">
        <div className="preview-modal__header">
          <h2>{directionLabel}</h2>
          <button
            className="preview-modal__close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="preview-modal__content">
          <div className="preview-modal__info">
            <p>
              <strong>Versión actual:</strong> {version}
              {nextVersion && ` → ${nextVersion}`}
            </p>
            <p>
              <strong>Descripción:</strong> {description}
            </p>
          </div>

          <div className="preview-modal__sql-container">
            <h3>SQL a ejecutar:</h3>
            <pre className="preview-modal__sql">
              <code>{sql}</code>
            </pre>
          </div>
        </div>

        <div className="preview-modal__footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(direction)}
            disabled={isLoading}
          >
            {isLoading ? 'Ejecutando...' : `Confirmar ${actionLabel}`}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="preview-modal__loading-overlay" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          <p>Aplicando migración...</p>
        </div>
      )}
    </div>
  );
}

export default PreviewModal;
