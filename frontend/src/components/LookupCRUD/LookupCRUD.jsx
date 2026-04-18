import React, { useEffect, useState } from 'react';
import lookupService from '../../services/lookupService';
import configService from '../../services/configService';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';
import SearchContainer from '../SearchContainer/SearchContainer';
import ActionButton from '../ActionButton/ActionButton';
import IconButton from '../IconButton/IconButton';
import ConfirmDeleteWithRefsModal from '../ConfirmDeleteWithRefsModal/ConfirmDeleteWithRefsModal';
import useDebounce from '../../hooks/useDebounce';
import '../../styles/_table-standard.scss';
import './LookupCRUD.scss';

const LookupCRUD = ({ titulo, singularName, endpoint, campos }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchText, setSearchText] = useState('');
  const [debounceDelay, setDebounceDelay] = useState(2000);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    registroId: null,
    registroNombre: null,
    referencias: 0,
    referenciaEn: null,
    isLoading: false,
    error: null,
  });
  const ITEMS_PER_PAGE = 20;

  const entidad = endpoint.split('/').pop();

  // Debouncificar el texto de búsqueda
  const debouncedSearchText = useDebounce(searchText, debounceDelay);

  // Cargar configuración de debounce al montar
  useEffect(() => {
    const loadDebounceConfig = async () => {
      try {
        const config = await configService.getConfiguracion();
        if (config && config.debounce_delay_ms) {
          setDebounceDelay(config.debounce_delay_ms);
        }
      } catch (err) {
        console.error('Error cargando configuración de debounce:', err);
        // Mantener default de 2000ms si hay error
      }
    };
    loadDebounceConfig();
  }, []);

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
    let { name, value } = e.target;
    // Uppercase abreviacion field automatically
    if (name === 'abreviacion') {
      value = value.toUpperCase();
    }
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

    // Paso 1: Intenta eliminar sin forzar
    try {
      await lookupService.delete(entidad, id);
      await loadRegistros();
      setError(null);
    } catch (err) {
      // Paso 2: Si recibe 409 (referencias encontradas), abre modal
      if (err.response?.status === 409) {
        const data = err.response.data;
        setDeleteModal({
          isOpen: true,
          registroId: id,
          registroNombre: infoEntidad,
          referencias: data.referencias || 0,
          referenciaEn: data.referenciaEn || '',
          isLoading: false,
          error: null,
        });
      } else {
        // Otro error: mostrar mensaje de error
        setError(err.response?.data?.error || err.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const handleConfirmDeleteWithRefs = async () => {
    const { registroId } = deleteModal;

    // Paso 3: Si usuario confirma, enviar DELETE con force=true
    setDeleteModal(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await lookupService.delete(entidad, registroId, { force: true });
      await loadRegistros();
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
      setError(null);
    } catch (err) {
      setDeleteModal(prev => ({
        ...prev,
        error: err.response?.data?.error || err.response?.data?.message || 'Error al eliminar',
        isLoading: false,
      }));
    }
  };

  const handleCancelDeleteWithRefs = () => {
    setDeleteModal(prev => ({
      ...prev,
      isOpen: false,
      registroId: null,
      error: null,
      isLoading: false,
    }));
  };

  if (loading) return <div className="lookup-crud loading">Cargando...</div>;

  const registrosFiltered = registros
    .filter(registro => {
      const searchLower = debouncedSearchText.toLowerCase();
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
        <div className="table-wrapper">
          <table className="table-standard lookup-table">
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
                <td className="table-actions">
                  <div className="action-button-group">
                    <IconButton
                      icon="edit"
                      title="Editar"
                      onClick={() => handleOpenForm(registro)}
                    />
                    <IconButton
                      icon="delete"
                      title="Eliminar"
                      onClick={() => handleDelete(Object.values(registro)[0])}
                      className="icon-button--danger"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
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
                  maxLength={campo.maxLength}
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

      <ConfirmDeleteWithRefsModal
        isOpen={deleteModal.isOpen}
        entidad={entidad}
        registroNombre={deleteModal.registroNombre}
        referencias={deleteModal.referencias}
        referenciaEn={deleteModal.referenciaEn}
        onConfirm={handleConfirmDeleteWithRefs}
        onCancel={handleCancelDeleteWithRefs}
        isLoading={deleteModal.isLoading}
        error={deleteModal.error}
      />
    </div>
  );
};

export default LookupCRUD;
