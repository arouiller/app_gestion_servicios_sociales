# Agregar Campo Abreviación a Tipos de Grupo y Plan - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar campo `abreviacion` (requerido, NOT NULL) a las tablas `tipo_grupo` y `tipo_plan`, disponible en BD y UI para crear/editar.

**Architecture:** Una migración 2.0.7 agrega ambos campos a ambas tablas. Modelos Sequelize actualizados con validación. Controlador valida abreviacion no vacía. UI (LookupCRUD.jsx) muestra campos de entrada para ambos tipos.

**Tech Stack:** MySQL, Sequelize, Express, React

---

## Estructura de Archivos

### Backend
- `backend/src/migrations/versions/2.0.7/` — Migración SQL
- `backend/src/models/TipoGrupo.js` — Modelo con campo abreviacion
- `backend/src/models/TipoPlan.js` — Modelo con campo abreviacion
- `backend/src/controllers/lookupController.js` — Validación de abreviacion

### Frontend
- `frontend/src/pages/DashboardPage/components/v1.0/LookupCRUD.jsx` — UI para crear/editar tipos

---

## Task 1: Crear Migración 2.0.7

**Files:**
- Create: `backend/src/migrations/versions/2.0.7/upgrade.sql`
- Create: `backend/src/migrations/versions/2.0.7/downgrade.sql`

- [ ] **Step 1: Crear directorio para migración 2.0.7**

```bash
mkdir -p backend/src/migrations/versions/2.0.7
```

- [ ] **Step 2: Crear upgrade.sql**

```bash
cat > backend/src/migrations/versions/2.0.7/upgrade.sql << 'EOF'
-- Agregar campo abreviacion a tipo_grupo
ALTER TABLE tipo_grupo 
ADD COLUMN abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER nombre;

-- Eliminar default después de agregar
ALTER TABLE tipo_grupo 
MODIFY COLUMN abreviacion VARCHAR(10) NOT NULL;

-- Crear índice único para abreviacion en tipo_grupo
CREATE UNIQUE INDEX idx_tipo_grupo_abreviacion ON tipo_grupo(abreviacion);

-- Agregar campo abreviacion a tipo_plan
ALTER TABLE tipo_plan 
ADD COLUMN abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER nombre;

-- Eliminar default después de agregar
ALTER TABLE tipo_plan 
MODIFY COLUMN abreviacion VARCHAR(10) NOT NULL;

-- Crear índice único para abreviacion en tipo_plan
CREATE UNIQUE INDEX idx_tipo_plan_abreviacion ON tipo_plan(abreviacion);
EOF
```

- [ ] **Step 3: Crear downgrade.sql**

```bash
cat > backend/src/migrations/versions/2.0.7/downgrade.sql << 'EOF'
-- Revertir cambios en tipo_grupo
DROP INDEX idx_tipo_grupo_abreviacion ON tipo_grupo;
ALTER TABLE tipo_grupo DROP COLUMN abreviacion;

-- Revertir cambios en tipo_plan
DROP INDEX idx_tipo_plan_abreviacion ON tipo_plan;
ALTER TABLE tipo_plan DROP COLUMN abreviacion;
EOF
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/migrations/versions/2.0.7/ && git commit -m "feat(migrations): crear migración 2.0.7 para agregar campo abreviacion a tipos"
```

---

## Task 2: Actualizar Modelo TipoGrupo

**Files:**
- Modify: `backend/src/models/TipoGrupo.js`

- [ ] **Step 1: Leer modelo actual**

```bash
head -40 backend/src/models/TipoGrupo.js
```

- [ ] **Step 2: Agregar campo abreviacion al modelo**

Buscar la definición de campos y agregar después del campo `nombre`:

```javascript
abreviacion: {
  type: DataTypes.STRING(10),
  allowNull: false,
  unique: true,
  validate: {
    notEmpty: {
      msg: 'La abreviación no puede estar vacía',
    },
  },
},
```

Ejemplo completo de modelo:

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TipoGrupo = sequelize.define('TipoGrupo', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    abreviacion: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'La abreviación no puede estar vacía',
        },
      },
    },
  }, {
    tableName: 'tipo_grupo',
    timestamps: true,
  });

  return TipoGrupo;
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/TipoGrupo.js && git commit -m "feat(models): agregar campo abreviacion a TipoGrupo"
```

---

## Task 3: Actualizar Modelo TipoPlan

**Files:**
- Modify: `backend/src/models/TipoPlan.js`

- [ ] **Step 1: Agregar campo abreviacion al modelo**

Mismo patrón que Task 2. Agregar después del campo `nombre`:

```javascript
abreviacion: {
  type: DataTypes.STRING(10),
  allowNull: false,
  unique: true,
  validate: {
    notEmpty: {
      msg: 'La abreviación no puede estar vacía',
    },
  },
},
```

Ejemplo completo:

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TipoPlan = sequelize.define('TipoPlan', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    abreviacion: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'La abreviación no puede estar vacía',
        },
      },
    },
  }, {
    tableName: 'tipo_plan',
    timestamps: true,
  });

  return TipoPlan;
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/models/TipoPlan.js && git commit -m "feat(models): agregar campo abreviacion a TipoPlan"
```

---

## Task 4: Actualizar Validación en lookupController

**Files:**
- Modify: `backend/src/controllers/lookupController.js`

- [ ] **Step 1: Leer controlador para entender validación actual**

```bash
grep -n "crear\|actualizar" backend/src/controllers/lookupController.js | head -20
```

- [ ] **Step 2: Actualizar validación para tipos**

En los métodos de crear y actualizar para `tipoGrupo` y `tipoPlan`, agregar validación de `abreviacion`:

**Para crear tipoGrupo:**

```javascript
crearTipoGrupo: async (req, res) => {
  try {
    const { nombre, abreviacion } = req.body;

    // Validar campos requeridos
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido',
      });
    }

    if (!abreviacion || !abreviacion.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La abreviación es requerida',
      });
    }

    const tipoGrupo = await TipoGrupo.create({
      nombre: nombre.trim(),
      abreviacion: abreviacion.trim().toUpperCase(),
    });

    res.json({ success: true, data: tipoGrupo });
  } catch (error) {
    // Manejar error de unique constraint
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Esta abreviación ya existe',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
},
```

**Mismo patrón para:**
- `actualizarTipoGrupo`
- `crearTipoPlan`
- `actualizarTipoPlan`

(Copiar la lógica de validación para cada uno)

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/lookupController.js && git commit -m "feat(controllers): agregar validación de abreviacion para tipos"
```

---

## Task 5: Actualizar UI - LookupCRUD.jsx para Tipos de Grupo

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/v1.0/LookupCRUD.jsx`

- [ ] **Step 1: Leer sección de Tipos de Grupo en LookupCRUD**

```bash
grep -n "tipoGrupo\|TipoGrupo" frontend/src/pages/DashboardPage/components/v1.0/LookupCRUD.jsx | head -30
```

- [ ] **Step 2: Encontrar el formulario de Tipo de Grupo**

Localizar el modal/formulario para crear/editar tipoGrupo. Debería tener campos de input para `nombre`.

- [ ] **Step 3: Agregar campo de abreviacion**

En el formulario de tipoGrupo, agregar después del campo nombre:

```javascript
<div className="form-group">
  <label>Abreviación *</label>
  <input
    type="text"
    maxLength="10"
    value={formData.abreviacion || ''}
    onChange={(e) => handleFormChange('abreviacion', e.target.value.toUpperCase())}
    placeholder="Ej: FAM, IND"
    required
  />
</div>
```

- [ ] **Step 4: Actualizar validación en frontend**

En la función de validación del formulario, agregar:

```javascript
if (!formData.abreviacion || !formData.abreviacion.trim()) {
  setError('La abreviación es requerida');
  return false;
}

if (formData.abreviacion.length < 2) {
  setError('La abreviación debe tener al menos 2 caracteres');
  return false;
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/v1.0/LookupCRUD.jsx && git commit -m "feat(ui): agregar campo abreviacion a formulario de Tipos de Grupo"
```

---

## Task 6: Actualizar UI - LookupCRUD.jsx para Tipos de Plan

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/v1.0/LookupCRUD.jsx`

- [ ] **Step 1: Repetir pasos de Task 5 pero para tipoPlan**

Agregar campo de `abreviacion` al formulario de tipoPlan:

```javascript
<div className="form-group">
  <label>Abreviación *</label>
  <input
    type="text"
    maxLength="10"
    value={formData.abreviacion || ''}
    onChange={(e) => handleFormChange('abreviacion', e.target.value.toUpperCase())}
    placeholder="Ej: PP, PB, PM"
    required
  />
</div>
```

- [ ] **Step 2: Agregar validación en frontend**

Igual que en Task 5.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/v1.0/LookupCRUD.jsx && git commit -m "feat(ui): agregar campo abreviacion a formulario de Tipos de Plan"
```

---

## Task 7: Testing Manual

**Files:**
- N/A (testing manual local)

- [ ] **Step 1: Ejecutar migración localmente**

```bash
cd backend && npm run db:migrate:up
```

Expected: Migration 2.0.7 executed successfully.

- [ ] **Step 2: Verificar tabla tipo_grupo**

```sql
DESCRIBE tipo_grupo;
```

Expected: Columna `abreviacion` VARCHAR(10) NOT NULL visible.

- [ ] **Step 3: Verificar tabla tipo_plan**

```sql
DESCRIBE tipo_plan;
```

Expected: Columna `abreviacion` VARCHAR(10) NOT NULL visible.

- [ ] **Step 4: Iniciar servidor backend y frontend**

```bash
cd backend && npm run dev
# En otra terminal:
cd frontend && npm start
```

- [ ] **Step 5: Probar crear Tipo de Grupo**

En LookupCRUD, crear nuevo Tipo de Grupo:
- Nombre: "Familiar"
- Abreviación: "FAM"

Expected: Se crea exitosamente, abreviación se convierte a mayúsculas, aparece en listado.

- [ ] **Step 6: Probar crear Tipo de Plan**

Crear nuevo Tipo de Plan:
- Nombre: "Plan Premium"
- Abreviación: "PP"

Expected: Se crea exitosamente, aparece con abreviación en listado.

- [ ] **Step 7: Probar validación (abreviación vacía)**

Intentar crear sin abreviación.

Expected: Mensaje de error "La abreviación es requerida".

- [ ] **Step 8: Probar abreviación duplicada**

Intentar crear dos Tipos de Grupo con la misma abreviación.

Expected: Mensaje de error "Esta abreviación ya existe".

- [ ] **Step 9: Probar edición**

Editar un Tipo de Grupo existente y cambiar abreviación.

Expected: Se actualiza exitosamente.

---

## Task 8: Documentación - Actualizar BACKLOG

**Files:**
- Modify: `BACKLOG.md`

- [ ] **Step 1: Actualizar estado de BACKLOG-022 y BACKLOG-023**

Cambiar estados de `📋 Registrado` a `✅ Solucionado`:

```markdown
| BACKLOG-023 | 🔴 Alta | ✅ Solucionado | Agregar campo abreviacion a Tipos de Plan | ...
| BACKLOG-022 | 🔴 Alta | ✅ Solucionado | Agregar campo abreviacion a Tipos de Grupo | ...
```

- [ ] **Step 2: Agregar sección de detalles en BACKLOG.md**

Agregar al final del archivo:

```markdown
### BACKLOG-022 y BACKLOG-023: Agregar Campo Abreviación

**Descripción:**
Agregar campo `abreviacion` (VARCHAR(10), NOT NULL, UNIQUE) a tablas `tipo_grupo` y `tipo_plan`. Campo visible en UI para crear/editar. Facilita identificación rápida en listas y reportes.

**Implementación Completada (2026-04-17):**
- ✅ Backend: Migración 2.0.7 con columnas abreviacion en ambas tablas
- ✅ Backend: Modelos TipoGrupo y TipoPlan con validación de abreviacion
- ✅ Backend: Validación en lookupController (requerido, única, trim, mayúsculas)
- ✅ Frontend: Campos de entrada en LookupCRUD.jsx para ambos tipos
- ✅ Frontend: Validación de cliente (requerido, longitud mínima 2)
- ✅ Testing: Validación manual completa

**Commits Asociados:**
- Migración 2.0.7
- Modelos TipoGrupo y TipoPlan
- Validación en lookupController
- UI actualizada en LookupCRUD.jsx
- Documentación en BACKLOG.md

**Estado:** ✅ Solucionado
```

- [ ] **Step 3: Commit**

```bash
git add BACKLOG.md && git commit -m "docs(backlog): marcar BACKLOG-022 y BACKLOG-023 como Solucionado"
```

---

## Summary

**Total Tasks:** 8
- Backend: 4 (Migración, 2 Modelos, Controlador)
- Frontend: 2 (UI para ambos tipos)
- Testing: 1 (Manual)
- Docs: 1 (BACKLOG actualizado)

**Estimated Time:** 2-3 horas (incluyendo testing manual)

**Key Points:**
- Campo `abreviacion` es VARCHAR(10), NOT NULL, UNIQUE
- Validación en backend y frontend
- Abreviaciones se convierten a mayúsculas automáticamente
- Migración 2.0.7 agrega campos a ambas tablas simultáneamente
- No requiere backfill (nuevos registros tendrán abreviación en UI)

