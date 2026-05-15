import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useConfig } from '../../../../hooks/useConfig';
import planesV1Service from '../../../../services/planesV1Service';
import planesService from '../../../../services/planesService';
import { formatNumeroAfiliado } from '../../../../utils/formatters';
import PlanV1Modal from './modals/PlanV1Modal';
import BulkUpdateCuotaModal from '../BulkUpdateCuotaModal/BulkUpdateCuotaModal';
import HistorialAumentosModal from '../HistorialAumentosModal/HistorialAumentosModal';
import GenerarRecibosModal from './modals/GenerarRecibosModal';
import ConfirmDeletePlanModal from '../../../../components/ConfirmDeletePlanModal/ConfirmDeletePlanModal';
import ConfirmDeletePlanPermanentModal from '../../../../components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal';
import SearchContainer from '../../../../components/SearchContainer/SearchContainer';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import IconButton from '../../../../components/IconButton/IconButton';
import StatusBadge from '../../../../components/StatusBadge/StatusBadge';
import Pagination from '../../../../components/Pagination/Pagination';
import useDebounce from '../../../../hooks/useDebounce';
import useColumnResize from '../../../../hooks/useColumnResize';
import useSortable from '../../../../hooks/useSortable';
import '../../../../styles/_table-standard.scss';
import './GestionPlanesV1.scss';

function GestionPlanesV1() {
  console.log('[GestionPlanesV1] Mounting component');
  const { isAdmin } = useAuth();
  const { config: globalConfig } = useConfig();
  console.log('[GestionPlanesV1] isAdmin:', isAdmin);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | 'crear' | 'editar'
  const [planEditando, setPlanEditando] = useState(null);
  const [filtros, setFiltros] = useState({ estado: '', cobrador: '', obraSocial: '' });
  const [searchText, setSearchText] = useState('');
  const [debounceDelay, setDebounceDelay] = useState(globalConfig?.debounce_delay_ms ?? 2000);
  const [forceSearchNow, setForceSearchNow] = useState(false);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [generarRecibosModalOpen, setGenerarRecibosModalOpen] = useState(false);
  const [historialAumentosModalOpen, setHistorialAumentosModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState({
    firstModal: false,
    secondModal: false,
    selectedPlan: null,
    isLoading: false,
    error: null,
  });
  const [configItemsPerPage, setConfigItemsPerPage] = useState(globalConfig?.items_per_page ?? 15);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeRowId, setActiveRowId] = useState(null);

  const DEFAULT_WIDTHS_PLANES = {
    identificador: 110,
    titular: 200,
    tipoPlan: 140,
    cobrador: 160,
    obraSocial: 140,
    estado: 100,
    acciones: 100,
  };

  const { widths, getResizeHandle } = useColumnResize('planes', DEFAULT_WIDTHS_PLANES);

  // Sort hook para ordenamiento dinámico
  const { sortBy, order, handleSort, getSortIcon } = useSortable('gestion-planes-sort', 'plan_numero', 'ASC');

  // Debouncificar el texto de búsqueda
  const debouncedSearchText = useDebounce(searchText, debounceDelay);

  const cargar = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await planesService.getByFilter('todos', {
        ...filtros,
        sortBy,
        order,
        page,
        limit: configItemsPerPage,
      });
      setPlanes(Array.isArray(result.data) ? result.data : []);
      setTotalCount(result.count || 0);
      setTotalPages(result.totalPages || 0);
    } catch (err) {
      console.error('Error al cargar planes:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar planes');
      setPlanes([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filtros, sortBy, order, page, configItemsPerPage]);

  // Resetear página a 1 cuando cambian filtros, ordenamiento o limit
  useEffect(() => {
    setPage(1);
    setActiveRowId(null);
  }, [sortBy, order, filtros, configItemsPerPage]);

  // Filtrar planes por búsqueda de texto (solo por apellido del titular - que comience con el texto)
  const planesFiltered = planes.filter(plan => {
    const searchLower = searchText.toLowerCase();
    return plan.PlanIntegrantes?.[0]?.Persona?.apellido?.toLowerCase().startsWith(searchLower);
  });

  // Recargar planes cuando cambia el ordenamiento, filtros, página o búsqueda
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Establecer primera fila como activa cuando los planes cargan
  useEffect(() => {
    if (planesFiltered && planesFiltered.length > 0 && !activeRowId) {
      setActiveRowId(planesFiltered[0].plan_numero);
    }
  }, [planesFiltered, activeRowId]);

  // Manejar búsqueda inmediata con Enter (sin debounce)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setForceSearchNow(true);
      setTimeout(() => setForceSearchNow(false), 0);
    }
  };

  const mostrarMensaje = (texto, tipo = 'success') => {
    if (tipo === 'success') {
      setSuccess(texto);
      setTimeout(() => setSuccess(null), 4000);
    } else if (tipo === 'error') {
      setError(texto);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCrearPlan = () => {
    setModalMode('crear');
    setPlanEditando(null);
    setError(null);
  };

  const handleEditarPlan = (plan) => {
    setPlanEditando(plan);
    setModalMode('editar');
    setError(null);
  };

  // Navegación por teclado en tabla de planes
  const handleKeyDown = useCallback((e) => {
    // Solo escuchar si no hay modal abierto y la tabla tiene filas
    if (modalMode || planesFiltered.length === 0) return;

    const key = e.key.toLowerCase();
    const altKey = e.altKey;

    // ALT+G: Editar fila activa
    if (altKey && key === 'g') {
      e.preventDefault();
      const activeRow = planesFiltered.find(p => p.plan_numero === activeRowId);
      if (activeRow) {
        handleEditarPlan(activeRow);
      }
      return;
    }

    // Teclas de navegación
    let newActiveIndex = planesFiltered.findIndex(p => p.plan_numero === activeRowId);
    if (newActiveIndex === -1) newActiveIndex = 0;

    let targetIndex = newActiveIndex;

    switch (key) {
      case 'arrowup': // Una fila arriba
        e.preventDefault();
        targetIndex = Math.max(0, newActiveIndex - 1);
        break;
      case 'arrowdown': // Una fila abajo
        e.preventDefault();
        targetIndex = Math.min(planesFiltered.length - 1, newActiveIndex + 1);
        break;
      case 'pageup': // 10 filas arriba
        e.preventDefault();
        targetIndex = Math.max(0, newActiveIndex - 10);
        break;
      case 'pagedown': // 10 filas abajo
        e.preventDefault();
        targetIndex = Math.min(planesFiltered.length - 1, newActiveIndex + 10);
        break;
      default:
        return; // No es una tecla de navegación
    }

    // Establecer la nueva fila activa
    const newActivePlan = planesFiltered[targetIndex];
    if (newActivePlan) {
      setActiveRowId(newActivePlan.plan_numero);

      // Auto-paginar si la fila objetivo no está en la página actual
      const planeOnCurrentPage = planesFiltered.slice(
        (page - 1) * configItemsPerPage,
        page * configItemsPerPage
      );
      const isRowOnCurrentPage = planeOnCurrentPage.some(p => p.plan_numero === newActivePlan.plan_numero);

      if (!isRowOnCurrentPage && totalPages > 1) {
        // Calcular en qué página está la fila objetivo
        const targetPage = Math.ceil((targetIndex + 1) / configItemsPerPage);
        setPage(Math.max(1, Math.min(targetPage, totalPages)));
      }
    }
  }, [modalMode, planesFiltered, page, configItemsPerPage, totalPages, activeRowId, handleEditarPlan]);

  // Agregar listener de teclado para navegación
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Hacer scroll a la fila activa cuando cambia
  useEffect(() => {
    if (activeRowId) {
      const activeRow = document.querySelector(`tr[data-plan-numero="${activeRowId}"]`);
      if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeRowId]);

  const handleDeletePlan = (plan) => {
    setDeleteModalState({
      firstModal: true,
      secondModal: false,
      selectedPlan: plan,
      isLoading: false,
      error: null,
    });
  };

  const handleSuspendFromModal = async (plan) => {
    setDeleteModalState(prev => ({ ...prev, isLoading: true }));
    try {
      await planesV1Service.suspender(plan.plan_numero);
      mostrarMensaje('Plan suspendido correctamente', 'success');
      setDeleteModalState({
        firstModal: false,
        secondModal: false,
        selectedPlan: null,
        isLoading: false,
        error: null,
      });
      cargar();
    } catch (err) {
      mostrarMensaje(
        err.response?.data?.message || 'Error al suspender plan',
        'error'
      );
      setDeleteModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteChoice = () => {
    setDeleteModalState(prev => ({
      ...prev,
      firstModal: false,
      secondModal: true,
      error: null,
    }));
  };

  const handleBackToFirstModal = () => {
    setDeleteModalState(prev => ({
      ...prev,
      firstModal: true,
      secondModal: false,
      error: null,
    }));
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalState({
      firstModal: false,
      secondModal: false,
      selectedPlan: null,
      isLoading: false,
      error: null,
    });
  };

  const handleConfirmPermanentDelete = async () => {
    const { selectedPlan } = deleteModalState;
    setDeleteModalState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await planesV1Service.deletePermanently(selectedPlan.plan_numero);
      mostrarMensaje('Plan eliminado definitivamente', 'success');
      setDeleteModalState({
        firstModal: false,
        secondModal: false,
        selectedPlan: null,
        isLoading: false,
        error: null,
      });
      cargar();
    } catch (err) {
      setDeleteModalState(prev => ({
        ...prev,
        isLoading: false,
        error: err.response?.data?.message || 'Error al eliminar plan',
      }));
    }
  };

  const handleModalClose = () => {
    setModalMode(null);
    setPlanEditando(null);
  };

  const handleModalSave = async () => {
    // Modal will handle save and call cargar()
    cargar();
    handleModalClose();
  };

  if (loading) {
    console.log('[GestionPlanesV1] Loading state, showing loading message');
    return <div className="gestion-planes-v1__loading">Cargando planes...</div>;
  }

  console.log('[GestionPlanesV1] Rendering component. Planes count:', planes.length, 'Error:', error);

  return (
    <div className="gestion-planes-v1">
      {/* Sticky Header */}
      <div className="gestion-planes-v1__sticky-header">
        <h2 className="gestion-planes-v1__title">Planes</h2>

        {error && <div className="gestion-planes-v1__alert gestion-planes-v1__alert--error">{error}</div>}
        {success && <div className="gestion-planes-v1__alert gestion-planes-v1__alert--success">{success}</div>}

        {planes.length > 0 && (
          <div className="gestion-planes-v1__filters">
            <SearchContainer
              placeholder="Buscar por apellido del titular... (presiona Enter para buscar inmediatamente)"
              value={searchText}
              onChange={setSearchText}
              onKeyDown={handleSearchKeyDown}
              count={planes.length}
              maxItems={totalCount}
            />
            <div className="gestion-planes-v1__header">
              <div className="gestion-planes-v1__actions">
                <ActionButton variant="primary" icon="+" onClick={handleCrearPlan}>
                  Nuevo Plan
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={() => setBulkUpdateModalOpen(true)}
                >
                  Aumento Masivo
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={() => setHistorialAumentosModalOpen(true)}
                >
                  Ver historial de aumentos
                </ActionButton>
                <ActionButton variant="primary" onClick={() => setGenerarRecibosModalOpen(true)}>
                  Generar Recibos
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Scrollable Container */}
      <div className="gestion-planes-v1__table-scrollable">
        {planes.length === 0 ? (
          <p className="gestion-planes-v1__empty">
            {isAdmin ? 'No hay planes. Creá el primero.' : 'No hay planes disponibles.'}
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="table-standard gestion-planes-v1__tabla">
              <thead>
                <tr>
                  <th
                    style={{ width: widths.identificador, cursor: 'pointer' }}
                    onClick={() => handleSort('numero_afiliado')}
                  >
                    Identificador{getSortIcon('numero_afiliado')}{getResizeHandle('identificador')}
                  </th>
                  <th
                    style={{ width: widths.titular, cursor: 'pointer' }}
                    onClick={() => handleSort('PlanIntegrante.Persona.apellido')}
                  >
                    Titular{getSortIcon('PlanIntegrante.Persona.apellido')}{getResizeHandle('titular')}
                  </th>
                  <th
                    style={{ width: widths.tipoPlan, cursor: 'pointer' }}
                    onClick={() => handleSort('TipoDePlan.tipo_plan_nombre')}
                  >
                    Tipo de Plan{getSortIcon('TipoDePlan.tipo_plan_nombre')}{getResizeHandle('tipoPlan')}
                  </th>
                  <th
                    style={{ width: widths.cobrador, cursor: 'pointer' }}
                    onClick={() => handleSort('cobrador_numero')}
                  >
                    Cobrador{getSortIcon('cobrador_numero')}{getResizeHandle('cobrador')}
                  </th>
                  <th
                    style={{ width: widths.obraSocial, cursor: 'pointer' }}
                    onClick={() => handleSort('ObraSocial.os_nombre')}
                  >
                    Obra Social{getSortIcon('ObraSocial.os_nombre')}{getResizeHandle('obraSocial')}
                  </th>
                  <th
                    style={{ width: widths.estado, cursor: 'pointer' }}
                    onClick={() => handleSort('estado')}
                  >
                    Estado{getSortIcon('estado')}{getResizeHandle('estado')}
                  </th>
                  <th style={{ width: widths.acciones }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planesFiltered.map((plan) => (
                  <tr
                    key={plan.plan_numero}
                    data-plan-numero={plan.plan_numero}
                    className={activeRowId === plan.plan_numero ? 'gestion-planes-v1__row--active' : ''}
                  >
                    <td>
                      {plan.Zona?.codigo
                        ? `${plan.Zona.codigo}-${formatNumeroAfiliado(plan.numero_afiliado)}`
                        : formatNumeroAfiliado(plan.numero_afiliado)}
                    </td>
                    <td>
                      {plan.PlanIntegrantes?.[0]?.Persona
                        ? `${plan.PlanIntegrantes[0].Persona.apellido}, ${plan.PlanIntegrantes[0].Persona.nombre}`
                        : '—'}
                    </td>
                    <td>{plan.TipoDePlan?.tipo_plan_nombre || '—'}</td>
                    <td>{plan.Cobrador?.cobrador_apellido}, {plan.Cobrador?.cobrador_nombre}</td>
                    <td>{plan.ObraSocial?.os_nombre || '—'}</td>
                    <td>
                      <StatusBadge status={plan.estado} />
                    </td>
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
                          title="Eliminar o Suspender"
                          onClick={() => handleDeletePlan(plan)}
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
      </div>

      {totalPages > 1 && configItemsPerPage !== 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={configItemsPerPage}
          onPageChange={setPage}
        />
      )}

      {modalMode && (
        <PlanV1Modal
          mode={modalMode}
          planData={planEditando}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      <BulkUpdateCuotaModal
        isOpen={bulkUpdateModalOpen}
        onClose={() => setBulkUpdateModalOpen(false)}
        onSuccess={(result) => {
          mostrarMensaje(`${result.updated} planes actualizados exitosamente`, 'success');
          cargar();
        }}
      />

      <HistorialAumentosModal
        isOpen={historialAumentosModalOpen}
        onClose={() => setHistorialAumentosModalOpen(false)}
      />

      <GenerarRecibosModal
        isOpen={generarRecibosModalOpen}
        onClose={() => setGenerarRecibosModalOpen(false)}
        onSuccess={(result) => {
          mostrarMensaje(`${result.recibos?.length || 0} recibos generados exitosamente`, 'success');
        }}
      />

      {deleteModalState.firstModal && (
        <ConfirmDeletePlanModal
          isOpen={deleteModalState.firstModal}
          plan={deleteModalState.selectedPlan}
          onSuspend={handleSuspendFromModal}
          onDelete={handleDeleteChoice}
          onCancel={handleCloseDeleteModal}
          isLoading={deleteModalState.isLoading}
        />
      )}

      {deleteModalState.secondModal && (
        <ConfirmDeletePlanPermanentModal
          isOpen={deleteModalState.secondModal}
          plan={deleteModalState.selectedPlan}
          onConfirm={handleConfirmPermanentDelete}
          onCancel={handleBackToFirstModal}
          isLoading={deleteModalState.isLoading}
          error={deleteModalState.error}
        />
      )}
    </div>
  );
}

export default GestionPlanesV1;
