import React from 'react';
import './ConfirmCloseDialog.scss';

const ConfirmCloseDialog = ({ isOpen, onConfirm, onCancel, title = '¿Cerrar sin guardar?' }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-close-dialog__overlay">
      <div className="confirm-close-dialog">
        <div className="confirm-close-dialog__header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-close-dialog__body">
          <p>Los cambios realizados se perderán.</p>
        </div>
        <div className="confirm-close-dialog__footer">
          <button
            className="confirm-close-dialog__button confirm-close-dialog__button--cancel"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="confirm-close-dialog__button confirm-close-dialog__button--confirm"
            onClick={onConfirm}
          >
            Sí, Cerrar sin guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCloseDialog;
