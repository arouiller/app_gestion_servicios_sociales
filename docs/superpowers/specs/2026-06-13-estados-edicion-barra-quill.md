# Spec: Estados de Edición y Barra Quill Única

**Fecha:** 2026-06-13  
**Requerimiento:** BACKLOG-082 (mejoras UI)  
**Estado:** Diseño Aprobado

---

## Objetivo

Mejorar la experiencia de edición de bloques con dos estados (normal/editando), y centralizar la barra de herramientas Quill en la parte superior del canvas.

---

## Requerimientos

### R1: Estados de Edición de Bloques
- **Estado Normal**: Bloque interactivo (draggable, resizable) mostrando contenido como HTML sin editor
  - Borde: 2px solid #4dabf7 (azul claro)
- **Estado Editando**: Activado con doble click
  - Borde: 3px solid #28a745 (verde) + shadow
  - Editor Quill visible dentro del bloque como placeholder
- **Salir de edición**: Click fuera del bloque
  - Contenido se guarda en estado temporal (`pendingBlocks`)
  - Borde vuelve a azul claro

### R2: Barra Quill Centralizada
- Una sola barra Quill en la parte superior del canvas
- Siempre visible en pantalla
- Habilitada solo cuando hay un bloque en edición (`editingBlockId !== null`)
- Deshabilitada cuando no hay bloque en edición (opacity 0.5, pointer-events none)
- Los cambios en la barra se reflejan en tiempo real en el bloque editado

### R3: Gestión de Cambios Temporales
- Click afuera del bloque → guarda contenido en `pendingBlocks` (estado local)
- Cambio de bloque (doble click en otro) → guarda automáticamente el anterior, luego carga el nuevo
- Click en botón "Guardar" global → persiste todos los `pendingBlocks` a BD

### R4: Persistencia
- Solo el botón "Guardar" global persiste cambios a BD
- Antes de persistir, sincroniza `pendingBlocks` con `currentTemplate.bloques`
- API endpoint existente maneja la persistencia

---

## Arquitectura

### Componentes Involucrados

#### `GenericBlock.jsx` (Modificación)
**Nuevas props:**
- `isEditing: boolean` - Indica si el bloque está en modo edición
- `onDoubleClick: (blockId, content) => void` - Activar edición
- `onClickOutside: () => void` - Salir de edición

**Comportamiento:**
- Si `!isEditing`: Renderiza contenido como HTML + borde azul
- Si `isEditing`: Renderiza borde verde + placeholder para editor Quill
- Double click en cualquier parte → llama `onDoubleClick()`
- Click fuera del bloque → llama `onClickOutside()`

#### `TemplateEditor.jsx` (Modificación)
**Nuevo estado:**
```javascript
const [editingBlockId, setEditingBlockId] = useState(null);
const [editingContent, setEditingContent] = useState('');
const [pendingBlocks, setPendingBlocks] = useState({});
```

**Nuevas funciones:**
- `handleBlockDoubleClick(blockId, content)`: Activa edición, carga contenido en la barra
- `handleBlockClickOutside()`: Guarda contenido temporal, limpia edición
- `handleToolbarChange(content)`: Actualiza `editingContent` desde la barra Quill
- `handleSave()`: Sincroniza `pendingBlocks` con estado y persiste a BD

**Renderizado:**
- Barra Quill fija arriba del canvas (siempre visible)
- `GenericBlock` recibe props `isEditing`, `onDoubleClick`, `onClickOutside`

#### `RecibosTemplatesPage.scss` (Modificación)
**Nuevos estilos:**
```scss
.generic-block {
  border: 2px solid #4dabf7;
  transition: border-color 0.2s;

  &.editing {
    border: 3px solid #28a745;
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.1);
  }
}

.editor-toolbar {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;

  .ql-disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
```

---

## Flujo de Edición

```
Usuario hace doble click en Bloque A
    ↓
handleBlockDoubleClick(A_id, A_content)
    ├─ Guarda pendingBlocks[anteriores] si hay bloque anterior
    ├─ setEditingBlockId(A_id)
    ├─ setEditingContent(A_content)
    └─ GenericBlock A muestra borde verde + editor placeholder
    
Usuario edita en barra Quill
    ↓
handleToolbarChange(newContent)
    ├─ setEditingContent(newContent)
    └─ GenericBlock A refleja cambios en tiempo real
    
Usuario hace click fuera de Bloque A
    ↓
handleBlockClickOutside()
    ├─ pendingBlocks[A_id] = editingContent
    ├─ setEditingBlockId(null)
    ├─ setEditingContent('')
    └─ GenericBlock A vuelve a borde azul
    
Usuario hace doble click en Bloque B
    ↓
handleBlockDoubleClick(B_id, B_content)
    ├─ Guarda pendingBlocks[A_id] = editingContent (anterior)
    ├─ setEditingBlockId(B_id)
    ├─ setEditingContent(B_content)
    └─ GenericBlock B muestra borde verde
    
Usuario hace click en "Guardar"
    ↓
handleSave()
    ├─ Sincroniza: bloques = bloques.map(b => pendingBlocks[b.id] || b)
    ├─ updateTemplate({ bloques, isDirty: true })
    ├─ Persiste a BD via API
    └─ Limpia pendingBlocks
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/AdminPanel/components/GenericBlock.jsx` | Agregar props, cambiar lógica de renderizado |
| `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx` | Agregar estado, barra Quill, funciones, props |
| `frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss` | Nuevos estilos para estados |

---

## Criterios de Éxito

✅ Doble click activa edición (borde verde)  
✅ Click afuera desactiva edición (borde azul, contenido guardado temporal)  
✅ Cambio de bloque guarda automáticamente el anterior  
✅ Barra Quill única, siempre visible, disabled cuando no hay edición  
✅ Cambios en barra reflejados en tiempo real en el bloque  
✅ Botón "Guardar" persiste todos los cambios a BD  
✅ Testing manual en remoto verifica todos los flujos  

