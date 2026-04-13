import React, { useState, useEffect } from 'react';
import personasService from '../../../../../services/personasService';
import './AfiladoEditModal.scss';

function AfiladoEditModal({ personaId, personaData, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    fecha_nacimiento: '',
    fecha_cobertura: '',
  });

  useEffect(() => {
    // Cargar datos de la persona si se proporcionan
    if (personaData) {
      setForm({
        nombre: personaData.nombre || '',
        apellido: personaData.apellido || '',
        tipo_documento: personaData.tipo_documento || 'DNI',
        numero_documento: personaData.numero_documento || '',
        fecha_nacimiento: personaData.fecha_nacimiento ? personaData.fecha_nacimiento.split('T')[0] : '',
        fecha_cobertura: personaData.fecha_cobertura ? personaData.fecha_cobertura.split('T')[0] : '',
      });
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
      <div className="afiliado-edit-modal__overlay" onClick={onClose} />
      <div className="afiliado-edit-modal">
        <div className="afiliado-edit-modal__header">
          <h3>Editar Afiliado</h3>
          <button className="afiliado-edit-modal__close" onClick={onClose}>✕</button>
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
          <button className="afiliado-edit-modal__btn afiliado-edit-modal__btn--secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

export default AfiladoEditModal;
