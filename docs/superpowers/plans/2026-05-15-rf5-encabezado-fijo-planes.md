# RF5: Encabezado Fijo en Tabla de Planes - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructurar el layout de GestionPlanesV1 para mantener el encabezado (título, búsqueda, botones) y la fila de columnas fijos al hacer scroll vertical en la tabla.

**Architecture:** Dividir el componente en tres secciones con Flexbox: sticky-header (fijo), table-scrollable (contenedor con overflow), y paginación (se desplaza). Usar CSS `position: sticky` para filas de encabezado.

**Tech Stack:** React, SCSS, CSS Flexbox, position: sticky

---

## File Structure

**Archivos a modificar:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` — Reestructuración HTML, envolver en containers
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss` — Agregar estilos para sticky header y table container

**Sin cambios:**
- Lógica de estado, servicios, modales, hooks

---

## Tasks

### Task 1: Preparar el componente - Review de estructura actual

**Files:**
- Review: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx:150-220`

- [ ] **Step 1: Revisar la estructura del JSX actual**

Lee las líneas 150-220 del archivo para entender dónde está el título, filtros, header, tabla y paginación. Confirma mentalmente la estructura actual antes de refactorizar.

- [ ] **Step 2: Abrir el archivo en el editor**

Abre `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` para edición.

---

### Task 2: Reestructurar HTML - Envolver el header en sticky-header

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx:170-215`

- [ ] **Step 1: Crear la estructura de sticky-header**

Localiza la sección que comienza con `<h1 className="gestion-planes-v1__title">Planes</h1>` (alrededor de la línea 170).

Envuelve el título, filtros y header (acciones) en un nuevo div con clase `gestion-planes-v1__sticky-header`. La estructura debe ser:

```jsx
{isAdmin && (
  <div className="gestion-planes-v1__sticky-header">
    <h1 className="gestion-planes-v1__title">Planes</h1>

    <div className="gestion-planes-v1__filters">
      {/* searchText state aquí */}
      <SearchContainer
        placeholder="Buscar por número de afiliado, zona, tipo de plan..."
        value={searchText}
        onChange={setSearchText}
        onSearchClick={() => setForceSearchNow(!forceSearchNow)}
      />
      {/* filtros de estado, cobrador, obra social */}
    </div>

    <div className="gestion-planes-v1__header">
      <div className="gestion-planes-v1__actions">
        {/* botones: Nuevo Plan, Aumento Masivo, etc. */}
        <ActionButton
          variant="primary"
          onClick={() => setModalMode('crear')}
        >
          Nuevo Plan
        </ActionButton>
        {/* ... resto de botones */}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Verificar que el cierre del div sticky-header está antes de la tabla**

El `</div>` que cierra `gestion-planes-v1__sticky-header` debe estar inmediatamente antes de `{planes.length === 0 ? ... : <div className="table-wrapper">}`

---

### Task 3: Reestructurar HTML - Envolver tabla en table-scrollable

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx:216-310`

- [ ] **Step 1: Envolver la tabla en un nuevo container**

Localiza la línea `{planes.length === 0 ? (` que comienza el empty state / tabla.

Reemplaza:

```jsx
{planes.length === 0 ? (
  <p className="gestion-planes-v1__empty">
    ...
  </p>
) : (
  <div className="table-wrapper">
    <table>...</table>
  </div>
)}
```

Con:

```jsx
<div className="gestion-planes-v1__table-scrollable">
  {planes.length === 0 ? (
    <p className="gestion-planes-v1__empty">
      {isAdmin ? 'No hay planes. Creá el primero.' : 'No hay planes disponibles.'}
    </p>
  ) : (
    <div className="table-wrapper">
      <table className="table-standard gestion-planes-v1__tabla">
        <thead>
          <tr>
            <th style={{ width: widths.identificador, cursor: 'pointer' }} onClick={() => handleSort('numero_afiliado')}>
              Identificador{getSortIcon('numero_afiliado')}{getResizeHandle('identificador')}
            </th>
            {/* resto de headers */}
          </tr>
        </thead>
        <tbody>
          {planesFiltered.map((plan) => (
            <tr key={plan.plan_numero}>
              {/* contenido */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

- [ ] **Step 2: Verificar el cierre del container table-scrollable**

El `</div>` que cierra `gestion-planes-v1__table-scrollable` debe estar después del empty state / tabla, pero ANTES de la paginación.

---

### Task 4: Reestructurar HTML - Mover paginación fuera del table-scrollable

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx:308-317`

- [ ] **Step 1: Mover paginación después del table-scrollable**

El bloque de paginación:

```jsx
{totalPages > 1 && configItemsPerPage !== 0 && (
  <Pagination
    currentPage={page}
    totalPages={totalPages}
    totalItems={totalCount}
    itemsPerPage={configItemsPerPage}
    onPageChange={setPage}
  />
)}
```

Debe estar FUERA del `gestion-planes-v1__table-scrollable` (después de cerrar ese div). La paginación se desplaza con el contenido.

- [ ] **Step 2: Verificar estructura final del componente**

La estructura final debe ser:

```
<div className="gestion-planes-v1">
  {/* Sticky header */}
  <div className="gestion-planes-v1__sticky-header">
    ...
  </div>

  {/* Table scrollable */}
  <div className="gestion-planes-v1__table-scrollable">
    ...
  </div>

  {/* Paginación (se desplaza) */}
  {totalPages > 1 && ...}

  {/* Modales */}
  {modalMode && ...}
  <BulkUpdateCuotaModal ... />
  ...
</div>
```

---

### Task 5: Agregar estilos base - Flexbox y sticky-header

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss:1-50`

- [ ] **Step 1: Agregar Flexbox al container principal**

Al inicio del archivo, reemplaza:

```scss
.gestion-planes-v1 {
  padding: 1rem;

  &__title {
    ...
  }
```

Con:

```scss
.gestion-planes-v1 {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__sticky-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--color-background);
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__title {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
  }
```

- [ ] **Step 2: Actualizar estilos de filters y header**

Mantén los estilos existentes para `&__filters` y `&__header` sin cambios, pero asegúrate de que estén dentro del bloque `&__sticky-header` lógicamente (aunque el SCSS los define en la raíz de `.gestion-planes-v1`).

---

### Task 6: Agregar estilos para table-scrollable y thead sticky

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss:50-180`

- [ ] **Step 1: Agregar estilos para table-scrollable**

Después de los estilos de `&__actions`, agrega:

```scss
.gestion-planes-v1 {
  // ... estilos anteriores ...

  &__table-scrollable {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }

  &__empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-muted);
    font-style: italic;
  }
}
```

- [ ] **Step 2: Modificar estilos de tabla para thead sticky**

Localiza la sección `&__tabla-wrapper` y `&__tabla`. Reemplaza:

```scss
&__tabla-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

&__tabla {
  width: 100%;
  border-collapse: collapse;

  thead tr {
    background-color: var(--color-surface-alt);
    border-bottom: 2px solid var(--color-border);
  }
```

Con:

```scss
&__tabla {
  width: 100%;
  border-collapse: collapse;

  thead {
    position: sticky;
    top: 0;
    z-index: 99;
    background-color: var(--color-surface-alt);
  }

  thead tr {
    border-bottom: 2px solid var(--color-border);
  }
```

(El `&__tabla-wrapper` se puede eliminar o mantener — el importante es que la tabla esté dentro de `table-scrollable`).

- [ ] **Step 3: Mantener estilos de th, td, tbody sin cambios**

Los estilos para `th`, `td`, y `tbody tr` pueden mantenerse como están.

---

### Task 7: Agregar/actualizar media queries para responsive

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss:180-230`

- [ ] **Step 1: Revisar media queries actuales**

Localiza el bloque `@media (max-width: 600px)`. Debe contener estilos para `&__filters`, `&__header`, `&__actions`.

- [ ] **Step 2: Actualizar sticky-header en mobile**

Agrega a la media query:

```scss
@media (max-width: 600px) {
  .gestion-planes-v1 {
    &__sticky-header {
      padding: 0.75rem;
    }

    &__filters {
      flex-direction: column;
      align-items: stretch;

      .search-container {
        min-width: 100%;
      }
    }

    &__header {
      flex-direction: column;
      align-items: stretch;
    }

    &__actions {
      width: 100%;
      flex-direction: column;

      button {
        width: 100%;
      }
    }

    &__tabla {
      font-size: 0.75rem;
    }

    &__tabla th,
    &__tabla td {
      padding: 0.5rem;
    }
  }
}
```

- [ ] **Step 3: Verificar que no hay conflictos de estilos**

Comprueba que los estilos nuevos no entran en conflicto con los existentes (especialmente z-index, padding, etc.).

---

### Task 8: Testing Manual - Verificar comportamiento sticky

**Files:**
- Test: Manual en navegador

- [ ] **Step 1: Iniciar el servidor de frontend**

```bash
cd frontend
npm start
```

Espera a que compile (debería haber un error si hay syntax error en el JSX, revisar y corregir).

- [ ] **Step 2: Navegar a la sección Planes**

Abre el navegador en `http://localhost:3000` (o el puerto que uses), navega a la sección de Planes en el Dashboard.

- [ ] **Step 3: Verificar que el sticky-header está visible**

Confirma que ves:
- Título "Planes"
- Textbox de búsqueda
- Botones (Nuevo Plan, Aumento Masivo, etc.)

- [ ] **Step 4: Cargar suficientes planes para generar scroll**

Si no hay suficientes planes, crea algunos o ajusta el filtro para que haya scroll vertical en la tabla.

- [ ] **Step 5: Hacer scroll vertical en la tabla**

Scroll down en la tabla. Verifica:
- ✅ El sticky-header (título, búsqueda, botones) permanece visible en la parte superior
- ✅ La fila de encabezados (`<thead>`) también permanece visible bajo el sticky-header
- ✅ Solo las filas de datos se desplazan
- ✅ Los controles no se superponen con la tabla

- [ ] **Step 6: Verificar z-index layers**

Haz scroll y verifica que:
- Sticky-header está por encima del thead
- Thead está por encima de tbody
- No hay conflictos visuales

- [ ] **Step 7: Verificar paginación**

Si hay paginación, scroll hasta abajo y verifica:
- ✅ La paginación se desplaza con el contenido (no está fija)
- ✅ Es visible cuando haces scroll

- [ ] **Step 8: Verificar empty state**

Filtra para tener 0 planes. Verifica:
- ✅ Mensaje "No hay planes. Creá el primero." aparece
- ✅ Sticky-header sigue visible
- ✅ No hay errores en la consola

- [ ] **Step 9: Verificar loading state**

Si hay un endpoint lento, verifica que el spinner aparece dentro del table-scrollable.

- [ ] **Step 10: Verificar responsive en mobile**

Redimensiona el navegador a ancho < 600px. Verifica:
- ✅ Sticky-header se adapta (padding reducido)
- ✅ Botones están en una columna
- ✅ Tabla sigue siendo scrolleable
- ✅ Thead sigue sticky

- [ ] **Step 11: Verificar scroll horizontal**

Si hay columnas anchas, verifica que puedes hacer scroll horizontal sin afectar el sticky behavior.

- [ ] **Step 12: Verificar modales**

Abre un modal (Nuevo Plan, Editar). Verifica:
- ✅ Modal se abre correctamente
- ✅ No hay conflictos de z-index
- ✅ Modal es clickeable y funciona

---

### Task 9: Commit final

**Files:**
- Modified: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx`
- Modified: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss`

- [ ] **Step 1: Verificar cambios**

```bash
cd C:\Users\alejandro.rouiller\Documents\proyectos\App_gestion_servicios_sociales
git status
```

Debería mostrar solo los dos archivos modificados (GestionPlanesV1.jsx y GestionPlanesV1.scss).

- [ ] **Step 2: Hacer commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss

git commit -m "feat(planes): implementar encabezado fijo con scroll - RF5"
```

- [ ] **Step 3: Push a la rama**

```bash
git push origin V_1.0.7
```

---

## Self-Review

**Spec Coverage:**
- ✅ Estructura de layout (sticky-header + table-scrollable): Tasks 2-4
- ✅ Estilos CSS para sticky: Tasks 5-6
- ✅ Responsive: Task 7
- ✅ Testing manual: Task 8
- ✅ Commit: Task 9

**Placeholder Scan:**
- ✅ No hay "TBD", "TODO", "similar to", placeholders
- ✅ Código completo en cada step
- ✅ Comandos exactos con rutas

**Type/Property Consistency:**
- ✅ `gestion-planes-v1__sticky-header` usado consistentemente
- ✅ `gestion-planes-v1__table-scrollable` usado consistentemente
- ✅ Z-index: 100 (sticky-header) > 99 (thead)
