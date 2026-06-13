# Bloques Constraint y Preview Implementación Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar constraint de bloques (nunca salen del recibo) y preview de bloques en todos los recibos de la página (sincronizado en tiempo real).

**Architecture:** 
1. **GenericBlock.jsx** - Mejorar constraint existente con lógica correcta de conversión mm↔px
2. **ReadOnlyBlockPreview.jsx** - Nuevo componente que renderiza bloques sin edición
3. **TemplateEditor.jsx** - Integrar previews para recibos 2+

**Tech Stack:** React, react-rnd, SCSS

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `GenericBlock.jsx` | Bloque editable con constraint corregido (drag, resize, límites) |
| `ReadOnlyBlockPreview.jsx` | Bloque read-only para recibos 2+ |
| `TemplateEditor.jsx` | Orquestación: renderizar GenericBlock + ReadOnlyBlockPreviews |
| `RecibosTemplatesPage.scss` | Estilos del preview (bordes, contenido) |

---

## Task 1: Refactorizar GenericBlock - Constraint Logic

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/GenericBlock.jsx`

**Cambio:** Corregir la lógica de constraint para manejar correctamente la conversión mm↔px y aplicar límites consistentes.

- [ ] **Step 1: Leer el código actual completo**

Leer `GenericBlock.jsx` líneas 1-165 para entender la estructura actual.

- [ ] **Step 2: Entender el problema**

El código actual tiene esta mezcla en handleDragStop:
- Línea 29-30: Convierte píxeles a mm: `x = d.x / MM_TO_PX; y = d.y / MM_TO_PX`
- Línea 33-36: Valida contra reciboSize (que está en mm)

Pero en línea 34, hace: `x = Math.min(x, reciboSize.x + reciboSize.width - block.width);`

El problema: `reciboSize.width` es en mm, `block.width` es en mm, pero cuando se resta, el resultado puede ser inconsistente si las conversiones no se aplican uniformemente.

- [ ] **Step 3: Crear función auxiliar para cálculo de límites**

Agregar antes de `GenericBlock` component:

```javascript
/**
 * Calcula los límites (en mm) dentro de los cuales un bloque puede moverse/redimensionarse
 * @param {Object} block - {x, y, width, height} en mm
 * @param {Object} reciboSize - {x, y, width, height} en mm
 * @returns {Object} - {minX, minY, maxX, maxY, maxWidth, maxHeight} en mm
 */
const calculateBlockLimits = (block, reciboSize) => {
  if (!reciboSize) {
    return {
      minX: -Infinity,
      minY: -Infinity,
      maxX: Infinity,
      maxY: Infinity,
      maxWidth: Infinity,
      maxHeight: Infinity
    };
  }

  return {
    minX: reciboSize.x,
    minY: reciboSize.y,
    maxX: reciboSize.x + reciboSize.width - block.width,
    maxY: reciboSize.y + reciboSize.height - block.height,
    maxWidth: reciboSize.width,
    maxHeight: reciboSize.height
  };
};
```

- [ ] **Step 4: Actualizar handleDragStop con límites corregidos**

Reemplazar handleDragStop (líneas 27-40):

```javascript
const handleDragStop = (e, d) => {
  // Convertir píxeles a mm
  let x = d.x / MM_TO_PX;
  let y = d.y / MM_TO_PX;

  const limits = calculateBlockLimits(block, reciboSize);

  // Aplicar límites: el bloque nunca sale del recibo
  x = Math.max(x, limits.minX);
  x = Math.min(x, limits.maxX);
  y = Math.max(y, limits.minY);
  y = Math.min(y, limits.maxY);

  onUpdate({ ...block, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
};
```

- [ ] **Step 5: Actualizar handleResizeStop con límites corregidos**

Reemplazar handleResizeStop (líneas 42-69):

```javascript
const handleResizeStop = (e, direction, ref, delta, position) => {
  // Convertir píxeles a mm
  let x = position.x / MM_TO_PX;
  let y = position.y / MM_TO_PX;
  let width = block.width + (delta.width / MM_TO_PX);
  let height = block.height + (delta.height / MM_TO_PX);

  const limits = calculateBlockLimits(block, reciboSize);

  // Aplicar límites: el bloque nunca sale del recibo
  x = Math.max(x, limits.minX);
  y = Math.max(y, limits.minY);

  // Asegurar que el bloque no crece más allá del borde derecho/inferior
  width = Math.min(width, limits.maxWidth);
  height = Math.min(height, limits.maxHeight);

  // Si se acerca al borde, reducir ancho/alto
  if (x + width > limits.minX + limits.maxWidth) {
    width = limits.minX + limits.maxWidth - x;
  }
  if (y + height > limits.minY + limits.maxHeight) {
    height = limits.minY + limits.maxHeight - y;
  }

  onUpdate({
    ...block,
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    width: Math.max(30, Math.round(width * 100) / 100),
    height: Math.max(20, Math.round(height * 100) / 100)
  });
};
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/GenericBlock.jsx
git commit -m "fix(bloques): corregir constraint con conversión mm/px consistente"
```

---

## Task 2: Crear Componente ReadOnlyBlockPreview

**Files:**
- Create: `frontend/src/pages/AdminPanel/components/ReadOnlyBlockPreview.jsx`

**Cambio:** Nuevo componente que renderiza bloques sin edición (read-only).

- [ ] **Step 1: Crear archivo base**

Crear `frontend/src/pages/AdminPanel/components/ReadOnlyBlockPreview.jsx`:

```javascript
import React from 'react';

const MM_TO_PX = 3.7795;

/**
 * ReadOnlyBlockPreview
 * Renderiza un bloque de forma read-only en los recibos de vista previa (recibos 2+)
 * 
 * @param {Object} block - {id, x, y, width, height, contenido} en mm
 * @param {Object} reciboSize - {x, y, width, height} en mm (posición del recibo)
 */
const ReadOnlyBlockPreview = ({ block, reciboSize }) => {
  if (!block || !reciboSize) {
    return null;
  }

  // Convertir posición y tamaño de mm a píxeles
  const posX = block.x * MM_TO_PX;
  const posY = block.y * MM_TO_PX;
  const width = block.width * MM_TO_PX;
  const height = block.height * MM_TO_PX;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '2px solid #ccc',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        padding: '8px',
        overflow: 'hidden',
        fontSize: '12px',
        lineHeight: '1.4'
      }}
      className="read-only-block-preview"
    >
      <div
        style={{ height: '100%', overflow: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: block.contenido || '<p style="color: #999;">Sin contenido</p>' }}
      />
    </div>
  );
};

export default ReadOnlyBlockPreview;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/ReadOnlyBlockPreview.jsx
git commit -m "feat(bloques): crear componente ReadOnlyBlockPreview para previsualizaciones"
```

---

## Task 3: Integrar ReadOnlyBlockPreview en TemplateEditor

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx`

**Cambio:** Renderizar ReadOnlyBlockPreview para todos los recibos excepto el recibo 1.

- [ ] **Step 1: Importar ReadOnlyBlockPreview**

Agregar al inicio del archivo (después de las otras importaciones, alrededor de línea 8):

```javascript
import ReadOnlyBlockPreview from './ReadOnlyBlockPreview';
```

- [ ] **Step 2: Entender el renderizado actual**

Leer líneas 224-248 de TemplateEditor.jsx. Actualmente renderiza:
- PageGuides (guías visuales)
- GenericBlock para cada bloque (editable)

Necesitamos agregar previews después del contenido del recibo 1.

- [ ] **Step 3: Crear función helper para renderizar previews**

Agregar antes del return (alrededor de línea 198):

```javascript
/**
 * Renderiza bloques read-only para todos los recibos excepto el primero
 */
const renderBlockPreviews = () => {
  if (!reciboPositions || !reciboPositions.recibos || reciboPositions.recibos.length <= 1) {
    return null;
  }

  const bloques = currentTemplate.bloques || [];
  const recibos = reciboPositions.recibos;

  return recibos.slice(1).map((recibo, index) => (
    <div
      key={`recibo-${recibo.number}`}
      style={{
        position: 'absolute',
        left: `${recibo.x * 3.7795}px`,
        top: `${recibo.y * 3.7795}px`,
        width: `${recibo.width * 3.7795}px`,
        height: `${recibo.height * 3.7795}px`,
        border: '2px solid #4dabf7',
        borderRadius: '2px',
        overflow: 'hidden',
        backgroundColor: 'white'
      }}
      className="preview-recibo"
    >
      {/* Número del recibo */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          fontSize: '10px',
          color: '#4dabf7',
          fontWeight: 'bold',
          zIndex: 5
        }}
      >
        {recibo.number}
      </div>

      {/* Bloques read-only */}
      {bloques.map(block => (
        <ReadOnlyBlockPreview
          key={block.id}
          block={block}
          reciboSize={recibo}
        />
      ))}
    </div>
  ));
};
```

- [ ] **Step 4: Agregar previews al renderizado**

Localizar el cierre del `<div className="a4-page">` (línea 248). Agregar justo antes:

```javascript
            {/* Previsualizaciones de bloques en otros recibos */}
            {renderBlockPreviews()}
```

El estructura quedaría:
```javascript
          <div className="a4-page" ref={canvasRef}>
            {/* Guías visuales */}
            {currentTemplate.bloque_pageconfig && (
              <PageGuides pageConfig={currentTemplate.bloque_pageconfig} />
            )}

            {/* Bloques genéricos - Recibo 1 (editable) */}
            {(currentTemplate.bloques || []).map(block => (
              <GenericBlock
                key={block.id}
                block={block}
                reciboSize={reciboUnoSize}
                isSelected={selectedBlockId === block.id}
                onSelect={() => setSelectedBlockId(block.id)}
                onUpdate={handleUpdateBlock}
                onDelete={() => handleDeleteBlock(block.id)}
              />
            ))}

            {/* Previsualizaciones de bloques en otros recibos */}
            {renderBlockPreviews()}

            {(!currentTemplate.bloques || currentTemplate.bloques.length === 0) && (
              <div className="a4-empty-state">
                <p>📋 No hay bloques. Usa el botón "+ Agregar Bloque" para comenzar.</p>
              </div>
            )}
          </div>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/TemplateEditor.jsx
git commit -m "feat(bloques): renderizar previsualizaciones en todos los recibos"
```

---

## Task 4: Testing Manual

**Cambio:** Verificar que constraint y previews funcionan correctamente.

- [ ] **Step 1: Iniciar servidor frontend**

```bash
cd frontend
npm start
```

Esperado: Servidor inicia en `http://localhost:3000`

- [ ] **Step 2: Navegar al editor de templates**

1. Acceder a `http://localhost:3000`
2. Ir a Admin Panel → Recibos Templates
3. Seleccionar un template existente (o crear uno)
4. Abrir el editor de bloques

- [ ] **Step 3: Test - Constraint Horizontal**

1. Hacer click en un bloque para seleccionarlo
2. Intentar arrastrarlo hacia la derecha más allá del borde azul del recibo
3. **Esperado:** El bloque se frena en el borde, no cruza la línea azul

- [ ] **Step 4: Test - Constraint Vertical**

1. Seleccionar un bloque
2. Intentar arrastrarlo hacia abajo más allá del borde azul del recibo
3. **Esperado:** El bloque se frena en el borde, no cruza la línea azul

- [ ] **Step 5: Test - Constraint en Resize**

1. Seleccionar un bloque
2. Arrastrar desde la esquina inferior derecha hacia afuera del recibo
3. **Esperado:** El bloque no puede crecer más allá del borde derecho/inferior

- [ ] **Step 6: Test - Preview en Recibo 2+**

1. Verificar que haya 2+ recibos en la página (depende de configuración)
2. Editar un bloque en el recibo 1: cambiar texto, mover, redimensionar
3. Mirar el recibo 2: **Esperado:** El bloque aparece con el mismo contenido, posición y tamaño, sin borde azul (es gris)
4. **Esperado:** Los cambios en recibo 1 se reflejan automáticamente en recibo 2+

- [ ] **Step 7: Test - Bloques Read-Only en Previews**

1. Intentar hacer click en un bloque del recibo 2+
2. **Esperado:** No es seleccionable, no tiene editor Quill

- [ ] **Step 8: Commit (sin cambios de código, solo documentación)**

```bash
git add .
git commit -m "test(bloques): verificación manual de constraint y previews - OK"
```

O si hay cambios:

```bash
git add frontend/...
git commit -m "test(bloques): correcciones derivadas de testing manual"
```

---

## Self-Review

**Spec Coverage:**
- ✅ R1 "Constraint de Bloques": Task 1 (GenericBlock constraint logic)
- ✅ R2 "Preview en Todos los Recibos": Task 2 (ReadOnlyBlockPreview) + Task 3 (integración en TemplateEditor)
- ✅ "Sistema de Unidades": Task 1 maneja conversión mm↔px
- ✅ "Testing Manual": Task 4 cubre todos los test cases

**Placeholder Scan:**
- ✅ Todos los pasos tienen código completo
- ✅ Comandos exactos con salida esperada
- ✅ Rutas exactas de archivos
- ✅ Sin "TBD", "TODO", "similar a"

**Type Consistency:**
- ✅ `block` siempre {x, y, width, height} en mm
- ✅ `reciboSize` siempre {x, y, width, height} en mm
- ✅ Conversión a píxeles solo dentro de componentes de renderizado
- ✅ `calculateBlockLimits()` retorna objeto consistente

**No Gaps:** Todos los requerimientos de la spec están cubiertos.

---

## Next Steps

Plan completo y guardado. Dos opciones de ejecución:

**1. Subagent-Driven (recomendado)** - Despachamos un subagent fresco por task, revisamos entre tasks, iteración rápida

**2. Inline Execution** - Ejecutar tasks en esta sesión con checkpoints de revisión

¿Cuál prefieres?

