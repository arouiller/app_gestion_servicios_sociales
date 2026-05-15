# Admin Migrations Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive admin panel for managing database migrations, including version control, preview/execute workflows, and audit history.

**Architecture:** Three-layer approach: (1) Backend: extend `migrationManager.js` with new methods, expose via Express controller + routes with admin middleware. (2) Frontend: new `MigrationsDashboard` component with 3 tabs (Versions, History, Stats) using Zustand for state. (3) Integration: add tab to DashboardPage visible only to admins via `useAuth()`.

**Tech Stack:** Express (backend), React + Zustand (frontend), Sequelize (DB queries), Axios (HTTP client)

---

## File Structure

### Backend Files
```
backend/src/
├── migrations/
│   └── migrationManager.js [MODIFY] - Add getPreview(), execute(), duracion_ms tracking
├── controllers/
│   └── migrationsController.js [CREATE] - 5 endpoint handlers with admin auth
├── routes/
│   └── migrations.js [CREATE] - 5 routes with requireAdmin middleware
└── index.js [MODIFY] - Register migrations route
```

### Frontend Files
```
frontend/src/pages/DashboardPage/components/
└── MigrationsDashboard/
    ├── MigrationsDashboard.jsx [CREATE] - Main component with tabs + state
    ├── tabs/
    │   ├── VersionesTab.jsx [CREATE] - List versions, upgrade/downgrade buttons
    │   ├── HistorialTab.jsx [CREATE] - Migration history table with pagination
    │   └── EstadisticasTab.jsx [CREATE] - DB stats: version + table counts
    ├── modals/
    │   └── PreviewModal.jsx [CREATE] - SQL preview + confirmation
    └── services/
        └── migrationsService.js [CREATE] - Axios API client
└── DashboardPage.jsx [MODIFY] - Add Migraciones tab for admins
```

---

## Task 1: Extend migrationManager.js with Duration Tracking

**Files:**
- Modify: `backend/src/migrations/migrationManager.js`
- Test: `backend/src/migrations/__tests__/migrationManager.spec.js`

### Background
The `migrationManager.js` already has core logic (`upgrade()`, `downgrade()`, `list()`, etc.). We need to:
1. Track execution duration in milliseconds
2. Add `getPreview(version, direction)` method to return SQL without executing
3. Add `execute(direction)` wrapper that calls upgrade/downgrade and records duration

### Step 1: Add duracion_ms column to historial_migraciones table

The migration will happen automatically when the backend starts (ensureTable checks). Modify the `ensureTable()` function:

```js
async function ensureTable() {
  // Estado actual por versión (un registro por versión, se actualiza in-place)
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS migraciones_bd (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      descripcion VARCHAR(255) NOT NULL,
      tipo ENUM('upgrade','downgrade') NOT NULL,
      fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado ENUM('exitosa','fallida','revertida') NOT NULL DEFAULT 'exitosa'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Historial completo (append-only, una fila por evento)
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS historial_migraciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(50) NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      tipo ENUM('upgrade','downgrade') NOT NULL,
      estado ENUM('exitosa','fallida') NOT NULL,
      duracion_ms INT DEFAULT NULL,
      fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
```

- [ ] **Step 1a: Read migrationManager.js** and understand the structure
- [ ] **Step 1b: Modify ensureTable()** to add `duracion_ms INT DEFAULT NULL` column to `historial_migraciones`
- [ ] **Step 1c: Modify appendHistory()** signature to accept optional `durationMs` parameter:

```js
async function appendHistory(version, descripcion, tipo, estado, durationMs = null) {
  await sequelize.query(
    `INSERT INTO historial_migraciones (version, descripcion, tipo, estado, duracion_ms) VALUES (?, ?, ?, ?, ?)`,
    { replacements: [version, descripcion, tipo, estado, durationMs] }
  );
}
```

- [ ] **Step 1d: Add getPreview() method** after `getDbStats()`:

```js
/**
 * Retorna el SQL que se ejecutaría para un upgrade/downgrade sin ejecutarlo.
 * Input: version ("1.0.2"), direction ("upgrade" | "downgrade")
 * Output: { version, direction, sql, description, nextVersion }
 */
async function getPreview(version, direction) {
  const folders = getMigrationFolders();
  const folder = folders.find((f) => getVersion(f) === version);
  
  if (!folder) {
    throw new Error(`Versión ${version} no encontrada`);
  }

  const description = getDescription(folder);
  const statements = readSQL(folder, direction);
  const sql = statements.join(';\n') + ';';

  // Determine nextVersion for display
  const folderIndex = folders.indexOf(folder);
  const nextFolder = direction === 'upgrade' ? folders[folderIndex + 1] : folders[folderIndex - 1];
  const nextVersion = nextFolder ? getVersion(nextFolder) : null;

  return {
    version,
    direction,
    sql,
    description,
    nextVersion,
  };
}
```

- [ ] **Step 1e: Add execute() method** before `module.exports`:

```js
/**
 * Ejecuta upgrade o downgrade y registra la duración.
 * Input: direction ("upgrade" | "downgrade")
 * Output: { success: true, version, message, duration } | throws Error
 */
async function execute(direction) {
  const startTime = Date.now();
  
  try {
    let result;
    if (direction === 'upgrade') {
      result = await upgrade();
    } else if (direction === 'downgrade') {
      result = await downgrade();
    } else {
      throw new Error(`Dirección inválida: ${direction}`);
    }

    if (!result) {
      return {
        success: false,
        message: direction === 'upgrade' 
          ? 'No hay migraciones pendientes' 
          : 'No hay migraciones aplicadas para revertir',
      };
    }

    const durationMs = Date.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    // Record duration in history
    const applied = await getAppliedMigrations();
    const currentVersion = applied[applied.length - 1];
    const folders = getMigrationFolders();
    const folder = folders.find((f) => getVersion(f) === result.version);
    
    // Update the most recent history entry with duration
    await sequelize.query(
      `UPDATE historial_migraciones SET duracion_ms = ? 
       WHERE version = ? AND tipo = ? 
       ORDER BY fecha_ejecucion DESC LIMIT 1`,
      { replacements: [durationMs, result.version, direction] }
    );

    return {
      success: true,
      version: result.version,
      message: `${direction === 'upgrade' ? 'Upgrade' : 'Downgrade'} a ${result.version} exitoso`,
      duration: parseFloat(durationSec),
    };
  } catch (err) {
    throw err;
  }
}
```

- [ ] **Step 1f: Update module.exports** to include new methods:

```js
module.exports = { 
  list, 
  upgrade, 
  downgrade, 
  reapply, 
  ensureTable, 
  getDbStats, 
  getHistory,
  getPreview,
  execute,
};
```

- [ ] **Step 1g: Commit**

```bash
cd backend
git add src/migrations/migrationManager.js
git commit -m "feat: add duration tracking and preview/execute methods to migrationManager"
```

---

## Task 2: Create Migrations Controller

**Files:**
- Create: `backend/src/controllers/migrationsController.js`
- Test: `backend/src/controllers/__tests__/migrationsController.spec.js`

### Background
The controller exposes the migrationManager functions as REST endpoints. It handles:
- Input validation
- Error handling (specific HTTP status codes)
- Response formatting

- [ ] **Step 2a: Create migrationsController.js**

```js
const migrationManager = require('../migrations/migrationManager');

/**
 * GET /api/migrations/list
 * Retorna lista de versiones disponibles y estado actual
 */
async function list(req, res) {
  try {
    const versions = await migrationManager.list();
    const stats = await migrationManager.getDbStats();
    
    res.json({
      success: true,
      data: {
        versions,
        currentVersion: stats.currentVersion,
      },
    });
  } catch (err) {
    console.error('Error listing migrations:', err);
    res.status(500).json({ success: false, message: 'Error al listar migraciones' });
  }
}

/**
 * GET /api/migrations/history
 * Retorna historial completo de migraciones
 */
async function history(req, res) {
  try {
    const records = await migrationManager.getHistory();
    
    // Convert duracion_ms to seconds for display
    const history = records.map((record) => ({
      ...record,
      duracion: record.duracion_ms ? (record.duracion_ms / 1000).toFixed(2) : null,
    }));
    
    res.json({
      success: true,
      data: { history },
    });
  } catch (err) {
    console.error('Error fetching migration history:', err);
    res.status(500).json({ success: false, message: 'Error al obtener historial' });
  }
}

/**
 * GET /api/migrations/stats
 * Retorna estadísticas de BD: versión actual + conteo de registros por tabla
 */
async function stats(req, res) {
  try {
    const data = await migrationManager.getDbStats();
    
    res.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Error fetching DB stats:', err);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
}

/**
 * GET /api/migrations/preview/:version/:direction
 * Retorna el SQL que se ejecutaría sin ejecutarlo
 * direction: "upgrade" | "downgrade"
 */
async function preview(req, res) {
  try {
    const { version, direction } = req.params;
    
    // Validate direction
    if (!['upgrade', 'downgrade'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Dirección inválida. Use "upgrade" o "downgrade"',
      });
    }

    const data = await migrationManager.getPreview(version, direction);
    
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error generating preview:', err);
    res.status(400).json({
      success: false,
      message: err.message || 'Error al generar preview',
    });
  }
}

/**
 * POST /api/migrations/execute
 * Ejecuta upgrade o downgrade
 * Body: { direction: "upgrade" | "downgrade" }
 */
async function execute(req, res) {
  try {
    const { direction } = req.body;
    
    // Validate direction
    if (!['upgrade', 'downgrade'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Dirección inválida. Use "upgrade" o "downgrade"',
      });
    }

    const result = await migrationManager.execute(direction);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
    
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Error executing migration:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Error al ejecutar migración',
    });
  }
}

module.exports = {
  list,
  history,
  stats,
  preview,
  execute,
};
```

- [ ] **Step 2b: Commit**

```bash
cd backend
git add src/controllers/migrationsController.js
git commit -m "feat: create migrations controller with 5 endpoint handlers"
```

---

## Task 3: Create Migrations Routes with Admin Middleware

**Files:**
- Create: `backend/src/routes/migrations.js`

- [ ] **Step 3a: Create migrations.js route file**

```js
const express = require('express');
const router = express.Router();
const migrationsController = require('../controllers/migrationsController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication AND admin role
router.use(verifyToken);
router.use(requireAdmin);

// GET routes (read-only)
router.get('/list', migrationsController.list);
router.get('/history', migrationsController.history);
router.get('/stats', migrationsController.stats);
router.get('/preview/:version/:direction', migrationsController.preview);

// POST route (write)
router.post('/execute', migrationsController.execute);

module.exports = router;
```

- [ ] **Step 3b: Register route in backend/src/index.js**

Open `backend/src/index.js` and add the migrations route after the other routes (around line 37):

```js
// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lookup', require('./routes/lookup'));
app.use('/api/personas', require('./routes/personas'));
app.use('/api/planes', require('./routes/planes'));
app.use('/api/migrations', require('./routes/migrations'));  // ← ADD THIS LINE
```

- [ ] **Step 3c: Commit**

```bash
cd backend
git add src/routes/migrations.js src/index.js
git commit -m "feat: add migrations routes with admin middleware"
```

---

## Task 4: Create Migrations Service (Frontend API Client)

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/services/migrationsService.js`

- [ ] **Step 4a: Create migrationsService.js**

```js
import api from '../../../../../services/api';

const BASE_URL = '/api/migrations';

export const migrationsAPI = {
  /**
   * GET /api/migrations/list
   * Returns: { success, data: { versions, currentVersion } }
   */
  list: async () => {
    const response = await api.get(`${BASE_URL}/list`);
    return response.data;
  },

  /**
   * GET /api/migrations/history
   * Returns: { success, data: { history } }
   */
  history: async () => {
    const response = await api.get(`${BASE_URL}/history`);
    return response.data;
  },

  /**
   * GET /api/migrations/stats
   * Returns: { success, data: { currentVersion, tables, timestamp } }
   */
  stats: async () => {
    const response = await api.get(`${BASE_URL}/stats`);
    return response.data;
  },

  /**
   * GET /api/migrations/preview/:version/:direction
   * direction: "upgrade" | "downgrade"
   * Returns: { success, data: { version, direction, sql, description, nextVersion } }
   */
  preview: async (version, direction) => {
    const response = await api.get(`${BASE_URL}/preview/${version}/${direction}`);
    return response.data;
  },

  /**
   * POST /api/migrations/execute
   * Body: { direction: "upgrade" | "downgrade" }
   * Returns: { success, data: { version, message, duration } } or { success: false, message }
   */
  execute: async (direction) => {
    const response = await api.post(`${BASE_URL}/execute`, { direction });
    return response.data;
  },
};

export default migrationsAPI;
```

- [ ] **Step 4b: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/MigrationsDashboard/services/migrationsService.js
git commit -m "feat: create migrations API service"
```

---

## Task 5: Create PreviewModal Component

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/modals/PreviewModal.jsx`

- [ ] **Step 5a: Create PreviewModal.jsx**

```jsx
import React from 'react';
import '../styles/PreviewModal.scss';

function PreviewModal({ 
  isOpen, 
  preview, 
  onConfirm, 
  onCancel, 
  isLoading 
}) {
  if (!isOpen || !preview) return null;

  const { version, direction, sql, description, nextVersion } = preview;
  
  const directionLabel = direction === 'upgrade' ? '↑ Upgrade' : '↓ Downgrade';
  const actionLabel = direction === 'upgrade' ? 'Aplicar' : 'Revertir';

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal">
        <div className="preview-modal__header">
          <h2>{directionLabel}</h2>
          <button 
            className="preview-modal__close" 
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="preview-modal__content">
          {/* Version info */}
          <div className="preview-modal__info">
            <p>
              <strong>Versión actual:</strong> {version}
              {nextVersion && ` → ${nextVersion}`}
            </p>
            <p>
              <strong>Descripción:</strong> {description}
            </p>
          </div>

          {/* SQL preview */}
          <div className="preview-modal__sql-container">
            <h3>SQL a ejecutar:</h3>
            <pre className="preview-modal__sql">
              <code>{sql}</code>
            </pre>
          </div>
        </div>

        <div className="preview-modal__footer">
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => onConfirm(direction)}
            disabled={isLoading}
          >
            {isLoading ? 'Ejecutando...' : `Confirmar ${actionLabel}`}
          </button>
        </div>
      </div>

      {isLoading && <div className="preview-modal__loading-overlay">
        <div className="spinner"></div>
        <p>Aplicando migración...</p>
      </div>}
    </div>
  );
}

export default PreviewModal;
```

- [ ] **Step 5b: Create PreviewModal.scss styles**

Create `frontend/src/pages/DashboardPage/components/MigrationsDashboard/styles/PreviewModal.scss`:

```scss
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.preview-modal__header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
}

.preview-modal__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #000;
    background: #f0f0f0;
    border-radius: 4px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.preview-modal__content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.preview-modal__info {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;

  p {
    margin: 8px 0;

    strong {
      color: #333;
    }
  }
}

.preview-modal__sql-container {
  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 0.95rem;
    color: #333;
  }
}

.preview-modal__sql {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #333;
  margin: 0;

  code {
    font-family: 'Courier New', monospace;
  }
}

.preview-modal__footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;

    &.btn-primary {
      background: #007bff;
      color: white;

      &:hover:not(:disabled) {
        background: #0056b3;
      }

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }

    &.btn-secondary {
      background: #f0f0f0;
      color: #333;

      &:hover:not(:disabled) {
        background: #e0e0e0;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
  }
}

.preview-modal__loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  gap: 15px;

  p {
    font-size: 0.95rem;
    color: #666;
    margin: 0;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 5c: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/MigrationsDashboard/modals/PreviewModal.jsx src/pages/DashboardPage/components/MigrationsDashboard/styles/PreviewModal.scss
git commit -m "feat: create PreviewModal component with SQL preview and loading state"
```

---

## Task 6: Create VersionesTab Component

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/tabs/VersionesTab.jsx`

- [ ] **Step 6a: Create VersionesTab.jsx**

```jsx
import React from 'react';
import '../styles/VersionesTab.scss';

function VersionesTab({ 
  versions, 
  currentVersion, 
  onUpgrade, 
  onDowngrade, 
  isLoading 
}) {
  if (!versions || versions.length === 0) {
    return <div className="tab-content">No hay versiones disponibles</div>;
  }

  return (
    <div className="tab-content versions-tab">
      <div className="versions-info">
        <p>
          <strong>Versión actual:</strong> <span className="version-badge">{currentVersion || 'Sin aplicar'}</span>
        </p>
        <p className="text-muted">Total de versiones: {versions.length}</p>
      </div>

      <div className="versions-list">
        {versions.map((version, idx) => {
          const isApplied = version.estado === 'aplicada';
          const isNext = idx === versions.findIndex(v => v.estado === 'pendiente');
          const canDowngrade = isApplied && idx === versions.findIndex(v => v.estado === 'aplicada') + (versions.filter(v => v.estado === 'aplicada').length - 1);
          
          return (
            <div key={version.version} className={`version-card ${isApplied ? 'applied' : 'pending'}`}>
              <div className="version-card__header">
                <span className="version-number">{version.version}</span>
                <span className={`status-badge ${isApplied ? 'applied' : 'pending'}`}>
                  {isApplied ? '✓ Aplicada' : '○ Pendiente'}
                </span>
              </div>

              <p className="version-description">{version.descripcion}</p>

              <div className="version-actions">
                {isNext && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onUpgrade(version.version)}
                    disabled={isLoading}
                  >
                    ↑ Upgrade
                  </button>
                )}
                {canDowngrade && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => onDowngrade(version.version)}
                    disabled={isLoading}
                  >
                    ↓ Downgrade
                  </button>
                )}
                {!isNext && !canDowngrade && (
                  <span className="text-muted text-sm">Sin acciones disponibles</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VersionesTab;
```

- [ ] **Step 6b: Create VersionesTab.scss styles**

Create `frontend/src/pages/DashboardPage/components/MigrationsDashboard/styles/VersionesTab.scss`:

```scss
.versions-tab {
  .versions-info {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 20px;

    p {
      margin: 8px 0;

      .version-badge {
        background: #007bff;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
      }
    }

    .text-muted {
      color: #666;
      font-size: 0.9rem;
    }
  }

  .versions-list {
    display: grid;
    gap: 15px;
  }
}

.version-card {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  background: white;
  transition: all 0.2s ease;

  &.applied {
    border-left: 4px solid #28a745;
    background: #f8fff8;
  }

  &.pending {
    border-left: 4px solid #ffc107;
    background: #fffaf0;
  }

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .version-number {
      font-weight: bold;
      font-size: 1.1rem;
      color: #333;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;

      &.applied {
        background: #d4edda;
        color: #155724;
      }

      &.pending {
        background: #fff3cd;
        color: #856404;
      }
    }
  }
}

.version-description {
  color: #555;
  margin: 10px 0;
  font-size: 0.95rem;
}

.version-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;

  .btn-sm {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .text-sm {
    font-size: 0.85rem;
    color: #999;
  }
}

.btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s ease;

  &.btn-primary {
    background: #007bff;
    color: white;

    &:hover:not(:disabled) {
      background: #0056b3;
    }
  }

  &.btn-warning {
    background: #ffc107;
    color: #333;

    &:hover:not(:disabled) {
      background: #e0a800;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.text-muted {
  color: #999;
}
```

- [ ] **Step 6c: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/MigrationsDashboard/tabs/VersionesTab.jsx src/pages/DashboardPage/components/MigrationsDashboard/styles/VersionesTab.scss
git commit -m "feat: create VersionesTab component showing available migrations"
```

---

## Task 7: Create HistorialTab Component

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/tabs/HistorialTab.jsx`

- [ ] **Step 7a: Create HistorialTab.jsx**

```jsx
import React, { useState } from 'react';
import '../styles/HistorialTab.scss';

function HistorialTab({ history }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!history || history.length === 0) {
    return (
      <div className="tab-content">
        <p className="empty-state">No hay historial de migraciones registrado</p>
      </div>
    );
  }

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = history.slice(startIdx, startIdx + itemsPerPage);

  const getStatusClass = (status) => {
    if (status === 'exitosa') return 'exitosa';
    return 'fallida';
  };

  const getTypeLabel = (type) => {
    return type === 'upgrade' ? '↑ Upgrade' : '↓ Downgrade';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="tab-content historial-tab">
      <div className="table-wrapper">
        <table className="historial-table">
          <thead>
            <tr>
              <th>Versión</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            {paginatedHistory.map((record) => (
              <tr key={record.id} className={`status-${getStatusClass(record.estado)}`}>
                <td className="version-col">{record.version}</td>
                <td className="description-col">{record.descripcion}</td>
                <td className="type-col">{getTypeLabel(record.tipo)}</td>
                <td className="status-col">
                  <span className={`status-badge ${getStatusClass(record.estado)}`}>
                    {record.estado === 'exitosa' ? '✓ Exitosa' : '✗ Fallida'}
                  </span>
                </td>
                <td className="date-col">{formatDate(record.fecha_ejecucion)}</td>
                <td className="duration-col">
                  {record.duracion ? `${record.duracion}s` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

export default HistorialTab;
```

- [ ] **Step 7b: Create HistorialTab.scss styles**

Create `frontend/src/pages/DashboardPage/components/MigrationsDashboard/styles/HistorialTab.scss`:

```scss
.historial-tab {
  .table-wrapper {
    overflow-x: auto;
    margin-bottom: 20px;
  }

  .historial-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;

    thead {
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;

      th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #333;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #eee;
        transition: background 0.2s ease;

        &:hover {
          background: #f9f9f9;
        }

        &.status-exitosa {
          border-left: 3px solid #28a745;
        }

        &.status-fallida {
          border-left: 3px solid #dc3545;
        }

        td {
          padding: 12px;
        }

        .version-col {
          font-weight: bold;
          color: #007bff;
          font-family: monospace;
        }

        .description-col {
          color: #555;
        }

        .type-col {
          text-align: center;
        }

        .status-col {
          text-align: center;

          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;
            white-space: nowrap;

            &.exitosa {
              background: #d4edda;
              color: #155724;
            }

            &.fallida {
              background: #f8d7da;
              color: #721c24;
            }
          }
        }

        .date-col {
          font-size: 0.85rem;
          color: #666;
          font-family: monospace;
        }

        .duration-col {
          text-align: right;
          font-weight: 500;
          color: #333;
        }
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;

  .pagination-btn {
    padding: 8px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: #f0f0f0;
      border-color: #007bff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .pagination-info {
    font-size: 0.9rem;
    color: #666;
    min-width: 150px;
    text-align: center;
  }
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 20px;
  font-size: 0.95rem;
}
```

- [ ] **Step 7c: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/MigrationsDashboard/tabs/HistorialTab.jsx src/pages/DashboardPage/components/MigrationsDashboard/styles/HistorialTab.scss
git commit -m "feat: create HistorialTab component with pagination"
```

---

## Task 8: Create EstadisticasTab Component

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/tabs/EstadisticasTab.jsx`

- [ ] **Step 8a: Create EstadisticasTab.jsx**

```jsx
import React from 'react';
import '../styles/EstadisticasTab.scss';

function EstadisticasTab({ stats, onRefresh, isLoading }) {
  if (!stats) {
    return <div className="tab-content">Cargando estadísticas...</div>;
  }

  const { currentVersion, tables } = stats;
  
  const totalRecords = tables.reduce((sum, table) => sum + table.registros, 0);

  return (
    <div className="tab-content estadisticas-tab">
      {/* Version info */}
      <div className="version-info-box">
        <h3>Versión Actual de la BD</h3>
        <div className="version-display">
          <span className="version-number">{currentVersion || 'Sin aplicar'}</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? '⟳ Actualizando...' : '⟳ Refrescar'}
          </button>
        </div>
      </div>

      {/* Tables info */}
      <div className="tables-info">
        <div className="tables-header">
          <h3>Estadísticas de Tablas</h3>
          <p className="total-records">Total de registros: <strong>{totalRecords.toLocaleString('es-AR')}</strong></p>
        </div>

        {tables.length === 0 ? (
          <p className="empty-state">No hay tablas disponibles</p>
        ) : (
          <div className="table-wrapper">
            <table className="tables-table">
              <thead>
                <tr>
                  <th>Tabla</th>
                  <th className="record-count-header">Registros</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr key={table.tabla}>
                    <td className="table-name">{table.tabla}</td>
                    <td className="record-count">
                      {table.registros.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EstadisticasTab;
```

- [ ] **Step 8b: Create EstadisticasTab.scss styles**

Create `frontend/src/pages/DashboardPage/components/MigrationsDashboard/styles/EstadisticasTab.scss`:

```scss
.estadisticas-tab {
  .version-info-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;

    h3 {
      margin: 0 0 15px 0;
      font-size: 1rem;
      opacity: 0.9;
    }

    .version-display {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .version-number {
        font-size: 2rem;
        font-weight: bold;
        font-family: monospace;
        letter-spacing: 2px;
      }

      .btn-sm {
        padding: 8px 14px;
        font-size: 0.85rem;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }
  }

  .tables-info {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;

    .tables-header {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 10px 0;
        font-size: 1rem;
      }

      .total-records {
        margin: 0;
        color: #666;
        font-size: 0.9rem;

        strong {
          color: #333;
          font-size: 1.1rem;
        }
      }
    }
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .tables-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;

    thead {
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;

      th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #333;

        &.record-count-header {
          text-align: right;
        }
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #eee;
        transition: background 0.2s ease;

        &:hover {
          background: #fafafa;
        }

        &:last-child {
          border-bottom: none;
        }

        td {
          padding: 12px;

          &.table-name {
            font-family: monospace;
            font-weight: 500;
            color: #007bff;
          }

          &.record-count {
            text-align: right;
            color: #333;
            font-weight: 500;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    color: #999;
    padding: 40px 20px;
    font-size: 0.95rem;
  }

  .btn {
    border: none;
    border-radius: 4px;
    cursor: pointer;
    padding: 8px 16px;
    font-weight: 500;
    transition: all 0.2s ease;

    &.btn-secondary {
      background: #6c757d;
      color: white;

      &:hover:not(:disabled) {
        background: #5a6268;
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
```

- [ ] **Step 8c: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/MigrationsDashboard/tabs/EstadisticasTab.jsx src/pages/DashboardPage/components/MigrationsDashboard/styles/EstadisticasTab.scss
git commit -m "feat: create EstadisticasTab component with DB statistics"
```

---

## Task 9: Create MigrationsDashboard Main Component

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/MigrationsDashboard.jsx`
- Create: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/styles/MigrationsDashboard.scss`

- [ ] **Step 9a: Create MigrationsDashboard.jsx**

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import VersionesTab from './tabs/VersionesTab';
import HistorialTab from './tabs/HistorialTab';
import EstadisticasTab from './tabs/EstadisticasTab';
import PreviewModal from './modals/PreviewModal';
import migrationsAPI from './services/migrationsService';
import './styles/MigrationsDashboard.scss';

function MigrationsDashboard() {
  const [activeTab, setActiveTab] = useState('versiones');
  const [versions, setVersions] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setError(null);
      const [listRes, historyRes, statsRes] = await Promise.all([
        migrationsAPI.list(),
        migrationsAPI.history(),
        migrationsAPI.stats(),
      ]);

      if (listRes.success) {
        setVersions(listRes.data.versions);
        setCurrentVersion(listRes.data.currentVersion);
      }

      if (historyRes.success) {
        setHistory(historyRes.data.history);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error loading migration data:', err);
      setError('Error al cargar datos de migraciones');
    }
  }, []);

  const handleUpgrade = useCallback(async (version) => {
    try {
      setError(null);
      const previewRes = await migrationsAPI.preview(version, 'upgrade');
      if (previewRes.success) {
        setPreview({ ...previewRes.data, open: true });
      } else {
        setError(previewRes.message || 'Error al obtener preview');
      }
    } catch (err) {
      console.error('Error getting preview:', err);
      setError(err.message || 'Error al obtener preview');
    }
  }, []);

  const handleDowngrade = useCallback(async (version) => {
    try {
      setError(null);
      const previewRes = await migrationsAPI.preview(version, 'downgrade');
      if (previewRes.success) {
        setPreview({ ...previewRes.data, open: true });
      } else {
        setError(previewRes.message || 'Error al obtener preview');
      }
    } catch (err) {
      console.error('Error getting preview:', err);
      setError(err.message || 'Error al obtener preview');
    }
  }, []);

  const handleConfirmExecution = useCallback(async (direction) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const executeRes = await migrationsAPI.execute(direction);
      
      if (executeRes.success) {
        setSuccess(`${executeRes.data.message} (${executeRes.data.duration}s)`);
        setPreview(null);
        
        // Reload all data after successful migration
        setTimeout(() => {
          loadAllData();
          setSuccess(null);
        }, 1500);
      } else {
        setError(executeRes.message || 'Error al ejecutar migración');
      }
    } catch (err) {
      console.error('Error executing migration:', err);
      setError(err.message || 'Error al ejecutar migración');
    } finally {
      setIsLoading(false);
    }
  }, [loadAllData]);

  const handleClosePreview = useCallback(() => {
    if (!isLoading) {
      setPreview(null);
      setError(null);
    }
  }, [isLoading]);

  const handleRefreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const statsRes = await migrationsAPI.stats();
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error refreshing stats:', err);
      setError('Error al actualizar estadísticas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="migrations-dashboard">
      {/* Error banner */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button
            className="alert-close"
            onClick={() => setError(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="alert alert-success">
          <span>✓ {success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'versiones' ? 'active' : ''}`}
            onClick={() => setActiveTab('versiones')}
          >
            Versiones
          </button>
          <button
            className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => setActiveTab('historial')}
          >
            Historial
          </button>
          <button
            className={`tab-btn ${activeTab === 'estadisticas' ? 'active' : ''}`}
            onClick={() => setActiveTab('estadisticas')}
          >
            Estadísticas
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'versiones' && (
            <VersionesTab
              versions={versions}
              currentVersion={currentVersion}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'historial' && (
            <HistorialTab history={history} />
          )}
          {activeTab === 'estadisticas' && (
            <EstadisticasTab
              stats={stats}
              onRefresh={handleRefreshStats}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          isOpen={preview.open !== false}
          preview={preview}
          onConfirm={handleConfirmExecution}
          onCancel={handleClosePreview}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default MigrationsDashboard;
```

- [ ] **Step 9b: Create MigrationsDashboard.scss styles**

Create `frontend/src/pages/DashboardPage/components/MigrationsDashboard/styles/MigrationsDashboard.scss`:

```scss
.migrations-dashboard {
  padding: 0;
  position: relative;

  .alert {
    padding: 12px 16px;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    font-size: 0.95rem;
    animation: slideDown 0.3s ease-out;

    &.alert-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    &.alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
      color: inherit;
      font-size: 1rem;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        opacity: 0.7;
      }
    }
  }

  @keyframes slideDown {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .tabs {
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    overflow: hidden;
  }

  .tabs-header {
    display: flex;
    border-bottom: 2px solid #ddd;
    background: #f9f9f9;
  }

  .tab-btn {
    flex: 1;
    padding: 15px;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.95rem;
    color: #666;
    transition: all 0.2s ease;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;

    &:hover {
      color: #333;
      background: rgba(0, 123, 255, 0.05);
    }

    &.active {
      color: #007bff;
      border-bottom-color: #007bff;
      background: white;
    }
  }

  .tabs-content {
    animation: fadeIn 0.2s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .tab-content {
    padding: 20px;
  }
}
```

- [ ] **Step 9c: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/MigrationsDashboard/MigrationsDashboard.jsx src/pages/DashboardPage/components/MigrationsDashboard/styles/MigrationsDashboard.scss
git commit -m "feat: create MigrationsDashboard main component with tab management"
```

---

## Task 10: Integrate MigrationsDashboard into DashboardPage

**Files:**
- Modify: `frontend/src/pages/DashboardPage/DashboardPage.jsx`

- [ ] **Step 10a: Read DashboardPage.jsx** to understand the current structure

- [ ] **Step 10b: Add import at the top** of DashboardPage.jsx (after other component imports):

```jsx
import MigrationsDashboard from './components/MigrationsDashboard/MigrationsDashboard';
```

- [ ] **Step 10c: Add menu item for Migraciones** to the MENU constant:

Find the MENU array and add a new item for admin users only. Modify the MENU to include conditional logic in the Sidebar:

```jsx
const MENU = [
  {
    key: 'mi-cuenta',
    label: 'Mi Cuenta',
    children: [
      { key: 'datos-personales', label: 'Datos Personales' },
      { key: 'cobradores', label: 'Cobradores' },
      { key: 'tiposPlan', label: 'Tipos de Plan' },
      { key: 'obrasSociales', label: 'Obras Sociales' },
      { key: 'serviciosAdicionales', label: 'Servicios Adicionales' },
      { key: 'tiposGrupo', label: 'Tipos de Grupo' },
      { key: 'planes', label: 'Planes' },
    ],
  },
];
```

Instead of modifying MENU directly, we'll add conditional rendering in the Sidebar component. Find the Sidebar component and add this logic:

In the render section where menu items are displayed, after the existing items, add:

```jsx
{user?.rol === 'admin' && (
  <>
    <div className="sidebar-section-divider" style={{ margin: '10px 0', height: '1px', background: '#ddd' }} />
    <div
      className="sidebar-item"
      onClick={() => handleSelect('migraciones')}
      style={{
        background: activeModule === 'migraciones' ? '#f0f0f0' : 'none',
        cursor: 'pointer',
        padding: '12px 16px',
      }}
    >
      ⚙️ Migraciones BD
    </div>
  </>
)}
```

- [ ] **Step 10d: Add MigrationsDashboard to the main content area**

Find the main content rendering (usually a switch statement based on activeModule). Add:

```jsx
{activeModule === 'migraciones' && <MigrationsDashboard />}
```

After other components.

- [ ] **Step 10e: Verify useAuth is available** to check user role

The component should already have `const { user } = useAuth();` near the top.

- [ ] **Step 10f: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/DashboardPage.jsx
git commit -m "feat: integrate MigrationsDashboard into admin panel"
```

---

## Task 11: Test Backend Migrations Endpoints

**Files:**
- Test: `backend/src/routes/__tests__/migrations.spec.js`

- [ ] **Step 11a: Write test file for migrations routes**

```js
const request = require('supertest');
const app = require('../../index');
const { generateToken } = require('../../middleware/auth');

// Mock admin and regular user
const adminUser = {
  id: 1,
  email: 'admin@test.com',
  nombre: 'Admin',
  apellido: 'User',
  rol: 'admin',
};

const regularUser = {
  id: 2,
  email: 'user@test.com',
  nombre: 'Regular',
  apellido: 'User',
  rol: 'usuario',
};

const adminToken = generateToken(adminUser);
const userToken = generateToken(regularUser);

describe('Migrations API', () => {
  describe('Authorization', () => {
    test('GET /api/migrations/list should return 401 without token', async () => {
      const res = await request(app).get('/api/migrations/list');
      expect(res.status).toBe(401);
    });

    test('GET /api/migrations/list should return 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/api/migrations/list')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    test('GET /api/migrations/list should return 200 for admin', async () => {
      const res = await request(app)
        .get('/api/migrations/list')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/migrations/list', () => {
    test('should return versions array', async () => {
      const res = await request(app)
        .get('/api/migrations/list')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('versions');
      expect(res.body.data).toHaveProperty('currentVersion');
      expect(Array.isArray(res.body.data.versions)).toBe(true);
    });
  });

  describe('GET /api/migrations/stats', () => {
    test('should return DB stats', async () => {
      const res = await request(app)
        .get('/api/migrations/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('currentVersion');
      expect(res.body.data).toHaveProperty('tables');
      expect(Array.isArray(res.body.data.tables)).toBe(true);
    });
  });

  describe('GET /api/migrations/history', () => {
    test('should return migration history', async () => {
      const res = await request(app)
        .get('/api/migrations/history')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('history');
      expect(Array.isArray(res.body.data.history)).toBe(true);
    });
  });

  describe('GET /api/migrations/preview/:version/:direction', () => {
    test('should return 400 for invalid direction', async () => {
      const res = await request(app)
        .get('/api/migrations/preview/1.0.0/invalid')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/migrations/execute', () => {
    test('should return 400 for invalid direction', async () => {
      const res = await request(app)
        .post('/api/migrations/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ direction: 'invalid' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
```

- [ ] **Step 11b: Run tests**

```bash
cd backend
npm test -- src/routes/__tests__/migrations.spec.js
```

Expected: PASS (basic auth checks pass)

- [ ] **Step 11c: Commit**

```bash
cd backend
git add src/routes/__tests__/migrations.spec.js
git commit -m "test: add authorization and endpoint tests for migrations API"
```

---

## Task 12: Manual Integration Testing

**Files:** None (testing, not coding)

- [ ] **Step 12a: Start backend**

```bash
cd backend
npm run dev
```

Verify: Backend starts and logs "✅ Base de datos conectada"

- [ ] **Step 12b: Start frontend** (in another terminal)

```bash
cd frontend
npm start
```

Verify: Frontend starts on http://localhost:3000

- [ ] **Step 12c: Login as admin**

Open http://localhost:3000, login with an admin account

- [ ] **Step 12d: Navigate to Migraciones tab** (should appear in sidebar for admin users only)

- [ ] **Step 12e: Test Versiones tab**

- Verify versions list displays
- Verify current version is highlighted
- Verify upgrade button works (click, see preview modal)
- Verify downgrade button works (if applicable)

- [ ] **Step 12f: Test Preview Modal**

- Click "Upgrade" on any pending version
- Modal opens with SQL displayed
- SQL is scrollable if long
- Cancel button closes modal
- Confirm button shows loading state

- [ ] **Step 12g: Test Execution** (if safe in dev environment)

- In PreviewModal, click "Confirmar Upgrade"
- Page shows loading overlay
- Wait for completion
- Success modal shows duration
- Historial tab auto-updates with new entry
- Versiones tab shows new current version

- [ ] **Step 12h: Test Historial tab**

- Verify table shows all migrations
- Verify pagination works if > 10 records
- Verify duration is displayed in seconds

- [ ] **Step 12i: Test Estadísticas tab**

- Verify version current is shown
- Verify table list displays all tables
- Verify record counts are displayed
- Click refresh button, verify stats update
- Verify loading state during refresh

- [ ] **Step 12j: Test non-admin access**

- Logout
- Create/login as regular user
- Verify Migraciones tab NOT visible in sidebar

- [ ] **Step 12k: Document any bugs found**

If bugs found, note them and create GitHub issues. If no bugs, proceed to commit tests.

- [ ] **Step 12l: Commit test results**

```bash
git add -A
git commit -m "test: manual integration testing complete — all features working"
```

---

## Task 13: Final Review and Polish

**Files:** All (review)

- [ ] **Step 13a: Code review checklist**

- [ ] All endpoints return proper HTTP status codes (200, 400, 401, 403, 500)
- [ ] All error messages are clear and actionable
- [ ] All frontend state management properly handles loading/error/success states
- [ ] All components have consistent styling (colors, spacing, fonts)
- [ ] All API calls use proper error handling
- [ ] All components are responsive (works on mobile/tablet/desktop)
- [ ] Performance: migrations execute reasonably fast
- [ ] Security: only admins can access migrations endpoints

- [ ] **Step 13b: Check for missing pieces**

- [ ] Backend: All 5 endpoints implemented ✓
- [ ] Frontend: 3 tabs + modal implemented ✓
- [ ] Integration: DashboardPage updated ✓
- [ ] Tests: Authorization tests written ✓
- [ ] Duration tracking: implemented in migrationManager ✓

- [ ] **Step 13c: Document API in CLAUDE.md** (optional but recommended)

Add to CLAUDE.md under "## Commands":

```markdown
### Migrations (Admin Only)
All routes require `Authorization: Bearer <token>` and admin role.

- `GET /api/migrations/list` — List available versions
- `GET /api/migrations/history` — Get migration history
- `GET /api/migrations/stats` — Get DB statistics (version, table counts)
- `GET /api/migrations/preview/:version/:direction` — Preview SQL to execute
- `POST /api/migrations/execute` — Execute upgrade/downgrade
```

- [ ] **Step 13d: Final commit**

```bash
git add -A
git commit -m "feat: complete admin migrations dashboard implementation

- Backend: migrationManager extended with getPreview/execute + duration tracking
- Backend: migrationsController with 5 endpoints + requireAdmin middleware
- Frontend: MigrationsDashboard with 3 tabs (Versiones, Historial, Estadísticas)
- Frontend: PreviewModal with SQL preview and loading state
- Integration: Migraciones tab visible only to admin users in DashboardPage
- Tests: Authorization and endpoint validation tests
- Manual testing: All features verified working
"
```

---

## Spec Coverage Verification

**Requirement → Task mapping:**

| Spec Requirement | Task | ✓ |
|------------------|------|---|
| RF1: View available versions | Task 6 (VersionesTab) | ✓ |
| RF2: Preview migrations | Task 5 (PreviewModal) + Task 1 (getPreview) | ✓ |
| RF3: Execute migrations with duration | Task 1 (execute + duration), Task 2 (controller), Task 9 (UI flow) | ✓ |
| RF4: View migration history | Task 7 (HistorialTab) | ✓ |
| RF5: DB statistics | Task 8 (EstadisticasTab) | ✓ |
| RF6: Admin-only access | Task 3 (requireAdmin middleware), Task 10 (conditional rendering) | ✓ |
| All endpoints created | Task 2 (controller) + Task 3 (routes) | ✓ |
| Error handling | Task 2 (controller error catching) + Task 9 (UI error display) | ✓ |
| Testing | Task 11 (endpoint tests) + Task 12 (integration testing) | ✓ |

---

**End of Plan**
