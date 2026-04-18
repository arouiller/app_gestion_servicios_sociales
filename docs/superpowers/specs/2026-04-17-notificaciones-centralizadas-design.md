# SPEC: Sistema Centralizado de Notificaciones (BACKLOG-018)

**Fecha:** 2026-04-17  
**Estado:** Diseño aprobado  
**Prioridad:** 🔴 Alta

---

## 1. Descripción General

Implementar un sistema centralizado para manejar respuestas del backend con `success: false`. Actualmente, cada servicio y componente maneja los errores de forma independiente. Este sistema propone centralizar la lógica mediante un interceptor en Axios que automáticamente detecte respuestas con `success: false` y dispare notificaciones unificadas, con duraciones configurables por tipo y administrador.

---

## 2. Requerimientos Funcionales

### 2.1 Patrón de Respuesta del Backend

El backend retorna respuestas con estructura estándar:

```json
{
  "success": false,
  "message": "Descripción legible del error",
  "data": null,
  "error_code": "OPTIONAL_ERROR_CODE"
}
```

- HTTP status: 400, 409, 422, 500, etc.
- Campo `message`: siempre contiene descripción para el usuario

### 2.2 Interceptor en Axios

El interceptor en `services/api.js`:
- Detecta respuestas con `success: false`
- Extrae el campo `message`
- Dispara notificación centralizada automáticamente
- Respeta header `X-Skip-Notification` para opt-out manual (cuando un servicio necesita control especial)
- Propaga el error al componente (los servicios pueden seguir usando try-catch)

### 2.3 Sistema de Notificaciones

**Contexto Global (NotificationContext):**
- Mantiene queue de notificaciones activas
- Expone métodos: `addNotification()`, `removeNotification()`, `showError()`, `showSuccess()`, `showWarning()`, `showInfo()`
- Acepta `config` prop con duraciones personalizadas
- Calcula auto-cierre basado en tipo de notificación y configuración

**Tipos de Notificación:**
- `error` — rojo, duración: 7000ms (default)
- `success` — verde, duración: 3000ms (default)
- `warning` — amarillo, duración: 5000ms (default)
- `info` — azul, duración: 4000ms (default)

### 2.4 Componente Toast (UI)

**NotificationToast.jsx:**
- Ubicación: esquina inferior derecha, z-index: 9999
- Stack vertical (nuevas notificaciones abajo)
- Cada notificación tiene:
  - Icono según tipo
  - Mensaje extraído de respuesta backend
  - Botón X para cierre manual
  - Auto-cierre después de duración configurada
- Animación de entrada: slide in desde la derecha
- Colores distintos por tipo

### 2.5 Configuración Administrador

**Requisito:** Los administradores pueden personalizar las duraciones de notificaciones.

**Almacenamiento:** Nueva tabla `configuracion_app` en BD
**Ubicación:** `backend/src/migrations/versions/2.0.6/`

**Flujo:**
1. Admin accede a panel de configuración (futuro: en Administración)
2. Visualiza duraciones actuales (error, success, warning, info)
3. Modifica duraciones
4. Cambios se guardan en BD
5. Usuarios cargan la configuración al entrar al dashboard
6. Refresco de página aplica nuevas duraciones

---

## 3. Arquitectura Técnica

### 3.1 Componentes Frontend

```
DashboardPage.jsx (entry point)
  ├─ NotificationProvider (wrapper, carga config del backend)
  │   ├─ DashboardPageContent
  │   └─ NotificationToast (renderiza la UI)
  │
context/NotificationContext.jsx
  ├─ State: notifications[], config
  ├─ Methods: addNotification(), removeNotification()
  └─ Public API: showError(), showSuccess(), showWarning(), showInfo()

services/api.js
  └─ axios interceptor (respuesta)
      └─ Detecta success: false → dispara addNotification()

services/configService.js
  ├─ getConfiguracion() → GET /api/admin/configuracion
  └─ actualizarConfiguracion(tipo, duracion_ms) → PUT /api/admin/configuracion/:tipo
```

### 3.2 Backend

**Tabla Nueva:**
```
configuracion_app
├─ id (PK)
├─ tipo_notificacion (UNIQUE) — error, success, warning, info
├─ duracion_ms (INT, default: 5000)
├─ createdAt
└─ updatedAt
```

**Modelo Sequelize:** `models/ConfiguracionApp.js`

**Endpoints:**
- `GET /api/admin/configuracion` — Obtener todas las configuraciones
- `PUT /api/admin/configuracion/:tipo` — Actualizar una configuración (admin only)

**Migración:** `backend/src/migrations/versions/2.0.6/upgrade.sql`
- Crear tabla
- Insertar valores por defecto
- Crear índice en `tipo_notificacion`

---

## 4. Flujo de Ejecución

### 4.1 Cargar Configuración (al entrar al Dashboard)

```
1. DashboardPage monta
2. useEffect dispara configService.getConfiguracion()
3. Backend retorna { error: 7000, success: 3000, warning: 5000, info: 4000 }
4. NotificationProvider recibe config como prop
5. NotificationContext merge con defaults
6. window.__notificationContext = { addNotification, ... }
```

### 4.2 Mostrar Notificación (al recibir respuesta con success: false)

```
1. Servicio llama await api.post(...) [sin try-catch especial]
2. Backend retorna { success: false, message: "Error de validación" }
3. Interceptor detecta success: false
4. Interceptor llama window.__notificationContext.addNotification({
     type: 'error',
     message: 'Error de validación'
   })
5. NotificationContext agrega a queue
6. Toast renderiza notificación
7. Auto-cierre después de 7000ms (o duración configurada)
```

### 4.3 Opt-Out Manual (casos especiales)

Si un servicio necesita manejar el error manualmente (sin notificación automática):

```javascript
// En el servicio o componente
try {
  const { data } = await api.post('/endpoint', payload, {
    headers: { 'X-Skip-Notification': 'true' }
  });
} catch (error) {
  // Manejo manual
}
```

---

## 5. Implementación Detallada

### 5.1 NotificationContext.jsx

```javascript
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
```

### 5.2 Interceptor en api.js

```javascript
// Reemplazar el interceptor de respuesta actual con:
api.interceptors.response.use(
  (response) => {
    // Si respuesta tiene success: false y no tiene header X-Skip-Notification
    if (response.data?.success === false && !response.config.headers['X-Skip-Notification']) {
      const notificationContext = window.__notificationContext;
      if (notificationContext) {
        notificationContext.addNotification({
          type: 'error',
          message: response.data.message || 'Error en la solicitud',
        });
      }
    }
    return response;
  },
  (error) => {
    // Manejo de token expirado (existente)
    if (error.response?.status === 401 && localStorage.getItem('jwt_token')) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);
```

### 5.3 NotificationToast.jsx

```javascript
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
            <span className="notification-icon">
              {notification.type === 'error' && '❌'}
              {notification.type === 'success' && '✅'}
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'info' && 'ℹ️'}
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
```

### 5.4 NotificationToast.scss

```scss
.notification-toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;

  .notification-toast {
    padding: 16px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;

    &.notification-error {
      background-color: #fee;
      border-left: 4px solid #dc3545;
      color: #721c24;
    }

    &.notification-success {
      background-color: #efe;
      border-left: 4px solid #28a745;
      color: #155724;
    }

    &.notification-warning {
      background-color: #fef3cd;
      border-left: 4px solid #ffc107;
      color: #856404;
    }

    &.notification-info {
      background-color: #d1ecf1;
      border-left: 4px solid #17a2b8;
      color: #0c5460;
    }

    .notification-content {
      display: flex;
      gap: 12px;
      align-items: center;
      flex: 1;

      .notification-icon {
        font-size: 20px;
      }

      .notification-message {
        font-size: 14px;
        line-height: 1.4;
      }
    }

    .notification-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 0 8px;
      color: inherit;
      opacity: 0.7;

      &:hover {
        opacity: 1;
      }
    }
  }
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 5.5 configService.js

```javascript
import api from './api';

const configService = {
  getConfiguracion: async () => {
    const { data } = await api.get('/admin/configuracion');
    return data.data;
  },

  actualizarConfiguracion: async (tipo, duracion_ms) => {
    const { data } = await api.put(`/admin/configuracion/${tipo}`, { duracion_ms });
    return data.data;
  },
};

export default configService;
```

### 5.6 Integración en DashboardPage.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { NotificationProvider, useNotification } from '../../context/NotificationContext';
import NotificationToast from '../../components/NotificationToast';
import configService from '../../services/configService';
// ... imports del dashboard existente ...

function DashboardPageContent() {
  // Contenido actual del dashboard
  return (
    <div className="dashboard-page">
      <NotificationToast />
      {/* ... resto del dashboard ... */}
    </div>
  );
}

function DashboardPageWithNotification() {
  const { addNotification } = useNotification();

  useEffect(() => {
    window.__notificationContext = { addNotification };
    return () => delete window.__notificationContext;
  }, [addNotification]);

  return <DashboardPageContent />;
}

export default function DashboardPage() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await configService.getConfiguracion();
        setConfig(data);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        setConfig({});
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  if (loadingConfig) return <div>Cargando...</div>;

  return (
    <NotificationProvider config={config}>
      <DashboardPageWithNotification />
    </NotificationProvider>
  );
}
```

### 5.7 Backend: Migración 2.0.6

**upgrade.sql:**
```sql
CREATE TABLE IF NOT EXISTS configuracion_app (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_notificacion VARCHAR(50) NOT NULL UNIQUE,
  duracion_ms INT NOT NULL DEFAULT 5000,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO configuracion_app (tipo_notificacion, duracion_ms) VALUES
('error', 7000),
('warning', 5000),
('success', 3000),
('info', 4000)
ON DUPLICATE KEY UPDATE duracion_ms=VALUES(duracion_ms);

CREATE INDEX idx_tipo_notificacion ON configuracion_app(tipo_notificacion);
```

**downgrade.sql:**
```sql
DROP TABLE IF EXISTS configuracion_app;
```

### 5.8 Backend: Modelo ConfiguracionApp.js

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConfiguracionApp = sequelize.define('ConfiguracionApp', {
    tipo_notificacion: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    duracion_ms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5000,
    },
  }, {
    tableName: 'configuracion_app',
    timestamps: true,
  });

  return ConfiguracionApp;
};
```

### 5.9 Backend: Endpoints (routes/admin.js)

```javascript
const express = require('express');
const { ConfiguracionApp } = require('../models');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/configuracion
router.get('/configuracion', requireAdmin, async (req, res) => {
  try {
    const config = await ConfiguracionApp.findAll();
    const configObj = {};
    config.forEach((c) => {
      configObj[c.tipo_notificacion] = c.duracion_ms;
    });
    res.json({ success: true, data: configObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/configuracion/:tipo
router.put('/configuracion/:tipo', requireAdmin, async (req, res) => {
  try {
    const { duracion_ms } = req.body;

    if (!duracion_ms || duracion_ms < 0) {
      return res.status(400).json({
        success: false,
        message: 'duracion_ms debe ser un número >= 0',
      });
    }

    const config = await ConfiguracionApp.findOne({
      where: { tipo_notificacion: req.params.tipo },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Tipo de notificación '${req.params.tipo}' no existe`,
      });
    }

    await config.update({ duracion_ms });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

---

## 6. Casos de Uso

### 6.1 Usuario crea un plan con error de validación

```
1. Usuario envía POST /api/v1.0/planes con datos inválidos
2. Backend retorna HTTP 422: { success: false, message: "numero_afiliado duplicado" }
3. Interceptor detecta success: false
4. NotificationContext.addNotification({ type: 'error', message: '...' })
5. Toast renderiza en esquina inferior derecha
6. Auto-cierre después de 7000ms
```

### 6.2 Usuario actualiza un plan exitosamente

```
1. Usuario envía PUT /api/v1.0/planes/:id con datos válidos
2. Backend retorna HTTP 200: { success: true, data: {...} }
3. Interceptor ignora (success: true)
4. Componente puede opcionalmente mostrar success con useNotification().showSuccess()
```

### 6.3 Admin personaliza duración de errores

```
1. Admin va a Administración → Configuración
2. Cambia "Duración de error" de 7000ms a 10000ms
3. Hace click en Guardar
4. PUT /api/admin/configuracion/error con { duracion_ms: 10000 }
5. BD se actualiza
6. Próximo usuario que entre al dashboard carga nueva configuración
7. Errores ahora se cierran después de 10s
```

### 6.4 Servicio necesita opt-out

```javascript
// En un servicio específico
try {
  const { data } = await api.post('/endpoint', payload, {
    headers: { 'X-Skip-Notification': 'true' }
  });
  // Componente maneja manualmente
} catch (error) {
  // Lógica custom
}
```

---

## 7. Testing

### 7.1 Tests de NotificationContext

- `addNotification()` agrega a queue
- Auto-cierre después de duración configurada
- `removeNotification()` remueve por id
- Métodos públicos (`showError`, etc.) funcionan

### 7.2 Tests de NotificationToast

- Renderiza notificaciones
- Botón X remueve notificación
- Clases CSS correctas por tipo
- Animación de entrada

### 7.3 Tests del Interceptor

- Detecta `success: false` y dispara notificación
- Respeta header `X-Skip-Notification`
- No interfiere con respuestas exitosas
- Manejo de token expirado intacto

### 7.4 Tests de Integración

- Config se carga del backend
- Notificaciones usan config correcta
- Admin puede actualizar configuración
- Nueva configuración se aplica al recargar

---

## 8. Archivos a Modificar/Crear

### Frontend

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `context/NotificationContext.jsx` | CREAR | Contexto global de notificaciones |
| `components/NotificationToast.jsx` | CREAR | Componente UI Toast |
| `components/NotificationToast.scss` | CREAR | Estilos |
| `services/api.js` | MODIFICAR | Agregar interceptor de respuesta |
| `services/configService.js` | CREAR | Servicio para obtener/actualizar config |
| `pages/DashboardPage/DashboardPage.jsx` | MODIFICAR | Wrappear con NotificationProvider |

### Backend

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `migrations/versions/2.0.6/upgrade.sql` | CREAR | Crear tabla `configuracion_app` |
| `migrations/versions/2.0.6/downgrade.sql` | CREAR | Dropear tabla |
| `models/ConfiguracionApp.js` | CREAR | Modelo Sequelize |
| `routes/admin.js` | CREAR/MODIFICAR | Endpoints GET/PUT configuración |

---

## 9. Dependencias

- `axios` (ya instalado)
- `react` (ya instalado)
- `uuid` (opcional, usar `Date.now() + Math.random()` como alternativa)

---

## 10. Notas de Implementación

1. **Window context:** El uso de `window.__notificationContext` es temporal para pasar el contexto al interceptor. En una refactorización futura, considerar usar un estado global más robusto (Redux, Zustand) si la app crece.

2. **Errores de red:** Si hay errores antes de que el contexto esté montado (ej: durante carga de config), las notificaciones no se mostrarán. Es un trade-off aceptable.

3. **Múltiples notificaciones:** El stack puede crecer indefinidamente si hay muchos errores. Considerar límite de 5-10 notificaciones máximo simultáneas.

4. **Estilos:** Los iconos emoji pueden reemplazarse por iconos SVG/Font Awesome en el futuro.

5. **i18n:** Los mensajes vienen del backend. Para multilenguaje, el backend debe enviar mensajes en el idioma del usuario.

---

## 11. Scope Out (No Incluido)

- Panel UI para administradores (será futuro item de backlog)
- Persistencia en localStorage si hay desconexión
- Análisis/logs de notificaciones (auditoria)
- Sistema de prioridades (notification groups)

