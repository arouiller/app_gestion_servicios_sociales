import React, { useState } from 'react';
import './ConfirmDeleteWithRefsModal.scss';

/**
 * Modal de confirmación para eliminación de entidades con referencias/asociaciones
 *
 * Props:
 * - isOpen: boolean - si modal está visible
 * - entidad: string - nombre de entidad a eliminar (ej: "cobradores")
 * - registroNombre: string - descripción legible del registro (ej: "Juan Pérez")
 * - referencias: number - cantidad de referencias encontradas
 * - referenciaEn: string - nombre de tabla/entidad que tiene referencias (ej: "planes")
 * - onConfirm: function - callback cuando usuario confirma eliminación
 * - onCancel: function - callback cuando usuario cancela
 * - isLoading: boolean - si está en proceso de eliminación
 * - error: string - mensaje de error si la eliminación falló
 */
function ConfirmDeleteWithRefsModal({
  isOpen,
  entidad,
  registroNombre,
  referencias,
  referenciaEn,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}) {
  if (!isOpen) return null;

  const getNombreEntidad = (ent) => {
    const nombres = {
      cobradores: 'Cobrador',
      'obras-sociales': 'Obra Social',
      'servicios-adicionales': 'Servicio Adicional',
      'tipos-de-grupo': 'Tipo de Grupo',
      'tipos-de-plan': 'Tipo de Plan',
    };
    return nombres[ent] || ent;
  };

  const getNombreTabla = (tab) => {
    const nombres = {
      planes: 'planes',
      integrante_servicios: 'servicios de integrantes',
    };
    return nombres[tab] || tab;
  };

  const nombreEntidad = getNombreEntidad(entidad);
  const nombreTabla = getNombreTabla(referenciaEn);
  const pluralReferencia = referencias === 1 ? 'referencia' : 'referencias';

  return (
    <>
      {isOpen && (
        <div className="confirm-delete-backdrop" onClick={onCancel} />
      )}
      <div className={`confirm-delete-modal${isOpen ? ' confirm-delete-modal--open' : ''}`}>
        <div className="confirm-delete-modal__header">
          <h2 className="confirm-delete-modal__title">
            ⚠️ ¿Eliminar {nombreEntidad}?
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
          {registroNombre && (
            <div className="confirm-delete-modal__registro">
              <strong>{registroNombre}</strong>
            </div>
          )}

          <div className="confirm-delete-modal__alert">
            <p className="confirm-delete-modal__message">
              Esta entidad está siendo usada por <strong>{referencias} {pluralReferencia}</strong> en {nombreTabla}.
            </p>
            <p className="confirm-delete-modal__warning">
              ⚠️ Si procedes, se actualizar{referencias === 1 ? 'á' : 'án'} {referencias === 1 ? 'la' : 'las'} {pluralReferencia}
              {referencias === 1 ? ' removiendo' : ' removiendo'} la referencia.
            </p>
          </div>

          {error && (
            <div className="confirm-delete-modal__error">
              <p>❌ Error: {error}</p>
            </div>
          )}

          <div className="confirm-delete-modal__info">
            <p>
              <strong>Nota:</strong> Esta acción no se puede deshacer.
              Los {nombreTabla} seguirán existiendo pero sin esta referencia asignada.
            </p>
          </div>
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

export default ConfirmDeleteWithRefsModal;
