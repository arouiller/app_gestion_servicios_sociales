# 🎯 PROMPT DE IMPLEMENTACIÓN: BACKLOG-082 - Editor de Templates de Recibos

## CONTEXTO Y OBJETIVO

Estás a cargo de **implementar completamente el BACKLOG-082: Editor Visual de Templates de Recibos**.

**Objetivo final:** Un sistema donde administradores puedan diseñar y personalizar templates de recibos de forma visual, sin intervención técnica.

**Estado:** 
- ✅ Especificación: 100% completa (0 ambigüedades)
- ✅ Arquitectura: 100% compatible con proyecto existente
- ✅ Plan: Detallado por fases
- 🔄 Implementación: **INICIANDO AHORA**

---

## DOCUMENTOS DE REFERENCIA (OBLIGATORIO LEER)

1. **Especificación técnica:** `.claude/diseño-BACKLOG-082.md`
   - Secciones 2.1, 2.2, 2.3: Decisiones críticas (F1-F19)
   - Sección 3-4: Especificación funcional y técnica
   - Criterios de Aceptación: AC1-AC19

2. **Plan de implementación:** `.claude/plan-BACKLOG-082.md`
   - Fases 1-3 con tareas granulares
   - Checklist por fase
   - Commits esperados
   - Workflow y instrucciones

3. **Análisis de compatibilidad:** `.claude/ANALISIS-COMPATIBILIDAD-082.md`
   - Confirma 0 conflictos arquitectónicos
   - Identifica dependencias necesarias
   - Matriz de compatibilidad

4. **CLAUDE.md:** Instrucciones del proyecto
   - Estructura del proyecto
   - Patrones de código
   - Convenciones de commit

---

## INSTRUCCIONES DE TRABAJO

### Rama y Commits

```
✅ Rama de trabajo: V_1.0.7 (rama actual - NO crear rama nueva)
✅ Política de commits: Múltiples commits intermedios (mínimo 15-20)
✅ Formato de commits: feat(BACKLOG-082): descripción específica
✅ Push: 1 ÚNICO push al finalizar TODAS las fases
❌ NO hacer: git push durante desarrollo (solo al final)
```

### Workflow Correcto

```bash
# 1. Verificar rama
git branch  # Debe estar en V_1.0.7
git status  # Debe estar limpio

# 2. Durante desarrollo (por CADA TAREA COMPLETADA)
git add archivo_modificado
git commit -m "feat(BACKLOG-082): descripción específica"
# ⚠️ NO hacer push aquí

# 3. Al terminar TODO (después de Fase 3)
git push origin V_1.0.7  # ← ÚNICO push

# 4. Opcional: Crear PR
# gh pr create --title "BACKLOG-082: ..." --body "..."
```

---

## FASES A IMPLEMENTAR (10-13 días)

### FASE 1: BACKEND (2-3 días) - Tareas 1-5

#### Tarea 1.1: Migración de Base de Datos
**Archivo:** `backend/src/migrations/versions/2.0.34_recibo_templates/`

**Qué hacer:**
- [ ] Crear carpeta `2.0.34_recibo_templates`
- [ ] Crear `upgrade.sql` con tabla `recibo_templates`
  - Columnas: id (UUID, PK), nombre (VARCHAR 100), descripcion (TEXT)
  - JSON fields: bloque_encabezado, bloque_afiliado, bloque_detalles, bloque_pie, bloque_pageconfig
  - Metadata: activo (BOOLEAN DEFAULT FALSE), usuario_id (INT FK), created_at, updated_at
  - Constraints: UNIQUE activo, FOREIGN KEY usuario_id
  - Insert template por defecto (JSON predefinido en especificación)
- [ ] Crear `downgrade.sql` con DROP TABLE
- [ ] Verificar: `npm run db:migrate:up` ejecuta sin errores
- [ ] Verificar: `npm run db:migrate:down` revierte sin errores

**Commit:** `feat(BACKLOG-082): crear migración BD tabla recibo_templates`

**Referencias:**
- Especificación sección 7: Migraciones de Base de Datos
- Estructura JSON en sección 4.1: bloque_encabezado, bloque_afiliado, bloque_detalles, bloque_pie, bloque_pageconfig
- Datos ficticios predefinidos en sección 2.1, F1

---

#### Tarea 1.2: Modelo Sequelize
**Archivo:** `backend/src/models/ReciboTemplate.js`

**Qué hacer:**
- [ ] Crear modelo con campos exactos (ver especificación 4.1)
- [ ] Validaciones:
  - nombre: no vacío, max 100 chars
  - bloque_pageconfig: obligatorio (error 400 si falta)
- [ ] Asociaciones:
  - belongsTo Usuario (usuario_id)
  - Incluir usuario al fetchear
- [ ] Agregar modelo a `models/index.js` (exportar)

**Validaciones especiales (sección 5.1):**
- Bloque 5 obligatorio al guardar
- Placeholders deben estar en lista autorizada
- Márgenes: validar fórmula (sección 2.2, Gap 9)

**Commit:** `feat(BACKLOG-082): crear modelo ReciboTemplate`

---

#### Tarea 1.3: Controller - Endpoints CRUD
**Archivo:** `backend/src/controllers/recibosTemplatesController.js`

**Endpoints a implementar:**

1. **GET /api/admin/recibos/templates**
   - Listar todos templates
   - Include usuario creador
   - Response: { success, data: [templates], count }

2. **GET /api/admin/recibos/templates/:id**
   - Template específico con JSON completo
   - Response: { success, data: template }

3. **POST /api/admin/recibos/templates**
   - Crear template
   - Validaciones:
     - nombre obligatorio
     - Bloque 5 obligatorio (sección 2.2, Gap 6: solo Bloque 5 required, 1-4 opcionales)
     - Max 5 templates (advertencia a partir de 4)
     - usuario_id desde JWT
   - Response: { success, templateId, message }

4. **PUT /api/admin/recibos/templates/:id**
   - Actualizar template
   - Validar Bloque 5 completo
   - usuario_id NO cambia (creador inmutable)
   - Response: { success, message }

5. **PATCH /api/admin/recibos/templates/:id/activar**
   - Activar template
   - Desactivar anterior (constraint UNIQUE activo)
   - Validar: no está eliminado
   - Response: { success, message, activo }

6. **DELETE /api/admin/recibos/templates/:id**
   - Eliminar template
   - Validar: no puede ser activo (error 400)
   - Response: { success, message }

7. **POST /api/admin/recibos/templates/:id/duplicar**
   - Duplicar template con nombre "Copia - {nombre}"
   - Parámetro opcional: nombre_copia custom
   - Response: { success, templateId, nombre }

8. **GET /api/admin/recibos/placeholders**
   - Listar todos placeholders disponibles
   - Categorizado: afiliado, monetarios, metadata, empresa
   - Response: { success, placeholders: { afiliado: [], ... } }

**Commits:**
- `feat(BACKLOG-082): implementar endpoints GET/POST/PUT templates`
- `feat(BACKLOG-082): implementar endpoints activar/duplicar/eliminar`

**Referencias especificación:**
- Sección 4.2: Endpoints REST detallados
- Sección 2.2: Validaciones (Gap 1, 6, 8)
- Sección 3.6: Placeholders disponibles

---

#### Tarea 1.4: Controller - Generación de PDF
**Archivo:** `backend/src/controllers/recibosTemplatesController.js` (método `generatePdf`)

**Endpoint:** `POST /api/admin/recibos/templates/:templateId/generar-pdf`

**Qué hacer:**
- [ ] Implementar método generatePdf con:
  - Body: `{ persona_id: 123 }` OR `{ usar_datos_ficticios: true }`
  - Validaciones:
    - Template completo (todos bloques presentes)
    - Bloque 5 obligatorio (error 400 si falta)
    - persona_id debe existir en BD (si se proporciona)
    - Timeout máximo 30 segundos
    - Fallback a datos ficticios si persona_id inválido
  - Serialización JSON → HTML (función serializeTemplate)
  - Reemplazo de placeholders:
    - Multiplicadores: {{numero_afiliado}}, {{titular_nombre}}, etc.
    - Monetarios formateados: {{valor_cuota}} → $250.50
    - Si placeholder no existe: dejar literal (sección 2.2, Gap 10)
  - Puppeteer: renderizar HTML → PDF binario
  - Response: Binario application/pdf (NO base64)
  - Rate limit: 10 PDFs/minuto por usuario (429 con retry_after)

**Función serializeTemplate:**
- Convertir JSON bloques → HTML
- Aplicar estilos CSS desde JSON
- Insertar datos de persona
- Reemplazar placeholders
- Cálculos de grilla automática (sección 2.2, Gap 5)

**Commit:** `feat(BACKLOG-082): implementar endpoint generar-pdf con Puppeteer`

**Referencias especificación:**
- Sección 4.2: Endpoint /generar-pdf
- Sección 6.5: Generación PDF In Situ
- Sección 6.2: Serialización JSON → HTML
- Sección 2.1, F1: Datos ficticios predefinidos

---

#### Tarea 1.5: Rutas en admin.js
**Archivo:** `backend/src/routes/admin.js`

**Qué hacer:**
- [ ] Agregar rutas templates al final (línea 209)
- [ ] Usar lazy loading pattern (como provincias/localidades)
- [ ] Proteger con verifyToken + requireAdmin
- [ ] Rate limiter SOLO para /generar-pdf (10 PDFs/minuto)

**Rutas a agregar:**
```
GET    /recibos/templates
POST   /recibos/templates
GET    /recibos/templates/:id
PUT    /recibos/templates/:id
PATCH  /recibos/templates/:id/activar
DELETE /recibos/templates/:id
POST   /recibos/templates/:id/duplicar
GET    /recibos/placeholders
POST   /recibos/templates/:templateId/generar-pdf
```

**Commit:** `feat(BACKLOG-082): agregar rutas templates en admin.js`

---

### FASE 2: FRONTEND (5-6 días) - Tareas 6-15

#### Tarea 2.1: Instalar Dependencias
**Archivo:** `frontend/package.json`

**Qué hacer:**
- [ ] npm install zustand
- [ ] npm install react-beautiful-dnd
- [ ] npm install --save-dev @types/react-beautiful-dnd (si TypeScript)
- [ ] Verificar npm install sin errores

**Commit:** `chore(BACKLOG-082): agregar dependencias zustand react-beautiful-dnd`

---

#### Tarea 2.2: Zustand Store
**Archivo:** `frontend/src/hooks/useTemplateStore.js`

**Qué hacer:**
- [ ] Crear store con estado:
  - currentTemplate (objeto completo con bloques)
  - editingBlock (string o null)
  - isDirty (boolean)
  - isSaving (boolean)
  - previewAfiliado (objeto persona)
  - templates (array)
  - loading (boolean)
  - error (string)
- [ ] Acciones (métodos):
  - updateBloque(bloqueKey, updates) - actualiza bloque específico
  - updateTemplate(updates) - actualiza template
  - setCurrentTemplate(template) - carga template
  - setPreviewAfiliado(persona) - cambia afiliado preview
  - resetTemplate() - vacía template actual
- [ ] Debounce 300ms en cambios (para preview)
- [ ] Integración con onChange handlers de componentes

**Commit:** `feat(BACKLOG-082): crear Zustand store useTemplateStore`

**Referencias especificación:**
- Sección 2.2, F12: Preview Auto-Update con Zustand
- Sección 4.4: Estructura del store

---

#### Tarea 2.3: RecibosTemplatesPage (Listado)
**Archivo:** `frontend/src/pages/AdminPanel/RecibosTemplatesPage.jsx`

**Qué hacer:**
- [ ] Página principal con:
  - Header: "Templates de Recibos"
  - Botón "+ Nuevo Template" (abre modal crear)
  - Botón "🔄 Actualizar" (recarga tabla)
  - Tabla de templates:
    - Columnas: Nombre, Estado (badge activo/inactivo), Creado (fecha + usuario), Última Edición (fecha + usuario), Acciones
    - Acciones: [Editar], [Activar], [Duplicar], [Eliminar]
- [ ] Cargar templates en useEffect
- [ ] Modal crear template (nombre + descripción)
- [ ] Confirmaciones antes de activar/eliminar
- [ ] Manejo de errores con toasts
- [ ] Loading spinner mientras carga

**Commit:** `feat(BACKLOG-082): crear RecibosTemplatesPage (listado)`

---

#### Tarea 2.4: TemplateEditor (Editor Principal)
**Archivo:** `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx`

**Qué hacer:**
- [ ] Layout dos columnas:
  - Izquierda: Lista de Bloques 1-5
  - Derecha: Preview en tiempo real
- [ ] Header:
  - Nombre template (editable)
  - Badge "ACTIVO" si activo
- [ ] Footer:
  - Botón [Guardar] - valida Bloque 5, POST/PUT
  - Botón [Cancelar] - confirm si isDirty
  - Botón [Ver PDF] - abre preview PDF
  - Botón [Descargar PDF] - descarga binario
- [ ] Mostrar Bloques 1-5:
  - Colapsibles (1-4), expandibles por defecto
  - Bloque 5 inline (sin modal)
  - Botones [Editar] [Copiar] [Eliminar] (NO para Bloque 5)
- [ ] Modal confirmación si hay cambios sin guardar
- [ ] Modal confirmación si genera PDF con cambios sin guardar (3 opciones: Guardar y Generar, Generar Solo, Cancelar)

**Commits:**
- `feat(BACKLOG-082): crear TemplateEditor layout principal`
- `feat(BACKLOG-082): agregar modales y footer funcionalidad`

---

#### Tarea 2.5: Componentes Bloques 1-4
**Archivos:**
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloqueEncabezado.jsx`
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloqueAfiliado.jsx`
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloqueDetalles.jsx`
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloquePie.jsx`

**Qué hacer para CADA Bloque:**

**BloqueEncabezado:**
- [ ] Campos: logo_url, empresa_nombre, empresa_direccion, empresa_telefono, empresa_email, empresa_sitio
- [ ] Modal [Editar] con:
  - Inputs para campos
  - Panel estilos (font, size, color, align, bg, padding)
  - Panel layout (ancho, alto, margen sup/inf)
- [ ] Cambios reflejan en preview (debounce 300ms)

**BloqueAfiliado:**
- [ ] Mostrar filas predefinidas (editables, activables/desactivables)
- [ ] Drag & drop para reordenar (react-beautiful-dnd)
- [ ] Modal [Editar] con:
  - Filas: checkbox visible, etiqueta, placeholder (dropdown)
  - Panel estilos (font, size, color, bordes, align, padding)
  - Panel layout (ancho, alto, márgenes)
- [ ] Cambios reflejan en preview

**BloqueDetalles:**
- [ ] Mostrar tabla predefinida (Cuota, Arancel, TOTAL)
- [ ] Modal [Editar] con:
  - Selector preset (simple/detallado)
  - Filas editables (etiqueta + placeholder)
  - Fila total siempre visible
  - Panel estilos (font, size, color, bordes, header bg, padding)
  - Panel layout (ancho, alto, márgenes)
- [ ] Cambios reflejan en preview

**BloquePie:**
- [ ] Campos: aclaracion, texto_legal, fecha_formato (select), mostrar_linea_firma (checkbox), referencia
- [ ] Modal [Editar] con:
  - Inputs/textareas para campos
  - Panel estilos (font, size, color, align, padding)
  - Panel layout (ancho, alto, márgenes)
- [ ] Cambios reflejan en preview

**Cambios comunes a todos:**
- Actualizar Zustand store al modificar
- Debounce 300ms para preview
- Validaciones de campos (max chars si aplica)
- Error handling en inputs

**Commits:**
- `feat(BACKLOG-082): crear componentes BloqueEncabezado y BloqueAfiliado`
- `feat(BACKLOG-082): crear componentes BloqueDetalles y BloquePie`

**Referencias especificación:**
- Sección 3.4: Bloques Principales (detalle de campos)
- Sección 3.5: Panel de Edición de Bloque (Modal)
- Sección 2.2, Gap 1, 8: Sin límites de caracteres

---

#### Tarea 2.6: Componente BloquePageConfig
**Archivo:** `frontend/src/pages/AdminPanel/components/BlockEditor/BloquePageConfig.jsx`

**Qué hacer:**
- [ ] Componente inline colapsible (NO modal como otros)
- [ ] Campos:
  - Tamaño página: dropdown (A4, A5, Letter, Personalizado)
    - Si personalizado: inputs ancho (100-300mm) y alto (100-400mm) con validación
  - Orientación: radio buttons (portrait, landscape)
  - Márgenes: inputs (5-50mm c/u): superior, derecho, inferior, izquierdo
    - Validar: (sup + inf) ≤ alto_pagina AND (izq + der) ≤ ancho_pagina
  - Recibos por página: dropdown (1, 2, 3, 4, 6, 8)
  - Layout: radio buttons (vertical, grilla)
    - Mostrar selector columnas SOLO si grilla y ≥4 recibos
  - Espaciado: inputs (5-20mm c/u) gap_vertical, gap_horizontal
    - Mostrar SOLO si >1 recibo/página
- [ ] Validaciones:
  - Tamaño personalizado en rango
  - Márgenes no exceden página
  - Gap válido (5-20mm)
- [ ] Cambios recalculan preview automáticamente (debounce 300ms)
- [ ] Algoritmo grilla:
  - filas = Math.ceil(recibos_por_pagina / columnas)
  - Mostrar resultado "Grilla 2×3" visualmente

**Commit:** `feat(BACKLOG-082): crear componente BloquePageConfig`

**Referencias especificación:**
- Sección 3.4: Bloque 5 Configuración de Página
- Sección 2.2, Gap 5: Recalculación grilla automática
- Sección 2.2, Gap 9: Validación márgenes fórmula exacta

---

#### Tarea 2.7: TemplatePreview (Panel derecha)
**Archivo:** `frontend/src/pages/AdminPanel/components/TemplatePreview.jsx`

**Qué hacer:**
- [ ] Mostrar template renderizado con datos reales/ficticios
- [ ] Selector "Afiliado de Ejemplo": dropdown con afiliados (GET /api/personas)
  - Error handling: si API falla → Toast amarillo "Error cargando afiliados. Usando datos de ejemplo." + fallback automático
  - Sin afiliados en BD: mostrar badge gris "Usando datos de ejemplo (no hay afiliados reales)"
- [ ] Renderizar template:
  - Todos los bloques con datos actuales
  - Si múltiples recibos/página: datos se repiten
  - Márgenes visibles (líneas punteadas)
  - Respeta layout grilla
- [ ] Botones:
  - [Ver PDF] - POST /generar-pdf, abre en ventana nueva
  - [Descargar PDF] - POST /generar-pdf, descarga binario
- [ ] Spinner durante generación de PDF
- [ ] Error handling si generación falla
- [ ] Debounce 300ms: actualiza cuando Zustand cambia

**Commit:** `feat(BACKLOG-082): crear componente TemplatePreview`

**Referencias especificación:**
- Sección 3.5.1: Preview en Vivo
- Sección 2.1, F1: Datos ficticios predefinidos
- Sección 2.2, Gap 4: Error handling afiliados graceful

---

#### Tarea 2.8: PlaceholderSelector
**Archivo:** `frontend/src/pages/AdminPanel/components/PlaceholderSelector.jsx`

**Qué hacer:**
- [ ] Componente reutilizable:
  - Botón "+" junto a cada input de texto
  - Click abre dropdown categorizado
- [ ] Categorías (sección 3.6):
  - Afiliado: {{numero_afiliado}}, {{titular_nombre}}, etc.
  - Monetarios: {{valor_cuota}}, {{cuota_social}}, {{arancel_por_servicio}}
  - Metadata: {{numero_recibo}}, {{periodo}}, {{fecha_generacion}}
  - Empresa: {{empresa_nombre}}, {{empresa_telefono}}, etc.
- [ ] Click en placeholder: inserta en posición del cursor (usando textareaRef)
- [ ] Solo placeholders autorizados (validar contra API /placeholders)
- [ ] NO permitir input libre de placeholders

**Commit:** `feat(BACKLOG-082): crear componente PlaceholderSelector`

**Referencias especificación:**
- Sección 3.6: Placeholders Disponibles
- Sección 2.2, Gap 1: Múltiples placeholders sin límite

---

#### Tarea 2.9: AfililadoSelector
**Archivo:** `frontend/src/pages/AdminPanel/components/AfililadoSelector.jsx`

**Qué hacer:**
- [ ] Componente reutilizable:
  - Dropdown que carga GET /api/personas
  - Mostrar: numero_afiliado - titular_nombre
  - Al seleccionar: actualiza previewAfiliado en Zustand
- [ ] Error handling:
  - Si API falla: Toast amarillo + setPreviewAfiliado(null) → fallback a ficticios
  - Si sin afiliados: mostrar mensaje "No hay afiliados en el sistema"
- [ ] Loading state mientras carga lista

**Commit:** `feat(BACKLOG-082): crear componente AfililadoSelector`

**Referencias especificación:**
- Sección 2.2, Gap 4: Error handling afiliados
- Sección 3.5.1: Selector afiliados

---

#### Tarea 2.10: templateService.js
**Archivo:** `frontend/src/services/templateService.js`

**Qué hacer:**
- [ ] Métodos API:
  - getTemplates() - GET /api/admin/recibos/templates
  - getTemplate(id) - GET /api/admin/recibos/templates/:id
  - createTemplate(data) - POST /api/admin/recibos/templates
  - updateTemplate(id, data) - PUT /api/admin/recibos/templates/:id
  - activateTemplate(id) - PATCH /api/admin/recibos/templates/:id/activar
  - deleteTemplate(id) - DELETE /api/admin/recibos/templates/:id
  - duplicateTemplate(id, nombre) - POST /api/admin/recibos/templates/:id/duplicar
  - getPlaceholders() - GET /api/admin/recibos/placeholders
  - generatePdf(templateId, personaId) - POST /api/admin/recibos/templates/:id/generar-pdf (devuelve blob)
- [ ] Error handling con try/catch
- [ ] Retornar { success, data, message }
- [ ] Manejo de blobs para PDF (fetch con responseType: blob)

**Commit:** `feat(BACKLOG-082): crear templateService con métodos API`

---

#### Tarea 2.11: Estilos SCSS
**Archivo:** `frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss`

**Qué hacer:**
- [ ] Crear estilos para:
  - RecibosTemplatesPage (layout general)
  - TemplatesList (tabla con header/footer)
  - TemplateEditor (dos columnas izq/der)
  - Bloques colapsibles (expand/collapse animation)
  - BlockEditor modal (estilos inputs, color pickers)
  - TemplatePreview (derecha, PDF preview visual)
  - Buttons, badges, inputs, textareas
  - Responsive (min 1400px para dos columnas)
- [ ] Usar variables SCSS existentes (_colors.scss)
- [ ] Paleta: azul (primary), gris (neutral), rojo (error), amarillo (warning), verde (success)

**Commit:** `feat(BACKLOG-082): agregar estilos RecibosTemplatesPage.scss`

---

#### Tarea 2.12: Integración en Menú
**Archivo:** `frontend/src/pages/DashboardPage/components/Sidebar.jsx`

**Qué hacer:**
- [ ] Agregar opción en menú "Administración":
  - Nombre: "Templates de Recibos"
  - URL: `/admin/recibos/templates`
  - Icono: 📋 o similar
- [ ] Solo visible si usuario es admin (verificar role)
- [ ] Link con React Router

**Commit:** `feat(BACKLOG-082): agregar Templates de Recibos al menú admin`

---

### FASE 3: TESTING E INTEGRACIÓN (3-4 días) - Tareas 16-20

#### Tarea 3.1: Tests Backend
**Archivos:** `backend/src/controllers/__tests__/recibosTemplatesController.test.js`

**Qué hacer:**
- [ ] Tests para controller (usando Jest):
  - Crear template con validaciones
  - Obtener templates (listar)
  - Actualizar template (no cambiar usuario_id)
  - Activar template (desactivar anterior)
  - Eliminar template (validar no activo)
  - Rate limit /generar-pdf (429)
  - Error si Bloque 5 incompleto
- [ ] Tests para migración:
  - Migrate up: tabla creada correctamente
  - Migrate down: tabla eliminada
- [ ] Coverage: mínimo 80%

**Commit:** `test(BACKLOG-082): agregar tests recibosTemplatesController`

---

#### Tarea 3.2: Tests Frontend
**Archivos:** `frontend/src/pages/AdminPanel/__tests__/*.test.jsx`

**Qué hacer:**
- [ ] Tests para componentes (usando React Testing Library):
  - TemplatesList renderiza tabla
  - TemplateEditor guarda cambios
  - Bloques 1-5 actualizan preview
  - PlaceholderSelector inserta placeholders
  - Validaciones Bloque 5 obligatorio
  - Error handling afiliados
- [ ] Tests para Zustand store:
  - updateBloque actualiza estado
  - isDirty se marca correctly
- [ ] Tests de integración:
  - Crear template → guardar → listar
  - Editar template → preview actualiza

**Commit:** `test(BACKLOG-082): agregar tests componentes frontend`

---

#### Tarea 3.3: Integración con GenerarRecibos
**Verificación en:** `frontend/src/pages/DashboardPage/components/GenerarRecibosModal.jsx`

**Qué hacer:**
- [ ] Verificar que GenerarRecibosModal:
  - Obtiene template activo (GET /api/admin/recibos/templates?activo=true)
  - Renderiza PDF con datos reales
  - Genera recibos usando template
- [ ] Verificar flujo end-to-end:
  - Admin crea template
  - Activa template
  - Genera recibos → usa template activo
  - PDF se renderiza con template

**Commit:** `feat(BACKLOG-082): verificar integración con GenerarRecibosModal`

---

#### Tarea 3.4: Validaciones y Edge Cases
**Verificar en:** Componentes + Controller

**Qué hacer:**
- [ ] Validar:
  - ✅ Bloque 5 obligatorio (no permitir guardar sin)
  - ✅ Bloques 1-4 opcionales (pueden estar vacíos)
  - ✅ Múltiples placeholders en campo (sin límite)
  - ✅ Sin límites de caracteres (cualquier longitud)
  - ✅ Error cargando afiliados → graceful degradation (Toast + ficticios)
  - ✅ Edición concurrente → last-write-wins (última guardada gana)
  - ✅ Multi-pestaña → sin sincronización Zustand (cada pestaña independiente)
  - ✅ Rate limit PDF → 10/minuto (429 con retry_after)
  - ✅ Recalculación grilla automática (debounce 300ms)
  - ✅ Template vacío (solo Bloque 5, resto vacío)
  - ✅ PDF timeout → max 30 segundos
  - ✅ Placeholders no encontrados → dejar literal en PDF
- [ ] Testing en navegadores reales (Chrome, Firefox)

**Commit:** `feat(BACKLOG-082): validar edge cases y comportamientos especiales`

---

#### Tarea 3.5: Verificación Final
**Checklist final antes de push:**

- [ ] Lint sin errores: `npm run lint` (backend y frontend)
- [ ] Tests pasando: `npm test` (backend y frontend)
- [ ] Especificación 100% implementada (AC1-AC19 todos cumplidos)
- [ ] Migración corre: `npm run db:migrate:up` y `npm run db:migrate:down`
- [ ] No hay errores en consola (dev tools)
- [ ] Rama `V_1.0.7` limpia (git status limpio)
- [ ] Commits bien nombrados (feat(BACKLOG-082): ...)
- [ ] Mínimo 15-20 commits realizados
- [ ] Documentación actualizada (si necesario)

**Commit final:** `chore(BACKLOG-082): ajustes finales y verificaciones`

---

## CRITERIOS DE ACEPTACIÓN (AC1-AC19)

Antes de finalizar, verificar que TODOS se cumplan:

- [ ] **AC1:** Crear Template (modal, nombre obligatorio, Bloque 5 obligatorio)
- [ ] **AC2:** Editar Template (cambios en preview vivo, debounce 300ms)
- [ ] **AC3:** Preview Afiliados (selector, fallback ficticios, múltiples recibos)
- [ ] **AC4:** Bloque 5 (tamaño, orientación, márgenes, recibos/página, layout, espaciado)
- [ ] **AC5:** Placeholders (botón insertar, dropdown categorizado, validados)
- [ ] **AC6:** Validación al Guardar (Bloque 5 completo, márgenes válidos, campos obligatorios)
- [ ] **AC7:** Activar Template (confirmación, solo uno activo, badge visual)
- [ ] **AC8:** Generación PDF (respeta template, márgenes, orientación, distribución)
- [ ] **AC9:** PDF In Situ (endpoint /generar-pdf, timeout 30s, rate limit 10/min)
- [ ] **AC10:** Validación Bloque 5 en PDF (error 400 si incompleto)
- [ ] **AC11:** Guardar vs Generar PDF (modal confirmación, 3 opciones)
- [ ] **AC12:** Concurrencia (last-write-wins, updated_at timestamp)
- [ ] **AC13:** Multi-Pestaña (sin sincronización, cada pestaña independiente)
- [ ] **AC14:** Rate Limit PDF (10/minuto por usuario, 429 respuesta)
- [ ] **AC15:** Bloques 1-4 Opcionales (permitir template vacío si Bloque 5 completo)
- [ ] **AC16:** Sin Límites Caracteres (cualquier longitud aceptada)
- [ ] **AC17:** Placeholders Sin Límite (múltiples por campo, sin restricción)
- [ ] **AC18:** Error Afiliados (graceful degradation, Toast + ficticios)
- [ ] **AC19:** Grilla Automática (recalcula debounce 300ms, no requiere botón)

---

## NOTAS IMPORTANTES

### ❌ NO HACER:

- ❌ No crear rama nueva (usar V_1.0.7 actual)
- ❌ No hacer push durante desarrollo (esperar a terminar TODO)
- ❌ No modificar código no relacionado con BACKLOG-082
- ❌ No cambiar migraciones previas (2.0.x anteriores)
- ❌ No modificar modelos existentes (Recibo, Persona, etc.)
- ❌ No eliminar código v1.0 (mantener legado)
- ❌ No usar limit de caracteres en campos (especificación: sin límites)

### ✅ SÍ HACER:

- ✅ Hacer múltiples commits intermedios (15-20 mínimo)
- ✅ Usar formato: feat(BACKLOG-082): descripción
- ✅ Leer especificación y plan antes de empezar
- ✅ Validar criterios de aceptación (AC1-AC19)
- ✅ Testing en todo lo posible
- ✅ Error handling graceful
- ✅ Usar estilos SCSS existentes
- ✅ Seguir patrones de código del proyecto
- ✅ 1 ÚNICO push al finalizar TODO

---

## INFORMACIÓN DE CONTACTO / SOPORTE

Si necesitas:
- **Aclaración de especificación:** Ver `.claude/diseño-BACKLOG-082.md` (secciones 2.1, 2.2, 2.3)
- **Detalles de implementación:** Ver `.claude/plan-BACKLOG-082.md`
- **Arquitectura existente:** Ver `CLAUDE.md`
- **Referencia de código:** Ver `backend/src/controllers/planesController.js` para patrón MVC

---

## TIMELINE ESTIMADO

```
Día 1-3:   FASE 1 Backend (migración, modelo, controller, rutas)
Día 4-9:   FASE 2 Frontend (zustand, componentes, services, estilos)
Día 10-13: FASE 3 Testing + integración + verificación final
```

**Meta:** Completar TODO en 10-13 días (máximo 2 semanas)

---

## ESTADO INICIAL

**Rama:** V_1.0.7 ✅  
**Especificación:** 100% completa ✅  
**Plan:** Detallado y listo ✅  
**Dependencias:** Identificadas ✅  
**Arquitectura:** Validada compatible ✅  

**Status:** 🚀 **LISTO PARA COMENZAR**

---

**Generado:** 2026-06-12  
**Para:** Agente de Implementación BACKLOG-082  
**Referencia:** `.claude/plan-BACKLOG-082.md` + `.claude/diseño-BACKLOG-082.md`
