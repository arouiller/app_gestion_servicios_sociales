import React from 'react';
import './ConfirmDeletePeriodoRecibosModal.scss';

/**
 * Modal de confirmación para eliminar todos los recibos de un período
 *
 * Props:
 * - isOpen: boolean - si modal está visible
 * - periodo: string - período en formato YYYY-MM (ej: "2026-04")
 * - cantidad: number - cantidad de recibos a eliminar
 * - onConfirm: function - callback cuando usuario confirma
 * - onCancel: function - callback cuando usuario cancela
 * - isLoading: boolean - si está en proceso de eliminación
 * - error: string - mensaje de error si la eliminación falló
 */
function ConfirmDeletePeriodoRecibosModal({
  isOpen,
  periodo,
  cantidad,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}) {
  if (!isOpen) return null;

  // Formatear período YYYY-MM a texto legible
  const formatPeriodo = (periodoStr) => {
    if (!periodoStr || periodoStr.length < 7) return '';
    const [anio, mesNum] = periodoStr.substring(0, 7).split('-');
    const nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${nombres[parseInt(mesNum, 10) - 1]} ${anio}`;
  };

  const pluralRecibos = cantidad === 1 ? 'recibo' : 'recibos';

  return (
    <>
      {isOpen && (
        <div className="confirm-delete-backdrop" onClick={onCancel} />
      )}
      <div className={`confirm-delete-modal${isOpen ? ' confirm-delete-modal--open' : ''}`}>
        <div className="confirm-delete-modal__header">
          <h2 className="confirm-delete-modal__title">
            ⚠️ ¿Eliminar recibos?
          </h2>
          <button
            className="confirm-delete-modal__close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="confirm-delete-modal__body">
          <div className="confirm-delete-modal__info-block">
            <div className="confirm-delete-modal__info-item">
              <strong>Período:</strong> {formatPeriodo(periodo)}
            </div>
            <div className="confirm-delete-modal__info-item">
              <strong>Cantidad:</strong> {cantidad} {pluralRecibos}
            </div>
          </div>

          <div className="confirm-delete-modal__alert">
            <p className="confirm-delete-modal__warning">
              ⚠️ Esta acción no se puede deshacer.
            </p>
          </div>

          {error && (
            <div className="confirm-delete-modal__error">
              <p>❌ Error: {error}</p>
            </div>
          )}
        </div>

        <div className="confirm-delete-modal__footer">
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmDeletePeriodoRecibosModal;
