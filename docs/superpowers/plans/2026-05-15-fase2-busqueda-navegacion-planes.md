# Fase 2: Búsqueda y Navegación en Tabla de Gestión de Planes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor search to only match plan holder surname (BACKLOG-072) and implement keyboard navigation with active row highlighting (BACKLOG-073).

**Architecture:** Frontend-only changes to GestionPlanesV1 component. Search filtering happens client-side on current page results. Keyboard navigation maintains an `activeRowId` state and auto-paginates when reaching page boundaries. ALT+G opens the active row in edit mode.

**Tech Stack:** React, SCSS, no backend changes needed.

---

## Files Modified

| File | Responsibility |
|------|-----------------|
| `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` | Main component: search logic, keyboard navigation state, handlers, row rendering with active class |
| `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss` | Add `.gestion-planes-v1__row--active` styles with left border highlight |

---

## Task 1: Change Search to Match Only Plan Holder Surname (BACKLOG-072)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx:104-116`

This task isolates search to ONLY match `plan.PlanIntegrantes[0].Persona.apellido` as per BACKLOG-072 requirements.

- [ ] **Step 1: Locate current search filtering logic**

In `GestionPlanesV1.jsx`, lines 104-116 contain:
```javascript
const planesFiltered = planes.filter(plan => {
  const searchLower = searchText.toLowerCase();
  return (
    plan.numero_afiliado?.toLowerCase().includes(searchLower) ||
    plan.Zona?.codigo?.toLowerCase().includes(searchLower) ||
    plan.TipoDePlan?.tipo_plan_nombre?.toLowerCase().includes(searchLower) ||
    plan.Cobrador?.cobrador_apellido?.toLowerCase().includes(searchLower) ||
    plan.Cobrador?.cobrador_nombre?.toLowerCase().includes(searchLower) ||
    plan.ObraSocial?.os_nombre?.toLowerCase().includes(searchLower) ||
    plan.PlanIntegrantes?.[0]?.Persona?.apellido?.toLowerCase().includes(searchLower) ||
    plan.PlanIntegrantes?.[0]?.Persona?.nombre?.toLowerCase().includes(searchLower)
  );
});
```

- [ ] **Step 2: Replace with surname-only search**

Replace lines 104-116 with:
```javascript
const planesFiltered = planes.filter(plan => {
  const searchLower = searchText.toLowerCase();
  return plan.PlanIntegrantes?.[0]?.Persona?.apellido?.toLowerCase().includes(searchLower);
});
```

- [ ] **Step 3: Update search placeholder text**

Update line 267 placeholder from:
```javascript
placeholder="Buscar por identificador, titular, tipo de plan, cobrador u obra social... (presiona Enter para buscar inmediatamente)"
```

To:
```javascript
placeholder="Buscar por apellido del titular... (presiona Enter para buscar inmediatamente)"
```

- [ ] **Step 4: Verify changes in browser**

Run `npm start` in `frontend/` and navigate to Planes section. Test that:
- Typing a plan holder's surname filters results (e.g., "García" shows only plans with García as titular)
- Other search terms (identificador, tipo de plan, cobrador, obra social) no longer filter results
- Reset/clear search works correctly

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx
git commit -m "feat(gestion-planes): limitar búsqueda solo a apellido del titular (BACKLOG-072)"
git push origin V_1.0.7
```

---

## Task 2: Add Active Row Styles (Preparation for BACKLOG-073)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss`

Add CSS class for the active/highlighted row that will be applied when a row is navigated to.

- [ ] **Step 1: Add `.gestion-planes-v1__row--active` style block**

Add this after line 243 (after the `tbody tr` styles):

```scss
tbody tr {
  &.gestion-planes-v1__row--active {
    background-color: var(--color-primary-light);
    border-left: 4px solid var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }
}
```

Full context (replace lines 231-237):
```scss
tbody tr {
  border-bottom: 1px solid var(--color-border);

  &:hover {
    background-color: var(--color-primary-light);
  }

  &.gestion-planes-v1__row--active {
    background-color: var(--color-primary-light);
    border-left: 4px solid var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }
}
```

- [ ] **Step 2: Verify SCSS compiles**

Run `npm start` in `frontend/` — ensure no SCSS errors. You don't need to test visual styling yet (no rows marked active), just compilation.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss
git commit -m "style(gestion-planes): agregar estilos para fila activa (preparación BACKLOG-073)"
git push origin V_1.0.7
```

---

## Task 3: Add Active Row State and Base Event Listener (BACKLOG-073 - Part 1)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx:24-54`

Add state for tracking the active row ID and set up a keyboard event listener on the component.

- [ ] **Step 1: Add `activeRowId` state**

After line 53 (`const [totalPages, setTotalPages] = useState(0);`), add:

```javascript
const [activeRowId, setActiveRowId] = useState(null);
```

Full state section (lines 24-54 become 24-55):
```javascript
function GestionPlanesV1() {
  console.log('[GestionPlanesV1] Mounting component');
  const { isAdmin } = useAuth();
  const { config: globalConfig } = useConfig();
  console.log('[GestionPlanesV1] isAdmin:', isAdmin);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [modalMode, setModalMode] = useState(null);
  const [planEditando, setPlanEditando] = useState(null);
  const [filtros, setFiltros] = useState({ estado: '', cobrador: '', obraSocial: '' });
  const [searchText, setSearchText] = useState('');
  const [debounceDelay, setDebounceDelay] = useState(globalConfig?.debounce_delay_ms ?? 2000);
  const [forceSearchNow, setForceSearchNow] = useState(false);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [generarRecibosModalOpen, setGenerarRecibosModalOpen] = useState(false);
  const [historialAumentosModalOpen, setHistorialAumentosModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState({
    firstModal: false,
    secondModal: false,
    selectedPlan: null,
    isLoading: false,
    error: null,
  });
  const [configItemsPerPage, setConfigItemsPerPage] = useState(globalConfig?.items_per_page ?? 15);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeRowId, setActiveRowId] = useState(null);
```

- [ ] **Step 2: Reset active row when filters/sort/page changes**

Update the `useEffect` at lines 99-101 to also reset activeRowId:

Replace:
```javascript
// Resetear página a 1 cuando cambian filtros, ordenamiento o limit
useEffect(() => {
  setPage(1);
}, [sortBy, order, filtros, configItemsPerPage]);
```

With:
```javascript
// Resetear página a 1 cuando cambian filtros, ordenamiento o limit
useEffect(() => {
  setPage(1);
  setActiveRowId(null);
}, [sortBy, order, filtros, configItemsPerPage]);
```

- [ ] **Step 3: Set initial active row on data load**

After the `cargar()` dependency (line 96), add a new useEffect to set the first row as active when planes load:

```javascript
// Establecer primera fila como activa cuando los planes cargan
useEffect(() => {
  if (planesFiltered && planesFiltered.length > 0 && !activeRowId) {
    setActiveRowId(planesFiltered[0].plan_numero);
  }
}, [planesFiltered, activeRowId]);
```

Insert this after line 121 (after the cargar useEffect).

- [ ] **Step 4: Verify state updates work**

Run `npm start` and check React DevTools:
- Initial load: `activeRowId` should be null, then set to first plan's `plan_numero` after data loads
- After filtering: `activeRowId` should reset to null

Don't worry about rendering yet — just state management.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx
git commit -m "feat(gestion-planes): agregar estado activeRowId y reset automático (BACKLOG-073)"
git push origin V_1.0.7
```

---

## Task 4: Implement Keyboard Navigation Handler (BACKLOG-073 - Part 2)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx:130-250`

Add the keyboard event handler and navigation logic for ↑/↓, Page Up/Down, and ALT+G.

- [ ] **Step 1: Add keyboard navigation handler function**

After line 130 (`handleSearchKeyDown`), add this handler:

```javascript
const handleKeyDown = (e) => {
  // Only listen if no modal is open and table has rows
  if (modalMode || planesFiltered.length === 0) return;

  const key = e.key.toLowerCase();
  const altKey = e.altKey;

  // ALT+G: Edit active row
  if (altKey && key === 'g') {
    e.preventDefault();
    const activeRow = planesFiltered.find(p => p.plan_numero === activeRowId);
    if (activeRow) {
      handleEditarPlan(activeRow);
    }
    return;
  }

  // Navigation keys
  let newActiveIndex = planesFiltered.findIndex(p => p.plan_numero === activeRowId);
  if (newActiveIndex === -1) newActiveIndex = 0;

  let targetIndex = newActiveIndex;

  switch (key) {
    case 'arrowup': // Single row up
      e.preventDefault();
      targetIndex = Math.max(0, newActiveIndex - 1);
      break;
    case 'arrowdown': // Single row down
      e.preventDefault();
      targetIndex = Math.min(planesFiltered.length - 1, newActiveIndex + 1);
      break;
    case 'pageup': // 10 rows up
      e.preventDefault();
      targetIndex = Math.max(0, newActiveIndex - 10);
      break;
    case 'pagedown': // 10 rows down
      e.preventDefault();
      targetIndex = Math.min(planesFiltered.length - 1, newActiveIndex + 10);
      break;
    default:
      return; // Not a navigation key
  }

  // Set the new active row
  const newActivePlan = planesFiltered[targetIndex];
  if (newActivePlan) {
    setActiveRowId(newActivePlan.plan_numero);

    // Auto-paginate if the target row is not on current page
    const planeOnCurrentPage = planesFiltered.slice(
      (page - 1) * configItemsPerPage,
      page * configItemsPerPage
    );
    const isRowOnCurrentPage = planeOnCurrentPage.some(p => p.plan_numero === newActivePlan.plan_numero);

    if (!isRowOnCurrentPage && totalPages > 1) {
      // Calculate which page the target row is on
      const targetPage = Math.ceil((targetIndex + 1) / configItemsPerPage);
      setPage(Math.max(1, Math.min(targetPage, totalPages)));
    }
  }
};
```

- [ ] **Step 2: Add keyboard event listener effect**

After the useEffect at line 121, add a new useEffect to attach/detach the keyboard listener:

```javascript
// Attach keyboard listener for navigation
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [handleKeyDown, planesFiltered, page, configItemsPerPage, totalPages, activeRowId, modalMode]);
```

**Important:** This useEffect depends on `handleKeyDown`, which means `handleKeyDown` must be wrapped in `useCallback` to prevent infinite listener re-attachments.

- [ ] **Step 3: Wrap `handleKeyDown` in `useCallback`**

The `handleKeyDown` function from Step 1 needs to be wrapped. Replace the plain function with:

```javascript
const handleKeyDown = useCallback((e) => {
  // Only listen if no modal is open and table has rows
  if (modalMode || planesFiltered.length === 0) return;

  const key = e.key.toLowerCase();
  const altKey = e.altKey;

  // ALT+G: Edit active row
  if (altKey && key === 'g') {
    e.preventDefault();
    const activeRow = planesFiltered.find(p => p.plan_numero === activeRowId);
    if (activeRow) {
      handleEditarPlan(activeRow);
    }
    return;
  }

  // Navigation keys
  let newActiveIndex = planesFiltered.findIndex(p => p.plan_numero === activeRowId);
  if (newActiveIndex === -1) newActiveIndex = 0;

  let targetIndex = newActiveIndex;

  switch (key) {
    case 'arrowup':
      e.preventDefault();
      targetIndex = Math.max(0, newActiveIndex - 1);
      break;
    case 'arrowdown':
      e.preventDefault();
      targetIndex = Math.min(planesFiltered.length - 1, newActiveIndex + 1);
      break;
    case 'pageup':
      e.preventDefault();
      targetIndex = Math.max(0, newActiveIndex - 10);
      break;
    case 'pagedown':
      e.preventDefault();
      targetIndex = Math.min(planesFiltered.length - 1, newActiveIndex + 10);
      break;
    default:
      return;
  }

  const newActivePlan = planesFiltered[targetIndex];
  if (newActivePlan) {
    setActiveRowId(newActivePlan.plan_numero);

    const planeOnCurrentPage = planesFiltered.slice(
      (page - 1) * configItemsPerPage,
      page * configItemsPerPage
    );
    const isRowOnCurrentPage = planeOnCurrentPage.some(p => p.plan_numero === newActivePlan.plan_numero);

    if (!isRowOnCurrentPage && totalPages > 1) {
      const targetPage = Math.ceil((targetIndex + 1) / configItemsPerPage);
      setPage(Math.max(1, Math.min(targetPage, totalPages)));
    }
  }
}, [modalMode, planesFiltered, page, configItemsPerPage, totalPages, activeRowId, handleEditarPlan]);
```

- [ ] **Step 4: Verify navigation in browser**

Run `npm start` and:
- Click on the table to focus it (important for keyboard events to register)
- Press ↑/↓ to move between rows — each row should highlight with the active style
- Press Page Up/Page Down to jump 10 rows
- Check that when you reach a boundary (first/last row), navigation stops
- Check that pages auto-change when navigating past current page boundaries
- Press ALT+G on any row — should open the edit modal for that row
- **DO NOT test with actual modal open yet** — handler should do nothing

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx
git commit -m "feat(gestion-planes): agregar navegación por teclado (↑↓PageUp/Down, ALT+G)"
git push origin V_1.0.7
```

---

## Task 5: Apply Active Row Class to Rendered Rows (BACKLOG-073 - Part 3)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx:351-387`

Update the row rendering to apply the `.gestion-planes-v1__row--active` class when `activeRowId` matches the plan.

- [ ] **Step 1: Update tbody row rendering**

Replace lines 351-387 (the `map` inside `<tbody>`):

Replace:
```javascript
{planesFiltered.map((plan) => (
  <tr key={plan.plan_numero}>
```

With:
```javascript
{planesFiltered.map((plan) => (
  <tr 
    key={plan.plan_numero}
    className={activeRowId === plan.plan_numero ? 'gestion-planes-v1__row--active' : ''}
  >
```

Keep the rest of the row content unchanged (lines 353-385 stay the same).

Full updated row (lines 351-387):
```javascript
{planesFiltered.map((plan) => (
  <tr 
    key={plan.plan_numero}
    className={activeRowId === plan.plan_numero ? 'gestion-planes-v1__row--active' : ''}
  >
    <td>
      {plan.Zona?.codigo
        ? `${plan.Zona.codigo}-${formatNumeroAfiliado(plan.numero_afiliado)}`
        : formatNumeroAfiliado(plan.numero_afiliado)}
    </td>
    <td>
      {plan.PlanIntegrantes?.[0]?.Persona
        ? `${plan.PlanIntegrantes[0].Persona.apellido}, ${plan.PlanIntegrantes[0].Persona.nombre}`
        : '—'}
    </td>
    <td>{plan.TipoDePlan?.tipo_plan_nombre || '—'}</td>
    <td>{plan.Cobrador?.cobrador_apellido}, {plan.Cobrador?.cobrador_nombre}</td>
    <td>{plan.ObraSocial?.os_nombre || '—'}</td>
    <td>
      <StatusBadge status={plan.estado} />
    </td>
    <td className="table-actions">
      <div className="action-button-group">
        <ActionButton
          variant="primary"
          icon="✎"
          title="Editar"
          onClick={() => handleEditarPlan(plan)}
        />
        <IconButton
          icon="delete"
          title="Eliminar o Suspender"
          onClick={() => handleDeletePlan(plan)}
          className="icon-button--danger"
        />
      </div>
    </td>
  </tr>
))}
```

- [ ] **Step 2: Verify styling in browser**

Run `npm start` and:
- Navigate with ↑/↓ — rows should now highlight with the active style (primary color background + left border)
- The active row should be visually distinct from hover state
- Styling should persist as you navigate between rows

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx
git commit -m "feat(gestion-planes): resaltar fila activa en tabla"
git push origin V_1.0.7
```

---

## Task 6: Comprehensive Manual Testing (BACKLOG-072 & BACKLOG-073)

**Files:**
- Test: Interactive browser testing (no code changes)

Verify both features work together in all scenarios.

- [ ] **Step 1: Test search-only-surname filter**

1. Load Planes page
2. In search box, type "García" (or any actual surname from your DB)
3. Verify:
   - Only rows with that surname in `plan.PlanIntegrantes[0].Persona.apellido` appear
   - Identify number, tipo plan, cobrador, obra social fields don't filter results
4. Clear search box — all rows return
5. Type "plan-number" (e.g., "001") — should NOT filter (we removed identificador)
6. Type "cobrador-name" (e.g., "Juan") — should NOT filter (we removed cobrador)
7. Type "Obra" (part of an obra social name) — should NOT filter

- [ ] **Step 2: Test keyboard navigation - basic movement**

1. Load Planes page (must have 3+ plans)
2. Click on the table to focus it (important for keyboard capture)
3. Press ↓ arrow key 3 times — active row moves down 3 rows with visual highlight
4. Press ↑ arrow key 2 times — active row moves up 2 rows
5. Press ↑ at the first row — active row stays at first (no wrapping)
6. Press ↓ at the last row of current page — active row stays at last visible

- [ ] **Step 3: Test keyboard navigation - pagination**

1. Load Planes page, ensure pagination is visible (more than configItemsPerPage rows)
2. Navigate to first row (↑ several times if needed)
3. Press ↓ repeatedly until you pass the last row on current page
4. Verify: page auto-increments and active row continues moving down on next page
5. Press ↑ repeatedly from last row to go back through pages — page should auto-decrement

- [ ] **Step 4: Test Page Up/Down**

1. Load Planes page with 30+ items
2. Navigate ↑ to first row
3. Press Page Down — active row jumps down ~10 rows (actual count: 10 or less if fewer rows remain)
4. Press Page Down again — jumps another ~10 rows
5. Press Page Up — jumps back up ~10 rows
6. At last row, press Page Down — stays at last row (no wrapping)

- [ ] **Step 5: Test ALT+G hotkey**

1. Load Planes page
2. Click on table to focus
3. Navigate to any row using ↑/↓
4. Press ALT+G
5. Verify: Edit modal opens with the active row's plan data
6. Cancel or save — return to table with same active row highlighted

- [ ] **Step 6: Test active row reset on filter/sort changes**

1. Load Planes page, navigate to row #5 (e.g., 5th row in the list)
2. Type in search box (surname filter) — active row resets to first filtered result
3. Clear search — active row should reset to first row of unfiltered list
4. Click on a column header to sort — active row resets to first row
5. Change items-per-page setting (if available) — active row resets

- [ ] **Step 7: Test delete interaction**

1. Navigate to a row with ↓
2. Click the delete icon (not ALT+G, the actual delete button) on the active row
3. Delete modal appears
4. Cancel or delete — after action, active row should still exist or reset appropriately

- [ ] **Step 8: Browser console check**

1. Open DevTools console
2. Perform all navigation tests
3. Verify: No errors, no warnings about missing keys, no console spam
4. Check specifically for keyboard event handling errors

- [ ] **Step 9: Commit test results**

No code changes, but document any bugs found:

```bash
git log --oneline -5
```

Verify the 5 most recent commits include all feature commits. If any test revealed bugs, create a bug entry in `BUGS.md` before proceeding.

---

## Spec Coverage Verification

| Requirement | Task | Status |
|-------------|------|--------|
| BACKLOG-072: Search only by appellant surname | Task 1, 3 | ✅ Implemented |
| BACKLOG-073: Keyboard navigation ↑↓ | Task 4, 5 | ✅ Implemented |
| BACKLOG-073: Page Up/Down 10 rows | Task 4, 5 | ✅ Implemented |
| BACKLOG-073: ALT+G edit hotkey | Task 4, 5 | ✅ Implemented |
| BACKLOG-073: Auto-paginate on boundaries | Task 4 | ✅ Implemented |
| BACKLOG-073: Visual highlight (left border) | Task 2, 5 | ✅ Implemented |
| BACKLOG-073: Reset on filter/sort/page change | Task 3 | ✅ Implemented |

---

## Notes for Implementation

### Search Performance
- Client-side filtering on `planesFiltered` array (current page only)
- No API changes required
- Search happens in browser, instant

### Keyboard Navigation Safety
- Only active when no modal is open (`if (modalMode)` check)
- `useCallback` prevents excessive listener re-attachments
- Listener attached/detached on component mount/unmount

### Active Row Persistence
- `activeRowId` is the primary key (`plan_numero`)
- Resets when data changes (filters, sort)
- Auto-selects first row on initial load and after resets

### Testing Strategy
- Manual browser testing only (no Jest tests for keyboard/UI interactions)
- Test all happy paths + boundary conditions (first/last row, pagination edges)
- Verify no console errors during testing
