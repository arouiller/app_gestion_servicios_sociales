import React from 'react';
import './ConfirmDeletePlanModal.scss';

/**
 * Modal de confirmación para elegir entre suspender o eliminar un plan
 *
 * Props:
 * - isOpen: boolean - si modal está visible
 * - plan: object - plan con { plan_numero, numero_afiliado, zona: { codigo }, titular: { apellido, nombre } }
 * - onSuspend: async function - callback cuando usuario elige suspender
 * - onDelete: function - callback cuando usuario elige eliminar (abre modal 2)
 * - onCancel: function - callback cuando usuario cancela
 * - isLoading: boolean - si está en proceso
 */
function ConfirmDeletePlanModal({
  isOpen,
  plan,
  onSuspend,
  onDelete,
  onCancel,
  isLoading = false,
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

  const handleSuspend = async () => {
    await onSuspend(plan);
  };

  const handleDelete = () => {
    onDelete();
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
        className={`confirm-delete-modal${isOpen ? ' confirm-delete-modal--open' : ''}`}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div className="confirm-delete-modal__header">
          <h2 className="confirm-delete-modal__title" id="confirm-delete-title">
            ¿Qué deseas hacer con este plan?
          </h2>
          <button
            className="confirm-delete-modal__close"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cerrar"
            title="Cerrar (ESC)"
          >
            ✕
          </button>
        </div>

        <div className="confirm-delete-modal__body">
          <div className="confirm-delete-modal__info-block">
            <div className="confirm-delete-modal__info-item">
              <strong>Identificador:</strong> {formatIdentificador()}
            </div>
            <div className="confirm-delete-modal__info-item">
              <strong>Titular:</strong> {formatTitular()}
            </div>
          </div>

          <div className="confirm-delete-modal__description">
            <p>Puedes suspender el plan (reversible) o eliminarlo permanentemente.</p>
          </div>
        </div>

        <div className="confirm-delete-modal__footer">
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--danger"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Eliminar Plan
          </button>
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--primary"
            onClick={handleSuspend}
            disabled={isLoading}
          >
            {isLoading ? 'Suspendiendo...' : 'Suspender Plan'}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmDeletePlanModal;
