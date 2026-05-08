import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import planesV1Service from '../../../../services/planesV1Service';
import planesService from '../../../../services/planesService';
import configService from '../../../../services/configService';
import { formatNumeroAfiliado } from '../../../../utils/formatters';
import PlanV1Modal from './modals/PlanV1Modal';
import BulkUpdateCuotaModal from '../BulkUpdateCuotaModal/BulkUpdateCuotaModal';
import HistorialAumentosModal from '../HistorialAumentosModal/HistorialAumentosModal';
import GenerarRecibosModal from './modals/GenerarRecibosModal';
import SearchContainer from '../../../../components/SearchContainer/SearchContainer';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import IconButton from '../../../../components/IconButton/IconButton';
import StatusBadge from '../../../../components/StatusBadge/StatusBadge';
import Pagination from '../../../../components/Pagination/Pagination';
import useDebounce from '../../../../hooks/useDebounce';
import usePagination from '../../../../hooks/usePagination';
import useColumnResize from '../../../../hooks/useColumnResize';
import useSortable from '../../../../hooks/useSortable';
import '../../../../styles/_table-standard.scss';
import './GestionPlanesV1.scss';

function GestionPlanesV1() {
  console.log('[GestionPlanesV1] Mounting component');
  const { isAdmin } = useAuth();
  console.log('[GestionPlanesV1] isAdmin:', isAdmin);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | 'crear' | 'editar'
  const [planEditando, setPlanEditando] = useState(null);
  const [filtros, setFiltros] = useState({ estado: '', cobrador: '', obraSocial: '' });
  const [searchText, setSearchText] = useState('');
  const [debounceDelay, setDebounceDelay] = useState(2000);
  const [forceSearchNow, setForceSearchNow] = useState(false);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [generarRecibosModalOpen, setGenerarRecibosModalOpen] = useState(false);
  const [historialAumentosModalOpen, setHistorialAumentosModalOpen] = useState(false);
  const [configItemsPerPage, setConfigItemsPerPage] = useState(null);

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

  // Cargar planes al montar (initial load)
  useEffect(() => {
    cargar();
  }, []);

  const cargar = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await planesService.getByFilter('todos', { ...filtros, sortBy, order });
      setPlanes(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Error al cargar planes:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar planes');
      setPlanes([]);
    } finally {
      setLoading(false);
    }
  }, [filtros, sortBy, order]);

  // Recargar planes cuando cambia el ordenamiento
  useEffect(() => {
    cargar();
  }, [sortBy, order, cargar]);

  // Usar searchText inmediatamente si se presionó Enter, si no usar debouncedSearchText
  const effectiveSearchText = forceSearchNow ? searchText : debouncedSearchText;

  // Filtrar planes por búsqueda
  const planesFiltered = planes
    .filter(plan => {
      const searchLower = effectiveSearchText.toLowerCase();
      return (
        plan.numero_afiliado?.toLowerCase().includes(searchLower) ||
        plan.Zona?.codigo?.toLowerCase().includes(searchLower) ||
        plan.TipoDePlan?.tipo_plan_nombre?.toLowerCase().includes(searchLower) ||
        plan.Cobrador?.cobrador_apellido?.toLowerCase().includes(searchLower) ||
        plan.Cobrador?.cobrador_nombre?.toLowerCase().includes(searchLower) ||
        plan.ObraSocial?.os_nombre?.toLowerCase().includes(searchLower) ||
        plan.PlanIntegrantes?.[0]?.Persona?.apellido?.toLowerCase().includes(searchLower) ||
        plan.PlanIntegrantes?.[0]?.Persona?.nombre?.toLowerCase().includes(searchLower)
      );
    });

  const pagination = usePagination(planesFiltered, 15, configItemsPerPage);
  // El hook usePagination ahora resetea automáticamente cuando items.length cambia

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

  const handleSuspenderPlan = async (plan) => {
    if (!window.confirm(`¿Estás seguro de que querés suspender el plan ${formatNumeroAfiliado(plan.numero_afiliado)}?`)) {
      return;
    }

    try {
      await planesV1Service.suspender(plan.plan_numero);
      mostrarMensaje('Plan suspendido correctamente', 'success');
      cargar();
    } catch (err) {
      mostrarMensaje(err.response?.data?.message || 'Error al suspender plan', 'error');
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

  // Manejar tecla Enter para búsqueda inmediata (sin debounce)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setForceSearchNow(true);
      // Resetear forceSearchNow después de que se renderice
      setTimeout(() => setForceSearchNow(false), 0);
    }
  };

  return (
    <div className="gestion-planes-v1">
      <h2 className="gestion-planes-v1__title">Planes</h2>

      {error && <div className="gestion-planes-v1__alert gestion-planes-v1__alert--error">{error}</div>}
      {success && <div className="gestion-planes-v1__alert gestion-planes-v1__alert--success">{success}</div>}

      {planes.length > 0 && (
        <div className="gestion-planes-v1__filters">
          <SearchContainer
            placeholder="Buscar por identificador, titular, tipo de plan, cobrador u obra social... (presiona Enter para buscar inmediatamente)"
            value={searchText}
            onChange={setSearchText}
            onKeyDown={handleSearchKeyDown}
            count={planesFiltered.length}
            maxItems={planesFiltered.length}
          />
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
      )}

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
              {pagination.paginatedItems.map((plan) => (
                <tr key={plan.plan_numero}>
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
                      {plan.estado !== 'SUSPENDIDO' && (
                        <IconButton
                          icon="delete"
                          title="Suspender"
                          onClick={() => handleSuspenderPlan(plan)}
                          className="icon-button--danger"
                        />
                      )}
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
    </div>
  );
}

export default GestionPlanesV1;
