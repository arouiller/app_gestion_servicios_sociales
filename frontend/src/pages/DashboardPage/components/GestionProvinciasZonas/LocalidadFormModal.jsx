import React, { useState, useEffect } from 'react';

const LocalidadFormModal = ({ localidad, provincia, onSave, onClose }) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (localidad) {
      setCodigo(localidad.codigo);
      setNombre(localidad.nombre);
    }
  }, [localidad]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      alert('Todos los campos son requeridos');
      return;
    }
    onSave({ codigo: codigo.trim(), nombre: nombre.trim() });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{localidad ? 'Editar Localidad' : 'Nueva Localidad'}</h3>
        <p className="provincia-header-info">Provincia: <strong>{provincia.nombre}</strong></p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Código *</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: L1"
            />
          </div>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Localidad Centro"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {localidad ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocalidadFormModal;
