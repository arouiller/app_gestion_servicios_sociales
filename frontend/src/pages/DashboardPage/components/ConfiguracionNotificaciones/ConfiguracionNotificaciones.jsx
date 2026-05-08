import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfig } from '../../../../hooks/useConfig';
import configService from '../../../../services/configService';
import useColumnResize from '../../../../hooks/useColumnResize';
import './ConfiguracionNotificaciones.scss';

const NOTIFICATION_TYPES = [
  {
    key: 'error',
    label: 'Error',
    icon: '❌',
    description: 'Notificaciones de error',
  },
  {
    key: 'warning',
    label: 'Advertencia',
    icon: '⚠️',
    description: 'Notificaciones de advertencia',
  },
  {
    key: 'success',
    label: 'Éxito',
    icon: '✅',
    description: 'Notificaciones de éxito',
  },
  {
    key: 'info',
    label: 'Información',
    icon: 'ℹ️',
    description: 'Notificaciones informativas',
  },
];

export default function ConfiguracionNotificaciones() {
  const { config, loading: loadingConfig } = useConfig();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});
  const { showSuccess, showError } = useNotification();

  // Column resize hooks for 5 tables
  const { widths: widthsNotif, getResizeHandle: getResizeHandleNotif } = useColumnResize(
    'config-notificaciones',
    { tipo: 130, descripcion: 220, duracion: 140, acciones: 100 }
  );
  const { widths: widthsBusqueda, getResizeHandle: getResizeHandleBusqueda } = useColumnResize(
    'config-busqueda',
    { funcion: 130, descripcion: 220, tiempo: 140, acciones: 100 }
  );
  const { widths: widthsUI, getResizeHandle: getResizeHandleUI } = useColumnResize(
    'config-ui',
    { parametro: 130, descripcion: 220, valor: 140, acciones: 100 }
  );
  const { widths: widthsAudit, getResizeHandle: getResizeHandleAudit } = useColumnResize(
    'config-auditoria',
    { parametro: 130, descripcion: 220, valor: 140, acciones: 100 }
  );
  const { widths: widthsRedondeo, getResizeHandle: getResizeHandleRedondeo } = useColumnResize(
    'config-redondeo',
    { tipo: 200, descripcion: 250, valor: 200, acciones: 120 }
  );

  // Usar configuración del contexto
  useEffect(() => {
    if (config) {
      setValues(config);
      setErrors({});
    }
  }, [config]);

  // Manejar cambio de input
  const handleChange = (type, value) => {
    setValues((prev) => ({
      ...prev,
      [type]: Math.max(0, parseInt(value, 10) || 0),
    }));
    // Limpiar error anterior de este tipo
    if (errors[type]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[type];
        return newErrors;
      });
    }
  };

  // Guardar configuración de un tipo
  const handleSave = async (type) => {
    const newValue = values[type];

    // Validar
    if (newValue === undefined || newValue === null || newValue < 0) {
      setErrors((prev) => ({
        ...prev,
        [type]: 'Debe ser un número >= 0',
      }));
      return;
    }

    // Validaciones específicas para debounce_delay_ms
    if (type === 'debounce_delay_ms') {
      if (newValue < 100) {
        setErrors((prev) => ({
          ...prev,
          [type]: 'El tiempo mínimo es 100 ms',
        }));
        return;
      }
      if (newValue > 10000) {
        setErrors((prev) => ({
          ...prev,
          [type]: 'El tiempo máximo es 10000 ms',
        }));
        return;
      }
    }

    // Validaciones específicas para audit_retention_days
    if (type === 'audit_retention_days') {
      if (newValue < 1 || newValue > 365) {
        setErrors((prev) => ({
          ...prev,
          [type]: 'Debe estar entre 1 y 365 días',
        }));
        return;
      }
    }

    // Validaciones específicas para redondeo_precision
    if (type === 'redondeo_precision') {
      if (isNaN(newValue) || newValue <= 0) {
        setErrors((prev) => ({
          ...prev,
          [type]: 'Debe ser un valor positivo (ej: 0.01, 1, 10, 100, 500 o cualquier otro)',
        }));
        return;
      }
    }

    try {
      setSaving((prev) => ({ ...prev, [type]: true }));
      await configService.actualizarConfiguracion(type, newValue);
      showSuccess(`Duración de ${type} actualizada a ${newValue}ms`);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[type];
        return newErrors;
      });
    } catch (error) {
      console.error(`Error guardando ${type}:`, error);
      setErrors((prev) => ({
        ...prev,
        [type]: error.response?.data?.message || 'Error al guardar',
      }));
      showError(`Error al actualizar duración de ${type}`);
    } finally {
      setSaving((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Calcular segundos a partir de ms
  const msToSeconds = (ms) => (ms / 1000).toFixed(1);

  if (loadingConfig) {
    return <div className="configuracion-notificaciones__loading">Cargando configuración...</div>;
  }

  return (
    <div className="configuracion-notificaciones">
      <div className="configuracion-notificaciones__header">
        <h2>Configuración de Notificaciones</h2>
        <p className="configuracion-notificaciones__subtitle">
          Ajusta los tiempos de visibilidad de las notificaciones del sistema
        </p>
      </div>

      <div className="configuracion-notificaciones__table-wrapper">
        <table className="configuracion-notificaciones__table table-standard">
          <thead>
            <tr>
              <th style={{ width: widthsNotif.tipo }}>Tipo{getResizeHandleNotif('tipo')}</th>
              <th style={{ width: widthsNotif.descripcion }}>Descripción{getResizeHandleNotif('descripcion')}</th>
              <th style={{ width: widthsNotif.duracion }}>Duración (ms){getResizeHandleNotif('duracion')}</th>
              <th style={{ width: widthsNotif.acciones }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TYPES.map((type) => (
              <tr key={type.key}>
                {/* Tipo */}
                <td>
                  <span className={`configuracion-notificaciones__tipo-badge configuracion-notificaciones__tipo-badge--${type.key}`}>
                    <span className="configuracion-notificaciones__icon">{type.icon}</span>
                    {type.label}
                  </span>
                </td>

                {/* Descripción */}
                <td>{type.description}</td>

                {/* Duración */}
                <td className="configuracion-notificaciones__duration-cell">
                  <div className="configuracion-notificaciones__duration-group">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      className="configuracion-notificaciones__duration-input"
                      value={values[type.key] || 0}
                      onChange={(e) => handleChange(type.key, e.target.value)}
                      disabled={saving[type.key]}
                    />
                    <span className="configuracion-notificaciones__hint">
                      ({msToSeconds(values[type.key] || 0)}s)
                    </span>
                  </div>
                  {errors[type.key] && (
                    <span className="configuracion-notificaciones__error">
                      {errors[type.key]}
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="configuracion-notificaciones__actions">
                  <button
                    className="configuracion-notificaciones__btn-save"
                    onClick={() => handleSave(type.key)}
                    disabled={saving[type.key]}
                    title={saving[type.key] ? 'Guardando...' : 'Guardar configuración'}
                  >
                    {saving[type.key] ? '⏳' : '💾'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="configuracion-notificaciones__info">
        <p>
          💡 <strong>Tip:</strong> Los cambios se aplicarán a nuevas notificaciones. Las notificaciones
          visibles actualmente continuarán con su duración original.
        </p>
      </div>

      {/* Sección: Configuración de Búsquedas */}
      <div className="configuracion-notificaciones__header" style={{ marginTop: '2rem' }}>
        <h2>Configuración de Búsquedas</h2>
        <p className="configuracion-notificaciones__subtitle">
          Ajusta los tiempos de espera para las búsquedas por texto
        </p>
      </div>

      <div className="configuracion-notificaciones__table-wrapper">
        <table className="configuracion-notificaciones__table table-standard">
          <thead>
            <tr>
              <th style={{ width: widthsBusqueda.funcion }}>Función{getResizeHandleBusqueda('funcion')}</th>
              <th style={{ width: widthsBusqueda.descripcion }}>Descripción{getResizeHandleBusqueda('descripcion')}</th>
              <th style={{ width: widthsBusqueda.tiempo }}>Tiempo (ms){getResizeHandleBusqueda('tiempo')}</th>
              <th style={{ width: widthsBusqueda.acciones }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="configuracion-notificaciones__tipo-badge" style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderLeftColor: '#1976d2' }}>
                  <span className="configuracion-notificaciones__icon">🔍</span>
                  Debounce de Búsquedas
                </span>
              </td>
              <td>Tiempo a esperar sin escribir antes de ejecutar la búsqueda</td>
              <td className="configuracion-notificaciones__duration-cell">
                <div className="configuracion-notificaciones__duration-group">
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    className="configuracion-notificaciones__duration-input"
                    value={values.debounce_delay_ms || 2000}
                    onChange={(e) => handleChange('debounce_delay_ms', e.target.value)}
                    disabled={saving.debounce_delay_ms}
                  />
                  <span className="configuracion-notificaciones__hint">
                    ({msToSeconds(values.debounce_delay_ms || 2000)}s)
                  </span>
                </div>
                {errors.debounce_delay_ms && (
                  <span className="configuracion-notificaciones__error">
                    {errors.debounce_delay_ms}
                  </span>
                )}
              </td>
              <td className="configuracion-notificaciones__actions">
                <button
                  className="configuracion-notificaciones__btn-save"
                  onClick={() => handleSave('debounce_delay_ms')}
                  disabled={saving.debounce_delay_ms}
                  title={saving.debounce_delay_ms ? 'Guardando...' : 'Guardar configuración'}
                >
                  {saving.debounce_delay_ms ? '⏳' : '💾'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="configuracion-notificaciones__info">
        <p>
          💡 <strong>Tip:</strong> El debounce evita realizar búsquedas mientras el usuario está escribiendo.
          La búsqueda se ejecutará cuando el usuario haya dejado de escribir por el tiempo especificado.
          Valores recomendados: 1000-3000 ms.
        </p>
      </div>

      {/* Sección: Configuración UI */}
      <div className="configuracion-notificaciones__header" style={{ marginTop: '2rem' }}>
        <h2>Configuración UI</h2>
        <p className="configuracion-notificaciones__subtitle">
          Ajusta parámetros de la interfaz de usuario
        </p>
      </div>

      <div className="configuracion-notificaciones__table-wrapper">
        <table className="configuracion-notificaciones__table table-standard">
          <thead>
            <tr>
              <th style={{ width: widthsUI.parametro }}>Parámetro{getResizeHandleUI('parametro')}</th>
              <th style={{ width: widthsUI.descripcion }}>Descripción{getResizeHandleUI('descripcion')}</th>
              <th style={{ width: widthsUI.valor }}>Valor{getResizeHandleUI('valor')}</th>
              <th style={{ width: widthsUI.acciones }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="configuracion-notificaciones__tipo-badge" style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2', borderLeftColor: '#7b1fa2' }}>
                  <span className="configuracion-notificaciones__icon">📊</span>
                  Items por página
                </span>
              </td>
              <td>Cantidad de registros mostrados en listados (planes, afiliados, bugs, etc.)</td>
              <td className="configuracion-notificaciones__duration-cell">
                <div className="configuracion-notificaciones__duration-group">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="5"
                    className="configuracion-notificaciones__duration-input"
                    value={values.items_per_page || 15}
                    onChange={(e) => handleChange('items_per_page', e.target.value)}
                    disabled={saving.items_per_page}
                  />
                  <span className="configuracion-notificaciones__hint">
                    (registros por página)
                  </span>
                </div>
                {errors.items_per_page && (
                  <span className="configuracion-notificaciones__error">
                    {errors.items_per_page}
                  </span>
                )}
              </td>
              <td className="configuracion-notificaciones__actions">
                <button
                  className="configuracion-notificaciones__btn-save"
                  onClick={() => handleSave('items_per_page')}
                  disabled={saving.items_per_page}
                  title={saving.items_per_page ? 'Guardando...' : 'Guardar configuración'}
                >
                  {saving.items_per_page ? '⏳' : '💾'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="configuracion-notificaciones__info">
        <p>
          💡 <strong>Tip:</strong> Define cuántos registros se muestran por página en los listados.
          Rango permitido: 5-100. Valores recomendados: 10-20. Los cambios se aplicarán
          inmediatamente al recargar los listados.
        </p>
      </div>

      {/* Sección: Configuración de Auditoría */}
      <div className="configuracion-notificaciones__header" style={{ marginTop: '2rem' }}>
        <h2>Configuración de Auditoría</h2>
        <p className="configuracion-notificaciones__subtitle">
          Registra los accesos al backend para trazabilidad y compliance
        </p>
      </div>

      <div className="configuracion-notificaciones__table-wrapper">
        <table className="configuracion-notificaciones__table table-standard">
          <thead>
            <tr>
              <th style={{ width: widthsAudit.parametro }}>Parámetro{getResizeHandleAudit('parametro')}</th>
              <th style={{ width: widthsAudit.descripcion }}>Descripción{getResizeHandleAudit('descripcion')}</th>
              <th style={{ width: widthsAudit.valor }}>Valor{getResizeHandleAudit('valor')}</th>
              <th style={{ width: widthsAudit.acciones }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* Habilitación de Auditoría */}
            <tr>
              <td>
                <span className="configuracion-notificaciones__tipo-badge" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', borderLeftColor: '#2e7d32' }}>
                  <span className="configuracion-notificaciones__icon">🔒</span>
                  Habilitación
                </span>
              </td>
              <td>Activa o desactiva el registro de accesos al backend</td>
              <td className="configuracion-notificaciones__duration-cell">
                <div className="configuracion-notificaciones__duration-group">
                  <input
                    type="checkbox"
                    checked={values.audit_enabled === 1}
                    onChange={() => {
                      setValues(prev => ({ ...prev, audit_enabled: prev.audit_enabled === 1 ? 0 : 1 }));
                      if (errors.audit_enabled) {
                        setErrors(prev => { const newErrors = { ...prev }; delete newErrors.audit_enabled; return newErrors; });
                      }
                    }}
                    disabled={saving.audit_enabled}
                    style={{ width: 'auto', marginRight: '0.5rem' }}
                  />
                  <span className="configuracion-notificaciones__hint">
                    {values.audit_enabled === 1 ? '✅ Activa' : '❌ Inactiva'}
                  </span>
                </div>
              </td>
              <td className="configuracion-notificaciones__actions">
                <button
                  className="configuracion-notificaciones__btn-save"
                  onClick={() => handleSave('audit_enabled')}
                  disabled={saving.audit_enabled}
                  title={saving.audit_enabled ? 'Guardando...' : 'Guardar configuración'}
                >
                  {saving.audit_enabled ? '⏳' : '💾'}
                </button>
              </td>
            </tr>

            {/* Retención de Logs */}
            <tr>
              <td>
                <span className="configuracion-notificaciones__tipo-badge" style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2', borderLeftColor: '#7b1fa2' }}>
                  <span className="configuracion-notificaciones__icon">📅</span>
                  Retención
                </span>
              </td>
              <td>Cantidad de días que se conservan los registros de auditoría</td>
              <td className="configuracion-notificaciones__duration-cell">
                <div className="configuracion-notificaciones__duration-group">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    step="1"
                    className="configuracion-notificaciones__duration-input"
                    value={values.audit_retention_days || 90}
                    onChange={(e) => handleChange('audit_retention_days', e.target.value)}
                    disabled={saving.audit_retention_days}
                  />
                  <span className="configuracion-notificaciones__hint">
                    (días)
                  </span>
                </div>
                {errors.audit_retention_days && (
                  <span className="configuracion-notificaciones__error">
                    {errors.audit_retention_days}
                  </span>
                )}
              </td>
              <td className="configuracion-notificaciones__actions">
                <button
                  className="configuracion-notificaciones__btn-save"
                  onClick={() => handleSave('audit_retention_days')}
                  disabled={saving.audit_retention_days}
                  title={saving.audit_retention_days ? 'Guardando...' : 'Guardar configuración'}
                >
                  {saving.audit_retention_days ? '⏳' : '💾'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="configuracion-notificaciones__info">
        <p>
          💡 <strong>Tip:</strong> Los logs se limpian automáticamente después de N días.
          El cambio de habilitación tarda hasta 30 segundos en aplicarse.
          Rango permitido: 1-365 días. Valor recomendado: 90 días.
        </p>
      </div>

      <div className="configuracion-notificaciones__header">
        <h2>Redondeo de Cuotas</h2>
        <p className="configuracion-notificaciones__subtitle">
          Precisión aplicada al calcular el nuevo valor en aumentos masivos de cuotas (redondeo hacia arriba)
        </p>
      </div>

      <div className="configuracion-notificaciones__table-wrapper">
        <table className="configuracion-notificaciones__table table-standard">
          <thead>
            <tr>
              <th style={{ width: widthsRedondeo.tipo }}>Parámetro{getResizeHandleRedondeo('tipo')}</th>
              <th style={{ width: widthsRedondeo.descripcion }}>Descripción{getResizeHandleRedondeo('descripcion')}</th>
              <th style={{ width: widthsRedondeo.valor }}>Valor{getResizeHandleRedondeo('valor')}</th>
              <th style={{ width: widthsRedondeo.acciones }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>redondeo_precision</strong></td>
              <td>Precisión de redondeo (hacia arriba) en aumento masivo de cuotas</td>
              <td className="configuracion-notificaciones__duration-cell">
                <div className="configuracion-notificaciones__duration-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="configuracion-notificaciones__duration-input"
                    value={values.redondeo_precision || 1}
                    onChange={(e) => setValues(prev => ({ ...prev, redondeo_precision: parseFloat(e.target.value) || 1 }))}
                    disabled={saving.redondeo_precision}
                  />
                  <span className="configuracion-notificaciones__hint">
                    (ej: 0.01, 1, 10, 100, 500)
                  </span>
                </div>
                {errors.redondeo_precision && (
                  <span className="configuracion-notificaciones__error">
                    {errors.redondeo_precision}
                  </span>
                )}
              </td>
              <td className="configuracion-notificaciones__actions">
                <button
                  className="configuracion-notificaciones__btn-save"
                  onClick={() => handleSave('redondeo_precision')}
                  disabled={saving.redondeo_precision}
                  title={saving.redondeo_precision ? 'Guardando...' : 'Guardar configuración'}
                >
                  {saving.redondeo_precision ? '⏳' : '💾'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="configuracion-notificaciones__info">
        <p>
          💡 <strong>Ejemplos de redondeo hacia arriba:</strong>
          <br/>
          • Precisión 1: 105.50 → 106 | 100 → 100
          <br/>
          • Precisión 10: 105.50 → 110 | 101 → 110
          <br/>
          • Precisión 100: 150 → 200 | 101 → 200
          <br/>
          • Precisión 0.01: 105.523 → 105.53 | 105.509 → 105.51
          <br/>
          Ingresa cualquier valor positivo (números decimales permitidos).
        </p>
      </div>
    </div>
  );
}
