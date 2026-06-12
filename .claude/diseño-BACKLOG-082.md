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

## 2.1 Especificaciones Detalladas Críticas

### F1: Estructura de Datos Ficticios

**Cuando:** No hay afiliados reales en sistema, usuario abre preview o genera PDF de prueba.

**Estructura fija predefinida:**
```json
{
  "persona_id": null,
  "numero_afiliado": "0001",
  "tipo_documento": "DNI",
  "numero_documento": "12345678",
  "titular_apellido": "Pérez",
  "titular_nombre": "Juan",
  "fecha_nacimiento": "1985-05-15",
  "obra_social_nombre": "OSDE",
  "tipo_plan_nombre": "Plan Superior",
  "tipo_de_grupo_nombre": "Familia",
  "domicilio": "Calle 123, Piso 4",
  "localidad_nombre": "Buenos Aires",
  "fecha_cobertura": "2024-01-01",
  "zona_codigo": "001",
  
  "valor_cuota": 250.50,
  "cuota_social": 150.00,
  "arancel_por_servicio": 100.50,
  "numero_recibo": "REC-20260612-001",
  "periodo": "2026-06",
  "fecha_generacion": "2026-06-12 14:30:00"
}
```

**UI Indicator:** "Usando datos de ejemplo (no hay afiliados reales)" - badge gris en preview

### F2: Respuesta PDF - Siempre Binario

**Decisión:** Endpoint `/generar-pdf` SIEMPRE responde con binario descargable.

**No hay respuesta base64.** Simplificar implementación.

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="recibo_YYYYMMDD_HHMMSS.pdf"
Content-Length: 45678

[Binary PDF...]
```

**Frontend:** Usa `<a download>` o `window.open()` para manejar descarga.

### F3: Bloque 5 - Inline Colapsible (Sin Modal)

**Decisión:** Bloque 5 se edita inline, NO requiere modal separado como Bloques 1-4.

**UI:**
- `[▼ Bloque 5: Configuración de Página]` (expandido por defecto)
- Campos visibles: tamaño, orientación, márgenes, recibos/página, layout, espaciado
- Sin botón `[Editar]` adicional
- `[▲ Bloque 5...]` cuando colapsado

### F4: Layout Grilla - Usuario Define Columnas y Filas

**Decisión:** No es algoritmo automático. Usuario define explícitamente.

**Nuevo campo en bloque_pageconfig:**
```json
{
  "recibos_por_pagina": 6,
  "layout": "grilla",
  "grilla_columnas": 2,      // ← NUEVO: user define columnas
  "grilla_filas": 3,          // ← NUEVO: auto-calculado como ceil(recibos / columnas)
  "espaciado": { "gap_vertical": 5, "gap_horizontal": 5 }
}
```

**Algoritmo:**
- User selecciona: 6 recibos/página
- User selecciona: layout "grilla"
- User selecciona: "2 columnas"
- Sistema calcula: filas = ceil(6 / 2) = 3 filas
- Resultado: grilla 2×3

**Selector UI:**
```
Recibos por página: [1 | 2 | 3 | 4 | 6 | 8]
Layout: [Vertical] [Grilla]

Si Grilla:
  Columnas: [1] [2] [3] [4]  (máximo = recibos_por_página)
```

### F5: Drag & Drop - React Beautiful DnD

**Librería:** `react-beautiful-dnd`

**Instalación:**
```bash
npm install react-beautiful-dnd
npm install --save-dev @types/react-beautiful-dnd  # si TypeScript
```

**Características:**
- ✅ Keyboard support (Tab, Enter, Space)
- ✅ Mouse + touch
- ⚠️ NO mobile (touch no completamente soportado en la versión stable; alternativa: dnd-kit si necesita mobile)
- ✅ Reordena filas automáticamente
- ✅ Persistencia: cambios se guardan al click [Guardar] template (manual, no auto-save)

**Implementación en BloqueAfiliado.jsx:**
```jsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Flujo: usuario reordena → onChange actualiza state → preview refleja cambios (debounce 300ms)
```

### F6: Validación Tamaño Personalizado - Error Bloqueante

**Decisión:** Error 400 bloqueante. Input rechaza valores fuera de rango.

**Rango:** 100-300mm ancho, 100-400mm alto

**Validación Frontend:**
```jsx
if (ancho_custom < 100 || ancho_custom > 300) {
  return "Ancho debe estar entre 100-300mm";  // Input deshabilitado hasta corregir
}
if (alto_custom < 100 || alto_custom > 400) {
  return "Alto debe estar entre 100-400mm";
}
```

**Validación Backend:** Same, error 400

### F7: Auditoria - Solo Creador, Sin Edit Trail

**Decisión:** Mantener solo `created_by` y `created_at`. NO agregar `modificado_por` ni historial.

**Razón:** Simplificar, versión 1.0 no requiere auditoria completa.

**Tabla:**
```sql
usuario_id INT  -- Creador (no cambia)
created_at TIMESTAMP
updated_at TIMESTAMP  -- Último cambio, pero SIN quién lo hizo
```

### F8: Control de Acceso - Todos Ven/Editan Todos

**Decisión:** Transparencia total. Todos los admins ven y editan todos los templates.

**Validación:** Solo `requireAdmin` middleware. NO restricciones de creador.

**Endpoint:** `GET /api/admin/recibos/templates` retorna ALL templates (sin filter por usuario_id)

### F9: Validación Márgenes - Fórmula Exacta

**Decisión:** Ambas dimensiones. Validar verticales Y horizontales.

**Fórmula:**
```
(margen_superior + margen_inferior) ≤ alto_pagina
(margen_izquierdo + margen_derecho) ≤ ancho_pagina
```

**Ejemplo A4 (210×297mm):**
```
210mm - 10mm (izq) - 10mm (der) = 190mm disponible horizontalmente  ✓
297mm - 10mm (sup) - 10mm (inf) = 277mm disponible verticalmente     ✓
```

**Error si viola:**
```json
{
  "success": false,
  "message": "Márgenes inválidos: suma de izquierdo+derecho (30mm) supera ancho disponible (210mm). Máximo permitido: 30mm."
}
```

### F10: Placeholder No Encontrado - Dejar Literal

**Decisión:** Si `{{campo_inexistente}}` no existe en datos, dejarlo literal en PDF.

**Comportamiento:**
- Usuario define: "Valor: {{monto_desconocido}}"
- Datos no tienen `monto_desconocido`
- PDF muestra: "Valor: {{monto_desconocido}}"

**Razón:** Visible en PDF = fácil debug. No silenciar errores.

### F12: Preview Auto-Update - Zustand Store

**Arquitectura:** Estado compartido con Zustand.

**Store structure:**
```javascript
// hooks/useTemplateStore.js
import create from 'zustand';

const useTemplateStore = create((set) => ({
  currentTemplate: { /* full template JSON */ },
  editingBlock: null,
  updateTemplate: (updates) => set((state) => ({
    currentTemplate: { ...state.currentTemplate, ...updates }
  })),
  updateBloque: (bloqueKey, updates) => set((state) => ({
    currentTemplate: {
      ...state.currentTemplate,
      [bloqueKey]: { ...state.currentTemplate[bloqueKey], ...updates }
    }
  }))
}));
```

**Flow:**
1. TemplateEditor → `updateBloque('bloque_encabezado', { empresa_nombre: 'Nueva' })`
2. Zustand store actualiza
3. TemplatePreview suscrito a store, re-renderiza automáticamente
4. Debounce 300ms para preview en vivo (no cada keystroke)

### F13: CSS - Mismo en Preview y PDF

**Decisión:** Mismo CSS en ambos (best-effort, algunas limitaciones en PDF).

**Limitaciones Puppeteer a documentar:**
- ✅ Soporta: color, font, margin, padding, border, background-color, text-align
- ⚠️ Limitado: box-shadow (simple sí, complejo no), gradients (básicos)
- ❌ No soporta: filter, transform, animation, @keyframes
- ⚠️ Cuidado: media queries no funcionan en PDF headless

**Documento a agregar:** "CSS Restrictions for PDF"

---

## 2.2 Gestión de Estado, Concurrencia y Persistencia

### F11: Rate Limit - Solo PDF, Sin Límite General

**Decisión:** Límite ÚNICO de **10 PDFs/minuto por usuario** (solo endpoint `/generar-pdf`).

**Cambio:** Eliminar "20 requests/minuto global" de sección 5.4. Solo aplica a PDF generation.

**Backend Middleware:**
```javascript
const pdfRateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minuto
  max: 10,              // máximo 10 PDFs
  keyGenerator: (req) => req.user.id,  // por usuario (desde JWT)
  message: "Demasiadas solicitudes. Espere 30 segundos.",
  skip: (req) => !req.path.includes('/generar-pdf')  // solo PDF
});

router.post('/generar-pdf', pdfRateLimiter, generatePdfController);
```

**Response 429:**
```json
{
  "success": false,
  "message": "Rate limit excedido: máximo 10 PDFs/minuto",
  "retry_after_seconds": 30
}
```

### F15: Editar Mientras Se Genera PDF - Validación Previa

**Decisión:** Si hay cambios sin guardar → **validar y pedir guardar** antes de generar PDF.

**Flujo:**
1. Usuario edita Bloque 1 (nombre empresa)
2. Click "Descargar PDF"
3. Sistema detecta: `isDirty = true` (hay cambios no guardados)
4. **Modal de confirmación:**
   ```
   "¿Guardar cambios antes de generar PDF?"
   [Guardar y Generar]  [Generar Solo (con versión anterior)]  [Cancelar]
   ```
5. Si "Guardar y Generar" → POST guardar → POST generar → descarga
6. Si "Generar Solo" → usa template actual en BD (ignora editor cambios)

**Lógica en componente:**
```javascript
const handleGeneratePdf = async () => {
  const { currentTemplate, isDirty } = useTemplateStore();
  
  if (isDirty) {
    // Mostrar modal de confirmación
    const result = await confirmSaveBeforePdf();
    if (result === 'SAVE_AND_GENERATE') {
      await saveTemplate();  // POST /api/admin/recibos/templates/:id
      await generatePdf();   // POST /api/admin/recibos/templates/:id/generar-pdf
    } else if (result === 'GENERATE_ONLY') {
      await generatePdf();   // Usa versión en BD
    }
    // Si CANCEL, no hacer nada
  } else {
    // Sin cambios, generar directamente
    await generatePdf();
  }
};
```

### NEW-1: Generar PDF sin Bloque 5 - Error Bloqueante

**Decisión:** Si Bloque 5 está incompleto → **error 400, no generar PDF**.

**Validación:**
```javascript
if (!template.bloque_pageconfig || !template.bloque_pageconfig.tamaño) {
  return res.status(400).json({
    success: false,
    message: "No se puede generar PDF: Bloque 5 (Configuración de Página) está incompleto",
    missing_fields: ['tamaño', 'orientacion', 'margenes', 'recibos_por_pagina', 'layout', 'espaciado']
  });
}
```

**UI:** Toast rojo + destaca sección Bloque 5 en editor

### NEW-2: Edición Concurrente - Last Write Wins

**Decisión:** Sin manejo de conflictos. Aceptar "last write wins" (última guardada sobrescribe).

**Razón:** Simplificar v1. Conflictos pueden manejarse en v2 con timestamps/versioning.

**Comportamiento:**
```
Admin A: edita nombre → [Guardar] → OK
Admin B: edita nombre → [Guardar] → OK (sobrescribe cambio de A)

Resultado: Cambio de A se pierde. B gana.
```

**Mitigación:** Usar `updated_at` timestamp para auditoría (quién guardó último).

**Nota en logs:**
```
Template ID: uuid-123
updated_at: 2026-06-12 14:32:00 (Admin B)
Cambio anterior: 2026-06-12 14:31:00 (Admin A)
```

### NEW-3: Multi-Pestaña - Sin Sincronización

**Decisión:** Zustand store **NO sincroniza** entre pestañas. Cada pestaña es independiente.

**Comportamiento:**
```
Pestaña A: abre template → Zustand store A
Pestaña B: abre MISMO template → Zustand store B (separado)

A edita nombre → no visible en B
B edita nombre → no visible en A
A: [Guardar] → BD versión de A
B: [Guardar] → sobrescribe con versión de B (last-write-wins, como NEW-2)
```

**No agregar localStorage sync** para simplificar (v1).

**Advertencia futura:** En v2, considerar `useLocalStorage` + `useBeforeUnload` para avisar si hay cambios pendientes en otra pestaña.

### NEW-4: PDF Temporal - Sin Auto-Guardar

**Decisión:** Generar PDF **NO guarda** cambios. Es visualización temporal.

**Flujo:**
1. Usuario edita template (cambios en Zustand editor)
2. Click "Descargar PDF" → valida (se muestra modal si isDirty)
3. Usuario elige "Generar Solo" → PDF usa versión en BD (cambios ignorados)
4. O elige "Guardar y Generar" → primero guarda, luego genera PDF

**Key Point:** PDF nunca auto-guarda. Usuario decide explícitamente.

**Ventaja:** Evita guardar templates incompletos o experimentos.

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
│  ├─ Bloque 4: Pie/Firma                                      │
│  │  - Texto legal, fecha, referencias                         │
│  │  [Editar] [Copiar] [Eliminar]                              │
│  │                                                             │
│  └─ Bloque 5: Configuración de Página [colapsible]           │
│     - Tamaño página, orientación, márgenes                    │
│     - Recibos por página, distribución, espacios              │
│     - [Expandir/Contraer] [Editar]                            │
│                                                             │
│  PREVIEW (derecha):                                           │
│  [Mostrar template completo con datos de ejemplo]             │
│  Selector "Afiliado de Ejemplo": [Dropdown - usuario elige]  │
│  (Datos se repiten si hay múltiples recibos por página)      │
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

**Layout y Espaciado:**
- Ancho del bloque:
  * 100% (full width - default)
  * 50% (mitad de ancho)
  * Personalizado (en mm o %)
- Altura del bloque:
  * Auto (ajusta al contenido - default)
  * Fija (en mm)
- Márgenes (espaciado con otros bloques):
  * Margen superior: 0-20mm (espacio antes del bloque)
  * Margen inferior: 0-20mm (espacio después del bloque)
  * Default recomendado: superior=0, inferior=5mm

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

**Layout y Espaciado:**
- Ancho del bloque: 100% | 50% | Personalizado (mismas opciones que Bloque 1)
- Altura del bloque: Auto | Fija (mm)
- Márgenes:
  * Margen superior: 0-20mm
  * Margen inferior: 0-20mm
  * Default recomendado: superior=0, inferior=5mm

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

**Layout y Espaciado:**
- Ancho del bloque: 100% | 50% | Personalizado
- Altura del bloque: Auto | Fija (mm)
- Márgenes:
  * Margen superior: 0-20mm
  * Margen inferior: 0-20mm
  * Default recomendado: superior=0, inferior=10mm (más espacio antes del pie)

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

**Layout y Espaciado:**
- Ancho del bloque: 100% | 50% | Personalizado
- Altura del bloque: Auto | Fija (mm)
- Márgenes:
  * Margen superior: 0-20mm
  * Margen inferior: 0-20mm (generalmente 0, es el último bloque)
  * Default recomendado: superior=0, inferior=0

#### **Bloque 5: Configuración de Página**
Propósito: Controlar tamaño, márgenes, orientación y distribución de recibos en la página

**Campos editables:**
```
- Tamaño de página:
  * A4 (210 × 297 mm)
  * A5 (148 × 210 mm)
  * Letter (215.9 × 279.4 mm)
  * Personalizado (ancho x alto en mm)

- Orientación:
  * Portrait (vertical)
  * Landscape (horizontal)

- Márgenes de página (en mm):
  * Margen superior: 5-50 mm (default: 10)
  * Margen derecho: 5-50 mm (default: 10)
  * Margen inferior: 5-50 mm (default: 10)
  * Margen izquierdo: 5-50 mm (default: 10)

- Recibos por página:
  * 1 recibo por página (full page)
  * 2 recibos por página
  * 3 recibos por página
  * 4 recibos por página
  * 6 recibos por página (grilla 2×3)
  * 8 recibos por página (grilla 2×4)

- Layout/Distribución:
  * Vertical: Recibos apilados de arriba a abajo
  * Grilla: Recibos distribuidos en columnas (2 columnas fijas)

- Espaciado entre recibos:
  * Gap vertical: 5-20 mm (separación entre filas)
  * Gap horizontal: 5-20 mm (separación entre columnas)
```

**Comportamiento:**
- Los campos "Recibos por página" y "Gap" solo aplican si hay múltiples recibos
- El layout "Grilla" solo se muestra si hay 4+ recibos por página
- Los márgenes afectan el área imprimible dentro de la página
- La orientación redimensiona el canvas automáticamente
- Los valores de gap se ignoran si solo hay 1 recibo por página

**Vista previa en tiempo real:**
- Al cambiar cualquier parámetro, el preview muestra:
  - Tamaño y orientación de la página
  - Posición de los márgenes (línea punteada)
  - Distribución de múltiples recibos (si aplica)
  - Espacios entre recibos

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

### 3.5.1 Preview en Vivo

**Panel de Preview (lado derecho del editor):**

```
┌─ Preview del Template ─────────────────┐
│                                        │
│ Selector "Afiliado de Ejemplo":        │
│ [Dropdown: Elige afiliado]             │
│                                        │
│ [Template renderizado con datos]      │
│ - Si hay múltiples recibos/página:    │
│   • Datos del afiliado se repiten     │
│   • Layout respeta configuración      │
│   • Márgenes y espaciado visible      │
│                                        │
│ [Botón] Ver PDF (abre en ventana)     │
└────────────────────────────────────────┘
```

**Comportamiento:**
- Usuario abre dropdown y selecciona un afiliado del sistema
- Si no hay afiliados: fallback automático a datos ficticios de ejemplo
- Preview se actualiza inmediatamente (debounce 300ms)
- Si `recibos_por_página > 1`: los mismos datos del afiliado aparecen en cada recibo
- Las líneas punteadas indican márgenes de página
- Preview respeta `bloque_pageconfig` (tamaño, orientación, espaciado)

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
→ Click botón "Insertar Placeholder" (junto al input)
→ Dropdown categorizado con todos los placeholders
→ Selecciona {{placeholder}} → se inserta en el campo
```

**5. Configurar Página (Bloque 5)**
```
Usuario → Expande sección "Bloque 5: Configuración de Página"
→ Selecciona tamaño (A4, A5, Letter, Personalizado)
→ Elige orientación (portrait/landscape)
→ Ajusta márgenes de página (5-50mm)
→ Define recibos por página (1, 2, 3, 4, 6, 8)
→ Selecciona layout (vertical o grilla)
→ Configura espaciado entre recibos (5-20mm)
→ Preview actualiza automáticamente mostrando la distribución
```

**7. Guardar Template**
```
Usuario → Completa ediciones (Bloque 5 es obligatorio)
→ Click "Guardar" en footer
→ Validación en frontend (Bloque 5 debe estar completo)
→ POST /api/admin/recibos/templates
→ Backend guarda o actualiza template en BD
→ Toast de éxito, vuelve a listado
```

**8. Activar Template**
```
Usuario → En listado, click [Activar] en un template
→ Confirma: "Este template se usará para generar todos los recibos"
→ Backend: desactiva anterior, activa este
→ Badge cambia a "Activo" (verde)
→ Futuras generaciones usan este template
```

**9. Vista Previa**
```
Usuario → Abre template
→ Panel derecho muestra preview en tiempo real
→ Selector "Afiliado de Ejemplo": elige afiliado del sistema
→ Preview muestra datos del afiliado seleccionado
→ Si hay múltiples recibos por página: datos se repiten en cada recibo
→ Si no hay afiliados: fallback a datos ficticios
→ Botón "Ver PDF" abre previsualización (puppeteer)
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
  bloque_pageconfig  JSON NOT NULL,                  -- Tamaño, márgenes, orientación
  
  -- Metadata
  activo             BOOLEAN DEFAULT FALSE,
  usuario_id         INT,                             -- FK Usuario (creador)
  
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY unique_activo (activo)                  -- Solo un template activo
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
  },
  
  "layout": {
    "ancho": "100%",              // "100%" | "50%" | custom (ej: "150mm")
    "alto": "auto",               // "auto" | custom (ej: "50mm")
    "margen_superior": 0,         // mm (0-20)
    "margen_inferior": 5          // mm (0-20)
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
  },
  
  "layout": {
    "ancho": "100%",              // "100%" | "50%" | custom
    "alto": "auto",               // "auto" | custom
    "margen_superior": 0,         // mm (0-20)
    "margen_inferior": 5          // mm (0-20)
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
  },
  
  "layout": {
    "ancho": "100%",              // "100%" | "50%" | custom
    "alto": "auto",               // "auto" | custom
    "margen_superior": 0,         // mm (0-20)
    "margen_inferior": 10         // mm (0-20) - más espacio antes del pie
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
  },
  
  "layout": {
    "ancho": "100%",              // "100%" | "50%" | custom
    "alto": "auto",               // "auto" | custom
    "margen_superior": 0,         // mm (0-20)
    "margen_inferior": 0          // mm (0-20) - es el último bloque
  }
}
```

#### Estructura JSON: `bloque_pageconfig`

```json
{
  "tamaño": "A4",                    // "A4" | "A5" | "Letter" | "Personalizado"
  "ancho_custom": 210,               // mm (solo si tamaño = "Personalizado")
  "alto_custom": 297,                // mm (solo si tamaño = "Personalizado")
  
  "orientacion": "portrait",         // "portrait" | "landscape"
  
  "margenes": {
    "superior": 10,                  // mm (5-50)
    "derecho": 10,                   // mm (5-50)
    "inferior": 10,                  // mm (5-50)
    "izquierdo": 10                  // mm (5-50)
  },
  
  "recibos_por_pagina": 1,           // 1 | 2 | 3 | 4 | 6 | 8
  "layout": "vertical",              // "vertical" | "grilla"
  
  "espaciado": {
    "gap_vertical": 5,               // mm (5-20, ignorado si recibos_por_pagina = 1)
    "gap_horizontal": 5              // mm (5-20, ignorado si recibos_por_pagina = 1)
  }
}
```

**Definiciones de tamaños estándar:**
```
A4:       210 × 297 mm
A5:       148 × 210 mm
Letter:   215.9 × 279.4 mm
Custom:   Definido por usuario
```

**Cálculo de dimensiones en preview:**
```
Ancho disponible = ancho_pagina - margen_izquierdo - margen_derecho
Alto disponible = alto_pagina - margen_superior - margen_inferior

Ancho recibo = (Ancho disponible - (gap_horizontal × (columnas-1))) / columnas
Alto recibo = (Alto disponible - (gap_vertical × (filas-1))) / filas
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
    "bloque_pageconfig": {
      "tamaño": "A4",
      "orientacion": "portrait",
      "margenes": { "superior": 10, "derecho": 10, "inferior": 10, "izquierdo": 10 },
      "recibos_por_pagina": 1,
      "layout": "vertical",
      "espaciado": { "gap_vertical": 5, "gap_horizontal": 5 }
    },
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
  "bloque_pie": { /* estructura JSON */ },
  "bloque_pageconfig": {
    "tamaño": "A4",
    "orientacion": "portrait",
    "margenes": { "superior": 10, "derecho": 10, "inferior": 10, "izquierdo": 10 },
    "recibos_por_pagina": 1,
    "layout": "vertical",
    "espaciado": { "gap_vertical": 5, "gap_horizontal": 5 }
  }
}
```

**Validaciones:**
- `bloque_pageconfig` es obligatorio (error 400 si falta)
- `nombre` no puede estar vacío
- `usuario_id` se extrae del JWT (desde middleware `verifyToken`)
- Todos los campos de `bloque_pageconfig` deben estar presentes y válidos
- No se permite crear template incompleto

**Response (201):**
```json
{
  "success": true,
  "templateId": "uuid-nuevo",
  "message": "Template creado exitosamente"
}
```

**Response (400) - Template incompleto:**
```json
{
  "success": false,
  "message": "bloque_pageconfig es obligatorio. Debe configurar tamaño, orientación, márgenes, recibos por página y espaciado."
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

#### **POST /api/admin/recibos/templates/:templateId/generar-pdf**
Genera PDF in situ (bajo demanda) del template con datos de una persona

**Body:**
```json
{
  "persona_id": 123,              // ID de persona para datos reales
  "recibo_data": null             // (opcional) SI null usa persona_id; SI presente usa estos datos
}
```

**Alternativa: datos ficticios sin persona_id**
```json
{
  "usar_datos_ficticios": true    // Generar PDF con datos de ejemplo
}
```

**Response (200) - PDF binario:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="recibo_YYYYMMDD_HHMMSS.pdf"
[Binary PDF data]
```

**Alternativa: Response JSON (para preview en iframe)**
```json
{
  "success": true,
  "pdf_base64": "JVBERi0xLjQKJeLj...",  // PDF codificado en base64
  "pdf_url": "data:application/pdf;base64,JVBERi0xLjQK...",
  "persona": { /* datos usados */ }
}
```

**Validaciones:**
- `persona_id` debe existir en BD (si se proporciona)
- Template debe estar completo (todos los bloques presentes)
- Timeout: máximo 30 segundos para renderizar y generar PDF
- Fallback a datos ficticios si `persona_id` es inválido

**Uso frontend:**
- Click botón "Descargar PDF" → POST con persona_id → descarga binario
- Click botón "Ver PDF" en preview → POST → abre en ventana nueva (iframe o ventana emergente)

### 4.3 Frontend - Componentes

**Estructura de carpetas:**

```
frontend/src/pages/AdminPanel/
├── RecibosTemplatesPage.jsx          # Página principal (listado)
├── RecibosTemplatesPage.scss
├── components/
│   ├── TemplatesList.jsx             # Tabla de templates
│   ├── TemplateEditor.jsx            # Modal de edición completa
│   │                                 # (Contiene Bloque 1-5 colapsibles)
│   ├── BlockEditor/
│   │   ├── BloqueEncabezado.jsx      # Editor del bloque 1 (logo, empresa)
│   │   ├── BloqueAfiliado.jsx        # Editor del bloque 2 (filas, drag&drop)
│   │   ├── BloqueDetalles.jsx        # Editor del bloque 3 (tabla)
│   │   ├── BloquePie.jsx             # Editor del bloque 4 (pie, firma)
│   │   ├── BloquePageConfig.jsx      # Editor del bloque 5 (página)
│   │   │                              # - Tamaño página, orientación
│   │   │                              # - Márgenes, recibos por página
│   │   │                              # - Layout, espaciado
│   │   └── BloqueCommon.scss         # Estilos comunes
│   ├── TemplatePreview.jsx           # Panel de preview (derecha)
│   │                                 # - Dropdown selector afiliados
│   │                                 # - Renderización con datos reales/ficticios
│   ├── PagePreview.jsx               # Renderización de página
│   │                                 # - Márgenes (línea punteada)
│   │                                 # - Múltiples recibos con layout
│   ├── StylesPanel.jsx               # Panel de estilos (reutilizable)
│   ├── PlaceholderSelector.jsx       # Dropdown con placeholders
│   │                                 # - Aparece junto a cada input de texto
│   │                                 # - Categorizado por tipo
│   └── AfililadoSelector.jsx         # Dropdown para elegir afiliado preview
└── hooks/
    └── useTemplateEditor.js          # Hook de estado (template, editingBlock, etc)

frontend/src/services/
├── templateService.js                # API: POST/PUT/GET templates
├── previewService.js                 # API: preview HTML, PDF preview
└── afiliados.js                      # API: listar afiliados para selector

frontend/src/hooks/
└── useTemplateStore.js               # Zustand store para estado compartido
                                       # (template, editingBlock, updateTemplate)

frontend/src/utils/
└── ficticiousData.js                 # Datos ficticios predefinidos para preview
```

**Detalles de componentes clave:**

- **BloquePageConfig.jsx**: Formulario con campos para tamaño, orientación, márgenes, recibos/página, layout, espaciado
- **PlaceholderSelector.jsx**: Botón junto a cada `<input>` de texto que abre dropdown categorizado
- **TemplatePreview.jsx**: Muestra vista previa con datos del afiliado seleccionado (o ficticios si vacío)
- **AfiliadoSelector.jsx**: Dropdown que lista afiliados; sin selección = fallback a ficticios
- **PDFGenerator.jsx**: Componente para generación in situ
  - Botón "Ver PDF" → abre en iframe o ventana nueva
  - Botón "Descargar PDF" → descarga binario
  - Spinner durante generación
  - Error handling con reintentos

### 4.4 Estado del Cliente - Zustand Store

**Librería:** Zustand (estado compartido entre Editor y Preview)

**Instalación:**
```bash
npm install zustand
```

**Store (hooks/useTemplateStore.js):**

```javascript
import create from 'zustand';

const useTemplateStore = create((set) => ({
  // Template actual
  currentTemplate: {
    id: null,
    nombre: "",
    descripcion: "",
    bloque_encabezado: { /* ... */ },
    bloque_afiliado: { /* ... */ },
    bloque_detalles: { /* ... */ },
    bloque_pie: { /* ... */ },
    bloque_pageconfig: { /* ... */ },
    activo: false,
    usuario_id: null,
    created_at: null,
    updated_at: null
  },
  
  // Estado de edición
  isDirty: false,
  isSaving: false,
  
  // Preview
  previewPersonaId: null,     // Afiliado seleccionado
  usarFicticios: false,       // Si no hay afiliados
  
  // Listado
  templates: [],
  loading: false,
  error: null,
  
  // Actions
  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  
  updateBloque: (bloqueKey, updates) => set((state) => ({
    currentTemplate: {
      ...state.currentTemplate,
      [bloqueKey]: { ...state.currentTemplate[bloqueKey], ...updates }
    },
    isDirty: true
  })),
  
  setPreviewPersona: (personaId) => set({ previewPersonaId: personaId }),
  
  setTemplates: (templates) => set({ templates }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));

export default useTemplateStore;
```

**Uso en componentes:**

```jsx
// En TemplateEditor.jsx
const { currentTemplate, updateBloque, isDirty } = useTemplateStore();

// En TemplatePreview.jsx
const { currentTemplate, previewPersonaId } = useTemplateStore();
```

**Flujo:**
1. TemplateEditor modifica via `updateBloque()` → store actualiza
2. Zustand notifica suscriptores automáticamente
3. TemplatePreview re-renderiza con `currentTemplate` nuevo
4. Debounce 300ms en preview (para evitar re-renderizar cada keystroke)

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
- Página config:
  - Tamaño: debe estar en lista permitida (A4, A5, Letter, Personalizado)
  - Personalizado: ancho 100-300mm, alto 100-400mm (error bloqueante si fuera de rango)
  - Orientación: portrait o landscape
  - Márgenes: valores 5-50mm cada uno
    * Validación: (margen_sup + margen_inf) ≤ alto_página
    * Validación: (margen_izq + margen_der) ≤ ancho_página
    * Error 400 si viola: "Márgenes exceden dimensiones"
  - Recibos por página: 1, 2, 3, 4, 6 u 8
  - Layout: vertical o grilla
    * Si grilla: usuario define columnas (1-4), sistema calcula filas
  - Espaciado: valores 5-20mm cada uno
- Layout de bloques (todos los bloques):
  - Ancho: "100%" | "50%" | custom (validar formato: número + unidad)
  - Alto: "auto" | custom (validar formato: número + mm)
  - Margen superior: 0-20mm (número)
  - Margen inferior: 0-20mm (número)

**Backend:**
- Validar estructura JSON de bloques (incluyendo bloque_pageconfig)
- No permitir template activo sin bloques requeridos
- Usuario debe ser admin
- Validar referencias de usuario_id
- Validar bloque_pageconfig:
  - Si tamaño = "Personalizado", validar ancho_custom y alto_custom
  - Validar que margenes suma no exceda dimensiones disponibles
  - Validar que layout "grilla" solo se use con 4+ recibos por página
- Validar layout de cada bloque:
  - Ancho: "100%" | "50%" | formato válido (ej: "150mm", "200px")
  - Alto: "auto" | formato válido (ej: "50mm", "100px")
  - Márgenes: números entre 0-20
  - Suma de márgenes no debe exceder alto total disponible

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
- Rate limit: **10 PDFs/minuto por usuario** para endpoint `/generar-pdf`
  - (Sin límite general en otros endpoints de templates)

### 5.5 Criterios de Aceptación (AC)

#### AC1: Crear Template
- ✅ Modal "Nuevo Template" abre con campos vacíos
- ✅ Nombre es obligatorio (max 100 caracteres)
- ✅ Bloque 5 (Configuración Página) es obligatorio al guardar
- ✅ Si falta Bloque 5: error 400 "Bloque 5 es obligatorio"
- ✅ Template se asigna a usuario creador (desde JWT)
- ✅ Token de éxito muestra ID del nuevo template

#### AC2: Editar Template
- ✅ Click [Editar] abre editor con datos cargados
- ✅ Cambios en bloques 1-4 se reflejan en preview (debounce 300ms)
- ✅ Cambios en Bloque 5 recalculan layout de página
- ✅ [Guardar] valida Bloque 5 antes de POST
- ✅ Usuario puede abandonar sin guardar (confirmación opcional)

#### AC3: Preview Afiliados
- ✅ Dropdown muestra lista de afiliados activos
- ✅ Al seleccionar afiliado: preview se actualiza con sus datos
- ✅ Si no hay afiliados: fallback automático a datos ficticios
- ✅ Si `recibos_por_página > 1`: datos se repiten en cada recibo
- ✅ Márgenes de página visibles (línea punteada)

#### AC4: Bloque 5 - Configuración Página
- ✅ Selector tamaño: A4, A5, Letter, Personalizado
- ✅ Si Personalizado: inputs para ancho (100-300mm) y alto (100-400mm)
- ✅ Selector orientación: portrait, landscape
- ✅ Inputs de márgenes: superior, derecho, inferior, izquierdo (5-50mm)
- ✅ Selector recibos/página: 1, 2, 3, 4, 6, 8
- ✅ Selector layout: "Vertical" (siempre visible), "Grilla" (solo si ≥4 recibos)
- ✅ Inputs espaciado: gap_vertical, gap_horizontal (5-20mm, ignorados si 1 recibo)

#### AC5: Placeholders
- ✅ Botón "Insertar Placeholder" junto a cada `<input>` de texto
- ✅ Dropdown muestra placeholders categorizados
- ✅ Click en placeholder: se inserta en posición del cursor
- ✅ Placeholders no son editables (read-only)

#### AC6: Validación en Guardar
- ✅ Validar Bloque 5 completo (todos los campos presentes)
- ✅ Validar márgenes de página (5-50mm)
- ✅ Validar gap espaciado (5-20mm, solo si > 1 recibo)
- ✅ Validar personalizado (100-300mm ancho, 100-400mm alto)
- ✅ Error claro si falta algún campo obligatorio

#### AC7: Activar Template
- ✅ Click [Activar] en listado abre confirmación
- ✅ Confirmación: "Este template se usará para nuevos recibos"
- ✅ Al confirmar: desactiva anterior (si existe), activa este
- ✅ Badge cambia a "Activo" (verde)

#### AC8: Generación PDF
- ✅ Botón "Ver PDF" en editor de template
- ✅ Botón "Descargar PDF" en editor de template
- ✅ Puppeteer renderiza HTML → PDF in situ (bajo demanda)
- ✅ PDF respeta: tamaño página, márgenes, orientación, recibos por página
- ✅ Si múltiples recibos: se distribuyen según layout (vertical/grilla)
- ✅ "Ver PDF" abre en ventana nueva o iframe
- ✅ "Descargar PDF" inicia descarga binaria (filename con timestamp)

#### AC9: Generación PDF In Situ
- ✅ Endpoint `POST /api/admin/recibos/templates/:id/generar-pdf`
- ✅ Acepta: `{ persona_id: 123 }` o `{ usar_datos_ficticios: true }`
- ✅ Valida template completo antes de generar (Bloque 5 obligatorio)
- ✅ Timeout máximo 30 segundos (fallback a error 504 si excede)
- ✅ Respuesta: siempre binario (descarga con filename timestamp)
- ✅ Limit: 10 PDFs/minuto por usuario (error 429 si excede)
- ✅ Error claro si template está incompleto
- ✅ Fallback a datos ficticios si persona_id inválido

#### AC10: Validación Bloque 5 en Generación PDF
- ✅ Click "Descargar PDF" sin guardar Bloque 5 → Error 400
- ✅ Mensaje claro: "Bloque 5 es obligatorio para generar PDF"
- ✅ No hay auto-relleno de defaults
- ✅ Usuario debe completar Bloque 5 y guardar primero

#### AC11: Guardar vs Generar PDF (Sin Cambios Automáticos)
- ✅ Generar PDF **no auto-guarda** template
- ✅ Si hay cambios sin guardar (isDirty=true) → modal de confirmación
- ✅ Opciones en modal:
  - "Guardar y Generar" → POST guardar + POST generar
  - "Generar Solo" → usar versión en BD (ignora cambios editor)
  - "Cancelar" → abortar
- ✅ Sin cambios pendientes → generar directo (sin modal)

#### AC12: Concurrencia - Last Write Wins
- ✅ Sin validación de conflictos (acepta pérdida de datos)
- ✅ Si Admin A y Admin B editan simultáneamente → última guardada gana
- ✅ Timestamp updated_at refleja quién guardó último
- ✅ Documentar en logs para auditoría

#### AC13: Multi-Pestaña - Sin Sincronización
- ✅ Zustand store NO sincroniza entre pestañas
- ✅ Cada pestaña tiene su editor state independiente
- ✅ Si 2 pestañas guardan → last-write-wins (como AC12)
- ✅ Sin localStorage sync en v1

#### AC14: Rate Limit PDF - 10/minuto
- ✅ Máximo 10 PDFs generados por minuto por usuario
- ✅ Error 429 si se excede: "Demasiadas solicitudes"
- ✅ Retry-After header indica segundos para reintentar
- ✅ Sin límite en otros endpoints de templates

### 5.6 Manejo de Errores y Edge Cases

#### Error: Bloque 5 Obligatorio
```
Escenario: Usuario intenta guardar sin configurar Bloque 5
Respuesta: Error 400 "bloque_pageconfig es obligatorio"
UI: Toast rojo, foco en sección Bloque 5
```

#### Error: Márgenes Inválidos
```
Escenario: Usuario introduce margen superior 100mm en A4 portrait (alto 297mm)
Validación: Suma de márgenes ≤ alto disponible
Respuesta: Error 400 "Márgenes exceden dimensiones de página"
```

#### Edge Case: Sin Afiliados
```
Escenario: Sistema sin afiliados en BD, usuario abre preview
Comportamiento: Fallback automático a datos ficticios
UI: Muestra "Usando datos de ejemplo (no hay afiliados reales)"
```

#### Edge Case: Personalizado Mínimo
```
Escenario: Usuario selecciona Personalizado 100mm × 100mm
Validación: Ancho ≥ 100mm, Alto ≥ 100mm
Comportamiento: Permite crear pero avisa "Dimensión muy pequeña"
```

#### Edge Case: Grilla con < 4 Recibos
```
Escenario: Usuario selecciona layout "Grilla" con 2 recibos/página
Validación: Grilla solo permite si ≥ 4 recibos
Respuesta: Selector "Grilla" deshabilitado (solo "Vertical" visible)
```

#### Error: Eliminar Template Activo
```
Escenario: Usuario intenta eliminar template marcado como Activo
Validación: No permitir (error 400)
Respuesta: "No puede eliminar template activo. Primero active otro."
```

#### Error: Máximo Templates Alcanzado
```
Escenario: Sistema ya tiene 5 templates, usuario intenta crear otro
Respuesta: Error 400 "Máximo 5 templates permitidos"
UI: Aviso a partir de 4 templates creados
```

#### Error: Placeholder Inválido
```
Escenario: Usuario intenta insertar placeholder que no existe
Validación: Solo permitir placeholders de lista autorizada
Respuesta: Placeholder selector solo muestra válidos (no input libre)
```

#### Error: PDF Timeout (In Situ)
```
Escenario: Usuario hace click "Descargar PDF" y Puppeteer tarda > 30s
Validación: Timeout máximo 30 segundos
Respuesta: Error 504 "Timeout: PDF tardó demasiado en generar"
UI: Toast rojo, spinner se detiene, opción de reintentar
```

#### Error: Rate Limit PDF
```
Escenario: Usuario hace click 15 veces "Descargar PDF" en 1 minuto
Validación: Máximo 10 PDFs por minuto por usuario
Respuesta: Error 429 "Demasiadas solicitudes. Espere 30 segundos."
UI: Botón deshabilitado temporalmente, contador regresivo
```

#### Error: Template Incompleto en PDF
```
Escenario: Usuario intenta generar PDF de template en edición (sin Bloque 5)
Validación: Template debe estar estructuralmente completo
Respuesta: Error 400 "Template incompleto: faltan campos en Bloque 5"
UI: Toast rojo + lista de campos faltantes
```

#### Edge Case: Múltiples Recibos en PDF
```
Escenario: Template con 6 recibos/página, layout grilla, usuario genera PDF
Comportamiento:
- 1 PDF con 1 página (6 recibos distribuidos 2×3)
- Márgenes respetados en todos
- Gaps (espaciado) aplicados correctamente
- Responsive: recibos se ajustan al espacio disponible
```

#### Error: Generar PDF sin Bloque 5
```
Escenario: Usuario abre template, no completa Bloque 5, hace click "Descargar PDF"
Validación: Bloque 5 es obligatorio
Respuesta: Error 400 "Bloque 5 (Configuración de Página) incompleto"
UI: Toast rojo + destaca sección Bloque 5 sin completar
```

#### Escenario: Editar Mientras Se Genera PDF
```
Escenario: 
1. Usuario edita nombre empresa en Bloque 1
2. Click "Descargar PDF"
3. Sistema detecta isDirty=true

Flujo:
- Modal: "¿Guardar cambios antes de generar PDF?"
  [Guardar y Generar] [Generar Solo] [Cancelar]

Opciones:
- "Guardar y Generar": guarda cambios en BD → genera PDF de versión nueva
- "Generar Solo": ignora cambios, genera PDF de última versión guardada
- "Cancelar": aborta, vuelve a editor
```

#### Escenario: Edición Concurrente (Admin A vs Admin B)
```
Escenario:
- Admin A: edita nombre → [Guardar] → OK (updated_at: 14:31:00)
- Admin B: edita descripción → [Guardar] → OK (updated_at: 14:32:00)

Resultado: Cambio de A se sobrescribió. B solo ve cambio de B.
Cambio de A perdido (last-write-wins).

Mitigación: Auditoría logs muestra quién guardó último.
Nota: En v2, considerar optimistic locking o conflict detection.
```

#### Escenario: Multi-Pestaña (2 editors)
```
Escenario:
- Pestaña A: abre template → edita nombre
- Pestaña B: abre MISMO template → edita descripción
- Pestaña A: [Guardar] → guarda versión A
- Pestaña B: [Guardar] → sobrescribe con versión B

Resultado: Cambios de A perdidos (last-write-wins, como concurrencia).
Zustand stores A y B son independientes, no sincronizados.

Sin localStorage sync en v1. Documentar para v2.
```

#### Escenario: PDF Temporal (sin persistencia)
```
Escenario:
- Usuario edita template (sin guardar)
- Click "Descargar PDF"
- Elige "Generar Solo" → PDF usa versión guardada (cambios ignorados)

Resultado:
- PDF generado con datos antiguos
- Cambios del editor se pierden (no se guardan)
- Usuario debe hacer [Guardar] explícitamente para persistir

Key: PDF nunca auto-guarda. Usuario es responsable de guardar.
```

---

## 6. Integración con Generación de Recibos

### 6.1 PDF Generator - Puppeteer

**Librería:** Puppeteer (Node.js)  
**Razón:** Renderiza HTML con CSS completo, maneja múltiples páginas y layouts complejos

**Instalación:**
```bash
npm install puppeteer
```

**Flujo:**
1. JSON del template → HTML con CSS embebido
2. Puppeteer abre navegador headless
3. Renderiza HTML → screenshot/PDF
4. Guarda PDF binario

### 6.2 Serialización: JSON → HTML

**Función: `serializeTemplate(template, persona, recibo)`**

Convierte JSON a HTML estructurado:

```javascript
function serializeTemplate(template, persona, recibo) {
  const { bloque_encabezado, bloque_afiliado, bloque_detalles, bloque_pie, bloque_pageconfig } = template;
  
  // 1. Crear estructura HTML con tamaño y orientación
  const pageStyle = buildPageStyle(bloque_pageconfig);  // CSS: tamaño, márgenes, orientación
  
  // 2. Serializar cada bloque a HTML
  let html = `<html><head><style>${pageStyle}</style></head><body>`;
  html += renderBloqueEncabezado(bloque_encabezado);
  html += renderBloqueAfiliado(bloque_afiliado, persona);
  html += renderBloqueDetalles(bloque_detalles, recibo);
  html += renderBloquePie(bloque_pie, recibo);
  html += `</body></html>`;
  
  // 3. Reemplazar placeholders
  html = replacePlaceholders(html, persona, recibo);
  
  return html;
}
```

**Manejo de placeholders en CSS:**
- Placeholder como class: `{{arancel_negativo_class}}` → sustituir con nombre de clase CSS
- Ejemplo: si arancel < 0 → agregar clase `text-red` al elemento

### 6.3 Flujo de Generación de Recibos

```
1. Usuario solicita generar recibos: POST /api/recibos/generar?periodo=2026-04
2. Backend obtiene template activo: SELECT * FROM recibo_templates WHERE activo = TRUE
3. Para cada persona en período:
   a. Obtiene datos personalizados de BD
   b. Serializa JSON → HTML (serializeTemplate)
   c. Reemplaza placeholders con datos reales
   d. Puppeteer renderiza HTML → PDF binario
   e. Guarda PDF en storage (o en tabla recibos como BLOB)
   f. Registra en tabla `recibos` (referencia a PDF)
```

### 6.4 Vista Previa Antes de Guardar

**Endpoint:** `POST /api/admin/recibos/preview/:templateId/:personaId`

Flujo:
1. Obtiene template y datos de persona
2. Serializa a HTML
3. Puppeteer renderiza snapshot
4. Retorna HTML al frontend para preview en vivo

**Response:**
```json
{
  "success": true,
  "html": "<html>...</html>",  // HTML renderizado
  "persona": { /* datos usados */ }
}
```

### 6.5 Generación PDF In Situ (Bajo Demanda)

**Propósito:** Permitir que administradores generen PDFs de prueba directamente desde el editor sin guardar el template. Útil para validar diseño antes de activar.

**Endpoint:** `POST /api/admin/recibos/templates/:templateId/generar-pdf`

**Uso Casos:**
1. **Preview → Descargar PDF**: Usuario ve preview y hace click "Descargar PDF" → recibe PDF binario
2. **Ver PDF en ventana**: Usuario hace click "Ver PDF" → se abre en ventana nueva/iframe
3. **Template en edición**: Template aún no guardado, pero usuario quiere ver cómo se vería en PDF

**Flujo Backend:**

```
1. POST /api/admin/recibos/templates/:templateId/generar-pdf
   └─ Body: { persona_id: 123 } o { usar_datos_ficticios: true }

2. Backend:
   a. Valida template (estructura JSON completa)
   b. Obtiene datos de persona (si persona_id) o usa ficticios
   c. Serializa template → HTML (JSON → HTML con CSS)
   d. Reemplaza placeholders con datos
   e. Puppeteer renderiza HTML → PDF binario
   f. Retorna PDF

3. Opciones de respuesta:
   - Response binario: Content-Type: application/pdf → descarga directo
   - Response base64: JSON con pdf_base64 → abre en iframe/ventana
```

**Body - Opción 1: Con Persona Real**
```json
{
  "persona_id": 123,
  "periodo": "2026-06"  // (opcional) si necesita datos de período específico
}
```

**Body - Opción 2: Datos Ficticios**
```json
{
  "usar_datos_ficticios": true
}
```

**Response (200) - Binario (para descarga):**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="recibo_20260612_143022.pdf"
Content-Length: 45678

[Binary PDF data...]
```

**Response (200) - Base64 (para preview en iframe):**
```json
{
  "success": true,
  "pdf_base64": "JVBERi0xLjQKJeLj...",
  "pdf_url": "data:application/pdf;base64,JVBERi0xLjQK...",
  "filename": "recibo_20260612_143022.pdf",
  "persona": {
    "numero_afiliado": "0001",
    "titular_nombre": "Juan",
    "valor_cuota": 250.50
  }
}
```

**Response (400) - Errores:**
```json
{
  "success": false,
  "message": "Template incompleto: bloque_pageconfig falta",
  "errors": {
    "bloque_pageconfig": "Requerido",
    "bloque_encabezado": "Requerido"
  }
}
```

```json
{
  "success": false,
  "message": "Persona no encontrada o inactiva (ID: 123)"
}
```

**Validaciones:**
- ✅ Template debe estar completo (todos los bloques presentes)
- ✅ `persona_id` debe existir en BD (si se proporciona)
- ✅ Timeout máximo: 30 segundos para Puppeteer
- ✅ Fallback a ficticios si persona_id es inválido
- ✅ Limit de 10 PDFs por minuto por usuario (para no sobrecargar servidor)

**UI Frontend:**

En el editor del template:

```
┌─ Panel Preview ─────────────┐
│ [Selector Afiliado] ▼       │
│ [Preview HTML]              │
│                             │
│ [Botón] Ver PDF (nuevo)     │  → abre en ventana/iframe
│ [Botón] Descargar PDF       │  → descarga binario
└─────────────────────────────┘
```

**Comportamiento:**
- Usuario hace click → POST `/templates/:id/generar-pdf` con persona_id
- Esperador: "Generando PDF..." spinner
- Si éxito: 
  - "Ver PDF" → abre en ventana nueva o en `<iframe>`
  - "Descargar PDF" → inicia descarga binaria
- Si error: Toast rojo con mensaje de error

**Ventajas:**
- ✅ Validación visual antes de guardar
- ✅ Detecta problemas de formato/márgenes
- ✅ No requiere guardar template (útil en drafts)
- ✅ Rápido: 2-5 segundos por PDF
- ✅ Personalizable: usuario elige qué afiliado usar

### 6.6 Restricciones y Soporte CSS (Preview vs PDF)

**Mismo CSS en ambos (best-effort)** — browser preview y PDF Puppeteer usan mismo stylesheet.

**Propiedades CSS soportadas:**

✅ **Completamente soportadas en PDF:**
- `color`, `background-color`
- `font-family`, `font-size`, `font-weight`, `font-style`
- `margin`, `padding`, `border` (simples)
- `text-align` (left, center, right, justify)
- `width`, `height`
- `line-height`
- `display: block | inline | inline-block` (básico)
- `table`, `thead`, `tbody`, `tr`, `td` (tablas)

⚠️ **Limitadamente soportadas:**
- `box-shadow`: solo sombras simples (sin blur complejos)
- `border-radius`: sí funciona, pero evitar combinaciones complejas
- `gradient`: solo lineales simples; no radiales
- `transform`: NO funciona en PDF (evitar)
- `opacity`: sí, pero puede afectar rendering

❌ **NO soportadas en PDF (evitar):**
- `animation`, `@keyframes`, `transition`
- `filter` (blur, brightness, etc)
- `clip-path`, `mask`
- `@media` queries (Puppeteer headless ignora)
- CSS variables `var(--color)` (limitado, no garantizado)
- Pseudoelementos `:before`, `:after` (limitado)

**Advertencia UI:** Si usuario utiliza estilos no soportados (transform, animation), UI muestra badge amarillo "⚠️ Este estilo podría no verse igual en PDF"

**Ejemplo válido:**
```css
.bloque-encabezado {
  background-color: #f0f0f0;
  font-family: Arial, sans-serif;
  font-size: 14px;
  padding: 10px;
  border-bottom: 1px solid #999;
  text-align: center;
}
```

**Ejemplo problemático (evitar):**
```css
.bloque-detalle {
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);  /* ⚠️ muy complejo */
  transform: rotate(2deg);                   /* ❌ No funciona en PDF */
  animation: fadeIn 1s;                      /* ❌ No funciona en PDF */
}
```

---

## 7. Migraciones de Base de Datos

### Migración: `2.0.34_recibo_templates`

**Contexto:** Fresh start - tabla nueva, sin migración de datos legacy. Se crea con estructura completa (bloques 1-5 + página config).

**Upgrade (upgrade.sql):**
```sql
-- Crear tabla recibo_templates con estructura JSON modular
-- Esta es una tabla NUEVA sin datos previos que migrar
CREATE TABLE IF NOT EXISTS recibo_templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  
  -- 5 bloques en JSON (estructura modular)
  bloque_encabezado JSON NOT NULL,       -- Logo, empresa, contacto
  bloque_afiliado JSON NOT NULL,         -- Filas con placeholders
  bloque_detalles JSON NOT NULL,         -- Tabla de valores
  bloque_pie JSON NOT NULL,              -- Legal, firma
  bloque_pageconfig JSON NOT NULL,       -- Tamaño, márgenes, orientación, distribución
  
  -- Metadata
  activo BOOLEAN DEFAULT FALSE,
  usuario_id INT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY unique_activo (activo)  -- Constraint: solo un template activo
);

-- Insertar template por defecto (inicial)
INSERT INTO recibo_templates (id, nombre, descripcion, bloque_encabezado, bloque_afiliado, bloque_detalles, bloque_pie, bloque_pageconfig, activo, usuario_id) VALUES (
  UUID(),
  'Template Predefinido',
  'Template estándar del sistema',
  '{"logo_url":"","empresa_nombre":"Mi Empresa","empresa_direccion":"","empresa_telefono":"","empresa_email":"","empresa_sitio":"","estilos":{"fontFamily":"Arial","fontSize":14,"color":"#000000","textAlign":"center","backgroundColor":"#FFFFFF","padding":10},"layout":{"ancho":"100%","alto":"auto","margen_superior":0,"margen_inferior":5}}',
  '{"filas":[{"id":"fila_1","visible":true,"etiqueta":"Número Afiliado","placeholder":"{{numero_afiliado}}"},{"id":"fila_2","visible":true,"etiqueta":"Titular","placeholder":"{{titular_nombre}} {{titular_apellido}}"}],"estilos":{"fontFamily":"Arial","fontSize":11,"color":"#000000","borderWidth":1,"borderColor":"#CCCCCC","padding":5},"layout":{"ancho":"100%","alto":"auto","margen_superior":0,"margen_inferior":5}}',
  '{"template_preset":"simple","filas":[{"id":"detalle_1","etiqueta":"Cuota Social","placeholder":"{{cuota_social}}"}],"fila_total":{"etiqueta":"TOTAL A PAGAR","placeholder":"{{valor_cuota}}"},"estilos":{"fontFamily":"Arial","fontSize":11,"color":"#000000","borderWidth":1,"borderStyle":"solid","borderColor":"#000000","headerBgColor":"#F0F0F0"},"layout":{"ancho":"100%","alto":"auto","margen_superior":0,"margen_inferior":10}}',
  '{"aclaracion":"Comprobante válido para...","texto_legal":"Conservar para sus...","fecha_formato":"dd/mm/aaaa","mostrar_linea_firma":true,"referencia":"Comprobante Nº {{numero_recibo}}","estilos":{"fontFamily":"Arial","fontSize":10,"color":"#666666","textAlign":"center","paddingTop":20},"layout":{"ancho":"100%","alto":"auto","margen_superior":0,"margen_inferior":0}}',
  '{"tamaño":"A4","orientacion":"portrait","margenes":{"superior":10,"derecho":10,"inferior":10,"izquierdo":10},"recibos_por_pagina":1,"layout":"vertical","espaciado":{"gap_vertical":5,"gap_horizontal":5}}',
  TRUE,  -- Activo por defecto
  1      -- Usuario admin (asume que existe usuario_id = 1)
);
```

**Downgrade (downgrade.sql):**
```sql
-- Esta es una migración destructiva
-- El downgrade solo elimina la tabla, datos NO se recuperan
DROP TABLE IF EXISTS recibo_templates;

-- Si necesita recuperar datos, debe restaurar desde backup anterior
```

**Notas importantes:**
- ✅ Fresh start: tabla nueva, no hay datos previos que migrar
- ✅ Valores JSON son estructuras válidas listas para usar
- ⚠️ `usuario_id = 1` asume que existe un usuario admin con ese ID (verif icar antes de ejecutar)
- ⚠️ Downgrade es DESTRUCTIVO y no reversible sin backup

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
