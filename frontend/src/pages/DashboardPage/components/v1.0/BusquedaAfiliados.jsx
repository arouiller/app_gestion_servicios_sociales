import React, { useState, useCallback, useEffect } from 'react';
import personasService from '../../../../services/personasService';
import planesService from '../../../../services/planesV1Service';
import configService from '../../../../services/configService';
import PlanV1Modal from '../GestionPlanesV1/modals/PlanV1Modal';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import IconButton from '../../../../components/IconButton/IconButton';
import Pagination from '../../../../components/Pagination/Pagination';
import useDebounce from '../../../../hooks/useDebounce';
import usePagination from '../../../../hooks/usePagination';
import { formatNumeroAfiliado } from '../../../../utils/formatters';
import '../../../../styles/_table-standard.scss';
import './BusquedaAfiliados.scss';

const BusquedaAfiliados = () => {
  const [searchText, setSearchText] = useState('');
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [planesPersona, setPlanesPersona] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [debounceDelay, setDebounceDelay] = useState(2000);
  const [configItemsPerPage, setConfigItemsPerPage] = useState(null);

  // Debouncificar el texto de búsqueda
  const debouncedSearchText = useDebounce(searchText, debounceDelay);

  // Cargar configuración al montar
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await configService.getConfiguracion();
        if (config && config.debounce_delay_ms) {
          setDebounceDelay(config.debounce_delay_ms);
        }
        if (config && config.items_per_page) {
          setConfigItemsPerPage(config.items_per_page);
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
        // Mantener defaults si hay error
      }
    };
    loadConfig();
  }, []);

  // Paginación para la lista de personas
  const pagination = usePagination(personas, 15, configItemsPerPage);
  // El hook usePagination ahora resetea automáticamente cuando items.length cambia

  // Función para ejecutar búsqueda
  const performSearch = useCallback(async (textToSearch) => {
    setError(null);

    if (!textToSearch.trim()) {
      setPersonas([]);
      return;
    }

    try {
      setLoading(true);
      const resultado = await personasService.buscar(textToSearch);
      setPersonas(resultado);
    } catch (err) {
      setError('Error en la búsqueda');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ejecutar búsqueda cuando el texto debouncificado cambia
  useEffect(() => {
    performSearch(debouncedSearchText);
  }, [debouncedSearchText, performSearch]);

  // Manejar cambio de input y tecla Enter
  const handleSearch = useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e) => {
    // Si presiona Enter, ejecutar búsqueda inmediatamente
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch(searchText);
    }
  }, [searchText, performSearch]);

  const handleSelectPersona = useCallback(async (persona) => {
    setSelectedPersona(persona);
    try {
      setLoading(true);
      // Obtener planes asociados a esta persona
      const planes = await planesService.getByPersona(persona.id);
      setPlanesPersona(planes);
    } catch (err) {
      console.error('Error al obtener planes:', err);
      setPlanesPersona([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditarPlan = useCallback((plan) => {
    setEditingPlan(plan);
    setShowPlanModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowPlanModal(false);
    setEditingPlan(null);
  }, []);

  const handlePlanSaved = useCallback(async () => {
    // Refrescar planes después de guardar
    if (selectedPersona) {
      try {
        const planesActualizados = await planesService.getByPersona(selectedPersona.id);
        setPlanesPersona(planesActualizados);
        setSuccessMessage('Plan actualizado correctamente');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Error al refrescar planes:', err);
      }
    }
    handleModalClose();
  }, [selectedPersona]);

  const handleToggleEstado = useCallback(async (plan) => {
    const nuevoEstado = plan.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    const mensaje = plan.estado === 'ACTIVO'
      ? `¿Estás seguro de que querés suspender el plan ${formatNumeroAfiliado(plan.numero_afiliado)}?`
      : `¿Estás seguro de que querés activar el plan ${formatNumeroAfiliado(plan.numero_afiliado)}?`;

    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      setLoading(true);
      await planesService.actualizar(plan.plan_numero, { estado: nuevoEstado });
      setSuccessMessage(`Plan ${nuevoEstado.toLowerCase()} correctamente`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Actualizar el estado local del plan
      const planesActualizados = planesPersona.map(p =>
        p.plan_numero === plan.plan_numero ? { ...p, estado: nuevoEstado } : p
      );
      setPlanesPersona(planesActualizados);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar el estado del plan');
      console.error('Error al cambiar estado:', err);
    } finally {
      setLoading(false);
    }
  }, [planesPersona]);

  return (
    <div className="busqueda-afiliados">
      <h2 className="busqueda-afiliados__title">Búsqueda de Afiliados</h2>

      <div className="busqueda-afiliados__filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por apellido, nombre o número de documento... (presiona Enter para buscar inmediatamente)"
            value={searchText}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Tabla de resultados */}
      {personas.length > 0 && !selectedPersona && (
        <>
          <table className="personas-table">
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>Tipo Doc</th>
                <th>Nro Doc</th>
                <th>Fecha Nac</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((persona) => (
                <tr key={persona.id}>
                  <td>{persona.apellido}</td>
                  <td>{persona.nombre}</td>
                  <td>{persona.tipo_documento}</td>
                  <td>{persona.numero_documento}</td>
                  <td>{new Date(persona.fecha_nacimiento).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-ver"
                      onClick={() => handleSelectPersona(persona)}
                    >
                      Ver Planes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
        </>
      )}

      {/* Detalle de persona y sus planes */}
      {selectedPersona && (
        <div className="persona-detail">
          <button
            className="btn-volver"
            onClick={() => {
              setSelectedPersona(null);
              setPlanesPersona([]);
            }}
          >
            ← Volver
          </button>

          <h3>
            {selectedPersona.nombre} {selectedPersona.apellido}
          </h3>
          <p className="persona-info">
            {selectedPersona.tipo_documento} {selectedPersona.numero_documento} | Nac:{' '}
            {new Date(selectedPersona.fecha_nacimiento).toLocaleDateString()}
          </p>

          {planesPersona.length > 0 ? (
            <div className="table-wrapper">
              <table className="table-standard planes-table">
                <thead>
                  <tr>
                    <th>Nro Afiliado</th>
                    <th>Tipo Plan</th>
                    <th>Obra Social</th>
                    <th>Estado</th>
                    <th>Valor Cuota</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {planesPersona.map((plan) => (
                    <tr key={plan.plan_numero}>
                      <td>{formatNumeroAfiliado(plan.numero_afiliado)}</td>
                      <td>{plan.TipoDePlan?.tipo_plan_nombre || 'N/A'}</td>
                      <td>{plan.ObraSocial?.os_nombre || 'N/A'}</td>
                      <td>{plan.estado}</td>
                      <td>${plan.valor_cuota || '0.00'}</td>
                      <td className="table-actions">
                        <div className="action-button-group">
                          <ActionButton
                            variant="primary"
                            icon="✎"
                            title="Editar"
                            onClick={() => handleEditarPlan(plan)}
                          />
                          <IconButton
                            icon="delete"
                            title={plan.estado === 'ACTIVO' ? 'Suspender' : 'Activar'}
                            onClick={() => handleToggleEstado(plan)}
                            className={plan.estado === 'ACTIVO' ? 'icon-button--danger' : 'icon-button--success'}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-planes">Esta persona no tiene planes asociados</p>
          )}
        </div>
      )}

      {personas.length === 0 && searchText && !loading && (
        <p className="no-results">No se encontraron resultados</p>
      )}

      {loading && <p className="loading">Buscando...</p>}

      {showPlanModal && (
        <PlanV1Modal
          mode="editar"
          planData={editingPlan}
          onClose={handleModalClose}
          onSave={handlePlanSaved}
        />
      )}
    </div>
  );
};

export default BusquedaAfiliados;
