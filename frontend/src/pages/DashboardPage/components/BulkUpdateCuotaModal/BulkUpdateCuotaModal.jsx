import React, { useState, useEffect } from 'react';
import planesService from '../../../../services/planesService';
import lookupService from '../../../../services/lookupService';
import './BulkUpdateCuotaModal.scss';

function BulkUpdateCuotaModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: config, 2: preview, 3: confirm
  const [tipoAumento, setTipoAumento] = useState('porcentual'); // 'fijo' | 'porcentual'
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
    setTipoAumento('porcentual');
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

  const getUnidadTexto = () => {
    return tipoAumento === 'porcentual' ? '%' : '$';
  };

  const handlePreview = async () => {
    setError(null);

    // Validar valor
    if (!valor || parseFloat(valor) <= 0) {
      setError(`Ingresa un valor ${tipoAumento === 'porcentual' ? 'porcentual' : 'fijo'} válido`);
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
        tipoAumento,
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-cuota-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Aumento Masivo de Cuotas</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <>
              {/* Tipo de Aumento */}
              <div className="form-group">
                <label>Tipo de aumento:</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="tipoAumento"
                      value="porcentual"
                      checked={tipoAumento === 'porcentual'}
                      onChange={(e) => setTipoAumento(e.target.value)}
                    />
                    Porcentual (%)
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="tipoAumento"
                      value="fijo"
                      checked={tipoAumento === 'fijo'}
                      onChange={(e) => setTipoAumento(e.target.value)}
                    />
                    Fijo ($)
                  </label>
                </div>
              </div>

              {/* Valor del Aumento */}
              <div className="form-group">
                <label>
                  Valor del aumento:
                  <span className="form-hint">
                    {tipoAumento === 'porcentual'
                      ? ' (ej: 10 para 10%)'
                      : ' (ej: 50 para $50)'}
                  </span>
                </label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder={tipoAumento === 'porcentual' ? '10' : '50.00'}
                  />
                  <span className="input-unit">{getUnidadTexto()}</span>
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
                  Tipo de aumento: <strong>
                    {tipoAumento === 'porcentual'
                      ? `${valor}%`
                      : `$${Number(valor).toFixed(2)}`
                    }
                  </strong>
                </p>
                {filtro !== 'todos' && (
                  <p>
                    Filtro: <strong>{getSelectLabel()} - {selectValue}</strong>
                  </p>
                )}
              </div>

              <div className="planes-list">
                <h4>Primeros planes a afectar:</h4>
                {affectedPlanes.length > 0 ? (
                  <div className="planes-table">
                    <div className="planes-table__header">
                      <div>Plan #</div>
                      <div>Afiliado</div>
                      <div>Cuota Actual</div>
                    </div>
                    {affectedPlanes.slice(0, 5).map((plan) => (
                      <div key={plan.plan_numero} className="planes-table__row">
                        <div>{plan.plan_numero}</div>
                        <div>{plan.numero_afiliado}</div>
                        <div>${Number(plan.valor_cuota || 0).toFixed(2)}</div>
                      </div>
                    ))}
                    {affectedPlanes.length > 5 && (
                      <div className="planes-table__more">
                        ... y {affectedPlanes.length - 5} más
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="empty-message">No hay planes para mostrar</p>
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
  );
}

export default BulkUpdateCuotaModal;
