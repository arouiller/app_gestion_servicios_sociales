# Spec: Sistema de Placeholders con Registro de Ejemplo

**Fecha:** 2026-06-13  
**Requerimiento:** BACKLOG-082 (Fase 2 - Placeholders)  
**Estado:** Diseño Aprobado

---

## Objetivo

Implementar un sistema de placeholders que permite a los usuarios insertar referencias a campos de datos (ej: {{titular_nombre}}, {{valor_cuota}}) en los bloques, y visualizar/generar PDFs con valores reales usando un registro de ejemplo seleccionado.

---

## Requerimientos

### R1: Selección de Registro de Ejemplo
- Dropdown searchable en el header del editor para seleccionar una Persona
- Búsqueda por apellido/nombre
- Al seleccionar, cargar datos completos de la Persona desde backend
- Mostrar nombre de Persona seleccionada

### R2: Inserción de Placeholders
- **Manual**: Usuario escribe directamente en editor (ej: "Afiliado {{titular_nombre}}")
- **Drag & Drop**: Usuario arrastra placeholder desde panel lateral al bloque en edición
- Panel lateral muestra placeholders categorizados (afiliado, monetarios, metadata, empresa)

### R3: Reemplazo en Tiempo Real
- Placeholders se reemplazan en todos los bloques (recibos 1+) con valores de Persona seleccionada
- Si no hay Persona seleccionada, mostrar placeholders como texto ({{placeholder}})
- Reemplazo dinámico: si cambia la Persona, todos los bloques se actualizan

### R4: Generación de PDF con Reemplazo
- Al generar PDF, usar datos de Persona seleccionada para reemplazar placeholders
- PDF muestra valores reales, no placeholders

### R5: Persistencia
- Los placeholders en los bloques se guardan como texto ({{placeholder}}) en BD
- El reemplazo ocurre en tiempo de lectura/visualización, no en tiempo de guardado

---

## Arquitectura

### Componentes Involucrados

#### `TemplateEditor.jsx` (Modificación)
**Nuevo estado:**
```javascript
const [selectedPersonId, setSelectedPersonId] = useState(null);
const [selectedPersonData, setSelectedPersonData] = useState(null);
const [personSearchResults, setPersonSearchResults] = useState([]);
const [searchInput, setSearchInput] = useState('');
```

**Nuevas funciones:**
- `handleSearchPersons(searchTerm)` - Búsqueda de Personas desde API
- `handleSelectPerson(personId)` - Carga datos de Persona seleccionada
- `replacePlaceholders(content, personData)` - Reemplaza {{placeholder}} con valores
- Pasar `selectedPersonData` como prop a GenericBlock y ReadOnlyBlockPreview

#### `GenericBlock.jsx` (Modificación)
**Nueva prop:**
- `personData` - Datos de la Persona seleccionada (null si no hay)

**Cambios:**
- Al renderizar contenido, aplicar `replacePlaceholders(block.contenido, personData)`
- Mostrar texto reemplazado en vista normal

#### `ReadOnlyBlockPreview.jsx` (Modificación)
**Nueva prop:**
- `personData` - Datos de la Persona seleccionada

**Cambios:**
- Al renderizar, aplicar `replacePlaceholders(block.contenido, personData)`

#### `RecibosTemplatesPage.scss` (Modificación)
**Nuevos estilos:**
- Dropdown de búsqueda de Personas (estilo consistente con el proyecto)

---

## Flujo de Uso

```
Usuario abre editor
    ↓
Click en dropdown "Seleccionar Persona"
    ↓
Escribe nombre/apellido para buscar
    ↓
Se cargan resultados desde API
    ↓
Usuario selecciona una Persona
    ↓
Se cargan datos de la Persona (nombre, DNI, plan, etc.)
    ↓
Todos los bloques ahora muestran placeholders reemplazados
    ↓
Usuario edita bloques, arrastra placeholders desde panel
    ↓
Al generar PDF, usa los datos de la Persona para reemplazar
```

---

## Función `replacePlaceholders`

```javascript
const replacePlaceholders = (content, personData) => {
  if (!personData || !content) return content;

  let result = content;

  // Mapeo de placeholders a valores de personData
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

  // Reemplazar cada placeholder
  Object.entries(placeholderMap).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });

  return result;
};
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx` | Agregar estado, dropdown, funciones |
| `frontend/src/pages/AdminPanel/components/GenericBlock.jsx` | Recibir prop personData, aplicar reemplazo |
| `frontend/src/pages/AdminPanel/components/ReadOnlyBlockPreview.jsx` | Recibir prop personData, aplicar reemplazo |
| `frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss` | Estilos para dropdown |
| `frontend/src/services/personasService.js` | Crear servicio para buscar Personas (si no existe) |

---

## Backend Requerido

**Endpoint para buscar Personas:**
- `GET /api/personas/search?q=apellido`
- Retorna: `[{id, nombre, apellido, numero_documento, ...}]`

**Endpoint para obtener Persona completa:**
- `GET /api/personas/:id`
- Retorna: datos completos incluido obra social, plan, etc.

---

## Criterios de Éxito

✅ Dropdown de búsqueda de Personas funciona  
✅ Placeholders se reemplazan en tiempo real en todos los bloques  
✅ Drag & drop de placeholders desde panel funciona  
✅ Manual insertion de placeholders funciona  
✅ PDF generado muestra valores reemplazados  
✅ Sin Persona seleccionada, placeholders se muestran como texto  
✅ Testing manual en remoto verifica todos los flujos

