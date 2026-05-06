import React, { useState, useEffect } from 'react';

const ZonaFormModal = ({ zona, provincia, onSave, onClose }) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (zona) {
      setCodigo(zona.codigo);
      setNombre(zona.nombre);
    }
  }, [zona]);

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
        <h3>{zona ? 'Editar Zona' : 'Nueva Zona'}</h3>
        <p className="provincia-header-info">Provincia: <strong>{provincia.nombre}</strong></p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Código *</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: Z1"
            />
          </div>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Zona Centro"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {zona ? 'Actualizar' : 'Crear'}
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

export default ZonaFormModal;
