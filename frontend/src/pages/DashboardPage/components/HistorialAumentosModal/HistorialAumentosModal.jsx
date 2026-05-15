import React, { useState, useEffect } from 'react';
import planesService from '../../../../services/planesService';
import { useModalEscapeKey } from '../../../../hooks/useModalEscapeKey';
import useColumnResize from '../../../../hooks/useColumnResize';
import './HistorialAumentosModal.scss';

function HistorialAumentosModal({ isOpen, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { widths, getResizeHandle } = useColumnResize(
    'historial-aumentos',
    { fecha: 180, porcentaje: 120, usuario: 200 }
  );

  useModalEscapeKey(isOpen, false, onClose);

  useEffect(() => {
    if (isOpen) {
      loadHistorial();
      setPage(1);
    }
  }, [isOpen]);

  const loadHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await planesService.getHistorialCuota();
      if (!res.success) {
        setError(res.message || 'Error al cargar historial');
        return;
      }
      setHistorial(res.data);
    } catch (err) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const totalPages = Math.ceil(historial.length / itemsPerPage);
  const paginatedHistorial = historial.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content historial-aumentos-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Historial de Aumentos de Cuota</h2>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="historial-aumentos-modal__loading">Cargando...</div>
          ) : (
            <>
              {historial.length === 0 ? (
                <div className="historial-aumentos-modal__empty">
                  No hay registros de aumentos masivos
                </div>
              ) : (
                <>
                  <table className="historial-aumentos-modal__table table-standard">
                    <thead>
                      <tr>
                        <th style={{ width: widths.fecha }}>Fecha{getResizeHandle('fecha')}</th>
                        <th style={{ width: widths.porcentaje }}>Porcentaje{getResizeHandle('porcentaje')}</th>
                        <th style={{ width: widths.usuario }}>Usuario{getResizeHandle('usuario')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistorial.map((h) => (
                        <tr key={h.id}>
                          <td>{formatFecha(h.fecha)}</td>
                          <td>{`${Number(h.porcentaje) >= 0 ? '+' : ''}${Number(h.porcentaje).toFixed(2)}%`}</td>
                          <td>
                            {h.Usuario
                              ? `${h.Usuario.apellido}, ${h.Usuario.nombre}`
                              : `ID ${h.usuario_id}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                {totalPages > 1 && (
                    <div className="historial-aumentos-modal__pagination">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="historial-aumentos-modal__btn-pagination"
                      >
                        ← Anterior
                      </button>
                      <span className="historial-aumentos-modal__pagination-info">
                        Página {page} de {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="historial-aumentos-modal__btn-pagination"
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistorialAumentosModal;
