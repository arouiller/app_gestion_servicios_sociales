import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import bugsService from '../../../../../services/bugsService';
import StatusBadge from '../../../../../components/StatusBadge/StatusBadge';
import ActionButton from '../../../../../components/ActionButton/ActionButton';
import './BugDetalleModal.scss';

function BugDetalleModal({ bugId, onClose, onEstadoChanged }) {
  const { isAdmin } = useAuth();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changingEstado, setChangingEstado] = useState(false);

  useEffect(() => {
    const cargarBug = async () => {
      try {
        const data = await bugsService.obtener(bugId);
        setBug(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar bug');
      } finally {
        setLoading(false);
      }
    };
    cargarBug();
  }, [bugId]);

  const getTransicionesPermitidas = () => {
    if (!bug) return [];
    const transiciones = {
      REGISTRADO: [
        { estado: 'DESARROLLADO', label: 'Marcar Desarrollado' },
        { estado: 'DESESTIMADO', label: 'Desestimar' },
      ],
      DESARROLLADO: [{ estado: 'CERRADO', label: 'Cerrar Bug' }],
      DESESTIMADO: [{ estado: 'CERRADO', label: 'Cerrar Bug' }],
      CERRADO: [],
    };
    return transiciones[bug.estado] || [];
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!window.confirm(`¿Cambiar estado a ${nuevoEstado}?`)) return;

    setChangingEstado(true);
    setError(null);
    try {
      const data = await bugsService.cambiarEstado(bugId, nuevoEstado);
      setBug(data);
      onEstadoChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setChangingEstado(false);
    }
  };

  if (loading) {
    return (
      <div className="bug-detalle-modal__overlay" onClick={onClose}>
        <div className="bug-detalle-modal" onClick={(e) => e.stopPropagation()}>
          <div className="bug-detalle-modal__loading">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!bug) {
    return null;
  }

  const transiciones = getTransicionesPermitidas();

  return (
    <div className="bug-detalle-modal__overlay" onClick={onClose}>
      <div className="bug-detalle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bug-detalle-modal__header">
          <div className="bug-detalle-modal__header-title">
            <h3 className="bug-detalle-modal__title">{bug.numero}</h3>
            <StatusBadge status={bug.estado.toLowerCase()} />
          </div>
          <button
            className="bug-detalle-modal__close"
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="bug-detalle-modal__body">
          {error && <div className="bug-detalle-modal__error">{error}</div>}

          <div className="bug-detalle-modal__info">
            <div className="bug-detalle-modal__info-item">
              <span className="bug-detalle-modal__info-label">Reportado por:</span>
              <span className="bug-detalle-modal__info-value">
                {bug.usuario?.apellido}, {bug.usuario?.nombre}
              </span>
            </div>
            <div className="bug-detalle-modal__info-item">
              <span className="bug-detalle-modal__info-label">Fecha:</span>
              <span className="bug-detalle-modal__info-value">
                {new Date(bug.fecha_creacion).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>

          {bug.titulo && (
            <div className="bug-detalle-modal__titulo">
              <h4>Título</h4>
              <p>{bug.titulo}</p>
            </div>
          )}

          <div className="bug-detalle-modal__descripcion">
            <h4>Descripción</h4>
            <div
              className="bug-detalle-modal__descripcion-content"
              dangerouslySetInnerHTML={{ __html: bug.descripcion }}
            />
          </div>

          {isAdmin && transiciones.length > 0 && (
            <div className="bug-detalle-modal__actions">
              <h4>Cambiar Estado</h4>
              <div className="bug-detalle-modal__action-buttons">
                {transiciones.map((t) => (
                  <ActionButton
                    key={t.estado}
                    variant="secondary"
                    onClick={() => handleCambiarEstado(t.estado)}
                    disabled={changingEstado}
                  >
                    {t.label}
                  </ActionButton>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bug-detalle-modal__footer">
          <ActionButton variant="secondary" onClick={onClose}>
            Cerrar
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default BugDetalleModal;
