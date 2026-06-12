# Plan de Implementación: BACKLOG-082 - Editor de Templates de Recibos

**Fecha:** 2026-06-12  
**Rama:** `V_1.0.7` (rama actual)  
**Especificación:** `.claude/diseño-BACKLOG-082.md`  
**Estado:** ✅ **LISTA PARA IMPLEMENTACIÓN**

---

## 1. Análisis de Compatibilidad Arquitectónica

### 1.1 Arquitectura Existente ✅

| Componente | Estado | Compatibilidad |
|-----------|--------|----------------|
| **Backend MVC** | ✅ Express.js + Sequelize | Perfecto para nuevos endpoints |
| **Admin Routes** | ✅ Existe `admin.js` | Agregar subrutas de templates |
| **Middleware Auth** | ✅ verifyToken + requireAdmin | Exactamente lo que necesita |
| **Models Recibos** | ✅ Recibo.js, ReciboIntegrante.js | Base existente para integración |
| **Frontend Structure** | ✅ Pages + Components | Crear RecibosTemplatesPage |
| **State Management** | ⚠️ AuthContext + necesitamos Zustand | Zustand para template editor |
| **Services Pattern** | ✅ Existe patrón services/ | Crear templateService.js |
| **Styling** | ✅ SCSS + variables | Coherente con proyecto |

### 1.2 Impacto en Arquitectura Existente

**Sin cambios destructivos:**
- ✅ No modifica migraciones existentes (nueva migración 2.0.34)
- ✅ No afecta modelos existentes (nuevo modelo ReciboTemplate)
- ✅ No interfiere con RecibosPage (complementario)
- ✅ No rompe autenticación (usa middleware existente)

**Nuevos componentes:**
- ✅ Nueva ruta: `/api/admin/recibos/templates/*`
- ✅ Nuevo modelo: ReciboTemplate
- ✅ Nuevo controller: recibosTemplatesController.js
- ✅ Nueva página: RecibosTemplatesPage
- ✅ Nueva librería: Zustand (para estado editor)

### 1.3 Conclusión: ✅ **PERFECTAMENTE COMPATIBLE**

El requerimiento se adapta sin conflictos a la arquitectura existente. Es una extensión natural del sistema de recibos.

---

## 2. Estructura de Trabajo

### 2.1 Rama y Commits

- **Rama de trabajo:** `V_1.0.7` (rama actual - NO crear rama nueva)
- **Política de commits:** Múltiples commits intermedios, **1 único push al final**
- **Formato de commits:** `feat(BACKLOG-082): descripción` o `refactor(BACKLOG-082):`

### 2.2 Fases de Desarrollo

```
┌─ FASE 1: Backend (2-3 días)
│  ├─ Migración BD (2.0.34_recibo_templates)
│  ├─ Modelo ReciboTemplate
│  ├─ Controller recibosTemplatesController
│  └─ Rutas en admin.js
│
├─ FASE 2: Frontend (5-6 días)
│  ├─ Componentes editor (Bloques 1-5)
│  ├─ Zustand store
│  ├─ RecibosTemplatesPage
│  └─ Services
│
└─ FASE 3: Testing & Integración (3-4 días)
   ├─ Tests unitarios
   ├─ Prueba end-to-end
   └─ Integración con GenerarRecibos
```

---

## 3. FASE 1: BACKEND (2-3 días)

### 3.1 Migración de Base de Datos

**Archivo:** `backend/src/migrations/versions/2.0.34_recibo_templates/upgrade.sql`

**Tareas:**
- [ ] Crear carpeta `2.0.34_recibo_templates`
- [ ] Crear `upgrade.sql` con tabla `recibo_templates`
  - Columnas: id, nombre, descripcion, bloque_encabezado, bloque_afiliado, bloque_detalles, bloque_pie, bloque_pageconfig (JSON)
  - Metadata: activo (BOOLEAN), usuario_id (FK), created_at, updated_at
  - Constraint: UNIQUE activo (solo un template activo)
  - Template por defecto insertado
- [ ] Crear `downgrade.sql` (DROP TABLE)
- [ ] Ejecutar migración: `npm run db:migrate:up`

**Commit:** `feat(BACKLOG-082): crear migración BD tabla recibo_templates`

---

### 3.2 Modelo Sequelize

**Archivo:** `backend/src/models/ReciboTemplate.js`

**Tareas:**
- [ ] Crear modelo con campos:
  - `id` (UUID, PK)
  - `nombre` (VARCHAR 100, NOT NULL)
  - `descripcion` (TEXT)
  - `bloque_encabezado` (JSON)
  - `bloque_afiliado` (JSON)
  - `bloque_detalles` (JSON)
  - `bloque_pie` (JSON)
  - `bloque_pageconfig` (JSON, NOT NULL)
  - `activo` (BOOLEAN, DEFAULT FALSE)
  - `usuario_id` (INT, FK -> Usuario)
  - Timestamps
- [ ] Asociación con Usuario (belongsTo)
- [ ] Validaciones básicas

**Commit:** `feat(BACKLOG-082): crear modelo ReciboTemplate`

---

### 3.3 Controller: recibosTemplatesController.js

**Archivo:** `backend/src/controllers/recibosTemplatesController.js`

**Endpoints a implementar:**

#### GET /api/admin/recibos/templates
- [ ] Listar todos templates
- [ ] Incluir usuario creador
- [ ] Response: { success, data: [templates], count }

#### GET /api/admin/recibos/templates/:id
- [ ] Obtener template específico
- [ ] Incluir estructura JSON completa
- [ ] Validar que usuario sea admin

#### POST /api/admin/recibos/templates
- [ ] Crear template
- [ ] Validaciones:
  - Nombre obligatorio
  - Bloque 5 obligatorio (estructura completa)
  - Max 5 templates por instancia
  - Advertencia si 4+ templates
- [ ] usuario_id desde JWT
- [ ] Response: { success, templateId, message }

#### PUT /api/admin/recibos/templates/:id
- [ ] Actualizar template existente
- [ ] Validar Bloque 5 completo
- [ ] Sin cambio de usuario_id (creador inmutable)

#### PATCH /api/admin/recibos/templates/:id/activar
- [ ] Activar template (desactivar anterior)
- [ ] Validar que no esté eliminado
- [ ] Response: { success, message, activo }

#### DELETE /api/admin/recibos/templates/:id
- [ ] Eliminar template
- [ ] Validar: no puede ser activo
- [ ] Response: { success, message }

#### POST /api/admin/recibos/templates/:id/duplicar
- [ ] Duplicar template con nombre copia
- [ ] Response: { success, templateId, nombre }

#### GET /api/admin/recibos/placeholders
- [ ] Listar placeholders disponibles
- [ ] Response: { success, placeholders: { afiliado, monetarios, metadata, empresa } }

#### POST /api/admin/recibos/templates/:templateId/generar-pdf
- [ ] Generar PDF con datos de persona (o ficticios)
- [ ] Validaciones:
  - Template completo (todos bloques)
  - Bloque 5 obligatorio
  - Rate limit: 10 PDFs/minuto
- [ ] Usar Puppeteer para renderizar PDF
- [ ] Response: Binario PDF (application/pdf)

**Commits:**
- `feat(BACKLOG-082): implementar endpoints GET/POST/PUT templates`
- `feat(BACKLOG-082): implementar endpoints activar/duplicar/eliminar`
- `feat(BACKLOG-082): implementar endpoint generar-pdf con Puppeteer`
- `feat(BACKLOG-082): implementar endpoint placeholders`

---

### 3.4 Rutas en admin.js

**Archivo:** `backend/src/routes/admin.js`

**Tareas:**
- [ ] Agregar rutas de templates al final de admin.js
- [ ] Usar lazy loading pattern (como provincias/localidades)
- [ ] Proteger con verifyToken + requireAdmin
- [ ] Rate limiter solo para /generar-pdf (10 PDFs/minuto)

**Código base:**
```javascript
// Templates de Recibos CRUD
router.get('/recibos/templates', verifyToken, requireAdmin, (req, res, next) => {
  const controller = require('../controllers/recibosTemplatesController');
  controller.list(req, res).catch(next);
});

router.post('/recibos/templates', verifyToken, requireAdmin, (req, res, next) => {
  const controller = require('../controllers/recibosTemplatesController');
  controller.create(req, res).catch(next);
});

// ... más rutas ...

router.post('/recibos/templates/:templateId/generar-pdf', verifyToken, requireAdmin, pdfRateLimiter, (req, res, next) => {
  const controller = require('../controllers/recibosTemplatesController');
  controller.generatePdf(req, res).catch(next);
});
```

**Commit:** `feat(BACKLOG-082): agregar rutas templates en admin.js`

---

## 4. FASE 2: FRONTEND (5-6 días)

### 4.1 Instalación de Dependencias

**Tareas:**
- [ ] `npm install zustand` (state management)
- [ ] `npm install react-beautiful-dnd` (drag & drop)
- [ ] Verificar Puppeteer en backend (ya debe estar)

**Commit:** `chore(BACKLOG-082): agregar dependencias zustand react-beautiful-dnd`

---

### 4.2 Zustand Store

**Archivo:** `frontend/src/hooks/useTemplateStore.js`

**Tareas:**
- [ ] Crear store con:
  - `currentTemplate` (objeto con todos los bloques)
  - `editingBlock` (string o null)
  - `isDirty` (boolean)
  - `isSaving` (boolean)
  - `previewAfiliado` (objeto persona)
  - `templates` (array)
  - `loading` (boolean)
  - `error` (string o null)
- [ ] Acciones:
  - `updateBloque(bloqueKey, updates)`
  - `updateTemplate(updates)`
  - `setCurrentTemplate(template)`
  - `setPreviewAfiliado(persona)`
  - `resetTemplate()`
- [ ] Debounce 300ms en cambios

**Commit:** `feat(BACKLOG-082): crear Zustand store para template editor`

---

### 4.3 Componentes Editor (Bloques 1-5)

**Archivos:**
- `frontend/src/pages/AdminPanel/RecibosTemplatesPage.jsx`
- `frontend/src/pages/AdminPanel/components/TemplatesList.jsx`
- `frontend/src/pages/AdminPanel/components/TemplateEditor.jsx`
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloqueEncabezado.jsx`
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloqueAfiliado.jsx`
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloqueDetalles.jsx`
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloquePie.jsx`
- `frontend/src/pages/AdminPanel/components/BlockEditor/BloquePageConfig.jsx`
- `frontend/src/pages/AdminPanel/components/TemplatePreview.jsx`
- `frontend/src/pages/AdminPanel/components/PlaceholderSelector.jsx`
- `frontend/src/pages/AdminPanel/components/AfililadoSelector.jsx`

**Tareas principales:**

#### RecibosTemplatesPage (Listado)
- [ ] Tabla de templates (nombre, estado, creado, edición, acciones)
- [ ] Botón "Nuevo Template"
- [ ] Acciones: Editar, Activar, Duplicar, Eliminar
- [ ] Cargar templates desde API al montar
- [ ] Confirmación antes de eliminar/activar

**Commit:** `feat(BACKLOG-082): crear RecibosTemplatesPage listado`

#### TemplateEditor (Editor principal)
- [ ] Layout: Bloques (izq) + Preview (der)
- [ ] Header con nombre y estado activo
- [ ] Footer con Guardar, Cancelar, Ver PDF
- [ ] Mostrar Bloques 1-5 (colapsibles)
- [ ] Modal de confirmación si hay cambios sin guardar

**Commit:** `feat(BACKLOG-082): crear TemplateEditor componente principal`

#### Bloques 1-4 (Encabezado, Afiliado, Detalles, Pie)
- [ ] BloqueEncabezado: Logo, empresa, contacto, estilos
- [ ] BloqueAfiliado: Filas editables, drag&drop, estilos
- [ ] BloqueDetalles: Tabla preset/custom, estilos
- [ ] BloquePie: Texto legal, firma, estilos
- [ ] Cada bloque:
  - Campos específicos (inputs, textareas, color pickers)
  - Panel de estilos (fuente, tamaño, color, alineación)
  - Layout (ancho, alto, márgenes)
  - Botones [Editar] abre modal
  - Cambios reflejan en preview 300ms debounce

**Commits:**
- `feat(BACKLOG-082): crear componentes BloqueEncabezado y BloqueAfiliado`
- `feat(BACKLOG-082): crear componentes BloqueDetalles y BloquePie`

#### Bloque 5 (Configuración de Página)
- [ ] Selector de tamaño (A4, A5, Letter, Personalizado)
- [ ] Si personalizado: inputs ancho/alto (100-300mm × 100-400mm)
- [ ] Selector orientación (portrait/landscape)
- [ ] Inputs márgenes (5-50mm c/u)
- [ ] Selector recibos/página (1, 2, 3, 4, 6, 8)
- [ ] Selector layout (vertical, grilla)
- [ ] Si grilla: selector columnas (1-recibos_por_pagina)
- [ ] Inputs gap vertical/horizontal (5-20mm)
- [ ] Validaciones:
  - Márgenes no exceden página
  - Tamaño personalizado en rangos
  - Gap solo visible si >1 recibo
  - Grilla solo visible si ≥4 recibos
- [ ] Cambios recalculan preview automáticamente

**Commit:** `feat(BACKLOG-082): crear componente BloquePageConfig`

#### TemplatePreview (Panel derecha)
- [ ] Mostrar template completo renderizado
- [ ] Dropdown selector de afiliado (cargar desde API)
- [ ] Si no hay afiliados: mostrar badge gris "Usando datos de ejemplo"
- [ ] Si falla API: Toast amarillo + fallback automático
- [ ] Mostrar datos del afiliado (repiten si múltiples recibos)
- [ ] Líneas punteadas para márgenes de página
- [ ] Botones [Ver PDF] y [Descargar PDF]
- [ ] Recalcula cada 300ms (debounce)

**Commit:** `feat(BACKLOG-082): crear componente TemplatePreview`

#### PlaceholderSelector
- [ ] Dropdown categorizado (afiliado, monetarios, metadata, empresa)
- [ ] Botón junto a cada input de texto
- [ ] Click inserta placeholder en posición del cursor
- [ ] Solo placeholders autorizados (no input libre)

**Commit:** `feat(BACKLOG-082): crear componente PlaceholderSelector`

#### AfililadoSelector
- [ ] Dropdown que carga GET /api/personas (afiliados activos)
- [ ] Selección actualiza preview
- [ ] Con error handling (graceful degradation)

**Commit:** `feat(BACKLOG-082): crear componente AfililadoSelector`

---

### 4.4 Service: templateService.js

**Archivo:** `frontend/src/services/templateService.js`

**Tareas:**
- [ ] Métodos:
  - `getTemplates()` - GET /api/admin/recibos/templates
  - `getTemplate(id)` - GET /api/admin/recibos/templates/:id
  - `createTemplate(data)` - POST /api/admin/recibos/templates
  - `updateTemplate(id, data)` - PUT /api/admin/recibos/templates/:id
  - `activateTemplate(id)` - PATCH /api/admin/recibos/templates/:id/activar
  - `deleteTemplate(id)` - DELETE /api/admin/recibos/templates/:id
  - `duplicateTemplate(id, nombre)` - POST /api/admin/recibos/templates/:id/duplicar
  - `getPlaceholders()` - GET /api/admin/recibos/placeholders
  - `generatePdf(templateId, personaId)` - POST /api/admin/recibos/templates/:id/generar-pdf
- [ ] Manejo de errores con try/catch
- [ ] Retornar respuestas en formato { success, data, message }

**Commit:** `feat(BACKLOG-082): crear templateService con métodos API`

---

### 4.5 Estilos

**Archivo:** `frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss`

**Tareas:**
- [ ] Estilos para:
  - RecibosTemplatesPage (layout general)
  - TemplatesList (tabla)
  - TemplateEditor (dos columnas)
  - Bloques (colapsibles)
  - Preview (derecha)
  - Modales
  - Inputs, buttons, badges
- [ ] Variables de color (usar _colors.scss existente)
- [ ] Responsive (min 1400px para layout dos columnas)

**Commit:** `feat(BACKLOG-082): agregar estilos RecibosTemplatesPage`

---

### 4.6 Integración en Menu

**Archivo:** `frontend/src/pages/DashboardPage/components/Sidebar.jsx`

**Tareas:**
- [ ] Agregar opción "Templates de Recibos" en menú Administración
- [ ] URL: `/admin/recibos/templates`
- [ ] Solo visible si usuario es admin

**Commit:** `feat(BACKLOG-082): agregar Templates de Recibos al menú admin`

---

## 5. FASE 3: TESTING E INTEGRACIÓN (3-4 días)

### 5.1 Testing Backend

**Tareas:**
- [ ] Tests para recibosTemplatesController:
  - Crear template (validaciones)
  - Obtener templates
  - Actualizar template (no cambiar usuario_id)
  - Activar template (desactivar anterior)
  - Eliminar template (validar no activo)
  - Rate limit /generar-pdf
- [ ] Tests para migración (up/down)
- [ ] Tests de integración con JWT/admin

**Commits:**
- `test(BACKLOG-082): agregar tests recibosTemplatesController`

---

### 5.2 Testing Frontend

**Tareas:**
- [ ] Tests para Zustand store:
  - updateBloque actualiza estado
  - isDirty se marca correctly
  - Cambios reflejan en preview
- [ ] Tests para componentes:
  - TemplatesList renderiza tabla
  - TemplateEditor guarda cambios
  - PlaceholderSelector inserta placeholders
  - Validaciones de Bloque 5
- [ ] Tests de integración:
  - Crear template → guardar → listar
  - Editar template → preview actualiza
  - Generar PDF (mock)

**Commit:** `test(BACKLOG-082): agregar tests frontend componentes`

---

### 5.3 Integración con GenerarRecibos

**Tareas:**
- [ ] Verificar que GenerarRecibosModal:
  - Obtiene template activo
  - Renderiza con datos reales
  - Genera PDF usando template
- [ ] Verificar flujo end-to-end:
  - Admin crea template
  - Activa template
  - Genera recibos → usa template activo
  - PDF se renderiza con template

**Commit:** `feat(BACKLOG-082): verificar integración con GenerarRecibosModal`

---

### 5.4 Validaciones y Edge Cases

**Tareas:**
- [ ] Validar:
  - Bloque 5 obligatorio (no permitir guardar sin)
  - Template vacío (solo Bloque 5, resto opcional)
  - Múltiples placeholders en campo (sin límite)
  - Error cargando afiliados → graceful degradation
  - Edición concurrente → last-write-wins
  - Multi-pestaña → sin sincronización
  - Rate limit PDF → 429 con retry_after
  - Recalculación grilla automática (debounce 300ms)
- [ ] Testing en navegadores reales

**Commit:** `feat(BACKLOG-082): validar edge cases y comportamientos especiales`

---

## 6. Criterios de Aceptación (AC) a Verificar

- [ ] **AC1-AC9:** Funcionalidades core (crear, editar, preview, PDF, activar, duplicar, eliminar)
- [ ] **AC10-AC14:** Validaciones, concurrencia, rate limit
- [ ] **AC15-AC19:** Bloques opcionales, sin límites, placeholders sin restricción, error handling, grilla automática

---

## 7. Checklist Final

### Antes de hacer push final:

- [ ] Todos los tests pasan (backend y frontend)
- [ ] No hay errores de lint (ESLint + Prettier)
- [ ] Migración corre correctamente (up/down)
- [ ] Especificación `.claude/diseño-BACKLOG-082.md` está 100% implementada
- [ ] Documentación actualizada (README, cambios en CLAUDE.md si necesario)
- [ ] Rama `V_1.0.7` está limpia (todos los commits de BACKLOG-082)
- [ ] Se han hecho múltiples commits intermedios (no un único commit)

### Commits esperados (mínimo 15-20):

**Backend:**
1. Migración BD
2. Modelo ReciboTemplate
3. Controller endpoints (CRUD)
4. Controller PDF
5. Rutas en admin.js

**Frontend:**
6. Zustand store
7. TemplatesList
8. TemplateEditor
9. Bloques 1-4
10. Bloque 5 PageConfig
11. TemplatePreview
12. PlaceholderSelector
13. AfililadoSelector
14. templateService
15. Estilos
16. Integración menú
17. Tests backend
18. Tests frontend
19. Integración GenerarRecibos
20. Validaciones edge cases

---

## 8. Instrucciones Finales

### Workflow:

```bash
# 1. Asegurar estar en rama V_1.0.7
git status
git branch

# 2. Trabajar en Fase 1, 2, 3 con commits intermedios
git add archivo_modificado
git commit -m "feat(BACKLOG-082): descripción específica"

# 3. NO hacer push hasta terminar TODO
git status  # verificar cambios pendientes

# 4. Cuando esté 100% terminado
git push origin V_1.0.7

# 5. Crear PR (opcional): 
# gh pr create --title "BACKLOG-082: Editor de Templates de Recibos" --body "...descripción"
```

### Tiempo Total Estimado:
- **Fase 1:** 2-3 días
- **Fase 2:** 5-6 días
- **Fase 3:** 3-4 días
- **TOTAL:** 10-13 días (~1.5-2 semanas)

---

## 9. Referencias

- **Especificación:** `.claude/diseño-BACKLOG-082.md` (100% completa, 0 ambigüedades)
- **Arquitectura:** `CLAUDE.md`
- **Commit Log:** `git log --oneline V_1.0.7`
- **Models Reference:** `backend/src/models/`
- **Controllers Reference:** `backend/src/controllers/planesController.js`
- **Routes Reference:** `backend/src/routes/admin.js`
- **Frontend Reference:** `frontend/src/pages/RecibosPage/`

---

**Estado:** ✅ **LISTA PARA COMENZAR**  
**Última actualización:** 2026-06-12  
**Responsable:** Implementador BACKLOG-082
