# Especificación: Fase 1 — Reorden de Campos y Display Personalizado de Zona

**Fecha:** 2026-05-15  
**Requerimientos:** BACKLOG-074, BACKLOG-075  
**Estado:** Diseño aprobado

---

## Resumen Ejecutivo

Reorganizar los campos en el formulario modal de planes (PlanV1Modal) para mejorar el flujo de entrada de datos. El nuevo orden prioriza los identificadores clave (zona + número de afiliado) al inicio, seguido de clasificadores (tipo de grupo, tipo de plan), y luego campos descriptivos. Además, implementar un display personalizado para el selector de zona que muestra solo el código cuando está seleccionado, y código + nombre cuando se despliega el combo.

---

## Requerimientos Funcionales

### RF-1: Reorden de Campos
El formulario de planes debe presentar los campos en el siguiente orden:

1. **Zona** (select)
2. **Número de Afiliado** (input numérico, 5 dígitos)
3. **Tipo de Grupo** (select)
4. **Tipo de Plan** (select)
5. **Cobrador** (select)
6. **Obra Social** (select)
7. **Estado** (select: ACTIVO, SUSPENDIDO, ELIMINADO, PROMOCION)
8. **Valor de Cuota** (input numérico, ARS)
9. **Domicilio** (input texto)
10. **Teléfono** (input texto)
11. **Localidad** (select)

**Orden anterior (para referencia):**
- Número de Afiliado, Tipo de Plan, Cobrador, Obra Social, Tipo de Grupo, Estado, Valor de Cuota, Domicilio, Teléfono, Zona, Localidad

### RF-2: Display Personalizado de Selector de Zona
El selector de zona debe comportarse de la siguiente manera:

- **Cuando está seleccionada una zona:** Mostrar solo el código (ej: `01`)
- **Cuando el combo está desplegado:** Mostrar código + nombre (ej: `01 — Zona Centro`)
- **Sin selección:** Mostrar placeholder "Seleccionar..."

Técnicamente, el `<select>` sigue renderizando las opciones completas (`código — nombre`), pero el elemento select cerrado muestra solo el código.

---

## Requisitos No Funcionales

- **Performance:** Cambio puramente de UI, sin impacto en carga de datos o validación
- **Compatibilidad:** Mantener toda la validación existente, mensajes de error, y comportamiento de guardar
- **Accesibilidad:** Las etiquetas `<label>` siguen siendo las mismas; la navegación con tab sigue funcionando en el nuevo orden

---

## Diseño Técnico

### Componente Afectado: PlanV1Modal.jsx

**Ubicación actual de campos en el JSX:**
- Líneas 560-571: Número de Afiliado
- Líneas 574-589: Tipo de Plan
- Líneas 591-606: Cobrador
- Líneas 608-623: Obra Social
- Líneas 625-640: Tipo de Grupo
- Líneas 642-653: Estado
- Líneas 655-665: Valor de Cuota
- Líneas 668-675: Domicilio
- Líneas 677-684: Teléfono
- Líneas 686-701: **Zona** (mover al inicio)
- Líneas 703-718: Localidad

**Cambios requeridos:**

1. **Reordenar bloques de JSX**: Mover el bloque de Zona (líneas 686-701) al inicio, antes de Número de Afiliado
2. **Implementar custom display para Zona**:
   - Agregar state local `displayZonaCode` que almacena solo el código de la zona seleccionada
   - En el handler `onChange` del select de zona, extraer el código y actualizar `displayZonaCode`
   - Renderizar el select con un atributo `data-selected-text` o similar para el display personalizado
   - Usar CSS `::after` o similar para mostrar el código en lugar del valor del select

**Opción A: CSS puro (recomendado)**
```jsx
<select
  id="field-zona_id"
  value={form.zona_id}
  onChange={(e) => {
    handleFieldChange('zona_id', e.target.value);
    // Actualizar display
  }}
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

CSS en PlanV1Modal.scss:
```scss
.plan-v1-modal__zona-select {
  // Cuando está cerrado, mostrar solo el código
  // Esto se logra con JavaScript que actualiza un atributo data-* 
  // O usando appearance: none + custom styling
}
```

**Opción B: JavaScript + display overlay**
```jsx
const [zonaCodigo, setZonaCodigo] = useState('');

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

Se recomienda **Opción B** por claridad y facilidad de testing.

---

## Flujo de Datos

1. Usuario abre PlanV1Modal (crear o editar)
2. Datos de lookup se cargan en `lookupData.zonas`
3. El formulario renderiza campos en nuevo orden
4. Usuario interactúa con selector de zona
5. `handleZonaChange` actualiza `form.zona_id` y `zonaCodigo`
6. El select se re-renderiza mostrando `zonaCodigo` cuando está cerrado
7. Al guardar, `form.zona_id` se envía al backend (sin cambios)

---

## Validación

Ningún cambio en las reglas de validación:
- Zona es opcional (no tiene asterisco en el label original)
- Todos los demás campos mantienen su validación actual
- El mapa `FIELD_TO_TAB` ya mapea `zona_id: 'datos'`; no requiere cambios

---

## Testing

### Casos de Prueba

1. **Reorden visual:** Abrir modal de crear plan, verificar orden de campos de arriba a abajo
2. **Display de zona:** Seleccionar una zona, verificar que solo el código aparece en el select cerrado
3. **Dropdown abierto:** Hacer click en el select de zona, verificar que se muestran `código — nombre` en las opciones
4. **Sin selección:** Sin seleccionar zona, el select debe mostrar "Seleccionar..."
5. **Validación:** Guardar un plan con y sin zona, verificar que la validación sigue funcionando
6. **Edición:** Editar un plan existente con zona asignada, verificar que el display muestra solo el código
7. **Tab navigation:** Navegar con Tab, verificar que el orden de focus es correcto (Zona → Número → Tipo Grupo → ...)

---

## Cambios de Archivos

| Archivo | Cambio | Líneas Afectadas |
|---------|--------|------------------|
| `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` | Reordenar campos, agregar state y handler para display de zona | 560-718 (reorder), nuevo state, nuevo handler |
| `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss` | Estilos para display personalizado de zona | Agregar nuevas reglas |

---

## Consideraciones Especiales

- **Backward compatibility:** No hay cambios en la estructura de datos ni en la API; solo cambios visuales
- **Dependencias:** No se requieren cambios en servicios, modelos, o hooks
- **Rollback:** Si es necesario, simplemente reordenar el JSX de vuelta al orden original

---

## Fases Posteriores

Esta es **Fase 1** de 2:
- **Fase 2 (próxima):** Cambios en tabla de gestión de planes (búsqueda por apellido + navegación por teclado)

