# UI Homogenization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify visual design across all management interfaces with consistent search patterns, buttons, icons, colors, and data display.

**Architecture:** Create reusable component library (SearchContainer, ActionButtons, StatusBadge) and refactor existing CRUD interfaces to use them. All listings limited to 20 items with dynamic search. Implement consistent styling with SCSS variables.

**Tech Stack:** React, SCSS, existing service layers (lookupService, planesV1Service, etc.)

---

## File Structure

**New Components (Reusable UI Library):**
- `frontend/src/components/SearchContainer/SearchContainer.jsx` - Unified search interface
- `frontend/src/components/SearchContainer/SearchContainer.scss` - Search styling
- `frontend/src/components/ActionButton/ActionButton.jsx` - Unified button styles
- `frontend/src/components/ActionButton/ActionButton.scss` - Button styling
- `frontend/src/components/StatusBadge/StatusBadge.jsx` - Status display with colors
- `frontend/src/components/StatusBadge/StatusBadge.scss` - Status styling

**Shared Variables:**
- `frontend/src/styles/_colors.scss` - Color constants for consistent theming
- `frontend/src/styles/_buttons.scss` - Button style definitions

**Modified Components:**
- `frontend/src/components/LookupCRUD/LookupCRUD.jsx` - Integrate SearchContainer and ActionButtons
- `frontend/src/components/LookupCRUD/LookupCRUD.scss` - Update styling
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` - Integrate components, limit to 20
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss` - Update for status colors, edit icon
- `frontend/src/pages/DashboardPage/components/MigrationsDashboard/MigrationsDashboard.jsx` - Add versions table
- `frontend/src/pages/DashboardPage/components/MigrationsDashboard/styles/MigrationsDashboard.scss` - Update styling

---

## Task 1: Create Shared Color Variables

**Files:**
- Create: `frontend/src/styles/_colors.scss`

- [ ] **Step 1: Create color variables file**

```scss
// Primary colors
$color-primary: #007bff;
$color-primary-hover: #0056b3;
$color-primary-light: #e7f3ff;

// Secondary colors
$color-secondary: #6c757d;
$color-secondary-hover: #5a6268;

// Status colors
$color-success: #28a745;
$color-success-bg: #f0f9f6;
$color-warning: #ffc107;
$color-warning-bg: #fff8e1;
$color-danger: #dc3545;
$color-danger-bg: #fff5f7;
$color-info: #17a2b8;
$color-info-bg: #e7f6f8;

// Suspension (red light background)
$color-suspended: #dc3545;
$color-suspended-bg: #ffe6e6;

// Neutral colors
$color-text: #333;
$color-text-muted: #666;
$color-text-light: #999;
$color-border: #e0e0e0;
$color-bg-light: #f5f5f5;
$color-white: #fff;

// Button colors
$color-btn-border: #d0d0d0;
$color-btn-hover-bg: #f0f0f0;
```

- [ ] **Step 2: Verify file created**

Run: `test -f frontend/src/styles/_colors.scss && echo "✓ File created"`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/_colors.scss
git commit -m "style: add shared color variables for UI consistency"
```

---

## Task 2: Create SearchContainer Component

**Files:**
- Create: `frontend/src/components/SearchContainer/SearchContainer.jsx`
- Create: `frontend/src/components/SearchContainer/SearchContainer.scss`

- [ ] **Step 1: Create SearchContainer component**

```jsx
import React from 'react';
import './SearchContainer.scss';

function SearchContainer({ 
  placeholder = 'Buscar...', 
  value, 
  onChange, 
  count = 0,
  maxItems = 20 
}) {
  return (
    <div className="search-container">
      <div className="search-container__input-wrapper">
        <input
          type="text"
          className="search-container__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search"
        />
        <span className="search-container__icon">🔍</span>
      </div>
      {count > 0 && (
        <div className="search-container__info">
          {count} de {maxItems} resultados
        </div>
      )}
    </div>
  );
}

export default SearchContainer;
```

- [ ] **Step 2: Create SearchContainer styles**

```scss
@import '../../styles/colors';

.search-container {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border: 1px solid $color-border;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px $color-primary-light;
    }

    &::placeholder {
      color: $color-text-light;
    }
  }

  &__icon {
    position: absolute;
    left: 10px;
    color: $color-text-muted;
    pointer-events: none;
  }

  &__info {
    font-size: 12px;
    color: $color-text-muted;
    padding: 0 4px;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SearchContainer/
git commit -m "feat: create SearchContainer component for unified search"
```

---

## Task 3: Create ActionButton Components

**Files:**
- Create: `frontend/src/components/ActionButton/ActionButton.jsx`
- Create: `frontend/src/components/ActionButton/ActionButton.scss`

- [ ] **Step 1: Create ActionButton component**

```jsx
import React from 'react';
import './ActionButton.scss';

function ActionButton({ 
  variant = 'primary',
  size = 'medium',
  icon = null,
  children,
  disabled = false,
  title = '',
  onClick,
  className = ''
}) {
  const baseClass = 'action-button';
  const variantClass = `${baseClass}--${variant}`;
  const sizeClass = `${baseClass}--${size}`;
  const classes = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {icon && <span className="action-button__icon">{icon}</span>}
      {children && <span className="action-button__text">{children}</span>}
    </button>
  );
}

export default ActionButton;
```

- [ ] **Step 2: Create ActionButton styles**

```scss
@import '../../styles/colors';

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // Variants
  &--primary {
    background-color: $color-primary;
    color: $color-white;

    &:hover:not(:disabled) {
      background-color: $color-primary-hover;
    }
  }

  &--secondary {
    background-color: $color-btn-border;
    color: $color-text;
    border: 1px solid $color-border;

    &:hover:not(:disabled) {
      background-color: $color-btn-hover-bg;
    }
  }

  &--danger {
    background-color: $color-danger;
    color: $color-white;

    &:hover:not(:disabled) {
      background-color: #c82333;
    }
  }

  &--icon {
    background: none;
    border: none;
    padding: 6px;
    color: $color-text;
    font-size: 16px;

    &:hover:not(:disabled) {
      color: $color-primary;
    }
  }

  // Sizes
  &--small {
    padding: 6px 12px;
    font-size: 12px;
  }

  &--medium {
    padding: 8px 16px;
    font-size: 14px;
  }

  &--large {
    padding: 12px 24px;
    font-size: 16px;
  }

  &__icon {
    font-size: 16px;
  }

  &__text {
    line-height: 1;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ActionButton/
git commit -m "feat: create ActionButton component for unified button styles"
```

---

## Task 4: Create StatusBadge Component

**Files:**
- Create: `frontend/src/components/StatusBadge/StatusBadge.jsx`
- Create: `frontend/src/components/StatusBadge/StatusBadge.scss`

- [ ] **Step 1: Create StatusBadge component**

```jsx
import React from 'react';
import './StatusBadge.scss';

function StatusBadge({ status, label = null }) {
  const statusLabel = label || status;
  const statusClass = `status-badge status-badge--${status.toLowerCase()}`;

  return (
    <span className={statusClass}>
      {statusLabel}
    </span>
  );
}

export default StatusBadge;
```

- [ ] **Step 2: Create StatusBadge styles**

```scss
@import '../../styles/colors';

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;

  &--activo {
    background-color: $color-success-bg;
    color: $color-success;
  }

  &--suspendido {
    background-color: $color-suspended-bg;
    color: $color-suspended;
  }

  &--pendiente {
    background-color: $color-warning-bg;
    color: #856404;
  }

  &--inactivo {
    background-color: $color-bg-light;
    color: $color-text-muted;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/StatusBadge/
git commit -m "feat: create StatusBadge component for status display"
```

---

## Task 5: Update LookupCRUD Component

**Files:**
- Modify: `frontend/src/components/LookupCRUD/LookupCRUD.jsx`
- Modify: `frontend/src/components/LookupCRUD/LookupCRUD.scss`

- [ ] **Step 1: Update LookupCRUD to import new components**

In `LookupCRUD.jsx`, add imports:

```jsx
import SearchContainer from '../SearchContainer/SearchContainer';
import ActionButton from '../ActionButton/ActionButton';
```

- [ ] **Step 2: Update LookupCRUD to limit results to 20 and add search**

In the component state, add:

```jsx
const [searchText, setSearchText] = useState('');
const ITEMS_PER_PAGE = 20;
```

In the render section, replace the button with:

```jsx
<ActionButton variant="primary" icon="+" onClick={() => handleOpenForm()}>
  Nuevo {singularName || 'Registro'}
</ActionButton>
```

Replace the search section with:

```jsx
{registros.length > 0 && (
  <SearchContainer
    placeholder={`Buscar ${titulo.toLowerCase()}...`}
    value={searchText}
    onChange={setSearchText}
    count={registrosFiltered.length}
    maxItems={ITEMS_PER_PAGE}
  />
)}
```

Add filtering logic:

```jsx
const registrosFiltered = registros
  .filter(registro => {
    const searchLower = searchText.toLowerCase();
    return Object.values(registro).some(val => 
      String(val).toLowerCase().includes(searchLower)
    );
  })
  .slice(0, ITEMS_PER_PAGE);
```

Replace table rendering to use `registrosFiltered` instead of `registros`.

Replace action buttons:

```jsx
<td className="acciones">
  <ActionButton 
    variant="icon" 
    icon="✎" 
    onClick={() => handleOpenForm(registro)} 
    title="Editar"
  />
  <ActionButton 
    variant="icon" 
    icon="🗑" 
    onClick={() => handleDelete(Object.values(registro)[0])} 
    title="Eliminar"
    className="action-button--danger"
  />
</td>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/LookupCRUD/LookupCRUD.jsx
git commit -m "refactor: update LookupCRUD to use SearchContainer and ActionButton components"
```

---

## Task 6: Update GestionPlanesV1 Component

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx`
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss`

- [ ] **Step 1: Update GestionPlanesV1 imports**

Add:

```jsx
import SearchContainer from '../../../../components/SearchContainer/SearchContainer';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import StatusBadge from '../../../../components/StatusBadge/StatusBadge';
```

- [ ] **Step 2: Add search and pagination limit to state**

```jsx
const ITEMS_PER_PAGE = 20;
```

Filter planes:

```jsx
const planesFiltered = planes
  .filter(plan => {
    const searchLower = searchText.toLowerCase();
    return (
      plan.numero_afiliado?.toLowerCase().includes(searchLower) ||
      plan.TipoDePlan?.tipo_plan_nombre?.toLowerCase().includes(searchLower) ||
      plan.Cobrador?.cobrador_apellido?.toLowerCase().includes(searchLower) ||
      plan.Cobrador?.cobrador_nombre?.toLowerCase().includes(searchLower) ||
      plan.ObraSocial?.os_nombre?.toLowerCase().includes(searchLower)
    );
  })
  .slice(0, ITEMS_PER_PAGE);
```

- [ ] **Step 3: Update button and search UI**

Replace:

```jsx
<button className="gestion-planes-v1__btn gestion-planes-v1__btn--primary" onClick={handleCrearPlan}>
  + Nuevo Plan
</button>
```

With:

```jsx
<ActionButton variant="primary" icon="+" onClick={handleCrearPlan}>
  Nuevo Plan
</ActionButton>
```

Replace the search input section with:

```jsx
{planes.length > 0 && (
  <SearchContainer
    placeholder="Buscar por número de afiliado, tipo de plan, cobrador u obra social..."
    value={searchText}
    onChange={setSearchText}
    count={planesFiltered.length}
    maxItems={ITEMS_PER_PAGE}
  />
)}
```

Use `planesFiltered` instead of `planes` in table rendering.

- [ ] **Step 4: Update status display in table**

In the table, replace the estado cell:

```jsx
<td>
  <StatusBadge status={plan.estado} />
</td>
```

Add SCSS for status cell styling (in GestionPlanesV1.scss):

```scss
td:has(.status-badge--suspendido) {
  background-color: #fff5f7;
}
```

- [ ] **Step 5: Update Edit button to use pencil icon**

In the table actions, replace:

```jsx
<button onClick={() => handleEditarPlan(plan)} title="Editar">
  ✎
</button>
```

With:

```jsx
<ActionButton 
  variant="icon" 
  icon="✎" 
  onClick={() => handleEditarPlan(plan)} 
  title="Editar"
/>
```

And delete button:

```jsx
<ActionButton 
  variant="icon" 
  icon="🗑" 
  onClick={() => handleSuspenderPlan(plan)} 
  title="Suspender"
  className="action-button--danger"
/>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/
git commit -m "refactor: update GestionPlanesV1 with SearchContainer, ActionButton, StatusBadge components"
```

---

## Task 7: Update MigrationsDashboard Component

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/MigrationsDashboard.jsx`
- Modify: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/styles/MigrationsDashboard.scss`

- [ ] **Step 1: Update MigrationsDashboard imports**

Add:

```jsx
import ActionButton from '../../../../components/ActionButton/ActionButton';
```

- [ ] **Step 2: Convert versions display to table format**

In the JSX, find the versions section and replace it with a table:

```jsx
{activeTab === 'versiones' && (
  <div className="migrations-dashboard__content">
    <h3>Versiones Disponibles</h3>
    {versions.length === 0 ? (
      <p className="migrations-dashboard__empty">No hay versiones disponibles</p>
    ) : (
      <table className="migrations-dashboard__versions-table">
        <thead>
          <tr>
            <th>Versión</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.version}>
              <td className="migrations-dashboard__version-number">v{v.version}</td>
              <td className="migrations-dashboard__version-status">
                {currentVersion === v.version ? (
                  <span className="migrations-dashboard__current">Actual</span>
                ) : currentVersion > v.version ? (
                  <span className="migrations-dashboard__previous">Anterior</span>
                ) : (
                  <span className="migrations-dashboard__available">Disponible</span>
                )}
              </td>
              <td className="migrations-dashboard__version-action">
                {currentVersion < v.version && (
                  <ActionButton
                    variant="primary"
                    size="small"
                    onClick={() => handleUpgrade(v.version)}
                    disabled={isLoading}
                  >
                    Actualizar
                  </ActionButton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
```

- [ ] **Step 3: Update history tab to also use table format**

Find history section and ensure it's in table format (should already be, just verify and update button styles):

```jsx
{activeTab === 'historial' && (
  <div className="migrations-dashboard__content">
    <h3>Historial de Migraciones</h3>
    {history.length === 0 ? (
      <p className="migrations-dashboard__empty">No hay historial disponible</p>
    ) : (
      <table className="migrations-dashboard__history-table">
        <thead>
          <tr>
            <th>Versión</th>
            <th>Dirección</th>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} className={`migrations-dashboard__history-row--${h.status}`}>
              <td>v{h.version}</td>
              <td>{h.direction}</td>
              <td>{new Date(h.timestamp).toLocaleString('es-AR')}</td>
              <td>{h.user || 'Sistema'}</td>
              <td>
                <span className={`migrations-dashboard__status--${h.status}`}>
                  {h.status === 'success' ? '✓' : '✗'} {h.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
```

- [ ] **Step 4: Add table styling to MigrationsDashboard.scss**

Add:

```scss
.migrations-dashboard__versions-table,
.migrations-dashboard__history-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;

  thead {
    background-color: #f5f5f5;
    border-bottom: 2px solid #e0e0e0;
  }

  th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    color: #333;
  }

  tbody tr {
    border-bottom: 1px solid #e0e0e0;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f9f9f9;
    }
  }

  td {
    padding: 12px;
    font-size: 14px;
    color: #333;
  }
}

.migrations-dashboard__current {
  display: inline-block;
  background-color: #e6f7ff;
  color: #0050b3;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.migrations-dashboard__previous {
  display: inline-block;
  background-color: #f5f5f5;
  color: #999;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.migrations-dashboard__available {
  display: inline-block;
  background-color: #f0f9f6;
  color: #28a745;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.migrations-dashboard__status--success {
  color: #28a745;
  font-weight: 600;
}

.migrations-dashboard__status--failed {
  color: #dc3545;
  font-weight: 600;
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/MigrationsDashboard/
git commit -m "refactor: convert MigrationsDashboard versions and history to table format with ActionButton"
```

---

## Task 8: Update Other Lookup Components

**Files:**
- All lookup components in `frontend/src/pages/DashboardPage/components/` (GestionAfiliados, GestionGruposFamiliares, ObrasSociales, ServiciosAdicionales, TiposDeGrupo, TiposDePlan)

- [ ] **Step 1: Update all lookup component styles**

Since all these components use LookupCRUD, they automatically inherit the updates from Task 5. Only need to verify their SCSS files and update any component-specific styling.

For each component (GestionAfiliados, etc.), check if there's a custom SCSS file and ensure it doesn't override the new styles.

Update any SCSS files that import or override button/search styles to use the new variables from `_colors.scss`.

- [ ] **Step 2: Test all lookup components**

Start dev server and verify:
- Cobradores loads with SearchContainer and updated buttons
- ObrasSociales loads with SearchContainer and updated buttons
- ServiciosAdicionales loads with SearchContainer and updated buttons
- TiposDeGrupo loads with SearchContainer and updated buttons
- TiposDePlan loads with SearchContainer and updated buttons
- GestionAfiliados loads with SearchContainer and updated buttons

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/*/GestionAfiliados.scss
git add frontend/src/pages/DashboardPage/components/*/GestionGruposFamiliares.scss
git add frontend/src/pages/DashboardPage/components/*/ObrasSociales.scss
git add frontend/src/pages/DashboardPage/components/*/ServiciosAdicionales.scss
git add frontend/src/pages/DashboardPage/components/*/TiposDeGrupo.scss
git add frontend/src/pages/DashboardPage/components/*/TiposDePlan.scss
git commit -m "style: update all lookup components to use consistent styling"
```

---

## Task 9: Manual Testing

- [ ] **Test GestionPlanesV1:**
  - Verify search field appears and filters correctly
  - Verify max 20 items displayed
  - Verify "SUSPENDIDO" status has red background
  - Verify pencil icon shows for Edit action
  - Verify "+ Nuevo Plan" button uses ActionButton style

- [ ] **Test LookupCRUD Components:**
  - Verify Cobradores shows SearchContainer with dynamic search
  - Verify all results limited to 20 max
  - Verify button icons are consistent (✎ for edit, 🗑 for delete)
  - Verify "+ Nuevo" button uses ActionButton style

- [ ] **Test MigrationsDashboard:**
  - Verify versions section displays as table
  - Verify history section displays as table
  - Verify status badges (Actual, Anterior, Disponible) show correctly
  - Verify update buttons work in versions table

- [ ] **Cross-browser Testing:**
  - Test in Chrome, Firefox, Safari
  - Verify responsive design on mobile (tables may need horizontal scroll)

---

