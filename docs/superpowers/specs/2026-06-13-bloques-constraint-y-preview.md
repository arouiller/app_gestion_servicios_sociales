# Spec: Constraint de Bloques y Preview en Todos los Recibos

**Fecha:** 2026-06-13  
**Requerimiento:** BACKLOG-082 (continuación)  
**Estado:** Diseño Aprobado

---

## Objetivo

Mejorar el editor de templates de recibos con dos funcionalidades:
1. **Constraint de Bloques**: Los bloques nunca pueden salirse de los límites del recibo cuando se mueven o redimensionan
2. **Preview en Todos los Recibos**: Los bloques diseñados en el recibo 1 se visualizan (en lectura) en todos los otros recibos de la misma página

---

## Requerimientos

### R1: Constraint de Bloques
- Cuando un bloque se arrastra, no puede cruzar los bordes del recibo
- Cuando un bloque se redimensiona, no puede crecer más allá del borde más cercano
- Las restricciones se aplican en tiempo real durante la interacción
- El usuario recibe retroalimentación visual clara de los límites (las guías existentes del recibo)

### R2: Preview en Todos los Recibos
- Los bloques diseñados en el recibo 1 se replican visualmente en todos los otros recibos de la página
- Cada bloque muestra su contenido (texto, formato, bordes) pero **sin posibilidad de edición**
- Cuando se edita un bloque en el recibo 1, la visualización en los otros recibos se actualiza automáticamente
- El preview respeta las mismas posiciones y medidas que el recibo 1

---

## Arquitectura

### Componentes Involucrados

#### `GenericBlock.jsx` (Modificación)
**Responsabilidad:** Bloque editable en el recibo 1 con constraint de boundaries

**Cambios:**
- Agregar función `calculateBoundaries(reciboSize, blockPosition, blockSize)` que retorna:
  ```javascript
  {
    minX: número (píxeles),
    minY: número (píxeles),
    maxX: número (píxeles),
    maxY: número (píxeles),
    maxWidth: número (píxeles),
    maxHeight: número (píxeles)
  }
  ```
- Pasar límites a `react-rnd` via props `bounds` o implementar validación manual en callbacks `onDragStop` y `onResizeStop`
- Si `react-rnd` no soporta bounds directamente, implementar restricción en callbacks:
  - En `onDragStop`: Ajustar posición si sale de límites
  - En `onResizeStop`: Ajustar tamaño si excede límites

**Entrada:** 
- `block` (objeto con x, y, width, height en mm)
- `reciboSize` (objeto con width, height, x, y del recibo en píxeles)

**Salida:** Bloque actualizado con posición/tamaño válido dentro de límites

---

#### `ReadOnlyBlockPreview.jsx` (Nuevo Componente)
**Responsabilidad:** Renderizar un bloque en lectura (sin edición)

**Props:**
- `block`: objeto con x, y, width, height, content (en mm)
- `reciboSize`: posición y tamaño del recibo en píxeles
- `MM_TO_PX`: factor de conversión (3.7795)

**Renderizado:**
- Div posicionado en `absolute`
- Estilos: borde (1px solid #ccc), padding, contenido innerHTML o React component (parse de Quill delta si es necesario)
- No es draggable ni resizable
- Solo lectura

**Nota:** Si el contenido está en formato Quill delta JSON, necesitará un parser o se renderizará como HTML puro.

---

#### `TemplateEditor.jsx` (Modificación)
**Cambios:**
- Importar `ReadOnlyBlockPreview`
- Usar `calculateRecibosPositions()` para obtener posiciones de todos los recibos
- Renderizar layout actual (recibo 1 con `GenericBlock` editable)
- Renderizar preview container para cada recibo adicional (recibos 2+):
  ```jsx
  {reciboPositions.map((posicion, index) => (
    index === 0 ? (
      // Recibo 1 - con GenericBlock editable
    ) : (
      // Recibos 2+ - con ReadOnlyBlockPreview
      <div key={index} style={{...posición}}>
        {blocks.map(block => (
          <ReadOnlyBlockPreview key={block.id} block={block} reciboSize={posicion} />
        ))}
      </div>
    )
  ))}
  ```

---

## Flujo de Datos

```
TemplateEditor (estado: blocks[], reciboPositions[])
    │
    ├─→ GenericBlock[0] (Recibo 1, editable)
    │   ├─→ Drag: calculateBoundaries() → validar → actualizar block.x, block.y
    │   ├─→ Resize: calculateBoundaries() → validar → actualizar block.width, block.height
    │   └─→ onChange: actualizar estado TemplateEditor
    │
    └─→ ReadOnlyBlockPreview[1..N] (Recibos 2+, lectura)
        └─→ Recibe blocks[] y reciboPositions[index], renderiza sin edición
```

**Flujo de actualización:**
1. Usuario edita bloque en `GenericBlock[0]`
2. `GenericBlock` valida contra límites
3. `GenericBlock` notifica cambio a `TemplateEditor` (callback `onBlockChange`)
4. `TemplateEditor` actualiza estado
5. React re-renderiza todos los `ReadOnlyBlockPreview` con los bloques actualizados

---

## Detalles Técnicos

### Cálculo de Límites

**Sistema de Coordenadas:**
- `block.x, block.y, block.width, block.height`: Almacenados en **MILÍMETROS** en el estado
- `reciboSize.x, reciboSize.y, reciboSize.width, reciboSize.height`: Provenientes de `calculateRecibosPositions()`, también en **MILÍMETROS**
- Internamente en `react-rnd`: Todo debe estar en **PÍXELES**

**Conversión consistente en GenericBlock:**
1. Entrada: block (mm), reciboSize (mm)
2. Rnd recibe: posiciones/tamaños × MM_TO_PX (píxeles)
3. En callbacks (onDragStop, onResizeStop):
   - Convertir de píxeles a mm
   - Validar contra límites en mm
   - Guardar en mm

**Cálculo de límites (en milímetros):**
```javascript
{
  minX: reciboSize.x,                                    // No puede ir a la izquierda del recibo
  minY: reciboSize.y,                                    // No puede ir arriba del recibo
  maxX_mm: reciboSize.x + reciboSize.width - block.width,  // Posición X máxima antes de cruzar borde derecho
  maxY_mm: reciboSize.y + reciboSize.height - block.height, // Posición Y máxima antes de cruzar borde inferior
  maxWidth_mm: reciboSize.width,                         // Ancho máximo (tamaño del recibo)
  maxHeight_mm: reciboSize.height                        // Alto máximo (tamaño del recibo)
}
```

**Aplicar límites en handleDragStop y handleResizeStop:**
```javascript
// Asegurar que el bloque nunca salga del recibo
x = Math.max(x, reciboSize.x);
x = Math.min(x, reciboSize.x + reciboSize.width - block.width);
y = Math.max(y, reciboSize.y);
y = Math.min(y, reciboSize.y + reciboSize.height - block.height);
width = Math.min(width, reciboSize.x + reciboSize.width - x);
height = Math.min(height, reciboSize.y + reciboSize.height - y);
```

### Conversión de Unidades

- El almacenamiento en BD es en **milímetros**
- `react-rnd` funciona en **píxeles**
- `ReadOnlyBlockPreview` también usa **píxeles**
- Factor de conversión: `MM_TO_PX = 3.7795`
- **En GenericBlock:** `block.width * MM_TO_PX` al pasar a Rnd
- **En ReadOnlyBlockPreview:** Lo mismo, convertir mm a px al renderizar

### Contenido de Bloques

El contenido puede estar en dos formatos:
1. **HTML puro** (si se pasó directamente)
2. **Quill Delta JSON** (si se editó con Quill)

**Solución:** En `ReadOnlyBlockPreview`, renderizar el contenido como HTML directamente en `dangerouslySetInnerHTML` si es string. Si es JSON, usar una librería o parser custom para convertir delta a HTML.

---

## Testing (Manual)

### Test 1: Constraint Horizontal
1. Abrir editor
2. Seleccionar un bloque y arrastrarlo hacia la derecha
3. **Esperado:** Bloque se frena en el borde derecho del recibo, no cruza

### Test 2: Constraint Vertical
1. Abrir editor
2. Seleccionar un bloque y arrastrarlo hacia abajo
3. **Esperado:** Bloque se frena en el borde inferior del recibo, no cruza

### Test 3: Resize Boundary
1. Abrir editor
2. Seleccionar un bloque y arrastrarlo hacia una esquina
3. Intentar redimensionar hacia afuera
4. **Esperado:** No puede crecer más allá del borde; se mantiene dentro

### Test 4: Preview Sync
1. Abrir editor (página con 2+ recibos)
2. Editar un bloque en el recibo 1 (cambiar texto, posición, tamaño)
3. **Esperado:** Los cambios se reflejan automáticamente en los recibos 2+

### Test 5: Preview Read-Only
1. Intentar hacer click en un bloque en los recibos 2+ para editarlo
2. **Esperado:** No es seleccionable ni editable

---

## Dependencias y Librerías

- `react-rnd`: Ya está instalada, se usará `bounds` prop o callbacks
- Sin nuevas dependencias requeridas

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/AdminPanel/components/GenericBlock.jsx` | Agregar constraint de boundaries |
| `frontend/src/pages/AdminPanel/components/ReadOnlyBlockPreview.jsx` | **NUEVO** |
| `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx` | Agregar renderizado de previews para recibos 2+ |
| `frontend/src/pages/AdminPanel/components/PageGuides.jsx` | Sin cambios (proporciona posiciones) |

---

## Notas de Implementación

1. **Sistema de Unidades:** El código actual mezcla mm (estado) y píxeles (Rnd). La solución está en mantener conversión consistente: mm en estado, píxeles para Rnd, validación en mm en los callbacks.
2. **Validación en Callbacks:** Los límites se aplican en `handleDragStop` y `handleResizeStop` DESPUÉS de convertir de píxeles a mm. Las fórmulas están especificadas arriba.
3. **Contenido de Bloques:** Se almacena como HTML. En `ReadOnlyBlockPreview`, renderizar directamente con `dangerouslySetInnerHTML`.
4. **Performance:** Con múltiples recibos y bloques, el re-render de previews podría impactar. Considerar memoización de `ReadOnlyBlockPreview` si es necesario.

---

## Criterios de Éxito

✅ Los bloques nunca cruzan los bordes del recibo cuando se arrastran o redimensionan  
✅ Los bloques en el recibo 1 se visualizan en todos los otros recibos de la página  
✅ Los cambios en el recibo 1 se sincronizan automáticamente en los previews  
✅ Los previews no son editables (read-only)  
✅ Tests manuales pasan

