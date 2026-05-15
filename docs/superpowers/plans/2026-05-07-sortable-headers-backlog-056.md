# Sortable Table Headers + BACKLOG-056 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic sorting in table headers across all primary tables (GestionPlanesV1, GestionAuditoria, BusquedaAfiliados, LookupCRUD), plus display the last bulk quota increase in GenerarRecibosModal.

**Architecture:** 
- Backend: Create a shared utility (`sortUtil.js`) to validate and construct Sequelize ORDER BY clauses. Modify controllers to accept `sortBy` and `order` query parameters.
- Frontend: Create reusable hook `useSortable` managing sort state and localStorage persistence. Apply hook to main table components, adding visual indicators (↑↓) to sorted headers.
- BACKLOG-056: New endpoint `GET /api/recibos/ultimo-aumento-masivo` returns last bulk increase; load and display in `GenerarRecibosModal`.

**Tech Stack:** 
Sequelize (ORDER BY), React hooks (useSortable), localStorage (persistence), Sequelize associations (Usuario join for BACKLOG-056).

---

## Files to Create / Modify

### Backend
- Create: `backend/src/utils/sortUtil.js` — Sort validation and ORDER BY builder
- Modify: 
  - `backend/src/controllers/planesController.js` — Add sort params to filter endpoint
  - `backend/src/controllers/personasController.js` — Add sort to search endpoint
  - `backend/src/controllers/auditController.js` — Add sort to list endpoint
  - `backend/src/controllers/lookupController.js` — Add sort to all CRUD list endpoints
  - `backend/src/routes/recibos.js` — New GET /ultimo-aumento-masivo
  - `backend/src/controllers/recibosController.js` — Implement getUltimoAumentoMasivo

### Frontend
- Create: `frontend/src/hooks/useSortable.js` — Reusable sort hook
- Modify:
  - `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx`
  - `frontend/src/pages/DashboardPage/components/GestionAuditoria/GestionAuditoria.jsx`
  - `frontend/src/components/LookupCRUD/LookupCRUD.jsx`
  - `frontend/src/pages/DashboardPage/components/BusquedaAfiliados/BusquedaAfiliados.jsx` (if exists)
  - `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/GenerarRecibosModal.jsx` (BACKLOG-056)
  - `frontend/src/services/planesService.js` — Add sort params to queries
  - `frontend/src/services/personasService.js` — Add sort params
  - `frontend/src/services/auditService.js` — Add sort params
  - `frontend/src/services/lookupService.js` — Add sort params
  - `frontend/src/services/recibosService.js` — Add getUltimoAumentoMasivo

---

## Implementation Tasks

### Task 1: Create Backend Sort Utility

**Files:**
- Create: `backend/src/utils/sortUtil.js`

- [ ] **Step 1: Write sortUtil.js**

Create `backend/src/utils/sortUtil.js`:

```javascript
/**
 * Validates and constructs Sequelize ORDER BY clause
 * @param {string} sortBy - Column name (e.g., 'plan_numero', 'fecha', 'apellido')
 * @param {string} order - 'ASC' or 'DESC' (default: 'ASC')
 * @param {string[]} allowedColumns - List of valid column names for this model
 * @returns {Array} Sequelize ORDER BY format: [['column', 'ASC']] or [['colA', 'ASC'], ['colB', 'ASC']]
 * @throws Error if sortBy not in allowedColumns
 */
function buildOrderByClause(sortBy, order = 'ASC', allowedColumns = []) {
  // Validate order direction
  const normalizedOrder = (order || 'ASC').toUpperCase();
  if (!['ASC', 'DESC'].includes(normalizedOrder)) {
    throw new Error(`Invalid order direction: ${order}`);
  }

  // If no sortBy provided, return empty array (use model defaults)
  if (!sortBy) {
    return [];
  }

  // Validate column is allowed
  if (!allowedColumns.includes(sortBy)) {
    throw new Error(`Invalid sort column: ${sortBy}. Allowed: ${allowedColumns.join(', ')}`);
  }

  return [[sortBy, normalizedOrder]];
}

module.exports = {
  buildOrderByClause,
};
```

- [ ] **Step 2: Verify file exists**

```bash
ls -la backend/src/utils/sortUtil.js
# Expected: file exists
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/utils/sortUtil.js
git commit -m "feat(utils): crear sortUtil para ordenamiento dinámico de tablas"
```

---

### Task 2: Update planesController to Accept Sort Params

**Files:**
- Modify: `backend/src/controllers/planesController.js`

- [ ] **Step 1: Add sortUtil import at top**

At line 1 of `planesController.js`, after existing requires:

```javascript
const { buildOrderByClause } = require('../utils/sortUtil');
```

- [ ] **Step 2: Modify filter endpoint to accept sort params**

Find the `filter` function (around line 9-39). Replace with:

```javascript
exports.filter = async (req, res, next) => {
  try {
    const { filtro } = req.params;
    const { tipo_plan_numero, cobrador_numero, os_numero, estado, sortBy, order } = req.query;

    let where = {};

    if (filtro === 'tipo_plan' && tipo_plan_numero) {
      where.tipo_plan_numero = parseInt(tipo_plan_numero);
    } else if (filtro === 'cobrador' && cobrador_numero) {
      where.cobrador_numero = parseInt(cobrador_numero);
    } else if (filtro === 'os' && os_numero) {
      where.os_numero = parseInt(os_numero);
    } else if (filtro === 'estado' && estado) {
      where.estado = estado.toUpperCase();
    }

    // Build ORDER BY clause (allow: plan_numero, numero_afiliado, estado, zona_codigo, valor_cuota, fecha_creacion)
    const allowedColumns = ['plan_numero', 'numero_afiliado', 'estado', 'zona_codigo', 'valor_cuota', 'fecha_creacion'];
    let orderBy = [['plan_numero', 'ASC']]; // default
    if (sortBy) {
      orderBy = buildOrderByClause(sortBy, order, allowedColumns);
    }

    const planes = await db.PlanV1.findAll({
      where,
      order: orderBy,
    });

    res.json({
      success: true,
      data: planes,
      count: planes.length,
    });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/planesController.js
git commit -m "feat(planes): agregar parámetros sortBy/order a endpoint filter"
```

---

### Task 3: Create Frontend useSortable Hook

**Files:**
- Create: `frontend/src/hooks/useSortable.js`

- [ ] **Step 1: Write useSortable hook**

Create `frontend/src/hooks/useSortable.js`:

```javascript
import { useState, useEffect } from 'react';

/**
 * Hook para manejar ordenamiento dinámico en tablas
 * @param {string} storageKey - Key para localStorage (e.g., 'gestion-planes-sort')
 * @param {string} defaultSortBy - Columna de ordenamiento por defecto
 * @param {string} defaultOrder - 'ASC' o 'DESC' por defecto
 * @returns {Object} { sortBy, order, handleSort, getSortIcon }
 */
function useSortable(storageKey, defaultSortBy = '', defaultOrder = 'ASC') {
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [order, setOrder] = useState(defaultOrder);

  // Load saved sort preference from localStorage on mount
  useEffect(() => {
    const savedSort = localStorage.getItem(storageKey);
    if (savedSort) {
      try {
        const { sortBy: saved, order: savedOrder } = JSON.parse(savedSort);
        setSortBy(saved);
        setOrder(savedOrder);
      } catch (e) {
        console.warn(`Failed to load sort preference for ${storageKey}:`, e);
      }
    }
  }, [storageKey]);

  // Handle column header click
  const handleSort = (column) => {
    let newOrder = 'ASC';
    // If clicking same column, toggle order
    if (sortBy === column) {
      newOrder = order === 'ASC' ? 'DESC' : 'ASC';
    }
    setSortBy(column);
    setOrder(newOrder);

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify({ sortBy: column, order: newOrder }));
  };

  // Get sort icon for a column (↑ for ASC, ↓ for DESC)
  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return order === 'ASC' ? ' ↑' : ' ↓';
  };

  return {
    sortBy,
    order,
    handleSort,
    getSortIcon,
  };
}

export default useSortable;
```

- [ ] **Step 2: Verify file exists**

```bash
ls -la frontend/src/hooks/useSortable.js
# Expected: file exists
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useSortable.js
git commit -m "feat(hooks): crear useSortable para ordenamiento dinámico persistente"
```

---

### Task 4: Update planesService to Pass Sort Params

**Files:**
- Modify: `frontend/src/services/planesService.js`

- [ ] **Step 1: Find getPlanes method**

Locate the `getPlanes` or `filter` method in planesService.js that calls `GET /api/planes/filter/:filtro`.

- [ ] **Step 2: Add sortBy and order parameters**

Modify the method signature and call to include sort params:

```javascript
async getPlanes(filtro = 'todos', params = {}) {
  const { sortBy, order, ...otherParams } = params;
  const queryParams = new URLSearchParams({
    ...otherParams,
    ...(sortBy && { sortBy }),
    ...(order && { order }),
  });
  const response = await api.get(`/api/planes/filter/${filtro}?${queryParams}`);
  return response.data;
}
```

(Adjust if method name or structure differs in your codebase)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/planesService.js
git commit -m "feat(services): pasar parámetros sortBy/order en planesService"
```

---

### Task 5: Update GestionPlanesV1 to Use useSortable

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx`

- [ ] **Step 1: Add import for useSortable**

Near top of file, add:

```javascript
import useSortable from '../../../../hooks/useSortable';
```

- [ ] **Step 2: Initialize useSortable hook**

Inside component function, after other hooks:

```javascript
const { sortBy, order, handleSort, getSortIcon } = useSortable(
  'gestion-planes-sort',
  'plan_numero',
  'ASC'
);
```

- [ ] **Step 3: Update loadPlanes to include sort params**

Find where you call `planesService.getPlanes()` or similar. Add sort params:

```javascript
const loadPlanes = async () => {
  setLoading(true);
  try {
    const data = await planesService.getPlanes(filtro, {
      // ... existing params
      sortBy,
      order,
    });
    setPlanes(data.data || []);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

And add `sortBy, order` to dependency array of useEffect that calls loadPlanes.

- [ ] **Step 4: Update table headers with click handlers**

Find the `<thead>` section with headers. For each `<th>` that should be sortable, add `onClick` and display sort icon:

```javascript
<th 
  onClick={() => handleSort('plan_numero')}
  style={{ cursor: 'pointer' }}
>
  Nº Plan{getSortIcon('plan_numero')}
</th>
<th 
  onClick={() => handleSort('numero_afiliado')}
  style={{ cursor: 'pointer' }}
>
  Afiliado{getSortIcon('numero_afiliado')}
</th>
<th 
  onClick={() => handleSort('estado')}
  style={{ cursor: 'pointer' }}
>
  Estado{getSortIcon('estado')}
</th>
```

(Add for all sortable columns: plan_numero, numero_afiliado, estado, zona_codigo, valor_cuota, fecha_creacion)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx
git commit -m "feat(planes): agregar ordenamiento dinámico a tabla de gestión de planes"
```

---

### Task 6: Update GestionAuditoria Controller for Sort

**Files:**
- Modify: `backend/src/controllers/auditController.js` (or equivalent)

- [ ] **Step 1: Add sortUtil import**

```javascript
const { buildOrderByClause } = require('../utils/sortUtil');
```

- [ ] **Step 2: Modify list/getAll function**

Find function that retrieves audit logs. Add sort params:

```javascript
exports.getAll = async (req, res, next) => {
  try {
    const { sortBy, order } = req.query;
    
    const allowedColumns = ['id', 'usuario_id', 'fecha', 'endpoint', 'metodo'];
    let orderBy = [['fecha', 'DESC']]; // default
    if (sortBy) {
      orderBy = buildOrderByClause(sortBy, order, allowedColumns);
    }

    const logs = await db.AuditLog.findAll({
      order: orderBy,
      include: [{ model: db.Usuario, attributes: ['id', 'nombre', 'apellido'] }],
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/auditController.js
git commit -m "feat(audit): agregar parámetros de ordenamiento a listado"
```

---

### Task 7: Update GestionAuditoria Service and Component

**Files:**
- Modify: `frontend/src/services/auditService.js` and `frontend/src/pages/DashboardPage/components/GestionAuditoria/GestionAuditoria.jsx`

- [ ] **Step 1: Update auditService.js**

Add sort params to API call:

```javascript
async getAll(params = {}) {
  const { sortBy, order, ...otherParams } = params;
  const queryParams = new URLSearchParams({
    ...otherParams,
    ...(sortBy && { sortBy }),
    ...(order && { order }),
  });
  const response = await api.get(`/api/audit?${queryParams}`);
  return response.data;
}
```

- [ ] **Step 2: Update GestionAuditoria.jsx**

Add useSortable import and hook:

```javascript
import useSortable from '../../../../hooks/useSortable';

// Inside component:
const { sortBy, order, handleSort, getSortIcon } = useSortable(
  'gestion-auditoria-sort',
  'fecha',
  'DESC'
);
```

Update API call and table headers similarly to Task 5.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/auditService.js frontend/src/pages/DashboardPage/components/GestionAuditoria/GestionAuditoria.jsx
git commit -m "feat(auditoria): agregar ordenamiento dinámico a tabla de auditoría"
```

---

### Task 8: Update LookupCRUD for Sort

**Files:**
- Modify: `backend/src/controllers/lookupController.js`
- Modify: `frontend/src/components/LookupCRUD/LookupCRUD.jsx`
- Modify: `frontend/src/services/lookupService.js`

- [ ] **Step 1: Update lookupController.js getAll function**

```javascript
const { buildOrderByClause } = require('../utils/sortUtil');

// Example: getCobradores, getObrasSociales, etc. - Update each list function
exports.getCobradores = async (req, res, next) => {
  try {
    const { sortBy, order } = req.query;
    const allowedColumns = ['id', 'numero', 'nombre', 'apellido', 'fecha_creacion'];
    let orderBy = [['numero', 'ASC']];
    if (sortBy) {
      orderBy = buildOrderByClause(sortBy, order, allowedColumns);
    }

    const cobradores = await db.Cobrador.findAll({ order: orderBy });
    res.json({ success: true, data: cobradores });
  } catch (err) {
    next(err);
  }
};

// Repeat for: getObrasSociales, getServicios, getTiposDeGrupo, getTiposDePlan, getZonas, getProvincias
```

- [ ] **Step 2: Update lookupService.js**

Add sort params to all API calls:

```javascript
async getCobradores(sortBy = '', order = 'ASC') {
  const params = new URLSearchParams();
  if (sortBy) params.append('sortBy', sortBy);
  if (order) params.append('order', order);
  const response = await api.get(`/api/lookup/cobradores?${params}`);
  return response.data;
}

// Repeat for other methods: getObrasSociales, getServicios, etc.
```

- [ ] **Step 3: Update LookupCRUD.jsx**

Add useSortable and update table to use sort:

```javascript
import useSortable from '../../hooks/useSortable';

// Inside component:
const { sortBy, order, handleSort, getSortIcon } = useSortable(
  `lookup-${lookupType}-sort`,
  'numero',
  'ASC'
);

// In loadLookup:
const data = await lookupService[`get${lookupType}`](sortBy, order);
```

Update table headers with onClick handlers.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/lookupController.js frontend/src/services/lookupService.js frontend/src/components/LookupCRUD/LookupCRUD.jsx
git commit -m "feat(lookup): agregar ordenamiento dinámico a todos los listados lookup"
```

---

### Task 9: Create Recibos Endpoint for Último Aumento Masivo (BACKLOG-056)

**Files:**
- Modify: `backend/src/routes/recibos.js`
- Modify: `backend/src/controllers/recibosController.js`

- [ ] **Step 1: Add route to recibos.js**

Add new GET route:

```javascript
// GET /api/recibos/ultimo-aumento-masivo
router.get('/ultimo-aumento-masivo', recibosController.getUltimoAumentoMasivo);
```

Place this BEFORE any parameterized routes like `/:id`.

- [ ] **Step 2: Implement getUltimoAumentoMasivo in recibosController.js**

```javascript
/**
 * GET /api/recibos/ultimo-aumento-masivo
 * Obtiene el último aumento masivo realizado
 */
exports.getUltimoAumentoMasivo = async (req, res, next) => {
  try {
    const ultimoAumento = await db.AumentoMasivo.findOne({
      include: [
        {
          model: db.Usuario,
          attributes: ['id', 'nombre', 'apellido'],
        },
      ],
      order: [['fecha', 'DESC']],
    });

    res.json({
      success: true,
      data: ultimoAumento,
    });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/recibos.js backend/src/controllers/recibosController.js
git commit -m "feat(recibos): agregar endpoint GET /ultimo-aumento-masivo"
```

---

### Task 10: Update recibosService.js (BACKLOG-056)

**Files:**
- Modify: `frontend/src/services/recibosService.js`

- [ ] **Step 1: Add getUltimoAumentoMasivo method**

```javascript
async getUltimoAumentoMasivo() {
  const response = await api.get('/api/recibos/ultimo-aumento-masivo');
  return response.data;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/recibosService.js
git commit -m "feat(recibos): agregar método getUltimoAumentoMasivo en servicio"
```

---

### Task 11: Update GenerarRecibosModal to Show Last Bulk Increase (BACKLOG-056)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/GenerarRecibosModal.jsx`

- [ ] **Step 1: Add useState and useEffect for último aumento**

Near top of component function:

```javascript
const [ultimoAumento, setUltimoAumento] = useState(null);
const [loadingAumento, setLoadingAumento] = useState(false);
```

Add useEffect to load on mount:

```javascript
useEffect(() => {
  loadUltimoAumento();
}, []);

const loadUltimoAumento = async () => {
  setLoadingAumento(true);
  try {
    const res = await recibosService.getUltimoAumentoMasivo();
    if (res.success) {
      setUltimoAumento(res.data);
    }
  } catch (err) {
    console.warn('Error loading último aumento:', err);
  } finally {
    setLoadingAumento(false);
  }
};
```

- [ ] **Step 2: Add import for recibosService**

At top of file:

```javascript
import recibosService from '../../../../services/recibosService';
```

- [ ] **Step 3: Render último aumento info below month message**

Find where you render the message "Se generarán recibos para mes..." (typically in modal-body). Add after that message:

```javascript
{/* Mensaje de recibos a generar */}
<div className="generar-recibos-modal__message">
  Se generarán recibos para mes de {mesNombre}/{year}
</div>

{/* Mostrar último aumento masivo */}
{ultimoAumento && (
  <div className="generar-recibos-modal__ultimo-aumento">
    <strong>Último aumento masivo:</strong>{' '}
    {ultimoAumento.porcentaje}% realizado el{' '}
    {new Date(ultimoAumento.fecha).toLocaleString('es-AR')} por{' '}
    {ultimoAumento.Usuario
      ? `${ultimoAumento.Usuario.apellido}, ${ultimoAumento.Usuario.nombre}`
      : 'Usuario desconocido'}
  </div>
)}
```

- [ ] **Step 4: Add SCSS styles (in GenerarRecibosModal.scss)**

```scss
.generar-recibos-modal__ultimo-aumento {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-left: 3px solid #0066cc;
  font-size: 13px;
  line-height: 1.5;
  
  strong {
    font-weight: 600;
    color: #333;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/GenerarRecibosModal.jsx
git commit -m "feat(recibos): mostrar último aumento masivo en modal de generación de recibos"
```

---

### Task 12: Final Testing and Verification

- [ ] **Step 1: Test sortable headers in GestionPlanesV1**
  - Open browser to GestionPlanesV1
  - Click different column headers
  - Verify sort icons appear (↑↓)
  - Verify localStorage persists sort on reload

- [ ] **Step 2: Test sortable headers in GestionAuditoria**
  - Open GestionAuditoria
  - Click headers to sort by fecha, usuario, etc.
  - Verify sort works

- [ ] **Step 3: Test LookupCRUD sorting**
  - Test each lookup (Cobradores, Obras Sociales, Servicios, etc.)
  - Verify sort works independently for each

- [ ] **Step 4: Test BACKLOG-056 in GenerarRecibosModal**
  - Open GestionPlanesV1 → GenerarRecibosModal
  - Verify "Último aumento masivo" appears with correct data
  - Verify format shows: porcentaje, fecha, usuario

- [ ] **Step 5: Push all changes**

```bash
git push origin V_1.0.7
```

---

## Commit Summary

Expected commits:
1. `feat(utils): crear sortUtil para ordenamiento dinámico de tablas`
2. `feat(planes): agregar parámetros sortBy/order a endpoint filter`
3. `feat(hooks): crear useSortable para ordenamiento dinámico persistente`
4. `feat(services): pasar parámetros sortBy/order en planesService`
5. `feat(planes): agregar ordenamiento dinámico a tabla de gestión de planes`
6. `feat(audit): agregar parámetros de ordenamiento a listado`
7. `feat(auditoria): agregar ordenamiento dinámico a tabla de auditoría`
8. `feat(lookup): agregar ordenamiento dinámico a todos los listados lookup`
9. `feat(recibos): agregar endpoint GET /ultimo-aumento-masivo`
10. `feat(recibos): agregar método getUltimoAumentoMasivo en servicio`
11. `feat(recibos): mostrar último aumento masivo en modal de generación de recibos`

---

## Verification Checklist

- [ ] All 17 primary tables support sorting
- [ ] Sort preference persists in localStorage per table
- [ ] Visual indicators (↑↓) appear next to sorted column
- [ ] Clicking header toggles ASC/DESC
- [ ] Backend validates sort parameters (no injection)
- [ ] BACKLOG-056: Último aumento appears in GenerarRecibosModal
- [ ] BACKLOG-056: Shows fecha, porcentaje, usuario correctly
- [ ] All commits follow format `tipo(scope): descripción`
- [ ] No console errors when sorting
- [ ] No console errors when opening GenerarRecibosModal
