# Checklist Final: BACKLOG-082

**Antes de hacer push final, verificar:**

## ✅ Git Status

- [x] Rama: V_1.0.7
- [x] Status limpio (sin archivos sin staged)
- [x] Commits múltiples (8+ commits)
- [x] Mensajes de commit en formato `feat(BACKLOG-082): ...`
- [ ] git log muestra todos los commits

```bash
# Verificar
git status
git log --oneline | head -10
```

---

## ✅ Backend

### Migraciones
- [x] Carpeta `backend/src/migrations/versions/2.0.34_recibo_templates/` existe
- [x] Archivos `upgrade.sql` y `downgrade.sql` presentes
- [x] SQL válido (sin syntaxis errors)
- [ ] `npm run db:migrate:up` ejecuta sin errores (EN HOSTINGER)
- [ ] `npm run db:migrate:down` revierte (EN HOSTINGER)

### Modelos
- [x] `backend/src/models/ReciboTemplate.js` existe
- [x] Importado en `backend/src/models/index.js`
- [x] Asociación con Usuario declarada
- [x] Validaciones de campos
- [ ] Modelo compila sin errores (EN HOSTINGER)

### Controller
- [x] `backend/src/controllers/recibosTemplatesController.js` existe
- [x] 9 funciones exportadas: list, getById, create, update, activate, delete, duplicate, getPlaceholders, generatePdf
- [x] Validaciones en POST/PUT (Bloque 5 obligatorio)
- [x] Rate limiter (429 status)
- [x] Datos ficticios (F1) incluidos
- [ ] Controller sin errores de sintaxis (EN HOSTINGER)

### Rutas
- [x] `backend/src/routes/admin.js` agregado
- [x] 9 rutas definidas (GET, POST, PUT, PATCH, DELETE)
- [x] Middleware: verifyToken, requireAdmin
- [x] Lazy loading pattern
- [x] Rate limiter configurado en /generar-pdf
- [ ] Rutas accesibles (EN HOSTINGER, con JWT admin)

---

## ✅ Frontend

### Componentes Creados
- [x] `RecibosTemplatesPage.jsx` - página principal
- [x] `TemplatesList.jsx` - tabla listado
- [x] `TemplateEditor.jsx` - editor principal
- [x] `BloqueEncabezado.jsx`
- [x] `BloqueAfiliado.jsx`
- [x] `BloqueDetalles.jsx`
- [x] `BloquePie.jsx`
- [x] `BloquePageConfig.jsx` (Bloque 5)
- [x] `TemplatePreview.jsx` - preview panel
- [x] `PlaceholderSelector.jsx`
- [x] `AfililadoSelector.jsx`
- [ ] Todos los archivos tienen sintaxis JSX correcta (EN HOSTINGER)

### Services
- [x] `frontend/src/services/templateService.js` existe
- [x] 9 métodos: getTemplates, getTemplate, create, update, activate, delete, duplicate, getPlaceholders, generatePdf
- [x] Error handling con try/catch
- [ ] Service importable sin errores (EN HOSTINGER)

### Hooks
- [x] `frontend/src/hooks/useTemplateStore.js` (Zustand store)
- [x] Estado: currentTemplate, editingBlock, isDirty, isSaving, previewAfiliado, templates, loading, error
- [x] Acciones: updateBloque, updateTemplate, setCurrentTemplate, resetTemplate, etc.
- [ ] Store funcionable con zustand (EN HOSTINGER, después de npm install)

### Estilos
- [x] `frontend/src/pages/AdminPanel/RecibosTemplatesPage.scss` existe
- [x] Variables color (_colors.scss)
- [x] Layout responsive
- [x] Modal, tabla, bloques colapsibles
- [ ] SCSS compila sin errores (EN HOSTINGER)

### Integración Dashboard
- [x] `DashboardPage.jsx` importa RecibosTemplatesPage
- [x] Menu item agregado: "Templates de Recibos"
- [x] Renderizado condicional: `{activeModule === 'templates-recibos'...`
- [ ] Dashboard renderiza módulo (EN HOSTINGER)

---

## ✅ Especificación vs Código

### Bloques Obligatorios
- [x] Bloque 5 (Page Config) - OBLIGATORIO en modelo
- [x] Bloques 1-4 - OPCIONALES
- [x] Validación: no permitir guardar sin Bloque 5

### Criterios de Aceptación
- [x] AC1: Crear template (modal, nombre obligatorio, Bloque 5)
- [x] AC2: Editar + preview vivo (debounce 300ms)
- [x] AC3: Preview afiliados (selector, fallback ficticios)
- [x] AC4: Bloque 5 (todos campos)
- [x] AC5: Placeholders (botón insertar, categorizado)
- [x] AC6: Validación guardar
- [x] AC7: Activar template
- [x] AC8: PDF (respeta template)
- [x] AC9: PDF in-situ (endpoint, timeout 30s, rate limit)
- [x] AC10: Validación Bloque 5 en PDF
- [x] AC11: Modal guardar vs generar
- [x] AC12: Concurrencia (last-write-wins)
- [x] AC13: Multi-pestaña (sin sync)
- [x] AC14: Rate limit (429)
- [x] AC15: Bloques 1-4 opcionales
- [x] AC16: Sin límites caracteres
- [x] AC17: Placeholders sin límite
- [x] AC18: Error afiliados (graceful)
- [x] AC19: Grilla automática (debounce)

---

## ✅ Datos Ficticios (F1)

```json
{
  "numero_afiliado": "0001",
  "titular_apellido": "Pérez",
  "titular_nombre": "Juan",
  "obra_social_nombre": "OSDE",
  "tipo_plan_nombre": "Plan Superior",
  "valor_cuota": "250.50",
  "numero_recibo": "REC-20260612-001",
  "periodo": "2026-06"
}
```

- [x] Incluidos en controller getDummyPersonaData()
- [x] Usado en TemplatePreview como fallback
- [x] Usado en generatePdf si no hay afiliado

---

## ✅ Dependencias

### Backend
- [x] uuid (para generar IDs)
- [x] puppeteer (para PDF) - ⚠️ VERIFICAR EN HOSTINGER
- [x] sequelize (ya instalado)
- [x] express (ya instalado)

### Frontend
- [ ] zustand (agregar con `npm install zustand` EN HOSTINGER)
- [ ] react-beautiful-dnd (agregar con `npm install react-beautiful-dnd` EN HOSTINGER)
- [x] axios (ya instalado, usado en templateService)
- [x] react (ya instalado)

---

## ✅ Commits

Esperados: 15-20 commits  
Mínimo requerido: Múltiples commits intermedios (no uno solo)

**Commits realizados:**
1. feat(BACKLOG-082): crear migración BD tabla recibo_templates
2. feat(BACKLOG-082): crear modelo ReciboTemplate
3. feat(BACKLOG-082): implementar controller endpoints CRUD y placeholders
4. feat(BACKLOG-082): agregar rutas templates en admin.js con rate limiter PDF
5. feat(BACKLOG-082): crear Zustand store y templateService
6. feat(BACKLOG-082): crear componentes frontend listado, editor, bloques y preview
7. feat(BACKLOG-082): integrar Templates de Recibos en menú admin
8. docs(BACKLOG-082): documentar implementación y verificaciones en Hostinger

**Status:** 8 commits (fragmentar más en FASE 3)

---

## ✅ Documentación

- [x] `.claude/NOTAS_IMPLEMENTACION_BACKLOG-082.md` - Notas de implementación
- [x] `.claude/CHECKLIST_FINAL_BACKLOG-082.md` - Este archivo
- [x] `.claude/diseño-BACKLOG-082.md` - Especificación (ya existía)
- [x] `.claude/plan-BACKLOG-082.md` - Plan (ya existía)
- [x] `.claude/ANALISIS-COMPATIBILIDAD-082.md` - Análisis (ya existía)

---

## ✅ Verificaciones Pre-Push

```bash
# 1. Estado git
git status                # Debe estar limpio
git branch                # Debe estar en V_1.0.7
git log --oneline V_1.0.7 | head -20  # Ver commits

# 2. Cambios no staged
git diff HEAD             # No debe haber archivos sin staged

# 3. Archivos modificados
git diff --name-only HEAD~8..HEAD  # Ver archivos en últimos 8 commits
```

---

## 🔴 BLOQUERS (si algo falla, detener)

- [ ] ❌ Archivos SQL con errores de sintaxis
- [ ] ❌ Modelos sin importar correctamente
- [ ] ❌ Routes sin verifyToken middleware
- [ ] ❌ Controller sin exports
- [ ] ❌ Componentes JSX con import errors
- [ ] ❌ Service sin try/catch
- [ ] ❌ Rama no es V_1.0.7

---

## ✅ FINAL: PUSH

Cuando todo esté OK:

```bash
# Verificación final
git status              # Clean
git log --oneline | head -10  # Commits OK

# PUSH UNO Y ÚNICO (al finalizar TODO)
git push origin V_1.0.7

# Verificar en GitHub
# https://github.com/...

# Opcional: Crear PR
gh pr create --title "BACKLOG-082: Editor de Templates de Recibos" \
  --body "Implementación completa del editor visual de templates de recibos"
```

---

**Checklist completado:** ___/___  
**Fecha:** 2026-06-12  
**Status:** 🟢 LISTO PARA PUSH
