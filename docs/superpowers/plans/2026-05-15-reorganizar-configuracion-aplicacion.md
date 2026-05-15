# Reorganizar "Configuración de la Aplicación" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar la página de configuración UI con nuevo orden de secciones, unificar dos secciones de configuración y estandarizar el estilo de parámetros.

**Architecture:** 
1. Renombrar menú en DashboardPage.jsx de "Configuración UI" a "Configuración de la Aplicación"
2. Reorganizar ConfiguracionNotificaciones.jsx con nuevo orden: Redondeo → UI unificada → Notificaciones → Auditoría
3. Consolidar "Configuración de búsquedas" y "Configuración UI" en una única sección llamada "Configuración UI"
4. Actualizar estilo de parámetro redondeo_precision para que tenga icono + color + borde como otros parámetros

**Tech Stack:** React, SCSS, BEM naming convention

---

## File Structure

**Modified Files:**
- `frontend/src/pages/DashboardPage/DashboardPage.jsx` — Renombrar label del menú
- `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx` — Reorganizar secciones, unificar, actualizar estilos
- `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.scss` — Agregar estilos nuevos si es necesario

---

## Task 1: Renombrar Menú en DashboardPage

**Files:**
- Modify: `frontend/src/pages/DashboardPage/DashboardPage.jsx:83`

- [ ] **Step 1: Locate the menu item**

In `DashboardPage.jsx` at line 83, find:
```javascript
{ key: 'configuracion-notificaciones', label: 'Configuración UI' },
```

- [ ] **Step 2: Update the label**

Change to:
```javascript
{ key: 'configuracion-notificaciones', label: 'Configuración de la Aplicación' },
```

- [ ] **Step 3: Verify change in editor**

Confirm the label is updated and the key remains the same (`configuracion-notificaciones`).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/DashboardPage/DashboardPage.jsx
git commit -m "feat(configuracion): renombrar menú 'Configuración UI' a 'Configuración de la Aplicación'"
```

---

## Task 2: Reorganizar ConfiguracionNotificaciones - Reorder Sections

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx` — Complete restructuring

**Current Order:**
1. Configuración de Notificaciones (lines 183-258)
2. Configuración de Búsquedas (lines 261-330)
3. Configuración UI (lines 333-403)
4. Configuración de Auditoría (lines 406-516)
5. Redondeo de Cuotas (lines 519-589)

**New Order:**
1. Redondeo de Cuotas
2. Configuración UI (merged from "Configuración de búsquedas" + "Configuración UI")
3. Configuración de Notificaciones
4. Configuración de Auditoría

- [ ] **Step 1: Extract Redondeo section code**

Copy the entire Redondeo de Cuotas section (lines 518-589) to a temporary location. This includes:
- Header section (lines 518-523)
- Table wrapper with all rows (lines 525-573)
- Info section (lines 575-589)

- [ ] **Step 2: Move Redondeo section to top**

Place it immediately after the page header and before Configuración UI.

**Position:** After line 187 (after initial header in `configuracion-notificaciones`)

- [ ] **Step 3: Extract and merge Búsqueda + UI sections**

Create a new unified "Configuración UI" section that contains:
- Header: "Configuración UI" (update subtitle if needed)
- Debounce row from Búsqueda section (lines 279-320)
- Items por página row from UI section (lines 351-391)

- [ ] **Step 4: Position merged section**

Place the merged "Configuración UI" section immediately after Redondeo.

- [ ] **Step 5: Move Notificaciones section**

Move the Configuración de Notificaciones section to third position (after merged UI section).

- [ ] **Step 6: Keep Auditoría section last**

Ensure Configuración de Auditoría remains in its position as the final section.

---

## Task 3: Update Redondeo Parameter Styling

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx` — Redondeo row styling

Current redondeo_precision row (line 536-570) uses plain text for parameter name. Need to convert to styled badge like other parameters.

- [ ] **Step 1: Locate redondeo_precision row**

Find the redondeo section redondeo_precision row (currently line 536):
```jsx
<tr>
  <td><strong>redondeo_precision</strong></td>
  ...
</tr>
```

- [ ] **Step 2: Update TD to use styled badge**

Replace the plain text TD with a styled badge similar to other parameters (items_per_page, audit_enabled, etc.):

```jsx
<tr>
  <td>
    <span className="configuracion-notificaciones__tipo-badge" style={{ backgroundColor: '#fffaeb', color: '#b45309', borderLeftColor: '#b45309' }}>
      <span className="configuracion-notificaciones__icon">📐</span>
      Redondeo de Precisión
    </span>
  </td>
  <td>Precisión de redondeo (hacia arriba) en aumento masivo de cuotas</td>
  {/* rest of the row remains the same */}
</tr>
```

- [ ] **Step 3: Verify styling matches other badges**

Ensure the badge styling (background color, text color, border-left color, icon, padding) matches the pattern used for:
- Items por página (line 352-356)
- audit_enabled (line 427-430)
- audit_retention_days (line 467-470)

Colors used elsewhere:
- Purple/Magenta: `#f3e5f5` bg, `#7b1fa2` text/border
- Green: `#e8f5e9` bg, `#2e7d32` text/border
- Blue: `#e3f2fd` bg, `#1976d2` text/border

Use amber/yellow for Redondeo: `#fffaeb` (bg), `#b45309` (text/border)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx
git commit -m "feat(configuracion): actualizar estilo de redondeo_precision con badge consistente"
```

---

## Task 4: Complete JSX Refactoring - Remove Duplicate Sections

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx` — Final cleanup

After Tasks 2 & 3, the component will have sections in new order but may have duplicate headers/wrappers. Clean up:

- [ ] **Step 1: Remove old "Configuración de Búsquedas" header**

Remove the entire section header (lines ~261-266):
```jsx
<div className="configuracion-notificaciones__header" style={{ marginTop: '2rem' }}>
  <h2>Configuración de Búsquedas</h2>
  <p className="configuracion-notificaciones__subtitle">
    Ajusta los tiempos de espera para las búsquedas por texto
  </p>
</div>
```

- [ ] **Step 2: Remove old "Configuración UI" header**

Remove the duplicate header (lines ~333-338):
```jsx
<div className="configuracion-notificaciones__header" style={{ marginTop: '2rem' }}>
  <h2>Configuración UI</h2>
  <p className="configuracion-notificaciones__subtitle">
    Ajusta parámetros de la interfaz de usuario
  </p>
</div>
```

- [ ] **Step 3: Update merged UI header subtitle**

The merged "Configuración UI" header should have an updated subtitle that reflects both functionality:
```jsx
<p className="configuracion-notificaciones__subtitle">
  Ajusta parámetros de búsquedas y interfaz de usuario
</p>
```

- [ ] **Step 4: Verify section order visually**

Final order in component JSX should be:
1. Redondeo de Cuotas (header + table + info)
2. Configuración UI (header + merged table with debounce + items per page + info)
3. Configuración de Notificaciones (header + table + info)
4. Configuración de Auditoría (header + table + info)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx
git commit -m "feat(configuracion): reorganizar secciones - redondeo primero, UI unificada, notificaciones, auditoría"
```

---

## Task 5: Verify and Test

**Files:**
- Test: `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx`

- [ ] **Step 1: Check visual layout in browser**

1. Navigate to admin panel → "Configuración de la Aplicación" (previously "Configuración UI")
2. Verify menu label changed

- [ ] **Step 2: Verify section order**

Scroll down and confirm sections appear in this order:
1. **Redondeo de Cuotas** — with styled badge icon (📐)
2. **Configuración UI** — with 2 parameters (Debounce, Items per página)
3. **Configuración de Notificaciones** — with 4 types (error, warning, success, info)
4. **Configuración de Auditoría** — with 2 parameters (Habilitación, Retención)

- [ ] **Step 3: Test redondeo_precision styling**

1. Scroll to Redondeo de Cuotas section
2. Verify "Redondeo de Precisión" row shows:
   - Icon (📐)
   - Colored background (amber/yellow)
   - Colored border-left (amber/yellow)
   - Matching font weight and padding as other badges

- [ ] **Step 4: Test unified UI section**

1. Confirm "Configuración de búsquedas" and "Configuración UI" are now in a single section
2. Table shows both parameters (debounce + items per page) in the same table
3. Single info section below with tips for both parameters combined or separate

- [ ] **Step 5: Test parameter updates**

1. Change a value in each section (e.g., debounce delay, items per page, redondeo precision)
2. Click save button
3. Verify notification appears: "Duración de [parameter] actualizada..."
4. Refresh page
5. Verify values persisted

- [ ] **Step 6: Final commit**

```bash
git add frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx
git commit -m "test(configuracion): verificar reorganización y estilos de configuración"
```

---

## Task 6: Push Changes

**Files:**
- All modified files are committed

- [ ] **Step 1: Check git status**

```bash
git status
```

Expected: No uncommitted changes (all committed in previous tasks)

- [ ] **Step 2: Push branch**

```bash
git push origin V_1.0.7
```

Expected: Branch updated on remote

- [ ] **Step 3: Verify remote**

Check GitHub/remote that commits are visible on the branch.

---

## Summary of Changes

| Component | Changes |
|-----------|---------|
| DashboardPage.jsx | Rename menu label: "Configuración UI" → "Configuración de la Aplicación" |
| ConfiguracionNotificaciones.jsx | Reorganize sections (Redondeo → UI → Notificaciones → Auditoría), merge Búsqueda + UI, style redondeo_precision |
| Browser UI | Visual changes: new section order, styled redondeo badge, unified UI section |

---

## Verification Checklist

- [ ] Menu label changed in sidebar
- [ ] Redondeo section appears first
- [ ] Configuración UI has both debounce + items per página
- [ ] Redondeo_precision has colored badge with icon
- [ ] All sections functional (save/update working)
- [ ] Styling consistent across all badges
- [ ] Changes pushed to remote
