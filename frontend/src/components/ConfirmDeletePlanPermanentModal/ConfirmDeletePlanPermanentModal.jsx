import React from 'react';
import './ConfirmDeletePlanPermanentModal.scss';

/**
 * Modal de confirmación para eliminar plan permanentemente
 *
 * Props:
 * - isOpen: boolean - si modal está visible
 * - plan: object - plan con { plan_numero, numero_afiliado, zona: { codigo }, titular: { apellido, nombre } }
 * - onConfirm: async function - callback cuando usuario confirma eliminación
 * - onCancel: function - callback cuando usuario cancela (vuelve a modal 1)
 * - isLoading: boolean - si está en proceso de eliminación
 * - error: string - mensaje de error si la eliminación falló
 */
function ConfirmDeletePlanPermanentModal({
  isOpen,
  plan,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}) {
  if (!isOpen || !plan) return null;

  const formatIdentificador = () => {
    if (!plan.Zona || !plan.numero_afiliado) return 'Plan';
    const zonaCode = String(plan.Zona.codigo).padStart(2, '0');
    return `${zonaCode}-${plan.numero_afiliado}`;
  };

  const formatTitular = () => {
    const persona = plan.PlanIntegrantes?.[0]?.Persona;
    if (!persona) return 'Sin titular';
    const { apellido, nombre } = persona;
    return `${apellido}, ${nombre}`.trim();
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      handleCancel();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="confirm-delete-backdrop"
          onClick={handleBackdropClick}
          role="presentation"
        />
      )}
      <div
        className={`confirm-delete-permanent-modal${isOpen ? ' confirm-delete-permanent-modal--open' : ''}`}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-permanent-delete-title"
      >
        <div className="confirm-delete-permanent-modal__header">
          <h2 className="confirm-delete-permanent-modal__title" id="confirm-permanent-delete-title">
            ⚠️ Confirmar Eliminación Permanente
          </h2>
          <button
            className="confirm-delete-permanent-modal__close"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cerrar"
            title="Cerrar (ESC)"
          >
            ✕
          </button>
        </div>

        <div className="confirm-delete-permanent-modal__body">
          <div className="confirm-delete-permanent-modal__warning">
            <p className="confirm-delete-permanent-modal__warning-text">
              ⚠️ <strong>Esta acción no se puede deshacer.</strong>
            </p>
          </div>

          <div className="confirm-delete-permanent-modal__info-block">
            <div className="confirm-delete-permanent-modal__info-item">
              <strong>Identificador:</strong> {formatIdentificador()}
            </div>
            <div className="confirm-delete-permanent-modal__info-item">
              <strong>Titular:</strong> {formatTitular()}
            </div>
          </div>

          <div className="confirm-delete-permanent-modal__what-will-be-deleted">
            <p className="confirm-delete-permanent-modal__subtitle">
              Se eliminarán permanentemente:
            </p>
            <ul className="confirm-delete-permanent-modal__delete-list">
              <li>Todos los integrantes/afiliados del plan</li>
              <li>Todos los recibos generados</li>
              <li>Todo el historial de cuotas</li>
              <li>Todos los servicios adicionales asociados</li>
            </ul>
          </div>

          {error && (
            <div className="confirm-delete-permanent-modal__error">
              <p className="confirm-delete-permanent-modal__error-text">
                ❌ Error: {error}
              </p>
            </div>
          )}
        </div>

        <div className="confirm-delete-permanent-modal__footer">
          <button
            className="confirm-delete-permanent-modal__btn confirm-delete-permanent-modal__btn--cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="confirm-delete-permanent-modal__btn confirm-delete-permanent-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmDeletePlanPermanentModal;
