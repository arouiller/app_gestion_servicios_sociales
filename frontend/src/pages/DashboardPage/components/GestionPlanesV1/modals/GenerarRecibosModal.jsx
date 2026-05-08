import React, { useState, useEffect, useCallback, useMemo } from 'react';
import recibosService from '../../../../../services/recibosService';
import { formatNumeroAfiliado } from '../../../../../utils/formatters';
import ConfirmCloseDialog from '../../../../../components/ConfirmCloseDialog/ConfirmCloseDialog';
import { useModalEscapeKey } from '../../../../../hooks/useModalEscapeKey';
import './GenerarRecibosModal.scss';

function GenerarRecibosModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: config, 2: confirmation (si existe), 3: generating, 4: done
  const [mes, setMes] = useState(new Date().getMonth() + 1); // 1-12
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recibosGenerados, setRecibosGenerados] = useState([]);
  const [existingPeriodo, setExistingPeriodo] = useState(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [periodoExistentePreview, setPeriodoExistentePreview] = useState(null);
  const [verificandoPeriodo, setVerificandoPeriodo] = useState(false);
  const [ultimoAumento, setUltimoAumento] = useState(null);

  // Derivar período en formato YYYY-MM-01
  const periodo = useMemo(() => {
    if (!mes || !anio || String(anio).length < 4) return '';
    return `${anio}-${String(mes).padStart(2, '0')}-01`;
  }, [mes, anio]);

  // Detect if form has changes
  const hasChanges = useMemo(() => {
    const hoy = new Date();
    return step > 1 || mes !== (hoy.getMonth() + 1) || anio !== hoy.getFullYear();
  }, [step, mes, anio]);

  // Handle ESC key with confirmation if there are changes
  const handleEscapeWithChanges = useCallback(() => {
    setShowConfirmClose(true);
  }, []);

  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    onClose?.();
  }, [onClose]);

  const handleCancelClose = useCallback(() => {
    setShowConfirmClose(false);
  }, []);

  // Use ESC key handler
  useModalEscapeKey(isOpen, hasChanges, onClose, hasChanges ? handleEscapeWithChanges : undefined);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      loadUltimoAumento();
    }
  }, [isOpen]);

  const loadUltimoAumento = async () => {
    try {
      const res = await recibosService.getUltimoAumentoMasivo();
      if (res.success && res.data) {
        setUltimoAumento(res.data);
      }
    } catch (err) {
      console.error('Error cargando último aumento:', err);
    }
  };

  // Verificación inmediata al abrir modal (sin debounce)
  useEffect(() => {
    if (!isOpen || step !== 1) return;

    const checkInitialPeriodo = async () => {
      try {
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();
        const periodoActual = `${anioActual}-${String(mesActual).padStart(2, '0')}`;

        const periodos = await recibosService.listPeriodos();
        const existe = periodos?.find(p => p.periodo === periodoActual);
        setPeriodoExistentePreview(existe || null);
      } catch (err) {
        console.error('Error verificando período inicial:', err);
      }
    };

    checkInitialPeriodo();
  }, [isOpen, step]);

  // Verificar si el período seleccionado ya tiene recibos (con debounce para cambios posteriores)
  useEffect(() => {
    if (!isOpen || !periodo || step !== 1) {
      // Solo verificar cuando el modal está abierto, en step 1 y si hay período válido
      setPeriodoExistentePreview(null);
      return;
    }

    setVerificandoPeriodo(true);

    // Debounce de 500ms
    const timeoutId = setTimeout(async () => {
      try {
        const periodos = await recibosService.listPeriodos();
        const periodoYYYYMM = periodo.substring(0, 7); // YYYY-MM
        const existe = periodos?.find(p => p.periodo === periodoYYYYMM);
        setPeriodoExistentePreview(existe || null);
      } catch (err) {
        console.error('Error verificando período:', err);
        setPeriodoExistentePreview(null);
      } finally {
        setVerificandoPeriodo(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [periodo, step]);

  const resetForm = () => {
    setStep(1);
    setMes(new Date().getMonth() + 1);
    setAnio(new Date().getFullYear());
    setError(null);
    setRecibosGenerados([]);
    setExistingPeriodo(null);
    setPeriodoExistentePreview(null);
    setVerificandoPeriodo(false);
    setLoading(false);
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

    try {
      // Primera llamada: verificar si el período ya existe
      const result = await recibosService.generar({
        periodo,
        planes: [],
      });

      // Si existe período y no tiene force, el backend retorna 409 con existe: true
      if (result.existe === true) {
        // Mostrar confirmación
        setExistingPeriodo(result);
        setStep(2);
        setLoading(false);
        return;
      }

      // Si no existe, proceder con la generación (step 3: generating)
      setStep(3);
      setRecibosGenerados(result.recibos || []);
      setStep(4);
    } catch (err) {
      // Error al generar
      setError(err.message || 'Error al generar recibos');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegeneration = async () => {
    setError(null);
    setLoading(true);
    setStep(3);

    try {
      // Segunda llamada: con force=true para regenerar
      const result = await recibosService.generar({
        periodo,
        planes: [],
        force: true,
      });

      if (!result.recibos) {
        setError(result.message || 'Error al regenerar recibos');
        setStep(2);
        setLoading(false);
        return;
      }

      setRecibosGenerados(result.recibos || []);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Error al regenerar recibos');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 4) {
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
    <>
      <div className="modal-overlay">
        <div className="modal-content generar-recibos-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Generar Recibos</h2>
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
                <div className="periodo-selectors">
                  <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                      .map((nombre, i) => (
                        <option key={i + 1} value={i + 1}>{nombre}</option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min="2000"
                    max="2099"
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                  />
                </div>
                {periodo && (
                  <>
                    <p className="periodo-display">
                      Generarás recibos para <strong>{getPeriodoDisplay()}</strong> para todos los planes ACTIVO
                    </p>
                    {ultimoAumento && (
                      <div className="generar-recibos-modal__ultimo-aumento">
                        <strong>Último aumento masivo:</strong> {ultimoAumento.porcentaje}% realizado el{' '}
                        {new Date(ultimoAumento.fecha).toLocaleString('es-AR')} por{' '}
                        {ultimoAumento.Usuario
                          ? `${ultimoAumento.Usuario.apellido}, ${ultimoAumento.Usuario.nombre}`
                          : 'Usuario desconocido'}
                      </div>
                    )}
                    {verificandoPeriodo && (
                      <div className="periodo-checking">
                        <span className="spinner-mini"></span>
                        Verificando período...
                      </div>
                    )}
                    {periodoExistentePreview && !verificandoPeriodo && (
                      <div className="periodo-existe-alerta">
                        <p className="alerta-icon">⚠️</p>
                        <p className="alerta-titulo">Período con recibos existentes</p>
                        <p className="alerta-texto">
                          Ya existen <strong>{periodoExistentePreview.cantidad_recibos} recibos</strong> para este período.
                        </p>
                        <p className="alerta-subtexto">
                          Se borrarán y regenerarán si haces clic en "Generar"
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {step === 2 && existingPeriodo && (
            <>
              <div className="warning-message">
                <p className="warning-icon">⚠️</p>
                <p className="warning-title">Período ya tiene recibos generados</p>
                <p className="warning-text">
                  Ya existen <strong>{existingPeriodo.cantidad} recibos</strong> generados para el período <strong>{getPeriodoDisplay()}</strong>.
                </p>
              </div>

              <div className="confirmation-alert">
                <p>
                  Si continúas, <strong>todos los recibos del período serán borrados y se volverán a generar</strong>.
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="generating-state">
              <div className="spinner"></div>
              <p>Generando recibos para {getPeriodoDisplay()}...</p>
            </div>
          )}

          {step === 4 && (
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
                        <div>{formatNumeroAfiliado(recibo.numero_afiliado)}</div>
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

          {step === 2 && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setStep(1);
                  setExistingPeriodo(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmRegeneration}
                disabled={loading}
              >
                {loading ? 'Regenerando...' : 'Sí, Regenerar'}
              </button>
            </>
          )}

          {step === 4 && (
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

      {/* Confirmation dialog for closing with unsaved changes */}
      <ConfirmCloseDialog
        isOpen={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title="¿Cerrar sin guardar?"
      />
    </>
  );
}

export default GenerarRecibosModal;
