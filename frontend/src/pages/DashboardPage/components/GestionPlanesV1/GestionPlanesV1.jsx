import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import planesV1Service from '../../../../services/planesV1Service';
import PlanV1Modal from './modals/PlanV1Modal';
import './GestionPlanesV1.scss';

function GestionPlanesV1() {
  const { isAdmin } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | 'crear' | 'editar'
  const [planEditando, setPlanEditando] = useState(null);
  const [filtros, setFiltros] = useState({ estado: '', cobrador: '', obraSocial: '' });

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const data = await planesV1Service.listar(filtros);
      setPlanes(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar planes');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

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
    return <div className="gestion-planes-v1__loading">Cargando planes...</div>;
  }

  return (
    <div className="gestion-planes-v1">
      <div className="gestion-planes-v1__header">
        <h2 className="gestion-planes-v1__title">Planes de Servicio v1.0</h2>
        {isAdmin && (
          <button className="gestion-planes-v1__btn gestion-planes-v1__btn--primary" onClick={handleCrearPlan}>
            + Nuevo Plan
          </button>
        )}
      </div>

      {error && <div className="gestion-planes-v1__alert gestion-planes-v1__alert--error">{error}</div>}
      {success && <div className="gestion-planes-v1__alert gestion-planes-v1__alert--success">{success}</div>}

      {planes.length === 0 ? (
        <p className="gestion-planes-v1__empty">
          {isAdmin ? 'No hay planes. Creá el primero.' : 'No hay planes disponibles.'}
        </p>
      ) : (
        <div className="gestion-planes-v1__tabla-wrapper">
          <table className="gestion-planes-v1__tabla">
            <thead>
              <tr>
                <th>Número de Afiliado</th>
                <th>Tipo de Plan</th>
                <th>Cobrador</th>
                <th>Obra Social</th>
                <th>Estado</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {planes.map((plan) => (
                <tr key={plan.plan_numero}>
                  <td>{plan.numero_afiliado}</td>
                  <td>{plan.TipoDePlan?.tipo_plan_nombre || '—'}</td>
                  <td>{plan.Cobrador?.cobrador_apellido}, {plan.Cobrador?.cobrador_nombre}</td>
                  <td>{plan.ObraSocial?.os_nombre || '—'}</td>
                  <td>
                    <span className={`gestion-planes-v1__estado gestion-planes-v1__estado--${plan.estado.toLowerCase()}`}>
                      {plan.estado}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="gestion-planes-v1__tabla-acciones">
                      <button className="gestion-planes-v1__btn-icon" onClick={() => handleEditarPlan(plan)}>
                        Editar
                      </button>
                      {plan.estado !== 'SUSPENDIDO' && (
                        <button className="gestion-planes-v1__btn-icon gestion-planes-v1__btn-icon--danger" onClick={() => handleSuspenderPlan(plan)}>
                          Suspender
                        </button>
                      )}
                    </td>
                  )}
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
    </div>
  );
}

export default GestionPlanesV1;
