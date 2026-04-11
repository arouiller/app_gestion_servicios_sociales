# Afiliados y Grupos Familiares — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rol filter to afiliado list, inline beneficiary management when editing a titular, a confirmation-gated desvincular flow that promotes the beneficiario to titular with a new group, and a full membership history for grupos familiares visible to any logged-in user.

**Architecture:** New SQL migration adds `historial_grupo_familiar` table. A new Sequelize model and controller handle history reads. Backend controllers are modified to log history on create/desvincular. Frontend adds filter, a `SeccionBeneficiarios` sub-component inside the edit form, a new `ModalConfirmarDesvinculacion`, and a collapsible history section in both the admin `GrupoModal` and the non-admin `PerfilAfiliado`.

**Tech Stack:** Node.js/Express, Sequelize (no associations — manual joins follow existing pattern), React, SCSS BEM.

---

## File Map

**New files:**
- `backend/src/migrations/versions/1.0.3_historial_grupos/upgrade.sql`
- `backend/src/migrations/versions/1.0.3_historial_grupos/downgrade.sql`
- `backend/src/models/HistorialGrupoFamiliar.js`
- `backend/src/controllers/historialController.js`

**Modified files:**
- `backend/src/controllers/afiliadosController.js` — add `rol` filter in `listar`; add historial logging in `crear`
- `backend/src/controllers/gruposController.js` — add `desvincular` action
- `backend/src/routes/grupos.js` — add two new routes
- `frontend/src/services/afiliadosService.js` — add `desvincularBeneficiario`, `obtenerHistorialGrupo`; add `rol` param to `listar`
- `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx` — filtro rol, SeccionBeneficiarios, ModalConfirmarDesvinculacion, GrupoModal historial, PerfilAfiliado historial
- `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss` — new classes

---

## Task 1: DB Migration — historial_grupo_familiar

**Files:**
- Create: `backend/src/migrations/versions/1.0.3_historial_grupos/upgrade.sql`
- Create: `backend/src/migrations/versions/1.0.3_historial_grupos/downgrade.sql`

- [ ] **Step 1: Create the upgrade migration**

Create `backend/src/migrations/versions/1.0.3_historial_grupos/upgrade.sql`:

```sql
-- Migración 1.0.3: Historial de membresía de grupos familiares

CREATE TABLE IF NOT EXISTS historial_grupo_familiar (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id      INT NOT NULL,
  afiliado_id   INT NOT NULL,
  accion        ENUM('ingreso','baja') NOT NULL,
  usuario_id    INT NOT NULL,
  notas         VARCHAR(255) NULL,
  fecha         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hgf_grupo    FOREIGN KEY (grupo_id)    REFERENCES grupos_familiares(id) ON DELETE CASCADE,
  CONSTRAINT fk_hgf_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id)         ON DELETE CASCADE,
  CONSTRAINT fk_hgf_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)           ON DELETE CASCADE,
  INDEX idx_hgf_grupo    (grupo_id),
  INDEX idx_hgf_afiliado (afiliado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Create the downgrade migration**

Create `backend/src/migrations/versions/1.0.3_historial_grupos/downgrade.sql`:

```sql
-- Rollback 1.0.3
DROP TABLE IF EXISTS historial_grupo_familiar;
```

- [ ] **Step 3: Run the migration**

```bash
cd backend && npm run db:migrate:up
```

Expected output: migration `1.0.3_historial_grupos` listed as applied. Verify in DB that table `historial_grupo_familiar` exists with the expected columns.

- [ ] **Step 4: Commit**

```bash
git add backend/src/migrations/versions/1.0.3_historial_grupos/
git commit -m "feat: migración 1.0.3 - tabla historial_grupo_familiar"
```

---

## Task 2: Sequelize Model — HistorialGrupoFamiliar

**Files:**
- Create: `backend/src/models/HistorialGrupoFamiliar.js`

- [ ] **Step 1: Create the model**

Create `backend/src/models/HistorialGrupoFamiliar.js`:

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialGrupoFamiliar = sequelize.define('historial_grupo_familiar', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  grupo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  afiliado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  accion: {
    type: DataTypes.ENUM('ingreso', 'baja'),
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notas: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'historial_grupo_familiar',
});

module.exports = HistorialGrupoFamiliar;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/models/HistorialGrupoFamiliar.js
git commit -m "feat: modelo HistorialGrupoFamiliar"
```

---

## Task 3: Backend — filtro por rol en listar afiliados

**Files:**
- Modify: `backend/src/controllers/afiliadosController.js` (function `listar`, lines 7–48)

- [ ] **Step 1: Add rol to the where clause in `listar`**

In `afiliadosController.js`, replace the `listar` function's `where` block. The current code is:

```js
  const where = {};
  if (estado) where.estado = estado;
  if (search) {
```

Replace with:

```js
  const where = {};
  if (estado) where.estado = estado;
  if (req.query.rol) where.rol = req.query.rol;
  if (search) {
```

- [ ] **Step 2: Verify manually**

Start the backend (`npm run dev` in `backend/`) and call:
```
GET /api/afiliados?rol=titular
GET /api/afiliados?rol=beneficiario
GET /api/afiliados
```
Each should return only the matching records (or all for the third).

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/afiliadosController.js
git commit -m "feat: filtro por rol en listado de afiliados"
```

---

## Task 4: Backend — logging de historial al crear afiliado

**Files:**
- Modify: `backend/src/controllers/afiliadosController.js` (function `crear`)

- [ ] **Step 1: Import HistorialGrupoFamiliar at the top of the file**

In `afiliadosController.js`, the current imports are:
```js
const { Op } = require('sequelize');
const Afiliado = require('../models/Afiliado');
const GrupoFamiliar = require('../models/GrupoFamiliar');
```

Add:
```js
const { Op } = require('sequelize');
const Afiliado = require('../models/Afiliado');
const GrupoFamiliar = require('../models/GrupoFamiliar');
const HistorialGrupoFamiliar = require('../models/HistorialGrupoFamiliar');
```

- [ ] **Step 2: Log historial entry after creating the afiliado**

In `crear`, find the final `return res.status(201)` block. Insert the historial log before it:

```js
  // Registrar ingreso en historial
  await HistorialGrupoFamiliar.create({
    grupo_id: grupo_familiar_id,
    afiliado_id: afiliado.id,
    accion: 'ingreso',
    usuario_id: req.userId,
  });

  return res.status(201).json({
```

- [ ] **Step 3: Verify manually**

Create a titular via POST /api/afiliados and confirm a row appears in `historial_grupo_familiar` with `accion = 'ingreso'`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/afiliadosController.js
git commit -m "feat: registrar historial al crear afiliado"
```

---

## Task 5: Backend — historialController

**Files:**
- Create: `backend/src/controllers/historialController.js`

- [ ] **Step 1: Create the controller**

Create `backend/src/controllers/historialController.js`:

```js
const Afiliado = require('../models/Afiliado');
const GrupoFamiliar = require('../models/GrupoFamiliar');
const HistorialGrupoFamiliar = require('../models/HistorialGrupoFamiliar');
const Usuario = require('../models/Usuario');

// GET /api/grupos-familiares/:id/historial
// Accesible a cualquier usuario autenticado.
// No-admin: solo puede ver el historial de su propio grupo.

const listarHistorial = async (req, res) => {
  const grupoId = parseInt(req.params.id, 10);

  const grupo = await GrupoFamiliar.findByPk(grupoId);
  if (!grupo) {
    return res.status(404).json({ success: false, message: 'Grupo familiar no encontrado' });
  }

  // Verificar acceso para no-admin
  if (req.userRole !== 'admin') {
    const miAfiliado = await Afiliado.findOne({ where: { usuario_id: req.userId } });
    if (!miAfiliado || miAfiliado.grupo_familiar_id !== grupoId) {
      return res.status(403).json({
        success: false,
        message: 'No tenés acceso al historial de este grupo',
      });
    }
  }

  const entradas = await HistorialGrupoFamiliar.findAll({
    where: { grupo_id: grupoId },
    order: [['fecha', 'DESC']],
  });

  if (entradas.length === 0) {
    return res.json({ success: true, data: [] });
  }

  // Cargar afiliados y usuarios referenciados
  const afiliadoIds = [...new Set(entradas.map((e) => e.afiliado_id))];
  const usuarioIds  = [...new Set(entradas.map((e) => e.usuario_id))];

  const [afiliados, usuarios] = await Promise.all([
    Afiliado.findAll({
      where: { id: afiliadoIds },
      attributes: ['id', 'nombre', 'apellido'],
    }),
    Usuario.findAll({
      where: { id: usuarioIds },
      attributes: ['id', 'nombre', 'apellido'],
    }),
  ]);

  const afiliadoMap = Object.fromEntries(afiliados.map((a) => [a.id, a.toJSON()]));
  const usuarioMap  = Object.fromEntries(usuarios.map((u) => [u.id, u.toJSON()]));

  const data = entradas.map((e) => ({
    id: e.id,
    accion: e.accion,
    fecha: e.fecha,
    notas: e.notas,
    afiliado: afiliadoMap[e.afiliado_id] || null,
    ejecutado_por: usuarioMap[e.usuario_id] || null,
  }));

  return res.json({ success: true, data });
};

module.exports = { listarHistorial };
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/historialController.js
git commit -m "feat: historialController - listado de historial de grupo familiar"
```

---

## Task 6: Backend — desvincular beneficiario en gruposController

**Files:**
- Modify: `backend/src/controllers/gruposController.js`

- [ ] **Step 1: Add imports at the top**

Current imports in `gruposController.js`:
```js
const GrupoFamiliar = require('../models/GrupoFamiliar');
const Afiliado = require('../models/Afiliado');
```

Replace with:
```js
const sequelize = require('../config/database');
const GrupoFamiliar = require('../models/GrupoFamiliar');
const Afiliado = require('../models/Afiliado');
const HistorialGrupoFamiliar = require('../models/HistorialGrupoFamiliar');
```

- [ ] **Step 2: Add the `desvincular` function before `module.exports`**

Insert before the `module.exports` line:

```js
// ── POST /api/grupos-familiares/:id/desvincular/:afiliadoId  (admin) ─────────

const desvincular = async (req, res) => {
  const grupoId    = parseInt(req.params.id, 10);
  const afiliadoId = parseInt(req.params.afiliadoId, 10);

  const grupo = await GrupoFamiliar.findByPk(grupoId);
  if (!grupo) {
    return res.status(404).json({ success: false, message: 'Grupo familiar no encontrado' });
  }

  const afiliado = await Afiliado.findByPk(afiliadoId);
  if (!afiliado) {
    return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
  }
  if (afiliado.grupo_familiar_id !== grupoId) {
    return res.status(400).json({ success: false, message: 'El afiliado no pertenece a este grupo' });
  }
  if (afiliado.rol !== 'beneficiario') {
    return res.status(400).json({ success: false, message: 'Solo se puede desvincular a un beneficiario' });
  }

  await sequelize.transaction(async (t) => {
    // Crear nuevo grupo para el ex-beneficiario
    const nuevoGrupo = await GrupoFamiliar.create(
      { nombre: `Familia ${afiliado.apellido} ${afiliado.nombre}` },
      { transaction: t },
    );

    // Actualizar el afiliado: promover a titular del nuevo grupo
    await afiliado.update(
      { rol: 'titular', grupo_familiar_id: nuevoGrupo.id },
      { transaction: t },
    );

    // Registrar baja en el grupo original
    await HistorialGrupoFamiliar.create(
      {
        grupo_id:   grupoId,
        afiliado_id: afiliadoId,
        accion:     'baja',
        usuario_id:  req.userId,
      },
      { transaction: t },
    );

    // Registrar ingreso en el nuevo grupo
    await HistorialGrupoFamiliar.create(
      {
        grupo_id:   nuevoGrupo.id,
        afiliado_id: afiliadoId,
        accion:     'ingreso',
        usuario_id:  req.userId,
      },
      { transaction: t },
    );
  });

  // Refrescar datos para la respuesta
  await afiliado.reload();

  return res.json({
    success: true,
    message: `${afiliado.nombre} ${afiliado.apellido} fue desvinculado y promovido a titular`,
    data: afiliado,
  });
};
```

- [ ] **Step 3: Export the new function**

Change the `module.exports` line from:
```js
module.exports = { listar, obtener, actualizar };
```
to:
```js
module.exports = { listar, obtener, actualizar, desvincular };
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/gruposController.js
git commit -m "feat: endpoint desvincular beneficiario con creación de grupo y logging"
```

---

## Task 7: Backend — nuevas rutas en grupos.js

**Files:**
- Modify: `backend/src/routes/grupos.js`

- [ ] **Step 1: Add historialController import and new routes**

The current `grupos.js` is:
```js
const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/gruposController');

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.put('/:id', controller.actualizar);

module.exports = router;
```

Replace entirely with:

```js
const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/gruposController');
const historialController = require('../controllers/historialController');

const router = express.Router();

// Rutas accesibles a cualquier usuario autenticado
router.get('/:id/historial', verifyToken, historialController.listarHistorial);

// Rutas solo admin
router.use(verifyToken, requireAdmin);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.put('/:id', controller.actualizar);
router.post('/:id/desvincular/:afiliadoId', controller.desvincular);

module.exports = router;
```

> Note: `/:id/historial` is declared BEFORE `router.use(verifyToken, requireAdmin)` so it only requires `verifyToken` (not admin). All routes below `router.use(...)` require both.

- [ ] **Step 2: Verify routes manually**

With backend running, test:
- `GET /api/grupos-familiares/1/historial` with a non-admin token → 200 or 403 depending on membership
- `POST /api/grupos-familiares/1/desvincular/2` with admin token → desvinculates afiliado 2 from group 1

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/grupos.js
git commit -m "feat: rutas historial y desvincular en grupos familiares"
```

---

## Task 8: Frontend — nuevos métodos en afiliadosService

**Files:**
- Modify: `frontend/src/services/afiliadosService.js`

- [ ] **Step 1: Add `rol` param to `listar` and add two new methods**

The current `afiliadosService.js` ends with `actualizarGrupo`. Add the two new methods before the closing `};`:

```js
  /**
   * Desvincula un beneficiario de su grupo (admin).
   * El beneficiario pasa a ser titular de un nuevo grupo.
   */
  desvincularBeneficiario: async (grupoId, afiliadoId) => {
    const { data } = await api.post(`/grupos-familiares/${grupoId}/desvincular/${afiliadoId}`);
    return data;
  },

  /**
   * Historial de membresía de un grupo familiar.
   * Accesible a cualquier usuario autenticado.
   */
  obtenerHistorialGrupo: async (grupoId) => {
    const { data } = await api.get(`/grupos-familiares/${grupoId}/historial`);
    return data.data;
  },
```

The `listar` method already passes `params` as-is, so adding `rol` from the caller will work without changes to the service.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/afiliadosService.js
git commit -m "feat: desvincularBeneficiario y obtenerHistorialGrupo en afiliadosService"
```

---

## Task 9: Frontend — filtro por rol en TablaAfiliados

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx`

- [ ] **Step 1: Add `rol` to the initial `filtros` state**

Find:
```js
  const [filtros, setFiltros] = useState({ search: '', estado: '' });
```

Replace with:
```js
  const [filtros, setFiltros] = useState({ search: '', estado: '', rol: '' });
```

- [ ] **Step 2: Add the rol select to `TablaAfiliados`**

In the `TablaAfiliados` component, find the `<div className="gestion-afiliados__filtros">` block. After the existing `estado` select, add:

```jsx
        <select
          className="gestion-afiliados__filtro-select"
          value={filtros.rol}
          onChange={(e) => onFiltroChange('rol', e.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="titular">Titular</option>
          <option value="beneficiario">Beneficiario</option>
        </select>
```

- [ ] **Step 3: Verify**

With the app running, the afiliados table should show a third filter dropdown. Selecting "Titular" should reload and show only titulares; "Beneficiario" only beneficiarios.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx
git commit -m "feat: filtro por rol en listado de afiliados"
```

---

## Task 10: Frontend — SeccionBeneficiarios y ModalConfirmarDesvinculacion

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx`
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss`

- [ ] **Step 1: Add `SeccionBeneficiarios` component**

Insert this new component before the `GrupoModal` function definition in `GestionAfiliados.jsx`:

```jsx
// ── Sección de beneficiarios (visible al editar un titular) ──────────────────

function ModalConfirmarDesvinculacion({ afiliado, grupoId, onConfirmar, onCancelar, cargando }) {
  return (
    <div className="gestion-afiliados__modal-overlay">
      <div className="gestion-afiliados__modal">
        <h3 className="gestion-afiliados__modal-title">Confirmar desvinculación</h3>
        <p>
          ¿Confirmás que querés desvincular a{' '}
          <strong>{afiliado.nombre} {afiliado.apellido}</strong> del grupo?
          Pasará a ser titular de su propio grupo{' '}
          <strong>"Familia {afiliado.apellido} {afiliado.nombre}"</strong>.
        </p>
        <div className="gestion-afiliados__modal-actions">
          <button
            className="gestion-afiliados__btn gestion-afiliados__btn--danger"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Desvinculando...' : 'Confirmar desvinculación'}
          </button>
          <button
            className="gestion-afiliados__btn gestion-afiliados__btn--secondary"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function SeccionBeneficiarios({ grupoId, onRefresh }) {
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desvinculando, setDesvinculando] = useState(null); // afiliado a desvincular
  const [actionLoading, setActionLoading] = useState(false);
  const [mostrarFormBeneficiario, setMostrarFormBeneficiario] = useState(false);
  const [formCargando, setFormCargando] = useState(false);
  const [grupos, setGrupos] = useState([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const grupo = await afiliadosService.obtenerGrupo(grupoId);
      setMiembros((grupo.miembros || []).filter((m) => m.rol === 'beneficiario'));
    } catch {
      setError('Error al cargar los beneficiarios del grupo.');
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDesvincular = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await afiliadosService.desvincularBeneficiario(grupoId, desvinculando.id);
      setDesvinculando(null);
      await cargar();
      onRefresh();
    } catch {
      setError('Error al desvincular el beneficiario.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGuardarBeneficiario = async (payload) => {
    setFormCargando(true);
    setError(null);
    try {
      await afiliadosService.crear({ ...payload, rol: 'beneficiario', grupo_familiar_id: grupoId });
      setMostrarFormBeneficiario(false);
      await cargar();
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el beneficiario.');
    } finally {
      setFormCargando(false);
    }
  };

  return (
    <div className="gestion-afiliados__beneficiarios-seccion">
      <div className="gestion-afiliados__beneficiarios-header">
        <h4 className="gestion-afiliados__beneficiarios-titulo">Beneficiarios del grupo</h4>
        <button
          className="gestion-afiliados__btn gestion-afiliados__btn--primary"
          onClick={() => setMostrarFormBeneficiario(true)}
        >
          + Agregar beneficiario
        </button>
      </div>

      {error && <div className="gestion-afiliados__alert gestion-afiliados__alert--error">{error}</div>}

      {loading ? (
        <div className="gestion-afiliados__loading">Cargando beneficiarios...</div>
      ) : miembros.length === 0 ? (
        <p className="gestion-afiliados__empty">Este grupo no tiene beneficiarios.</p>
      ) : (
        <div className="gestion-afiliados__tabla-wrapper">
          <table className="gestion-afiliados__tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((m) => (
                <tr key={m.id}>
                  <td>{m.nombre} {m.apellido}</td>
                  <td>{m.tipo_documento} {m.numero_documento}</td>
                  <td>
                    <span className={`gestion-afiliados__estado gestion-afiliados__estado--${m.estado}`}>
                      {m.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="gestion-afiliados__btn-icon gestion-afiliados__btn-icon--delete"
                      onClick={() => setDesvinculando(m)}
                      title="Desvincular del grupo"
                    >
                      Desvincular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {desvinculando && (
        <ModalConfirmarDesvinculacion
          afiliado={desvinculando}
          grupoId={grupoId}
          onConfirmar={handleDesvincular}
          onCancelar={() => setDesvinculando(null)}
          cargando={actionLoading}
        />
      )}

      {mostrarFormBeneficiario && (
        <div className="gestion-afiliados__modal-overlay" onClick={(e) => e.target === e.currentTarget && setMostrarFormBeneficiario(false)}>
          <div className="gestion-afiliados__modal gestion-afiliados__modal--form">
            <div className="gestion-afiliados__modal-header">
              <h3 className="gestion-afiliados__modal-title">Nuevo beneficiario</h3>
              <button className="gestion-afiliados__modal-close" onClick={() => setMostrarFormBeneficiario(false)}>✕</button>
            </div>
            <FormAfiliado
              inicial={null}
              preset={{ rol: 'beneficiario', grupo_familiar_id: grupoId }}
              grupos={grupos}
              onGuardar={handleGuardarBeneficiario}
              onCancelar={() => setMostrarFormBeneficiario(false)}
              cargando={formCargando}
              rolFijo
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `FormAfiliado` to accept `rolFijo` prop**

In `FormAfiliado`, find the `rol` select:
```jsx
        <div className="gestion-afiliados__field">
          <label>Rol</label>
          <select name="rol" value={form.rol} onChange={handleChange} disabled={!!inicial}>
            <option value="titular">Titular</option>
            <option value="beneficiario">Beneficiario</option>
          </select>
        </div>
```

Replace with:
```jsx
        {!rolFijo && (
          <div className="gestion-afiliados__field">
            <label>Rol</label>
            <select name="rol" value={form.rol} onChange={handleChange} disabled={!!inicial}>
              <option value="titular">Titular</option>
              <option value="beneficiario">Beneficiario</option>
            </select>
          </div>
        )}
```

And update the function signature from:
```jsx
function FormAfiliado({ inicial, preset, grupos, onGuardar, onCancelar, cargando }) {
```
to:
```jsx
function FormAfiliado({ inicial, preset, grupos, onGuardar, onCancelar, cargando, rolFijo = false }) {
```

- [ ] **Step 3: Render `SeccionBeneficiarios` when editing a titular**

In the render section, find:
```jsx
      {(vista === 'crear' || vista === 'editar') && (
        <FormAfiliado
          inicial={afiliadoEditando}
          preset={formPreset}
          grupos={grupos}
          onGuardar={handleGuardar}
          onCancelar={handleCancelar}
          cargando={actionLoading}
        />
      )}
```

Replace with:
```jsx
      {(vista === 'crear' || vista === 'editar') && (
        <>
          <FormAfiliado
            inicial={afiliadoEditando}
            preset={formPreset}
            grupos={grupos}
            onGuardar={handleGuardar}
            onCancelar={handleCancelar}
            cargando={actionLoading}
          />
          {vista === 'editar' && afiliadoEditando?.rol === 'titular' && afiliadoEditando?.grupo_familiar_id && (
            <SeccionBeneficiarios
              grupoId={afiliadoEditando.grupo_familiar_id}
              onRefresh={() => { cargarAfiliados(pagination.page); cargarGrupos(); }}
            />
          )}
        </>
      )}
```

- [ ] **Step 4: Add SCSS for new classes**

In `GestionAfiliados.scss`, at the end of the `.gestion-afiliados` block (before the last `}`), add:

```scss
  // ── Sección beneficiarios (edición de titular) ────────────────────────────
  &__beneficiarios-seccion {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid #e5e7eb;
  }

  &__beneficiarios-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  &__beneficiarios-titulo {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  // ── Modal form (más ancho que el de confirmación) ─────────────────────────
  &__modal--form {
    max-width: 760px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
  }
```

- [ ] **Step 5: Update `GrupoModal` to use new desvincular flow**

In `GrupoModal`, the current `handleRemove` calls `afiliadosService.actualizar`. Replace the entire `handleRemove` function and add state for desvinculación confirmation:

Find:
```jsx
  const [removingId, setRemovingId] = useState(null);
```
Replace with:
```jsx
  const [desvinculando, setDesvinculando] = useState(null);
  const [desvinculandoCargando, setDesvinculandoCargando] = useState(false);
```

Find and remove the `handleRemove` function:
```jsx
  const handleRemove = async (afiliadoId) => {
    setRemovingId(afiliadoId);
    setError(null);
    try {
      await afiliadosService.actualizar(afiliadoId, { rol: 'titular', grupo_familiar_id: null });
      await cargar();
      onRefresh();
    } catch {
      setError('Error al quitar el beneficiario del grupo.');
    } finally {
      setRemovingId(null);
    }
  };
```

Replace with:
```jsx
  const handleDesvincular = async () => {
    setDesvinculandoCargando(true);
    setError(null);
    try {
      await afiliadosService.desvincularBeneficiario(grupoId, desvinculando.id);
      setDesvinculando(null);
      await cargar();
      onRefresh();
    } catch {
      setError('Error al desvincular el beneficiario.');
    } finally {
      setDesvinculandoCargando(false);
    }
  };
```

In the table body of `GrupoModal`, find:
```jsx
                      <td>
                        {m.rol === 'beneficiario' && (
                          <button
                            className="gestion-afiliados__btn-icon gestion-afiliados__btn-icon--delete"
                            onClick={() => handleRemove(m.id)}
                            disabled={removingId === m.id}
                            title="Quitar del grupo"
                          >
                            {removingId === m.id ? '...' : 'Quitar'}
                          </button>
                        )}
                      </td>
```

Replace with:
```jsx
                      <td>
                        {m.rol === 'beneficiario' && (
                          <button
                            className="gestion-afiliados__btn-icon gestion-afiliados__btn-icon--delete"
                            onClick={() => setDesvinculando(m)}
                            title="Desvincular del grupo"
                          >
                            Desvincular
                          </button>
                        )}
                      </td>
```

At the end of the `GrupoModal` return, before the closing `</div>` of the overlay, add:
```jsx
        {desvinculando && (
          <ModalConfirmarDesvinculacion
            afiliado={desvinculando}
            grupoId={grupoId}
            onConfirmar={handleDesvincular}
            onCancelar={() => setDesvinculando(null)}
            cargando={desvinculandoCargando}
          />
        )}
```

- [ ] **Step 6: Verify**

Open the edit form of a titular → the "Beneficiarios del grupo" section should appear below. Clicking "+ Agregar beneficiario" opens the modal with the form (rol field hidden). Clicking "Desvincular" on a beneficiario shows the confirmation modal.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss
git commit -m "feat: SeccionBeneficiarios y flujo de desvinculación con confirmación"
```

---

## Task 11: Frontend — historial en GrupoModal (admin)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx`
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss`

- [ ] **Step 1: Add historial state and loader to `GrupoModal`**

In `GrupoModal`, after the existing state declarations, add:
```jsx
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
```

Add the loader function inside `GrupoModal`:
```jsx
  const cargarHistorial = async () => {
    if (historial.length > 0) { setMostrarHistorial(true); return; }
    setHistorialLoading(true);
    try {
      const data = await afiliadosService.obtenerHistorialGrupo(grupoId);
      setHistorial(data);
      setMostrarHistorial(true);
    } catch {
      setError('Error al cargar el historial del grupo.');
    } finally {
      setHistorialLoading(false);
    }
  };
```

- [ ] **Step 2: Add historial section inside `GrupoModal` render**

In `GrupoModal`, after the members table and before the `<div className="gestion-afiliados__modal-actions">`, add:

```jsx
            <div className="gestion-afiliados__historial-seccion">
              <button
                className="gestion-afiliados__historial-toggle"
                onClick={() => mostrarHistorial ? setMostrarHistorial(false) : cargarHistorial()}
              >
                {mostrarHistorial ? '▲ Ocultar historial' : '▼ Ver historial del grupo'}
              </button>

              {mostrarHistorial && (
                historialLoading ? (
                  <div className="gestion-afiliados__loading">Cargando historial...</div>
                ) : historial.length === 0 ? (
                  <p className="gestion-afiliados__empty">Sin historial registrado.</p>
                ) : (
                  <div className="gestion-afiliados__tabla-wrapper">
                    <table className="gestion-afiliados__tabla">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Afiliado</th>
                          <th>Acción</th>
                          <th>Ejecutado por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((h) => (
                          <tr key={h.id}>
                            <td>{new Date(h.fecha).toLocaleString('es-AR')}</td>
                            <td>{h.afiliado ? `${h.afiliado.nombre} ${h.afiliado.apellido}` : '—'}</td>
                            <td>
                              <span className={`gestion-afiliados__accion-badge gestion-afiliados__accion-badge--${h.accion}`}>
                                {h.accion === 'ingreso' ? 'Ingreso' : 'Baja'}
                              </span>
                            </td>
                            <td>{h.ejecutado_por ? `${h.ejecutado_por.nombre} ${h.ejecutado_por.apellido}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
```

- [ ] **Step 3: Add SCSS for historial classes**

In `GestionAfiliados.scss`, add inside `.gestion-afiliados`:

```scss
  // ── Historial ─────────────────────────────────────────────────────────────
  &__historial-seccion {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  &__historial-toggle {
    background: none;
    border: none;
    color: #2563eb;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-bottom: 0.75rem;

    &:hover { color: #1d4ed8; text-decoration: underline; }
  }

  &__accion-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;

    &--ingreso { background: #dcfce7; color: #166534; }
    &--baja    { background: #fee2e2; color: #b91c1c; }
  }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss
git commit -m "feat: sección historial en GrupoModal (admin)"
```

---

## Task 12: Frontend — historial en PerfilAfiliado (usuario no-admin)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx`

- [ ] **Step 1: Add historial state and section to `PerfilAfiliado`**

`PerfilAfiliado` is currently a pure display component. Convert it to hold historial state.

Find the function signature:
```jsx
function PerfilAfiliado({ afiliado, onEditar }) {
```

Replace the entire `PerfilAfiliado` function with:

```jsx
function PerfilAfiliado({ afiliado, onEditar }) {
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialError, setHistorialError] = useState(null);

  const cargarHistorial = async () => {
    if (historial.length > 0) { setMostrarHistorial(true); return; }
    setHistorialLoading(true);
    setHistorialError(null);
    try {
      const data = await afiliadosService.obtenerHistorialGrupo(afiliado.grupo_familiar_id);
      setHistorial(data);
      setMostrarHistorial(true);
    } catch {
      setHistorialError('Error al cargar el historial del grupo.');
    } finally {
      setHistorialLoading(false);
    }
  };

  const campos = [
    { label: 'Nombre completo', valor: `${afiliado.nombre} ${afiliado.apellido}` },
    { label: 'Documento', valor: `${afiliado.tipo_documento} ${afiliado.numero_documento}` },
    { label: 'Rol', valor: afiliado.rol === 'titular' ? 'Titular' : 'Beneficiario' },
    { label: 'Fecha de nacimiento', valor: afiliado.fecha_nacimiento ?? '—' },
    { label: 'Género', valor: afiliado.genero ?? '—' },
    { label: 'Dirección', valor: afiliado.direccion ?? '—' },
    { label: 'Ciudad', valor: afiliado.ciudad ?? '—' },
    { label: 'Provincia', valor: afiliado.provincia ?? '—' },
    { label: 'Código postal', valor: afiliado.codigo_postal ?? '—' },
    { label: 'Email de contacto', valor: afiliado.email_contacto ?? '—' },
  ];

  const grupo = afiliado.grupo;

  return (
    <div className="gestion-afiliados__perfil">
      <div className="gestion-afiliados__perfil-header">
        <div className="gestion-afiliados__perfil-avatar">
          {afiliado.nombre[0]}{afiliado.apellido[0]}
        </div>
        <div>
          <h3 className="gestion-afiliados__perfil-nombre">{afiliado.nombre} {afiliado.apellido}</h3>
          <span className={`gestion-afiliados__estado gestion-afiliados__estado--${afiliado.estado}`}>
            {afiliado.estado}
          </span>
          {' '}
          <span className={`gestion-afiliados__rol-badge gestion-afiliados__rol-badge--${afiliado.rol}`}>
            {afiliado.rol === 'titular' ? 'Titular' : 'Beneficiario'}
          </span>
        </div>
      </div>

      <div className="gestion-afiliados__perfil-grid">
        {campos.map(({ label, valor }) => (
          <div key={label} className="gestion-afiliados__perfil-field">
            <span className="gestion-afiliados__perfil-label">{label}</span>
            <span className="gestion-afiliados__perfil-valor">{valor}</span>
          </div>
        ))}
      </div>

      {afiliado.telefonos && (
        <div className="gestion-afiliados__telefonos">
          <span className="gestion-afiliados__perfil-label">Teléfonos</span>
          <div className="gestion-afiliados__telefonos-lista">
            {afiliado.telefonos.map((t, i) => (
              <span key={i} className="gestion-afiliados__telefono-badge">
                {t.tipo}: {t.numero}
              </span>
            ))}
          </div>
        </div>
      )}

      {grupo && (
        <div className="gestion-afiliados__grupo-info">
          <span className="gestion-afiliados__perfil-label">Grupo familiar</span>
          <div className="gestion-afiliados__grupo-nombre">{grupo.nombre}</div>
          {grupo.miembros && grupo.miembros.length > 1 && (
            <div className="gestion-afiliados__grupo-miembros">
              {grupo.miembros
                .filter((m) => m.id !== afiliado.id)
                .map((m) => (
                  <span key={m.id} className={`gestion-afiliados__rol-badge gestion-afiliados__rol-badge--${m.rol}`}>
                    {m.nombre} {m.apellido}
                  </span>
                ))}
            </div>
          )}

          {afiliado.grupo_familiar_id && (
            <div className="gestion-afiliados__historial-seccion">
              <button
                className="gestion-afiliados__historial-toggle"
                onClick={() => mostrarHistorial ? setMostrarHistorial(false) : cargarHistorial()}
              >
                {mostrarHistorial ? '▲ Ocultar historial' : '▼ Ver historial del grupo'}
              </button>

              {historialError && (
                <div className="gestion-afiliados__alert gestion-afiliados__alert--error">{historialError}</div>
              )}

              {mostrarHistorial && (
                historialLoading ? (
                  <div className="gestion-afiliados__loading">Cargando historial...</div>
                ) : historial.length === 0 ? (
                  <p className="gestion-afiliados__empty">Sin historial registrado.</p>
                ) : (
                  <div className="gestion-afiliados__tabla-wrapper">
                    <table className="gestion-afiliados__tabla">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Afiliado</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((h) => (
                          <tr key={h.id}>
                            <td>{new Date(h.fecha).toLocaleString('es-AR')}</td>
                            <td>{h.afiliado ? `${h.afiliado.nombre} ${h.afiliado.apellido}` : '—'}</td>
                            <td>
                              <span className={`gestion-afiliados__accion-badge gestion-afiliados__accion-badge--${h.accion}`}>
                                {h.accion === 'ingreso' ? 'Ingreso' : 'Baja'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      <div className="gestion-afiliados__perfil-actions">
        <button className="gestion-afiliados__btn gestion-afiliados__btn--primary" onClick={onEditar}>
          Editar datos
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Log in as a non-admin user whose afiliado belongs to a group. The profile view should show "Ver historial del grupo" under the group info. Clicking it should expand and show historial entries.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx
git commit -m "feat: historial del grupo en perfil de usuario no-admin"
```

---

## Self-Review Checklist

- [x] **Filtro por rol** — Task 3 (backend) + Task 9 (frontend)
- [x] **Titular auto-crea grupo** — already works; Task 4 adds historial logging
- [x] **Editar titular → sección beneficiarios** — Task 10
- [x] **Agregar beneficiario desde edición de titular** — Task 10 (`ModalNuevoBeneficiario` inside `SeccionBeneficiarios`)
- [x] **Beneficiario sin selector de rol** — Task 10 (`rolFijo` prop in `FormAfiliado`)
- [x] **Desvincular con confirmación** — Task 10 (`ModalConfirmarDesvinculacion`) + Task 6 (backend)
- [x] **Nuevo grupo al desvincular** — Task 6 (`desvincular` creates new group)
- [x] **Historial tabla** — Task 1 (migration) + Task 2 (model) + Task 5 (controller)
- [x] **Historial visible a cualquier usuario logueado** — Task 7 (route without `requireAdmin`) + Task 5 (access control: non-admin only sees own group)
- [x] **Historial en GrupoModal (admin)** — Task 11
- [x] **Historial en PerfilAfiliado (no-admin)** — Task 12
- [x] **GrupoModal Quitar → Desvincular** — Task 10, Step 5
- [x] **Transacción en desvincular** — Task 6 uses `sequelize.transaction`
- [x] Type consistency: `afiliadosService.desvincularBeneficiario(grupoId, afiliadoId)` used consistently in Tasks 8, 10, 11. `afiliadosService.obtenerHistorialGrupo(grupoId)` used consistently in Tasks 8, 11, 12.
