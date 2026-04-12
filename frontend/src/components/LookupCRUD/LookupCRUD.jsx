import React, { useEffect, useState } from 'react';
import lookupService from '../../services/lookupService';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';
import './LookupCRUD.scss';

const LookupCRUD = ({ titulo, endpoint, campos }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const entidad = endpoint.split('/').pop();

  // Cargar lista
  useEffect(() => {
    loadRegistros();
  }, [entidad]);

  const loadRegistros = async () => {
    try {
      setLoading(true);
      const data = await lookupService.list(entidad);
      setRegistros(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (registro = null) => {
    if (registro) {
      setFormData(registro);
      setEditingId(registro[campos[0]?.pk || 'id']);
    } else {
      setFormData({});
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({});
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await lookupService.update(entidad, editingId, formData);
      } else {
        await lookupService.create(entidad, formData);
      }
      await loadRegistros();
      handleCloseForm();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await lookupService.delete(entidad, id);
        await loadRegistros();
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  if (loading) return <div className="lookup-crud loading">Cargando...</div>;

  return (
    <div className="lookup-crud">
      <div className="header">
        <h2>{titulo}</h2>
        <button onClick={() => handleOpenForm()} className="btn-primary">
          + Nuevo
        </button>
      </div>

      <table className="lookup-table">
        <thead>
          <tr>
            {campos.map(campo => (
              <th key={campo.name}>{campo.label}</th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {registros.map(registro => (
            <tr key={Object.values(registro)[0]}>
              {campos.map(campo => (
                <td key={campo.name}>{registro[campo.name]}</td>
              ))}
              <td className="acciones">
                <button onClick={() => handleOpenForm(registro)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(Object.values(registro)[0])} className="btn-delete">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3>{editingId ? 'Editar' : 'Crear'} {titulo.slice(0, -1)}</h3>
            {campos.map(campo => (
              <div key={campo.name} className="form-group">
                <label>{campo.label}</label>
                <input
                  type={campo.tipo === 'numero_pk' ? 'number' : 'text'}
                  name={campo.name}
                  value={formData[campo.name] || ''}
                  onChange={handleInputChange}
                  required={true}
                />
              </div>
            ))}
            <div className="form-actions">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={handleCloseForm} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <ErrorDisplay error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default LookupCRUD;
