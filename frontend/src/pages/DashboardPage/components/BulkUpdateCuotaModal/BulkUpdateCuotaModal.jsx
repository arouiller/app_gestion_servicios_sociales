import React, { useState, useEffect } from 'react';
import planesService from '../../../../services/planesService';
import lookupService from '../../../../services/lookupService';
import './BulkUpdateCuotaModal.scss';

function BulkUpdateCuotaModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: select filter, 2: preview, 3: confirm
  const [filtro, setFiltro] = useState('tipo_plan');
  const [nuevoCuota, setNuevoCuota] = useState('');
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
      const [tpRes, cobRes, osRes] = await Promise.all([
        lookupService.getTipoPlan(),
        lookupService.getCobrador(),
        lookupService.getObraSocial(),
      ]);

      setLookupData({
        tiposPlan: tpRes.success ? tpRes.data : [],
        cobradores: cobRes.success ? cobRes.data : [],
        obrasSociales: osRes.success ? osRes.data : [],
      });
    } catch (err) {
      console.error('Error loading lookup data:', err);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFiltro('tipo_plan');
    setNuevoCuota('');
    setSelectValue('');
    setPreviewCount(null);
    setAffectedPlanes([]);
    setError(null);
  };

  const handleFilterChange = (e) => {
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
    return 'Seleccionar';
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

  const handlePreview = async () => {
    setError(null);

    if (!nuevoCuota || parseFloat(nuevoCuota) <= 0) {
      setError('Ingresa un valor válido');
      return;
    }

    if (!selectValue) {
      setError(`Selecciona un ${getSelectLabel().toLowerCase()}`);
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (filtro === 'tipo_plan') params.tipo_plan_numero = selectValue;
      else if (filtro === 'cobrador') params.cobrador_numero = selectValue;
      else if (filtro === 'os') params.os_numero = selectValue;

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (filtro === 'tipo_plan') params.tipo_plan_numero = selectValue;
      else if (filtro === 'cobrador') params.cobrador_numero = selectValue;
      else if (filtro === 'os') params.os_numero = selectValue;

      const payload = {
        nuevo_valor: parseFloat(nuevoCuota),
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
      setError(err.message);
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
              <div className="form-group">
                <label>Filtrar por:</label>
                <select value={filtro} onChange={handleFilterChange}>
                  <option value="tipo_plan">Tipo de Plan</option>
                  <option value="cobrador">Cobrador</option>
                  <option value="os">Obra Social</option>
                </select>
              </div>

              <div className="form-group">
                <label>{getSelectLabel()}:</label>
                <select
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                >
                  <option value="">— Seleccionar —</option>
                  {getSelectOptions().map((item) => (
                    <option key={item[getSelectKeyField()]} value={item[getSelectKeyField()]}>
                      {getSelectDisplayName(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Nuevo valor de cuota:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevoCuota}
                  onChange={(e) => setNuevoCuota(e.target.value)}
                  placeholder="Ej: 500.00"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="preview-summary">
                <p>Se afectarán <strong>{previewCount} planes</strong></p>
                <p>Nuevo valor de cuota: <strong>${parseFloat(nuevoCuota).toFixed(2)}</strong></p>
              </div>

              <div className="planes-list">
                <h4>Planes afectados:</h4>
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
                        <div>${plan.valor_cuota?.toFixed(2)}</div>
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
                disabled={loading || !nuevoCuota || !selectValue}
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
