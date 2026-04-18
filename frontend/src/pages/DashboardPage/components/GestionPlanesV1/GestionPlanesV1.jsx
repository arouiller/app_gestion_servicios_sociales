import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import planesV1Service from '../../../../services/planesV1Service';
import configService from '../../../../services/configService';
import PlanV1Modal from './modals/PlanV1Modal';
import BulkUpdateCuotaModal from '../BulkUpdateCuotaModal/BulkUpdateCuotaModal';
import GenerarRecibosModal from './modals/GenerarRecibosModal';
import SearchContainer from '../../../../components/SearchContainer/SearchContainer';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import IconButton from '../../../../components/IconButton/IconButton';
import StatusBadge from '../../../../components/StatusBadge/StatusBadge';
import useDebounce from '../../../../hooks/useDebounce';
import '../../../../styles/_table-standard.scss';
import './GestionPlanesV1.scss';

const ITEMS_PER_PAGE = 20;

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

  // Cargar planes sin usar filtros como dependencia inicial
  useEffect(() => {
    const cargar = async () => {
      setError(null);
      setLoading(true);
      try {
        const data = await planesV1Service.listar(filtros);
        setPlanes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar planes:', err);
        setError(err.response?.data?.message || err.message || 'Error al cargar planes');
        setPlanes([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const cargar = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await planesV1Service.listar(filtros);
      setPlanes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar planes:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar planes');
      setPlanes([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

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
    if (!window.confirm(`¿Estás seguro de que querés suspender el plan ${plan.numero_afiliado}?`)) {
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

  // Usar searchText inmediatamente si se presionó Enter, si no usar debouncedSearchText
  const effectiveSearchText = forceSearchNow ? searchText : debouncedSearchText;

  // Filtrar planes por búsqueda
  const planesFiltered = planes
    .filter(plan => {
      const searchLower = effectiveSearchText.toLowerCase();
      return (
        plan.numero_afiliado?.toLowerCase().includes(searchLower) ||
        plan.TipoDePlan?.tipo_plan_nombre?.toLowerCase().includes(searchLower) ||
        plan.Cobrador?.cobrador_apellido?.toLowerCase().includes(searchLower) ||
        plan.Cobrador?.cobrador_nombre?.toLowerCase().includes(searchLower) ||
        plan.ObraSocial?.os_nombre?.toLowerCase().includes(searchLower)
      );
    })
    .slice(0, ITEMS_PER_PAGE);

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
      <div className="gestion-planes-v1__header">
        <h2 className="gestion-planes-v1__title">Planes de Servicio v1.0</h2>
        <div className="gestion-planes-v1__actions">
          <ActionButton variant="primary" icon="+" onClick={handleCrearPlan}>
            Nuevo Plan
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => setBulkUpdateModalOpen(true)}
          >
            Aumento Masivo
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => setGenerarRecibosModalOpen(true)}>
            Generar Recibos
          </ActionButton>
        </div>
      </div>

      {error && <div className="gestion-planes-v1__alert gestion-planes-v1__alert--error">{error}</div>}
      {success && <div className="gestion-planes-v1__alert gestion-planes-v1__alert--success">{success}</div>}

      {planes.length > 0 && (
        <SearchContainer
          placeholder="Buscar por número de afiliado, tipo de plan, cobrador u obra social... (presiona Enter para buscar inmediatamente)"
          value={searchText}
          onChange={setSearchText}
          onKeyDown={handleSearchKeyDown}
          count={planesFiltered.length}
          maxItems={ITEMS_PER_PAGE}
        />
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
                <th>Número de Afiliado</th>
                <th>Tipo de Plan</th>
                <th>Cobrador</th>
                <th>Obra Social</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {planesFiltered.map((plan) => (
                <tr key={plan.plan_numero}>
                  <td>{plan.numero_afiliado}</td>
                  <td>{plan.TipoDePlan?.tipo_plan_nombre || '—'}</td>
                  <td>{plan.Cobrador?.cobrador_apellido}, {plan.Cobrador?.cobrador_nombre}</td>
                  <td>{plan.ObraSocial?.os_nombre || '—'}</td>
                  <td>
                    <StatusBadge status={plan.estado} />
                  </td>
                  <td className="table-actions">
                    <div className="action-button-group">
                      <IconButton
                        icon="edit"
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
