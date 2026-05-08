import React, { useState, useCallback, useMemo } from 'react';
import personasService from '../../../../../services/personasService';
import ConfirmCloseDialog from '../../../../../components/ConfirmCloseDialog/ConfirmCloseDialog';
import { useModalEscapeKey } from '../../../../../hooks/useModalEscapeKey';
import './AfiladoSearchModal.scss';

function AfiladoSearchModal({ planMode, onClose, onSelect }) {
  const [newPersona, setNewPersona] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    fecha_nacimiento: '',
    fecha_cobertura: '',
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Detect if form has changes
  const hasChanges = useMemo(() => {
    return Object.values(newPersona).some(v => v !== '');
  }, [newPersona]);

  // Handle ESC key with confirmation if there are changes
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

  // Use ESC key handler
  useModalEscapeKey(true, hasChanges, onClose, hasChanges ? handleEscapeWithChanges : undefined);

  const handleCreatePersona = async () => {
    // Validar campos
    if (!newPersona.nombre.trim()) {
      setErrorMessage('El nombre es requerido');
      return;
    }
    if (!newPersona.apellido.trim()) {
      setErrorMessage('El apellido es requerido');
      return;
    }
    if (!newPersona.numero_documento.trim()) {
      setErrorMessage('El número de documento es requerido');
      return;
    }
    if (!newPersona.fecha_nacimiento) {
      setErrorMessage('La fecha de nacimiento es requerida');
      return;
    }
    if (!newPersona.fecha_cobertura) {
      setErrorMessage('La fecha de cobertura es requerida');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      // En modo 'crear', no persistir persona en BD aún, solo devolverla en memoria
      if (planMode === 'crear') {
        console.log('[AfiladoSearchModal] Modo crear: persona deferred to plan save', newPersona);
        onSelect(newPersona); // Devolver sin id, para crear en BD cuando se guarde el plan
      } else {
        // En modo 'editar' o undefined, crear persona en BD inmediatamente
        const persona = await personasService.crear(newPersona);
        onSelect(persona);
      }
    } catch (err) {
      console.error('Error creating persona:', err);

      // Mensajes de error más descriptivos
      let errorMsg = 'Error al crear afiliado';

      if (err.response?.status === 409) {
        errorMsg = 'Ya existe una persona con ese número de documento';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="afiliado-search-modal__overlay" />
      <div className="afiliado-search-modal">
        <div className="afiliado-search-modal__header">
          <h3>Crear Nuevo Afiliado</h3>
          <button
            className="afiliado-search-modal__close"
            onClick={() => {
              if (hasChanges) {
                setShowConfirmClose(true);
              } else {
                onClose?.();
              }
            }}
          >
            ✕
          </button>
        </div>

        <div className="afiliado-search-modal__body">
          {errorMessage && (
            <div className="afiliado-search-modal__error">
              <p>{errorMessage}</p>
            </div>
          )}
          <div className="afiliado-search-modal__form">
            <div className="afiliado-search-modal__field">
              <label>Nombre *</label>
              <input
                type="text"
                value={newPersona.nombre}
                onChange={(e) => setNewPersona({ ...newPersona, nombre: e.target.value })}
              />
            </div>
            <div className="afiliado-search-modal__field">
              <label>Apellido *</label>
              <input
                type="text"
                value={newPersona.apellido}
                onChange={(e) => setNewPersona({ ...newPersona, apellido: e.target.value })}
              />
            </div>
            <div className="afiliado-search-modal__field">
              <label>Tipo de Documento *</label>
              <select
                value={newPersona.tipo_documento}
                onChange={(e) => setNewPersona({ ...newPersona, tipo_documento: e.target.value })}
              >
                <option value="DNI">DNI</option>
                <option value="LC">LC</option>
                <option value="LE">LE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </div>
            <div className="afiliado-search-modal__field">
              <label>Número de Documento *</label>
              <input
                type="text"
                value={newPersona.numero_documento}
                onChange={(e) => setNewPersona({ ...newPersona, numero_documento: e.target.value })}
              />
            </div>
            <div className="afiliado-search-modal__field">
              <label>Fecha de Nacimiento *</label>
              <input
                type="date"
                value={newPersona.fecha_nacimiento}
                onChange={(e) => setNewPersona({ ...newPersona, fecha_nacimiento: e.target.value })}
              />
            </div>
            <div className="afiliado-search-modal__field">
              <label>Fecha de Cobertura *</label>
              <input
                type="date"
                value={newPersona.fecha_cobertura}
                onChange={(e) => setNewPersona({ ...newPersona, fecha_cobertura: e.target.value })}
              />
            </div>
          </div>

          <div className="afiliado-search-modal__footer">
            <button className="afiliado-search-modal__btn" onClick={handleCreatePersona} disabled={loading}>
              {loading ? 'Creando...' : 'Crear y Agregar'}
            </button>
            <button
              className="afiliado-search-modal__btn afiliado-search-modal__btn--secondary"
              onClick={() => {
                if (hasChanges) {
                  setShowConfirmClose(true);
                } else {
                  onClose?.();
                }
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog for closing with unsaved changes */}
      <ConfirmCloseDialog
        isOpen={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title="¿Cerrar sin guardar?"
      />
    </>
  );
}

export default AfiladoSearchModal;
