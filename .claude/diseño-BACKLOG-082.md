# Editor de Templates de Recibos (BACKLOG-082)

**Fecha:** 2026-06-12  
**Estado:** Especificación Formal  
**Versión:** 1.0

---

## 1. Resumen Ejecutivo

Sistema completo para que administradores diseñen y personalicen templates de recibos de forma visual e intuitiva. El editor permite crear múltiples templates (hasta 5), cada uno con estructura modular compuesta por 4 bloques predefinidos (encabezado, datos del afiliado, tabla de detalles, pie/firma).

**Características principales:**
- ✅ Editor visual WYSIWYG con vista previa en tiempo real
- ✅ Estructura modular con 4 bloques independientes
- ✅ Múltiples templates almacenados, uno activo globalmente
- ✅ Personalización granular de estilos (fuentes, colores, bordes)
- ✅ Inserción de placeholders/campos dinámicos
- ✅ Preview con datos reales de afiliados
- ✅ Generación de PDF de prueba
- ✅ Gestión simple sin historial de versiones

---

## 2. Contexto y Necesidad

### Problema
Sin un editor visual, la personalización de templates de recibos requiere intervención técnica (SQL directo o código). Los administradores no pueden realizar cambios de diseño de forma autónoma.

### Solución Propuesta
Interfaz visual especializada donde administradores diseñan templates mediante:
- Bloques predefinidos (componentes reutilizables)
- Formularios intuitivos para edición de contenido
- Estilos controlados (opciones limitadas pero suficientes)
- Inserción de placeholders desde dropdown
- Vista previa actualizada en vivo

---

## 3. Especificación Funcional

### 3.1 Acceso y Navegación

**URL:** `/admin/recibos/templates`  
**Rol Requerido:** admin (requiere middleware `requireAdmin`)  
**Menú:** Administración → "Templates de Recibos"

### 3.2 Página Principal - Listado de Templates

**Vista:** Tabla de templates existentes

| Columna | Descripción |
|---------|-------------|
| Nombre | Nombre del template (ej: "Recibos Estándar 2026") |
| Estado | "Activo" (badge verde) o "Inactivo" |
| Creado | Fecha y usuario creador |
| Última Edición | Fecha y usuario que modificó |
| Acciones | Editar, Activar, Duplicar, Eliminar |

**Botones:**
- ➕ **Nuevo Template** - Abre modal de creación
- 🔄 **Actualizar** - Recarga tabla desde backend

**Comportamiento:**
- Solo un template puede estar "Activo" simultáneamente
- Al activar otro template, el anterior se desactiva automáticamente
- Máximo 5 templates almacenados (advertencia al llegar a 4)

### 3.3 Modal/Página de Edición

**Estructura principal:**

```
┌─ Header: Nombre Template + Estado Activo ────────────────────┐
├─ Área de Bloques (izquierda) + Preview (derecha)             │
│  ┌─ Bloque 1: Encabezado                                     │
│  │  - Logo URL                                                │
│  │  - Nombre empresa                                          │
│  │  - Datos contacto                                          │
│  │  [Editar] [Copiar] [Eliminar]                              │
│  │                                                             │
│  ├─ Bloque 2: Datos Afiliado                                 │
│  │  - Placeholder: {{numero_afiliado}}, {{titular_nombre}}   │
│  │  - {{numero_documento}}, {{obra_social_nombre}}           │
│  │  - {{tipo_plan_nombre}}, {{fecha_cobertura}}              │
│  │  [Editar] [Copiar] [Eliminar]                              │
│  │                                                             │
│  ├─ Bloque 3: Tabla de Detalles                              │
│  │  - Filas: Cuota Social, Arancel, Total                    │
│  │  - Placeholders: {{valor_cuota}}, {{arancel_por_servicio}} │
│  │  [Editar] [Copiar] [Eliminar]                              │
│  │                                                             │
│  └─ Bloque 4: Pie/Firma                                      │
│     - Texto legal, fecha, referencias                         │
│     [Editar] [Copiar] [Eliminar]                              │
│                                                             │
│  PREVIEW (derecha):                                           │
│  [Mostrar template completo con datos de ejemplo]             │
│  Selector de "Afiliado de Ejemplo": [Dropdown con afiliados] │
└─────────────────────────────────────────────────────────────┘
┌─ Footer: Guardar, Cancelar, Vista Previa PDF                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Bloques Principales

#### **Bloque 1: Encabezado**
Propósito: Logo y datos de la empresa

**Campos editables:**
```
- Logo URL (input: URL a imagen)
- Nombre Empresa (input: texto, max 100 chars)
- Dirección (input: texto, max 150 chars)
- Teléfono (input: tel, max 15 chars)
- Email (input: email)
- Sitio Web (input: URL)
```

**Estilos aplicables:**
- Font: Arial, Times New Roman, Courier
- Tamaño: 8-24px
- Color texto: color picker
- Alineación: left, center, right
- Fondo bloque: color picker / transparent
- Padding: 0-20px

#### **Bloque 2: Datos del Afiliado**
Propósito: Información del afiliado actual

**Estructura predefinida (filas editables):**
```
- Número Afiliado: {{numero_afiliado}}
- Titular: {{titular_nombre}} {{titular_apellido}}
- Documento: {{numero_documento}} ({{tipo_documento}})
- Obra Social: {{obra_social_nombre}}
- Plan: {{tipo_plan_nombre}}
- Grupo: {{tipo_de_grupo_nombre}}
- Cobertura Desde: {{fecha_cobertura}}
- Domicilio: {{domicilio}}, {{localidad_nombre}}
```

**Edición:**
- Pueden activar/desactivar filas individuales
- Reordenar filas (drag & drop)
- Cambiar etiqueta de fila
- Cambiar placeholder (dropdown de disponibles)

**Estilos globales del bloque:**
- Font, tamaño, color (como Bloque 1)
- Alineación columnas
- Bordes (grosor, estilo, color)
- Padding/margin

#### **Bloque 3: Tabla de Detalles**
Propósito: Resumen de montos a pagar

**Estructura predefinida:**
```
Descripción        | Monto
─────────────────────────────
Cuota Social       | {{cuota_social}}
Arancel Servicios  | {{arancel_por_servicio}}
─────────────────────────────
TOTAL A PAGAR      | {{valor_cuota}}
```

**Edición:**
- Editable: cantidad de filas detalle
- Cada fila: etiqueta + placeholder
- Fila final (total) siempre visible
- Plantillas presets: "Simple" (solo total), "Detallado" (3+ filas)

**Estilos:**
- Font, tamaño, color (tabla completa)
- Bordes (líneas entre filas, columnas)
- Alineación numérica (right) / etiquetas (left)
- Fondo encabezado tabla (color diferente)
- Padding celdas

#### **Bloque 4: Pie/Firma**
Propósito: Información legal y cierre

**Campos editables:**
```
- Aclaración (input: texto, max 200 chars)
- Texto legal (textarea: max 500 chars)
- Fecha formato (selección: "dd/mm/aaaa" o "Mes Año")
- Línea de firma (checkbox: mostrar línea punteada)
- Referencia (input: número, ej "Comprobante N°" + {{numero_recibo}})
```

**Estilos:**
- Font, tamaño, color
- Alineación
- Padding superior (espaciado respecto a tabla)

### 3.5 Panel de Edición de Bloque (Modal)

Al hacer click **[Editar]** en un bloque:

```
┌─ Modal: Editar Encabezado ──────────────────────┐
│                                                 │
│ [Campo] Logo URL                                │
│ [Input] _____________________________ [Buscar]  │
│                                                 │
│ [Campo] Nombre Empresa                          │
│ [Input] _____________________________           │
│                                                 │
│ [Sección] Estilos del Bloque                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ Fuente:      [Dropdown: Arial, Times, etc.] │ │
│ │ Tamaño:      [Slider: 8-24px]               │ │
│ │ Color:       [Color Picker] #000000         │ │
│ │ Alineación:  [Radio: Left | Center | Right] │ │
│ │ Fondo:       [Color Picker] #FFFFFF         │ │
│ │ Padding:     [Input: 0-20px]                │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Guardar] [Cancelar]                            │
└─────────────────────────────────────────────────┘
```

**Cambios en vivo:**
- Al modificar campos, preview se actualiza automáticamente
- Sin necesidad de guardar para ver cambios

### 3.6 Placeholders Disponibles

**Categoría: Datos del Afiliado**
```
{{numero_afiliado}}       - Número de plan
{{tipo_documento}}        - Tipo (DNI, Pasaporte, etc.)
{{numero_documento}}      - Número documento
{{titular_apellido}}      - Apellido titular
{{titular_nombre}}        - Nombre titular
{{fecha_nacimiento}}      - Fecha nacimiento (dd/mm/aaaa)
{{obra_social_nombre}}    - Nombre obra social
{{tipo_plan_nombre}}      - Nombre tipo de plan
{{tipo_de_grupo_nombre}}  - Nombre grupo
{{domicilio}}             - Dirección completa
{{localidad_nombre}}      - Localidad/ciudad
{{fecha_cobertura}}       - Fecha inicio cobertura
{{zona_codigo}}           - Código zona
```

**Categoría: Valores Monetarios**
```
{{valor_cuota}}           - Monto total a pagar (formateado $X.XX)
{{cuota_social}}          - Cuota social (formateado)
{{arancel_por_servicio}}  - Arancel servicios (formateado)
{{arancel_negativo_class}} - CSS class si arancel < 0
```

**Categoría: Metadata**
```
{{numero_recibo}}         - ID único del recibo
{{periodo}}               - Período (YYYY-MM-DD)
{{fecha_generacion}}      - Fecha/hora de generación
```

**Categoría: Empresa (configurables)**
```
{{empresa_nombre}}        - Nombre empresa
{{empresa_logo}}          - URL logo (insertar como imagen)
{{empresa_telefono}}      - Teléfono contacto
{{empresa_email}}         - Email contacto
{{empresa_direccion}}     - Dirección
```

### 3.7 Flujo de Usuario

**1. Crear Template**
```
Usuario → Click "Nuevo Template" 
→ Modal: Ingresar nombre + descripción (opcional)
→ Crea template vacío con bloques por defecto
→ Abre editor automáticamente
```

**2. Editar Estructura**
```
Usuario → Abre template existente
→ Ve 4 bloques con contenido predefinido
→ Click [Editar] en un bloque
→ Modal con campos específicos del bloque
→ Cambios se guardan en preview vivo
```

**3. Personalizar Estilos**
```
Usuario → En cada bloque, expande sección "Estilos"
→ Ajusta fuente, tamaño, color, alineación
→ Preview actualiza en vivo
```

**4. Insertar Placeholders**
```
Usuario → En campo de texto (ej: Bloque 2)
→ Click botón "Insertar Placeholder"
→ Dropdown categorizado con todos los placeholders
→ Selecciona {{placeholder}} → se inserta en el campo
```

**5. Guardar Template**
```
Usuario → Completa ediciones
→ Click "Guardar" en footer
→ Validación en frontend (no campos vacíos requeridos)
→ POST /api/admin/recibos/templates
→ Backend guarda o actualiza template en BD
→ Toast de éxito
```

**6. Activar Template**
```
Usuario → En listado, click [Activar] en un template
→ Confirma: "Este template se usará para generar todos los recibos"
→ Backend: desactiva anterior, activa este
→ Badge cambia a "Activo" (verde)
→ Futuras generaciones usan este template
```

**7. Vista Previa**
```
Usuario → Abre template
→ Panel derecho muestra preview en tiempo real
→ Selector "Afiliado de Ejemplo" permite cambiar datos
→ Preview se actualiza con datos de ese afiliado
→ Botón "Ver PDF" abre previsualización en PDF
```

---

## 4. Arquitectura Técnica

### 4.1 Modelo de Datos - BD

#### Tabla: `recibo_templates`

```sql
CREATE TABLE recibo_templates (
  id                 CHAR(36) PRIMARY KEY,           -- UUID
  nombre             VARCHAR(100) NOT NULL,
  descripcion        TEXT,
  
  -- Bloques JSON (estructura completa guardada)
  bloque_encabezado  JSON NOT NULL,                  -- Logo, empresa, contacto
  bloque_afiliado    JSON NOT NULL,                  -- Filas con placeholders
  bloque_detalles    JSON NOT NULL,                  -- Tabla de valores
  bloque_pie         JSON NOT NULL,                  -- Legal, firma
  
  -- Metadata
  activo             BOOLEAN DEFAULT FALSE,
  usuario_id         INT,                             -- FK Usuario (creador)
  
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

#### Estructura JSON: `bloque_encabezado`

```json
{
  "logo_url": "https://...",
  "empresa_nombre": "Nombre Empresa",
  "empresa_direccion": "Calle 123",
  "empresa_telefono": "+54...",
  "empresa_email": "info@...",
  "empresa_sitio": "www.example.com",
  "estilos": {
    "fontFamily": "Arial",
    "fontSize": 14,
    "color": "#000000",
    "textAlign": "center",
    "backgroundColor": "#FFFFFF",
    "padding": 10
  }
}
```

#### Estructura JSON: `bloque_afiliado`

```json
{
  "filas": [
    {
      "id": "fila_1",
      "visible": true,
      "etiqueta": "Número Afiliado",
      "placeholder": "{{numero_afiliado}}"
    },
    {
      "id": "fila_2",
      "visible": true,
      "etiqueta": "Titular",
      "placeholder": "{{titular_nombre}} {{titular_apellido}}"
    }
    // ... más filas
  ],
  "estilos": {
    "fontFamily": "Arial",
    "fontSize": 11,
    "color": "#000000",
    "borderWidth": 1,
    "borderColor": "#CCCCCC",
    "padding": 5
  }
}
```

#### Estructura JSON: `bloque_detalles`

```json
{
  "template_preset": "detallado",  // "simple" o "detallado"
  "filas": [
    {
      "id": "detalle_1",
      "etiqueta": "Cuota Social",
      "placeholder": "{{cuota_social}}"
    },
    {
      "id": "detalle_2",
      "etiqueta": "Arancel Servicios",
      "placeholder": "{{arancel_por_servicio}}"
    }
  ],
  "fila_total": {
    "etiqueta": "TOTAL A PAGAR",
    "placeholder": "{{valor_cuota}}"
  },
  "estilos": {
    "fontFamily": "Arial",
    "fontSize": 11,
    "color": "#000000",
    "borderWidth": 1,
    "borderStyle": "solid",
    "borderColor": "#000000",
    "headerBgColor": "#F0F0F0"
  }
}
```

#### Estructura JSON: `bloque_pie`

```json
{
  "aclaracion": "Comprobante válido para...",
  "texto_legal": "Conservar para sus...",
  "fecha_formato": "dd/mm/aaaa",
  "mostrar_linea_firma": true,
  "referencia": "Comprobante Nº {{numero_recibo}}",
  "estilos": {
    "fontFamily": "Arial",
    "fontSize": 10,
    "color": "#666666",
    "textAlign": "center",
    "paddingTop": 20
  }
}
```

### 4.2 Backend - API Endpoints

#### **GET /api/admin/recibos/templates**
Obtiene listado de templates

**Headers:** Authorization: Bearer {jwt_token}  
**Parámetros:** Ninguno

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "nombre": "Recibos Estándar 2026",
      "descripcion": "Template principal",
      "activo": true,
      "created_at": "2026-06-01T10:00:00Z",
      "updated_at": "2026-06-12T15:30:00Z",
      "usuario_creador": {
        "id": 1,
        "nombre": "Admin"
      }
    }
    // ... más templates
  ]
}
```

#### **GET /api/admin/recibos/templates/:id**
Obtiene template específico para edición

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "nombre": "Recibos Estándar",
    "bloque_encabezado": { ... },
    "bloque_afiliado": { ... },
    "bloque_detalles": { ... },
    "bloque_pie": { ... },
    "activo": true
  }
}
```

#### **POST /api/admin/recibos/templates**
Crea nuevo template

**Body:**
```json
{
  "nombre": "Nuevo Template",
  "descripcion": "Descripción opcional",
  "bloque_encabezado": { /* estructura JSON */ },
  "bloque_afiliado": { /* estructura JSON */ },
  "bloque_detalles": { /* estructura JSON */ },
  "bloque_pie": { /* estructura JSON */ }
}
```

**Response (201):**
```json
{
  "success": true,
  "templateId": "uuid-nuevo",
  "message": "Template creado exitosamente"
}
```

#### **PUT /api/admin/recibos/templates/:id**
Actualiza template existente

**Body:** Igual a POST  

**Response (200):**
```json
{
  "success": true,
  "message": "Template actualizado exitosamente"
}
```

#### **PATCH /api/admin/recibos/templates/:id/activar**
Activa un template (desactiva los demás)

**Body:** `{}` (vacío)

**Response (200):**
```json
{
  "success": true,
  "message": "Template activado",
  "activo": true
}
```

#### **DELETE /api/admin/recibos/templates/:id**
Elimina un template

**Validaciones:**
- No permitir eliminar template activo (error 400)

**Response (200):**
```json
{
  "success": true,
  "message": "Template eliminado"
}
```

#### **POST /api/admin/recibos/templates/:id/duplicar**
Duplica un template (crea copia con sufijo)

**Body:** `{ "nombre_copia": "Copia - Nombre" }` (opcional)

**Response (201):**
```json
{
  "success": true,
  "templateId": "uuid-copia",
  "nombre": "Copia - Recibos Estándar"
}
```

#### **GET /api/admin/recibos/placeholders**
Obtiene listado de placeholders disponibles

**Response (200):**
```json
{
  "success": true,
  "placeholders": {
    "afiliado": [
      { "placeholder": "{{numero_afiliado}}", "label": "Número Afiliado" },
      // ...
    ],
    "monetarios": [
      { "placeholder": "{{valor_cuota}}", "label": "Valor Cuota" },
      // ...
    ],
    "metadata": [ /* ... */ ],
    "empresa": [ /* ... */ ]
  }
}
```

#### **GET /api/admin/recibos/preview/:templateId/:personaId**
Obtiene preview del template con datos de una persona

**Response (200):**
```json
{
  "success": true,
  "html": "<html>Template renderizado con datos reales</html>",
  "persona": {
    "numero_afiliado": "0001",
    "titular_nombre": "Juan",
    // ... todos los datos rellenados
  }
}
```

### 4.3 Frontend - Componentes

**Estructura de carpetas:**

```
frontend/src/pages/AdminPanel/
├── RecibosTemplatesPage.jsx          # Página principal (listado)
├── RecibosTemplatesPage.scss
├── components/
│   ├── TemplatesList.jsx             # Tabla de templates
│   ├── TemplateEditor.jsx            # Modal de edición completa
│   ├── BlockEditor/
│   │   ├── BloqueEncabezado.jsx      # Editor del bloque 1
│   │   ├── BloqueAfiliado.jsx        # Editor del bloque 2
│   │   ├── BloqueDetalles.jsx        # Editor del bloque 3
│   │   ├── BloquePie.jsx             # Editor del bloque 4
│   │   └── BloqueCommon.scss         # Estilos comunes
│   ├── TemplatePreview.jsx           # Panel de preview (derecha)
│   ├── StylesPanel.jsx               # Controles de estilos
│   └── PlaceholderSelector.jsx       # Dropdown de placeholders
└── hooks/
    └── useTemplateEditor.js          # Hook compartido para estado

frontend/src/services/
├── templateService.js                # Llamadas API a /api/admin/recibos/templates
```

### 4.4 Estado del Cliente (Zustand o Context)

**Estructura recomendada (useTemplateEditor hook):**

```javascript
{
  // Template actual
  currentTemplate: {
    id: "uuid" | null,
    nombre: "Recibos Estándar",
    activo: false,
    bloque_encabezado: { /* ... */ },
    bloque_afiliado: { /* ... */ },
    bloque_detalles: { /* ... */ },
    bloque_pie: { /* ... */ }
  },
  
  // Estado de edición
  editingBlock: "encabezado" | "afiliado" | "detalles" | "pie" | null,
  isDirty: false,
  isSaving: false,
  
  // Preview
  previewAfiliado: null,  // Persona seleccionada para preview
  previewHtml: "",        // HTML renderizado
  
  // Listado
  templates: [],
  loading: false,
  error: null
}
```

---

## 5. Requisitos No-Funcionales

### 5.1 Validaciones

**Frontend:**
- Nombre template: no vacío, máximo 100 caracteres
- Campos de texto: máximos según especificación
- URL logo: validar formato URL
- Colores: validar formato hex (#XXXXXX)
- Tamaños: validar rangos (8-24px, 0-20px)
- Placeholders: validar que existan en lista autorizada

**Backend:**
- Validar estructura JSON de bloques
- No permitir template activo sin bloques requeridos
- Usuario debe ser admin
- Validar referencias de usuario_id

### 5.2 Restricciones

- **Máximo 5 templates** por instancia (warning a partir de 4)
- **Un solo template activo** (validar en BD con constraint)
- **No permitir eliminar template activo** (error 400)
- **Placeholders son read-only** (no crear nuevos desde UI)

### 5.3 Rendimiento

- Listado debe cargar en < 500ms
- Preview debe actualizar en tiempo real (debounce 300ms)
- Sin queries N+1 (include usuario al listar templates)

### 5.4 Seguridad

- Todos los endpoints requieren `verifyToken` y `requireAdmin`
- Sanitizar HTML en preview (prevenir XSS)
- Validar MIME type de logo URL
- Rate limit: 20 requests/minuto por usuario para endpoints de templates

---

## 6. Integración con Generación de Recibos

### Flujo de Generación (sin cambios)

```
1. Usuario solicita generar recibos: POST /api/recibos/generar?periodo=2026-04
2. Backend obtiene template activo: SELECT * FROM recibo_templates WHERE activo = TRUE
3. Para cada persona en período:
   a. Obtiene datos personalizados
   b. Reemplaza placeholders en template
   c. Renderiza HTML → PDF
   d. Guarda recibo en tabla `recibos`
```

### Reemplazo de Placeholders (nuevo)

**Pseudocódigo backend:**

```javascript
function renderTemplate(template, persona, recibo) {
  let html = serializeTemplate(template);  // JSON → HTML
  
  // Reemplazar placeholders
  html = html.replace(/{{numero_afiliado}}/g, persona.numero_afiliado);
  html = html.replace(/{{titular_nombre}}/g, persona.titular_nombre);
  // ... más placeholders
  
  // Reemplazar valores monetarios (con formato)
  html = html.replace(/{{valor_cuota}}/g, formatCurrency(recibo.valor_cuota));
  
  return html;
}
```

---

## 7. Migraciones de Base de Datos

### Migración: `3.0.0_templates_rediseño`

**Upgrade:**
```sql
-- Crear nueva tabla con estructura simplificada
CREATE TABLE IF NOT EXISTS recibo_templates_v2 (
  id CHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  bloque_encabezado JSON NOT NULL,
  bloque_afiliado JSON NOT NULL,
  bloque_detalles JSON NOT NULL,
  bloque_pie JSON NOT NULL,
  activo BOOLEAN DEFAULT FALSE,
  usuario_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY unique_activo (activo)  -- Solo un template activo
);

-- Crear template por defecto (si no existe tabla anterior)
INSERT INTO recibo_templates_v2 VALUES (
  UUID(),
  'Template Predefinido',
  'Template estándar del sistema',
  '{"logo_url":"","empresa_nombre":"Mi Empresa",...}',
  '{"filas":[...],...}',
  '{"template_preset":"simple",...}',
  '{"aclaracion":"","texto_legal":"",...}',
  TRUE,  -- Activo por defecto
  1,
  NOW(),
  NOW()
);

-- Si existe tabla anterior (recibo_templates), hacer migración de datos (opcional)
-- ALTER TABLE recibo_templates_v2 RENAME TO recibo_templates;
```

**Downgrade:**
```sql
-- Eliminar tabla
DROP TABLE IF EXISTS recibo_templates_v2;
```

---

## 8. Casos de Uso Principales

### Caso 1: Admin crea template desde cero
```
1. Admin navega a /admin/recibos/templates
2. Click "Nuevo Template"
3. Ingresa nombre: "Recibos Abril 2026"
4. Sistema crea template con bloques por defecto
5. Abre editor, personaliza cada bloque
6. Guarda cambios
7. Click "Activar" para que se use en generaciones futuras
```

### Caso 2: Admin modifica template existente
```
1. Admin ve listado, click [Editar]
2. Abre editor del template
3. Cambia colores, fuentes, texto
4. Preview actualiza en tiempo real
5. Selecciona afiliado de ejemplo para ver datos reales
6. Guarda cambios
7. Próximas generaciones usan esta versión
```

### Caso 3: Generación de recibos usa template activo
```
1. Usuario solicita: POST /api/recibos/generar?periodo=2026-04
2. Backend obtiene template activo
3. Para cada afiliado en periodo:
   - Renderiza template con datos personalizados
   - Convierte HTML → PDF
   - Guarda recibo
4. Retorna cantidad de recibos generados
```

---

## 9. Commits Esperados

```
feat(BACKLOG-082): diseño de nueva arquitectura de templates
feat(BACKLOG-082): crear tabla y migraciones BD
feat(BACKLOG-082): implementar endpoints API
feat(BACKLOG-082): crear componentes frontend (listado, editor)
feat(BACKLOG-082): integración con generador de recibos
docs(BACKLOG-082): documentación completa
```

---

## 11. Timeline Estimado

- Fase 1: Backend (BD + API endpoints) - 3-4 días
- Fase 2: Frontend (componentes + UI) - 4-5 días
- Fase 3: Integración y testing - 2-3 días
- **Total estimado:** 1.5-2 semanas

---

## 12. Referencias

- **Especificación de placeholders:** `./docs/superpowers/specs/2026-05-09-impresion-recibos-pdf-design.md`
- **CLAUDE.md:** Instrucciones del proyecto
- **Modelo de base de datos:** Consultar migraciones en `backend/src/migrations/versions/`
