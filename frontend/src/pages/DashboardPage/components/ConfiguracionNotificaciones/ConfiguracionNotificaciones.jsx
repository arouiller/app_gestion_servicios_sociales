import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import configService from '../../../../services/configService';
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
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { showSuccess, showError } = useNotification();

  // Cargar configuración al montar
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const config = await configService.getConfiguracion();
        setValues(config || {});
        setErrors({});
      } catch (error) {
        console.error('Error cargando configuración:', error);
        showError('Error al cargar configuración de notificaciones');
        setErrors({ general: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [showError]);

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

  if (loading) {
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
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Duración (ms)</th>
              <th>Acciones</th>
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
              <th>Función</th>
              <th>Descripción</th>
              <th>Tiempo (ms)</th>
              <th>Acciones</th>
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
    </div>
  );
}
