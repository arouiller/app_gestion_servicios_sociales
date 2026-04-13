# Plan de Refactor Incremental: v2.0.x → v1.0.x (Fase a Fase)

**Fecha:** 2026-04-13  
**Contexto:** Development/Staging, sin usuarios en vivo, puedes resetear BD  
**Criterios:** Rollback rápido por fase, minimizar conflictos v2.0.x/v1.0.x  
**Visión:** Cada fase es funcional, cada fase permite rollback independiente

---

## 🎯 Estrategia General

**En lugar de refactor big-bang (todo a la vez):**
- ✅ Agregar código 1.0.x en paralelo con 2.0.x
- ✅ Mantener ambos sistemas coexistiendo (temporalmente)
- ✅ Deprecar 2.0.x gradualmente
- ✅ Cada fase es independiente y testeable
- ✅ Si Fase N falla, solo esa fase se revierte

**Arquitectura por fase:**
```
Fase 0: [Preparación]  — BD + rutas estructuradas
Fase 1: [Datos]        — Migraciones + nuevas tablas
Fase 2: [Backend]      — Controllers 1.0.x (personas, recibos)
Fase 3: [Frontend]     — Nuevas pantallas (búsqueda, listados)
Fase 4: [Migración]    — Scripts para copiar datos 2.0.x → 1.0.x
Fase 5: [Planes]       — Refactor de planes a plan_integrantes
Fase 6: [Cleanup]      — Eliminar código 2.0.x viejo
```

**Punto de rollback por fase:**
```
Después de Fase 1: ✅ Sistema 2.0.x + tablas 1.0.x vacías (rollback = DROP 1.0.x)
Después de Fase 2: ✅ Ambos backends funcionan (rollback = remover rutas 1.0.x)
Después de Fase 3: ✅ UI 2.0.x + UI 1.0.x coexisten (rollback = ocultar UI 1.0.x)
Después de Fase 4: ✅ Datos en 1.0.x, 2.0.x aún existe (rollback = restaurar de BD)
Después de Fase 5: ✅ Planes en 1.0.x (rollback = restaurar modelo 2.0.x)
Después de Fase 6: ✅ Sistema puro 1.0.x (rollback = restore de backup pre-fase-6)
```

---

## 📋 Fase 0: Preparación (30 min)

**Objetivo:** Estructura lista para empezar, sin romper nada

### Cambios
- [ ] Crear carpeta para migraciones 1.0.x: `backend/src/migrations/versions/1.0.1_tablas_lookup/`, `1.0.2_planes_y_personas/`, `1.0.3_historial_cuota_y_recibos/`
- [ ] Crear carpeta para controllers 1.0.x: `backend/src/controllers/v1/` (opcional, para separación clara)
- [ ] Crear carpeta para servicios 1.0.x frontend: `frontend/src/services/v1/`
- [ ] Crear carpeta para componentes 1.0.x: `frontend/src/pages/DashboardPage/components/v1/`
- [ ] Crear archivo de configuración de rutas: `backend/src/routes/index.js` (centralizar montaje de rutas)
- [ ] **NO cambiar nada de 2.0.x**

### Estado del Sistema
- ✅ 2.0.x completamente funcional
- ✅ Estructura lista para 1.0.x
- ✅ Repositorio limpio

### Rollback
```bash
git reset --hard HEAD~1  # Revierte solo esta fase
```

---

## 📊 Fase 1: Datos — Migraciones 1.0.x (1-2 horas)

**Objetivo:** Crear tablas 1.0.x en BD sin tocar 2.0.x

### Cambios
- [ ] Crear `backend/src/migrations/versions/1.0.1_tablas_lookup/upgrade.sql` (cobradores, tipos, obras, servicios, tipos_grupo)
- [ ] Crear `backend/src/migrations/versions/1.0.1_tablas_lookup/downgrade.sql`
- [ ] Crear `backend/src/migrations/versions/1.0.2_planes_y_personas/upgrade.sql` (personas, planes, plan_integrantes, integrante_servicios)
- [ ] Crear `backend/src/migrations/versions/1.0.2_planes_y_personas/downgrade.sql`
- [ ] Crear `backend/src/migrations/versions/1.0.3_historial_cuota_y_recibos/upgrade.sql` (historial_cuota, recibos, recibo_integrantes)
- [ ] Crear `backend/src/migrations/versions/1.0.3_historial_cuota_y_recibos/downgrade.sql`
- [ ] Renombrar `2.0.1_lookup_tables/` → `1.0.1_tablas_lookup/` (CUIDADO: ya está ejecutada)
  - Opción: Dejar ambas si ya fue ejecutada en BD; usar 1.0.1 para nuevas migraciones
  - O: Actualizar historial_migraciones para cambiar versión de 2.0.1 → 1.0.1
- [ ] Ejecutar migraciones 1.0.1, 1.0.2, 1.0.3 en BD de desarrollo
- [ ] Verificar que tablas nuevas existen y están vacías
- [ ] Verificar que tablas 2.0.x siguen intactas

### Estado del Sistema
- ✅ 2.0.x completamente funcional con datos en sus tablas
- ✅ Tablas 1.0.x nuevas, vacías, listas para poblar
- ✅ Panel de Migraciones muestra versiones 1.0.0 → 1.0.3
- ✅ **Sistema es 100% funcional** (todo viene de 2.0.x aún)

### Rollback
```bash
# Opción A: Revertir migraciones
# En Panel de Migraciones: Downgrade 1.0.3 → 1.0.2 → 1.0.1

# Opción B: Directamente desde BD
DROP TABLE recibo_integrantes, recibos, historial_cuota;
DROP TABLE integrante_servicios, plan_integrantes, personas, planes;
DROP TABLE tipos_de_grupo, servicios_adicionales, tipos_de_plan, obras_sociales, cobradores;

# Sistema vuelve a v2.0.x completo
```

### Testing
```bash
# Verificar migraciones ejecutadas
SELECT * FROM historial_migraciones WHERE version LIKE '1.0%';

# Verificar tablas existen
SHOW TABLES LIKE 'personas';
SHOW TABLES LIKE 'afiliados';  -- ambas deben existir

# Verificar 2.0.x sigue funcionando
GET /api/planes  -- debe traer planes de tabla `planes` v2.0.x
```

---

## 🔧 Fase 2: Backend — Controllers 1.0.x (2-3 horas)

**Objetivo:** Nuevos controllers sin romper 2.0.x existentes

### Cambios
- [ ] Crear `backend/src/models/Persona.js` (nuevo modelo Sequelize)
- [ ] Crear `backend/src/models/PlanIntegrante.js`, `IntegranteServicio.js`
- [ ] Crear `backend/src/models/HistorialCuota.js`, `Recibo.js`, `ReciboIntegrante.js`
- [ ] Crear `backend/src/controllers/personasController.js` (solo GET /api/personas?search=...)
- [ ] Crear `backend/src/controllers/recibosController.js` (POST generar, GET lista, GET detalle)
- [ ] Crear `backend/src/routes/personas.js`
- [ ] Crear `backend/src/routes/recibos.js`
- [ ] En `backend/src/index.js`: Montar nuevas rutas bajo `/api/personas`, `/api/recibos`
  - **Mantener** rutas existentes `/api/planes`, `/api/afiliados`, `/api/grupos`

### Estado del Sistema
- ✅ 2.0.x: `/api/planes`, `/api/afiliados`, `/api/grupos` funcionan **exactamente igual**
- ✅ 1.0.x: `/api/personas?search=...`, `/api/recibos/*` funcionan (nuevas)
- ✅ **Sistema es 100% funcional** (2.0.x completamente operativo)
- ⚠️ Tablas 1.0.x siguen vacías (datos vienen de 2.0.x)

### Rollback
```bash
# Opción A: Git
git checkout backend/src/models/Persona.js backend/src/controllers/personasController.js ...
# Solo revierte archivos nuevos; 2.0.x intacto

# Opción B: Simplemente comentar rutas en index.js
// app.use('/api/personas', personasRoutes);  // COMENTADO
// app.use('/api/recibos', recibosRoutes);    // COMENTADO
```

### Testing
```bash
# Verificar 2.0.x sigue intacto
GET /api/planes        # Debe traer datos
GET /api/afiliados     # Debe traer datos
GET /api/grupos        # Debe traer datos

# Verificar 1.0.x controllers nuevo
GET /api/personas?search=garcia   # Debe buscar (tabla vacía, retorna [])
POST /api/recibos/generar         # Debe aceptar (generar en tabla nueva)

# No hay conflictos
```

---

## 🎨 Fase 3: Frontend — UI 1.0.x (2-3 horas)

**Objetivo:** Nuevas pantallas coexisten con 2.0.x

### Cambios
- [ ] Crear `frontend/src/pages/DashboardPage/components/BusquedaAfiliados/BusquedaAfiliados.jsx` (nueva, personas)
- [ ] Crear `frontend/src/pages/DashboardPage/components/ListadoPlanes/ListadoPlanes.jsx` (nueva)
- [ ] Crear `frontend/src/pages/DashboardPage/components/PlanesPorCobrador/PlanesPorCobrador.jsx` (nueva)
- [ ] Crear `frontend/src/services/personasService.js`, `recibosService.js`
- [ ] En `DashboardPage.jsx`: Agregar menú condicional o nueva sección
  - **Opciones:**
    - A) Agregar sección `[V1] Nuevo Panel` en el menú (claramente separado)
    - B) Reemplazar sección `Gestión` por `Planes` + `Listados` (cambiar menú completamente)
  - Recomendación: **Opción A** (mantener 2.0.x visible mientras está en transición)

### Estado del Sistema
- ✅ 2.0.x: `GestionAfiliados`, `GestionGruposFamiliares`, `GestionPlanes` funcionan **exactamente igual**
- ✅ 1.0.x: Nuevas pantallas `BusquedaAfiliados`, `ListadoPlanes`, `PlanesPorCobrador` disponibles
- ✅ Menú tiene opción para ver ambas (o se muestra 1.0.x si configuras)
- ✅ **Sistema es 100% funcional** (usuarios pueden usar 2.0.x o 1.0.x)
- ⚠️ Pantallas 1.0.x usan datos vacíos (aún no hay personas en tabla)

### Rollback
```bash
# Opción A: Git revert
git reset --hard HEAD~1

# Opción B: Simplemente ocultar en menú
// {label: 'Búsqueda de Afiliados', icon: 'search', component: BusquedaAfiliados},  // COMENTADO
```

### Testing
```bash
# Verificar 2.0.x aún funciona
Click en "Gestión" → "Afiliados"  # Debe traer afiliados v2.0.x

# Verificar 1.0.x nuevas pantallas
Click en "[V1] Búsqueda de Afiliados"  # Debe cargar, búsqueda devuelve []
Click en "[V1] Listado de Planes"      # Debe cargar, tabla vacía
```

---

## 📥 Fase 4: Migración de Datos (1-2 horas)

**Objetivo:** Copiar datos de 2.0.x a 1.0.x

### Cambios
- [ ] Crear script `backend/src/scripts/migrate-v2-to-v1.js`
  - Función: Copiar `afiliados` → `personas`
  - Función: Copiar `grupos_familiares` + `planes` → `planes` (v1)
  - Función: Crear `plan_integrantes` a partir de `afiliados` del grupo + rol
  - Función: Crear `integrante_servicios` a partir de datos 2.0.x
- [ ] Ejecutar script: `node migrate-v2-to-v1.js`
- [ ] Verificar datos en tablas 1.0.x
- [ ] **NO eliminar** tablas 2.0.x (aún siguen siendo el "original")

### Estado del Sistema
- ✅ 2.0.x: Sigue funcionando, sus datos siguen en sus tablas
- ✅ 1.0.x: Ahora tiene datos (copia de 2.0.x)
- ✅ **Sistema es 100% funcional** (ambos sistemas con datos)
- ⚠️ Los datos en 1.0.x y 2.0.x son espejos (no sincronizados)

### Rollback
```bash
# Opción A: Revertir BD
DELETE FROM recibo_integrantes;
DELETE FROM integrante_servicios;
DELETE FROM plan_integrantes;
DELETE FROM personas;
DELETE FROM planes;
# Tablas 1.0.x quedan vacías nuevamente

# Opción B: Restaurar from backup pre-fase-4
mysqldump restore < backup-pre-fase4.sql
```

### Testing
```bash
# Verificar datos copiados correctamente
SELECT COUNT(*) FROM personas;        # Debe ser > 0
SELECT COUNT(*) FROM plan_integrantes;  # Debe ser > 0

# Verificar coherencia
SELECT p.id, pi.plan_numero FROM personas p 
  JOIN plan_integrantes pi ON p.id = pi.persona_id LIMIT 5;

# Verificar 2.0.x sigue igual
SELECT COUNT(*) FROM afiliados;       # Mismo count que antes
SELECT COUNT(*) FROM grupos_familiares;  # Mismo count que antes
```

---

## 🔄 Fase 5: Refactor Planes (2-3 horas)

**Objetivo:** Cambiar `planesController` de modelo 2.0.x a 1.0.x

### Cambios
- [ ] Crear versión nueva `backend/src/controllers/planesController.v1.js` (basado en spec 1.0.x)
  - GET /api/planes → leer de tabla `planes` (v1)
  - POST /api/planes → crear en estructura 1.0.x (plan + plan_integrantes)
  - PUT /api/planes/:id → actualizar estructura 1.0.x
  - DELETE /api/planes/:id → eliminar con cascada
  - GET /api/planes/:id/historial-cuota → leer tabla `historial_cuota`
  - PATCH /api/planes/aumento-masivo → actualizar con historial
- [ ] En `index.js`: Cambiar ruta `/api/planes` a usar nuevo controller
  - Opción: `const planesController = require('./controllers/planesController.v1');` (reemplaza)
  - O: Usar feature flag para switchear entre v1 y v2

### Estado del Sistema
- ✅ 2.0.x: `GestionAfiliados`, `GestionGruposFamiliares` siguen funcionales
- ✅ 1.0.x: Planes ahora leen/escriben en estructura nueva
- ✅ Frontend: Si aún usa old `planesService`, cambia a nueva (o ambas coexisten)
- ✅ **Sistema es 100% funcional** (planes en modelo 1.0.x)
- ⚠️ GestionPlanes (2.0.x) se queda sin datos (lee de tabla vieja)

### Rollback
```bash
# Opción A: Git revert
git reset --hard HEAD~1  # Vuelve controller anterior

# Opción B: Feature flag
if (process.env.USE_V1_PLANES === 'true') {
  app.use('/api/planes', planesControllerV1);
} else {
  app.use('/api/planes', planesControllerV2);  // default
}
# Cambiar env var en .env para switchear
```

### Testing
```bash
# Verificar planes funcional en 1.0.x
GET /api/planes              # Trae planes de tabla v1
POST /api/planes             # Crea en estructura v1
PUT /api/planes/1            # Actualiza plan + integrantes
PATCH /api/planes/aumento-masivo  # Crea historial_cuota

# Verificar GestionPlanes 2.0.x se queda atrás (opcional)
# Ya no llamará a /api/afiliados (esos datos están migrados a personas)
```

---

## 🧹 Fase 6: Cleanup — Eliminar 2.0.x (1 hora)

**Objetivo:** Sistema puro 1.0.x, sin código duplicado

### Cambios
- [ ] Eliminar `backend/src/controllers/afiliadosController.js`, `gruposController.js`, `historialController.js`
- [ ] Eliminar `backend/src/routes/afiliados.js`, `grupos.js`
- [ ] Eliminar `backend/src/models/Afiliado.js`, `GrupoFamiliar.js`
- [ ] Eliminar componentes frontend: `GestionAfiliados/`, `GestionGruposFamiliares/`, `GrupoDetalleModal/`
- [ ] Eliminar servicios: `afiliadosService.js`, `gruposService.js`
- [ ] En `index.js`: Remover rutas 2.0.x
- [ ] En `DashboardPage.jsx`: Actualizar menú a estructura final (sin "V1", solo Planes, Listados)
- [ ] **NO eliminar tablas BD** (aún existen 2.0.x como histórico si necesitas)

### Estado del Sistema
- ✅ 1.0.x: Sistema puro, código limpio
- ❌ 2.0.x: Código eliminado, tablas aún existen en BD
- ✅ **Sistema es 100% funcional**
- ✅ Menú limpio: Mi Cuenta → Maestros → Planes → Listados → [Admin] Migraciones

### Rollback
```bash
# Opción A: Restaurar desde archive/v2.0-grupos-familiares
git merge archive/v2.0-grupos-familiares -- backend/src/controllers/afiliadosController.js
# Trae archivos eliminados de la rama archive

# Opción B: Restore from git
git checkout archive/v2.0-grupos-familiares -- backend/src/controllers/
# Trae toda la carpeta

# Sistema sigue funcionando en 1.0.x, pero ahora tienes acceso al código viejo
```

### Testing
```bash
# Verificar 1.0.x completo funciona
GET /api/lookup/*          # Lookup CRUD
GET /api/personas?search=  # Búsqueda personas
GET /api/planes            # Planes v1
GET /api/recibos           # Recibos
POST /api/recibos/generar  # Generación

# Frontend
Click en Planes → CRUD planes v1
Click en Listados → búsqueda, listados, planes por cobrador
Click en Maestros → 5 CRUD lookup
Click en Admin → Migraciones

# Verificar BD
SELECT * FROM grupos_familiares;  -- tablas 2.0.x aún existen (histórico)
```

---

## 📊 Tabla de Viabilidad por Fase

| Fase | Sistema Funcional | Rollback | Riesgo | Duración |
|---|---|---|---|---|
| 0 | ✅ 2.0.x | 1 git reset | Bajo | 30 min |
| 1 | ✅ 2.0.x + tablas 1.0.x vacías | DROP 1.0.x tables | Bajo | 1-2 h |
| 2 | ✅ 2.0.x + controllers 1.0.x | Remover rutas | Bajo | 2-3 h |
| 3 | ✅ 2.0.x + UI 1.0.x coexisten | Hide UI 1.0.x | Bajo | 2-3 h |
| 4 | ✅ 2.0.x + 1.0.x con datos | Restore BD | Medio | 1-2 h |
| 5 | ✅ Planes en 1.0.x, resto 2.0.x | Feature flag | Medio | 2-3 h |
| 6 | ✅ 1.0.x puro | Merge from archive | Alto | 1 h |

---

## ✅ Checklist de Ejecución

### Pre-Refactor
- [ ] Rama `archive/v2.0-grupos-familiares` creada y pusheada (ya hecho)
- [ ] Backup de BD actual: `mysqldump > backup-pre-refactor.sql`
- [ ] Todos los cambios en rama principal commiteados (estado limpio)
- [ ] `ARCHIVE_README.md` revisado

### Por Cada Fase
- [ ] Crear rama de feature: `git checkout -b feature/refactor-phase-N`
- [ ] Hacer cambios de fase
- [ ] Testing manual (checklist en cada fase)
- [ ] Crear commit (o PR si necesitas review)
- [ ] Si algo falla: rollback, fix, retry
- [ ] Merge a `V_1.0.1_migrations` cuando esté listo

### Post-Refactor
- [ ] Fase 6 completa
- [ ] Testing end-to-end completo
- [ ] Documentación actualizada
- [ ] Specs y planes archivados
- [ ] Ready to merge a `main`

---

## 🎯 Recomendación Final

**¿Por qué este plan funciona?**

1. **Cada fase es pequeña** — no hay cambio masivo
2. **Cada fase mantiene sistema funcional** — no hay punto de quiebre
3. **Rollback es local por fase** — si fase 5 falla, reviertes fase 5, no todas
4. **2.0.x y 1.0.x coexisten temporalmente** — reduce riesgo de breaking changes
5. **Frontend y backend independientes** — puedes avanzar a ritmo diferente
6. **Datos se copian antes de refactorizar lógica** — menos conflictos

**Tiempo estimado total:** 10-15 horas (distribuidoras en varias sesiones)

**Recomendación de ejecución:**
- Sesión 1: Fases 0-1 (preparación + datos)
- Sesión 2: Fases 2-3 (backend + frontend UI)
- Sesión 3: Fases 4-5 (datos + planes refactor)
- Sesión 4: Fase 6 (cleanup) + testing end-to-end

---

**¿Quieres que presente este plan para aprobación? ¿O prefieres ajustar algo antes?**
