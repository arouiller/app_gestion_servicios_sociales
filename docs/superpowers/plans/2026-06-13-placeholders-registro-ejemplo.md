# Sistema de Placeholders con Registro de Ejemplo - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar sistema de placeholders que reemplaza {{placeholder}} con datos reales de una Persona seleccionada, visible en editor y PDF.

**Architecture:** 
- Estado centralizado en TemplateEditor (selectedPersonId, selectedPersonData)
- Función replacePlaceholders() aplicada en GenericBlock y ReadOnlyBlockPreview
- Dropdown searchable para seleccionar Persona
- Reemplazo en tiempo real en editor y en PDF generado

**Tech Stack:** React, Axios, Quill

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `personasService.js` | Búsqueda y obtención de Personas |
| `TemplateEditor.jsx` | Estado centralizado, dropdown, orquestación |
| `GenericBlock.jsx` | Reemplazo en bloques editables |
| `ReadOnlyBlockPreview.jsx` | Reemplazo en bloques de vista previa |
| `RecibosTemplatesPage.scss` | Estilos dropdown |

---

## Task 1: Crear/Actualizar Servicio de Personas

**Files:**
- Create/Modify: `frontend/src/services/personasService.js`

- [ ] **Step 1: Verificar si existe personasService**

Buscar si existe el archivo personasService.js

- [ ] **Step 2: Crear servicio de Personas (si no existe)**

Crear `frontend/src/services/personasService.js`:

```javascript
import api from './api';

const personasService = {
  /**
   * Buscar Personas por nombre/apellido
   * GET /api/personas/search?q=searchTerm
   */
  searchPersonas: async (searchTerm) => {
    try {
      const response = await api.get('/personas/search', {
        params: { q: searchTerm }
      });
      return {
        success: response.data.success,
        data: response.data.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: []
      };
    }
  },

  /**
   * Obtener Persona completa con todos sus datos
   * GET /api/personas/:id
   */
  getPersona: async (id) => {
    try {
      const response = await api.get(`/personas/${id}`);
      return {
        success: response.data.success,
        data: response.data.data || null
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: null
      };
    }
  }
};

export default personasService;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/personasService.js
git commit -m "feat(servicios): crear personasService para búsqueda y obtención de personas"
```

---

## Task 2: Crear Función replacePlaceholders

**Files:**
- Create: `frontend/src/utils/placeholderReplacer.js`

- [ ] **Step 1: Crear archivo utilidad**

Crear `frontend/src/utils/placeholderReplacer.js`:

```javascript
/**
 * Reemplaza placeholders {{placeholder}} con valores de Persona
 * @param {string} content - Contenido con placeholders
 * @param {object} personData - Datos de la Persona
 * @returns {string} - Contenido con placeholders reemplazados
 */
export const replacePlaceholders = (content, personData) => {
  if (!personData || !content) return content;

  let result = content;

  const placeholderMap = {
    '{{numero_afiliado}}': personData.numero_afiliado || '',
    '{{tipo_documento}}': personData.tipo_documento || '',
    '{{numero_documento}}': personData.numero_documento || '',
    '{{titular_apellido}}': personData.apellido || '',
    '{{titular_nombre}}': personData.nombre || '',
    '{{fecha_nacimiento}}': personData.fecha_nacimiento || '',
    '{{obra_social_nombre}}': personData.obra_social_nombre || '',
    '{{tipo_plan_nombre}}': personData.tipo_plan_nombre || '',
    '{{tipo_de_grupo_nombre}}': personData.tipo_de_grupo_nombre || '',
    '{{domicilio}}': personData.domicilio || '',
    '{{localidad_nombre}}': personData.localidad_nombre || '',
    '{{fecha_cobertura}}': personData.fecha_cobertura || '',
    '{{zona_codigo}}': personData.zona_codigo || '',
    '{{valor_cuota}}': personData.valor_cuota || '',
    '{{cuota_social}}': personData.cuota_social || '',
    '{{arancel_por_servicio}}': personData.arancel_por_servicio || '',
    '{{numero_recibo}}': personData.numero_recibo || '',
    '{{periodo}}': personData.periodo || '',
    '{{fecha_generacion}}': new Date().toLocaleDateString('es-AR'),
    '{{empresa_nombre}}': personData.empresa_nombre || '',
    '{{empresa_direccion}}': personData.empresa_direccion || ''
  };

  Object.entries(placeholderMap).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  return result;
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/utils/placeholderReplacer.js
git commit -m "feat(utils): crear placeholderReplacer para reemplazar placeholders con valores"
```

---

## Task 3: Agregar Estado y Dropdown en TemplateEditor

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx`

- [ ] **Step 1: Importar dependencias**

Agregar al inicio del archivo:

```javascript
import personasService from '../../../services/personasService';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';
```

- [ ] **Step 2: Agregar estado**

Después de `const [editingBlockId, setEditingBlockId] = useState(null);`:

```javascript
const [selectedPersonId, setSelectedPersonId] = useState(null);
const [selectedPersonData, setSelectedPersonData] = useState(null);
const [personSearchResults, setPersonSearchResults] = useState([]);
const [personSearchInput, setPersonSearchInput] = useState('');
const [personSearchOpen, setPersonSearchOpen] = useState(false);
```

- [ ] **Step 3: Crear función handleSearchPersonas**

Agregar antes del return:

```javascript
const handleSearchPersonas = async (searchTerm) => {
  setPersonSearchInput(searchTerm);
  
  if (searchTerm.trim().length < 2) {
    setPersonSearchResults([]);
    return;
  }

  const result = await personasService.searchPersonas(searchTerm);
  if (result.success) {
    setPersonSearchResults(result.data);
    setPersonSearchOpen(true);
  }
};

const handleSelectPersona = async (personId) => {
  setSelectedPersonId(personId);
  setPersonSearchOpen(false);
  
  const result = await personasService.getPersona(personId);
  if (result.success) {
    setSelectedPersonData(result.data);
  }
};
```

- [ ] **Step 4: Agregar dropdown en header**

Localizar el header (línea ~330). Agregar después del botón "? Placeholders":

```javascript
        {/* Dropdown Búsqueda de Personas */}
        <div className="person-selector" style={{ position: 'relative', minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Buscar Persona..."
            value={personSearchInput}
            onChange={(e) => handleSearchPersonas(e.target.value)}
            onFocus={() => personSearchInput && setPersonSearchOpen(true)}
            className="person-search-input"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          {selectedPersonData && (
            <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
              ✓ {selectedPersonData.nombre} {selectedPersonData.apellido}
            </small>
          )}
          {personSearchOpen && personSearchResults.length > 0 && (
            <div
              className="person-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '200px',
                overflowY: 'auto',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                zIndex: 1000,
                marginTop: '4px'
              }}
            >
              {personSearchResults.map(person => (
                <div
                  key={person.id}
                  onClick={() => handleSelectPersona(person.id)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  {person.nombre} {person.apellido} ({person.numero_documento})
                </div>
              ))}
            </div>
          )}
        </div>
```

- [ ] **Step 5: Pasar personData a GenericBlock**

Localizar donde se renderiza GenericBlock (línea ~370). Agregar prop:

```javascript
                personData={selectedPersonData}
```

- [ ] **Step 6: Pasar personData a renderBlockPreviews**

Modificar la función renderBlockPreviews para que pase personData a ReadOnlyBlockPreview (dentro de renderBlockPreviews, línea ~300):

```javascript
        {bloques.map(block => (
          <ReadOnlyBlockPreview
            key={block.id}
            block={block}
            reciboSize={recibo}
            personData={selectedPersonData}
          />
        ))}
```

- [ ] **Step 7: Actualizar generatePdf para reemplazar placeholders**

Modificar la función `generatePdf` (línea ~120). En el contenido que genera HTML, reemplazar placeholders antes de generar PDF:

```javascript
  const generatePdf = async (shouldDownload = true) => {
    if (!canvasRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Crear copia del canvas con placeholders reemplazados
      const canvasCopy = canvasRef.current.cloneNode(true);
      
      // Reemplazar placeholders en todos los bloques
      if (selectedPersonData) {
        canvasCopy.querySelectorAll('[class*="generic-block"]').forEach(blockEl => {
          const originalHTML = blockEl.innerHTML;
          const replacedHTML = replacePlaceholders(originalHTML, selectedPersonData);
          blockEl.innerHTML = replacedHTML;
        });
        canvasCopy.querySelectorAll('[class*="read-only-block"]').forEach(blockEl => {
          const originalHTML = blockEl.innerHTML;
          const replacedHTML = replacePlaceholders(originalHTML, selectedPersonData);
          blockEl.innerHTML = replacedHTML;
        });
      }

      const options = {
        margin: 10,
        filename: `recibo_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      const pdfGenerator = html2pdf()
        .set(options)
        .from(canvasCopy);

      if (shouldDownload) {
        await pdfGenerator.save();
      } else {
        const pdfDataUrl = await pdfGenerator.outputPdf('dataurlstring');
        window.open(pdfDataUrl, '_blank');
      }

      setLoading(false);
    } catch (err) {
      setError('Error generando PDF: ' + err.message);
      setLoading(false);
    }
  };
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/TemplateEditor.jsx
git commit -m "feat(editor): agregar dropdown de búsqueda de personas y estado centralizado"
```

---

## Task 4: Modificar GenericBlock para Usar personData

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/GenericBlock.jsx`

- [ ] **Step 1: Importar función**

Agregar al inicio:

```javascript
import { replacePlaceholders } from '../../../utils/placeholderReplacer';
```

- [ ] **Step 2: Agregar prop personData**

Modificar la firma del componente:

```javascript
const GenericBlock = ({
  block,
  reciboSize,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isEditing,
  onDoubleClick,
  onClickOutside,
  personData
}) => {
```

- [ ] **Step 3: Modificar renderizado de contenido**

Reemplazar donde se muestra el contenido (línea ~135):

```javascript
        ) : (
          <div
            style={{ height: '100%', fontSize: '12px', overflow: 'hidden' }}
            dangerouslySetInnerHTML={{
              __html: replacePlaceholders(block.contenido || '<p style="color: #999;">Haz doble click para editar</p>', personData)
            }}
          />
        )
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/GenericBlock.jsx
git commit -m "feat(bloques): aplicar reemplazo de placeholders en GenericBlock"
```

---

## Task 5: Modificar ReadOnlyBlockPreview para Usar personData

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/ReadOnlyBlockPreview.jsx`

- [ ] **Step 1: Importar función**

Agregar al inicio:

```javascript
import { replacePlaceholders } from '../../../utils/placeholderReplacer';
```

- [ ] **Step 2: Agregar prop personData**

Modificar la firma:

```javascript
const ReadOnlyBlockPreview = ({ block, reciboSize, personData }) => {
```

- [ ] **Step 3: Aplicar reemplazo en renderizado**

Modificar el dangerouslySetInnerHTML:

```javascript
        dangerouslySetInnerHTML={{
          __html: replacePlaceholders(block.contenido || '<p style="color: #999;">Sin contenido</p>', personData)
        }}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/ReadOnlyBlockPreview.jsx
git commit -m "feat(preview): aplicar reemplazo de placeholders en ReadOnlyBlockPreview"
```

---

## Task 6: Agregar Drag & Drop de Placeholders

**Files:**
- Modify: `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx`

- [ ] **Step 1: Agregar eventos drag en panel de placeholders**

Localizar el panel de placeholders (línea ~470). Modificar cada placeholder para ser draggable:

```javascript
                <div
                  key={placeholder}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', placeholder);
                  }}
                  style={{
                    padding: '8px',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    cursor: 'move',
                    fontSize: '12px',
                    userSelect: 'none'
                  }}
                >
                  {placeholder}
                </div>
```

- [ ] **Step 2: Agregar evento drop en bloque en edición**

En GenericBlock.jsx, agregar manejo de drag & drop en el editor Quill (cuando isEditing es true):

En la sección donde renderiza Quill, agregar:

```javascript
        {isEditing ? (
          <div style={{...}}>
            Editando...
          </div>
        ) : (
```

Modificar para que el contenedor sea dropable cuando isEditing:

```javascript
        {isEditing ? (
          <div
            style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const placeholder = e.dataTransfer.getData('text/plain');
              if (placeholder && placeholder.startsWith('{{')) {
                // Agregar placeholder al final del contenido
                const newContent = (block.contenido || '') + placeholder;
                onUpdate({ ...block, contenido: newContent });
              }
            }}
          >
            👆 Editando en la barra superior
          </div>
        ) : (
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AdminPanel/components/GenericBlock.jsx frontend/src/pages/AdminPanel/components/TemplateEditor.jsx
git commit -m "feat(placeholders): agregar drag & drop de placeholders desde panel"
```

---

## Task 7: Agregar Estilos

**Files:**
- Modify: `frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss`

- [ ] **Step 1: Agregar estilos para dropdown de personas**

Agregar al final:

```scss
// Selector de Personas
.person-selector {
  flex-shrink: 0;

  .person-search-input {
    background: white;
    border: 1px solid #ddd;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #4dabf7;
      box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.1);
    }
  }

  .person-dropdown {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    div {
      &:last-child {
        border-bottom: none;
      }
    }
  }
}

// Drag & drop placeholders
[draggable="true"] {
  &:active {
    opacity: 0.7;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss
git commit -m "style(placeholders): agregar estilos para selector de personas"
```

---

## Task 8: Testing Manual

**Cambio:** Verificar que el sistema de placeholders funciona correctamente.

- [ ] **Step 1: Buscar y seleccionar una Persona**

1. Abrir editor de templates
2. En el header, escribir en "Buscar Persona..."
3. Seleccionar una Persona de los resultados
4. **Esperado:** Nombre de Persona aparece debajo del input

- [ ] **Step 2: Verificar reemplazo en bloques**

1. Crear un bloque con placeholders (ej: "Afiliado {{titular_nombre}} con documento {{numero_documento}}")
2. **Esperado:** El bloque muestra valores reales (ej: "Afiliado Juan García con documento 12345678")

- [ ] **Step 3: Verificar reemplazo en preview (recibos 2+)**

1. Con 2+ recibos configurados
2. Verificar que recibos 2+ también muestran placeholders reemplazados
3. **Esperado:** Todos los recibos muestran los mismos valores

- [ ] **Step 4: Verificar drag & drop de placeholders**

1. Con un bloque en edición
2. Hacer drag & drop de un placeholder desde el panel lateral
3. **Esperado:** Placeholder se agrega al contenido del bloque

- [ ] **Step 5: Verificar PDF con reemplazo**

1. Hacer click en "Ver PDF"
2. Abrir el PDF generado
3. **Esperado:** PDF muestra valores reales, no placeholders

- [ ] **Step 6: Cambiar Persona y verificar actualización**

1. Seleccionar otra Persona
2. **Esperado:** Todos los bloques se actualizan automáticamente con nuevos valores

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "test(placeholders): verificación manual del sistema - OK"
```

---

## Self-Review

**Spec Coverage:**
- ✅ R1 "Selección de Registro": Task 3 (dropdown)
- ✅ R2 "Inserción de Placeholders": Task 6 (drag & drop) + Manual (escritura)
- ✅ R3 "Reemplazo en Tiempo Real": Task 4-5 (aplicar replacePlaceholders)
- ✅ R4 "PDF con Reemplazo": Task 3 (generatePdf modificado)
- ✅ R5 "Persistencia": placeholders se guardan como texto

**Placeholder Scan:**
- ✅ Todos los pasos tienen código completo
- ✅ Comandos exactos
- ✅ Rutas exactas

**Type Consistency:**
- ✅ `personData` siempre es objeto con campos de Persona
- ✅ `replacePlaceholders(content, personData)` consistente
- ✅ `selectedPersonId`, `selectedPersonData` consistentes

---

## Ejecución

Plan completo. Procediéndome con ejecución inline.

