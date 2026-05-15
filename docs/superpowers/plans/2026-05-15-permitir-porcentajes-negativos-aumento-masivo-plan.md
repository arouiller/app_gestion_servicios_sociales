# Permitir Porcentajes Negativos en Aumento Masivo de Cuotas - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Habilitar valores negativos en el input de porcentaje de aumento masivo, mostrando correctamente signos en la UI y aceptando valores sin restricción de rango en backend.

**Architecture:** Cambios puramente aditivos en validación y UI. El cálculo matemático ya funciona con negativos. Frontend y backend pueden modificarse en paralelo.

**Tech Stack:** React (Frontend), Express/Sequelize (Backend), Jest (Testing)

---

## File Structure

```
frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/
  ├── BulkUpdateCuotaModal.jsx      (modificar: input, validaciones, hints, preview)

backend/src/controllers/
  ├── planesController.js           (modificar: validación en bulkUpdateCuota)
```

---

## Tasks

### Task 1: Frontend - Remover Restricción de Input y Cambiar Validación

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx:268-278` (input)
- Modify: `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx:152-166` (validación)

- [ ] **Step 1: Abrir archivo y ubicar el input de porcentaje**

File: `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx`

Buscar línea ~271 con:
```jsx
<input
  type="number"
  step="0.01"
  min="0.01"
  value={valor}
  onChange={(e) => setValor(e.target.value)}
  placeholder="10"
/>
```

- [ ] **Step 2: Remover atributo min="0.01"**

Cambiar a:
```jsx
<input
  type="number"
  step="0.01"
  value={valor}
  onChange={(e) => setValor(e.target.value)}
  placeholder="10"
/>
```

- [ ] **Step 3: Ubicar validación en handlePreview() y cambiarla**

Buscar línea ~156:
```javascript
if (!valor || parseFloat(valor) <= 0) {
  setError('Ingresa un porcentaje válido');
  return;
}
```

Cambiar a:
```javascript
if (!valor) {
  setError('Ingresa un porcentaje válido');
  return;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx
git commit -m "feat(bulk-update-cuota): permitir porcentajes negativos - remover restricción de input"
```

---

### Task 2: Frontend - Actualizar Hints y Etiquetas

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx:262-266` (hint)

- [ ] **Step 1: Ubicar el label del input de porcentaje**

Buscar línea ~263:
```jsx
<label>
  Porcentaje de aumento (%):
  <span className="form-hint"> (ej: 10 para +10%)</span>
</label>
```

- [ ] **Step 2: Actualizar hint para mostrar ejemplo de negativo**

Cambiar a:
```jsx
<label>
  Porcentaje de aumento (%):
  <span className="form-hint"> (ej: 10 para +10%, -10 para -10%)</span>
</label>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx
git commit -m "feat(bulk-update-cuota): actualizar hint para mostrar porcentajes negativos"
```

---

### Task 3: Frontend - Mostrar Signo Dinámico en Resumen de Preview

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx:320-324` (resumen)

- [ ] **Step 1: Ubicar el resumen de preview (Step 2)**

Buscar línea ~321:
```jsx
<p>
  Aumento: <strong>+{valor}%</strong>
</p>
```

- [ ] **Step 2: Cambiar para mostrar signo dinámico**

Cambiar a:
```jsx
<p>
  Aumento: <strong>{parseFloat(valor) > 0 ? '+' : ''}{valor}%</strong>
</p>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx
git commit -m "feat(bulk-update-cuota): mostrar signo dinámico en resumen de preview"
```

---

### Task 4: Frontend - Mostrar Signo Dinámico en Tabla de Preview

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx:375-385` (columna Aumento)

- [ ] **Step 1: Ubicar la columna "Aumento" en la tabla de preview**

Buscar línea ~380:
```jsx
<td>
  {`+${valor}% ($${difference.toFixed(2)})`}
</td>
```

- [ ] **Step 2: Cambiar para mostrar signos dinámicos en porcentaje y diferencia**

Cambiar a:
```jsx
<td>
  {`${parseFloat(valor) > 0 ? '+' : ''}${valor}% (${parseFloat(difference) >= 0 ? '+' : ''}$${difference.toFixed(2)})`}
</td>
```

**Explicación:**
- `${parseFloat(valor) > 0 ? '+' : ''}${valor}%` → muestra "+10%" o "-15%"
- `${parseFloat(difference) >= 0 ? '+' : ''}` → muestra signo en la diferencia de dinero
- Ejemplo resultado: "-15% (-$15.00)" o "+10% (+$10.00)"

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx
git commit -m "feat(bulk-update-cuota): mostrar signo dinámico en columna Aumento de preview"
```

---

### Task 5: Frontend - Testing Manual y Verificación

**Manual Testing Checklist:**

- [ ] **Step 1: Abrir modal de aumento masivo en dev server (si está disponible)**

Esperado: Modal se abre sin errores

- [ ] **Step 2: Probar input vacío**

Acción: Click en "Ver preview" sin ingresar valor
Esperado: Error "Ingresa un porcentaje válido"

- [ ] **Step 3: Probar porcentaje positivo (+10)**

Acción: Ingresar "10", click "Ver preview"
Esperado: Resumen muestra "+10%", tabla muestra "+10% (+$X.XX)"

- [ ] **Step 4: Probar porcentaje negativo (-15)**

Acción: Ingresar "-15", click "Ver preview"
Esperado: Resumen muestra "-15%", tabla muestra "-15% (-$X.XX)"

- [ ] **Step 5: Probar valor extremo (-150)**

Acción: Ingresar "-150", click "Ver preview"
Esperado: Tabla calcula correctamente (ej: $100 × 0.5 = -$50)

- [ ] **Step 6: Commit de verificación (si no hay issues)**

```bash
git status
```

Esperado: Working tree clean (todos los commits hechos)

---

### Task 6: Backend - Cambiar Validación en bulkUpdateCuota()

**Files:**
- Modify: `backend/src/controllers/planesController.js:113-126` (validación)

- [ ] **Step 1: Ubicar validación en bulkUpdateCuota()**

Buscar línea ~119:
```javascript
if (!valor || parseFloat(valor) <= 0) {
  return res.status(400).json({ success: false, message: 'valor debe ser positivo' });
}
```

- [ ] **Step 2: Cambiar a validación sin restricción de rango**

Cambiar a:
```javascript
if (!valor) {
  return res.status(400).json({ success: false, message: 'valor es requerido' });
}
```

**Explicación:** 
- Antes: Rechazaba valores ≤ 0
- Después: Solo rechaza si está vacío/undefined/null
- Permite cualquier número (positivo, negativo, extremo)

- [ ] **Step 3: Verificar que el cálculo no cambió**

Revisar línea ~140:
```javascript
let valorNuevo = valActualNum * (1 + parseFloat(valor) / 100);
valorNuevo = Math.ceil(valorNuevo / precision) * precision;
```

Esperado: Sin cambios (ya funciona con negativos)

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/planesController.js
git commit -m "feat(bulk-update-cuota): permitir porcentajes negativos - cambiar validación en backend"
```

---

### Task 7: Backend - Testing de Cálculos

**Unit Test Verification (Manual/Conceptual):**

- [ ] **Step 1: Verificar lógica de cálculo con negativos**

Casos a validar en código:
- Positivo: `100 × (1 + 10/100) = 110` ✓
- Negativo: `100 × (1 + (-15)/100) = 85` ✓
- Cero: `100 × (1 + (-100)/100) = 0` ✓
- Extremo: `100 × (1 + (-150)/100) = -50` ✓

Nota: No hay tests unitarios en este proyecto, validación es a través de integración

- [ ] **Step 2: Commit confirmación**

```bash
git log --oneline -5
```

Esperado: Ver commits de validation y bulk-update-cuota

---

### Task 8: Actualizar BACKLOG.md

**Files:**
- Modify: `BACKLOG.md` (estado de BACKLOG-071)

- [ ] **Step 1: Abrir BACKLOG.md y ubicar BACKLOG-071**

Buscar línea con:
```
| BACKLOG-071 | 🔴 Alta | 📋 Registrado | Permitir porcentajes negativos...
```

- [ ] **Step 2: Cambiar estado a "🚀 Desarrollado"**

Cambiar a:
```
| BACKLOG-071 | 🔴 Alta | 🚀 Desarrollado | Permitir porcentajes negativos en aumento masivo de cuotas | [Descripción completada en spec] | BulkUpdateCuotaModal.jsx, planesController.js |
```

- [ ] **Step 3: Commit**

```bash
git add BACKLOG.md
git commit -m "docs(backlog): marcar BACKLOG-071 como desarrollado"
```

---

### Task 9: Push Final a Rama V_1.0.7

**Final Integration:**

- [ ] **Step 1: Verificar que todos los commits están hechos**

```bash
git log --oneline -10
```

Esperado: Ver 6-7 commits (input, hint, preview, tabla, validación backend, BACKLOG, spec)

- [ ] **Step 2: Verificar que la rama está limpia**

```bash
git status
```

Esperado: "On branch V_1.0.7, nothing to commit"

- [ ] **Step 3: Push a rama actual**

```bash
git push origin V_1.0.7
```

Esperado: Todos los commits pushed exitosamente

---

## Self-Review vs Spec

**Spec Coverage:**
- ✅ RF1 (Aceptar porcentajes negativos): Tasks 1-2
- ✅ RF2 (Visualización en preview): Tasks 3-4
- ✅ RF3 (Cálculo transparente): Task 6 (sin cambios, ya funciona)
- ✅ RF4 (Historial/Auditoría): No requiere cambios (ya funciona)
- ✅ Testing: Task 5 (manual), Task 7 (validación lógica)
- ✅ BACKLOG: Task 8 (actualizar estado)

**Placeholder Scan:** ✅ Sin "TBD", "TODO", o referencias incompletas

**Type Consistency:** ✅ `parseFloat(valor)`, `difference`, `precision` — consistentes

**No Gaps:** ✅ Todos los requisitos del spec tienen tareas

---

## Criterio de Completitud

- ✅ Frontend: Input sin restricción, validación sin `<= 0`, hints actualizados, signos dinámicos en preview
- ✅ Backend: Validación sin restricción, mensaje actualizado
- ✅ Testing: Casos manuales documentados
- ✅ Commits: Cada cambio con commit atómico descriptivo
- ✅ Push: Todos los cambios en rama `V_1.0.7`
- ✅ BACKLOG: BACKLOG-071 marcado como "🚀 Desarrollado"
