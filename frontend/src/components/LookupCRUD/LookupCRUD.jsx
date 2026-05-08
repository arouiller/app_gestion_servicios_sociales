import React, { useEffect, useState, useMemo } from 'react';
import lookupService from '../../services/lookupService';
import { useConfig } from '../../hooks/useConfig';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';
import SearchContainer from '../SearchContainer/SearchContainer';
import ActionButton from '../ActionButton/ActionButton';
import IconButton from '../IconButton/IconButton';
import ConfirmDeleteWithRefsModal from '../ConfirmDeleteWithRefsModal/ConfirmDeleteWithRefsModal';
import Pagination from '../Pagination/Pagination';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import useColumnResize from '../../hooks/useColumnResize';
import useSortable from '../../hooks/useSortable';
import '../../styles/_table-standard.scss';
import './LookupCRUD.scss';

const LookupCRUD = ({ titulo, singularName, endpoint, campos, tableKey = 'lookup' }) => {
  const { config: globalConfig } = useConfig();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchText, setSearchText] = useState('');
  const [debounceDelay] = useState(globalConfig?.debounce_delay_ms ?? 2000);
  const [forceSearchNow, setForceSearchNow] = useState(false);
  const [configItemsPerPage] = useState(globalConfig?.items_per_page ?? null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    registroId: null,
    registroNombre: null,
    referencias: 0,
    referenciaEn: null,
    isLoading: false,
    error: null,
  });

  const entidad = endpoint.split('/').pop();

  // Mapeo de entidades a sus claves primarias
  const pkFieldMap = {
    cobradores: 'cobrador_numero',
    'tipos-de-plan': 'tipo_plan_numero',
    'obras-sociales': 'os_numero',
    'servicios-adicionales': 'servicio_adicional_numero',
    'tipos-de-grupo': 'tipo_de_grupo_numero',
    zonas: 'id',
  };

  const pkField = pkFieldMap[entidad] || 'id';

  // Sort hook para ordenamiento dinámico - DEBE estar antes del useEffect que lo usa
  const { sortBy, order, handleSort, getSortIcon } = useSortable(`lookup-${entidad}-sort`, pkField, 'ASC');

  // Debouncificar el texto de búsqueda
  const debouncedSearchText = useDebounce(searchText, debounceDelay);

  // Cargar lista
  useEffect(() => {
    loadRegistros();
  }, [entidad, sortBy, order]);

  const loadRegistros = async () => {
    try {
      setLoading(true);
      const data = await lookupService.list(entidad, { sortBy, order });
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

    // Obtener información de referencias sin intentar eliminar
    try {
      const refData = await lookupService.getReferencias(entidad, id);

      setDeleteModal({
        isOpen: true,
        registroId: id,
        registroNombre: infoEntidad,
        referencias: refData.referencias || 0,
        referenciaEn: refData.referenciaEn || '',
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al obtener información del registro');
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

  // Usar searchText inmediatamente si se presionó Enter, si no usar debouncedSearchText
  const effectiveSearchText = forceSearchNow ? searchText : debouncedSearchText;

  // Redimensionamiento de columnas
  const camposVisibles = campos.filter(campo => !campo.hidden);
  const defaultWidths = useMemo(() => {
    const w = { acciones: 100 };
    camposVisibles.forEach(c => { w[c.name] = 150; });
    return w;
  }, [camposVisibles.length]);

  const { widths, getResizeHandle } = useColumnResize(tableKey, defaultWidths);

  const registrosFiltered = registros
    .filter(registro => {
      const searchLower = effectiveSearchText.toLowerCase();
      return Object.values(registro).some(val =>
        String(val).toLowerCase().includes(searchLower)
      );
    });

  const pagination = usePagination(registrosFiltered, 15, configItemsPerPage);
  // El hook usePagination ahora resetea automáticamente cuando items.length cambia

  if (loading) return <div className="lookup-crud loading">Cargando...</div>;

  // Manejar tecla Enter para búsqueda inmediata (sin debounce)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setForceSearchNow(true);
      // Resetear forceSearchNow después de que se renderice
      setTimeout(() => setForceSearchNow(false), 0);
    }
  };

  const sinResultados = registros.length === 0;

  return (
    <div className="lookup-crud">
      <h2 className="lookup-crud__title">{titulo}</h2>

      <div className="lookup-crud__filters">
        <SearchContainer
          placeholder={`Buscar ${titulo.toLowerCase()}... (presiona Enter para buscar inmediatamente)`}
          value={searchText}
          onChange={setSearchText}
          onKeyDown={handleSearchKeyDown}
          count={registrosFiltered.length}
          maxItems={registrosFiltered.length}
        />
        <ActionButton variant="primary" icon="+" onClick={() => handleOpenForm()}>
          Nuevo {singularName || 'Registro'}
        </ActionButton>
      </div>

      {sinResultados ? (
        <div className="lookup-crud__empty">
          <p>No hay {titulo.toLowerCase()}. Creá el primero.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table-standard lookup-table">
          <thead>
            <tr>
              {camposVisibles.map(campo => (
                <th
                  key={campo.name}
                  style={{ width: widths[campo.name], cursor: 'pointer' }}
                  onClick={() => handleSort(campo.name)}
                >
                  {campo.label}{getSortIcon(campo.name)}{getResizeHandle(campo.name)}
                </th>
              ))}
              <th style={{ width: widths.acciones }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paginatedItems.map(registro => (
              <tr key={Object.values(registro)[0]}>
                {camposVisibles.map(campo => (
                  <td key={campo.name}>{registro[campo.name]}</td>
                ))}
                <td className="table-actions">
                  <div className="action-button-group">
                    <ActionButton
                      variant="primary"
                      icon="✎"
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

      {pagination.showPagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.handleChangePage}
          onItemsPerPageChange={pagination.handleChangeItemsPerPage}
        />
      )}

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3>{editingId ? 'Editando' : 'Nuevo'} {singularName || titulo}</h3>
            {campos.filter(campo => !campo.hidden).map(campo => (
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
