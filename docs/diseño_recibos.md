# Editor Visual de Templates de Recibos (BACKLOG-081)

## Requerimiento General

Implementar un editor visual WYSIWYG para diseñar templates de recibos que reemplace el editor anterior basado en formularios. El nuevo editor debe permitir:

### Funcionalidades Principales
- **Edición visual directa**: Editar contenido directamente en la tabla renderizada (contentEditable)
- **Tabla dinámica**: Crear tablas con cualquier número de filas y columnas
- **Merge/Split de celdas**: Combinar celdas vertical y horizontalmente con validación de integridad
- **Resize interactivo**: Ajustar ancho de columnas y alto de filas arrastrando desde la vista previa
- **Placeholders**: Insertar todos los placeholders disponibles con un click
- **Estilos por celda**: Fuente, tamaño, color, efectos (bold, italic, underline, strikethrough)
- **Control de bordes**: Grosor, estilo (solid, dashed, dotted, double) y color por cada lado
- **Configuración de página**: 
  - Tamaño (A4, A5, Carta, Personalizado)
  - Orientación (Vertical/Horizontal)
  - Márgenes individuales de página (top, right, bottom, left) en mm
  - Márgenes individuales del recibo dentro de la página en mm
  - Cantidad de recibos por página (apilados verticalmente)
- **Guardado**: Crear nuevo template, sobrescribir existente o crear nueva versión

---

## Arquitectura Técnica

### Modelo de Datos

#### Celda (Cell)
```javascript
{
  id: string,              // UUID único
  content: string,         // Contenido editable
  hidden: boolean,         // true si es parte de un merge
  rowspan: number,         // Extensión vertical
  colspan: number,         // Extensión horizontal
  style: {
    borderTop: { width: number, style: string, color: string },
    borderRight: { width: number, style: string, color: string },
    borderBottom: { width: number, style: string, color: string },
    borderLeft: { width: number, style: string, color: string },
    fontFamily: string,      // Arial, Times New Roman, etc.
    fontWeight: 'normal' | 'bold',
    fontStyle: 'normal' | 'italic',
    textDecoration: string,  // 'none' | 'underline' | 'line-through' | combinaciones
    textAlign: 'left' | 'center' | 'right',
    fontSize: number,        // px (6-72)
    backgroundColor: string, // hex color o ''
    color: string,           // hex color
    padding: number,         // px
    verticalAlign: 'top' | 'middle' | 'bottom'
  }
}
```

#### Fila (Row)
```javascript
{
  id: string,
  height: number | null,   // px, null = auto
  cells: Cell[]            // Longitud siempre = numColumns
}
```

#### Tabla (Table)
```javascript
{
  rows: Row[],
  columnWidths: number[],  // Porcentajes que suman 100
  tableStyle: { width: '100%' }
}
```

#### Configuración de Página (PageConfig)
```javascript
{
  size: 'A4' | 'A5' | 'Carta' | 'Personalizado',
  orientation: 'portrait' | 'landscape',
  pageMargins: { top: number, right: number, bottom: number, left: number }, // mm
  reciboMargins: { top: number, right: number, bottom: number, left: number }, // mm
  recibosPerPage: number   // 1-10
}
```

#### Estado del Store (Zustand)
```javascript
{
  table: Table,
  pageConfig: PageConfig,
  currentTemplate: {
    id: string | null,
    nombre: string,
    templateGroupId: string | null,
    versionNumber: number,
    activo: boolean
  },
  selection: {
    anchor: { row: number, col: number } | null,
    focus: { row: number, col: number } | null
  },
  activeCellPos: { row: number, col: number } | null,
  activeCellRef: React.MutableRefObject,
  isSaving: boolean,
  isDirty: boolean,
  error: string | null
}
```

### Conversión HTML ↔ Modelo

#### generateHTML()
- Serializa la tabla a HTML con estilos inline
- Incluye colgroup para anchos de columna
- Cada celda contiene style con todas las propiedades CSS
- Wrapper div con márgenes del recibo

#### parseHTMLtoTable(html)
- Busca tabla en el HTML
- Mapea filas y columnas con cursor para rastrear rowspan/colspan
- Parsea atributos style inline a propiedades del modelo
- Fallback a tabla por defecto 3×3 si no hay filas válidas

### Persistencia

#### Almacenamiento en BD
- Campo `margins` guarda pageConfig como JSON string
- Evita cambios de esquema, compatible con versioning existente
- Backend deserializa al retornar templates

---

## Stack Tecnológico

### Frontend
- **React 18**: Framework base
- **Zustand**: State management (store global)
- **Axios**: HTTP requests a través de instancia configurada
- **SCSS**: Estilos con variables globales
- **Hooks nativos**: useRef, useState, useEffect
- **contentEditable**: Edición directa de celdas
- **Selection API**: Inserción de placeholders con cursor

### Backend
- **Express.js**: API REST
- **Sequelize**: ORM para ReciboTemplate
- **JWT**: Autenticación con middleware verifyToken, requireAdmin

### Conversión Unidades
- **MM_TO_PX = 3.7795**: Conversión de milímetros a píxeles (96 DPI)
- **SCALE = 0.8**: Factor de escala para que quepa en viewport

---

## Endpoints API

### GET /api/admin/recibos/templates/active
Obtiene el template activo actualmente.

**Headers**: Authorization: Bearer {jwt_token}

**Response (200)**:
```json
{
  "id": "uuid",
  "nombre": "Template Principal",
  "html": "<table>...",
  "pageSize": "A4",
  "orientation": "portrait",
  "margins": "{\"size\":\"A4\",...}",
  "activo": true,
  "templateGroupId": null,
  "versionNumber": 1,
  "createdAt": "2026-05-25T...",
  "updatedAt": "2026-05-25T..."
}
```

**Response (404)**:
```json
{
  "error": "No active template found"
}
```

### GET /api/admin/recibos/placeholders
Obtiene lista de placeholders disponibles por categoría.

**Headers**: Authorization: Bearer {jwt_token}

**Response (200)**:
```json
{
  "categories": {
    "recibo": [
      { "placeholder": "{{numero_recibo}}", "label": "Numero Recibo" },
      ...
    ],
    "monetarios": [
      { "placeholder": "{{valor_cuota}}", "label": "Valor Cuota" },
      ...
    ]
  }
}
```

### POST /api/admin/recibos/templates/save
Guarda un template (crear, sobrescribir o nueva versión).

**Headers**: Authorization: Bearer {jwt_token}

**Request Body**:
```json
{
  "id": "uuid | null",
  "html": "<table><tbody>...",
  "pageSize": "A4",
  "orientation": "portrait",
  "margins": "{\"size\":\"A4\",\"orientation\":\"portrait\",...}",
  "saveMode": "create" | "overwrite" | "new_version",
  "versionName": "v1.1" // opcional, solo para new_version
}
```

**Response (201/200)**:
```json
{
  "success": true,
  "templateId": "uuid",
  "message": "Template creado",
  "template": {
    "id": "uuid",
    "nombre": "Template Principal",
    "html": "<table>...",
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": "{...}",
    "activo": true,
    "templateGroupId": null,
    "versionNumber": 1,
    "createdAt": "...",
    "updatedAt": "...",
    "createdBy": { "id": "...", "nombre": "..." },
    "updatedBy": { "id": "...", "nombre": "..." }
  }
}
```

**Error (400)**:
```json
{
  "error": "Validation failed",
  "details": ["HTML no puede estar vacío", "pageSize debe ser uno de: ..."]
}
```

**Error (401)**:
```json
{
  "error": "Token inválido"
}
```

---

## Componentes Frontend

### Estructura de Carpetas
```
frontend/src/components/ReciboDesigner/
├── EditorToolbar.jsx                 # Barra de herramientas
├── ReciboDesignerCanvas.jsx          # Lienzo con previsualización
├── ReciboDesigner.scss               # Estilos
├── EditableTable/
│   ├── EditableTable.jsx             # Tabla principal editable
│   ├── EditableCell.jsx              # Celda con contentEditable
│   ├── ColResizeHandle.jsx           # Handle para resize de columnas
│   └── RowResizeHandle.jsx           # Handle para resize de filas
├── hooks/
│   ├── useColumnResize.js            # Lógica de resize de columnas
│   ├── useRowResize.js               # Lógica de resize de filas
│   └── useTableSelection.js          # Lógica de selección de rango
└── SidePanel/
    ├── SidePanel.jsx                 # Contenedor con pestañas
    ├── CellStylePanel.jsx            # Estilos de celda (fuente, tamaño, etc.)
    ├── BorderStylePanel.jsx          # Control de bordes
    ├── PlaceholderPanel.jsx          # Inserción de placeholders
    ├── PageConfigPanel.jsx           # Configuración de página
    ├── SavePanel.jsx                 # Guardar, versiones, exportar
    └── TableStructurePanel.jsx       # Estructura (filas/columnas)
```

### Jerarquía de Componentes
```
ReciboDesignerPage
├── EditorToolbar
├── div.recibo-designer-page__body
│   ├── div.recibo-designer-page__canvas-area
│   │   └── ReciboDesignerCanvas
│   │       ├── div.paper (página 1)
│   │       │   ├── div (márgenes)
│   │       │   │   └── EditableTable
│   │       │   │       ├── table
│   │       │   │       │   └── EditableCell x N
│   │       │   │       └── ColResizeHandle x N
│   │       │   │       └── RowResizeHandle x N
│   │       │   └── (más páginas para recibosPerPage > 1)
│   │       └── div.paper (página 2, read-only si recibosPerPage > 1)
│   │           └── TablePreview
│   └── SidePanel
│       ├── Tab: Celda
│       │   └── CellStylePanel
│       ├── Tab: Bordes
│       │   └── BorderStylePanel
│       ├── Tab: Placeholders
│       │   └── PlaceholderPanel
│       ├── Tab: Página
│       │   └── PageConfigPanel
│       └── Tab: Guardar
│           └── SavePanel
```

---

## Flujos Principales

### 1. Cargar Template (sin template activo)
1. ReciboDesignerPage.useEffect → reciboDesignerService.getActiveTemplate()
2. Backend retorna 404 "No active template found"
3. Frontend crea template inicial:
   - HTML: tabla 3×3 vacía con tbody
   - pageConfig: valores por defecto (A4, portrait, márgenes 10mm recibo 4mm)
   - Llama loadTemplate() en el store
4. parseHTMLtoTable() deserializa HTML a estructura de tabla
5. ReciboDesignerCanvas renderiza tabla en lienzo

### 2. Editar Celda
1. Usuario hace click en celda → EditableCell onMouseDown
2. setActiveCell() actualiza activeCellPos y activeCellRef
3. Contenido editable con contentEditable="true"
4. onBlur → updateCellContent() sincroniza al store
5. store marca isDirty = true

### 3. Cambiar Estilos
1. Usuario interactúa con CellStylePanel
2. updateCellStyle() en store actualiza cell.style parcialmente
3. EditableCell re-renderiza con nuevos estilos inline
4. Cambio inmediato visible en canvas

### 4. Merge Celdas
1. Usuario selecciona rango con mouse (onMouseDown + onMouseEnter)
2. setSelection() en store almacena anchor y focus
3. Click "Merge" en EditorToolbar
4. mergeCells(r1, c1, r2, c2) en store:
   - Valida que ninguna celda del rango sea "dueña" de merge fuera del rango
   - Asigna rowspan, colspan a celda (r1, c1)
   - Marca resto como hidden
   - Concatena contenidos
5. EditableTable no renderiza celdas hidden
6. td tiene colSpan y rowSpan desde el modelo

### 5. Guardar Template
1. Usuario click "Guardar" en SavePanel
2. generateHTML() serializa tabla a HTML con estilos inline
3. handleSave() hace POST a /api/admin/recibos/templates/save
4. Envía:
   - html: tabla HTML serializada
   - pageSize: pageConfig.size
   - orientation: pageConfig.orientation
   - margins: JSON.stringify(pageConfig) completo
   - saveMode: 'create' | 'overwrite'
5. Backend valida, crea/actualiza ReciboTemplate en BD
6. setSaving(false) cuando termina

### 6. Resize Columna
1. Usuario arrastra ColResizeHandle
2. useColumnResize.onHandleMouseDown() inicia drag
3. document.addEventListener('mousemove') ajusta columnWidths
4. Balancear ancho: si col i aumenta, col i+1 disminuye
5. setColumnWidths() en store
6. table.colgroup se actualiza con nuevos porcentajes

---

## Algoritmos Clave

### mergeCells(r1, c1, r2, c2)
```
1. Validar integridad:
   - Para cada celda (r, c) en rango:
     - Si rowspan > (r2 - r), ERROR (merge sale del rango)
     - Si colspan > (c2 - c), ERROR (merge sale del rango)

2. Recolectar contenidos:
   - Concatenar content de todas celdas no-hidden en rango

3. Asignar merge:
   - cell[r1][c1].rowspan = r2 - r1 + 1
   - cell[r1][c1].colspan = c2 - c1 + 1
   - cell[r1][c1].content = contenidos concatenados

4. Marcar ocultas:
   - Para cada (r, c) en rango excepto (r1, c1):
     - cell[r][c].hidden = true
     - cell[r][c].rowspan = 1
     - cell[r][c].colspan = 1
     - cell[r][c].content = ''
```

### splitCell(row, col)
```
1. Leer rowspan = R, colspan = C de cell[row][col]

2. Revertir merge:
   - cell[row][col].rowspan = 1
   - cell[row][col].colspan = 1

3. Mostrar ocultas:
   - Para cada (r, c) en rectángulo [row, row+R-1] × [col, col+C-1]:
     - cell[r][c].hidden = false
     - cell[r][c].content = '' (vacío)
```

### parseHTMLtoTable(html)
```
1. DOMParser.parseFromString(html, 'text/html')

2. Buscar tabla:
   - document.querySelector('table')
   - Si no hay, usar getDefaultTable()

3. Buscar filas:
   - table.querySelectorAll('tbody > tr')
   - Si vacío, tabla.querySelectorAll('tr')
   - Si aún vacío, usar getDefaultTable()

4. Rastrear columnas con cursor:
   - cellCursor[row][col] = cuántas celdas anteriores cubren esta posición
   - Si cellCursor[row][col] > 0, skip (es parte de un rowspan de arriba)

5. Parsear cada celda:
   - Buscar td con índice ajustado por colspan/rowspan anteriores
   - Extraer content, rowspan, colspan
   - Parsear style inline CSS a propiedades del modelo
   - Parsear bordes desde style="border-top:1px solid #000"

6. Crear newTable con todas las filas parseadas
```

---

## Validaciones

### Backend (templateValidator.js)

#### validateHTML(html)
- No vacío
- Contiene `<table>` o `<div>`

#### validatePlaceholders(html)
- Placeholders usados están en lista permitida
- Categorías: recibo, monetarios

#### validatePageConfig(pageSize, orientation, margins)
- pageSize: A4 | A5 | Carta | Personalizado
- orientation: portrait | landscape
- margins: JSON válido con pageMargins y reciboMargins, O número 0-50

### Frontend (SavePanel.jsx)
- html: no vacío (verificado en EditableTable)
- pageConfig.size: debe ser válido
- pageConfig.orientation: debe ser válido
- Token JWT presente en localStorage como 'jwt_token'

---

## Problemas Encontrados y Solucionados

### 1. crypto.randomUUID() No Disponible
**Problema**: Hostinger no soporta crypto.randomUUID() en algunos navegadores.
**Solución**: Crear función `generateId()` con timestamp + Math.random().
**Commits**: `8d624d8`

### 2. Clave Incorrecta de Token en localStorage
**Problema**: SavePanel buscaba 'token' pero se guarda como 'jwt_token'.
**Solución**: Cambiar localStorage.getItem('token') → localStorage.getItem('jwt_token').
**Commits**: `b65714c`

### 3. Precedencia de Operadores
**Problema**: `canSplit` evaluaba incorrectamente sin paréntesis.
**Solución**: Agregar paréntesis y usar nullish coalescing (??) para valores por defecto.
**Commits**: `9af5717`

### 4. Endpoint Incorrecto
**Problema**: SavePanel usaba `/api/admin/recibo-templates` que no existe.
**Solución**: Cambiar a `/api/admin/recibos/templates/save` que está en routes/admin.js.
**Commits**: `cd18ba0`

### 5. Formato de Datos Inconsistente
**Problema**: Frontend enviaba pageConfig como objeto, backend esperaba pageSize, orientation, margins separados.
**Solución**: Enviar pageSize y orientation como campos, margins como JSON.stringify(pageConfig).
**Commits**: `cd18ba0`, `3f64919`

### 6. Validador Obsoleto
**Problema**: validatePageConfig esperaba margins como número 0-50, ahora es JSON string.
**Solución**: Actualizar validador para parsear JSON y validar estructura pageMargins/reciboMargins.
**Commits**: `6cef909`

### 7. HTML Parseado Sin tbody
**Problema**: parseHTMLtoTable buscaba 'tbody > tr' exclusivamente.
**Solución**: Fallback a 'tr' si no hay tbody, y validar que existan filas.
**Commits**: `b29d668`, `203de1e`, `f0df36d`

---

## Estado Actual (25 de Mayo 2026)

### ✅ Completado
- [x] Editor visual WYSIWYG con tabla editable
- [x] Merge/Split de celdas con validación
- [x] Resize de filas y columnas
- [x] Selección de rango con mouse
- [x] Inserción de placeholders
- [x] Control de estilos (fuente, tamaño, bold, italic, etc.)
- [x] Control de bordes (grosor, estilo, color por lado)
- [x] Configuración de página (tamaño, orientación, márgenes)
- [x] Múltiples recibos por página
- [x] Guardado de templates (create, overwrite)
- [x] Carga de template activo
- [x] Manejo de caso sin template activo

### 🔄 En Progreso
- [ ] Pruebas funcionales completas en servidor

### ⏳ No Iniciado
- [ ] Nueva versión de templates
- [ ] Exportar como HTML
- [ ] Duplicar template
- [ ] Historial de versiones
- [ ] Previsualización de PDF
- [ ] Validación más estricta de placeholders por contexto

---

## Commits Principales

```
6cef909 fix(BACKLOG-081): actualizar validador para soportar margins como JSON string
b65714c fix(BACKLOG-081): usar jwt_token en lugar de token en SavePanel
3f64919 fix(BACKLOG-081): usar margins en lugar de pageConfig en saveMode create
cd18ba0 fix(BACKLOG-081): corregir endpoint y formato de datos en SavePanel
f0df36d fix(BACKLOG-081): manejar caso cuando no hay filas en tabla parseada
203de1e fix(BACKLOG-081): parseHTMLtoTable más flexible sin requerir tbody
b29d668 fix(BACKLOG-081): incluir tbody en HTML inicial para parseHTMLtoTable
3b172f2 fix(BACKLOG-081): pasar margins como JSON string en template inicial
9af5717 fix(BACKLOG-081): arreglar precedencia operadores y usar selector en EditorToolbar
8d624d8 fix(BACKLOG-081): reemplazar crypto.randomUUID() con función simple generateId()
cd18ba0 fix(BACKLOG-081): corregir endpoint y formato de datos en SavePanel
9833f30 chore(BACKLOG-081): eliminar componentes obsoletos del editor anterior
fe86e67 feat(BACKLOG-081): layout visual ReciboDesignerPage con EditorToolbar y SidePanel
18720c5 feat(BACKLOG-081): SidePanel con CellStyle, Border, Placeholder, PageConfig y Save
c5f643b feat(BACKLOG-081): EditorToolbar con estructura, merge, split y formato
e8672fd feat(BACKLOG-081): ReciboDesignerCanvas con hoja de papel y múltiples recibos
9d0d965 feat(BACKLOG-081): EditableTable, EditableCell, ColResizeHandle, RowResizeHandle
339bdc1 feat(BACKLOG-081): hooks useColumnResize, useRowResize, useTableSelection
334685c feat(BACKLOG-081): nuevo store con modelo de tabla, merge/split, generateHTML, parseHTML
9fa2f07 feat(BACKLOG-081): agregar saveMode create en adminController para primer guardado
```

---

## Cómo Usar

### Para Usuarios
1. Navegar a Admin Panel > Diseño de Templates de Recibos
2. Si no hay template activo, se crea uno vacío 3×3
3. Editar directamente en las celdas
4. Usar EditorToolbar para estructura (filas/columnas, merge)
5. Usar SidePanel para estilos y configuración
6. Click "Guardar" en SidePanel > SavePanel para persistir

### Para Desarrolladores
1. Store: `/frontend/src/stores/reciboDesigner.store.js`
2. Componentes: `/frontend/src/components/ReciboDesigner/`
3. Rutas: `/backend/src/routes/admin.js` (POST /recibos/templates/save)
4. Controller: `/backend/src/controllers/v1.0/adminController.js` (saveTemplate)
5. Validador: `/backend/src/utils/validators/templateValidator.js`
6. BD: Model ReciboTemplate con campo `margins` (JSON string)

### Debugging
- Abrir DevTools > Console para revisar errores
- Network tab para ver requests/responses
- Redux DevTools para Zustand (si está instalado)
- localStorage.getItem('jwt_token') para verificar autenticación

---

## Referencias

- Plan original: `/docs/superpowers/plans/YYYY-MM-DD-table-builder-recibos-plan.md`
- Spec: `/docs/superpowers/specs/YYYY-MM-DD-table-builder-recibos-design.md`
- CLAUDE.md: Instrucciones del proyecto
- BUGS.md: Issues reportados y resueltos
