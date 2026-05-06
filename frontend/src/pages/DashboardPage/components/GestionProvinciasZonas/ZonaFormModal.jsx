import React, { useState, useEffect } from 'react';
import './ZonaFormModal.scss';

const ZonaFormModal = ({ zona, provincia, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: ''
  });

  useEffect(() => {
    if (zona) {
      setFormData({
        codigo: zona.codigo,
        nombre: zona.nombre
      });
    } else {
      setFormData({
        codigo: '',
        nombre: ''
      });
    }
  }, [zona]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      alert('Código y nombre son requeridos');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{zona ? 'Editar Zona' : `Nueva Zona - ${provincia.nombre}`}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="codigo">Código *</label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="Ej: Z001"
              required
              maxLength="50"
            />
          </div>
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Zona Centro"
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {zona ? 'Guardar Cambios' : 'Crear Zona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ZonaFormModal;
