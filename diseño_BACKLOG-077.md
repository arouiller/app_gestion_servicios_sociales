# BACKLOG-077: Remover Sticky Header en Gestión de Planes

**Prioridad:** 🔴 Alta  
**Estado:** 📋 Registrado  
**Fecha:** 2026-05-15

---

## Requerimiento

### Problema Actual
En la página de "Gestión de Planes" (GestionPlanesV1), cuando el usuario scrollea hacia abajo en la tabla, la parte superior de la página (título, filtros, header de tabla) permanece **fija en la parte superior** mientras el resto de la tabla se desplaza. Este es comportamiento de "sticky header".

### Requerimiento
**Volver al comportamiento original** donde toda la página scrollea sin elementos fijos. El usuario debe poder scrollear libremente sin que ninguna parte de la interfaz permanezca fija.

### Contexto
El sticky header fue implementado probablemente para mejorar UX al mantener controles visibles, pero el usuario prefiere que la página tenga comportamiento de scroll estándar (sin elementos sticky).

---

## Análisis de Implementación Actual

### Ubicación del Sticky Header
**Archivo:** `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss`

#### 1. Sticky Header Principal (Líneas 6-14)
```scss
&__sticky-header {
  position: sticky;        // ← CAUSA DEL PROBLEMA
  top: 0;                 // ← CAUSA DEL PROBLEMA
  z-index: 100;
  background-color: var(--color-background);
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
```

**Efecto:** El div con clase `.gestion-planes-v1__sticky-header` (que contiene título, alertas, filtros y botones de acciones) se queda fijo en la parte superior cuando scrolleas.

#### 2. Sticky Table Header (Líneas 217-222)
```scss
thead tr {
  position: sticky;        // ← CAUSA DEL PROBLEMA SECUNDARIO
  top: 0;                 // ← CAUSA DEL PROBLEMA SECUNDARIO
  z-index: 99;
  background-color: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border);
}
```

**Efecto:** El header de la tabla (fila con nombres de columnas) también permanece visible durante el scroll.

### Estructura en JSX (GestionPlanesV1.jsx)
```jsx
<div className="gestion-planes-v1">
  {/* Sticky Header - RESPONSABLE DEL PROBLEMA */}
  <div className="gestion-planes-v1__sticky-header">
    <h2 className="gestion-planes-v1__title">Planes</h2>
    {error && <div className="gestion-planes-v1__alert ...>{error}</div>}
    {success && <div className="gestion-planes-v1__alert ...>{success}</div>}
    {planes.length > 0 && (
      <div className="gestion-planes-v1__filters">
        <SearchContainer ... />
        <div className="gestion-planes-v1__header">
          <div className="gestion-planes-v1__actions">
            {/* Botones: Nuevo Plan, Aumento Masivo, etc. */}
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Table Scrollable Container */}
  <div className="gestion-planes-v1__table-scrollable">
    {/* Tabla con sticky header */}
  </div>

  {/* Pagination */}
  {totalPages > 1 && <Pagination ... />}

  {/* Modals */}
</div>
```

---

## Diseño de la Solución

### Cambio 1: Remover Sticky del Header Principal

**Ubicación:** `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss`

**Modificación:**
```scss
&__sticky-header {
  // position: sticky;     ← REMOVER ESTA LÍNEA
  // top: 0;              ← REMOVER ESTA LÍNEA
  z-index: 100;
  background-color: var(--color-background);
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
```

**Alternativa más limpia:**
```scss
&__sticky-header {
  // REMOVER position: sticky Y top: 0
  // Mantener el resto de las propiedades
  z-index: 100;
  background-color: var(--color-background);
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
```

### Cambio 2: Remover Sticky del Table Header (Opcional pero Recomendado)

**Ubicación:** `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss` (líneas 217-222)

**Modificación:**
```scss
thead tr {
  // position: sticky;     ← REMOVER ESTA LÍNEA
  // top: 0;              ← REMOVER ESTA LÍNEA
  z-index: 99;
  background-color: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border);
}
```

**Alternativa:**
```scss
thead tr {
  // REMOVER position: sticky Y top: 0
  // Si se mantiene z-index, puede causarse conflicto. Recomendación: remover z-index también
  background-color: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border);
}
```

### Cambio 3: Actualizar z-index si es necesario

Si se remueven ambos sticky headers, **se recomienda remover z-index: 100 y z-index: 99** ya que no tienen sentido sin position: sticky/absolute/fixed.

**Después de los cambios:**
```scss
&__sticky-header {
  // Sin position: sticky, sin top: 0, sin z-index innecesario
  background-color: var(--color-background);
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

thead tr {
  // Sin position: sticky, sin top: 0, sin z-index innecesario
  background-color: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border);
}
```

---

## Impacto Visual

### Antes (Actual)
- ✅ Header permanece visible al scrollear hacia abajo
- ❌ Controles fijos pueden no ser deseados por el usuario
- ❌ Comportamiento no estándar

### Después (Solución)
- ✅ Comportamiento de scroll estándar (toda la página scrollea)
- ✅ Experiencia consistente con otros sitios web
- ⚠️ Header desaparece al scrollear hacia abajo
- ⚠️ Usuario debe scrollear hacia arriba para acceder a filtros/botones

---

## Testing Plan

| Escenario | Acción | Resultado Esperado |
|-----------|--------|-------------------|
| **T1** | Cargar página GestionPlanesV1 con muchos planes | Header visible en la parte superior |
| **T2** | Scrollear hacia abajo en la tabla | Header se desplaza hacia arriba (no permanece fijo) |
| **T3** | Continuar scrolleando hasta el final | Filtros y botones desaparecen de la pantalla |
| **T4** | Scrollear hacia arriba | Header vuelve a aparecer (flujo normal) |
| **T5** | Verificar estilos visuales | Border y background del header se mantienen intactos |
| **T6** | Validar en dispositivos móviles | Comportamiento consistente con media queries |

---

## Archivos Afectados

| Archivo | Cambios |
|---------|---------|
| `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.scss` | Remover `position: sticky; top: 0;` de `.gestion-planes-v1__sticky-header` (línea 7-8) y `thead tr` (línea 217-218). Opcionalmente remover z-index innecesarios |
| `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` | **Sin cambios** - La clase `.gestion-planes-v1__sticky-header` se mantiene, solo cambia su comportamiento CSS |

---

## Estimación

| Tarea | Horas | Notas |
|-------|-------|-------|
| Analizar código y confirmar ubicaciones | 0.25h | Ya identificadas en este documento |
| Modificar GestionPlanesV1.scss | 0.25h | Remover 2 líneas de CSS |
| Testing manual en navegador | 0.5h | Verificar scroll en desktop y mobile |
| Verificar que no hay regresiones | 0.25h | Revisar estilos visuales del header |
| **Total** | **1.25h** | Cambio muy simple |

---

## Consideraciones

### Ventajas de Remover Sticky
- ✅ Comportamiento de scroll estándar y predecible
- ✅ Consistencia con la mayoría de aplicaciones web
- ✅ Menos complejidad CSS

### Desventajas de Remover Sticky
- ❌ Filtros y botones desaparecen al scrollear (usuario debe subir para acceder)
- ❌ Menos comodidad para usuarios que necesitan cambiar filtros frecuentemente

### Alternativas No Seleccionadas
1. **Mantener sticky pero reducir altura:** Mantendría el problema
2. **Hacer sticky solo el filtro de búsqueda:** Solución parcial, incompleta
3. **Scroll lateral en tabla:** No resuelve el problema de scroll vertical

---

## Notas de Implementación

- **No requiere cambios backend:** Problema es puramente de frontend (CSS)
- **No requiere cambios en JSX:** Solo cambio de CSS
- **Sin dependencias nuevas:** Usa propiedades CSS estándar
- **Compatible:** Funciona en todos los navegadores modernos

---

## Dependencias Bloqueantes
- ✅ Ninguna (change es independiente y aislado)
