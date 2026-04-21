import React, { useState, useEffect, useCallback, useMemo } from 'react';
import personasService from '../../../../../services/personasService';
import ConfirmCloseDialog from '../../../../../components/ConfirmCloseDialog/ConfirmCloseDialog';
import { useModalEscapeKey } from '../../../../../hooks/useModalEscapeKey';
import './AfiladoEditModal.scss';

function AfiladoEditModal({ personaId, personaData, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    fecha_nacimiento: '',
    fecha_cobertura: '',
  });
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Detect if form has changes
  const hasChangesValue = useMemo(() => {
    if (!originalData) return false;
    return JSON.stringify(form) !== JSON.stringify(originalData);
  }, [form, originalData]);

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
  useModalEscapeKey(true, hasChangesValue, onClose, hasChangesValue ? handleEscapeWithChanges : undefined);

  useEffect(() => {
    // Cargar datos de la persona si se proporcionan
    if (personaData) {
      console.log('[AfiladoEditModal] Loading persona data:', personaData);

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        // Si es una fecha ISO, tomar solo la parte de la fecha
        if (typeof dateStr === 'string' && dateStr.includes('T')) {
          return dateStr.split('T')[0];
        }
        return dateStr;
      };

      const formData = {
        nombre: personaData.nombre || '',
        apellido: personaData.apellido || '',
        tipo_documento: personaData.tipo_documento || 'DNI',
        numero_documento: String(personaData.numero_documento || ''),
        fecha_nacimiento: formatDate(personaData.fecha_nacimiento),
        fecha_cobertura: formatDate(personaData.fecha_cobertura),
      };

      setForm(formData);
      setOriginalData(formData);
    }
  }, [personaId, personaData]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const updated = await personasService.actualizar(personaId, form);
      onSave(updated);
    } catch (err) {
      console.error('Error updating persona:', err);
      alert('Error al actualizar afiliado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="afiliado-edit-modal__overlay" />
      <div className="afiliado-edit-modal">
        <div className="afiliado-edit-modal__header">
          <h3>Editar Afiliado</h3>
          <button
            className="afiliado-edit-modal__close"
            onClick={() => {
              if (hasChangesValue) {
                setShowConfirmClose(true);
              } else {
                onClose?.();
              }
            }}
          >
            ✕
          </button>
        </div>

        <div className="afiliado-edit-modal__body">
          <div className="afiliado-edit-modal__form">
            <div className="afiliado-edit-modal__field">
              <label>Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
              />
            </div>
            <div className="afiliado-edit-modal__field">
              <label>Apellido *</label>
              <input
                type="text"
                value={form.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
              />
            </div>
            <div className="afiliado-edit-modal__field">
              <label>Tipo de Documento *</label>
              <select
                value={form.tipo_documento}
                onChange={(e) => handleChange('tipo_documento', e.target.value)}
              >
                <option value="DNI">DNI</option>
                <option value="LC">LC</option>
                <option value="LE">LE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </div>
            <div className="afiliado-edit-modal__field">
              <label>Número de Documento *</label>
              <input
                type="text"
                value={form.numero_documento}
                onChange={(e) => handleChange('numero_documento', e.target.value)}
              />
            </div>
            <div className="afiliado-edit-modal__field">
              <label>Fecha de Nacimiento *</label>
              <input
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
              />
            </div>
            <div className="afiliado-edit-modal__field">
              <label>Fecha de Cobertura *</label>
              <input
                type="date"
                value={form.fecha_cobertura}
                onChange={(e) => handleChange('fecha_cobertura', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="afiliado-edit-modal__footer">
          <button className="afiliado-edit-modal__btn afiliado-edit-modal__btn--primary" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            className="afiliado-edit-modal__btn afiliado-edit-modal__btn--secondary"
            onClick={() => {
              if (hasChangesValue) {
                setShowConfirmClose(true);
              } else {
                onClose?.();
              }
            }}
            disabled={saving}
          >
            Cancelar
          </button>
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

export default AfiladoEditModal;
