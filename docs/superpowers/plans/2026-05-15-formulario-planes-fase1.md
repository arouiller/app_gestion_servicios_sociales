# Fase 1: Reorden de Campos y Display Personalizado de Zona

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar los campos en PlanV1Modal para mejorar el flujo de entrada de datos e implementar un display personalizado para el selector de zona que muestra solo el código cuando está seleccionado.

**Architecture:** Cambios puramente en el componente React PlanV1Modal: agregar state local para rastrear el código de zona seleccionado, agregar un handler de cambio personalizado, reordenar los bloques JSX de los campos, y agregar estilos CSS para el display personalizado. No hay cambios en la API, validación, o servicios.

**Tech Stack:** React (hooks: useState), SCSS, HTML5 (select/option)

---

## Archivo Structure

**Files to modify:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` — Reordenar campos, agregar state y handler
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss` — Agregar estilos para display personalizado

**No new files required.**

---

## Task 1: Agregar State para Display de Zona

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (líneas 20-80, donde se declaran los states)

**Objetivo:** Agregar un state local `zonaCodigo` que almacena el código de la zona seleccionada actualmente.

- [ ] **Step 1: Ubicar la sección de states en PlanV1Modal.jsx**

Abre el archivo. Verás que alrededor de línea 38-59 hay múltiples `useState` declarations:
```jsx
const [loading, setLoading] = useState(false);
const [showSuccessNotification, setShowSuccessNotification] = useState('');
// ... más states
```

- [ ] **Step 2: Agregar el nuevo state después de los states existentes**

Después de la línea 59 (después de `const [recibosPage, setRecibosPage] = useState(1);`), agregar:

```jsx
const [zonaCodigo, setZonaCodigo] = useState('');
```

Esto almacenará el código (ej: "01") de la zona actualmente seleccionada.

- [ ] **Step 3: Verificar la adición**

Buscar la línea que contiene `const [zonaCodigo, setZonaCodigo] = useState('');` para confirmar que se agregó correctamente.

---

## Task 2: Crear Handler Personalizado para Zona

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (después de los otros handlers, alrededor de línea 200-250)

**Objetivo:** Agregar un handler `handleZonaChange` que actualiza tanto `form.zona_id` como `zonaCodigo`.

- [ ] **Step 1: Ubicar la sección de handlers**

Busca funciones como `loadLookupData`, `loadMaxAfiliadoNumber`, etc. (después de los hooks de effect). Encontrarás la sección de handlers alrededor de línea 200-250.

- [ ] **Step 2: Agregar el nuevo handler**

Inserta el siguiente código después de los handlers existentes (antes de cualquier return):

```jsx
const handleZonaChange = (e) => {
  const selectedId = e.target.value;
  handleFieldChange('zona_id', selectedId);
  
  if (selectedId) {
    const zona = lookupData.zonas.find(z => z.id === parseInt(selectedId));
    setZonaCodigo(zona?.codigo || '');
  } else {
    setZonaCodigo('');
  }
};
```

Este handler:
- Toma el valor seleccionado del input
- Actualiza `form.zona_id` via `handleFieldChange` (mantiene consistencia con otros campos)
- Si hay una zona seleccionada, busca su código en `lookupData.zonas` y lo almacena en `zonaCodigo`
- Si no hay selección, vacía `zonaCodigo`

- [ ] **Step 3: Verificar la adición**

Buscar la función `handleZonaChange` para confirmar que se agregó correctamente.

---

## Task 3: Reordenar Campos en el Formulario (Parte 1: Zona al Inicio)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (líneas 560-701)

**Objetivo:** Mover el bloque de "Zona" (actualmente en líneas 686-701) al inicio, antes de "Número de Afiliado" (línea 560), y actualizar el handler de zona.

- [ ] **Step 1: Ubicar el bloque de Número de Afiliado**

Busca la línea:
```jsx
<label>Número de Afiliado *</label>
```

Esto debería estar alrededor de línea 560. Este es el punto donde queremos insertar el bloque de Zona.

- [ ] **Step 2: Ubicar el bloque actual de Zona**

Busca la línea:
```jsx
<label>Zona</label>
```

Debería estar alrededor de línea 687. Selecciona todo el bloque desde `<div className="plan-v1-modal__field">` hasta el cierre `</div>` (incluyendo el `{errors.zona_id && ...}`). Este bloque tiene aproximadamente 16 líneas.

- [ ] **Step 3: Copiar el bloque de Zona**

Copia todo el bloque:
```jsx
<div className="plan-v1-modal__field">
  <label>Zona</label>
  <select
    id="field-zona_id"
    value={form.zona_id}
    onChange={(e) => handleFieldChange('zona_id', e.target.value)}
  >
    <option value="">Seleccionar...</option>
    {lookupData.zonas.map((z) => (
      <option key={z.id} value={z.id}>
        {z.codigo} — {z.nombre}
      </option>
    ))}
  </select>
  {errors.zona_id && <span className="plan-v1-modal__error">{errors.zona_id}</span>}
</div>
```

- [ ] **Step 4: Reemplazar el handler onChange**

En el bloque copiado, reemplazar:
```jsx
onChange={(e) => handleFieldChange('zona_id', e.target.value)}
```

Por:
```jsx
onChange={handleZonaChange}
```

Resultado:
```jsx
<div className="plan-v1-modal__field">
  <label>Zona</label>
  <select
    id="field-zona_id"
    value={form.zona_id}
    onChange={handleZonaChange}
  >
    <option value="">Seleccionar...</option>
    {lookupData.zonas.map((z) => (
      <option key={z.id} value={z.id}>
        {z.codigo} — {z.nombre}
      </option>
    ))}
  </select>
  {errors.zona_id && <span className="plan-v1-modal__error">{errors.zona_id}</span>}
</div>
```

- [ ] **Step 5: Insertar el bloque modificado antes de Número de Afiliado**

Inserta el bloque modificado ANTES de la línea que contiene `<label>Número de Afiliado *</label>`.

- [ ] **Step 6: Eliminar el bloque original de Zona**

Borra el bloque original de Zona (de líneas ~686-701) que ya no se necesita en esa posición.

---

## Task 4: Reordenar Campos en el Formulario (Parte 2: Nuevo Orden Completo)

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (líneas 560-718)

**Objetivo:** Verificar que el nuevo orden de campos sea exactamente: Zona, Número de Afiliado, Tipo de Grupo, Tipo de Plan, Cobrador, Obra Social, Estado, Valor de Cuota, Domicilio, Teléfono, Localidad.

- [ ] **Step 1: Listar el orden actual después de la Tarea 3**

Después de completar la Tarea 3, verifica que el orden visual en el formulario sea:
1. ✓ Zona (recién movido al inicio)
2. Número de Afiliado
3. Tipo de Plan
4. Cobrador
5. Obra Social
6. Tipo de Grupo
7. Estado
8. Valor de Cuota
9. Domicilio
10. Teléfono
11. Localidad

Notas: Tipo de Grupo debería estar DESPUÉS de Número de Afiliado (posición 3), pero actualmente está en posición 6. Tipo de Plan debería estar en posición 4, pero actualmente está en posición 3.

- [ ] **Step 2: Reordenar Tipo de Grupo a posición 3**

Busca el bloque:
```jsx
<label>Tipo de Grupo *</label>
```

Cópialo (junto con el div padre y el error message).

Insértalo DESPUÉS del bloque de "Número de Afiliado" (después de línea ~571).

Elimina el bloque original de "Tipo de Grupo" de su posición actual (debería estar después de "Obra Social").

- [ ] **Step 3: Reordenar Tipo de Plan a posición 4**

Busca el bloque:
```jsx
<label>Tipo de Plan *</label>
```

Debería estar ahora en una posición diferente después de los cambios anteriores. Cópialo.

Insértalo DESPUÉS del bloque de "Tipo de Grupo" (recién movido).

Elimina el bloque original.

- [ ] **Step 4: Verificar el nuevo orden**

Visualmente, de arriba a abajo, deberías ver:
1. Zona
2. Número de Afiliado
3. Tipo de Grupo
4. Tipo de Plan
5. Cobrador
6. Obra Social
7. Estado
8. Valor de Cuota
9. Domicilio
10. Teléfono
11. Localidad

Si el orden no es exacto, ajusta moviendo bloques hasta que coincida.

---

## Task 5: Agregar Estilos CSS para Display Personalizado de Zona

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss`

**Objetivo:** Agregar CSS que muestre el código de zona (almacenado en `zonaCodigo`) cuando el select está cerrado, pero permita que el select muestre las opciones completas cuando se abre.

- [ ] **Step 1: Ubicar el final de PlanV1Modal.scss**

Abre el archivo `PlanV1Modal.scss`. Nota dónde terminan los estilos existentes (generalmente al final del archivo).

- [ ] **Step 2: Agregar nuevas reglas CSS**

Al final del archivo, agregar:

```scss
// Display personalizado para selector de zona
.plan-v1-modal__zona-select {
  position: relative;
  
  // En navegadores modernos, cuando el select está cerrado,
  // el atributo data-selected-code controla el texto visible
  &[data-selected-code] {
    color: transparent;
  }
  
  // Label que sobrepone el código de zona
  &::before {
    content: attr(data-selected-code);
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: inherit;
    font-size: inherit;
  }
}

// Cuando el select está enfocado o abierto, mostrar las opciones normales
.plan-v1-modal__zona-select:focus,
.plan-v1-modal__zona-select:active {
  color: initial;
}

// Las opciones dentro siempre deben ser visibles normalmente
.plan-v1-modal__zona-select option {
  color: initial;
}
```

Nota: Este enfoque usa `::before` y `content: attr(data-selected-code)`. Sin embargo, hay un problema: el atributo `data-selected-code` no existe aún en el JSX. Vamos a agregar esto en la Tarea 6.

- [ ] **Step 3: Verificar la adición**

Buscar `.plan-v1-modal__zona-select` en el SCSS para confirmar que se agregó.

---

## Task 6: Actualizar Select de Zona con Atributo data-selected-code

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (en el bloque de Zona, alrededor de línea 560-580 tras los cambios anteriores)

**Objetivo:** Agregar el atributo `data-selected-code` al select de zona para que el CSS pueda acceder al código via `attr()`.

- [ ] **Step 1: Ubicar el select de Zona**

Busca:
```jsx
<select
  id="field-zona_id"
  value={form.zona_id}
  onChange={handleZonaChange}
>
```

- [ ] **Step 2: Agregar atributo data-selected-code**

Modifica el select para incluir:

```jsx
<select
  id="field-zona_id"
  value={form.zona_id}
  onChange={handleZonaChange}
  data-selected-code={zonaCodigo}
  className="plan-v1-modal__zona-select"
>
  <option value="">Seleccionar...</option>
  {lookupData.zonas.map((z) => (
    <option key={z.id} value={z.id}>
      {z.codigo} — {z.nombre}
    </option>
  ))}
</select>
```

Cambios:
- Agregar `data-selected-code={zonaCodigo}` — vincula el state de React al atributo DOM
- Agregar `className="plan-v1-modal__zona-select"` — aplica los estilos CSS

- [ ] **Step 3: Verificar la adición**

Buscar `data-selected-code={zonaCodigo}` para confirmar.

---

## Task 7: Testing Manual — Verificar Reorden de Campos

**Files:**
- No files modified
- Test manually in browser

**Objetivo:** Verificar que los campos estén en el nuevo orden.

- [ ] **Step 1: Iniciar desarrollo**

Nota: Según CLAUDE.md, no hay Node.js disponible en el entorno, así que no puedes ejecutar `npm start` localmente. Para testing completo, necesitarás acceso a un servidor de desarrollo o testing externo.

Si tienes acceso a un entorno con Node.js, ejecuta:
```bash
cd frontend
npm start
```

- [ ] **Step 2: Abrir GestionPlanesV1**

En la aplicación, navega a "Gestión de Planes" y haz clic en "Crear Plan" o edita un plan existente.

- [ ] **Step 3: Verificar orden de campos**

De arriba a abajo, verifica que veas:
1. Zona
2. Número de Afiliado
3. Tipo de Grupo
4. Tipo de Plan
5. Cobrador
6. Obra Social
7. Estado
8. Valor de Cuota
9. Domicilio
10. Teléfono
11. Localidad

Si el orden no coincide, vuelve a la Tarea 4 y ajusta.

- [ ] **Step 4: Pasar testing**

Si el orden es correcto, continúa a la Tarea 8.

---

## Task 8: Testing Manual — Verificar Display de Zona

**Files:**
- No files modified
- Test manually in browser

**Objetivo:** Verificar que el selector de zona muestre solo el código cuando está seleccionado.

- [ ] **Step 1: Abrir modal de crear plan (si aún no está abierto)**

Si cerraste el modal en la Tarea 7, vuelve a abrirlo.

- [ ] **Step 2: Hacer clic en el selector de Zona**

Haz clic en el campo "Zona". Debería mostrar un dropdown con opciones del estilo:
```
01 — Zona Centro
02 — Zona Norte
...
```

- [ ] **Step 3: Seleccionar una zona**

Selecciona cualquier zona (ej: "01 — Zona Centro").

- [ ] **Step 4: Verificar el display cerrado**

Después de seleccionar, el select debería mostrar SOLO el código (ej: `01`), no el nombre completo.

Si ves `01 — Zona Centro`, entonces el CSS no está funcionando correctamente. Revisa:
- ¿El atributo `data-selected-code={zonaCodigo}` está presente?
- ¿El state `zonaCodigo` se actualiza correctamente? (Abre la consola y revisa el React DevTools)
- ¿Los estilos CSS en `PlanV1Modal.scss` son correctos?

- [ ] **Step 5: Pasar testing**

Si solo se muestra el código, continúa a la Tarea 9.

---

## Task 9: Testing Manual — Verificar Sin Selección y Edición

**Files:**
- No files modified
- Test manually in browser

**Objetivo:** Verificar casos edge: sin selección y edición de plan existente.

- [ ] **Step 1: Crear un plan sin seleccionar zona**

En el modal, deja el campo "Zona" sin seleccionar (debe mostrar "Seleccionar..."). Intenta crear el plan.

Verifica que:
- El plan se guarda correctamente (zona es opcional)
- No hay error de validación

- [ ] **Step 2: Editar un plan existente con zona**

Abre un plan que ya tenga una zona asignada. Verifica que:
- El display muestra solo el código (ej: `01`)
- Al hacer clic, se muestran todas las opciones `código — nombre`

- [ ] **Step 3: Cambiar la zona**

Selecciona una zona diferente. Verifica que el display se actualiza inmediatamente a el nuevo código.

- [ ] **Step 4: Pasar testing**

Si todo funciona, continúa a la Tarea 10.

---

## Task 10: Verificación de Validación y Guardado

**Files:**
- No files modified
- Test manually in browser

**Objetivo:** Verificar que la validación sigue funcionando y que los datos se guardan correctamente.

- [ ] **Step 1: Crear plan con todos los campos requeridos**

Crea un plan con:
- Número de Afiliado: `00001`
- Tipo de Grupo: (selecciona cualquiera)
- Tipo de Plan: (selecciona cualquiera)
- Cobrador: (selecciona cualquiera)
- Obra Social: (selecciona cualquiera)
- Estado: `ACTIVO`
- Valor de Cuota: `100`
- Zona: (opcional, pero selecciona una para testing)

Haz clic en "Guardar y Seguir Editando" o "Guardar".

- [ ] **Step 2: Verificar en BD o en la tabla**

Después de guardar, verifica que:
- El plan aparece en la tabla de gestión de planes
- Los datos se guardaron correctamente (zona debería estar almacenada en la BD)

- [ ] **Step 3: Pasar testing**

Si todo se guardó correctamente, continúa a la Tarea 11.

---

## Task 11: Commit

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss`

**Objetivo:** Hacer commit de todos los cambios.

- [ ] **Step 1: Revisar cambios**

En terminal, ejecuta:
```bash
cd c:\Users\alejandro.rouiller\Documents\proyectos\App_gestion_servicios_sociales
git diff frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/
```

Verifica que los cambios son solo:
- Reordenar campos en PlanV1Modal.jsx
- Agregar state `zonaCodigo`
- Agregar handler `handleZonaChange`
- Agregar atributo `data-selected-code` al select
- Agregar clase `plan-v1-modal__zona-select` al select
- Agregar estilos en PlanV1Modal.scss

- [ ] **Step 2: Hacer commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss
git commit -m "feat(planes-modal): reordenar campos y agregar display personalizado para zona"
```

- [ ] **Step 3: Hacer push**

```bash
git push origin V_1.0.7
```

- [ ] **Step 4: Verificar push**

Ejecuta:
```bash
git log --oneline -5
```

Verifica que el nuevo commit aparece en la lista.

---

## Task 12: Actualizar BACKLOG.md

**Files:**
- Modify: `backlog.md`

**Objetivo:** Actualizar el estado de BACKLOG-074 y BACKLOG-075 a "🚀 Desarrollado" (ya que la Fase 1 está completa).

- [ ] **Step 1: Abrir backlog.md**

- [ ] **Step 2: Ubicar BACKLOG-074 y BACKLOG-075**

Busca las líneas:
```
| BACKLOG-074 | 🟡 Media | 📋 Registrado | ...
| BACKLOG-075 | 🟡 Media | 📋 Registrado | ...
```

- [ ] **Step 3: Actualizar estado**

Reemplazar `📋 Registrado` con `🚀 Desarrollado`:

```
| BACKLOG-074 | 🟡 Media | 🚀 Desarrollado | Reordenar campos en formulario de planes: zona a la izquierda del número de afiliado | En el formulario de planes (PlanV1Modal), mover el selector de zona hacia la izquierda del campo de número de afiliado. Cuando se selecciona una opción, mostrar solo el número de zona. El número y nombre completo solo aparecen cuando se despliega el combo. Implementado: Fase 1 completada, campos reordenados, display personalizado de zona agregado. | PlanV1Modal.jsx, PlanV1Modal.scss |
| BACKLOG-075 | 🟡 Media | 🚀 Desarrollado | Orden de campos en formulario de planes | Reordenar campos en el formulario del plan para mejorar el flujo de entrada: (1) Zona/Número de afiliado, (2) Tipo de grupo, (3) Tipo de plan, (4) Resto de los campos. Implementado: Fase 1 completada, nuevo orden establecido. | PlanV1Modal.jsx |
```

- [ ] **Step 4: Hacer commit**

```bash
git add backlog.md
git commit -m "docs(backlog): marcar BACKLOG-074 y BACKLOG-075 como Desarrollado (Fase 1 completa)"
```

- [ ] **Step 5: Hacer push**

```bash
git push origin V_1.0.7
```

---

## Self-Review

**Spec coverage:**
- ✅ RF-1 (Reorden de campos): Covered in Tasks 3-4
- ✅ RF-2 (Display personalizado de zona): Covered in Tasks 5-6
- ✅ Validación: Task 10 verifica que validación sigue funcionando
- ✅ Testing: Tasks 7-10 cubren todos los casos de prueba de la spec

**Placeholder scan:**
- ✅ No "TBD" o "TODO"
- ✅ Todas las líneas de código están completas
- ✅ Todos los comandos son exactos

**Type consistency:**
- ✅ `zonaCodigo` se define en Task 1 y se usa consistentemente en Tasks 2, 6
- ✅ `handleZonaChange` se define en Task 2 y se usa en Task 6
- ✅ Nombres de archivos y rutas son exactos

**Completeness:**
- ✅ Plan cubre todos los requerimientos de la spec
- ✅ Cada tarea es bite-sized (2-5 minutos)
- ✅ Testing es exhaustivo
- ✅ Commits son atómicos

