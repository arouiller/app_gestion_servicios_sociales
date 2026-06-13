# Estados de Edición y Barra Quill Única - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar estados de edición a bloques (normal/editando) y centralizar la barra Quill en la parte superior del canvas.

**Architecture:** 
- `GenericBlock.jsx` recibe props para gestionar estado de edición (isEditing, onDoubleClick, onClickOutside)
- `TemplateEditor.jsx` mantiene estado centralizado (editingBlockId, editingContent, pendingBlocks)
- Barra Quill única en la parte superior del canvas, sincronizada con el bloque en edición
- Estilos diferenciados: borde azul (normal) vs borde verde (editando)

**Tech Stack:** React, react-quill, Zustand, SCSS

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `GenericBlock.jsx` | Bloque con dos estados visuales, manejo de double-click y click-outside |
| `TemplateEditor.jsx` | Gestión de estado centralizado, barra Quill, funciones de edición |
| `RecibosTemplatesPage.scss` | Estilos para estados (borde azul/verde, shadow, disabled) |

---

## Task 1: Modificar GenericBlock.jsx - Agregar Props y Lógica de Estados

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/GenericBlock.jsx`

- [ ] **Step 1: Leer el código actual**

Leer `GenericBlock.jsx` completo para entender la estructura actual.

- [ ] **Step 2: Agregar nuevas props al componente**

Reemplazar la firma del componente:

```javascript
const GenericBlock = ({ 
  block, 
  reciboSize, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete,
  isEditing,           // NUEVO
  onDoubleClick,       // NUEVO
  onClickOutside       // NUEVO
}) => {
```

- [ ] **Step 3: Modificar el renderizado basado en isEditing**

Reemplazar el contenido del `<Rnd>` (líneas 115-137):

```javascript
      {isEditing ? (
        // MODO EDICIÓN: placeholder para editor Quill
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '12px'
          }}
        >
          👆 Editando en la barra superior
        </div>
      ) : (
        // MODO NORMAL: mostrar contenido como HTML
        <div
          style={{ height: '100%', fontSize: '12px', overflow: 'hidden' }}
          onClick={() => {}}
          dangerouslySetInnerHTML={{ __html: block.contenido || '<p style="color: #999;">Haz doble click para editar</p>' }}
        />
      )}
```

- [ ] **Step 4: Agregar manejador de double-click**

Reemplazar el prop `onClick` del `<Rnd>` (línea 113):

```javascript
        onClick={(e) => {
          onSelect();
          if (e.detail === 2) {
            // Double-click
            onDoubleClick(block.id, block.contenido || '');
          }
        }}
```

Nota: `e.detail === 2` detects double-click.

- [ ] **Step 5: Agregar manejador de click afuera**

Agregar un efecto al inicio del componente para detectar clicks afuera:

```javascript
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e) => {
      // Verificar si el click fue fuera del bloque
      const blockElement = document.querySelector(`[data-block-id="${block.id}"]`);
      if (blockElement && !blockElement.contains(e.target)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, block.id, onClickOutside]);
```

- [ ] **Step 6: Agregar data-block-id al Rnd para identificación**

Agregar atributo al `<Rnd>`:

```javascript
        data-block-id={block.id}
```

- [ ] **Step 7: Actualizar className para reflejar estado**

Reemplazar el prop `className` del `<Rnd>`:

```javascript
        className={`generic-block ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/GenericBlock.jsx
git commit -m "feat(bloques): agregar props isEditing, onDoubleClick, onClickOutside"
```

---

## Task 2: Modificar TemplateEditor.jsx - Agregar Estado Centralizado

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx`

- [ ] **Step 1: Agregar nuevo estado**

Agregar después de `const [selectedBlockId, setSelectedBlockId] = useState(null);` (línea 19):

```javascript
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [pendingBlocks, setPendingBlocks] = useState({});
```

- [ ] **Step 2: Crear función handleBlockDoubleClick**

Agregar antes de `return (` (alrededor de línea 198):

```javascript
  const handleBlockDoubleClick = (blockId, content) => {
    // Si hay un bloque anterior en edición, guardarlo
    if (editingBlockId && editingBlockId !== blockId) {
      setPendingBlocks(prev => ({
        ...prev,
        [editingBlockId]: editingContent
      }));
    }

    // Cargar el nuevo bloque para editar
    setEditingBlockId(blockId);
    setEditingContent(content);
  };
```

- [ ] **Step 3: Crear función handleBlockClickOutside**

Agregar después de `handleBlockDoubleClick`:

```javascript
  const handleBlockClickOutside = () => {
    // Guardar contenido actual en pendingBlocks
    if (editingBlockId) {
      setPendingBlocks(prev => ({
        ...prev,
        [editingBlockId]: editingContent
      }));
    }

    // Limpiar estado de edición
    setEditingBlockId(null);
    setEditingContent('');
  };
```

- [ ] **Step 4: Crear función handleToolbarChange**

Agregar después de `handleBlockClickOutside`:

```javascript
  const handleToolbarChange = (content) => {
    setEditingContent(content);
  };
```

- [ ] **Step 5: Modificar handleSave para sincronizar pendingBlocks**

Reemplazar la función `handleSave` (líneas 58-79):

```javascript
  const handleSave = async () => {
    if (!currentTemplate.bloque_pageconfig) {
      setError('Bloque 5 (Configuración de Página) es obligatorio');
      return;
    }

    // Sincronizar pendingBlocks con bloques actuales
    const syncedBloques = (currentTemplate.bloques || []).map(b => 
      pendingBlocks[b.id] !== undefined 
        ? { ...b, contenido: pendingBlocks[b.id] }
        : b
    );

    setLoading(true);
    setIsSaving(true);

    const result = await templateService.updateTemplate(currentTemplate.id, {
      ...currentTemplate,
      bloques: syncedBloques
    });

    if (result.success) {
      setSuccessMessage('Template guardado exitosamente');
      setPendingBlocks({}); // Limpiar pendingBlocks tras guardar
      setTimeout(() => setSuccessMessage(null), 2000);
      updateTemplate({ isDirty: false });
    } else {
      setError(result.message || 'Error guardando template');
    }

    setLoading(false);
    setIsSaving(false);
  };
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/TemplateEditor.jsx
git commit -m "feat(bloques): agregar estado centralizado editingBlockId, editingContent, pendingBlocks"
```

---

## Task 3: Agregar Barra Quill Única en TemplateEditor.jsx

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx`

- [ ] **Step 1: Agregar barra Quill arriba del canvas**

Localizar `<div className="editor-canvas">` (línea 223). Agregar la barra justo antes:

```javascript
      <div className="editor-container-new">
        {/* Barra de edición Quill - NUEVA */}
        {currentTemplate.bloque_pageconfig && (
          <div className="editor-toolbar">
            <ReactQuill
              value={editingContent}
              onChange={handleToolbarChange}
              readOnly={editingBlockId === null}
              theme="snow"
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'size': ['small', false, 'large', 'huge'] }],
                  ['link', 'image']
                ]
              }}
              style={{
                opacity: editingBlockId === null ? 0.5 : 1,
                pointerEvents: editingBlockId === null ? 'none' : 'auto'
              }}
            />
          </div>
        )}

        {/* Canvas A4 */}
        <div className="editor-canvas">
          ...
```

- [ ] **Step 2: Pasar props a GenericBlock**

Reemplazar el mapeo de bloques (líneas 231-241):

```javascript
            {/* Bloques genéricos - Recibo 1 (editable) */}
            {(currentTemplate.bloques || []).map(block => (
              <GenericBlock
                key={block.id}
                block={block}
                reciboSize={reciboUnoSize}
                isSelected={selectedBlockId === block.id}
                isEditing={editingBlockId === block.id}
                onSelect={() => setSelectedBlockId(block.id)}
                onDoubleClick={handleBlockDoubleClick}
                onClickOutside={handleBlockClickOutside}
                onUpdate={handleUpdateBlock}
                onDelete={() => handleDeleteBlock(block.id)}
              />
            ))}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/TemplateEditor.jsx
git commit -m "feat(bloques): agregar barra quill única en parte superior del canvas"
```

---

## Task 4: Agregar Estilos en RecibosTemplatesPage.scss

**Files:**
- Modify: `frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss`

- [ ] **Step 1: Leer el archivo scss actual**

Leer `RecibosTemplatesPage.scss` para entender la estructura.

- [ ] **Step 2: Agregar estilos para generic-block normal y editing**

Agregar al final del archivo (o donde se definan los estilos de generic-block):

```scss
// Estados de Generic Block
.generic-block {
  border: 2px solid #4dabf7;
  transition: border-color 0.2s, box-shadow 0.2s;

  &.editing {
    border: 3px solid #28a745;
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.1);
  }
}

// Toolbar deshabilitado
.editor-toolbar {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;

  .ql-toolbar {
    border: 1px solid #e0e0e0;
    border-bottom: none;
  }

  .ql-container {
    border: 1px solid #e0e0e0;
  }

  .ql-toolbar.ql-disabled {
    opacity: 0.5;
    pointer-events: none;
    background-color: #f0f0f0;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss
git commit -m "style(bloques): agregar estilos para estados de edición (borde azul/verde)"
```

---

## Task 5: Testing Manual

**Cambio:** Verificar que estados de edición y barra Quill funcionan correctamente.

- [ ] **Step 1: Verificar doble click activa edición**

1. Abrir editor de templates
2. Hacer doble click en un bloque
3. **Esperado:** Borde cambia a verde, texto "👆 Editando en la barra superior" aparece

- [ ] **Step 2: Verificar barra Quill se habilita**

1. Con bloque en edición
2. Observar barra Quill en la parte superior
3. **Esperado:** Barra está habilitada, puede escribir/formatear

- [ ] **Step 3: Verificar cambios en barra se reflejan en tiempo real**

1. Con bloque en edición, escribir en la barra Quill
2. **Esperado:** El texto del bloque se actualiza en tiempo real

- [ ] **Step 4: Verificar click afuera desactiva edición**

1. Con bloque en edición, hacer click en otra área del canvas
2. **Esperado:** Borde vuelve a azul, barra Quill se deshabilita

- [ ] **Step 5: Verificar cambio de bloque guarda automáticamente**

1. Editar bloque A (escribir algo)
2. Doble click en bloque B
3. Hacer click afuera de bloque B
4. Volver a bloque A con doble click
5. **Esperado:** El contenido de A está guardado

- [ ] **Step 6: Verificar botón "Guardar" persiste a BD**

1. Editar un bloque, hacer click afuera
2. Hacer click en botón "Guardar"
3. **Esperado:** Cambios se persisten, mensaje "Template guardado exitosamente"

- [ ] **Step 7: Commit (sin cambios de código)**

```bash
git add .
git commit -m "test(bloques): verificación manual de estados de edición y barra quill - OK"
```

---

## Self-Review

**Spec Coverage:**
- ✅ R1 "Estados de Edición": Task 1 (props isEditing, className) + Task 4 (estilos)
- ✅ R2 "Barra Quill Centralizada": Task 3 (barra Quill) + estilos disabled
- ✅ R3 "Gestión de Cambios Temporales": Task 2 (pendingBlocks, handleClickOutside)
- ✅ R4 "Persistencia": Task 2 (handleSave sincroniza)

**Placeholder Scan:**
- ✅ Todos los pasos tienen código completo
- ✅ Comandos exactos con esperados
- ✅ Rutas exactas de archivos
- ✅ Sin "TBD", "TODO"

**Type Consistency:**
- ✅ `isEditing: boolean` consistente
- ✅ `editingBlockId: string | null` consistente
- ✅ `editingContent: string` consistente
- ✅ `pendingBlocks: object` con estructura `{blockId: contenido}`

**No Gaps:** Todos los requerimientos cubiertos.

---

## Next Steps

Plan completo. Ejecutando tasks inline con checkpoints.

