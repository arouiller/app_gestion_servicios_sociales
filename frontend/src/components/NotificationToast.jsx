import React from 'react';
import { useNotification } from '../context/NotificationContext';
import './NotificationToast.scss';

function NotificationToast() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="notification-toast-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-toast notification-${notification.type}`}
        >
          <div className="notification-content">
            <span className="notification-icon" aria-hidden="true">
              {notification.type === 'error' && '❌'}
              {notification.type === 'success' && '✅'}
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'info' && 'ℹ️'}
              {!['error', 'success', 'warning', 'info'].includes(notification.type) && '📝'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationToast;
