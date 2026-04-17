import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children, config = {} }) {
  const [notifications, setNotifications] = useState([]);
  const timerRefs = useRef(new Map()); // Almacenar timer IDs para cleanup
  const nextIdRef = useRef(0); // Incrementador simple para IDs únicos

  const defaultConfig = {
    error: 7000,
    warning: 5000,
    success: 3000,
    info: 4000,
  };

  // Estabilizar mergedConfig con useMemo para evitar recálculos innecesarios
  const mergedConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config],
  );

  /**
   * Añade una notificación al contexto.
   * @param {Object} notification - Objeto con type y message
   * @param {string} notification.type - Tipo de notificación (error, warning, success, info)
   * @param {string} notification.message - Mensaje a mostrar
   * @returns {number} ID de la notificación
   */
  const addNotification = useCallback((notification) => {
    const id = nextIdRef.current++;
    const duration = mergedConfig[notification.type] || mergedConfig.info;

    const newNotification = {
      id,
      type: notification.type || 'info',
      message: notification.message,
      duration,
    };

    setNotifications((prev) => [...prev, newNotification]);

    if (duration > 0) {
      const timerId = setTimeout(() => {
        removeNotification(id);
      }, duration);
      timerRefs.current.set(id, timerId);
    }

    return id;
  }, [mergedConfig]);

  /**
   * Elimina una notificación por ID y cancela su timer si existe.
   * @param {number} id - ID de la notificación a eliminar
   */
  const removeNotification = useCallback((id) => {
    // Cancelar timer si existe para evitar memory leak
    if (timerRefs.current.has(id)) {
      clearTimeout(timerRefs.current.get(id));
      timerRefs.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Cleanup al desmontar para cancelar todos los timers pendientes
  useEffect(() => {
    return () => {
      timerRefs.current.forEach((timerId) => {
        clearTimeout(timerId);
      });
      timerRefs.current.clear();
    };
  }, []);

  /**
   * Muestra una notificación de error.
   * @param {string} message - Mensaje de error
   * @returns {number} ID de la notificación
   */
  const showError = (message) => addNotification({ type: 'error', message });

  /**
   * Muestra una notificación de éxito.
   * @param {string} message - Mensaje de éxito
   * @returns {number} ID de la notificación
   */
  const showSuccess = (message) => addNotification({ type: 'success', message });

  /**
   * Muestra una notificación de advertencia.
   * @param {string} message - Mensaje de advertencia
   * @returns {number} ID de la notificación
   */
  const showWarning = (message) => addNotification({ type: 'warning', message });

  /**
   * Muestra una notificación de información.
   * @param {string} message - Mensaje de información
   * @returns {number} ID de la notificación
   */
  const showInfo = (message) => addNotification({ type: 'info', message });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        config: mergedConfig,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification debe usarse dentro de NotificationProvider');
  return ctx;
}

export default NotificationContext;
