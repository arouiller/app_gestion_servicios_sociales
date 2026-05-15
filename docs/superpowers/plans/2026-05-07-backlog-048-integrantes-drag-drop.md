# BACKLOG-048: Integrantes Ordenables con Drag & Drop — Rol por Posición

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir reordenar integrantes de un plan mediante drag & drop, determinando automáticamente el rol (titular/integrante) por posición en la lista.

**Architecture:** 
- Backend: Migración 2.0.24 valida/asigna rol y orden a integrantes existentes. Controller procesa array reordenado, actualiza BD. 
- Frontend: Componente DraggableList reutilizable maneja drag & drop. PlanV1Modal integra lista reordenable en tab Integrantes. Hook usePlanV1Form sincroniza estado y rol automático.

**Tech Stack:** 
- Backend: Node.js/Express, Sequelize, MySQL (LPAD, ROW_NUMBER para migración)
- Frontend: React, vanilla drag & drop API (mouse + touch), no librerías externas inicialmente

---

## File Structure

**Backend:**
- `backend/src/migrations/versions/2.0.24_integrantes_orden_rol/upgrade.sql` — Validar/asignar rol y orden
- `backend/src/migrations/versions/2.0.24_integrantes_orden_rol/downgrade.sql` — No-op downgrade
- `backend/src/models/PlanIntegrante.js` — Verificar campos orden/rol existen
- `backend/src/controllers/v1.0/planesController.js` — Procesar integrantes reordenados en actualizar()

**Frontend:**
- `frontend/src/components/DraggableList/DraggableList.jsx` — Componente reusable drag & drop (mouse + touch)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` — Integración en tab Integrantes
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js` — Lógica reorden y rol automático

---

## Task Breakdown

### Task 1: Crear Migración 2.0.24 — SQL Upgrade

**Files:**
- Create: `backend/src/migrations/versions/2.0.24_integrantes_orden_rol/upgrade.sql`

- [ ] **Step 1: Crear directorio migración 2.0.24**

```bash
mkdir -p backend/src/migrations/versions/2.0.24_integrantes_orden_rol
```

- [ ] **Step 2: Escribir upgrade.sql**

```sql
-- Migración 2.0.24: Validar y asignar rol/orden a plan_integrantes

-- 1. Agregar campos si no existen
ALTER TABLE plan_integrantes
ADD COLUMN IF NOT EXISTS orden INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT NULL;

-- 2. Ordenar integrantes por plan y asignar orden secuencial
-- Usando variable de sesión para emular ROW_NUMBER (compatible MariaDB 10.2)
SET @plan_numero = 0;
SET @orden = 0;

UPDATE plan_integrantes pi
SET pi.orden = (
  SELECT COUNT(*) + 1
  FROM plan_integrantes pi2
  WHERE pi2.plan_numero = pi.plan_numero
    AND pi2.id < pi.id
)
WHERE pi.orden IS NULL;

-- 3. Asignar rol basado en orden: orden = 1 → "titular", orden > 1 → "integrante"
UPDATE plan_integrantes
SET rol = CASE 
  WHEN orden = 1 THEN 'titular'
  ELSE 'integrante'
END
WHERE rol IS NULL;

-- 4. Verificación: Asegurarse que cada plan tiene exactamente 1 titular
-- Si este query retorna > 0 filas, la migración tiene problemas
SELECT plan_numero, COUNT(*) as titulares
FROM plan_integrantes
WHERE rol = 'titular'
GROUP BY plan_numero
HAVING titulares != 1;
```

- [ ] **Step 3: Verificar sintaxis SQL**

Run: `cat backend/src/migrations/versions/2.0.24_integrantes_orden_rol/upgrade.sql`
Expected: SQL válido, sin comentarios sintácticamente incorrectos

---

### Task 2: Crear Migración 2.0.24 — SQL Downgrade

**Files:**
- Create: `backend/src/migrations/versions/2.0.24_integrantes_orden_rol/downgrade.sql`

- [ ] **Step 1: Escribir downgrade.sql (no-op)**

```sql
-- Downgrade 2.0.24: No eliminar columnas (backward compatibility)
-- Este downgrade es no-op: no hacemos cambios
-- Las columnas orden y rol permanecen en BD para compatibilidad
-- Nota: Si es necesario limpiar datos en el futuro, crear migración nueva
```

- [ ] **Step 2: Commit migración**

```bash
git add backend/src/migrations/versions/2.0.24_integrantes_orden_rol/
git commit -m "feat(migrations): migración 2.0.24 - validar y asignar rol/orden a integrantes"
```

---

### Task 3: Verificar Modelo PlanIntegrante.js

**Files:**
- Modify: `backend/src/models/PlanIntegrante.js`

- [ ] **Step 1: Leer PlanIntegrante.js actual**

Run: `head -80 backend/src/models/PlanIntegrante.js`
Expected: Ver definición de campos, verificar que exista orden y rol

- [ ] **Step 2: Agregar campos orden y rol si faltan**

Si faltan, agregar antes del cierre del define():

```javascript
orden: {
  type: DataTypes.INTEGER,
  allowNull: true,
  defaultValue: null,
},
rol: {
  type: DataTypes.STRING(20),
  allowNull: true,
  defaultValue: null,
},
```

- [ ] **Step 3: Commit modelo**

```bash
git add backend/src/models/PlanIntegrante.js
git commit -m "refactor(models): agregar campos orden y rol a PlanIntegrante"
```

---

### Task 4: Actualizar Controller — Procesar Integrantes Reordenados

**Files:**
- Modify: `backend/src/controllers/v1.0/planesController.js` — método actualizar()

- [ ] **Step 1: Encontrar método actualizar en controller**

Run: `grep -n "const actualizar = " backend/src/controllers/v1.0/planesController.js`
Expected: Línea del método actualizar()

- [ ] **Step 2: Localizar sección donde se actualizan campos del plan**

Buscar donde se hace `plan.update()` o similar. Alrededor de esta línea, agregar lógica para procesar integrantes.

- [ ] **Step 3: Agregar lógica de procesamiento de integrantes reordenados**

Antes de `plan.update()`, agregar:

```javascript
// Procesar integrantes reordenados si se proporciona
if (req.body.integrantes && Array.isArray(req.body.integrantes)) {
  try {
    // Validar que hay al menos 1 integrante
    if (req.body.integrantes.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Un plan debe tener al menos 1 integrante',
        errors: { integrantes: 'Mínimo 1 integrante requerido' },
      });
    }

    // Actualizar integrantes en BD
    const { PlanIntegrante } = db;
    
    // Eliminar integrantes viejos para este plan
    await PlanIntegrante.destroy({ where: { plan_numero: plan.plan_numero } });
    
    // Insertar integrantes nuevos en orden correcto
    const integrantesNuevos = req.body.integrantes.map((integrante, index) => ({
      plan_numero: plan.plan_numero,
      persona_id: integrante.persona_id,
      orden: index + 1, // 1-based
      rol: index === 0 ? 'titular' : 'integrante', // Primero = titular, resto = integrante
    }));
    
    await PlanIntegrante.bulkCreate(integrantesNuevos);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al procesar integrantes',
      errors: { integrantes: error.message },
    });
  }
}
```

- [ ] **Step 4: Commit controller**

```bash
git add backend/src/controllers/v1.0/planesController.js
git commit -m "refactor(controller): procesar integrantes reordenados en actualizar plan"
```

---

### Task 5: Crear Componente DraggableList Reutilizable

**Files:**
- Create: `frontend/src/components/DraggableList/DraggableList.jsx`

- [ ] **Step 1: Crear archivo DraggableList.jsx**

```jsx
import React, { useState, useRef } from 'react';
import './DraggableList.scss';

/**
 * Componente reutilizable para listas reordenables con drag & drop
 * Soporta mouse y touch events
 * 
 * Props:
 * - items: Array de items a renderizar
 * - onReorder: Callback(newItems) cuando el usuario suelta un item
 * - renderItem: Function(item, index) → JSX para cada item
 * - itemKey: String (nombre de propiedad única para key) o Function(item) → string
 */
const DraggableList = ({ items, onReorder, renderItem, itemKey = 'id' }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const containerRef = useRef(null);

  const getItemKey = (item) => {
    if (typeof itemKey === 'function') return itemKey(item);
    return item[itemKey];
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === index) return;

    // Crear array nuevo reordenado
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(null);
    onReorder(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch support (simple: drag en mobile)
  const handleTouchStart = (e, index) => {
    setDraggedIndex(index);
  };

  const handleTouchMove = (e, index) => {
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  };

  const handleTouchEnd = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);
    onReorder(newItems);
  };

  return (
    <div ref={containerRef} className="draggable-list">
      {items.map((item, index) => (
        <div
          key={getItemKey(item)}
          className={`draggable-list__item ${
            draggedIndex === index ? 'is-dragging' : ''
          } ${dragOverIndex === index ? 'is-drag-over' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          onTouchStart={(e) => handleTouchStart(e, index)}
          onTouchMove={(e) => handleTouchMove(e, index)}
          onTouchEnd={(e) => handleTouchEnd(e, index)}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

export default DraggableList;
```

- [ ] **Step 2: Crear estilos DraggableList.scss**

```scss
.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__item {
    padding: 8px;
    background: #fff;
    border: 2px solid transparent;
    border-radius: 4px;
    cursor: move;
    transition: all 0.2s ease;
    user-select: none;

    &.is-dragging {
      opacity: 0.5;
      background: #f5f5f5;
    }

    &.is-drag-over {
      border-color: #0066cc;
      border-style: dashed;
      background: #f0f7ff;
    }

    &:hover {
      background: #f9f9f9;
    }
  }
}
```

- [ ] **Step 3: Commit DraggableList**

```bash
git add frontend/src/components/DraggableList/
git commit -m "feat(components): crear DraggableList - componente reutilizable para reordenar items"
```

---

### Task 6: Actualizar usePlanV1Form — Lógica Reorden y Rol Automático

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js`

- [ ] **Step 1: Leer usePlanV1Form.js actual**

Run: `head -150 frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js`
Expected: Ver estructura del hook, métodos addIntegrante, removeIntegrante

- [ ] **Step 2: Agregar método reorderIntegrantes**

Después de `removeIntegrante`, agregar:

```javascript
const reorderIntegrantes = useCallback((newIntegrantes) => {
  // Actualizar array reordenado
  const integrantesConRol = newIntegrantes.map((integrante, index) => ({
    ...integrante,
    rol: index === 0 ? 'titular' : 'integrante', // Rol automático por posición
  }));
  
  setForm((prev) => ({
    ...prev,
    integrantes: integrantesConRol,
  }));
}, []);
```

- [ ] **Step 3: Commit hook actualizado**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js
git commit -m "refactor(form): agregar método reorderIntegrantes con rol automático por posición"
```

---

### Task 7: Actualizar PlanV1Modal — Tab Integrantes Reordenable

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`

- [ ] **Step 1: Importar DraggableList en PlanV1Modal.jsx**

```javascript
import DraggableList from '../../../../../components/DraggableList/DraggableList';
```

- [ ] **Step 2: Encontrar sección del tab Integrantes**

Run: `grep -n "Integrantes" frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx | head -5`
Expected: Líneas donde aparece "Integrantes"

- [ ] **Step 3: Reemplazar tabla estática por DraggableList**

Encontrar la sección donde se renderiza la lista de integrantes (probablemente un `<table>` o `<ul>`). Reemplazar por:

```jsx
{activeTab === 'integrantes' && (
  <div className="plan-v1-modal__tab-content">
    <div className="plan-v1-modal__integrantes-list">
      {form.integrantes.length === 0 ? (
        <p className="plan-v1-modal__empty-message">No hay integrantes. Agrega al menos uno.</p>
      ) : (
        <DraggableList
          items={form.integrantes}
          onReorder={(newItems) => handleReorderIntegrantes(newItems)}
          itemKey={(item) => `${item.persona_id || item.id}`}
          renderItem={(integrante, index) => (
            <div className="plan-v1-modal__integrante-row">
              <span className="plan-v1-modal__drag-handle">⋮⋮</span>
              
              <span className="plan-v1-modal__rol-badge">
                {integrante.rol === 'titular' ? 'Titular' : ''}
              </span>
              
              <span className="plan-v1-modal__integrante-name">
                {integrante.persona?.nombre || 'Sin nombre'}
              </span>
              
              <span className="plan-v1-modal__integrante-doc">
                {integrante.persona?.documento || ''}
              </span>
              
              <button
                type="button"
                className="plan-v1-modal__remove-integrante"
                onClick={() => handleRemoveIntegrante(integrante.persona_id)}
              >
                ✕
              </button>
            </div>
          )}
        />
      )}
    </div>
  </div>
)}
```

- [ ] **Step 4: Agregar manejador handleReorderIntegrantes**

```javascript
const handleReorderIntegrantes = useCallback((newIntegrantes) => {
  if (form.reorderIntegrantes) {
    form.reorderIntegrantes(newIntegrantes);
  }
}, [form]);
```

- [ ] **Step 5: Agregar estilos CSS para integrantes reordenables**

Agregar a PlanV1Modal.scss (o inline):

```scss
.plan-v1-modal__integrantes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-v1-modal__integrante-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #fff;
    border-color: #ccc;
  }
}

.plan-v1-modal__drag-handle {
  cursor: grab;
  color: #999;
  font-weight: bold;
  
  &:active {
    cursor: grabbing;
  }
}

.plan-v1-modal__rol-badge {
  min-width: 60px;
  padding: 4px 8px;
  background: #4CAF50;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  
  &:empty {
    display: none;
  }
}

.plan-v1-modal__integrante-name {
  flex: 1;
  font-weight: 500;
}

.plan-v1-modal__integrante-doc {
  color: #666;
  font-size: 14px;
}

.plan-v1-modal__remove-integrante {
  padding: 4px 8px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background: #d32f2f;
  }
}

.plan-v1-modal__empty-message {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
}
```

- [ ] **Step 6: Commit PlanV1Modal actualizado**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx
git commit -m "feat(modal): integrar DraggableList en tab Integrantes con rol automático"
```

---

### Task 8: Prueba Manual — Drag & Drop Frontend

**No files modified**

- [ ] **Step 1: Iniciar servidor frontend**

```bash
cd frontend
npm start
```

Expected: App disponible en http://localhost:3000

- [ ] **Step 2: Crear plan nuevo o abrir plan existente**

Navegar a Gestión de Planes, crear o abrir un plan existente.

- [ ] **Step 3: Ir a tab "Integrantes"**

Debe verse lista reordenable con icono de drag ⋮⋮

- [ ] **Step 4: Drag integrante**

- Drag integrante 1 → integrante 2: Visual feedback (ícono de drag, línea dashed)
- Al soltar: integrante cambia de posición
- Rol se actualiza: integrante que era primero pierde badge "Titular"
- Nuevo primero recibe badge "Titular"

- [ ] **Step 5: Guardar plan**

Click "Guardar". Backend procesa integrantes reordenados.

- [ ] **Step 6: Recargar página**

Modal se cierra y reabre. Integrantes aparecen en nuevo orden con roles correctos.

- [ ] **Step 7: Prueba mobile (opcional)**

En dispositivo mobile o modo responsive: drag con touch funciona correctamente.

---

### Task 9: Prueba Migración 2.0.24

**No files modified**

- [ ] **Step 1: Verificar BD antes de migración**

```sql
SELECT plan_numero, COUNT(*) as integrantes, 
       SUM(CASE WHEN rol = 'titular' THEN 1 ELSE 0 END) as titulares
FROM plan_integrantes
GROUP BY plan_numero;
```

Expected: Ver datos actuales, algunos pueden tener rol NULL o múltiples titulares.

- [ ] **Step 2: Ejecutar migración**

```bash
npm run db:migrate:up
```

Expected: Migración 2.0.24 ejecutada sin errores.

- [ ] **Step 3: Verificar BD después de migración**

```sql
SELECT plan_numero, COUNT(*) as integrantes, 
       SUM(CASE WHEN rol = 'titular' THEN 1 ELSE 0 END) as titulares
FROM plan_integrantes
GROUP BY plan_numero
HAVING titulares != 1;
```

Expected: 0 filas (cada plan tiene exactamente 1 titular)

- [ ] **Step 4: Verificar orden está asignado**

```sql
SELECT COUNT(*) as sin_orden FROM plan_integrantes WHERE orden IS NULL;
```

Expected: 0 (todos tienen orden asignado)

---

### Task 10: Prueba Integración Completa

**No files modified**

- [ ] **Step 1: Crear plan nuevo con integrantes**

En PlanV1Modal, crear plan con 3 integrantes:
- Integrante A (será titular automáticamente)
- Integrante B
- Integrante C

Guardar. Verificar en BD: orden = 1, 2, 3; rol = 'titular', 'integrante', 'integrante'

- [ ] **Step 2: Editar plan: reordenar integrantes**

Abrir plan creado, ir a tab Integrantes. Drag Integrante B al principio.

Nuevo orden en UI: B, A, C
Roles en UI: B = "Titular", A = "", C = ""

Guardar.

- [ ] **Step 3: Verificar BD post-reorder**

```sql
SELECT persona_id, orden, rol FROM plan_integrantes 
WHERE plan_numero = <id_plan> 
ORDER BY orden;
```

Expected: Integrante B en orden=1 con rol='titular', A en orden=2 con rol='integrante', etc.

- [ ] **Step 4: Recargar modal**

Cerrar y reabrir plan. Debe mostrar integrantes en nuevo orden (B, A, C) con roles correctos.

- [ ] **Step 5: Prueba eliminación**

Intentar eliminar integrante B (el único que era titular). Modal debe permitir eliminación.
Guardar. Nuevo primero (A) debe pasar a "Titular" automáticamente.

Verificar BD: A ahora tiene orden=1, rol='titular'

---

### Task 11: Commit Final y Push

**No files modified**

- [ ] **Step 1: Verificar git status**

```bash
git status
```

Expected: Todo staged, sin cambios pendientes.

- [ ] **Step 2: Ver log de commits**

```bash
git log --oneline -8
```

Expected: Ver los 6 commits de esta feature (migración, modelo, controller, hook, componente, modal)

- [ ] **Step 3: Push a rama**

```bash
git push origin V_1.0.7
```

Expected: Todos los commits pusheados a V_1.0.7

- [ ] **Step 4: Actualizar BACKLOG.md (estado completado)**

Cambiar BACKLOG-048 de "📋 Registrado" a "✅ Solucionado"

```bash
# Editar BACKLOG.md manualmente o con sed
git add BACKLOG.md
git commit -m "docs(backlog): marcar BACKLOG-048 como completado"
git push origin V_1.0.7
```

---

## Verification Checklist

**Req 1: Drag & Drop Funciona**
- ✅ Usuario puede drag integrante en PlanV1Modal tab Integrantes
- ✅ Visual feedback durante drag (opacidad, border)
- ✅ Drop en nueva posición reordena
- ✅ Soporta mouse y touch

**Req 2: Rol Automático por Posición**
- ✅ Primero en lista = "Titular" (con badge verde)
- ✅ Resto = "Integrante" (sin badge)
- ✅ Cambio de rol al reordenar es automático (no requiere acción explícita)

**Req 3: Persistencia**
- ✅ Guardar plan actualiza BD: orden y rol para cada integrante
- ✅ Recargar modal muestra integrantes en nuevo orden con roles correctos

**Req 4: Migración**
- ✅ Migración 2.0.24 asigna orden secuencial (1, 2, 3, ...) a integrantes existentes
- ✅ Migración asigna rol basado en orden (1='titular', >1='integrante')
- ✅ Cada plan termina con exactamente 1 titular

**Req 5: Backend**
- ✅ Controller procesa array reordenado de integrantes
- ✅ Valida al menos 1 integrante
- ✅ Recalcula rol basado en posición

---

## Notes

- DraggableList usa vanilla drag & drop API (no librerías externas) para compatibilidad
- Migración 2.0.24 es idempotente: puede correr múltiples veces sin problemas
- Downgrade es no-op: no elimina columnas para backward compatibility
- Rol DEBE inferirse siempre de posición (nunca guardar rol "hardcodeado")
