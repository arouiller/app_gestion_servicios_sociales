# BACKLOG-081: Diseñador Visual de Templates de Recibos (Table Builder)

## Descripción del Requerimiento

Crear una herramienta interna accesible a administradores que permita diseñar y personalizar templates HTML de recibos de forma visual, sin necesidad de conocimiento de HTML. Los administradores podrán:
- Construir tablas con filas y columnas dinámicamente
- Agregar colspans y rowspans
- Insertar placeholders de datos ({{campo}})
- Ver vista previa en tiempo real
- Generar HTML limpio exportable a la BD

**Beneficio:** Elimina la necesidad de pedir a desarrolladores que personalicen templates; administradores pueden diseñar directamente.

---

## Análisis

### Contexto Actual
- Templates de recibos se almacenan en tabla `recibo_templates` (HTML crudo)
- Actualmente, personalización requiere SQL directo o intervención del dev
- La mayoría de templates usan estructura de tabla (filas × columnas)
- Placeholders disponibles están documentados en `pdfHelpers.js`

### Por Qué Esta Solución

**Opción evaluada:** WYSIWYG editor vs Table Builder vs Hybrid
- **Table Builder elegido** porque:
  - Recibos son tablas → interfaz especializada
  - Control fino sobre estructura (colspans, orden)
  - Interfaz amigable para no-técnicos
  - HTML resultante es limpio y predecible
  - Menos errores que editor libre

---

## Especificación Funcional

### 1. Ubicación y Acceso

**Dónde:** Panel Admin → Sección "Configuración"  
**Nueva URL:** `/admin/recibo-designer` o `/admin/templates`  
**Acceso:** Solo usuarios con rol `admin`  
**Link visible en:** Panel admin navbar/sidebar

**Estructura de navegación:**
```
Admin Panel
├── Dashboard
├── Gestión de Usuarios
├── Gestión de Planes
├── Configuración
│   ├── Parámetros del Sistema
│   ├── 🆕 Diseñador de Recibos ← AQUÍ
│   └── ...
```

---

### 2. Interfaz Principal

#### **Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Diseñador de Templates de Recibos                          │
├──────────────────────┬──────────────────────────────────────┤
│ Panel Izquierdo      │ Panel Derecho                        │
│ (Herramientas)       │ (Vista Previa + Editor)              │
│                      │                                      │
│ • Agregar Fila       │ ┌──────────────────────────────────┐│
│ • Agregar Columna    │ │ VISTA PREVIA DEL RECIBO          ││
│ • Eliminar Fila      │ │ (Renderizado HTML en tiempo real)││
│ • Eliminar Columna   │ │                                  ││
│ • Colspan/Rowspan    │ │ [Recibo renderizado aquí]        ││
│ • Placeholders       │ │                                  ││
│ • Texto Libre        │ │                                  ││
│                      │ └──────────────────────────────────┘│
│                      │                                      │
│                      │ Parámetros de Página:                │
│                      │ • Tamaño: A4 ◢                      │
│                      │ • Orientación: Vertical ◢           │
│                      │ • Márgenes: 8mm                     │
│                      │                                      │
│ ┌──────────────────┐ │ [Botón: Guardar] [Botón: Exportar] │
│ │ Grilla HTML      │ │                                      │
│ │ Editor           │ │                                      │
│ │                  │ │                                      │
│ └──────────────────┘ │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

---

### 3. Componentes Principales

#### **A. Panel de Herramientas (Izquierda)**

**Sección 1: Estructura**
- Botón: "+ Fila" → Agregar fila al final de tabla
- Botón: "+ Columna" → Agregar columna a todas las filas
- Botón: "- Fila" → Eliminar última fila (con confirmación)
- Botón: "- Columna" → Eliminar última columna (con confirmación)
- Botón: "Limpiar" → Resetear tabla vacía (con confirmación)

**Sección 2: Placeholders Disponibles**
Desplegable/tabla de referencia:
```
Datos del Recibo:
├── {{numero_recibo}}
├── {{numero_afiliado}}
├── {{periodo}}
├── {{titular_apellido}}
├── {{titular_nombre}}
├── {{fecha_nacimiento}}
├── {{fecha_cobertura}}
├── {{numero_documento}}
├── {{obra_social_nombre}}
├── {{tipo_plan_nombre}}
├── {{tipo_de_grupo_nombre}}
├── {{domicilio}}
├── {{localidad_nombre}}
├── {{zona_codigo}}
│
Valores Monetarios:
├── {{valor_cuota}}
├── {{cuota_social}}
├── {{arancel_por_servicio}}
└── {{arancel_negativo_class}}
```

Botón "Copiar" al lado de cada placeholder (para pegar en celda).

**Sección 3: Editor Inline**
- Tabla de 2 columnas: "Fila" | "Columna" | "Contenido" | "Colspan"
- Cada fila editable con inputs
- Selector de contenido: Texto libre | Placeholder | Vacío

#### **B. Panel de Vista Previa (Derecha)**

**Sección 1: Vista Previa Viva**
- Renderizado HTML en tiempo real (actualiza al editar)
- Usa estilos CSS compactos similares a template real
- Scroll interno si excede altura

**Sección 2: Controles de Página**
- Dropdown: Tamaño (A4, A5, Carta, Personalizado)
- Dropdown: Orientación (Vertical, Horizontal)
- Input numérico: Márgenes (en mm)
- Checkbox: Aplicar estilos CSS compactos

**Sección 3: Acciones Finales**
- Botón "Guardar como Template": Guarda en BD con nombre custom
- Botón "Exportar HTML": Descarga .html file para enviar por email
- Botón "Copiar al Portapapeles": Copia HTML para pegar en otra app

---

### 4. Arquitectura Técnica

#### **Frontend (React)**

**Nuevo componente:** `frontend/src/pages/AdminPanel/ReciboDesignerPage.jsx`

```javascript
ReciboDesignerPage
├── ReciboDesignerToolbar
│   ├── StructureControls (+ Fila, - Fila, etc.)
│   ├── PlaceholderSelector
│   └── InlineEditor (tabla editable)
├── ReciboPreview
│   ├── HTMLRenderer (renderiza HTML en vivo)
│   └── PageControls (tamaño, márgenes, orientación)
└── ActionButtons (Guardar, Exportar, Copiar)
```

**State Management (Zustand):**
```javascript
useReciboDesignerStore = {
  grid: [
    { cells: [{ content: 'Título', colspan: 2 }, ...] },
    { cells: [{ content: '{{numero_recibo}}', colspan: 1 }, ...] },
    ...
  ],
  pageConfig: { size: 'A4', orientation: 'portrait', margins: 8 },
  actions: {
    addRow, deleteRow, addColumn, deleteColumn,
    updateCell, setColspan, generateHTML
  }
}
```

**Dependencias nuevas:**
- Ninguna obligatoria (usar React vanilla + Zustand)
- Opcional: `html2pdf` para preview más realista (pero con `html-pdf` en backend, puede no ser necesario)

#### **Backend**

**Endpoint GET:** `/api/admin/recibos/placeholders`
```json
Response: {
  "categories": {
    "recibo": ["numero_recibo", "numero_afiliado", ...],
    "monetarios": ["valor_cuota", ...]
  }
}
```

**Endpoint POST:** `/api/admin/recibos/templates`
```json
Body: {
  "nombre": "Previsora Personalizado",
  "html": "<table>...</table>",
  "pageSize": "A4",
  "orientation": "portrait",
  "margins": 8,
  "activo": true
}
Response: { "id": 1, "created_at": "2026-05-21", ... }
```

**Endpoint PUT:** `/api/admin/recibos/templates/{id}`
- Actualizar template existente

**Endpoint GET:** `/api/admin/recibos/templates`
- Listar templates (para selector "Cargar template anterior")

**Validación:**
- HTML debe contener al menos 1 `<table>` o 1 `<div>`
- Placeholders deben estar en lista permitida (validar contra pdfHelpers.js)
- Márgenes entre 0-50mm
- Nombre único

#### **Seguridad**
- Middleware `authMiddleware` + check de rol `admin`
- XSS: Sanitizar HTML antes de guardar (usar `DOMPurify` o validación blanca)
- SQL injection: Usar prepared statements (Sequelize ya lo hace)
- Rate limiting: `/api/admin/*` limitado a 100 req/min por admin

---

### 5. Flujo de Usuario

**Escenario: Personalizar template de recibos**

1. Admin inicia sesión
2. Nav → Admin Panel → Configuración → "Diseñador de Recibos"
3. Página carga con tabla vacía (grilla 3×3 por defecto)
4. Admin:
   - Selecciona celda (1,1) → escribe "PREVISORA DEL NORTE"
   - Selecciona celda (1,2) → escribe "{{numero_recibo}}"
   - Agregar fila → Agrega fila 2
   - Selecciona (2,1) → selecciona placeholder "{{titular_apellido}}"
   - ...continúa construyendo...
5. Vista previa actualiza en tiempo real
6. Admin: Click "Guardar como Template" → Modal pide nombre
7. Confirma → Guardado en BD
8. Próxima generación de PDF usa este template

**Escenario 2: Exportar para revisar**
1. Admin click "Exportar HTML"
2. Descarga `recibo_template_YYYYMMDD.html`
3. Abre en navegador para validar
4. Entra nuevamente a designer para ajustar
5. Guarda versión final

---

### 6. Casos de Uso Avanzados

#### **Colspans y Rowspans**
- Seleccionar rango de celdas
- Click "Combinar celdas" → Une y ajusta colspan/rowspan
- Muestra preview del cambio

#### **Cargar Template Anterior**
- Dropdown: "Cargar template..."
- Selecciona uno existente
- Grilla se rellena con su estructura
- Permite editar/mejora y guardar como nuevo

#### **Validación en Vivo**
- Si placeholder no existe → Aviso rojo
- Si tabla está vacía → Botón "Guardar" deshabilitado
- Si hay colspans rotos → Aviso amarillo

---

## Archivos a Crear/Modificar

| Archivo | Cambios | Tipo |
|---------|---------|------|
| `frontend/src/pages/AdminPanel/ReciboDesignerPage.jsx` | CREAR | Component React |
| `frontend/src/stores/reciboDesigner.store.js` | CREAR | Store Zustand |
| `frontend/src/components/ReciboDesigner/` | CREAR | Componentes sub |
| `backend/src/routes/v1.0/admin.routes.js` | MODIFICAR | Agregar endpoints |
| `backend/src/controllers/v1.0/adminController.js` | CREAR/MODIFICAR | Controller |
| `backend/src/models/ReciboTemplate.js` | VERIFICAR | Ya existe |

---

## Estimación de Esfuerzo

| Fase | Tarea | Horas |
|------|-------|-------|
| 1 | Diseño de componentes React + UI | 2 |
| 2 | Implementar tabla interactiva (add/del filas/cols) | 2 |
| 3 | Editor inline de celdas + placeholders | 1.5 |
| 4 | Vista previa HTML viva | 1.5 |
| 5 | Endpoints backend (GET/POST/PUT) | 1.5 |
| 6 | Validación y sanitización | 1 |
| 7 | Testing y ajustes | 1 |
| **TOTAL** | | **~10 horas** |

---

## Criterios de Aceptación

- ✅ Admin accede a `/admin/recibo-designer` desde panel
- ✅ Puede agregar/eliminar filas y columnas visualmente
- ✅ Puede editar contenido de celdas (texto o placeholder)
- ✅ Vista previa muestra HTML renderizado en tiempo real
- ✅ Puede guardar como template en BD
- ✅ Puede exportar HTML a archivo
- ✅ Validación: placeholders no existen → aviso
- ✅ Validación: tabla vacía → botón guardar deshabilitado
- ✅ Seguridad: solo admins pueden acceder
- ✅ Sanitización: XSS bloqueado
- ✅ Template guardado se puede usar en generación de PDF

---

## Mockups

### Vista Principal
```
┌─────────────────────────────────────────────────┐
│ Diseñador de Templates de Recibos               │
├──────────────┬────────────────────────────────┤
│ HERRAMIENTAS │ VISTA PREVIA                   │
│              │                                │
│ + Fila       │ ┌──────────────────────────┐  │
│ - Fila       │ │ PREVISORA DEL NORTE      │  │
│ + Columna    │ │ Recibo Nº 00002          │  │
│ - Columna    │ │                          │  │
│ Limpiar      │ │ MOYANO, INDALECIO        │  │
│              │ │ Nac: 30/11/1967          │  │
│ PLACEHOLDERS │ │ Cob: 01/10/2025          │  │
│ ┌──────────┐ │ │ Doc: 13408381            │  │
│ │ {{numero │ │ │                          │  │
│ │ _recibo} │ │ │ Cuota: $1000.00          │  │
│ │ Copiar   │ │ │ Arancel: $500.00         │  │
│ └──────────┘ │ │ Total: $1500.00          │  │
│              │ │                          │  │
│ EDITOR       │ │ Talón cobrador: ...      │  │
│ ┌──────────┐ │ └──────────────────────────┘  │
│ │Fila1 Col1│ │                                │
│ │[Contenido]│ │ [Guardar] [Exportar] [Copiar] │
│ └──────────┘ │                                │
└──────────────┴────────────────────────────────┘
```

---

## Beneficios

1. **Autonomía:** Admins diseñan templates sin dev
2. **Velocidad:** Cambios en minutos, no horas
3. **Calidad:** HTML limpio y validado
4. **Escalabilidad:** Múltiples templates para diferentes clientes
5. **Mantenibilidad:** Centraliza lógica de diseño en UI

---

## Dependencias

- Requiere: BUG-052 completado (generación de PDF funcional)
- No bloquea: Otros trabajos

---

## Próximos Pasos

1. ✅ Aprobación de diseño
2. Implementación en rama feature/BACKLOG-081
3. Testing exhaustivo
4. Deployment

---

## Estado

- **Registrado:** 2026-05-21
- **Diseño:** ✅ Completado
- **Próximo paso:** Aprobación e implementación
