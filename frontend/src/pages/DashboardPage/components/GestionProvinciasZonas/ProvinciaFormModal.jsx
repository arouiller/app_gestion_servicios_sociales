import React, { useState, useEffect } from 'react';

const ProvinciaFormModal = ({ provincia, onSave, onClose }) => {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    if (provincia) {
      setNombre(provincia.nombre);
      setCodigo(provincia.codigo);
    }
  }, [provincia]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim()) {
      alert('Todos los campos son requeridos');
      return;
    }
    onSave({ nombre: nombre.trim(), codigo: codigo.trim() });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{provincia ? 'Editar Provincia' : 'Nueva Provincia'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Buenos Aires"
            />
          </div>
          <div className="form-group">
            <label>Código *</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: BA"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {provincia ? 'Actualizar' : 'Crear'}
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

export default ProvinciaFormModal;
