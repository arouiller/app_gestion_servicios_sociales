import React, { useState, useEffect, useCallback, useMemo } from 'react';
import planesService from '../../../../services/planesService';
import lookupService from '../../../../services/lookupService';
import { useConfig } from '../../../../hooks/useConfig';
import { formatNumeroAfiliado } from '../../../../utils/formatters';
import ConfirmCloseDialog from '../../../../components/ConfirmCloseDialog/ConfirmCloseDialog';
import { useModalEscapeKey } from '../../../../hooks/useModalEscapeKey';
import useColumnResize from '../../../../hooks/useColumnResize';
import './BulkUpdateCuotaModal.scss';

function BulkUpdateCuotaModal({ isOpen, onClose, onSuccess }) {
  const { config } = useConfig();
  const [step, setStep] = useState(1); // 1: config, 2: preview, 3: confirm
  const [valor, setValor] = useState('');
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'tipo_plan' | 'cobrador' | 'os'
  const [selectValue, setSelectValue] = useState('');
  const [previewCount, setPreviewCount] = useState(null);
  const [affectedPlanes, setAffectedPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lookupData, setLookupData] = useState({
    tiposPlan: [],
    cobradores: [],
    obrasSociales: [],
  });
  const [previewPage, setPreviewPage] = useState(1);
  const planesPerPage = 10;
  const [searchFilter, setSearchFilter] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const precision = config ? parseFloat(config.redondeo_precision) || 1 : 1;

  // Column resize hook for preview table
  const { widths, getResizeHandle } = useColumnResize(
    'bulk-update-preview',
    { plan: 100, afiliado: 120, cuotaActual: 130, aumento: 140, cuotaNueva: 130 }
  );

  // Detect if form has changes
  const hasChanges = useMemo(() => {
    return step > 1 || valor !== '' || filtro !== 'todos' || selectValue !== '';
  }, [step, valor, filtro, selectValue]);

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
      loadLookupData();
      resetForm();
    }
  }, [isOpen]);

  const loadLookupData = async () => {
    try {
      const [tiposDeplan, cobradores, obrasSociales] = await Promise.all([
        lookupService.getTiposDePlan(),
        lookupService.getCobradores(),
        lookupService.getObrasSociales(),
      ]);

      setLookupData({
        tiposPlan: Array.isArray(tiposDeplan) ? tiposDeplan : [],
        cobradores: Array.isArray(cobradores) ? cobradores : [],
        obrasSociales: Array.isArray(obrasSociales) ? obrasSociales : [],
      });
    } catch (err) {
      console.error('Error loading lookup data:', err);
      setError('Error al cargar datos de filtros');
    }
  };

  const resetForm = () => {
    setStep(1);
    setValor('');
    setFiltro('todos');
    setSelectValue('');
    setPreviewCount(null);
    setAffectedPlanes([]);
    setError(null);
  };

  const handleFiltroChange = (e) => {
    setFiltro(e.target.value);
    setSelectValue('');
    setPreviewCount(null);
  };

  const getSelectOptions = () => {
    if (filtro === 'tipo_plan') return lookupData.tiposPlan;
    if (filtro === 'cobrador') return lookupData.cobradores;
    if (filtro === 'os') return lookupData.obrasSociales;
    return [];
  };

  const getSelectLabel = () => {
    if (filtro === 'tipo_plan') return 'Tipo de Plan';
    if (filtro === 'cobrador') return 'Cobrador';
    if (filtro === 'os') return 'Obra Social';
    return '';
  };

  const getSelectKeyField = () => {
    if (filtro === 'tipo_plan') return 'tipo_plan_numero';
    if (filtro === 'cobrador') return 'cobrador_numero';
    if (filtro === 'os') return 'os_numero';
    return 'numero';
  };

  const getSelectNameField = () => {
    if (filtro === 'tipo_plan') return 'tipo_plan_nombre';
    if (filtro === 'cobrador') return ['cobrador_apellido', 'cobrador_nombre'];
    if (filtro === 'os') return 'os_nombre';
    return 'nombre';
  };

  const getSelectDisplayName = (item) => {
    const nameField = getSelectNameField();
    if (Array.isArray(nameField)) {
      return `${item[nameField[0]]} ${item[nameField[1]]}`.trim();
    }
    return item[nameField];
  };

  const calculateNewCuota = (valorActual) => {
    const valActualNum = parseFloat(valorActual || 0);
    let valorNuevo = valActualNum * (1 + parseFloat(valor) / 100);
    valorNuevo = Math.ceil(valorNuevo / precision) * precision;
    valorNuevo = Math.round(valorNuevo * 10000) / 10000;
    return valorNuevo;
  };

  const calculateDifference = (valorActual) => {
    const valActualNum = parseFloat(valorActual || 0);
    const newCuota = calculateNewCuota(valorActual);
    return newCuota - valActualNum;
  };

  const handlePreview = async () => {
    setError(null);

    // Validar valor
    if (!valor) {
      setError('Ingresa un porcentaje válido');
      return;
    }

    // Validar filtro si no es "todos"
    if (filtro !== 'todos' && !selectValue) {
      setError(`Selecciona un ${getSelectLabel().toLowerCase()}`);
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (filtro === 'tipo_plan' && selectValue) {
        params.tipo_plan_numero = selectValue;
      } else if (filtro === 'cobrador' && selectValue) {
        params.cobrador_numero = selectValue;
      } else if (filtro === 'os' && selectValue) {
        params.os_numero = selectValue;
      }

      // Get preview count
      const countRes = await planesService.countByFilter(filtro, params);
      if (!countRes.success) {
        setError(countRes.message || 'Error al obtener preview');
        return;
      }

      // Get affected planes
      const planesRes = await planesService.getByFilter(filtro, params);
      if (!planesRes.success) {
        setError(planesRes.message || 'Error al obtener planes');
        return;
      }

      setPreviewCount(countRes.count);
      setAffectedPlanes(planesRes.data);
      setPreviewPage(1);
      setSearchFilter('');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error al cargar preview');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (filtro === 'tipo_plan' && selectValue) {
        params.tipo_plan_numero = selectValue;
      } else if (filtro === 'cobrador' && selectValue) {
        params.cobrador_numero = selectValue;
      } else if (filtro === 'os' && selectValue) {
        params.os_numero = selectValue;
      }

      const payload = {
        valor: parseFloat(valor),
        tipoAumento: 'porcentual',
        filtro,
        ...params,
      };

      const result = await planesService.bulkUpdateCuota(payload);

      if (!result.success) {
        setError(result.message || 'Error al actualizar');
        return;
      }

      onSuccess?.(result);
      onClose();
      resetForm();
    } catch (err) {
      setError(err.message || 'Error al ejecutar actualización');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content bulk-cuota-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Aumento Masivo de Cuotas</h2>
          </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <>
              {/* Porcentaje de Aumento */}
              <div className="form-group">
                <label>
                  Porcentaje de aumento (%):
                  <span className="form-hint"> (ej: 10 para +10%)</span>
                </label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="10"
                  />
                  <span className="input-unit">%</span>
                </div>
              </div>

              {/* Filtro de Planes */}
              <div className="form-group">
                <label>Seleccionar planes:</label>
                <select value={filtro} onChange={handleFiltroChange}>
                  <option value="todos">Todos los planes activos</option>
                  <option value="tipo_plan">Por Tipo de Plan</option>
                  <option value="cobrador">Por Cobrador</option>
                  <option value="os">Por Obra Social</option>
                </select>
              </div>

              {/* Selector de Filtro (si no es "todos") */}
              {filtro !== 'todos' && (
                <div className="form-group">
                  <label>{getSelectLabel()}:</label>
                  <select
                    value={selectValue}
                    onChange={(e) => setSelectValue(e.target.value)}
                  >
                    <option value="">— Seleccionar —</option>
                    {getSelectOptions().length > 0 ? (
                      getSelectOptions().map((item) => (
                        <option
                          key={item[getSelectKeyField()]}
                          value={item[getSelectKeyField()]}
                        >
                          {getSelectDisplayName(item)}
                        </option>
                      ))
                    ) : (
                      <option disabled>Sin opciones disponibles</option>
                    )}
                  </select>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="preview-summary">
                <p>Se afectarán <strong>{previewCount} planes</strong></p>
                <p>
                  Aumento: <strong>+{valor}%</strong>
                </p>
                {filtro !== 'todos' && (
                  <p>
                    Filtro: <strong>{getSelectLabel()} - {selectValue}</strong>
                  </p>
                )}
              </div>

              <div className="planes-list">
                <h4>Planes a afectar:</h4>

                {affectedPlanes.length > planesPerPage && (
                  <div className="search-filter">
                    <input
                      type="text"
                      placeholder="Buscar por Plan # o Afiliado..."
                      value={searchFilter}
                      onChange={(e) => {
                        setSearchFilter(e.target.value);
                        setPreviewPage(1);
                      }}
                      className="search-input"
                    />
                  </div>
                )}

                {affectedPlanes.length > 0 ? (
                  <>
                    <table className="bulk-cuota-modal__table">
                      <thead>
                        <tr>
                          <th style={{ width: widths.plan }}>Plan{getResizeHandle('plan')}</th>
                          <th style={{ width: widths.afiliado }}>Afiliado{getResizeHandle('afiliado')}</th>
                          <th style={{ width: widths.cuotaActual }}>Cuota Actual{getResizeHandle('cuotaActual')}</th>
                          <th style={{ width: widths.aumento }}>Aumento{getResizeHandle('aumento')}</th>
                          <th style={{ width: widths.cuotaNueva }}>Cuota Nueva{getResizeHandle('cuotaNueva')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affectedPlanes
                          .filter(
                            (plan) =>
                              searchFilter === '' ||
                              plan.plan_numero.toString().includes(searchFilter) ||
                              plan.numero_afiliado.toString().includes(searchFilter)
                          )
                          .slice((previewPage - 1) * planesPerPage, previewPage * planesPerPage)
                          .map((plan) => {
                            const newCuota = calculateNewCuota(plan.valor_cuota);
                            const difference = calculateDifference(plan.valor_cuota);
                            const porcentaje = ((difference / (plan.valor_cuota || 1)) * 100).toFixed(1);
                            return (
                              <tr key={plan.plan_numero}>
                                <td>{plan.plan_numero}</td>
                                <td>{formatNumeroAfiliado(plan.numero_afiliado)}</td>
                                <td>${Number(plan.valor_cuota || 0).toFixed(2)}</td>
                                <td>
                                  {`+${valor}% ($${difference.toFixed(2)})`}
                                </td>
                                <td>${newCuota.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>

                    {/* Paginación */}
                    {affectedPlanes.filter(
                      (plan) =>
                        searchFilter === '' ||
                        plan.plan_numero.toString().includes(searchFilter) ||
                        plan.numero_afiliado.toString().includes(searchFilter)
                    ).length > planesPerPage && (
                      <div className="bulk-cuota-modal__pagination">
                        <button
                          type="button"
                          disabled={previewPage === 1}
                          onClick={() => setPreviewPage(previewPage - 1)}
                          className="bulk-cuota-modal__btn-pagination"
                        >
                          ← Anterior
                        </button>
                        <span className="bulk-cuota-modal__pagination-info">
                          Página {previewPage} de{' '}
                          {Math.ceil(
                            affectedPlanes.filter(
                              (plan) =>
                                searchFilter === '' ||
                                plan.plan_numero.toString().includes(searchFilter) ||
                                plan.numero_afiliado.toString().includes(searchFilter)
                            ).length / planesPerPage
                          )}
                        </span>
                        <button
                          type="button"
                          disabled={
                            previewPage >=
                            Math.ceil(
                              affectedPlanes.filter(
                                (plan) =>
                                  searchFilter === '' ||
                                  plan.plan_numero.toString().includes(searchFilter) ||
                                  plan.numero_afiliado.toString().includes(searchFilter)
                              ).length / planesPerPage
                            )
                          }
                          onClick={() => setPreviewPage(previewPage + 1)}
                          className="bulk-cuota-modal__btn-pagination"
                        >
                          Siguiente →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="bulk-cuota-modal__empty">No hay planes para mostrar</p>
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
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePreview}
                disabled={loading || !valor || (filtro !== 'todos' && !selectValue)}
              >
                {loading ? 'Cargando...' : 'Ver preview'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                Atrás
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Confirmar actualización'}
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

export default BulkUpdateCuotaModal;
