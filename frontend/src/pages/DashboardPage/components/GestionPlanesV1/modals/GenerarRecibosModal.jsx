import React, { useState, useEffect } from 'react';
import recibosService from '../../../../../services/recibosService';
import './GenerarRecibosModal.scss';

function GenerarRecibosModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: config, 2: generating, 3: done
  const [periodo, setPeriodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recibosGenerados, setRecibosGenerados] = useState([]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setPeriodo('');
    setError(null);
    setRecibosGenerados([]);
    setLoading(false);
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    // Convertir de formato YYYY-MM a YYYY-MM-01
    if (value) {
      setPeriodo(`${value}-01`);
    } else {
      setPeriodo('');
    }
  };

  const getPeriodoDisplay = () => {
    if (!periodo) return '';
    const date = new Date(periodo);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
  };

  const handleGenerar = async () => {
    setError(null);

    if (!periodo) {
      setError('Selecciona un período');
      return;
    }

    setLoading(true);
    setStep(2);

    try {
      // Generar para todos los planes (planes array vacío)
      const result = await recibosService.generar({
        periodo,
        planes: [],
      });

      if (!result.mensaje && !result.recibos) {
        setError(result.message || 'Error al generar recibos');
        setStep(1);
        return;
      }

      setRecibosGenerados(result.recibos || []);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Error al generar recibos');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 3) {
      onSuccess?.({ recibos: recibosGenerados });
      onClose();
      resetForm();
    } else {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content generar-recibos-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generar Recibos</h2>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <>
              <div className="form-group">
                <label>Período:</label>
                <input
                  type="month"
                  value={periodo.substring(0, 7)}
                  onChange={handleDateChange}
                />
                {periodo && (
                  <p className="periodo-display">
                    Generarás recibos para <strong>{getPeriodoDisplay()}</strong> para todos los planes ACTIVO
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="generating-state">
              <div className="spinner"></div>
              <p>Generando recibos para {getPeriodoDisplay()}...</p>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="success-message">
                <p className="success-icon">✓</p>
                <p className="success-text">
                  <strong>{recibosGenerados.length} recibos generados</strong> exitosamente
                </p>
              </div>

              <div className="recibos-list">
                <h4>Recibos generados:</h4>
                {recibosGenerados.length > 0 ? (
                  <div className="recibos-table">
                    <div className="recibos-table__header">
                      <div>ID</div>
                      <div>Afiliado</div>
                      <div>Titular</div>
                      <div>Monto</div>
                    </div>
                    {recibosGenerados.slice(0, 10).map((recibo) => (
                      <div key={recibo.id} className="recibos-table__row">
                        <div>{recibo.id}</div>
                        <div>{recibo.numero_afiliado}</div>
                        <div>{recibo.titular_apellido}, {recibo.titular_nombre}</div>
                        <div>${Number(recibo.valor_cuota).toFixed(2)}</div>
                      </div>
                    ))}
                    {recibosGenerados.length > 10 && (
                      <div className="recibos-table__more">
                        ... y {recibosGenerados.length - 10} más
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="empty-message">No se generaron recibos</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleClose}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerar}
                disabled={!periodo || loading}
              >
                Generar
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setStep(1);
                }}
              >
                Generar más
              </button>
              <button
                className="btn btn-primary"
                onClick={handleClose}
              >
                Imprimir
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerarRecibosModal;
