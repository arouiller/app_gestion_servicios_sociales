import React, { useEffect, useState } from 'react';
import lookupService from '../../services/lookupService';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';
import SearchContainer from '../SearchContainer/SearchContainer';
import ActionButton from '../ActionButton/ActionButton';
import './LookupCRUD.scss';

const LookupCRUD = ({ titulo, singularName, endpoint, campos }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchText, setSearchText] = useState('');
  const ITEMS_PER_PAGE = 20;

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
      setEditingId(registro[campos[0].name]);
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
    const registro = registros.find(r => Object.values(r)[0] === id);
    if (!registro) return;

    // Encuentra el campo más relevante para mostrar (preferiblemente nombre o descripción)
    const nombreCampo = campos.find(c => c.name.includes('nombre') || c.name.includes('nombre'))?.name || campos[1]?.name || campos[0]?.name;
    const infoEntidad = nombreCampo ? registro[nombreCampo] : JSON.stringify(registro).substring(0, 50);

    const confirmacion = `¿Estás seguro de que deseas eliminar este registro?\n\n${nombreCampo ? `${campos.find(c => c.name === nombreCampo)?.label || 'Registro'}: ${infoEntidad}` : ''}\n\nEsta acción no se puede deshacer.`;

    if (window.confirm(confirmacion)) {
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

  const registrosFiltered = registros
    .filter(registro => {
      const searchLower = searchText.toLowerCase();
      return Object.values(registro).some(val =>
        String(val).toLowerCase().includes(searchLower)
      );
    })
    .slice(0, ITEMS_PER_PAGE);

  const sinResultados = registros.length === 0;

  return (
    <div className="lookup-crud">
      <div className="header">
        <h2>{titulo}</h2>
        <ActionButton variant="primary" icon="+" onClick={() => handleOpenForm()}>
          Nuevo {singularName || 'Registro'}
        </ActionButton>
      </div>

      {registros.length > 0 && (
        <SearchContainer
          placeholder={`Buscar ${titulo.toLowerCase()}...`}
          value={searchText}
          onChange={setSearchText}
          count={registrosFiltered.length}
          maxItems={ITEMS_PER_PAGE}
        />
      )}

      {sinResultados ? (
        <div className="lookup-crud__empty">
          <p>No hay {titulo.toLowerCase()}. Creá el primero.</p>
        </div>
      ) : (
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
            {registrosFiltered.map(registro => (
              <tr key={Object.values(registro)[0]}>
                {campos.map(campo => (
                  <td key={campo.name}>{registro[campo.name]}</td>
                ))}
                <td className="acciones">
                  <ActionButton
                    variant="icon"
                    icon="✎"
                    onClick={() => handleOpenForm(registro)}
                    title="Editar"
                  />
                  <ActionButton
                    variant="icon"
                    icon="🗑"
                    onClick={() => handleDelete(Object.values(registro)[0])}
                    title="Eliminar"
                    className="action-button--danger"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3>{editingId ? 'Editando' : 'Nuevo'} {singularName || titulo}</h3>
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
