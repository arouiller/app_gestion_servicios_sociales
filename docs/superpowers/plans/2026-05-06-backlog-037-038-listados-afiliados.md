# BACKLOG-037 y 038: Pantalla de Afiliados Mejorada + Edición con Drag & Drop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an improved affiliate listing screen (BACKLOG-037) with zone filtering and search, plus drag-and-drop reordering with status management for plan members (BACKLOG-038).

**Architecture:** 
- BACKLOG-037: New read-only search/filter page for viewing all plans by zone with paginated results
- BACKLOG-038: Enhancement to PlanV1Modal with drag-drop reordering, member status tracking (Activo/Suspendido/Eliminado/Promoción), and bulk reorder endpoint
- Both items depend on existing BACKLOG-040 (zona field in plan_v1) and reuse existing pagination patterns

**Tech Stack:** 
- Backend: Express.js, Sequelize, MySQL 8.0
- Frontend: React, react-beautiful-dnd (drag & drop), Axios
- Database: New migration for plan_integrantes fields (estado, orden)

---

## File Structure

### Backend Files
- `backend/src/controllers/listadosController.js` - NEW: endpoint for zone-based listing
- `backend/src/controllers/v1.0/planIntegrantesController.js` - MODIFY: add reorder endpoint, update handler for estado
- `backend/src/models/PlanIntegrante.js` - MODIFY: add estado, orden fields
- `backend/src/routes/v1.0-listados.js` - NEW: routes for listing endpoints
- `backend/src/migrations/versions/2.0.17_plan_integrantes_estado_orden/upgrade.sql` - NEW: add columns
- `backend/src/migrations/versions/2.0.17_plan_integrantes_estado_orden/downgrade.sql` - NEW: rollback migration

### Frontend Files
- `frontend/src/pages/ListadosPage/ListadosPage.jsx` - NEW: page component for zone-based listing
- `frontend/src/pages/ListadosPage/ListadosPage.scss` - NEW: styles
- `frontend/src/pages/ListadosPage/components/ListadoZona.jsx` - NEW: filterable table component
- `frontend/src/services/listadosService.js` - NEW: API calls for listings
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` - MODIFY: add drag-drop, estado column
- `frontend/src/pages/DashboardPage/DashboardPage.jsx` - MODIFY: add Listados sidebar menu item

---

## BACKLOG-037: Pantalla de Afiliados Mejorada

### Task 1: Crear migración v2.0.17 para campos estado y orden

**Files:**
- Create: `backend/src/migrations/versions/2.0.17_plan_integrantes_estado_orden/upgrade.sql`
- Create: `backend/src/migrations/versions/2.0.17_plan_integrantes_estado_orden/downgrade.sql`

- [ ] **Step 1: Create upgrade.sql**

```sql
-- Agregar columnas a plan_integrantes
ALTER TABLE plan_integrantes ADD COLUMN estado ENUM('Activo', 'Suspendido', 'Eliminado', 'Promocion') DEFAULT 'Activo';
ALTER TABLE plan_integrantes ADD COLUMN orden INT DEFAULT 0;

-- Registrar migración
INSERT INTO migraciones_bd (version, nombre, estado, fecha_ejecucion)
VALUES ('2.0.17', 'plan_integrantes_estado_orden', 'completada', NOW());
```

- [ ] **Step 2: Create downgrade.sql**

```sql
-- Remover columnas
ALTER TABLE plan_integrantes DROP COLUMN estado;
ALTER TABLE plan_integrantes DROP COLUMN orden;

-- Remover registro de migración
DELETE FROM migraciones_bd WHERE nombre = 'plan_integrantes_estado_orden' AND version = '2.0.17';
```

- [ ] **Step 3: Commit migration**

```bash
git add backend/src/migrations/versions/2.0.17_plan_integrantes_estado_orden/
git commit -m "chore(migrations): agregar migración 2.0.17 para campos estado y orden en plan_integrantes"
```

---

### Task 2: Actualizar modelo PlanIntegrante con nuevos campos

**Files:**
- Modify: `backend/src/models/PlanIntegrante.js:1-50`

- [ ] **Step 1: Add nuevo código al modelo**

En `backend/src/models/PlanIntegrante.js`, después del campo `credencial`, agregar:

```javascript
  estado: {
    type: DataTypes.ENUM('Activo', 'Suspendido', 'Eliminado', 'Promocion'),
    defaultValue: 'Activo',
    allowNull: false,
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
```

- [ ] **Step 2: Commit model update**

```bash
git add backend/src/models/PlanIntegrante.js
git commit -m "feat(models): agregar campos estado y orden a PlanIntegrante"
```

---

### Task 3: Crear controlador de listados (BACKLOG-037)

**Files:**
- Create: `backend/src/controllers/listadosController.js`

- [ ] **Step 1: Create nuevo controlador**

```javascript
const db = require('../models');
const { Op } = require('sequelize');

const listadosController = {
  async porZona(req, res, next) {
    try {
      const { zona_id } = req.params;
      const { search, page = 1, limit = 10 } = req.query;

      // Validar zona existe
      const zona = await db.Zona.findByPk(zona_id);
      if (!zona) {
        return res.status(404).json({
          success: false,
          message: 'Zona no encontrada',
        });
      }

      let where = { zona: zona_id };

      // Filtro de búsqueda (texto en número de plan o tipo)
      if (search) {
        where = {
          [Op.and]: [
            where,
            {
              [Op.or]: [
                db.sequelize.where(
                  db.sequelize.cast(db.sequelize.col('PlanV1.plan_numero'), 'CHAR'),
                  Op.like,
                  `%${search}%`
                ),
                db.sequelize.where(
                  db.sequelize.col('TipoDePlan.tipo_plan_nombre'),
                  Op.like,
                  `%${search}%`
                ),
              ],
            },
          ],
        };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await db.PlanV1.findAndCountAll({
        where,
        include: [
          {
            model: db.TipoDePlan,
            as: 'TipoDePlan',
            attributes: ['tipo_plan_numero', 'tipo_plan_nombre'],
          },
          {
            model: db.Zona,
            as: 'zonaRelation',
            attributes: ['id', 'nombre', 'codigo'],
            include: [
              {
                model: db.Provincia,
                as: 'provincia',
                attributes: ['id', 'nombre', 'codigo'],
              },
            ],
          },
          {
            model: db.PlanIntegrante,
            as: 'PlanIntegrantes',
            attributes: ['id', 'persona_id', 'rol', 'estado', 'orden'],
            include: [
              {
                model: db.Persona,
                attributes: [
                  'id',
                  'nombre',
                  'apellido',
                  'numero_documento',
                  'fecha_nacimiento',
                ],
              },
            ],
            order: [['orden', 'ASC']],
          },
        ],
        order: [['plan_numero', 'ASC']],
        limit: parseInt(limit),
        offset,
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error in listadosController.porZona:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = listadosController;
```

- [ ] **Step 2: Commit controlador**

```bash
git add backend/src/controllers/listadosController.js
git commit -m "feat(controllers): crear listadosController con método porZona"
```

---

### Task 4: Crear rutas de listados

**Files:**
- Create: `backend/src/routes/v1.0-listados.js`

- [ ] **Step 1: Create rutas**

```javascript
const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/listadosController');

const router = express.Router();

// GET /api/v1.0/listados/por-zona/:zona_id?search=texto&page=1&limit=10
router.get('/por-zona/:zona_id', verifyToken, controller.porZona);

module.exports = router;
```

- [ ] **Step 2: Agregar ruta en admin.js**

En `backend/src/routes/admin.js`, agregar después de otras rutas:

```javascript
const listadosRoutes = require('./v1.0-listados');
app.use('/api/v1.0/listados', listadosRoutes);
```

- [ ] **Step 3: Commit rutas**

```bash
git add backend/src/routes/v1.0-listados.js backend/src/routes/admin.js
git commit -m "feat(routes): agregar rutas v1.0 para listados por zona"
```

---

### Task 5: Crear servicio frontend listadosService

**Files:**
- Create: `frontend/src/services/listadosService.js`

- [ ] **Step 1: Create servicio**

```javascript
import api from './api';

const listadosService = {
  getPorZona: async (zonaId, search = '', page = 1, limit = 10) => {
    const { data } = await api.get(`/v1.0/listados/por-zona/${zonaId}`, {
      params: { search, page, limit },
    });
    return data;
  },
};

export default listadosService;
```

- [ ] **Step 2: Commit servicio**

```bash
git add frontend/src/services/listadosService.js
git commit -m "feat(services): crear listadosService con getPorZona"
```

---

### Task 6: Crear página ListadosPage

**Files:**
- Create: `frontend/src/pages/ListadosPage/ListadosPage.jsx`

- [ ] **Step 1: Create componente principal**

```javascript
import React, { useState, useEffect } from 'react';
import zonaService from '../../services/zonaService';
import listadosService from '../../services/listadosService';
import ListadoZona from './components/ListadoZona';
import './ListadosPage.scss';

function ListadosPage() {
  const [zonas, setZonas] = useState([]);
  const [selectedZona, setSelectedZona] = useState(null);
  const [listado, setListado] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar zonas al montar
  useEffect(() => {
    loadZonas();
  }, []);

  const loadZonas = async () => {
    try {
      const result = await zonaService.getAll();
      setZonas(result.data || []);
    } catch (err) {
      console.error('Error loading zonas:', err);
      setError('Error al cargar zonas');
    }
  };

  // Cargar listado cuando cambia zona, búsqueda o página
  useEffect(() => {
    if (selectedZona) {
      loadListado();
    }
  }, [selectedZona, search, page]);

  const loadListado = async () => {
    if (!selectedZona) return;
    
    try {
      setLoading(true);
      const result = await listadosService.getPorZona(
        selectedZona,
        search,
        page,
        10
      );
      setListado(result);
      setError(null);
    } catch (err) {
      console.error('Error loading listado:', err);
      setError('Error al cargar listado');
    } finally {
      setLoading(false);
    }
  };

  const handleZonaChange = (e) => {
    setSelectedZona(parseInt(e.target.value) || null);
    setPage(1);
    setSearch('');
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="listados-page">
      <h1>Listados por Zona</h1>

      <div className="listados-page__filters">
        <div className="listados-page__filter-group">
          <label htmlFor="zona-select">Seleccionar Zona:</label>
          <select
            id="zona-select"
            value={selectedZona || ''}
            onChange={handleZonaChange}
          >
            <option value="">-- Seleccionar zona --</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombre} ({zona.provincia?.nombre})
              </option>
            ))}
          </select>
        </div>

        {selectedZona && (
          <div className="listados-page__filter-group">
            <label htmlFor="search-input">Buscar:</label>
            <input
              id="search-input"
              type="text"
              placeholder="Plan #, Tipo, ..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        )}
      </div>

      {error && <div className="listados-page__error">{error}</div>}

      {selectedZona && (
        <ListadoZona
          listado={listado}
          loading={loading}
          onPageChange={handlePageChange}
          currentPage={page}
        />
      )}
    </div>
  );
}

export default ListadosPage;
```

- [ ] **Step 2: Commit página principal**

```bash
git add frontend/src/pages/ListadosPage/ListadosPage.jsx
git commit -m "feat(pages): crear ListadosPage para listados por zona"
```

---

### Task 7: Crear componente ListadoZona

**Files:**
- Create: `frontend/src/pages/ListadosPage/components/ListadoZona.jsx`

- [ ] **Step 1: Create componente tabla**

```javascript
import React from 'react';
import '../ListadosPage.scss';

function ListadoZona({ listado, loading, onPageChange, currentPage }) {
  if (!listado) return null;

  const { data: planes, pagination } = listado;

  if (loading) {
    return <div className="listado-zona__loading">Cargando...</div>;
  }

  if (!planes || planes.length === 0) {
    return <div className="listado-zona__empty">Sin planes en esta zona</div>;
  }

  return (
    <div className="listado-zona">
      <div className="listado-zona__table-container">
        <table className="listado-zona__table">
          <thead>
            <tr>
              <th>Plan #</th>
              <th>Tipo</th>
              <th>Cuota (ARS)</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Fecha Nac.</th>
              <th>Edad</th>
              <th>DNI</th>
            </tr>
          </thead>
          <tbody>
            {planes.map((plan) => (
              <React.Fragment key={plan.plan_numero}>
                {plan.PlanIntegrantes && plan.PlanIntegrantes.length > 0 ? (
                  plan.PlanIntegrantes.map((integrante, idx) => (
                    <tr key={`${plan.plan_numero}-${integrante.id}`}>
                      {idx === 0 && (
                        <>
                          <td rowSpan={plan.PlanIntegrantes.length}>
                            {plan.plan_numero}
                          </td>
                          <td rowSpan={plan.PlanIntegrantes.length}>
                            {plan.TipoDePlan?.tipo_plan_nombre}
                          </td>
                          <td rowSpan={plan.PlanIntegrantes.length}>
                            ${plan.valor_cuota}
                          </td>
                        </>
                      )}
                      <td>{integrante.Persona?.nombre || '-'}</td>
                      <td>{integrante.Persona?.apellido || '-'}</td>
                      <td>
                        {integrante.Persona?.fecha_nacimiento
                          ? new Date(
                              integrante.Persona.fecha_nacimiento
                            ).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {integrante.Persona?.fecha_nacimiento
                          ? Math.floor(
                              (new Date() -
                                new Date(
                                  integrante.Persona.fecha_nacimiento
                                )) /
                                (365.25 * 24 * 60 * 60 * 1000)
                            )
                          : '-'}
                      </td>
                      <td>{integrante.Persona?.numero_documento || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>{plan.plan_numero}</td>
                    <td>{plan.TipoDePlan?.tipo_plan_nombre}</td>
                    <td>${plan.valor_cuota}</td>
                    <td colSpan="5">Sin afiliados</td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="listado-zona__pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>
          <span>
            Página {currentPage} de {pagination.pages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

export default ListadoZona;
```

- [ ] **Step 2: Commit componente**

```bash
git add frontend/src/pages/ListadosPage/components/ListadoZona.jsx
git commit -m "feat(components): crear ListadoZona tabla para mostrar planes y afiliados"
```

---

### Task 8: Crear estilos ListadosPage

**Files:**
- Create: `frontend/src/pages/ListadosPage/ListadosPage.scss`

- [ ] **Step 1: Create estilos**

```scss
.listados-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
  }
}

.listados-page__filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.listados-page__filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 250px;

  label {
    font-size: 14px;
    font-weight: 500;
  }

  select,
  input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
  }
}

.listados-page__error {
  padding: 15px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.listado-zona {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.listado-zona__loading {
  padding: 40px;
  text-align: center;
  color: #999;
}

.listado-zona__empty {
  padding: 40px;
  text-align: center;
  color: #999;
}

.listado-zona__table-container {
  overflow-x: auto;
}

.listado-zona__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background-color: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
  }

  th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #dee2e6;
  }

  tbody tr:hover {
    background-color: #f8f9fa;
  }
}

.listado-zona__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid #dee2e6;

  button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;

    &:hover:not(:disabled) {
      background-color: #f8f9fa;
      border-color: #007bff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  span {
    font-size: 14px;
    color: #666;
  }
}
```

- [ ] **Step 2: Commit estilos**

```bash
git add frontend/src/pages/ListadosPage/ListadosPage.scss
git commit -m "style(pages): crear estilos para ListadosPage"
```

---

### Task 9: Integrar ListadosPage en DashboardPage

**Files:**
- Modify: `frontend/src/pages/DashboardPage/DashboardPage.jsx:1-100`

- [ ] **Step 1: Importar ListadosPage**

Agregar en imports al inicio del archivo:

```javascript
import ListadosPage from '../ListadosPage/ListadosPage';
```

- [ ] **Step 2: Agregar "Listados" al sidebar**

En el array de secciones del sidebar (buscar donde están "Planes", "Búsqueda", etc.), agregar:

```javascript
{
  id: 'listados',
  label: 'Listados',
  icon: '📊',
}
```

- [ ] **Step 3: Agregar condición de renderizado**

En la sección de renderizado condicional (buscar donde hace activeSection ===), agregar:

```javascript
{activeSection === 'listados' && <ListadosPage />}
```

- [ ] **Step 4: Commit integración**

```bash
git add frontend/src/pages/DashboardPage/DashboardPage.jsx
git commit -m "feat(dashboard): agregar sección Listados al sidebar"
```

---

## BACKLOG-038: Edición de Afiliados con Drag & Drop

### Task 10: Instalar librería react-beautiful-dnd

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Instalar dependencia**

```bash
cd frontend
npm install react-beautiful-dnd
npm install --save-dev @types/react-beautiful-dnd
```

- [ ] **Step 2: Verify instalación**

```bash
npm list react-beautiful-dnd
```

Expected output: `react-beautiful-dnd@13.1.1` (o versión similar)

- [ ] **Step 3: Commit dependencia**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(deps): agregar react-beautiful-dnd para drag & drop"
```

---

### Task 11: Actualizar planIntegrantesController para reorder

**Files:**
- Modify: `backend/src/controllers/v1.0/planIntegrantesController.js:70-120`

- [ ] **Step 1: Agregar método reorder**

Agregar al final del archivo, antes de `module.exports`:

```javascript
const reorder = async (req, res) => {
  const { planNumero, integrantes } = req.body;

  if (!planNumero || !Array.isArray(integrantes)) {
    return res.status(400).json({
      success: false,
      message: 'planNumero e integrantes array son requeridos',
    });
  }

  const transaction = await db.sequelize.transaction();

  try {
    // Actualizar orden y estado para cada integrante
    for (const integrante of integrantes) {
      await db.PlanIntegrante.update(
        {
          orden: integrante.orden,
          estado: integrante.estado || 'Activo',
        },
        {
          where: { id: integrante.id, plan_numero: planNumero },
          transaction,
        }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Integrantes reordenados exitosamente',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error reordering integrantes:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

- [ ] **Step 2: Actualizar exports**

Cambiar `module.exports` al final para incluir reorder:

```javascript
module.exports = { crear, actualizar, eliminar, obtenerPorPlan, reorder };
```

- [ ] **Step 3: Actualizar método actualizar para aceptar estado**

En el método `actualizar`, cambiar:

```javascript
const actualizar = async (req, res) => {
  const { id } = req.params;
  const { rol, estado } = req.body;
  // ... resto del código
  const updateData = {};
  if (rol) updateData.rol = rol;
  if (estado) updateData.estado = estado;

  await integrante.update(updateData);
  // ...
};
```

- [ ] **Step 4: Commit actualizaciones**

```bash
git add backend/src/controllers/v1.0/planIntegrantesController.js
git commit -m "feat(controllers): agregar método reorder y soporte para estado"
```

---

### Task 12: Agregar ruta reorder

**Files:**
- Modify: `backend/src/routes/v1.0-plan-integrantes.js:1-20`

- [ ] **Step 1: Agregar ruta POST reorder**

En el archivo, agregar después de la ruta delete:

```javascript
router.post('/reorder', verifyToken, requireAdmin, controller.reorder);
```

El archivo debe quedar así:

```javascript
const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/v1.0/planIntegrantesController');

const router = express.Router();

router.get('/plan/:planNumero', verifyToken, controller.obtenerPorPlan);
router.post('/', verifyToken, requireAdmin, controller.crear);
router.put('/:id', verifyToken, requireAdmin, controller.actualizar);
router.delete('/:id', verifyToken, requireAdmin, controller.eliminar);
router.post('/reorder', verifyToken, requireAdmin, controller.reorder);

module.exports = router;
```

- [ ] **Step 2: Commit ruta**

```bash
git add backend/src/routes/v1.0-plan-integrantes.js
git commit -m "feat(routes): agregar ruta POST /reorder para plan-integrantes"
```

---

### Task 13: Actualizar planesIntegrantesService para reorder

**Files:**
- Modify: `frontend/src/services/planesIntegrantesService.js:40-60`

- [ ] **Step 1: Agregar método reorder**

Agregar al servicio, dentro del objeto:

```javascript
  // Reordenar integrantes de un plan
  reorder: async (planNumero, integrantes) => {
    const { data } = await api.post('/v1.0/plan-integrantes/reorder', {
      planNumero,
      integrantes: integrantes.map((int, idx) => ({
        id: int.id,
        orden: idx,
        estado: int.estado,
      })),
    });
    return data;
  },
```

- [ ] **Step 2: Commit servicio**

```bash
git add frontend/src/services/planesIntegrantesService.js
git commit -m "feat(services): agregar método reorder a planesIntegrantesService"
```

---

### Task 14: Actualizar PlanV1Modal para drag & drop (Parte 1)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx:1-30`

- [ ] **Step 1: Importar react-beautiful-dnd**

Al inicio del archivo, agregar imports:

```javascript
import {
  DragDropContext,
  Droppable,
  Draggable,
} from 'react-beautiful-dnd';
```

- [ ] **Step 2: Commit imports**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx
git commit -m "feat(modal): agregar imports de react-beautiful-dnd"
```

---

### Task 15: Actualizar PlanV1Modal para drag & drop (Parte 2)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx:550-650`

- [ ] **Step 1: Agregar manejadores drag & drop**

Agregar nuevos métodos en el componente, después de otros manejadores:

```javascript
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Reordenar integrantes
    const newIntegrantes = Array.from(form.integrantes);
    const [reordered] = newIntegrantes.splice(source.index, 1);
    newIntegrantes.splice(destination.index, 0, reordered);

    handleFieldChange('integrantes', newIntegrantes);
  };

  const handleEstadoChange = (personaId, newEstado) => {
    const updated = form.integrantes.map((i) =>
      i.persona_id === personaId ? { ...i, estado: newEstado } : i
    );
    handleFieldChange('integrantes', updated);
  };
```

- [ ] **Step 2: Commit manejadores**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx
git commit -m "feat(modal): agregar manejadores handleDragEnd y handleEstadoChange"
```

---

### Task 16: Actualizar tabla integrantes con drag & drop

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx:560-630`

- [ ] **Step 1: Reemplazar tabla con DragDropContext**

Encontrar la tabla de integrantes (buscar `<table`) y reemplazarla completamente:

```javascript
              {/* Integrantes Table */}
              <div className="plan-v1-modal__section">
                <h3>Afiliados ({form.integrantes.length})</h3>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="integrantes-list">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="plan-v1-modal__integrantes-list"
                      >
                        <table className="plan-v1-modal__table">
                          <thead>
                            <tr>
                              <th style={{ width: '40px' }}>⋮</th>
                              <th>Nombre</th>
                              <th>Apellido</th>
                              <th>Doc.</th>
                              <th>Rol</th>
                              <th>Estado</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.integrantes.map((integrante, index) => (
                              <Draggable
                                key={integrante.persona_id}
                                draggableId={`integrante-${integrante.persona_id}`}
                                index={index}
                                isDragDisabled={index === 0 && integrante.rol === 'titular'}
                              >
                                {(provided, snapshot) => (
                                  <tr
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      backgroundColor: snapshot.isDragging
                                        ? '#f0f0f0'
                                        : 'white',
                                    }}
                                  >
                                    <td {...provided.dragHandleProps}>⋮</td>
                                    <td>{integrante.persona?.nombre}</td>
                                    <td>{integrante.persona?.apellido}</td>
                                    <td>{integrante.persona?.numero_documento}</td>
                                    <td>
                                      <select
                                        value={integrante.rol}
                                        onChange={(e) =>
                                          handleRolChange(
                                            integrante.persona_id,
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="titular">Titular</option>
                                        <option value="adherente">Adherente</option>
                                      </select>
                                    </td>
                                    <td>
                                      <select
                                        value={integrante.estado || 'Activo'}
                                        onChange={(e) =>
                                          handleEstadoChange(
                                            integrante.persona_id,
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="Activo">Activo</option>
                                        <option value="Suspendido">
                                          Suspendido
                                        </option>
                                        <option value="Eliminado">Eliminado</option>
                                        <option value="Promocion">
                                          Promoción
                                        </option>
                                      </select>
                                    </td>
                                    <td>
                                      <ActionButton
                                        variant="icon"
                                        icon="✎"
                                        onClick={() =>
                                          handleIntegranteEdit(
                                            integrante.persona_id
                                          )
                                        }
                                      />
                                      <ActionButton
                                        variant="icon"
                                        icon="✕"
                                        onClick={() =>
                                          removeIntegrante(integrante.persona_id)
                                        }
                                      />
                                    </td>
                                  </tr>
                                )}
                              </Draggable>
                            ))}
                          </tbody>
                        </table>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
```

- [ ] **Step 2: Commit tabla actualizada**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx
git commit -m "feat(modal): reemplazar tabla integrantes con DragDropContext y columna estado"
```

---

### Task 17: Actualizar handleGuardar para persistir reorder y estado

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx:200-270`

- [ ] **Step 1: Agregar reorder después de guardar plan**

En el método `handleGuardar`, después de crear/actualizar el plan y sus integrantes, agregar:

```javascript
        // Reorder integrantes if in edit mode
        if (mode === 'editar' && form.integrantes.length > 0) {
          try {
            await planesIntegrantesService.reorder(
              planData.plan_numero,
              form.integrantes
            );
          } catch (err) {
            console.warn('Error reordering integrantes:', err);
            // No fallar el guardado si el reorder falla
          }
        }
```

- [ ] **Step 2: Commit guardado actualizado**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx
git commit -m "feat(modal): llamar reorder al guardar plan en modo editar"
```

---

### Task 18: Agregar estilos para drag & drop

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss:100-150`

- [ ] **Step 1: Agregar estilos drag & drop**

```scss
.plan-v1-modal__integrantes-list {
  margin: 15px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.plan-v1-modal__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background-color: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
  }

  th {
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    border-right: 1px solid #dee2e6;

    &:last-child {
      border-right: none;
    }
  }

  td {
    padding: 10px 12px;
    border-right: 1px solid #dee2e6;
    border-bottom: 1px solid #dee2e6;

    &:last-child {
      border-right: none;
    }

    select {
      width: 100%;
      padding: 6px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 13px;

      &:focus {
        outline: none;
        border-color: #007bff;
      }
    }
  }

  tbody tr {
    &:hover {
      background-color: #f8f9fa;
    }
  }
}

.plan-v1-modal__section {
  margin-top: 20px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
  }
}
```

- [ ] **Step 2: Commit estilos**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss
git commit -m "style(modal): agregar estilos para tabla drag & drop"
```

---

### Task 19: Ejecutar migración en desarrollo

**Files:**
- No files modified

- [ ] **Step 1: Verificar migración existe**

```bash
ls -la backend/src/migrations/versions/2.0.17_plan_integrantes_estado_orden/
```

Expected: Dos archivos (upgrade.sql, downgrade.sql)

- [ ] **Step 2: Documentación para usuario**

Crear nota en CLAUDE.md sobre cómo ejecutar:

```
Para ejecutar la migración:
1. Backend: npm run db:migrate:up
2. Verificar en DB: SELECT * FROM plan_integrantes LIMIT 1;
```

- [ ] **Step 3: Commit documentación**

```bash
git add docs/DEPLOYMENT.md  # Si existe, o crear
git commit -m "docs: agregar instrucciones para migración 2.0.17"
```

---

## Testing Checklist

### BACKLOG-037 Testing
- [ ] Listados page carga sin errores
- [ ] Dropdown de zonas muestra todas las zonas
- [ ] Búsqueda filtra por número de plan
- [ ] Búsqueda filtra por tipo de plan
- [ ] Paginación navega correctamente
- [ ] Tabla muestra planes y afiliados de la zona correcta
- [ ] Edad se calcula correctamente

### BACKLOG-038 Testing
- [ ] Drag & drop reordena integrantes
- [ ] Cambio de estado persiste en BD
- [ ] Rol se puede cambiar
- [ ] Guardar plan persiste orden y estado
- [ ] Reload muestra orden y estado guardados
- [ ] Primer integrante no se puede arrastrar si es titular

---

## Commits Summary

**Total commits:** 13

1. Migración v2.0.17 (1 commit)
2. Modelo PlanIntegrante (1 commit)
3. Controlador listados (1 commit)
4. Rutas listados (1 commit)
5. Servicio listados (1 commit)
6. Página ListadosPage (1 commit)
7. Componente ListadoZona (1 commit)
8. Estilos ListadosPage (1 commit)
9. Integración DashboardPage (1 commit)
10. Instalación react-beautiful-dnd (1 commit)
11. Controlador reorder (1 commit)
12. Ruta reorder (1 commit)
13. Servicio reorder (1 commit)
14. Modal imports (1 commit)
15. Modal handlers (1 commit)
16. Modal tabla drag & drop (1 commit)
17. Modal reorder al guardar (1 commit)
18. Modal estilos (1 commit)

---

## Plan complete y listo para ejecución

Dos opciones para proceder:

**1. Subagent-Driven (Recomendado)** - Cada tarea en un subagent fresco, reviews automáticas, iteración rápida

**2. Inline Execution** - Ejecutar en esta sesión, commits batch con checkpoints

¿Cuál prefieres?
