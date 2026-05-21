# ESPECIFICACIÓN: Table Builder para Templates de Recibos (BACKLOG-081)

**Fecha:** 2026-05-21  
**Autor:** Proceso de brainstorming  
**Estado:** Especificación Formal  
**Versión:** 1.0

---

## 1. Resumen Ejecutivo

Crear una herramienta visual accesible a administradores que permita diseñar y personalizar templates HTML de recibos **sin conocimiento técnico**. Los administradores podrán construir tablas dinámicamente, insertar placeholders de datos, ver vista previa en tiempo real, y guardar cambios (sobrescribiendo el template actual o creando versiones nuevas).

**Beneficio:** Elimina dependencia de desarrolladores para personalización de templates; administradores diseñan directamente en minutos.

---

## 2. Contexto y Problema

### Situación Actual
- Templates de recibos almacenados en tabla `recibo_templates` como HTML crudo
- Personalización requiere SQL directo o intervención del desarrollador
- Mayoría de templates usan estructura de tabla (filas × columnas)
- Cambios son lentos y propensos a errores

### Problema
Administradores no pueden personalizar templates de forma autónoma ni rápida.

### Solución
Interfaz visual Table Builder especializada para tablas, con vista previa en tiempo real y versionado automático.

---

## 3. Especificación Funcional

### 3.1 Ubicación y Acceso

**URL:** `/admin/recibo-designer`  
**Acceso:** Solo usuarios con rol `admin` (validar en middleware)  
**Navegación:** Admin Panel → Configuración → "Diseñador de Recibos"

### 3.2 Comportamiento al Cargar

1. Página GET `/admin/recibo-designer` se carga
2. Frontend hace `GET /api/admin/recibos/templates/active`
3. Backend devuelve template activo (con `activo = true`)
4. Editor carga estructura del template en la grilla
5. Vista previa renderiza HTML en tiempo real

Si no hay template activo → mostrar grilla vacía (3×3) y permitir crear uno nuevo.

### 3.3 Acciones del Usuario

#### **A. Estructura de Tabla**

Sección de herramientas (lado izquierdo):

| Acción | Comportamiento |
|--------|-----------------|
| `+ Fila` | Agrega fila al final de la tabla |
| `- Fila` | Elimina última fila (con confirmación) |
| `+ Columna` | Agrega columna a todas las filas |
| `- Columna` | Elimina última columna (con confirmación) |
| `Limpiar` | Resetea tabla vacía (con confirmación) |

#### **B. Edición de Celdas**

- Seleccionar celda → editor inline muestra:
  - Tipo de contenido: `Texto libre` | `Placeholder` | `Vacío`
  - Campo de texto para contenido
  - Colspan (número)
- Cambios actualizan vista previa en tiempo real

#### **C. Placeholders Disponibles**

Selector desplegable con placeholders categorizados:

```
Datos del Recibo:
  {{numero_recibo}}, {{numero_afiliado}}, {{periodo}},
  {{titular_apellido}}, {{titular_nombre}}, {{fecha_nacimiento}},
  {{fecha_cobertura}}, {{numero_documento}}, {{obra_social_nombre}},
  {{tipo_plan_nombre}}, {{tipo_de_grupo_nombre}}, {{domicilio}},
  {{localidad_nombre}}, {{zona_codigo}}

Valores Monetarios:
  {{valor_cuota}}, {{cuota_social}}, {{arancel_por_servicio}},
  {{arancel_negativo_class}}
```

Cada placeholder tiene botón "Copiar" para insertar en celda seleccionada.

#### **D. Configuración de Página**

Lado derecho, bajo vista previa:

| Control | Opciones | Default |
|---------|----------|---------|
| Tamaño | A4, A5, Carta, Personalizado | A4 |
| Orientación | Vertical, Horizontal | Vertical |
| Márgenes | Input numérico (mm) | 8 |

#### **E. Guardar (Actualizado)**

Dos opciones de guardado:

**Opción 1: "Guardar" (sobrescribe)**
- Actualiza template activo actual (mismo ID)
- `saveMode: "overwrite"`
- Confirmación: "Template actualizado"
- Versión no cambia

**Opción 2: "Guardar como nueva versión"**
- Crea nuevo template con `version_number = actual + 1`
- Establece como activo (`activo: true`)
- Desactiva todas las otras versiones del mismo grupo (`activo: false`)
- Confirmación: "Nueva versión v{N} creada y establecida como activa"

#### **F. Acciones Adicionales**

- **"Ver historial"** → Modal muestra todas las versiones del template
- **"Exportar HTML"** → Descarga archivo `.html` para validar/enviar
- **"Copiar al portapapeles"** → Copia HTML para pegar en otra app

---

## 4. Especificación Técnica

### 4.1 Modelo de Datos

#### Tabla: `recibo_templates` (nueva/modificada)

```sql
CREATE TABLE recibo_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  html LONGTEXT NOT NULL,
  page_size ENUM('A4', 'A5', 'Carta', 'Personalizado') DEFAULT 'A4',
  orientation ENUM('portrait', 'landscape') DEFAULT 'portrait',
  margins INT DEFAULT 8,
  activo BOOLEAN DEFAULT false,
  template_group_id INT,  -- FK: agrupa versiones del mismo template
  version_number INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,  -- FK: Usuario
  updated_by INT,  -- FK: Usuario
  FOREIGN KEY (template_group_id) REFERENCES recibo_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES usuarios(id),
  FOREIGN KEY (updated_by) REFERENCES usuarios(id),
  UNIQUE KEY (template_group_id, version_number),
  INDEX idx_activo (activo),
  INDEX idx_template_group (template_group_id)
);
```

**Notas:**
- Primer template de un grupo tiene `template_group_id = NULL` o `self-reference`
- Las versiones posteriores tienen `template_group_id = id del template original`
- Solo un template por grupo puede tener `activo = true`

#### Tabla: `recibo_template_versions` (auditoría, opcional)

```sql
CREATE TABLE recibo_template_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  html_snapshot LONGTEXT,
  changed_by INT NOT NULL,  -- FK: Usuario
  change_description VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES recibo_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES usuarios(id)
);
```

---

### 4.2 Endpoints API

#### **GET `/api/admin/recibos/templates/active`**

Devuelve template activo actual.

**Request:** (Sin parámetros)

**Response (200):**
```json
{
  "id": 1,
  "nombre": "Previsora del Norte",
  "html": "<table>...</table>",
  "pageSize": "A4",
  "orientation": "portrait",
  "margins": 8,
  "activo": true,
  "templateGroupId": null,
  "versionNumber": 1,
  "createdAt": "2026-05-15T10:00:00Z",
  "updatedAt": "2026-05-21T14:30:00Z",
  "createdBy": { "id": 1, "nombre": "Admin" },
  "updatedBy": { "id": 1, "nombre": "Admin" }
}
```

**Response (404):** Si no hay template activo
```json
{ "error": "No active template found" }
```

---

#### **POST `/api/admin/recibos/templates/save`**

Guarda cambios (sobrescribe o nueva versión).

**Request:**
```json
{
  "id": 1,
  "html": "<table><tr><td>EMPRESA</td><td>{{numero_recibo}}</td></tr>...</table>",
  "pageSize": "A4",
  "orientation": "portrait",
  "margins": 8,
  "saveMode": "overwrite|new_version"
}
```

**Response (200) - Sobrescribe:**
```json
{
  "success": true,
  "templateId": 1,
  "versionNumber": 1,
  "message": "Template actualizado",
  "template": { ...full template object... }
}
```

**Response (201) - Nueva versión:**
```json
{
  "success": true,
  "templateId": 2,
  "versionNumber": 2,
  "message": "Nueva versión v2 creada y establecida como activa",
  "template": { ...full template object... }
}
```

**Response (400):** Validación fallida
```json
{
  "error": "Validation failed",
  "details": [
    "HTML debe contener al menos 1 <table> o <div>",
    "Placeholder {{invalid_field}} no existe"
  ]
}
```

**Response (401/403):** No autorizado

---

#### **GET `/api/admin/recibos/templates/versions?template_group_id=1`**

Devuelve historial de versiones de un template.

**Response (200):**
```json
{
  "templateGroupId": 1,
  "versions": [
    {
      "id": 1,
      "versionNumber": 1,
      "nombre": "Previsora del Norte",
      "activo": false,
      "createdAt": "2026-05-15T10:00:00Z"
    },
    {
      "id": 2,
      "versionNumber": 2,
      "nombre": "Previsora del Norte",
      "activo": true,
      "createdAt": "2026-05-21T14:30:00Z"
    }
  ]
}
```

---

#### **GET `/api/admin/recibos/placeholders`**

Devuelve lista de placeholders disponibles.

**Response (200):**
```json
{
  "categories": {
    "recibo": [
      { "placeholder": "{{numero_recibo}}", "label": "Número de Recibo" },
      { "placeholder": "{{numero_afiliado}}", "label": "Número de Afiliado" },
      { "placeholder": "{{periodo}}", "label": "Período" },
      { "placeholder": "{{titular_apellido}}", "label": "Apellido del Titular" },
      { "placeholder": "{{titular_nombre}}", "label": "Nombre del Titular" },
      { "placeholder": "{{fecha_nacimiento}}", "label": "Fecha de Nacimiento" },
      { "placeholder": "{{fecha_cobertura}}", "label": "Fecha de Cobertura" },
      { "placeholder": "{{numero_documento}}", "label": "Número de Documento" },
      { "placeholder": "{{obra_social_nombre}}", "label": "Obra Social" },
      { "placeholder": "{{tipo_plan_nombre}}", "label": "Tipo de Plan" },
      { "placeholder": "{{tipo_de_grupo_nombre}}", "label": "Tipo de Grupo" },
      { "placeholder": "{{domicilio}}", "label": "Domicilio" },
      { "placeholder": "{{localidad_nombre}}", "label": "Localidad" },
      { "placeholder": "{{zona_codigo}}", "label": "Código de Zona" }
    ],
    "monetarios": [
      { "placeholder": "{{valor_cuota}}", "label": "Valor de Cuota" },
      { "placeholder": "{{cuota_social}}", "label": "Cuota Social" },
      { "placeholder": "{{arancel_por_servicio}}", "label": "Arancel por Servicio" },
      { "placeholder": "{{arancel_negativo_class}}", "label": "Clase de Arancel Negativo" }
    ]
  }
}
```

---

### 4.3 Componentes React

#### **Estructura de Carpetas**

```
frontend/src/
├── pages/
│   └── AdminPanel/
│       └── ReciboDesignerPage.jsx        # Página principal
├── components/
│   └── ReciboDesigner/
│       ├── ReciboDesignerToolbar.jsx     # Panel de herramientas
│       ├── StructureControls.jsx         # + Fila, - Fila, etc.
│       ├── PlaceholderSelector.jsx       # Desplegable placeholders
│       ├── InlineEditor.jsx              # Tabla editable de celdas
│       ├── ReciboPreview.jsx             # Vista previa HTML
│       ├── PageControls.jsx              # Tamaño, márgenes, orientación
│       ├── SaveActions.jsx               # Botones de guardado
│       └── ReciboDesigner.scss           # Estilos
├── stores/
│   └── reciboDesigner.store.js           # Zustand store
└── services/
    └── reciboDesignerService.js          # API calls
```

#### **ReciboDesignerPage.jsx**

Componente página. Responsabilidades:
1. Cargar template activo on mount
2. Gestionar estado global (Zustand store)
3. Layout dos paneles: toolbar + preview
4. Manejo de errores y loading states

#### **ReciboDesignerToolbar.jsx**

Componente izquierdo. Contiene:
- StructureControls (botones + Fila, - Fila, etc.)
- PlaceholderSelector (desplegable de placeholders con copiar)
- InlineEditor (tabla de 4 columnas: Fila | Columna | Contenido | Colspan)

#### **ReciboPreview.jsx**

Componente derecho. Contiene:
- HTMLRenderer (renderiza grid actual como HTML)
- PageControls (tamaño, orientación, márgenes)
- SaveActions (botones Guardar / Guardar como nueva versión / Exportar)

#### **Zustand Store: `reciboDesigner.store.js`**

```javascript
export const useReciboDesignerStore = create((set) => ({
  // State
  grid: [],  // Array de filas: [{ cells: [{ content, colspan }, ...] }, ...]
  pageConfig: { size: 'A4', orientation: 'portrait', margins: 8 },
  currentTemplate: null,  // Template activo cargado
  isSaving: false,
  error: null,

  // Actions
  loadTemplate: (template) => set({ currentTemplate: template, grid: parseHTMLtoGrid(template.html) }),
  addRow: () => set((state) => ({ grid: [...state.grid, { cells: Array(state.grid[0]?.cells.length || 3).fill({ content: '', colspan: 1 }) }] })),
  deleteRow: () => set((state) => ({ grid: state.grid.slice(0, -1) })),
  addColumn: () => set((state) => ({ grid: state.grid.map(row => ({ cells: [...row.cells, { content: '', colspan: 1 }] })) })),
  deleteColumn: () => set((state) => ({ grid: state.grid.map(row => ({ cells: row.cells.slice(0, -1) })) })),
  updateCell: (rowIdx, cellIdx, content, colspan) => set((state) => {
    const newGrid = [...state.grid];
    newGrid[rowIdx].cells[cellIdx] = { content, colspan: parseInt(colspan) };
    return { grid: newGrid };
  }),
  setPageConfig: (config) => set((state) => ({ pageConfig: { ...state.pageConfig, ...config } })),
  generateHTML: () => {
    // Convierte state.grid a HTML <table>
  },
  saveTemplate: async (saveMode) => {
    // POST /api/admin/recibos/templates/save
  },
  clearError: () => set({ error: null }),
}));
```

---

### 4.4 Validaciones

**Backend (POST `/api/admin/recibos/templates/save`):**

1. ✅ HTML no vacío
2. ✅ HTML contiene al menos 1 `<table>` o `<div>`
3. ✅ Todos los placeholders están en lista blanca (contra pdfHelpers.js)
4. ✅ Márgenes entre 0-50 mm
5. ✅ pageSize en enum permitido
6. ✅ orientation en enum permitido

**Frontend (antes de enviar):**

1. Mostrar warning rojo si placeholder {{xxx}} no existe
2. Deshabilitar botón "Guardar" si tabla vacía
3. Validación de colspans no rotos (colspan ≤ número de columnas)

---

### 4.5 Seguridad

1. **Autenticación:** Middleware `authMiddleware` requerido en todas rutas `/api/admin/*`
2. **Autorización:** Check de rol `admin` en controller
3. **XSS Prevention:** Sanitizar HTML con `DOMPurify` antes de guardar en BD
4. **SQL Injection:** Usar Sequelize (prepared statements automáticos)
5. **Rate Limiting:** Limitador en `/api/admin/*` → máx 100 req/min por usuario
6. **Versionado automático:** Validar que solo 1 template por grupo tenga `activo = true`

---

## 5. Flujos de Usuario

### Flujo 1: Editar Template Activo

```
1. Admin accede a /admin/recibo-designer
2. Frontend: GET /api/admin/recibos/templates/active
3. Página carga con template activo renderizado
4. Admin edita celdas (cambia texto, agrega placeholders)
5. Vista previa actualiza en tiempo real
6. Admin click "Guardar"
7. POST /api/admin/recibos/templates/save { saveMode: "overwrite" }
8. Backend: Actualiza template (id=1, version_number=1)
9. Confirmación: "Template actualizado"
```

### Flujo 2: Crear Nueva Versión

```
1. Admin abre /admin/recibo-designer (carga v1 activa)
2. Admin edita → click "Guardar como nueva versión"
3. POST /api/admin/recibos/templates/save { saveMode: "new_version" }
4. Backend:
   - Crea nuevo template (id=2, version_number=2, template_group_id=1)
   - UPDATE template_id=1: activo=false
   - UPDATE template_id=2: activo=true
5. Confirmación: "Nueva versión v2 creada y establecida como activa"
6. Página recarga mostrando v2 como activa
```

### Flujo 3: Exportar HTML

```
1. Admin click "Exportar HTML"
2. Frontend: Descarga archivo recibo_template_YYYYMMDD.html
3. Admin abre en navegador para revisar/validar
```

---

## 6. Criterios de Aceptación

- ✅ Admin accede a `/admin/recibo-designer` desde panel admin
- ✅ Al cargar, muestra template activo en el editor
- ✅ Puede agregar/eliminar filas y columnas visualmente
- ✅ Puede editar contenido de celdas (texto o placeholder)
- ✅ Vista previa muestra HTML renderizado en tiempo real
- ✅ Placeholders disponibles listados y copiables
- ✅ Opción "Guardar" sobrescribe template actual
- ✅ Opción "Guardar como nueva versión" crea versión nueva + la activa
- ✅ Validación: placeholders no existentes → aviso rojo
- ✅ Validación: tabla vacía → botón guardar deshabilitado
- ✅ Validación: HTML debe contener tabla
- ✅ Seguridad: solo admins pueden acceder
- ✅ Seguridad: XSS bloqueado (sanitización)
- ✅ Template guardado se usa en generación de PDF

---

## 7. Dependencias

- **Requiere:** BUG-052 (generación PDF funcional)
- **Depende de:** `pdfHelpers.js` (lista de placeholders disponibles)
- **No bloquea:** Otros trabajos

---

## 8. Consideraciones de Implementación

### Performance
- Zustand para state management (ligero, rápido)
- No usar Redux (overkill para este caso)
- HTML render en tiempo real puede ser costoso → memoizar ReciboPreview

### Escalabilidad
- Versionado permite múltiples templates
- Auditoría con `created_by`, `updated_by`
- Tabla `recibo_template_versions` opcional para historial completo

### Mantenibilidad
- Componentes pequeños y enfocados
- Store Zustand simple y predecible
- Validaciones duplicadas (frontend + backend) para UX y seguridad

---

## 9. Próximos Pasos

1. ✅ Especificación aprobada
2. → Crear plan de implementación
3. → Implementar en rama `feature/BACKLOG-081`
4. → Testing exhaustivo
5. → Merge y deployment

