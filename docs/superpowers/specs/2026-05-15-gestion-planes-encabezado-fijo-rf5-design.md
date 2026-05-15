# Design: Encabezado Fijo en Tabla de Planes (RF5)

**Fecha**: 2026-05-15  
**Requisito**: RF5 de `2026-04-13-gestion-planes-v1.0-design.md`  
**Componente**: `GestionPlanesV1`  
**Rama**: `V_1.0.7`

## Resumen Ejecutivo

Implementar un layout sticky para la tabla de planes que mantiene visible el encabezado (título, búsqueda, botones de acción) y la fila de columnas (thead) cuando el usuario hace scroll vertical sobre el contenido de la tabla.

## Requisito Funcional (RF5)

Cuando la cantidad de planes mostrados en la tabla genera una barra de scroll vertical:
- El encabezado (título "Planes", textbox de búsqueda, botones de acciones) permanece fijo en la parte superior
- La fila de encabezados de columnas (`<thead>`) permanece fija bajo el encabezado principal
- Al hacer scroll vertical, solo el contenido (filas de planes en `<tbody>`) se desplaza
- La paginación se desplaza con el contenido (no queda fija)

## Enfoque Técnico: Restructura de Layout (Dos Containers)

### Estructura HTML

Reorganizar el layout del componente `GestionPlanesV1.jsx` en tres secciones:

```jsx
<div className="gestion-planes-v1">
  {/* 1. Sticky Header (título, búsqueda, botones) */}
  <div className="gestion-planes-v1__sticky-header">
    <h1 className="gestion-planes-v1__title">Planes</h1>
    
    <div className="gestion-planes-v1__filters">
      <SearchContainer ... />
      {/* filtros opcionales */}
    </div>

    <div className="gestion-planes-v1__header">
      <div className="gestion-planes-v1__actions">
        {/* Nuevo Plan, Aumento Masivo, etc. */}
      </div>
    </div>
  </div>

  {/* 2. Table Container Scrolleable */}
  <div className="gestion-planes-v1__table-scrollable">
    <div className="table-wrapper">
      <table className="table-standard gestion-planes-v1__tabla">
        <thead>
          {/* Headers de columnas */}
        </thead>
        <tbody>
          {/* Filas scrolleables */}
        </tbody>
      </table>
    </div>
    {/* Empty state va aquí si no hay planes */}
  </div>

  {/* 3. Paginación (se desplaza con el contenido) */}
  {totalPages > 1 && configItemsPerPage !== 0 && (
    <Pagination ... />
  )}

  {/* Modales, etc. (sin cambios) */}
</div>
```

### Estilos SCSS

Agregar nuevas reglas CSS al archivo `GestionPlanesV1.scss`:

```scss
.gestion-planes-v1 {
  display: flex;
  flex-direction: column;
  height: 100%;

  // 1. Header que se queda fijo en la parte superior
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

  &__filters {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    align-items: center;
    flex-wrap: wrap;

    .search-container {
      margin-bottom: 0;
      flex-direction: row;
      flex: 1;
      min-width: 250px;
    }

    .search-container__input-wrapper {
      flex: 1;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  // 2. Container scrolleable para la tabla
  &__table-scrollable {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }

  // 3. Tabla con thead sticky
  &__tabla {
    width: 100%;
    border-collapse: collapse;

    thead {
      position: sticky;
      top: 0;
      z-index: 99;
      background-color: var(--color-surface-alt);
      border-bottom: 2px solid var(--color-border);
    }

    th {
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
    }

    tbody tr {
      border-bottom: 1px solid var(--color-border);

      &:hover {
        background-color: var(--color-primary-light);
      }
    }

    td {
      padding: 0.75rem;
      font-size: 0.875rem;
    }
  }

  &__empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-muted);
    font-style: italic;
  }

  // Responsive
  @media (max-width: 600px) {
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
  }
}
```

## Flujo de Datos

**Sin cambios en la lógica:**
- Carga de planes: utiliza servicios existentes
- Búsqueda/filtrado: sin cambios
- Paginación: se mueve debajo de la tabla scrolleable
- Modales: sin cambios

**Cambio visual:**

```
1. Usuario abre GestionPlanesV1
   ↓
2. Sticky header visible (título, búsqueda, botones)
   ↓
3. Tabla carga y se renderiza
   ↓
4. Si hay muchos planes → scroll vertical habilitado
   ↓
5. Al hacer scroll:
   ├─ Sticky header permanece visible (top: 0)
   ├─ Thead de columnas permanece visible (bajo el header)
   └─ Solo tbody (filas) se desplaza
```

## Z-Index Layers

- `sticky-header`: `z-index: 100` (más arriba, encima de todo)
- `tabla thead`: `z-index: 99` (debajo del sticky header, pero arriba del tbody)

Esto asegura que:
- El header sticky nunca se tapa
- El thead se pega correctamente cuando scrollea la tabla
- No hay conflictos de capas

## Consideraciones Edge Cases

### 1. Empty State
Si no hay planes, el mensaje "No hay planes. Creá el primero." aparece dentro de `__table-scrollable`. El header sticky permanece visible para que el usuario pueda agregar un nuevo plan.

### 2. Loading State
Mientras carga la tabla, el spinner/loader aparece dentro de `__table-scrollable`.

### 3. Scroll Horizontal
La tabla sigue soportando `overflow-x: auto` para columnas anchas. El usuario puede hacer scroll horizontal sin afectar el sticky header.

### 4. Paginación
Se desplaza con el contenido (no queda fija). Aparece debajo de la tabla scrolleable.

### 5. Altura en Diferentes Contextos
- **Dashboard full-height**: El contenedor `__table-scrollable` toma `flex: 1` y crece dinámicamente
- **Dentro de otro layout**: Si no está full-height, puede requerir `max-height` específico

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` | Reestructurar HTML: envolver header en `__sticky-header`, tabla en `__table-scrollable`, mover paginación fuera |
| `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss` | Agregar estilos para `__sticky-header`, `__table-scrollable`, thead sticky, responsive |

## Archivos Sin Cambios

- `GestionPlanesV1ErrorBoundary.jsx`
- Modales (PlanV1Modal, AfiladoSearchModal, etc.)
- Servicios (planesService, planesV1Service, etc.)
- Hooks (usePlanV1Form, useColumnResize, useSortable, etc.)

## Definición de Listo

- [ ] Reestructurar HTML en `GestionPlanesV1.jsx`
- [ ] Agregar estilos CSS para sticky header y table-scrollable
- [ ] Verificar sticky header queda fijo al hacer scroll
- [ ] Verificar thead queda fijo bajo el sticky header
- [ ] Verificar paginación se desplaza con el contenido
- [ ] Probar con pocas filas (sin scroll)
- [ ] Probar con muchas filas (con scroll)
- [ ] Probar responsive en mobile
- [ ] Probar empty state (sin planes)
- [ ] Probar loading state
- [ ] Probar scroll horizontal (si hay columnas anchas)
- [ ] Verificar z-index layers correctos
- [ ] No hay conflictos visuales con modales existentes
- [ ] Ningún otro componente afectado

## Notas de Implementación

1. **No hay nuevos componentes** — solo reestructuración del layout existente
2. **No hay cambios de lógica** — toda la lógica de datos/estado permanece igual
3. **CSS puro** — uso de `position: sticky` (nativo, buena performance)
4. **Compatible con todas las browsers modernas** — sticky está bien soportado
5. **El orden de z-index es crítico** — `100 > 99` asegura capas correctas
6. **Flexbox layout** — permite que el container scrolleable ocupe el espacio disponible dinámicamente

## Testing Manual

### Caso 1: Tabla con Scroll
1. Cargar la aplicación
2. Asegurarse de que hay suficientes planes para generar scroll
3. Hacer scroll vertical → verificar que header y thead quedan fijos
4. Hacer scroll hasta abajo → verificar que paginación es visible

### Caso 2: Tabla sin Scroll
1. Filtrar para tener pocas filas (< 5)
2. Verificar que no hay scroll
3. Header debe estar en su posición normal

### Caso 3: Empty State
1. Filtrar para tener 0 planes
2. Verificar que mensaje "No hay planes" aparece
3. Verificar que header sticky sigue visible para crear nuevo plan

### Caso 4: Responsive Mobile
1. Redimensionar a ancho < 600px
2. Hacer scroll vertical → verificar sticky header se adapta
3. Botones deben estar en una columna

## Historial de Cambios

- **2026-05-15**: Design inicial basado en Enfoque 1 (restructura de layout)
