import React, { useState, useEffect, useCallback, useMemo } from 'react';
import recibosService from '../../services/recibosService';
import GenerarRecibosModal from '../DashboardPage/components/GestionPlanesV1/modals/GenerarRecibosModal';
import ReciboDetalleModal from '../DashboardPage/components/GestionPlanesV1/modals/ReciboDetalleModal';
import './RecibosPage.scss';

const ITEMS_PER_PAGE = 10;

// Helper function to format period string timezone-safely
const formatPeriodo = (periodoYYYYMM) => {
  if (!periodoYYYYMM || periodoYYYYMM.length < 7) return '';
  const [anio, mesNum] = periodoYYYYMM.substring(0, 7).split('-');
  const nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${nombres[parseInt(mesNum, 10) - 1]} ${anio}`;
};

// Helper function to format date
const formatFecha = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-AR');
};

function RecibosPage() {
  // Vista state
  const [vista, setVista] = useState('periodos'); // 'periodos' | 'detalle-periodo'

  // Periodos list state
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detalle periodo state
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [recibos, setRecibos] = useState([]);
  const [recibosLoading, setRecibosLoading] = useState(false);
  const [recibosPage, setRecibosPage] = useState(1);

  // Modal states
  const [generarModalOpen, setGenerarModalOpen] = useState(false);
  const [reciboDetalleId, setReciboDetalleId] = useState(null);

  // Load periodos on mount
  useEffect(() => {
    loadPeriodos();
  }, []);

  const loadPeriodos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await recibosService.listPeriodos();
      setPeriodos(data || []);
    } catch (err) {
      setError('Error al cargar períodos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecibos = useCallback(async (periodo) => {
    setRecibosLoading(true);
    try {
      // Convertir periodo de YYYY-MM a YYYY-MM-01 (formato esperado por el backend)
      const periodoConDia = periodo.length === 7 ? `${periodo}-01` : periodo;
      const data = await recibosService.list(periodoConDia);
      setRecibos(data || []);
      setRecibosPage(1);
    } catch (err) {
      console.error('Error loading recibos:', err);
      setRecibos([]);
    } finally {
      setRecibosLoading(false);
    }
  }, []);

  const handleVerRecibos = (periodo) => {
    setPeriodoSeleccionado(periodo);
    setVista('detalle-periodo');
    loadRecibos(periodo.periodo);
  };

  const handleVolver = () => {
    setVista('periodos');
    setPeriodoSeleccionado(null);
    setRecibos([]);
  };

  const handleGenerarSuccess = async () => {
    // Reload periodos list after generation
    await loadPeriodos();
    setGenerarModalOpen(false);
  };

  // Paginación para recibos
  const totalRecibosPages = useMemo(() => {
    return Math.ceil(recibos.length / ITEMS_PER_PAGE);
  }, [recibos.length]);

  const recibosDisplayed = useMemo(() => {
    const start = (recibosPage - 1) * ITEMS_PER_PAGE;
    return recibos.slice(start, start + ITEMS_PER_PAGE);
  }, [recibos, recibosPage]);

  // Vista: Periodos
  if (vista === 'periodos') {
    return (
      <div className="recibos-page">
        {/* Header */}
        <div className="recibos-page__header">
          <h1>Gestión de Recibos</h1>
          <button
            className="recibos-page__btn-primary"
            onClick={() => setGenerarModalOpen(true)}
          >
            + Generar Recibos
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="recibos-page__alert recibos-page__alert--error">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="recibos-page__content">
          {loading ? (
            <div className="recibos-page__loading">Cargando períodos...</div>
          ) : periodos.length === 0 ? (
            <div className="recibos-page__empty">
              <p>No hay recibos generados aún.</p>
              <p>Usá el botón "Generar Recibos" para crear recibos para un período.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table-standard recibos-page__table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Cantidad de Recibos</th>
                    <th>Fecha de Generación</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {periodos.map((periodo, idx) => (
                    <tr key={idx}>
                      <td>{formatPeriodo(periodo.periodo)}</td>
                      <td>{periodo.cantidad_recibos}</td>
                      <td>{formatFecha(periodo.fecha_generacion)}</td>
                      <td>
                        <button
                          className="recibos-page__btn-action"
                          onClick={() => handleVerRecibos(periodo)}
                        >
                          Ver recibos
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GenerarRecibosModal */}
        <GenerarRecibosModal
          isOpen={generarModalOpen}
          onClose={() => setGenerarModalOpen(false)}
          onSuccess={handleGenerarSuccess}
        />
      </div>
    );
  }

  // Vista: Detalle Periodo
  if (vista === 'detalle-periodo' && periodoSeleccionado) {
    return (
      <div className="recibos-page">
        {/* Header */}
        <div className="recibos-page__header">
          <div className="recibos-page__header-left">
            <button
              className="recibos-page__btn-back"
              onClick={handleVolver}
              title="Volver a lista de períodos"
            >
              ← Períodos
            </button>
            <h1>Recibos — {formatPeriodo(periodoSeleccionado.periodo)}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="recibos-page__content">
          {recibosLoading ? (
            <div className="recibos-page__loading">Cargando recibos...</div>
          ) : recibos.length === 0 ? (
            <div className="recibos-page__empty">
              <p>No hay recibos para este período.</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table-standard recibos-page__table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>N° Afiliado</th>
                      <th>Titular</th>
                      <th>Obra Social</th>
                      <th>Valor Cuota</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recibosDisplayed.map((recibo, idx) => (
                      <tr key={idx}>
                        <td>{recibo.id}</td>
                        <td>{recibo.numero_afiliado}</td>
                        <td>{recibo.titular_apellido}, {recibo.titular_nombre}</td>
                        <td>{recibo.obra_social || '-'}</td>
                        <td>${Number(recibo.valor_cuota).toFixed(2)}</td>
                        <td>
                          <button
                            className="recibos-page__btn-action"
                            onClick={() => setReciboDetalleId(recibo.id)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalRecibosPages > 1 && (
                <div className="recibos-page__pagination">
                  <button
                    disabled={recibosPage === 1}
                    onClick={() => setRecibosPage(recibosPage - 1)}
                  >
                    ← Anterior
                  </button>
                  <span>
                    Página {recibosPage} de {totalRecibosPages}
                  </span>
                  <button
                    disabled={recibosPage >= totalRecibosPages}
                    onClick={() => setRecibosPage(recibosPage + 1)}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ReciboDetalleModal */}
        {reciboDetalleId && (
          <ReciboDetalleModal
            reciboId={reciboDetalleId}
            isOpen={!!reciboDetalleId}
            onClose={() => setReciboDetalleId(null)}
          />
        )}
      </div>
    );
  }

  // Fallback
  return null;
}

export default RecibosPage;
