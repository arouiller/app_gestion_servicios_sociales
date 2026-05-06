import React, { useState, useEffect } from 'react';
import './ProvinciaFormModal.scss';

const ProvinciaFormModal = ({ provincia, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: ''
  });

  useEffect(() => {
    if (provincia) {
      setFormData({
        nombre: provincia.nombre,
        codigo: provincia.codigo
      });
    } else {
      setFormData({
        nombre: '',
        codigo: ''
      });
    }
  }, [provincia]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.codigo.trim()) {
      alert('Nombre y código son requeridos');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{provincia ? 'Editar Provincia' : 'Nueva Provincia'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Buenos Aires"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="codigo">Código *</label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="Ej: BA"
              required
              maxLength="10"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {provincia ? 'Guardar Cambios' : 'Crear Provincia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProvinciaFormModal;
