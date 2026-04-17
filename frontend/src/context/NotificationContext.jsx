import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children, config = {} }) {
  const [notifications, setNotifications] = useState([]);

  const defaultConfig = {
    error: 7000,
    warning: 5000,
    success: 3000,
    info: 4000,
  };
  const mergedConfig = { ...defaultConfig, ...config };

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const duration = mergedConfig[notification.type] || mergedConfig.info;

    const newNotification = {
      id,
      type: notification.type || 'info',
      message: notification.message,
      duration,
    };

    setNotifications((prev) => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }

    return id;
  }, [mergedConfig]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showError = (message) => addNotification({ type: 'error', message });
  const showSuccess = (message) => addNotification({ type: 'success', message });
  const showWarning = (message) => addNotification({ type: 'warning', message });
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
