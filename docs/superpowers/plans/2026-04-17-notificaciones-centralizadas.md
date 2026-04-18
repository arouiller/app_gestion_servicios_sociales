# Sistema Centralizado de Notificaciones - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un sistema centralizado de notificaciones que automáticamente detecte respuestas del backend con `success: false` y muestre notificaciones al usuario, con duraciones configurables por administrador.

**Architecture:** NotificationContext proporciona estado global de notificaciones. Axios interceptor detecta errores automáticamente. Componente Toast renderiza en DashboardPage. Configuración de duraciones se almacena en BD y se carga al entrar al dashboard.

**Tech Stack:** React Context API, Axios interceptors, Sequelize, Express

---

## Estructura de Archivos

### Frontend (Nuevos)
- `frontend/src/context/NotificationContext.jsx` — Contexto global, manejo de queue
- `frontend/src/components/NotificationToast.jsx` — Componente UI
- `frontend/src/components/NotificationToast.scss` — Estilos
- `frontend/src/services/configService.js` — Servicio para cargar/actualizar config

### Frontend (Modificados)
- `frontend/src/services/api.js` — Agregar interceptor de respuesta
- `frontend/src/pages/DashboardPage/DashboardPage.jsx` — Wrappear con NotificationProvider

### Backend (Nuevos)
- `backend/src/migrations/versions/2.0.6/upgrade.sql` — Crear tabla
- `backend/src/migrations/versions/2.0.6/downgrade.sql` — Dropear tabla
- `backend/src/models/ConfiguracionApp.js` — Modelo Sequelize
- `backend/src/routes/admin.js` — Endpoints GET/PUT

---

## Phase 1: Frontend - Context y Toast

### Task 1: Crear NotificationContext.jsx

**Files:**
- Create: `frontend/src/context/NotificationContext.jsx`

- [ ] **Step 1: Crear archivo vacío y estructura básica**

```bash
touch frontend/src/context/NotificationContext.jsx
```

- [ ] **Step 2: Escribir el contexto completo**

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

- [ ] **Step 3: Verificar sintaxis**

```bash
cd frontend && npm run lint -- src/context/NotificationContext.jsx
```

Expected: No errors or only formatting warnings.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/context/NotificationContext.jsx && git commit -m "feat(notifications): crear NotificationContext"
```

---

### Task 2: Crear NotificationToast.jsx

**Files:**
- Create: `frontend/src/components/NotificationToast.jsx`

- [ ] **Step 1: Crear archivo con importes**

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

- [ ] **Step 2: Verificar sintaxis**

```bash
cd frontend && npm run lint -- src/components/NotificationToast.jsx
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/NotificationToast.jsx && git commit -m "feat(notifications): crear componente NotificationToast"
```

---

### Task 3: Crear NotificationToast.scss

**Files:**
- Create: `frontend/src/components/NotificationToast.scss`

- [ ] **Step 1: Crear archivo con estilos**

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

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/NotificationToast.scss && git commit -m "style(notifications): agregar estilos a NotificationToast"
```

---

### Task 4: Modificar api.js - Agregar Interceptor

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Leer archivo actual**

```bash
cat frontend/src/services/api.js
```

Expected output:
```
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Adjuntar JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expiró, limpiar y redirigir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('jwt_token')) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2: Reemplazar el interceptor de respuesta**

Reemplazar la sección `api.interceptors.response.use` con:

```javascript
api.interceptors.response.use(
  (response) => {
    // Detectar success: false y disparar notificación
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

- [ ] **Step 3: Verificar archivo completo**

El archivo debe quedar así:

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Adjuntar JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de respuesta: manejo de success: false y token expirado
api.interceptors.response.use(
  (response) => {
    // Detectar success: false y disparar notificación
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
    // Manejo de token expirado
    if (error.response?.status === 401 && localStorage.getItem('jwt_token')) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 4: Verificar sintaxis**

```bash
cd frontend && npm run lint -- src/services/api.js
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/api.js && git commit -m "feat(notifications): agregar interceptor para success: false"
```

---

### Task 5: Crear configService.js

**Files:**
- Create: `frontend/src/services/configService.js`

- [ ] **Step 1: Crear archivo con servicio**

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

- [ ] **Step 2: Verificar sintaxis**

```bash
cd frontend && npm run lint -- src/services/configService.js
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/configService.js && git commit -m "feat(notifications): crear configService"
```

---

### Task 6: Modificar DashboardPage.jsx

**Files:**
- Modify: `frontend/src/pages/DashboardPage/DashboardPage.jsx`

- [ ] **Step 1: Leer estructura actual**

Lee el archivo para entender su estructura actual.

```bash
head -50 frontend/src/pages/DashboardPage/DashboardPage.jsx
```

- [ ] **Step 2: Agregar importes al inicio**

Agregar después de los imports existentes:

```javascript
import { NotificationProvider, useNotification } from '../../context/NotificationContext';
import NotificationToast from '../../components/NotificationToast';
import configService from '../../services/configService';
```

- [ ] **Step 3: Renombrar componente principal**

Si el componente actual se llama `DashboardPage`, renombrarlo a `DashboardPageContent`:

```javascript
function DashboardPageContent() {
  // ... contenido actual ...
  return (
    <div className="dashboard-page">
      <NotificationToast />
      {/* ... resto actual ... */}
    </div>
  );
}
```

Asegurarse de agregar `<NotificationToast />` al inicio del return.

- [ ] **Step 4: Crear componente wrapper con NotificationProvider**

Agregar después de `DashboardPageContent`:

```javascript
function DashboardPageWithNotification() {
  const { addNotification } = useNotification();

  useEffect(() => {
    window.__notificationContext = { addNotification };
    return () => delete window.__notificationContext;
  }, [addNotification]);

  return <DashboardPageContent />;
}
```

- [ ] **Step 5: Crear componente principal nuevo**

Reemplazar el `export default` final con:

```javascript
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

  if (loadingConfig) return <div>Cargando configuración...</div>;

  return (
    <NotificationProvider config={config}>
      <DashboardPageWithNotification />
    </NotificationProvider>
  );
}
```

- [ ] **Step 6: Agregar import de useEffect si no está**

Verificar que `useEffect` esté importado de React:

```javascript
import React, { useState, useEffect } from 'react';
```

- [ ] **Step 7: Verificar sintaxis**

```bash
cd frontend && npm run lint -- src/pages/DashboardPage/DashboardPage.jsx
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/DashboardPage/DashboardPage.jsx && git commit -m "feat(notifications): integrar NotificationProvider en DashboardPage"
```

---

## Phase 2: Backend - Migración y Modelo

### Task 7: Crear Migración 2.0.6

**Files:**
- Create: `backend/src/migrations/versions/2.0.6/upgrade.sql`
- Create: `backend/src/migrations/versions/2.0.6/downgrade.sql`

- [ ] **Step 1: Crear directorio para versión 2.0.6**

```bash
mkdir -p backend/src/migrations/versions/2.0.6
```

- [ ] **Step 2: Crear upgrade.sql**

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

```bash
cat > backend/src/migrations/versions/2.0.6/upgrade.sql << 'EOF'
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
EOF
```

- [ ] **Step 3: Crear downgrade.sql**

```bash
cat > backend/src/migrations/versions/2.0.6/downgrade.sql << 'EOF'
DROP TABLE IF EXISTS configuracion_app;
EOF
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/migrations/versions/2.0.6/ && git commit -m "feat(migrations): crear migración 2.0.6 para tabla configuracion_app"
```

---

### Task 8: Crear Modelo ConfiguracionApp.js

**Files:**
- Create: `backend/src/models/ConfiguracionApp.js`

- [ ] **Step 1: Crear archivo**

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

```bash
cat > backend/src/models/ConfiguracionApp.js << 'EOF'
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
EOF
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/models/ConfiguracionApp.js && git commit -m "feat(models): crear modelo ConfiguracionApp"
```

---

### Task 9: Crear Routes en admin.js

**Files:**
- Create/Modify: `backend/src/routes/admin.js`

- [ ] **Step 1: Verificar si el archivo existe**

```bash
ls -la backend/src/routes/admin.js 2>/dev/null || echo "No existe"
```

If no existe, crear nuevo. If existe, continuar al Step 3.

- [ ] **Step 2: Crear archivo novo (si no existe)**

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

    if (duracion_ms === undefined || duracion_ms < 0) {
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

```bash
cat > backend/src/routes/admin.js << 'EOF'
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

    if (duracion_ms === undefined || duracion_ms < 0) {
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
EOF
```

- [ ] **Step 3: Registrar rutas en index.js**

Abrir `backend/src/index.js` y agregar después de otros imports de rutas:

```javascript
const adminRoutes = require('./routes/admin');
```

Y en la sección de `app.use()` rutas, agregar:

```javascript
app.use('/api/admin', adminRoutes);
```

Verificar que esté registrado:

```bash
grep -n "app.use('/api/admin'" backend/src/index.js
```

Expected: `app.use('/api/admin', adminRoutes);` somewhere in index.js

- [ ] **Step 4: Verificar sintaxis**

```bash
cd backend && npm run lint -- src/routes/admin.js
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/admin.js backend/src/index.js && git commit -m "feat(routes): crear endpoints admin para configuracion de notificaciones"
```

---

## Phase 3: Integración y Testing

### Task 10: Ejecutar Migración en Backend

**Files:**
- N/A (se ejecuta el sistema de migraciones existente)

- [ ] **Step 1: Inicializar sistema de migraciones (si no lo está)**

```bash
cd backend && npm run db:migrate:init
```

Expected: "Migration system initialized" or similar.

- [ ] **Step 2: Listar migraciones disponibles**

```bash
cd backend && npm run db:migrate:list
```

Expected: Should show 2.0.6 as available or pending.

- [ ] **Step 3: Ejecutar migración 2.0.6**

```bash
cd backend && npm run db:migrate:up
```

Expected: Migration 2.0.6 executed successfully. Tabla configuracion_app creada con valores por defecto.

- [ ] **Step 4: Verificar tabla en BD**

Conectar a BD y verificar:

```sql
SELECT * FROM configuracion_app;
```

Expected:
```
+----+-------------------+-------------+
| id | tipo_notificacion | duracion_ms |
+----+-------------------+-------------+
|  1 | error             |        7000 |
|  2 | warning           |        5000 |
|  3 | success           |        3000 |
|  4 | info              |        4000 |
+----+-------------------+-------------+
```

- [ ] **Step 5: Commit (no hay cambios de código, solo registro)**

No hay commit para este task (la migración ya fue commiteada en Task 7).

---

### Task 11: Testing Manual - Frontend

**Files:**
- N/A (testing manual)

- [ ] **Step 1: Iniciar servidor backend**

```bash
cd backend && npm run dev
```

Expected: Server running on port 5000.

- [ ] **Step 2: Iniciar servidor frontend (en otra terminal)**

```bash
cd frontend && npm start
```

Expected: App running on http://localhost:3000

- [ ] **Step 3: Navegar al dashboard**

Ir a http://localhost:3000/dashboard (o ya estar autenticado).

Expected: Dashboard carga sin errores. NotificationToast renderizado pero sin notificaciones visibles.

- [ ] **Step 4: Probar notificación de error**

En browser DevTools Console, ejecutar:

```javascript
window.__notificationContext.addNotification({
  type: 'error',
  message: 'Este es un error de prueba'
});
```

Expected: Notificación roja aparece en esquina inferior derecha. Se cierra automáticamente después de 7 segundos.

- [ ] **Step 5: Probar otros tipos**

```javascript
window.__notificationContext.showSuccess('Esto es un éxito');
window.__notificationContext.showWarning('Esto es una advertencia');
window.__notificationContext.showInfo('Esto es información');
```

Expected: Cada notificación aparece con color correcto y se cierra en el tiempo esperado.

- [ ] **Step 6: Probar botón X manual**

Hacer click en el botón X de una notificación.

Expected: Notificación desaparece inmediatamente.

- [ ] **Step 7: Probar interceptor**

En una página que tenga un formulario (ej: crear plan), enviar data inválida.

Expected: Notificación de error aparece automáticamente con el mensaje del backend.

- [ ] **Step 8: Probar opt-out (opcional)**

Si necesitas, edita temporalmente un servicio para agregar header:

```javascript
const { data } = await api.post('/endpoint', payload, {
  headers: { 'X-Skip-Notification': 'true' }
});
```

Expected: No aparece notificación automática, aunque respuesta tenga `success: false`.

---

### Task 12: Testing Manual - Backend

**Files:**
- N/A (testing manual)

- [ ] **Step 1: Verificar acceso a GET /api/admin/configuracion**

```bash
curl -X GET http://localhost:5000/api/admin/configuracion \
  -H "Authorization: Bearer <VALID_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

Expected:
```json
{
  "success": true,
  "data": {
    "error": 7000,
    "warning": 5000,
    "success": 3000,
    "info": 4000
  }
}
```

- [ ] **Step 2: Actualizar una configuración**

```bash
curl -X PUT http://localhost:5000/api/admin/configuracion/error \
  -H "Authorization: Bearer <VALID_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"duracion_ms": 10000}'
```

Expected:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipo_notificacion": "error",
    "duracion_ms": 10000,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

- [ ] **Step 3: Verificar actualización**

Ejecutar GET nuevamente:

```bash
curl -X GET http://localhost:5000/api/admin/configuracion \
  -H "Authorization: Bearer <VALID_ADMIN_TOKEN>"
```

Expected: error ahora es 10000.

- [ ] **Step 4: Revertir cambio**

```bash
curl -X PUT http://localhost:5000/api/admin/configuracion/error \
  -H "Authorization: Bearer <VALID_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"duracion_ms": 7000}'
```

- [ ] **Step 5: Probar acceso no-admin (debe fallar)**

```bash
curl -X GET http://localhost:5000/api/admin/configuracion \
  -H "Authorization: Bearer <VALID_USER_TOKEN>"
```

Expected: 403 Forbidden o similar (requireAdmin middleware rechaza).

---

### Task 13: Verificación Final - Integración End-to-End

**Files:**
- N/A (testing manual)

- [ ] **Step 1: Recargar página del dashboard**

Ir a http://localhost:3000/dashboard y recargar (F5).

Expected: Config se carga, NotificationProvider recibe config, no hay errores en DevTools.

- [ ] **Step 2: Verificar que NotificationToast está renderizado**

En DevTools Inspector, buscar:

```
<div class="notification-toast-container">
```

Expected: Elemento existe, está en esquina inferior derecha (position: fixed).

- [ ] **Step 3: Disparar error desde backend**

Ejecutar una operación que retorne `success: false` (ej: crear plan con numero_afiliado duplicado).

Expected:
1. Respuesta del backend es recibida con `success: false`
2. Interceptor detecta automáticamente
3. `window.__notificationContext.addNotification()` es llamado
4. Notificación aparece en Toast
5. Se cierra después de 7 segundos (o el tiempo configurado)

- [ ] **Step 4: Cambiar configuración y verificar**

Actualizar con curl:

```bash
curl -X PUT http://localhost:5000/api/admin/configuracion/error \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"duracion_ms": 2000}'
```

Recargar página:

```
http://localhost:3000/dashboard
```

Disparar error nuevamente. Expected: Notificación se cierra después de 2 segundos.

- [ ] **Step 5: Commit de cualquier cambio de testing**

```bash
git status
```

Si hay cambios (ej: archivos temporales), limpiar.

```bash
git add . && git commit -m "test(notifications): verificación end-to-end completada"
```

Or if no changes:

```bash
echo "No changes to commit"
```

---

## Phase 4: Code Quality & Documentation

### Task 14: Linting y Verificación

**Files:**
- N/A (verificación)

- [ ] **Step 1: Lint frontend**

```bash
cd frontend && npm run lint
```

Expected: No errors (solo warnings permitidos si son informacionales).

- [ ] **Step 2: Lint backend**

```bash
cd backend && npm run lint
```

Expected: No errors.

- [ ] **Step 3: Verificar que no hay console.error sin usar**

```bash
grep -r "console.error" frontend/src/components/NotificationToast.jsx backend/src/routes/admin.js || echo "No console.error found"
```

Expected: No console.error en archivos nuevos (es ok en archivos modificados si ya existía).

- [ ] **Step 4: Commit final**

```bash
git status
```

Expected: Clean working tree.

---

### Task 15: Documentación - Actualizar BACKLOG.md

**Files:**
- Modify: `BACKLOG.md`

- [ ] **Step 1: Actualizar estado de BACKLOG-018**

En BACKLOG.md, encontrar la línea:

```
| BACKLOG-018 | 🔴 Alta | 🔬 En análisis | Centralizar manejo de respuestas del backend...
```

Cambiar a:

```
| BACKLOG-018 | 🔴 Alta | ✅ Incorporado al plan | Centralizar manejo de respuestas del backend...
```

- [ ] **Step 2: Agregar sección de detalles (al final del archivo)**

Agregar:

```markdown
### BACKLOG-018: Centralizar Manejo de Respuestas del Backend con Success: False

**Descripción:**
Sistema centralizado de notificaciones que detecta automáticamente respuestas del backend con `success: false` y muestra notificaciones al usuario. Las duraciones de notificaciones son configurables por administrador en BD.

**Implementación Completada:**
- ✅ Frontend: NotificationContext + NotificationToast componente
- ✅ Frontend: Interceptor en api.js para detectar success: false
- ✅ Frontend: configService para cargar configuración de BD
- ✅ Frontend: Integración en DashboardPage
- ✅ Backend: Migración 2.0.6 con tabla configuracion_app
- ✅ Backend: Modelo ConfiguracionApp
- ✅ Backend: Endpoints GET/PUT /api/admin/configuracion
- ✅ Testing: Verificación end-to-end manual

**Commits Asociados:**
- feat(notifications): crear NotificationContext
- feat(notifications): crear componente NotificationToast
- style(notifications): agregar estilos a NotificationToast
- feat(notifications): agregar interceptor para success: false
- feat(notifications): crear configService
- feat(notifications): integrar NotificationProvider en DashboardPage
- feat(migrations): crear migración 2.0.6 para tabla configuracion_app
- feat(models): crear modelo ConfiguracionApp
- feat(routes): crear endpoints admin para configuracion de notificaciones

**Estado:** Desarrollado y probado

**Próximos Pasos:**
- Panel UI en Administración para que admins gestionen configuración (futuro backlog item)
```

- [ ] **Step 3: Commit**

```bash
git add BACKLOG.md && git commit -m "docs(backlog): actualizar BACKLOG-018 a Incorporado al plan"
```

---

## Summary

**Total Tasks:** 15
**Estimated Time:** 2-3 horas (incluyendo testing manual)
**Key Deliverables:**
1. NotificationContext global con queue y auto-cierre
2. NotificationToast renderizado en DashboardPage
3. Axios interceptor que detecta `success: false` automáticamente
4. Configuración de duraciones en BD, cargada al entrar al dashboard
5. Endpoints admin para leer/actualizar configuración
6. Testing manual y verificación end-to-end

**Files Modified/Created:**
- Frontend: 6 files (context, component, styles, service, 2 modified)
- Backend: 4 files (routes, model, 2 migration scripts)
- Documentation: 1 file (BACKLOG.md)

