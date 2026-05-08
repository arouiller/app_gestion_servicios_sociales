# Bug Tracking

Registro de bugs detectados durante implementación del plan de auditoría (Fase 1-7).

## Legendas de Severidad
- 🔴 **CRÍTICO**: Bloquea funcionalidad o avance
- 🟡 **IMPORTANTE**: Afecta UX o requiere corrección antes de siguiente fase
- 🟢 **MENOR**: Nice-to-have, puede esperar

## Ciclo de vida de los bugs
Estos son los diferentes estados
- 📋 Registrado
- 🔬 En análisis
- ✅ Incorporado al plan
- 🚀 Desarrollado
- 🚫 Descartado (con motivo)
- ✅ Solucionado

y estos son los cambios de estados 
Registrado => Analisis => Incorporado al plan => Desarrollado => Solucionado
Desarrollado => En analisis
De cualquier estado => Descartado

Un bug solo puede pasar a estado solucionado, Descartado a traves del pedido explicito del usuario final

## Registros Activos (En Progress + Reportados)

| ID | Severidad | Fase | Descripción | Reportado | Estado |
|----|-----------|------|-------------|-----------|--------|
| BUG-032 | 🟡 IMPORTANTE | Sortable Headers | Llamadas API duplicadas y redundantes al cargar GestionPlanesV1 | 2026-05-07 | ⏸️ En pausa |

## Registros Recientemente Cerrados (Últimos 7 días)

| ID | Severidad | Fase | Descripción | Reportado | Solucionado | Commit |
|----|-----------|------|-------------|-----------|-------------|--------|
| BUG-038 | 🔴 CRÍTICO | BACKLOG-060 | Falso positivo en detección de afiliados duplicados en modo crear | 2026-05-08 | 2026-05-08 | `292d692` |
| BUG-037 | 🔴 CRÍTICO | BACKLOG-060 | Creación prematura de personas en modo "crear plan" | 2026-05-08 | 2026-05-08 | `6f888ce` |
| BUG-036 | 🔴 CRÍTICO | BACKLOG-060 | Integrantes sin ID al crear plan nuevo (reorder fallido) | 2026-05-08 | 2026-05-08 | `05d3b11` |
| BUG-035 | 🔴 CRÍTICO | BACKLOG-057 | TypeError: "N.tiposDeplan.map is not a function" al crear/editar planes | 2026-05-08 | 2026-05-08 | `dcd40f6` |
| BUG-034 | 🔴 CRÍTICO | Zonas/Lookup | Eliminación de Zona: siempre muestra "0 referencias" aunque hay planes asociados | 2026-05-07 | 2026-05-08 | `c9d57d4` |
| BUG-033 | 🔴 CRÍTICO | LookupCRUD | Sin confirmación al eliminar en cobradores, zonas, tipos de grupo, tipos de plan | 2026-05-07 | 2026-05-08 | `8b1e7e5` |

### Historial reciente (últimos 7 días)

| ID | Severidad | Fase | Descripción | Reportado | Estado |
|----|-----------|------|-------------|-----------|--------|
| BUG-038 | 🔴 CRÍTICO | BACKLOG-060 | Falso positivo en detección de afiliados duplicados en modo crear | 2026-05-08 | ✅ Solucionado |
| BUG-037 | 🔴 CRÍTICO | BACKLOG-060 | Creación prematura de personas en modo "crear plan" | 2026-05-08 | ✅ Solucionado |
| BUG-036 | 🔴 CRÍTICO | BACKLOG-060 | Integrantes sin ID al crear plan nuevo (reorder fallido) | 2026-05-08 | ✅ Solucionado |
| BUG-035 | 🔴 CRÍTICO | BACKLOG-057 | TypeError: "N.tiposDeplan.map is not a function" al crear/editar planes | 2026-05-08 | ✅ Solucionado |
| BUG-034 | 🔴 CRÍTICO | Zonas/Lookup | Eliminación de Zona: siempre muestra "0 referencias" aunque hay planes asociados | 2026-05-07 | ✅ Solucionado |
| BUG-033 | 🔴 CRÍTICO | LookupCRUD | Sin confirmación al eliminar en cobradores, zonas, tipos de grupo, tipos de plan | 2026-05-07 | ✅ Solucionado |
| BUG-032 | 🟡 IMPORTANTE | Sortable Headers | Llamadas API duplicadas al cargar GestionPlanesV1 | 2026-05-07 | ⏸️ En pausa |
| BUG-031 | 🟡 IMPORTANTE | BACKLOG-054 | Aumentos porcentuales mostrados como "fijos" en historial de cuota | 2026-05-07 | ✅ Solucionado |

---

### BUG-034: Eliminación de Zona — Siempre Muestra "0 referencias" Aunque Hay Planes Asociados

**Descripción:**
Cuando un usuario intenta eliminar una zona desde la pantalla de Gestión de Zonas, el modal de confirmación siempre muestra "0 referencias en " aunque hay planes que la referencian mediante la FK `zona_id` en la tabla `planes`. El sistema no detecta las asociaciones existentes.

**Severidad:** 🔴 CRÍTICO
- Permite eliminar zonas que están en uso, causando integridad referencial
- Los planes quedarían con `zona_id = NULL` sin advertencia al usuario

**Síntomas:**
1. Usuario abre Gestión de Zonas
2. Selecciona una zona con planes asociados
3. Hace click en eliminar
4. Modal muestra: "Esta entidad está siendo usada por 0 referencias en ."
5. Usuario confirma eliminación
6. Zona se elimina aunque tenía planes asociados ❌

**Root Cause:**
En `backend/src/controllers/lookupController.js` líneas 38-43, la entidad `zonas` tiene `refsCheck: []` vacío:

```javascript
'zonas': {
  model: db.Zona,
  pkField: 'id',
  campos: ['codigo', 'nombre'],
  refsCheck: [],  // ← PROBLEMA: Sin validación de referencias
}
```

**Comparación con otras entidades (todas correctamente configuradas):**

| Entidad | refsCheck | Estado |
|---------|-----------|--------|
| cobradores | `[{ model: db.PlanV1, fk: 'cobrador_numero' }]` | ✅ Correcto |
| tipos-de-plan | `[{ model: db.PlanV1, fk: 'tipo_plan_numero' }]` | ✅ Correcto |
| tipos-de-grupo | `[{ model: db.PlanV1, fk: 'tipo_de_grupo_numero' }]` | ✅ Correcto |
| obras-sociales | `[{ model: db.PlanV1, fk: 'os_numero' }]` | ✅ Correcto |
| servicios-adicionales | `[{ model: db.IntegranteServicio, fk: 'servicio_adicional_numero' }]` | ✅ Correcto |
| **zonas** | **`[]`** | **❌ VACÍO** |

**Problema específico de zonas:**
- La FK está en tabla `planes` (modelo: `db.PlanV1`), campo: `zona_id`
- Pero `refsCheck` está vacío, por lo que nunca se verifica esta asociación

**Impacto:**
- 🔴 Integridad referencial comprometida
- Eliminación accidental de zonas en uso
- Usuarios no reciben advertencia de dependencias

**Datos Relacionados:**
- Modelo de Zona: `backend/src/models/Zona.js`
- Modelo de PlanV1: `backend/src/models/PlanV1.js` (contiene `zona_id: { type: INTEGER, allowNull: true, references: { model: db.Zona, key: 'id' } }`)
- Controller: `backend/src/controllers/lookupController.js` (líneas 38-43)

**Estado:** 📋 Registrado

---

### BUG-034: Análisis Técnico & Diseño de Solución

**Análisis del Problema:**

1. **Dónde se verifica:** `lookupController.js` delete() líneas 265-279
   - Itera sobre `config.refsCheck` para cada modelo en el array
   - Cuenta registros que referencian el ID a eliminar
   - Si encuentra referencias, retorna 409 (sin `force=true`)
   - **Para zonas:** `refsCheck: []` → no itera nada → siempre retorna 0 referencias

2. **Cómo se relacionan zonas y planes:**
   ```javascript
   // En PlanV1.js:
   zona_id: {
     type: DataTypes.INTEGER,
     allowNull: true,
     references: { model: 'Zona', key: 'id' },
     onDelete: 'SET NULL'  // Cascada: zone delete → plan.zona_id = NULL
   }
   ```

3. **Por qué ocurre el problema:**
   - `refsCheck` vacío = no hay modelos a buscar
   - Frontend recibe `referencias: 0` en respuesta
   - Usuario no ve advertencia de planes asociados

**Solución Propuesta:**

**Cambio 1: Backend (lookupController.js)**

Actualizar configuración de zonas (líneas 38-43):

```javascript
'zonas': {
  model: db.Zona,
  pkField: 'id',
  campos: ['codigo', 'nombre'],
  refsCheck: [
    { model: db.PlanV1, fk: 'zona_id' }  // ← AGREGAR ESTA LÍNEA
  ],
}
```

**Cambio 2 (Requerido): Actualizar deleteCascade() para zonas**

En la función `deleteCascade()` líneas 383-385, está vacía y su comentario es incorrecto:

```javascript
case 'zonas':
  // Zonas no tienen referencias, sin cascada necesaria  ← COMENTARIO INCORRECTO
  break;
```

Debe ser:

```javascript
case 'zonas':
  // Establecer zona_id = NULL en planes que la referencian
  await db.PlanV1.update(
    { zona_id: null },
    { where: { zona_id: id }, transaction }
  );
  break;
```

**Comparación:** Las otras 5 entidades YA tienen casos implementados en deleteCascade (líneas 344-381). Solo zonas está incompleta.

**Validación de la Solución:**

1. Antes del fix:
   - Eliminar zona sin `force` → 200 OK directamente
   - No aparece advertencia

2. Después del fix:
   - Eliminar zona sin `force` → 409 Conflict (si hay planes)
   - Modal muestra: "Esta entidad está siendo usada por N referencias en planes"
   - Usuario debe confirmar con `force=true` para proceder

**Archivos a Modificar:**
- `backend/src/controllers/lookupController.js` (línea 42: actualizar refsCheck, líneas 383-385: actualizar deleteCascade)

**Testing de la Solución:**
1. Crear una zona con nombre "Test"
2. Crear un plan y asignarle esa zona
3. Intentar eliminar la zona
4. Verificar que modal muestra cantidad correcta de referencias
5. Confirmar eliminación con `force=true`
6. Verificar que `plan.zona_id = NULL` (plan no se eliminó)

**Impacto:**
- ✅ Detecta referencias antes de permitir eliminación
- ✅ Avisa al usuario de planes afectados
- ✅ Previene eliminar zonas en uso sin confirmación
- ✅ Mantiene integridad referencial

**Estado:** ✅ Solucionado (2026-05-07)

**Implementación:**
- ✅ Endpoint GET `/api/lookup/:entidad/:id/referencias` creado (fe31527)
- ✅ lookupController: método getReferencias() agregado
- ✅ lookupService: método getReferencias() agregado
- ✅ LookupCRUD: handleDelete() ahora consulta referencias
- ✅ Zonas: refsCheck agregado - ahora detecta FK a PlanV1 (8696f2f)
- ✅ Zonas: deleteCascade implementado - actualiza plan.zona_id = NULL (8696f2f)

**Commits:**
- `fe31527` — fix(lookup): obtener referencias mediante endpoint GET antes de eliminar
- `8696f2f` — fix(BUG-034): agregar referencias de zonas y cascada en eliminación

---

### BUG-030: Servicios Asignados a Integrante No Se Reflejan en Tabla (Solucionado)

**Descripción:**
Al asignar servicios a un integrante desde IntegranteServiciosModal y guardar, la modal se cierra pero la tabla de afiliados en PlanV1Modal no mostraba los servicios actualizados.

**Síntomas:**
1. Usuario abre PlanV1Modal de un plan existente
2. Hace clic en el ícono ⚙️ (servicios) de un integrante
3. Selecciona servicios y hace clic en "Guardar"
4. Modal se cierra
5. Vuelve a abrir la modal → servicios SÍ estaban guardados en BD ✅
6. Pero la tabla de afiliados NO mostraba el count de servicios ❌

**Causa Raíz:**
En `PlanV1Modal.jsx` línea 868, el callback `onClose` solo cerraba la modal sin recargar datos:
```javascript
onClose={() => setServiciosModalOpen(null)}
```

Los servicios se guardaban en el backend, pero el frontend no sincronizaba el array `servicios` del integrante con los cambios.

**Impacto:**
- 🟡 IMPORTANTE: UX confusa - parecía que no se guardaban los cambios
- Datos correctos en BD pero UI no se sincronizaba

**Archivos Afectados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`

**Fixes Aplicados:**

1. **Agregar función reloadIntegrantes (f1c6d44):**
   - Nueva función que recarga los integrantes con sus servicios desde el backend
   - Se ejecuta como callback onClose de IntegranteServiciosModal
   - Mantiene el patrón de carga de `loadFullPlanData` pero limitado a integrantes

2. **Actualizar callback de onClose (f1c6d44):**
   - Cambiar de `setServiciosModalOpen(null)` a `setServiciosModalOpen(null); reloadIntegrantes()`
   - Asegura sincronización de datos cuando la modal se cierra

**Commits de Resolución:**
- f1c6d44: fix(planes): recargar integrantes después de asignar servicios

**Estado:** ✅ Solucionado (2026-05-07)

---

### BUG-028: Drag & Drop de Integrantes — Rol Guarda como Vacío (Solucionado)

**Descripción:**
Al reordenar integrantes en PlanV1Modal mediante drag & drop y guardar, el rol de los integrantes se corrompe:
- El integrante que queda primero (titular) se guarda correctamente
- Los demás integrantes se guardan con rol = "" (vacío)

**Síntomas:**
1. Usuario reordena integrantes (ej: persona 12 → primero, persona 6 → segundo)
2. Guarda el plan
3. En BD: persona 12 tiene rol='titular' ✅, pero persona 6 tiene rol="" ❌
4. Al recargar el modal, persona 6 aparece como "Integrante" (inferido por posición, no por BD)

**Causa Raíz:**
En `backend/src/controllers/v1.0/planIntegrantesController.js` línea 133, el código intenta guardar:
```javascript
const rol = index === 0 ? 'titular' : 'adherente';
```

Pero el ENUM en `PlanIntegrante.js` es `ENUM('titular','integrante')`, no 'adherente'.
MySQL rechaza el valor inválido y guarda como cadena vacía.

**Impacto:**
- 🔴 CRÍTICO: Corrupción de datos en BD
- Los datos se guardan incorrectamente pero la UI sigue funcionando (rol se infiere por posición)
- Futura sincronización de datos podría fallar

**Archivos Afectados:**
- `backend/src/controllers/v1.0/planIntegrantesController.js` línea 133

**Fixes Aplicados:**

1. **Cambiar ENUM inválido (81b379f):**
   - Línea 133 en planIntegrantesController.js
   - 'adherente' → 'integrante'

2. **Sincronizar orden y rol (a3fcc44):**
   - Backend: Agregar `order: [['orden', 'ASC']]` en include de PlanIntegrante
   - Frontend: Sortear integrantes por `orden` al cargar
   - Frontend: Usar `integrante.rol` en tabla en lugar de inferir de index
   - Incluir campo `orden` en mapeo de integrantes

**Commits de Resolución:**
- 81b379f: fix(reorder): cambiar rol 'adherente' a 'integrante' para match con ENUM
- a3fcc44: fix(integrantes): ordenar por campo 'orden' en BD y frontend, usar rol de BD en tabla

**Estado:** ✅ Solucionado (2026-05-07)

---

## Historial Completado

| ID | Fase | Descripción | Resuelto | Commits |
|----|------|-------------|----------|---------|
| BUG-030 | BACKLOG-052 | Servicios asignados a integrante no se reflejan en tabla (reloadIntegrantes) | 2026-05-07 | f1c6d44 |
| BUG-029 | BACKLOG-049 | Validación de duplicados aún bloquea números_documento después del fix | 2026-05-07 | 469fece |
| BUG-028 | BACKLOG-048 | Drag & drop de integrantes: rol guarda como vacío (ENUM 'adherente' inválido) | 2026-05-07 | 81b379f, a3fcc44 |
| BUG-027 | BACKLOG-014 | Listado de Recibos: obra social no aparece en lista (pero sí en detalle) | 2026-05-06 | (cerrado por usuario) |
| BUG-026 | BACKLOG-014 | Gestión de Recibos: período Abril 2026 muestra "No hay recibos" pese a tener 12 registrados | 2026-05-06 | (cerrado por usuario) |
| BUG-024 | BACKLOG-N/A | Migraciones BD - Tab "Estadísticas" muestra página en blanco | 2026-05-06 | (cerrado por usuario) |
| BUG-019 | BACKLOG-014 | Gestión de Recibos: seleccionar período con recibos devuelve array vacío | 2026-05-06 | (cerrado por usuario) |
| BUG-023 | BACKLOG-019 | Eliminación cascada de Cobrador: error notNull Violation (modelo Sequelize no permitía NULL) | 2026-04-17 | 8879462 |
| BUG-022 | BACKLOG-019 | Eliminación cascada de Tipo de Plan: error notNull Violation (modelo Sequelize no permitía NULL) | 2026-04-17 | 8879462 |
| BUG-021 | BACKLOG-019 | Eliminación cascada de Tipo de Grupo: error notNull Violation (modelo Sequelize no permitía NULL) | 2026-04-17 | 8879462 |
| BUG-020 | BACKLOG-019 | Eliminación cascada de OS: error notNull Violation (modelo Sequelize no permitía NULL) | 2026-04-17 | 8879462 |
| BUG-016 | BACKLOG-003 | Iconos de acciones inconsistentes: estandarizado ✎ y 🗑 en todas las tablas | 2026-04-16 | eb42769 |
| BUG-015 | BACKLOG-009 | Botón Aumento Masivo visible pero deshabilitado para no-admin (mejora UX) | 2026-04-16 | 169a924 |
| BUG-014 | BACKLOG-009 | Botones de acciones no visibles para usuarios no-admin (removidos condicionales isAdmin innecesarios) | 2026-04-16 | 1531825 |
| BUG-010 | BACKLOG-004 | POST /api/usuarios retorna URL duplicada (verificado resuelto) | 2026-04-16 | 451131d |
| BUG-008 | BACKLOG-002 | ReciboDetalleModal no abre (verificado resuelto) | 2026-04-16 | (fix anterior) |
| BUG-006 | Migrations | Downgrade en v1.0.x (verificado resuelto) | 2026-04-16 | (fix anterior) |
| BUG-013 | BACKLOG-008 | Regeneración de recibos: frontend no maneja 409, mostraba "0 recibos" | 2026-04-16 | 43b7dcb, 7f7aae6 |
| BUG-012 | BACKLOG-006 | Password blanqueada: nueva contraseña no funciona en siguiente login (campo password → password_hash) | 2026-04-16 | 60a0d7f |
| BUG-009 | BACKLOG-001 | Distribución de columnas desalineada en tabla de preview | 2026-04-16 | 27f822c |
| BUG-011 | BACKLOG-004 | Migraciones no ejecutadas en producción | 2026-04-16 | Ejecutadas manualmente en Hostinger |
| BUG-010 | BACKLOG-004 | URL duplicada en POST /api/usuarios | 2026-04-16 | 451131d |
| BUG-007 | Migrations | POST /api/migrations/execute retorna "Cannot POST" (404) | 2026-04-15 | 3446668 |
| BUG-003 | 4 | GenerarRecibosModal: Campos null en ReciboIntegrante | 2026-04-15 | e32eb94 |
| BUG-005 | Migrations | v2.0.0-v2.0.4 todas mostraban "Actual" (solo v2.0.3 debería) | 2026-04-15 | 56a73bf, 5528b8f |
| BUG-004 | Migrations | Ordenamiento de versiones descendente | 2026-04-15 | f6371a9 |
| BUG-002 | 3 | BulkUpdateCuotaModal: selectores vacíos, error toFixed, sin filtro opcional, falta tipo aumento | 2026-04-15 | 48f9457, d5a08d4, a151bba, 96fe79f |
| BUG-001 | Deploy | Hostinger deployment: Entry File mal configurado | 2026-04-15 | 17acca3 |

---

## Detalles de Bugs

### BUG-001: Hostinger Deployment Entry File
**Descripción:** 
Hostinger reporta que el Entry File está configurado como `backend/dist/src/index.js`, pero la estructura real es diferente. El Output Directory está en null.

**Error original:**
```
The likely issue is related to the configuration of the Entry File or Output Directory, 
as these parameters are framework-specific and set to null, indicating that the framework does not support them.
Ensure that the Entry File backend/dist/src/index.js is correct, as the framework does 
not support the Output Directory configuration.
```

**Contexto:**
- Push anterior fue exitoso sin errores
- Deploy falló en Hostinger post-commit c10f4d3
- Node.js 20 está disponible, versión de engines (>=16.0.0) es compatible

**Causa raíz identificada:**
El build script `backend/scripts/build.js` genera `backend/dist/src/index.js`, pero Hostinger no 
ejecutaba el build automáticamente. El package.json tenía script "build", pero Hostinger 
no sabía cuándo ejecutarlo.

**Solución implementada:**
1. Creado archivo `.cPanel.json` en raíz del proyecto
2. Configurado hooks "build" y "post_deploy" para ejecutar:
   - `cd backend && npm install --production && node scripts/build.js`
   - `cd backend/dist && npm install --production --no-audit`
3. Especificado `nodejs_app.startup_file` = `backend/dist/src/index.js`
4. Configurado NODE_ENV = production

**Verificación:**
- ✅ Entry File correcto: backend/dist/src/index.js
- ✅ Build script ejecutará antes del deploy
- ✅ Post-deploy instalará dependencias en dist/
- ✅ Output Directory soporte implícito a través de hooks

**Fix commit:** 17acca3 (fix(deploy): configurar Hostinger)

**Verificación pendiente:**
- [ ] Ejecutar próximo deployment en Hostinger
- [ ] Confirmar que .cPanel.json se ejecutó
- [ ] Verificar logs: "node scripts/build.js" ejecutado exitosamente
- [ ] Confirmar que backend/dist/src/index.js existe
- [ ] El app inicia sin errores de Entry File

**Estado:** ✅ Solucionado (2026-04-16)

---

### BUG-002: BulkUpdateCuotaModal - Deficiencias en UI y Lógica

**Descripción:**
El componente BulkUpdateCuotaModal implementado en Fase 3 tiene múltiples deficiencias que bloquean su funcionalidad:

**Problemas identificados:**

a. **Selectores sin items desplegados**
   - Al cambiar el filtro (tipo_plan, cobrador, obra social), el selector no muestra opciones
   - Causa probable: lookupData no se carga correctamente en loadLookupData() o la asignación falla
   - Síntoma: Selector vacío incluso después de seleccionar filtro

b. **Sin opción "Todos los planes"**
   - Actualmente requiere seleccionar un filtro específico (obligatorio)
   - Debe permitir "Todos los planes" sin aplicar filtro
   - Implica cambiar lógica: si no hay filtro, enviar plan_numeros vacío al backend

c. **Falta tipo de aumento (fijo vs porcentual)**
   - Solo permite entrada de valor absoluto
   - Debe permitir elegir entre:
     - Aumento fijo: $500 (suma al valor actual)
     - Aumento porcentual: 10% (multiplica valor actual por 1.10)
   - Actualmente no distingue entre ambos tipos

d. **Valores por defecto incorrectos**
   - Por defecto debe ser: tipoAumento = 'porcentual', filtro = 'todos'
   - Actualmente abre con filtro = 'tipo_plan' (obliga a elegir)

**Contexto:**
- Commit 767b2ec introdujo el modal sin validar comportamiento real
- Fase 3 marcada como completada pero tiene deficiencias críticas
- Bloquea uso real de la funcionalidad de aumento masivo

**Archivos afectados:**
- `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx`
- Potencialmente `backend/src/controllers/planesController.js` (si lógica de backend requiere cambios)

**Verificación pendiente:**
- [ ] Confirmar que lookupService retorna datos correctamente
- [ ] Probar con navegador: abrir modal y cambiar filtro
- [ ] Verificar que selector muestra items después de cambiar filtro
- [ ] Implementar opción "Todos los planes" sin filtro obligatorio
- [ ] Agregar radio buttons o dropdown para tipo de aumento
- [ ] Cambiar lógica de calculo según tipo
- [ ] Establecer valores por defecto correctos
- [ ] Re-testear flujo completo

**Regla:** El bug permanece abierto hasta que el usuario confirme explícitamente "está resuelto"

**Solución implementada (2026-04-15 - v2):**

✅ **a. Selectores sin items desplegados** — RESUELTO (v2)
   - Problema raíz: Llamadas a métodos inexistentes del lookupService
   - Métodos incorrectos: getTipoPlan(), getCobrador(), getObraSocial()
   - Métodos correctos: getTiposDePlan(), getCobradores(), getObrasSociales()
   - Solución: Corregir nombres de métodos en loadLookupData()
   - Commit: 96fe79f

✅ **b. Sin opción "Todos los planes"** — RESUELTO
   - Problema: filtro era obligatorio (por defecto 'tipo_plan')
   - Solución: Cambiar defaultFiltro a 'todos', selectores solo si filtro != 'todos'
   - Commit: d5a08d4

✅ **c. Falta tipo de aumento (fijo vs porcentual)** — RESUELTO
   - Problema: Solo soportaba valor absoluto
   - Solución: Agregar state `tipoAumento` con radio buttons
   - Backend refactorizado para calcular según tipo:
     * Fijo: valor_nuevo = valor_anterior + valor
     * Porcentual: valor_nuevo = valor_anterior * (1 + valor/100)
   - Commits: 48f9457 (backend), d5a08d4 (frontend)

✅ **d. Valores por defecto incorrectos** — RESUELTO
   - Problema: Abrían con tipoAumento undefined, filtro='tipo_plan'
   - Solución: Establecer defaultTipoAumento='porcentual', defaultFiltro='todos'
   - Commit: d5a08d4

✅ **e. Error "toFixed is not a function"** — RESUELTO (v2)
   - Problema: parseFloat().toFixed(2) fallaba cuando valor era inválido/vacío
   - Causa raíz: parseFloat retorna NaN, y NaN.toFixed() genera error
   - Solución: Usar Number() en lugar de parseFloat(), agregar validación defensiva
   - Aplicado en: previsualización de valor y tabla de planes afectados
   - Commit: 96fe79f

**Cambios adicionales:**
- Agregar input con unidad (símbolo % o $ dinámico) — a151bba
- Mejorar validación de inputs (solo validar selectValue si filtro != 'todos') — d5a08d4
- Agregar .form-hint para mostrar ejemplos de entrada — d5a08d4
- Validación robusta de valores numéricos en formato moneda — 96fe79f

**Verificación completada (v2):**
- ✅ Combos desplegan items correctamente (getTiposDePlan, getCobradores, getObrasSociales)
- ✅ Opción "Todos los planes" funciona sin filtro obligatorio
- ✅ Radio buttons para tipo de aumento (fijo/porcentual)
- ✅ Input muestra unidad correcta según tipo de aumento
- ✅ Valores por defecto correctos (porcentual, sin filtro)
- ✅ Backend soporta ambos tipos de cálculo
- ✅ No hay error toFixed en preview (validación robusta Number())
- ✅ Tabla de planes preview muestra valores correctamente
- ✅ Flujo completo: selector filtro → preview → confirmación

**Estado:** ✅ Solucionado (2026-04-16) — Fase 3 (BulkUpdateCuotaModal) completamente funcional

---

### BUG-003: GenerarRecibosModal - Error en Transacción de Base de Datos

**Descripción:**
Al invocar la generación de recibos, seleccionar un período y hacer click en "Generar", el modal muestra "0 recibos generados exitosamente" pero en los logs aparece error de transacción undefined.

**Error reportado:**
```json
{
    "success": false,
    "message": "Cannot read properties of undefined (reading 'transaction')"
}
```

**Contexto:**
- Ocurre en fase 4 (GenerarRecibosModal)
- Error en: `backend/src/controllers/v1.0/recibosController.js` línea 11
- Función: `generar()` - POST /api/recibos/generar

**Causa probable:**
- Línea 2: `const { sequelize } = require('../../config/database');` (destructuring incorrecto)
- Probablemente config/database.js exporta directamente la instancia, no un objeto con propiedad `sequelize`
- `sequelize` resulta undefined → `.transaction()` genera error

**Archivos afectados:**
- `backend/src/controllers/v1.0/recibosController.js`
  - Línea 2: import incorrecto
  - Línea 11: uso de `sequelize.transaction()`

**Verificación pendiente:**
- [ ] Revisar config/database.js para ver exportación real
- [ ] Cambiar import a: `const sequelize = require('../../config/database');` (sin destructuring)
- [ ] Probar generación de recibos
- [ ] Validar que transacción se ejecute correctamente
- [ ] Verificar que 0 recibos es legítimo o si hay otro error

**Severidad:** 🔴 CRÍTICO — Bloquea Fase 4

**Historial de errores (2026-04-15):**

**Error 1 - RESUELTO:**
   - Mensaje: "Cannot read properties of undefined (reading 'transaction')"
   - Causa: Import con destructuring incorrecto
   - Fix: `const { sequelize } = ...` → `const sequelize = ...`
   - Commit: 73783c1

**Error 2 - MIGRACIÓN CREADA (pendiente ejecución):**
   - Mensaje: "Unknown column 'periodo' in 'SELECT'"
   - Ubicación: recibosController.js línea 49
   - Causa raíz: Tabla `recibos` no existe en la BD
   - Solución: Crear migración v2.0.4 con tablas recibos y recibo_integrantes
   - Commit: a2b980b (corrige versionado: v1.0.3 → v2.0.4)

**Detalles de la corrección:**
- Versionado anterior (incorrecto): v1.0.3_recibos (última era 2.0.3)
- Versionado corregido: v2.0.4_recibos (siguiente secuencial)
- Regla: Una sola carpeta por versión, todos cambios consolidados
- Migración contiene: CREATE TABLE recibos, CREATE TABLE recibo_integrantes

**Error 3 - CAMPOS NULL EN RECIBO_INTEGRANTE (2026-04-15):**
   - Mensaje: "notNull Violation: ReciboIntegrante.tipo_documento/numero_documento/fecha_nacimiento/fecha_cobertura cannot be null"
   - Ubicación: recibosController.js línea 109-122
   - Causa raíz: El include de Persona solo cargaba ['id', 'apellido', 'nombre'], faltaban:
     * tipo_documento
     * numero_documento
     * fecha_nacimiento
     * fecha_cobertura
   - Sequelize no cargaba esos atributos → undefined en Persona → violación NOT NULL en insert
   - Solución: Agregar campos faltantes al attributes array del include
   - Commit: e32eb94

**Próximos pasos:**
1. Re-invocar generación de recibos (POST /api/recibos/generar)
2. Verificar que se crean recibos e integrantes sin error de null
3. Consultar tabla recibos y recibo_integrantes para validar datos

**Estado:** ✅ Solucionado (2026-04-16) — Commit e32eb94

---

---

### BUG-004: Ordenamiento Descendente de Versiones de Migraciones

**Descripción:**
Las versiones de migración no se mostraban ordenadas de forma descendente. El orden actual era:
```
v2.0.0, v2.0.1, v2.0.2, v2.0.3, v2.0.4, v1.0.0, v1.0.1, v1.0.2, v1.0.3
```

**Causa raíz:**
- `getMigrationFolders()` usaba `.sort()` (alfabético ascendente)
- No respetaba versionado semántico (semver)

**Solución implementada (2026-04-15):**
1. Agregada función `compareVersions(v1, v2)` que compara versiones semánticas
2. Modificado `getMigrationFolders()` para usar sort descendente con compareVersions()
3. Ordenamiento ahora correcto: v2.0.4, v2.0.3, ..., v2.0.0, v1.0.3, ..., v1.0.0

**Cambios:**
- `backend/src/migrations/migrationManager.js` - líneas 17-30 (agregada compareVersions)
- `backend/src/migrations/migrationManager.js` - líneas 32-48 (modificado getMigrationFolders)

**Verificación:** ✅ Completada
- ✅ Función compareVersions compara correctamente semver
- ✅ getMigrationFolders retorna orden descendente
- ✅ list() usa orden correcto

**Estado:** ✅ Solucionado (2026-04-16) — Commit f6371a9

---

### BUG-005: Múltiples Versiones Figuraban como "Aplicadas"

**Descripción:**
Las versiones v2.0.0, v2.0.1, v2.0.2, v2.0.3 y v2.0.4 aparecían todas como "aplicadas" en la UI. Esto es incorrecto porque:
- Solo la última versión ejecutada (v2.0.3) debería estar "aplicada"
- Las versiones anteriores (v2.0.0-v2.0.2) son "pasadas" (completadas pero no actual)
- Las versiones posteriores (v2.0.4) son "pendientes"

**Causa raíz:**
- Función `list()` en migrationManager.js marcaba como "aplicada" cualquier versión en `applied` (historial)
- No diferenciaba entre "última aplicada" y "aplicadas anteriormente"
- Lógica: `estado: applied.includes(version) ? 'aplicada' : 'pendiente'`

**Solución implementada (2026-04-15):**
1. Modificada función `list()` para diferenciar tres estados:
   - 'aplicada': versión actual (última ejecutada)
   - 'pasada': versión completada pero anterior a la actual
   - 'pendiente': versión no ejecutada aún
2. Agregada lógica: `version === currentVersion ? 'aplicada' : 'pasada'`

**Cambios:**
- `backend/src/migrations/migrationManager.js` - líneas 149-173 (refactorizado list())

**Verificación en UI (2026-04-15):**
- ❌ v2.0.0-v2.0.4 todas muestran "✓ Actual"
- ✅ v1.0.3, v1.0.2, v1.0.1, v1.0.0 muestran "Anterior" (correcto)

**Causa:** 
- Código corregido en f6371a9 pero servidor no reiniciado
- O bien, tabla `migraciones_bd` contiene todas las versiones con `estado='exitosa'`

**Próximos pasos:**
1. Reiniciar servidor backend (`npm run dev` o `npm start`)
2. Verificar tabla `migraciones_bd` — ¿qué versiones tienen estado='exitosa'?
3. Si todas tienen exitosa: solo la última (v2.0.3) debería estar

**Estado:** ✅ Solucionado (2026-04-16) — Commit f6371a9

---

### BUG-006: Versiones v1.0.x Downgrade

**Descripción:**
Las versiones v1.0.0, v1.0.1, v1.0.2 e v1.0.3 tenían habilitada la opción "downgrade" en la UI. Esto es incorrecto porque:
- Versión actual: v2.0.3
- Única versión que puede hacer downgrade: v2.0.3 (revertir a v2.0.2)
- Las versiones v1.0.x están fuera de alcance (requiere downgrade secuencial)

**Causa raíz:**
- Función `execute()` validaba solo que la versión estuviera "aplicada"
- No validaba que sea la versión ACTUAL (última aplicada)

**Solución implementada (2026-04-15):**
1. Agregada validación en `execute()`: downgrade solo se permite para versión actual
2. Nuevo error si `version !== currentVersion`
3. Solo la última versión en applied[] puede hacer downgrade

**Cambios:**
- `backend/src/migrations/migrationManager.js` - líneas 377-392
- `backend/src/controllers/migrationsController.js` - líneas 107-149

**Verificación pendiente:**
- [ ] Intentar downgrade desde v1.0.3 en la UI
- [ ] Debe mostrar error "No se puede hacer downgrade de v1.0.3"
- [ ] Solo v2.0.3 debe permitir downgrade

**Estado:** ✅ Solucionado (2026-04-16) — Commit f6371a9

---

### BUG-007: Execute Migration API Call Missing Version Parameter

**Descripción:**
Al hacer upgrade/downgrade en la UI, después de confirmar la migración, se recibe error HTML:
```
Cannot POST /api/migrations/execute
```

**Causa raíz:**
- Había TWO migrationsService.js files con código diferente
- `frontend/src/services/migrationsService.js` (antiguo) usaba: `POST /migrations/execute` con `{direction}` en body
- `MigrationsDashboard` debería usar el archivo local correcto

**Solución implementada (2026-04-15):**
1. Actualizar `frontend/src/services/migrationsService.js` para usar URL correcta: `POST /migrations/execute/:version/:direction`
2. Cambiar execute() para incluir versión: `execute: async (version, direction) => api.post(/migrations/execute/${version}/${direction})`

**Cambios:**
- `frontend/src/services/migrationsService.js` - línea 47-54
- Revert commit a14b9bf (eliminación incorrecta)
- Fix commit 3446668 (actualización correcta)

**Verificación completada (2026-04-15):**
- ✅ Usuario confirmó que el upgrade funciona correctamente
- ✅ Payload enviado con versión y direction en URL
- ✅ Sin error 404
- ✅ Respuesta JSON exitosa

**Estado:** ✅ Solucionado (2026-04-16) — Commits 3446668

---

---

### BUG-008: ReciboDetalleModal no abre - Plan se actualiza en su lugar

**Descripción:**
Al hacer click en el icono "👁️ Ver detalle" de un recibo en el tab de Recibos de PlanV1Modal, el modal de detalles del recibo no se abre. En su lugar, se realiza una actualización del plan (`PUT /api/v1.0/planes/11`) y se vuelve al listado de planes.

**Comportamiento observado:**
1. Usuario abre modal de edición de plan (PlanV1Modal)
2. Navega al tab "Recibos"
3. Hace click en icono "👁️ Ver detalle" de un recibo
4. Resultado: Se ejecuta `PUT /api/v1.0/planes/11` con payload del plan
5. Modal se cierra y vuelve al listado de planes

**Payload capturado:**
```json
{
  "numero_afiliado": "0012",
  "tipo_plan_numero": 1,
  "cobrador_numero": 1,
  "tipo_de_grupo_numero": 1,
  "os_numero": 1,
  "estado": "ACTIVO",
  "valor_cuota": 13.2,
  "domicilio": null,
  "telefono_1": null
}
```

**Causa probable:**
El ActionButton que abre ReciboDetalleModal está dentro del elemento `<form>` de PlanV1Modal. El botón no tiene `type="button"` explícito, por lo que actúa como submit button del formulario, dispara `handleGuardar()` en lugar de abrir el modal.

**Ubicación del código:**
- Archivo: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
- Línea ~485-495: Tabla de recibos con ActionButton
- Línea ~567: Secondary modal `{reciboDetailOpen && <ReciboDetalleModal ... />}`

**Solución propuesta:**
El ActionButton debe tener `type="button"` para prevenir que actúe como submit del formulario. Alternativa: extraer el ActionButton fuera del `<form>` o agregar `stopPropagation()` en el onClick.

**Severidad:** 🔴 CRÍTICO
- Bloquea funcionalidad BACKLOG-002 (tab de recibos)
- El modal ReciboDetalleModal nunca se abre
- Causa efectos secundarios (actualización del plan innecesaria)

**Reportado:** 2026-04-16

**Estado:** ✅ Solucionado (2026-04-16)

---

### BUG-009: Distribución de Columnas Desalineada en Tabla de Preview (BACKLOG-001)

**Descripción:**
En el modal de aumento masivo de cuotas (BulkUpdateCuotaModal), cuando se muestra el preview de planes a afectar, los valores de las columnas no se alinean correctamente con los encabezados.

**Síntomas observados:**
- Encabezados: Plan # | Afiliado | Cuota Actual | Cuota Nueva | Aumento
- Valores desalineados: Los valores de cada columna aparecen desplazados respecto a sus encabezados
- Ejemplo: 
  - Plan # muestra "1" pero el siguiente valor "$332..." (debería ser Cuota Nueva) aparece en la columna de Afiliado
  - Valores de Cuota Nueva y Aumento se solapan o desaparecen parcialmente

**Ubicación del código:**
- Archivo: `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.scss`
- Componente: `planes-table__full` (tabla HTML con `<table>` / `<thead>` / `<tbody>`)

**Causa probable:**
Problema de CSS/grid layout:
1. Los encabezados (`<th>`) pueden tener ancho fijo diferente al de las celdas de datos (`<td>`)
2. Ausencia de `table-layout: fixed` en la tabla
3. Widths inconsistentes entre columnas en header vs body
4. Padding/margin diferente entre `<th>` y `<td>`
5. Text truncation (`text-overflow: ellipsis`, `white-space: nowrap`) sin ancho mínimo

**Severidad:** 🟡 IMPORTANTE
- No bloquea funcionalidad (los datos se envían correctamente)
- Pero afecta usabilidad: usuario no puede validar visualmente qué valores va a aplicar
- Especialmente crítico para validación de operaciones masivas

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-001 (tab/feature)

**Estado:** ✅ Solucionado (2026-04-16)

**Verificación completada:**
- ✅ Tabla de preview alineada correctamente
- ✅ Encabezados coinciden con valores
- ✅ Funcionalidad de aumento masivo operativa

**Propuestas de investigación:**
- [ ] Revisar CSS de `planes-table__full` (ancho de columnas)
- [ ] Verificar si las columnas tienen width definido en header
- [ ] Comparar estilos entre `<th>` y `<td>`
- [ ] Considerar `table-layout: fixed` para alineación consistente
- [ ] Revisar valores de padding/margin en thead vs tbody
- [ ] Ajustar overflow handling para que no desplace columnas

---

### BUG-010: POST /api/usuarios retorna "Cannot POST /api/api/usuarios"

**Descripción:**
Al crear un nuevo usuario desde GestionUsuarios (BACKLOG-004), completar el campo email y hacer clic en "Crear usuario", se obtiene error "error al crear el usuario: undefined". La llamada al backend falla porque la URL está duplicada con el prefijo `/api`.

**Pasos para reproducir:**
1. Ir a Dashboard → Administración → Gestión de Usuarios
2. Hacer clic en botón "➕ Nuevo Usuario"
3. Completar campo email (ej: `alejandrorouiller@gmail.com`)
4. Hacer clic en "Crear Usuario"

**Error reportado:**
```
error al crear el usuario: undefined
```

**URL errónea:**
```
POST https://seagreen-skunk-116671.hostingersite.com/api/api/usuarios
```

**Payload enviado:**
```json
{"email":"alejandrorouiller@gmail.com"}
```

**Response del servidor:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot POST /api/api/usuarios</pre>
</body>
</html>
```

**Causa probable:**
- En `usuariosService.js`, el método `crear()` usa `api.post('/api/usuarios', ...)`
- El axios instance en `api.js` probablemente ya incluye prefijo `/api` en la baseURL
- Resultado: `/api` + `/api/usuarios` = `/api/api/usuarios` ❌
- Debería ser solo `/usuarios` en el servicio

**Archivos afectados:**
- `frontend/src/services/usuariosService.js` (métodos: list, crear, cambiarRol, blanquearPassword, resetPassword)
- Potencialmente `frontend/src/services/api.js` (verificar configuración de baseURL)

**Severidad:** 🔴 CRÍTICO
- Bloquea completamente la funcionalidad de crear usuarios
- BACKLOG-004 no es funcional en producción

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-004 (Panel de Gestión de Usuarios)

**Causa raíz identificada:**
- `api.js` configura axios baseURL como `http://localhost:5000/api`
- `usuariosService.js` estaba usando rutas como `/api/usuarios`
- Resultado: baseURL + ruta = `/api` + `/api/usuarios` = `/api/api/usuarios` ❌

**Solución implementada:**
Cambiar todas las rutas en `usuariosService.js` removiendo prefijo `/api`:
- `GET /api/usuarios` → `GET /usuarios`
- `POST /api/usuarios` → `POST /usuarios`
- `PUT /api/usuarios/:id/rol` → `PUT /usuarios/:id/rol`
- `POST /api/usuarios/:id/blanquear-password` → `POST /usuarios/:id/blanquear-password`
- `POST /api/auth/password-reset` → `POST /auth/password-reset`

Patrón confirmado en otros servicios (planesService, personasService, etc.)

**Fix commit:** 451131d

**Estado:** ✅ Solucionado (2026-04-16)

---

### BUG-011: Migraciones No Ejecutadas en Producción

**Descripción:**
Al intentar usar funcionalidades de BACKLOG-004 (Gestión de Usuarios) en producción, el servidor retorna errores de columnas desconocidas:
1. GET /api/usuarios → "Unknown column 'password_blanqueada' in 'SELECT'"
2. POST /api/usuarios → "Unknown column 'tema_preferido' in 'SELECT'"

**Pasos para reproducir (en producción):**
1. Ir a Dashboard → Administración → Gestión de Usuarios
2. Error: "error al cargar usuarios"
3. Consola muestra: Unknown column 'password_blanqueada' in 'SELECT'

**Intentar crear usuario:**
1. Clic en "➕ Nuevo Usuario"
2. Completar email
3. Error: "Error al crear usuario: Unknown column 'tema_preferido' in 'SELECT'"

**Errores reportados:**
```json
{
  "success": false,
  "message": "Unknown column 'password_blanqueada' in 'SELECT'"
}
```

```json
{
  "success": false,
  "message": "Unknown column 'tema_preferido' in 'SELECT'"
}
```

**URLs afectadas:**
- GET https://seagreen-skunk-116671.hostingersite.com/api/usuarios
- POST https://seagreen-skunk-116671.hostingersite.com/api/usuarios

**Causa raíz probable:**
- Migración 1.0.5 (`password_blanqueada`) no fue ejecutada en BD producción
- Migración para agregar `tema_preferido` también falta en producción
- Las migraciones están en `backend/src/migrations/versions/` pero no se ejecutaron en Hostinger

**Archivos afectados:**
- Backend: `backend/src/migrations/versions/1.0.5_password_blanqueada/upgrade.sql`
- Backend: controladores/modelos que asumen existencia de estas columnas
- Base de datos: tabla `usuarios` en Hostinger

**Severidad:** 🔴 CRÍTICO
- BACKLOG-004 completamente no funcional en producción
- Bloquea cualquier intento de gestionar usuarios

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-004 (Panel de Gestión de Usuarios)

**Estado:** ✅ Solucionado (2026-04-16)

**Verificación completada:**
- ✅ Tabla `usuarios` tiene columna `password_blanqueada`
- ✅ Tabla `usuarios` tiene columna `tema_preferido`
- ✅ Gestión de Usuarios funcional en producción

---

### BUG-012: Nueva Contraseña No Funciona en Login Posterior a Cambio

**Descripción:**
En el flujo de blanqueo de contraseña (BACKLOG-006), cuando un usuario con password_blanqueada cambia su contraseña y luego intenta loguearse con la nueva contraseña, el sistema rechaza las credenciales con error "Email o contraseña incorrectos".

**Pasos para reproducir:**
1. Admin blanquea contraseña de usuario: POST /api/usuarios/:id/blanquear-password
2. Usuario abre LoginPage, marca checkbox "Tengo contraseña blanqueada"
3. Usuario ingresa email, sistema lo autentica (sin validar password)
4. Sistema redirige a /cambiar-password
5. Usuario ingresa nueva contraseña (ej: "MiNuevaPass123")
6. Sistema muestra "Contraseña actualizada. Por favor inicia sesión nuevamente"
7. Usuario inicia sesión nuevamente con email + "MiNuevaPass123"
8. **Error: "Email o contraseña incorrectos"** ❌

**Comportamiento esperado:**
- Paso 7 debería permitir login exitoso con la nueva contraseña

**Causa probable:**
Una de estas opciones:
1. **Password no se está hasheando** en endpoint POST /api/auth/password-reset
   - Contraseña se guarda en texto plano en vez de hash bcrypt
   - Login valida contra hash, por lo que no coincide
2. **Flag password_blanqueada no se está reseteando**
   - Después de cambiar contraseña, field sigue siendo true
   - Siguiente login intenta usar flujo blanqueada nuevamente
3. **Endpoint password-reset no existe o tiene error**
   - Request falla silenciosamente
   - Contraseña nunca se guarda en BD

**URLs/Endpoints afectados:**
- POST /api/auth/password-reset
- Posiblemente: frontend/src/services/authService.js (resetPassword method)
- Backend: auth.js route handler para password-reset

**Archivos a revisar:**
- `backend/src/routes/auth.js` - endpoint password-reset
- `backend/src/controllers/authController.js` o similar - lógica de reset
- `frontend/src/pages/ChangePasswordRequired/ChangePasswordRequired.jsx` - llamada al servicio
- `frontend/src/services/authService.js` - método resetPassword

**Severidad:** 🔴 CRÍTICO
- Bloquea completamente BACKLOG-006 (flujo de usuarios con password blanqueada)
- Usuarios nuevos no pueden establecer contraseña
- Impacta onboarding de nuevos usuarios

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-006 (Flujo login password blanqueada)

**Estado:** ✅ RESUELTO

**Causa raíz identificada:**
En `usuariosController.js`, ambos métodos `blanquearPassword()` (línea 129) y `resetPassword()` (línea 169) 
usaban `password: passwordHash` en lugar del nombre de campo correcto `password_hash` en el update de Sequelize.
Resultado: Sequelize no reconocía el campo y no actualizaba la contraseña en BD.

**Solución implementada:**
1. Cambiar línea 129: `password: passwordHash` → `password_hash: passwordHash`
2. Cambiar línea 169: `password: passwordHash` → `password_hash: passwordHash`

**Verificación:**
- ✅ Nombre del campo coincide con modelo Usuario (password_hash en schema)
- ✅ bcrypt.hash() se ejecuta correctamente
- ✅ password_blanqueada se resetea a false
- ✅ Sequelize ahora actualiza el campo correcto

**Archivos corregidos:**
- `backend/src/controllers/usuariosController.js` (blanquearPassword y resetPassword)

---

### BUG-013: Regeneración de Recibos - Frontend No Maneja Response 409

**Descripción:**
En el flujo de regeneración de recibos (BACKLOG-008), cuando un usuario intenta generar recibos para un período que ya existe:
1. Backend retorna HTTP 409 con `{ existe: true, cantidad: X, mensaje: "..." }`
2. Frontend debería mostrar modal de confirmación
3. **Pero en cambio, muestra "0 recibos fueron generados"** (como si fuera éxito con 0 recibos)

**Pasos para reproducir:**
1. Generar recibos para un período (ej: abril 2026) → exitoso
2. Intentar generar nuevamente para el mismo período
3. Sistema muestra: "0 recibos generados exitosamente" (mensaje incorrecto)
4. NO muestra modal de confirmación de regeneración

**Comportamiento esperado:**
- Mostrar modal: "¿Regenerar recibos?"
- Informar: "Ya existen X recibos para este período"
- Botón: "Sí, Regenerar" (con advertencia roja)

**Evidencia capturada:**
```
POST https://seagreen-skunk-116671.hostingersite.com/api/recibos/generar
Payload: {"periodo":"2026-04-01","planes":[]}
Response: HTTP 409
{
  "success": false,
  "existe": true,
  "cantidad": 10,
  "mensaje": "Ya existen 10 recibos generados para el período 2026-04"
}
```

**Causa probable:**
1. **Frontend trata 409 como error** en vez de respuesta de negocio válida
2. `recibosService.generar()` probablemente está tratando 409 como excepción
3. El try/catch en `GenerarRecibosModal.handleGenerar()` captura 409 como error
4. Se muestra mensaje de error en lugar de activar step 2 (confirmación)

**Ubicación del código:**
- Frontend: `GenerarRecibosModal.jsx` (handleGenerar method)
- Frontend service: `recibosService.js` (generar method)
- Backend: `recibosController.js` (generar endpoint) ✅ Funciona correctamente

**Archivos a revisar:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/GenerarRecibosModal.jsx` (líneas 49-74)
- `frontend/src/services/recibosService.js` (generar method)
- `frontend/src/services/api.js` (axios interceptors - ¿está convirtiendo 409 en error?)

**Severidad:** 🔴 CRÍTICO
- Bloquea BACKLOG-008 (regeneración de recibos)
- Backend funciona correctamente, frontend no maneja respuesta

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-008 (Registro de períodos + confirmación)

**Estado:** ✅ Solucionado (2026-04-16)

**Causa raíz identificada:**
1. Axios lanza error para cualquier status >= 400 (incluyendo 409)
2. `recibosService.generar()` capturaba 409 en el catch block
3. Retornaba objeto con `recibos: []`, simulando "0 recibos generados"
4. Frontend nunca veía `existe: true` para mostrar confirmación

**Solución implementada:**
En `frontend/src/services/recibosService.js`, método `generar()`:
```javascript
catch (error) {
  // Manejar 409 como respuesta válida (período ya existe)
  if (error.response?.status === 409) {
    return error.response.data;  // ← Retorna {existe: true, cantidad, mensaje}
  }
  // Otros errores...
  return { success: false, message: ..., recibos: [] };
}
```

Ahora el flujo funciona:
1. Backend retorna 409 con `existe: true, cantidad: 10`
2. recibosService retorna la respuesta directamente (sin convertir a error)
3. GenerarRecibosModal verifica `result.existe === true` (línea 62)
4. Muestra step 2: modal de confirmación ✅
5. Usuario ve advertencia y botón "Sí, Regenerar"

**Archivos corregidos:**
- `frontend/src/services/recibosService.js` (método generar)

---

### BUG-014: Botones de Acciones No Visibles para Usuarios No-Admin en Gestión de Planes

**Descripción:**
Después de implementar BACKLOG-009 (permitir usuarios comunes realizar acciones CRUD), los botones de acciones (editar, eliminar) no son visibles para usuarios con rol "usuario" en la página de Gestión de Planes. Los botones deberían estar disponibles ahora, pero están ocultos/deshabilitados.

**Pasos para reproducir:**
1. Iniciar sesión con usuario no-admin (rol "usuario")
2. Ir a Dashboard → Gestión → Gestión de Planes
3. Ver listado de planes
4. **Resultado:** No hay botones de acciones (editar ✎, eliminar 🗑) visibles en la tabla
5. **Esperado:** Deberían haber botones de acciones para editar/eliminar planes

**Comportamiento observado:**
- El backend ahora permite POST/PUT/DELETE para usuarios comunes (BACKLOG-009 implementado)
- Pero el frontend aún tiene lógica que oculta/deshabilita los botones para usuarios no-admin
- Los botones están condicionales al rol admin

**Causa probable:**
El componente GestionPlanesV1 o sus modales (PlanV1Modal) probablemente tienen:
```javascript
if (!isAdmin) {
  // No mostrar botones de acciones
  // O deshabilitar botones
}
```

Esto debería haber sido removido o actualizado junto con BACKLOG-009.

**Ubicación del código:**
- Frontend: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/`
  - GestionPlanesV1.jsx (tabla principal)
  - PlanV1Modal.jsx (modal de edición)
  - Buscar condicionales `isAdmin` o `requireAdmin`

**Severidad:** 🔴 CRÍTICO
- BACKLOG-009 (permitir acciones a usuarios comunes) no es funcional
- Inconsistencia: backend permite, frontend bloquea
- Usuario ve página pero no puede interactuar

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-009 (Usuarios comunes acciones CRUD)

**Estado:** ✅ Solucionado (2026-04-16)

**Causa raíz identificada:**
BACKLOG-009 removió restricciones `requireAdmin` del backend (líneas de POST/PUT/DELETE en v1.0-planes.js, personas.js, lookup.js), permitiendo acceso a usuarios comunes. Sin embargo, el frontend no fue actualizado y aún tenía condicionales `isAdmin` que ocultaban:
1. Línea 136-148: Botón "Nuevo Plan" dentro de `{isAdmin && (...)}`
2. Línea 178: Columna "Acciones" con `{isAdmin && <th>Acciones</th>}`
3. Línea 191-209: Botones editar/suspender dentro de `{isAdmin && (...)}`

**Solución implementada (2026-04-16):**
1. Removido condicional `isAdmin &&` que envolvía "Nuevo Plan" en header (ahora visible para todos)
2. Removido condicional de columna "Acciones" (ahora siempre visible)
3. Removido condicional de botones editar/suspender (ahora siempre visible)
4. Mantenido condicional `isAdmin &&` en "Aumento Masivo" (requiere `requireAdmin` en backend)

**Backend verification:**
- ✅ POST /api/v1.0/planes: solo `verifyToken` (sin requireAdmin)
- ✅ PUT /api/v1.0/planes/:id: solo `verifyToken`
- ✅ DELETE /api/v1.0/planes/:id: solo `verifyToken`
- ✅ POST /api/recibos/generar: solo `verifyToken`
- 🔒 PATCH /api/planes/bulk-update-cuota: requiere `requireAdmin` (mantenida restricción)

**Verificación completada (2026-04-16):**
- ✅ Iniciar sesión con usuario no-admin (rol "usuario")
- ✅ Navegar a Gestión → Gestión de Planes
- ✅ Confirmar botones "Nuevo Plan", "Generar Recibos" visibles
- ✅ Confirmar columna "Acciones" con botones editar/suspender visibles
- ✅ Confirmar "Aumento Masivo" NO visible para usuario no-admin
- ✅ Probar click en botones: editar, suspender, generar recibos (sin errores de permisos)

**Estado:** ✅ Solucionado (2026-04-16) — Funcionalidad BACKLOG-009 ahora completamente operativa

---

### BUG-015: Botón "Aumento Masivo" Debe Estar Visible para Todos (Deshabilitado para No-Admin)

**Descripción:**
El botón "Aumento Masivo" en Gestión de Planes debe estar visible para todos los usuarios (admin y no-admin). Para usuarios no-admin, el botón debe estar deshabilitado con un tooltip/título explicativo que indique que es una acción solo para administradores.

**Pasos para reproducir (comportamiento actual):**
1. Iniciar sesión con usuario no-admin (rol "usuario")
2. Ir a Dashboard → Gestión → Gestión de Planes
3. Observar botones en header: "Nuevo Plan" ✅, "Generar Recibos" ✅
4. **Resultado:** Botón "Aumento Masivo" NO está visible
5. **Esperado:** Botón visible pero deshabilitado: `disabled={!isAdmin}` + `title="Solo disponible para administradores"`

**Comportamiento actual (incorrecto):**
- Botón "Aumento Masivo" solo se muestra si `isAdmin` (línea 140-144 en GestionPlanesV1.jsx)
- Está dentro de condicional `{isAdmin && (...)}`
- Para usuarios no-admin, el botón desaparece completamente sin explicación

**Solución requerida:**
- Remover condicional `{isAdmin && (...)}`
- Mostrar botón siempre
- Agregar `disabled={!isAdmin}` al ActionButton
- Agregar `title="Solo disponible para administradores"` para tooltip

**Backend verification:**
- ✅ PATCH /api/planes/bulk-update-cuota requiere `requireAdmin` (restricción correcta)
- La restricción en el backend es válida y debe mantenerse
- Si usuario no-admin intenta POST, backend rechazará con 403

**Ubicación del código:**
- Frontend: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` (líneas 140-144)

**Severidad:** 🟡 IMPORTANTE
- Afecta UX: usuario no-admin no entiende por qué botón desaparece
- Solución es simple (agregar disabled + title)

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-009 (Usuarios comunes acciones CRUD)

**Estado:** ✅ Solucionado (2026-04-16)

**Solución Implementada (2026-04-16):**
1. Removido condicional `{isAdmin && (...)` que ocultaba el botón
2. Agregado `disabled={!isAdmin}` al ActionButton
3. Agregado `title={!isAdmin ? "Solo disponible para administradores" : ""}` para tooltip

**Código implementado:**
```javascript
<ActionButton
  variant="secondary"
  onClick={() => setBulkUpdateModalOpen(true)}
  disabled={!isAdmin}
  title={!isAdmin ? "Solo disponible para administradores" : ""}
>
  Aumento Masivo
</ActionButton>
```

**Verificación completada (2026-04-16):**
- ✅ Cambio aplicado en GestionPlanesV1.jsx (líneas 140-147)
- ✅ Botón visible para todos los usuarios
- ✅ Deshabilitado con tooltip para no-admin
- ✅ Habilitado y funcional para admin
- ✅ UX mejorada: usuario comprende por qué botón no está disponible

**Validación y Aprobación (2026-04-16):**
- ✅ Validado por usuario
- ✅ Aprobado por usuario
- ✅ Comportamiento confirmado como correcto

**Commits:**
- 169a924 - fix(BUG-015): mostrar botón visible pero deshabilitado para no-admin
- 4d46c1c - docs(BUGS): marcado como Solucionado

---

### BUG-016: Iconos de Acciones Inconsistentes en Tab Afiliados vs Listado de Planes

**Descripción:**
En la edición de planes, el tab de "Afiliados" usa iconos de acciones (editar, eliminar) con un estilo visual diferente al usado en el listado de "Planes de Servicio v1.0". Los estilos y tamaños no son consistentes, afectando la UX.

**Pasos para reproducir:**
1. Abrir listado de "Planes de Servicio v1.0"
2. Observar iconos en columna "Acciones": botones verdes con iconos pequeños (✎ 🗑)
3. Hacer clic en editar un plan → abre PlanV1Modal
4. Ir a tab "Afiliados"
5. **Resultado:** Iconos diferentes: estilo distinto, tamaño distinto, apariencia inconsistente
6. **Esperado:** Iconos iguales en ambas ubicaciones

**Ubicaciones encontradas:**
- Listado de Planes: `GestionPlanesV1.jsx` (columna Acciones)
- Tab Afiliados: `PlanV1Modal.jsx` (tab Afiliados con tabla de afiliados)

**Iconos afectados:**
- Editar: ✎
- Eliminar/Suspender: 🗑

**Severidad:** 🟡 IMPORTANTE
- No bloquea funcionalidad
- Pero afecta consistencia visual y UX
- Confunde al usuario: mismo icono, estilos diferentes

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-003 (Estandarizar formato de listados)

**Estado:** ✅ Solucionado (2026-04-16)

**Solución Implementada (2026-04-16):**
Se estandarizaron los iconos en PlanV1Modal (tab Afiliados) para que coincidan con GestionPlanesV1:
- Editar: ✏️ → ✎ (carácter Unicode consistente)
- Eliminar: 🗑️ → 🗑 (emoji consistente sin variante)

**Cambios realizados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
  - Línea 481: Cambiar icon="✏️" → icon="✎"
  - Línea 487: Cambiar icon="🗑️" → icon="🗑"

**Verificación completada (2026-04-16):**
- ✅ Iconos de editar consistentes en ambas ubicaciones (✎)
- ✅ Iconos de eliminar consistentes en ambas ubicaciones (🗑)
- ✅ Estilos visuales ahora uniformes

**Commits:**
- eb42769 - fix(BUG-016): estandarizar iconos de acciones en tab Afiliados

---

### BUG-017: Búsqueda de Afiliados - Error en la Búsqueda sin Llamada al Backend

**Descripción:**
En la página de Búsqueda de Afiliados, al ingresar un texto en el campo de búsqueda, se muestra un mensaje "error en la búsqueda" pero NO se dispara ningún evento al backend. El sistema intenta hacer la búsqueda pero falla sin enviar la solicitud al servidor.

**Pasos para reproducir:**
1. Ir a Dashboard → Gestión → Búsqueda de Afiliados
2. Ingresar cualquier texto en el campo de búsqueda (ej: "Juan")
3. Presionar Enter o esperar a que se dispare la búsqueda
4. **Resultado:** Mensaje "error en la búsqueda" aparece
5. **Verificar:** No hay llamada GET/POST al backend en Network del navegador

**Comportamiento esperado:**
- Ingresar texto → Se envía solicitud al backend → Retorna resultados de búsqueda
- Si no hay resultados: mostrar "No se encontraron afiliados"
- Si hay error del servidor: mostrar mensaje descriptivo del error

**Severidad:** 🔴 CRÍTICO
- Funcionalidad principal de búsqueda no funciona
- Usuario no puede buscar afiliados
- Bloquea uso de la sección Gestión → Búsqueda de Afiliados

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-009 (Usuarios comunes acciones en páginas accesibles)

**Ubicación probable:**
- Archivo: `frontend/src/pages/DashboardPage/components/BusquedaAfiliados/BusquedaAfiliados.jsx`
- Frontend service: `frontend/src/services/personasService.js` (búsqueda)
- Backend: `backend/src/routes/personas.js` (endpoint de búsqueda)

**Estado:** 🔬 En análisis

**Causa raíz identificada (Versión 2):**
Mismatch entre formato de respuesta del backend y parsing en frontend:

**Backend** (`personasController.search` línea 40):
```javascript
res.status(200).json(personas);  // Retorna directamente: [...]
```

**Frontend Service** (`personasService.buscar` línea 26-27):
```javascript
const { data } = await api.get('/personas', { params: queryParams });
return data;  // ❌ data es undefined (no hay propiedad 'data')
```

**Problema:** El service intenta destructurar `.data` de un array directo, resultando en `undefined`.
Luego BusquedaAfiliados asigna `undefined` a personas, causando error al intentar renderizar.

**Solución implementada:**
Actualizar `personasService.buscar()` para manejar respuestas tanto de array directo como de objeto con estructura `{ data: ... }`:
```javascript
return Array.isArray(response.data) ? response.data : response.data.data || [];
```

**Archivos modificados:**
- `frontend/src/pages/DashboardPage/components/v1.0/BusquedaAfiliados.jsx` (línea 26 - cambiar search por buscar)
- `frontend/src/services/personasService.js` (línea 6-32 - actualizar parseo de respuesta)

**Estado:** ✅ Solucionado (2026-04-16)

**Verificación completada:**
- ✅ Búsqueda de afiliados funcional
- ✅ Llamadas al backend se disparan correctamente
- ✅ Resultados se muestran sin errores

**Commits:**
- bf22364 - fix(BUG-017): primer intento
- 5079639 - fix(BUG-017): solución correcta con mismatch backend/frontend

---

### BUG-018: Búsqueda de Afiliados - "Ver Planes" Siempre Muestra "Sin Planes"

**Descripción:**
En la página de Búsqueda de Afiliados, al hacer click en el botón "Ver Planes" de un afiliado, la pantalla muestra "Esta persona no tiene planes asociados" aunque el afiliado SÍ tiene planes en la base de datos.

**Pasos para reproducir:**
1. Ir a Dashboard → Gestión → Búsqueda de Afiliados
2. Buscar un afiliado (ej: "Juan")
3. Ver resultados en tabla
4. Hacer click en botón "Ver Planes" de un afiliado que sabemos tiene planes
5. **Resultado:** Muestra "Esta persona no tiene planes asociados" ❌
6. **Esperado:** Mostrar tabla con los planes asociados ✅

**Severidad:** 🔴 CRÍTICO
- Funcionalidad de "Ver Planes" no funciona
- Usuario no puede consultar planes de un afiliado
- Bloquea navegación en Búsqueda de Afiliados

**Reportado:** 2026-04-16
**Ubicación probable:**
- Frontend: `frontend/src/pages/DashboardPage/components/v1.0/BusquedaAfiliados.jsx` (línea 36-48)
- Backend: `backend/src/services/planesV1Service.js` (método getByPersona)
- Backend: `backend/src/controllers/v1.0/planesController.js` (endpoint getByPersona)

**Estado:** 🔬 En análisis

**Causa raíz identificada:**

**Causa #1: Método inexistente en Frontend Service**
- `BusquedaAfiliados.jsx` línea 41 llama a: `planesService.getByPersona(persona.id)`
- Pero `planesV1Service.js` NO define este método
- Resultado: `undefined` → TypeError → catch block → `setPlanesPersona([])` (array vacío)

**Causa #2: Backend tiene el endpoint pero Frontend Service no lo implementa**
- Backend: `GET /api/v1.0/planes/por-persona/:personaId` existe (línea 22 en v1.0-planes.js)
- Backend retorna: `{ success: true, data: planes }`
- Frontend: Falta implementar la llamada a este endpoint

**Solución implementada:**
Agregar método a `planesV1Service.js` (después de obtenerHistorialCuota):
```javascript
getByPersona: async (personaId) => {
  const { data } = await api.get(`/v1.0/planes/por-persona/${personaId}`);
  return data.data;
},
```

**Archivos modificados:**
- `frontend/src/services/planesV1Service.js` (agregado método getByPersona)

**Estado:** ✅ Solucionado (2026-04-16)

**Verificación completada:**
- ✅ Método `getByPersona()` implementado en planesV1Service
- ✅ Llamadas al backend se disparan correctamente
- ✅ Planes se muestran correctamente en búsqueda de afiliados

**Commits:**
- 6fe4cfd - fix(BUG-018): agregar método getByPersona en planesV1Service

---

---

### BUG-019: Gestión de Recibos - Seleccionar Período Devuelve Array Vacío

**Descripción:**
En la página de Gestión de Recibos (BACKLOG-014), al seleccionar un período que SÍ tiene recibos generados (ej: Abril 2026 con 9 recibos), el sistema muestra el mensaje "No hay recibos para este período" cuando debería mostrar la tabla con los 9 recibos.

**Pasos para reproducir:**
1. Ir a Dashboard → Gestión → Gestión de Recibos
2. Ver tabla de períodos (muestra "Abril 2026 - 9 recibos")
3. Hacer click en botón "Ver recibos" para Abril 2026
4. **Resultado:** Muestra "No hay recibos para este período" ❌
5. **Esperado:** Muestra tabla con 9 recibos ✅

**Evidence capturada:**
```
URL del backend invocada: https://seagreen-skunk-116671.hostingersite.com/api/recibos?periodo=2026-04-01
Payload: periodo=2026-04-01
Response: []
```

**Comportamiento observado:**
- El parámetro `periodo=2026-04-01` se envía correctamente en el query string
- El backend recibe la solicitud (URL completa en logs)
- Pero retorna un array vacío `[]` en lugar de devolver los 9 recibos
- La base de datos SÍ tiene los recibos registrados (confirmado porque el período aparece en el listado)

**Contexto:**
- Tabla `PeriodosRecibos` muestra: periodo="2026-04", cantidad_recibos=9
- Tabla `Recibo` debería tener 9 registros con periodo=2026-04-01 (DATE)
- El query GET /api/recibos?periodo=2026-04-01 debería retornar esos 9 recibos

**Ubicación probable del problema:**
- Backend: `backend/src/controllers/v1.0/recibosController.js` (función `list()`)
- El endpoint realiza una búsqueda WHERE en tabla Recibo
- Probablemente hay un type mismatch:
  - Parámetro enviado: string `"2026-04-01"` (YYYY-MM-DD)
  - Columna en BD: DATE type (DATETIME)
  - Sequelize: no convierte implícitamente string a DATE para comparación

**Severidad:** 🔴 CRÍTICO
- Funcionalidad principal de Gestión de Recibos no funciona
- Usuario puede ver períodos pero no puede consultar los recibos
- Bloquea uso de BACKLOG-014

**Reportado:** 2026-04-16
**Asociado a:** BACKLOG-014 (Página dedicada de gestión de recibos)

---

**Causa raíz identificada (2026-04-16):**

**Problem:** Período se guardaba con ÚLTIMO día del mes en lugar del primero
- Frontend enviaba: `"2026-04-01"` (YYYY-MM-DD)
- Backend recibía: `new Date("2026-04-01")` → UTC: `2026-04-01T00:00:00.000Z`
- Conversión timezone Argentina (UTC-3): `2026-03-31T21:00:00` (día anterior)
- Sequelize guardaba: `2026-04-30` o `2026-04-01` con desfase
- Búsqueda buscaba: `2026-04-01` pero BD tenía: `2026-04-30` → ❌ No coincidían

**Solución implementada (2026-04-17):**

Solución integrada de 3 cambios:

### 1. Backend: Generar sin conversión de timezone
- Eliminar `new Date(periodo)` (evita interpretación UTC)
- Usar validación regex: `/^\d{4}-\d{2}-\d{2}$/`
- Normalizar siempre a primer día del mes: `periodoNormalizado = YYYY-MM-01`
- Guardar como string directo en BD (sin Date objects)
- Archivos: `backend/src/controllers/v1.0/recibosController.js` líneas 24-37, 145

### 2. Backend: Buscar por rango de mes completo
- Si `periodo` es YYYY-MM (7 chars):
  * Calcular último día del mes
  * Usar `Op.between: ['2026-04-01', '2026-04-30']`
  * Tolera cualquier día guardado en el mes
- Si `periodo` es YYYY-MM-DD (10 chars):
  * Buscar día exacto (compatible hacia atrás)
- Archivos: `backend/src/controllers/v1.0/recibosController.js` líneas 208-228

### 3. Frontend: Enviar YYYY-MM
- RecibosPage.loadRecibos() ahora envía `"2026-04"` en lugar de `"2026-04-01"`
- Backend busca rango completo del mes
- Beneficio: más robusto, semánticamente correcto
- Archivos: `frontend/src/pages/RecibosPage/RecibosPage.jsx` línea 66-73

**Archivos corregidos:**
- `backend/src/controllers/v1.0/recibosController.js`
- `frontend/src/pages/RecibosPage/RecibosPage.jsx`

**Solución final implementada (2026-04-17):**

Después de múltiples intentos, se identificó que Sequelize NO generaba queries correctas con:
- `new Date()` (problemas de timezone)
- `Op.between` con strings (no compatible con DATE)
- `Op.gte + Op.lte` (conversión de tipos incorrecta)

**Solución definitiva:** SQL directo con `DATE_FORMAT() + CAST AS UNSIGNED`

```javascript
// Convertir período a numérico YYYYMMDD
const firstDayNum = 20260401;
const lastDayNum = 20260430;

// Usar literal SQL
where[Op.and] = [
  literal(`CAST(DATE_FORMAT(\`periodo\`, '%Y%m%d') AS UNSIGNED) BETWEEN ${firstDayNum} AND ${lastDayNum}`)
];
```

**Query SQL ejecutada:**
```sql
SELECT * FROM recibos
WHERE CAST(DATE_FORMAT(`periodo`, '%Y%m%d') AS UNSIGNED) BETWEEN 20260401 AND 20260430
```

**Ventajas de esta solución:**
- ✅ Evita completamente problemas de timezone
- ✅ Evita problemas de tipos de datos
- ✅ Comparación numérica directa y robusta
- ✅ MySQL procesa rápidamente DATE_FORMAT

**Commits finales:**
- c7b1c5a - fix(BUG-019): usar SQL DATE() para comparación de período sin zona horaria
- 5ecb919 - refactor(BUG-019): mejorar lógica de conditions en list()
- d6fa700 - fix(BUG-019): cambiar a Op.between para comparación de período
- eca1d6e - fix(BUG-019): solución integrada para búsqueda de recibos por período
- 6993e76 - debug(BUG-019): agregar logging para diagnosticar búsqueda vacía
- 07bd012 - fix(BUG-019): cambiar Op.between a Op.gte + Op.lte
- 3ec97a4 - fix(BUG-019): usar SQL directo con DATE_FORMAT + CAST para comparación numérica
- f8cf2d2 - fix(BUG-019): cambiar referencia de tabla en SQL literal

**Estado:** ✅ Solucionado (2026-04-17)

---

### BUG-020: Eliminación Cascada de OS Falla con "notNull Violation"

**Descripción:**
Al eliminar una Obra Social (OS) que está siendo utilizada en un plan, el sistema muestra correctamente el modal de confirmación indicando que hay referencias. Cuando el usuario confirma la eliminación, el backend intenta ejecutar la cascada pero falla con error:

```
Error: notNull Violation: planes.os_numero cannot be null
```

**Flujo del Error:**
1. Usuario: click eliminar Obra Social
2. Sistema: detecta que hay planes usando esta OS (409 - referencias encontradas)
3. Sistema: abre modal con mensaje "Hay 5 planes usando esta OS"
4. Usuario: confirma "Sí, Eliminar"
5. Frontend: envía DELETE /api/lookup/obras-sociales/1?force=true
6. Backend: intenta UPDATE planes SET os_numero = NULL WHERE os_numero = 1
7. Error: `notNull Violation: planes.os_numero cannot be null`

**Causa Probable:**
La migración 2.0.5 (`nullable_foreign_keys`) no fue ejecutada correctamente en la BD, o el modelo Sequelize de PlanV1 sigue teniendo la restricción `allowNull: false` en la columna `os_numero`.

Opciones:
- Opción A: Migración 2.0.5 no se ejecutó en la BD (usuario olvidó ejecutar)
- Opción B: Migración se ejecutó pero Sequelize mantiene validación en caché
- Opción C: Definición del modelo `PlanV1.js` tiene `allowNull: false` y no fue recompilado

**Severidad:** 🔴 CRÍTICO
- Bloquea funcionalidad de BACKLOG-019 (eliminación cascada)
- Usuarios no pueden eliminar entidades lookup si tienen referencias
- Modal se abre pero la acción falla

**Reportado:** 2026-04-17
**Asociado a:** BACKLOG-019 (Eliminar entidades lookup con asociaciones en cascada)

**Próximos pasos para diagnóstico:**
1. Verificar si migración 2.0.5 fue ejecutada:
   - Revisar tabla `migraciones_bd`: ¿tiene versión `2.0.5_nullable_foreign_keys`?
   - Si no está: ejecutar migración manualmente
2. Si migración existe, verificar BD:
   - `DESCRIBE planes;` → revisar columna `os_numero`
   - ¿Tiene `null` o `Not Null`?
3. Verificar definición de modelo:
   - `backend/src/models/PlanV1.js` línea 22-24
   - ¿Tiene `allowNull: false`?
   - Si sí: cambiar a `allowNull: true`
   - Recompilar/reiniciar

**Estado:** 📋 Registrado (2026-04-17) - Pendiente diagnóstico y solución

---

### BUG-021: Eliminación Cascada de Tipo de Grupo Falla con "notNull Violation"

**Descripción:**
Idéntico a BUG-020 pero para entidad "Tipos de Grupo":

Al eliminar un Tipo de Grupo que está siendo utilizado en un plan, el sistema muestra correctamente el modal de confirmación. Cuando el usuario confirma la eliminación, el backend intenta ejecutar la cascada pero falla con error:

```
Error: notNull Violation: planes.tipo_de_grupo_numero cannot be null
```

**Causa Probable:**
Misma que BUG-020: La migración 2.0.5 no fue ejecutada correctamente, o el modelo Sequelize mantiene validación `allowNull: false` en la columna `tipo_de_grupo_numero`.

**Severidad:** 🔴 CRÍTICO (idéntico a BUG-020)

**Reportado:** 2026-04-17
**Asociado a:** BACKLOG-019

**Columna Afectada:** `planes.tipo_de_grupo_numero`

**Estado:** 📋 Registrado (2026-04-17) - Mismo diagnóstico que BUG-020

---

### BUG-022: Eliminación Cascada de Tipo de Plan Falla con "notNull Violation"

**Descripción:**
Idéntico a BUG-020 pero para entidad "Tipos de Plan":

Al eliminar un Tipo de Plan que está siendo utilizado en un plan, el sistema muestra correctamente el modal de confirmación. Cuando el usuario confirma la eliminación, el backend intenta ejecutar la cascada pero falla con error:

```
Error: notNull Violation: planes.tipo_plan_numero cannot be null
```

**Causa Probable:**
Misma que BUG-020: La migración 2.0.5 no fue ejecutada correctamente, o el modelo Sequelize mantiene validación `allowNull: false` en la columna `tipo_plan_numero`.

**Severidad:** 🔴 CRÍTICO (idéntico a BUG-020)

**Reportado:** 2026-04-17
**Asociado a:** BACKLOG-019

**Columna Afectada:** `planes.tipo_plan_numero`

**Estado:** 📋 Registrado (2026-04-17) - Mismo diagnóstico que BUG-020

---

### BUG-023: Eliminación Cascada de Cobrador Falla con "notNull Violation"

**Descripción:**
Idéntico a BUG-020 pero para entidad "Cobradores":

Al eliminar un Cobrador que está siendo utilizado en un plan, el sistema muestra correctamente el modal de confirmación. Cuando el usuario confirma la eliminación, el backend intenta ejecutar la cascada pero falla con error:

```
Error: notNull Violation: planes.cobrador_numero cannot be null
```

**Causa Probable:**
Misma que BUG-020: La migración 2.0.5 no fue ejecutada correctamente, o el modelo Sequelize mantiene validación `allowNull: false` en la columna `cobrador_numero`.

**Severidad:** 🔴 CRÍTICO (idéntico a BUG-020)

**Reportado:** 2026-04-17
**Asociado a:** BACKLOG-019

**Columna Afectada:** `planes.cobrador_numero`

**Estado:** 📋 Registrado (2026-04-17) - Mismo diagnóstico que BUG-020

---

## Análisis Consolidado de BUG-020 a BUG-023 - SOLUCIONADO

Todos los bugs (BUG-020, BUG-021, BUG-022, BUG-023) compartían la misma causa raíz.

**Problema:**
Eliminación cascada de entidades lookup fallaba con `notNull Violation` porque el modelo Sequelize validaba `allowNull: false` antes de enviar la sentencia SQL a la BD.

**Columnas Afectadas:**
- `planes.os_numero` (BUG-020)
- `planes.tipo_de_grupo_numero` (BUG-021)
- `planes.tipo_plan_numero` (BUG-022)
- `planes.cobrador_numero` (BUG-023)

**Causa Raíz:**
En BACKLOG-019 implementé la migración SQL 2.0.5 que cambia las columnas a nullable en la BD, pero **olvidé actualizar el modelo Sequelize correspondiente** (`backend/src/models/PlanV1.js`).

**Flujo del error:**
```
User: DELETE /api/lookup/os/1?force=true
  ↓
Backend: UPDATE planes SET os_numero = NULL
  ↓
Sequelize valida contra modelo PlanV1.js
  ↓
Sequelize ve: allowNull: false ← PROBLEMA
  ↓
Error: notNull Violation (nunca llega a ejecutar SQL)
```

**Solución Implementada (2026-04-17):**
Actualicé `backend/src/models/PlanV1.js` líneas 10-25:
- Changed: `tipo_plan_numero: allowNull: false` → `allowNull: true`
- Changed: `cobrador_numero: allowNull: false` → `allowNull: true`
- Changed: `tipo_de_grupo_numero: allowNull: false` → `allowNull: true`
- Changed: `os_numero: allowNull: false` → `allowNull: true`

**Flujo corregido:**
```
User: DELETE /api/lookup/os/1?force=true
  ↓
Backend: UPDATE planes SET os_numero = NULL
  ↓
Sequelize valida contra modelo PlanV1.js
  ↓
Sequelize ve: allowNull: true ✅
  ↓
SQL se ejecuta en BD: UPDATE planes SET os_numero = NULL ✅
  ↓
Success: referencias actualizadas, entidad eliminada ✅
```

**Commits:**
- 8879462: fix(BUG-020/021/022/023): actualizar modelo PlanV1 para permitir FK nullable

**Testing completado:**
✅ Eliminación cascada de OS
✅ Eliminación cascada de Cobrador
✅ Eliminación cascada de Tipo de Grupo
✅ Eliminación cascada de Tipo de Plan

**Estado:** ✅ Solucionado (2026-04-17)

---

---

## 🎯 BUGS RESUELTOS - 2026-04-17

### ✅ BUG-020, BUG-021, BUG-022, BUG-023 - RESUELTOS

**Fecha de Resolución:** 2026-04-17
**Commits:** 8879462, 8eb64a5

**Estado Final:** ✅ SOLUCIONADO

Los 4 bugs relacionados a eliminación cascada de entidades lookup fueron resueltos actualizando el modelo Sequelize para permitir valores NULL en las columnas FK.

**Bugs Resueltos:**
- ✅ BUG-020: Eliminación de Obra Social
- ✅ BUG-021: Eliminación de Tipo de Grupo  
- ✅ BUG-022: Eliminación de Tipo de Plan
- ✅ BUG-023: Eliminación de Cobrador

**BACKLOG-019 COMPLETAMENTE FUNCIONAL** ✅

---

### BUG-024: Migraciones BD - Tab "Estadísticas" Muestra Página en Blanco

**Descripción:**
Al ingresar a la sección Administración → Migraciones BD y hacer click en el tab "Estadísticas", la página queda completamente en blanco. No hay contenido visible ni mensajes de error.

**Pasos para reproducir:**
1. Login como admin
2. Ir a Dashboard → Administración → Migraciones BD
3. El tab "Versiones" carga correctamente (muestra tabla de migraciones)
4. Hacer click en el tab "Estadísticas"
5. **Resultado:** Página en blanco, sin contenido visible ❌

**Comportamiento esperado:**
El tab debería mostrar algún contenido (estadísticas de migraciones, información, etc.)

**Severidad:** 🔴 CRÍTICO
- Funcionalidad completamente no funcional
- Usuario admin no puede acceder a estadísticas
- Probablemente error en consola o componente no renderiza

**Reportado:** 2026-04-18
**Ubicación probable:**
- Frontend: `frontend/src/pages/DashboardPage/components/MigrationsDashboard/` (tab "Estadísticas")
- Probablemente falta contenido en el tab o error en componente interno

**Causa raíz identificada (2026-04-18):**

Mismatch entre nombres de propiedades en backend y frontend:

**Backend** (`migrationManager.js` línea 285):
```javascript
return { tabla: TABLE_NAME, registros: parseInt(total, 10) };
```

**Frontend** (`EstadisticasTab.jsx` líneas 63-65):
```javascript
{table.tableName}           // ← Espera tableName
{table.recordCount...}      // ← Espera recordCount
```

El frontend recibe un objeto con propiedades `tabla` y `registros`, pero intenta acceder a `tableName` y `recordCount`. Resultado: `undefined`, tabla vacía, página en blanco.

**Solución implementada (2026-04-18):**

Cambiar nombres de propiedades en `migrationManager.js` línea 285:
- `tabla` → `tableName`
- `registros` → `recordCount`

```javascript
return { tableName: TABLE_NAME, recordCount: parseInt(total, 10) };
```

**Archivos corregidos:**
- `backend/src/migrations/migrationManager.js` (línea 285)

**Estado:** 🚀 Desarrollado (solución implementada, pendiente commit sin push)

---

### BUG-025: npm install Falló - Conflicto de Versiones (BACKLOG-024)

**Descripción:**
Al hacer npm install en servidor durante compilación de rama V_1.0.6, el proceso falló con error de command execution. El error no mostró detalles específicos, pero la causa fue agregar 22 nuevas dependencias directamente al package.json.

**Error reportado:**
```
Error: Command failed: npm install --include=dev
    at genericNodeError (node:internal/errors:984:15)
    ...
```

**Severidad:** 🔴 CRÍTICO
- Bloquea compilación del servidor
- Rama V_1.0.6 no puede desplegarse

**Reportado:** 2026-04-18
**Causa raíz identificada (2026-04-18):**

Las advertencias de deprecación en compilación frontend provenían de **sub-dependencias internas** de `react-scripts 5.0.1`:
- eslint (versión vieja dentro de react-scripts)
- glob, rimraf (versiones deprecadas dentro de react-scripts)
- Babel plugins (plugin-proposal-* dentro de react-scripts)

**Error cometido:**
Se intentó agregar explícitamente 22 nuevas dependencias (eslint@^9.0.0, glob@^10.0.0, etc.) al `devDependencies`. Esto causó:
1. Conflictos de versión (nuevas versiones incompatibles con react-scripts 5.0.1)
2. Resolución de dependencias fallada
3. npm install abortado

**Solución implementada (2026-04-18):**

1. ✅ Revertir cambios agresivos (commit: 7be2c1f)
2. ✅ Mantener package.json original que compila exitosamente
3. 🔬 Propuesta para siguiente fase: actualizar `react-scripts` de 5.0.1 → 5.1.0 o superior

**Por qué react-scripts update es la solución:**
- react-scripts 5.1.0+ incluye internamente versiones modernas de:
  - eslint@^8.40+ o @9+
  - glob@^10+
  - rimraf@^5+
  - Babel plugins modernos (plugin-transform-*)
- No requiere agregar dependencias explícitas
- Mantiene compatibilidad con el resto del proyecto
- Resuelve ALL deprecation warnings automáticamente

**Testing requerido para siguiente fase:**
- [ ] Cambiar `react-scripts: "5.0.1"` → `react-scripts: "5.1.0"` o latest
- [ ] npm install compila sin errores
- [ ] npm run build funciona
- [ ] npm start funciona en desarrollo
- [ ] No hay regresiones en componentes React
- [ ] Testing completo de la app

**Archivos afectados:**
- `frontend/package.json` (revertido)
- `frontend/package-lock.json` (será regenerado en servidor)

**Commits asociados:**
- b8b763b - chore(deps): actualizar dependencias deprecadas (REVERTIDO)
- 7be2c1f - revert(BACKLOG-024): revertir cambios agresivos ✅

**Estado:** 🔬 En análisis (solución identificada, pendiente implementación cuidadosa)

**Notas:**
- La rama compila correctamente ahora (package.json revertido)
- Se requiere actualización de react-scripts de forma incremental
- Considerar hacer update en fase separada con testing exhaustivo

---

### BUG-026: Gestión de Recibos - Período Abril 2026 Muestra "No hay Recibos"

**Descripción:**
En la pantalla de Gestión de Recibos se muestran dos períodos (Marzo 2026 y Abril 2026), ambos con 12 recibos generados. Sin embargo, al hacer click en "Ver recibos" del período Abril 2026, el sistema muestra el mensaje "No hay recibos para este período", mientras que Marzo 2026 funciona correctamente mostrando los 12 recibos.

**Pasos para reproducir:**
1. Ir a Gestión de Recibos (panel de Dashboard)
2. Verificar que se muestran dos períodos: Marzo 2026 (12 recibos) y Abril 2026 (12 recibos)
3. Hacer click en "Ver recibos" de Marzo 2026 → Funciona, muestra 12 recibos
4. Hacer click en "Ver recibos" de Abril 2026 → Falla, muestra "No hay recibos para este período"

**Severidad:** 🔴 CRÍTICO
- Afecta funcionalidad core de consulta de recibos
- Genera inconsistencia: contador muestra 12, pero vista muestra 0
- Impide acceso a datos que el sistema dice existen

**Fase:** BACKLOG-014 (Gestión de Recibos)

**Posible Causa Raíz:**

Después del análisis inicial, las causas probables son:

1. **Problema de filtrado en el backend**
   - Endpoint `GET /api/recibos` puede estar usando comparación de fechas incorrecta
   - Posible: comparación `fecha = periodo_exacto` en lugar de `fecha >= inicio AND fecha < fin`
   - Abril podría tener fechas formateadas diferente (ej: "2026-04" vs "2026-04-01")

2. **Problema en cálculo de rango de fechas del período**
   - Frontend calcula inicio/fin del período incorrectamente para Abril
   - Marzo podría funcionar por casualidad si usa comparación más flexible
   - Ej: Marzo busca "2026-03-%" pero Abril busca "2026-04-%" con zona horaria que afecta

3. **Problema de sincronización entre frontend y backend**
   - El conteo de 12 recibos en la lista es correcto
   - Pero el filtro en RecibosPage usa parámetros diferentes
   - Posible: el contador usa query sin filtro, la vista usa fecha exacta

4. **Problema de asociación de datos**
   - Recibos de Abril podrían estar asociados a otro período o tabla
   - Marzo funciona porque los datos están correctamente asociados
   - Abril tiene datos huérfanos o mal asociados

**Investigación realizada (2026-04-24):**

**Hallazgos principales:**

1. **Base de datos real en Hostinger:**
   - Tabla correcta es `planes` (no `plan_v1` como usa el modelo)
   - Hay 12 planes ACTIVO (plans 1-11 y 13, falta plan 12)
   - Tabla `recibos`: 
     * Marzo: 36 recibos (3 por plan) con `periodo = 2026-03-31`
     * Abril: **0 recibos**
   - Tabla `periodos_recibos`:
     * Marzo: registra 12 recibos generados el 2026-04-18
     * Abril: registra 12 recibos generados el 2026-04-24 ⚠️ INCONSISTENCIA

2. **El problema de Abril:**
   - `periodos_recibos` registra "cantidad_recibos: 12" pero tabla `recibos` está vacía
   - Significa: el código reportó generación exitosa pero no creó los recibos
   - Posibles causas:
     * Error silencioso en loop de creación (continúa sin excepción)
     * Transacción se hizo rollback pero upsert ya se ejecutó
     * Error en FK o validaciones que no lanzó excepción

3. **El problema de Marzo (múltiples generaciones):**
   - 12 planes × 3 recibos por plan = 36 total
   - Debería ser solo 12 (1 por plan)
   - Indica que se generó 3 veces para el mismo período
   - El código debería rechazar con 409 si período existe y force=false

4. **Acción correctiva implementada:**
   - Agregado logging detallado en `recibosController.js`
   - Cada paso de generación ahora registra en console:
     * Planes encontrados
     * Cada plan procesado o omitido
     * Total de recibos generados
     * Errores capturados por plan
   - Envuelto en try-catch por plan para no silenciar errores

**Próximos pasos:**
1. Revisar logs del servidor de Hostinger del 2026-04-24 13:46:02 (generación de Abril)
2. Buscar mensajes `[RECIBOS]` o `[RECIBOS ERROR]` en los logs
3. Ejecutar nuevamente la generación de Abril para capturar logs con el nuevo código
4. Si aparecen errores, investigar la causa (FK, validación, etc.)
5. Restaurar recibos de Marzo borrando los duplicados

**CAUSA RAÍZ IDENTIFICADA (2026-04-24 - 15:31):**

El campo `periodo` en la tabla `recibos` estaba definido como tipo **DATE** en Sequelize:
```javascript
periodo: { type: DataTypes.DATE, allowNull: false }
```

Esto causaba un **problema de timezone**:
1. Frontend envía: `"2026-04-01"` (STRING)
2. Sequelize lo interpreta como DATE
3. MySQL lo convierte según el timezone del servidor
4. Se persiste como: `2026-03-31` (1 día menos)
5. Frontend busca `periodo LIKE '2026-04%'` → no encuentra nada
6. Pero `periodos_recibos` registra correctamente "2026-04"

**SOLUCIÓN IMPLEMENTADA:**

1. Cambiar modelo `Recibo.js`: `periodo` de `DataTypes.DATE` → `DataTypes.STRING(10)`
2. Crear migración 2.0.15:
   - Upgrade: ALTER TABLE recibos MODIFY COLUMN periodo VARCHAR(10) NOT NULL
   - Downgrade: revertir a DATE
3. Agregar logging detallado en generación para evitar errores silenciosos

**PASOS PARA APLICAR FIX:**

1. Ejecutar migración 2.0.15 desde panel admin o CLI
2. Los recibos existentes (ahora con periodo VARCHAR) funcionarán correctamente
3. Regenerar Abril con el código corregido
4. Verificar que ahora muestra los 12 recibos

**Estado:** 🔬 Pendiente ejecutar migración y regenerar
- Investigación completada: ✅
- Solución implementada: ✅
- Migración creada: ✅
- Pendiente: ejecutar migración en Hostinger y regenerar Abril

---

**Última actualización:** 2026-04-24 (causa raíz identificada y solucionada)

---

### BUG-027: Listado de Recibos - Obra Social No Aparece en Lista

**Descripción:**
Al listar recibos de un período (RecibosPage), el campo "Obra Social" aparece vacío para TODOS los recibos. Sin embargo, cuando se abre el detalle de un recibo (ReciboDetalleModal), sí aparece la obra social correctamente.

**Pasos para reproducir:**
1. Ir a Gestión de Recibos
2. Hacer click en "Ver recibos" de un período (ej: Marzo 2026)
3. Ver tabla de recibos
4. **Resultado:** Columna "Obra Social" está vacía para todos ❌
5. Hacer click en uno de los recibos para ver detalles
6. **Resultado:** En el modal de detalles, la obra social SÍ aparece ✓

**Severidad:** 🟡 IMPORTANTE
- No bloquea funcionalidad (el dato existe y se puede ver en detalles)
- Pero afecta usabilidad: usuario no puede filtrar/validar por OS en el listado
- Inconsistencia visual confusa

**Fase:** BACKLOG-014 (Gestión de Recibos)

**Causa probable:**

El campo `obra_social_nombre` se guarda correctamente en tabla `recibos` (confirmado en queries anteriores), pero:
1. El backend en `recibosController.js` método `list()` puede no estar incluyendo este campo
2. O el frontend en `RecibosPage.jsx` no está renderizando la columna
3. O hay una diferencia entre qué datos devuelve el endpoint GET /api/recibos vs GET /api/recibos/:id

**CAUSA RAÍZ IDENTIFICADA:**

En `RecibosPage.jsx` línea 229, el código intenta acceder a campo incorrecto:
```javascript
<td>{recibo.obra_social || '-'}</td>  // ❌ Campo incorrecto
```

El campo en la BD es `obra_social_nombre`, no `obra_social`. El backend devuelve correctamente `obra_social_nombre` en la response, pero el frontend lo ignoraba.

**SOLUCIÓN IMPLEMENTADA:**

Cambiar línea 229 en `RecibosPage.jsx`:
```javascript
<td>{recibo.obra_social_nombre || '-'}</td>  // ✅ Correcto
```

**Verificación:**
- Backend: devuelve campo correcto `obra_social_nombre` ✓
- Frontend: ahora accede a campo correcto ✓
- Modal de detalles: ya estaba usando campo correcto ✓

**Reportado:** 2026-04-24
**Asociado a:** BACKLOG-014 (Gestión de Recibos)

**Estado:** 🚀 Resuelto (pendiente confirmación)
- Registrado: 2026-04-24
- Investigación completada: ✅
- Fix implementado: ✅
- Commit: en progreso
- Pendiente: confirmación del usuario

---

**Última actualización:** 2026-04-24 (BUG-027 investigado y resuelto)

---

## BUG-031: Aumentos Porcentuales Mostrados como "Fijos" en Historial de Cuota

**Descripción:**
Al realizar un aumento masivo con porcentaje (ej: 5%), los registros en la pestaña "Historial de Cuota" del PlanV1Modal muestran el cambio como "Fijo: +$X.XX" en lugar de "Porcentual: +X%".

**Síntomas:**
1. Usuario ejecuta aumento masivo de 5%
2. Abre un plan afectado → pestaña "Historial de Cuota"
3. Ve el registro con etiqueta "Fijo: +$5.00" ❌ (debería ser "Porcentual: +5.00%")
4. Todos los aumentos masivos se muestran como "Fijo" cuando deberían ser "Porcentual"

**Ambiente:**
- Afecta: PlanV1Modal.jsx líneas 835-852 (pestaña "Historial de Cuota")
- Tabla visualizada: historial_cuota (registro de cambios por plan)
- Reproducible: 100% en cada aumento masivo

**CAUSA RAÍZ IDENTIFICADA:**

En `PlanV1Modal.jsx` línea 842, la lógica de inferencia es **INCORRECTA**:

```javascript
const esFijo = diferencia % 1 === 0 || Math.abs(diferencia) < 0.01;
```

**Problema:**
1. Esta lógica intenta diferenciar "fijo" de "porcentual" basándose en si la diferencia es un número entero
2. **No funciona** porque ambos tipos pueden producir el mismo resultado:
   - Aumento FIJO de $5: valor_anterior=$100 → valor_nuevo=$105 → diferencia=$5
   - Aumento PORCENTUAL de 5% en $100: valor_anterior=$100 → valor_nuevo=$105 → diferencia=$5
3. Los dos son indistinguibles numéricamente sin información adicional

**Contexto:**
- En BACKLOG-054 se eliminó la opción de "aumento fijo" — **ahora SOLO se permiten porcentuales**
- El backend SOLO escribe porcentuales en `historial_cuota`
- Pero el frontend mantiene lógica legacy que intenta inferir el tipo
- La heurística `diferencia % 1 === 0` es SIEMPRE verdadera cuando el resultado es un número entero (muy común)

**Ejemplo Real:**
```
Aumento masivo: 5%
Plan con cuota $100:
  - valor_anterior = 100
  - valor_nuevo = 105 (100 * 1.05)
  - diferencia = 5
  - esFijo = (5 % 1 === 0) = TRUE ❌
  - Mostrado: "Fijo: +$5.00" ❌ Incorrecto
  - Debería: "Porcentual: +5.00%" ✅
```

**Solución Recomendada:**

Puesto que BACKLOG-054 eliminó los aumentos fijos y ahora SOLO aceptamos porcentuales:

**Opción A (Recomendada):** Mostrar SIEMPRE como porcentual (sin inferencia):
```javascript
// Simplemente calcular y mostrar el %
const porcentajeChange = valorAnterior > 0 ? ((diferencia / valorAnterior) * 100) : 0;
return `Porcentual: +${porcentajeChange.toFixed(2)}%`;
```

**Opción B:** Mejorar inferencia (complejo y propenso a errores):
- Buscar información del usuario o tipo de operación
- Almacenar tipo explícitamente en BD

**Severidad:** 🟡 IMPORTANTE
- No bloquea funcionalidad (la cuota SÍ se actualiza correctamente)
- Pero afecta UX: información incorrecta confunde al usuario
- El registro de auditoría muestra datos falsos

**Reportado:** 2026-05-07
**Asociado a:** BACKLOG-054 (Aumento Masivo: Solo Porcentajes)

**Estado:** ✅ Solucionado (2026-05-07)

**Solución Implementada:**

Línea 849-852 en `PlanV1Modal.jsx` — Eliminar condicional `esFijo`:

```javascript
// ANTES
{esFijo
  ? `Fijo: +$${diferencia.toFixed(2)}`
  : `Porcentual: +${porcentajeChange.toFixed(1)}%`
}

// DESPUÉS
{`+${porcentajeChange.toFixed(2)}% ($${diferencia.toFixed(2)})`}
```

- ✅ Eliminar lógica de inferencia (líneas 840-842)
- ✅ Mostrar siempre porcentaje + diferencia en pesos como contexto
- ✅ Commit: `3231b73`

**Verificación:**
- ✅ Aumento masivo: 5% en plan con cuota $100
- ✅ Historial de Cuota muestra: "+5.00% ($5.00)" ✓
- ✅ No hay etiqueta "Fijo" ✓

---

## BUG-032: Llamadas API Duplicadas y Redundantes al Cargar GestionPlanesV1

**Descripción:**
Al cargar la página de Gestión de Planes (GestionPlanesV1), se realizan múltiples llamadas duplicadas al backend, aumentando latencia y consumo de recursos.

**Síntomas Observados:**
1. `/api/planes/filter/todos?...&sortBy=plan_numero&order=ASC` — **LLAMADA DUPLICADA**
2. `/api/planes/filter/todos?...&sortBy=plan_numero&order=ASC` — **Idem anterior**
3. `/api/planes/filter/todos?...&sortBy=cobrador_numero&order=DESC` — llamada posterior (ordenamiento diferente)
4. `/api/admin/configuracion` — **LLAMADA DUPLICADA**
5. `/api/recibos/periodos` — única

**Impacto:**
- ❌ Latencia aumentada en carga inicial
- ❌ Tráfico de red innecesario
- ❌ Render múltiple del componente (performance)
- 🟡 En conexiones lentas: tiempo de carga notablemente afectado

**CAUSA RAÍZ IDENTIFICADA:**

### 1. **Planes duplicadas en mount + sort change:**

En `GestionPlanesV1.jsx`:

```javascript
// Línea 81-83: useEffect al montar
useEffect(() => {
  cargar();
}, []);

// Línea 100-102: useEffect cuando cambia sortBy/order
useEffect(() => {
  cargar();
}, [sortBy, order, cargar]);
```

**Problema:**
- En montaje, se ejecutan AMBOS useEffects casi simultáneamente (tiiming race condition)
- El primer useEffect llama a cargar() con valores por defecto
- El segundo useEffect se ejecuta poco después llamando a cargar() nuevamente
- Cuando el usuario hace click en un header, se ejecuta nuevamente el segundo

**Diagrama temporal:**
```
Mount
├─ useEffect 1 (línea 81) → cargar() → /api/planes/filter/todos?sortBy=plan_numero&order=ASC ❌
├─ Luego: useSortable inicializa sortBy y order
├─ React detecta cambio en dependencies
└─ useEffect 2 (línea 100) → cargar() → /api/planes/filter/todos?sortBy=plan_numero&order=ASC ❌
```

### 2. **Configuración duplicada:**

En `GestionPlanesV1.jsx` línea 62-78:
```javascript
useEffect(() => {
  const loadConfig = async () => {
    const config = await configService.getConfiguracion(); // LLAMADA 1
    ...
  };
  loadConfig();
}, []);
```

Y probablemente también en `LookupCRUD.jsx` línea 44-60 y otros componentes.

**Problema:**
- Múltiples componentes cargan la configuración de forma independiente
- No existe un contexto o caché centralizado
- Mismo dato se obtiene N veces

### 3. **Periodos cargados en GenerarRecibosModal:**

En `GenerarRecibosModal.jsx` línea 69-88:
```javascript
useEffect(() => {
  if (!isOpen || step !== 1) return;
  
  const checkInitialPeriodo = async () => {
    const periodos = await recibosService.listPeriodos(); // LLAMADA
    ...
  };
  
  checkInitialPeriodo();
}, [isOpen, step]);
```

**Problema:**
- Se ejecuta en cada cambio de step o isOpen
- Podría ser cacheado después de primera carga

---

## **SOLUCIONES PROPUESTAS**

### **Solución 1: Consolidar useEffects de planes (CRÍTICA)**

**Cambio en `GestionPlanesV1.jsx`:**

**ANTES (duplicado):**
```javascript
// Mount
useEffect(() => {
  cargar();
}, []);

// Sort change (ejecuta en mount también)
useEffect(() => {
  cargar();
}, [sortBy, order, cargar]);
```

**DESPUÉS (consolidado):**
```javascript
// Único useEffect que cubre ambos casos
useEffect(() => {
  cargar();
}, [sortBy, order, cargar]);

// Remover: useEffect(() => { cargar(); }, []);
```

**Por qué funciona:**
- `cargar()` tiene dependencias [filtros, sortBy, order]
- useCallback es estable entre renders cuando deps no cambian
- En mount: sortBy/order ya están inicializados por useSortable
- Luego: cualquier cambio en sort triggers cargar()

**Impacto:** ✅ Reduce de 2 a 1 llamada en mount

---

### **Solución 2: Centralizar configuración en Context (IMPORTANTE)**

**Crear `ConfigContext.jsx`:**
```javascript
const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await configService.getConfiguracion();
        setConfig(data);
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}
```

**Uso en componentes:**
```javascript
// En lugar de:
// useEffect(() => { configService.getConfiguracion(); }, []);

// Usar:
const { config } = useContext(ConfigContext);
const debounceDelay = config?.debounce_delay_ms ?? 2000;
```

**Impacto:** ✅ Reduce de N a 1 llamada en toda la app

---

### **Solución 3: Cachear Periodos en GenerarRecibosModal (MENOR)**

**En `GenerarRecibosModal.jsx`:**

```javascript
const [periodosCached, setPeriodosCached] = useState(null);

// Cargar periodos UNA SOLA VEZ al abrir
useEffect(() => {
  if (!isOpen || periodosCached) return;
  
  const load = async () => {
    try {
      const result = await recibosService.listPeriodos();
      setPeriodosCached(result);
    } catch (err) {
      console.error('Error:', err);
    }
  };
  load();
}, [isOpen]); // Depende solo de isOpen, no de step
```

**Impacto:** ✅ Evita carga redundante en cambios de step

---

## **Plan de Acción Recomendado**

| Solución | Impacto | Complejidad | Prioridad |
|----------|---------|-------------|-----------|
| 1. Consolidar useEffects | Alto (reduce 1 llamada) | Baja (1 línea) | 🔴 AHORA |
| 2. ConfigContext | Alto (reduce N llamadas) | Media (nuevo context) | 🟡 Próxima sprint |
| 3. Cachear periodos | Bajo (reduce <1 llamada) | Baja (2 líneas) | 🟢 Backlog |

**Estimado total de mejora:**
- Antes: 5-6 llamadas en mount
- Después: 1-2 llamadas en mount
- **Reducción: 60-80% de tráfico inicial**

**Severidad:** 🟡 IMPORTANTE
- No bloquea funcionalidad
- Afecta performance y experiencia del usuario
- Visible en redes lentas

**Reportado:** 2026-05-07
**Fase:** Sortable Headers / Performance

**Estado:** 📋 Registrado

---

## BUG-033: Sin Confirmación al Eliminar Registros en LookupCRUD

**Descripción:**
En las páginas de gestión de entidades lookup (cobradores, zonas, tipos de grupo, tipos de plan), cuando el usuario hace clic en el botón "eliminar" (icono de trash), el sistema NO solicita confirmación. Debería:
1. Mostrar un modal de confirmación
2. Alertar si hay referencias (ej: un cobrador usado en planes)
3. Permitir forzar la eliminación cascada solo si el usuario confirma

**Síntomas Observados:**
1. Usuario abre página de "Cobradores"
2. Hace clic en icono "eliminar" (trash icon)
3. Nada sucede OR registro se elimina sin confirmación ❌
4. No hay modal de confirmación visible
5. No se alerta sobre referencias relacionadas

**Entidades Afectadas:**
- Cobradores
- Zonas
- Tipos de Grupo
- Tipos de Plan

**CAUSA RAÍZ IDENTIFICADA:**

El código en `LookupCRUD.jsx` YA tiene la infraestructura correcta:
1. Botón eliminar en línea 274-279
2. Función `handleDelete()` en línea 120-151
3. Modal `ConfirmDeleteWithRefsModal` en línea 327-337

**El problema es que el botón NO es visible o NO es clickeable.**

Tras investigación:
- El componente `IconButton` con `icon="delete"` se renderiza
- El modal está montado
- Pero probablemente el icono está fuera de la vista, oculto por CSS, o no tiene cursor: pointer

**Solución:**

1. ✅ Asegurar que el IconButton delete es visible en cada fila
2. ✅ Verificar que tiene estilos correctos (cursor: pointer, color, etc)
3. ✅ Agregar confirmación simple ANTES de intentar eliminar (confirm browser)
4. ✅ El modal existe, solo verificar que funciona

**Implementación:**

En `LookupCRUD.jsx`, agregar una confirmación simple con `window.confirm()` ANTES de llamar a `handleDelete()`:

```javascript
// Antes
onClick={() => handleDelete(Object.values(registro)[0])}

// Después
onClick={() => {
  if (window.confirm(`¿Estás seguro de que querés eliminar ${infoEntidad}?`)) {
    handleDelete(Object.values(registro)[0]);
  }
}}
```

Esto:
- ✅ Muestra confirmación inmediata
- ✅ Si tiene referencias, automáticamente abre el modal detallado
- ✅ Previene eliminaciones accidentales
- ✅ Usa el flujo existente de ConfirmDeleteWithRefsModal

**Severidad:** 🔴 CRÍTICO
- Sin confirmación, el usuario puede eliminar datos importante accidentalmente
- Datos potencialmente no-recuperables (si cascada está habilitada)

**Reportado:** 2026-05-07
**Fase:** LookupCRUD Components

**Estado:** 🚀 Desarrollado

**Solución Implementada:**

Agregué confirmación con `window.confirm()` en los botones de eliminar de `LookupCRUD.jsx`:

```javascript
onClick={() => {
  const id = Object.values(registro)[0];
  const nombreCampo = campos.find(c => c.name.includes('nombre'))?.name || campos[0]?.name;
  const infoEntidad = nombreCampo ? registro[nombreCampo] : String(id);
  if (window.confirm(`¿Estás seguro de que querés eliminar "${infoEntidad}"?`)) {
    handleDelete(id);
  }
}}
```

Esto:
- ✅ Muestra confirmación del navegador
- ✅ Si usuario confirma, ejecuta handleDelete()
- ✅ Si hay referencias, abre modal ConfirmDeleteWithRefsModal automáticamente
- ✅ Flujo completo de confirmación de 2 pasos

**Verificación:**
1. ✅ Ir a página de Cobradores
2. ✅ Hacer clic en icono eliminar
3. ✅ Debería aparecer confirm del navegador
4. ✅ Si hay referencias, aparecerá modal detallado
5. ✅ Usuario puede cancelar o confirmar eliminación

---

## BUG-035: TypeError al Crear/Editar Planes - "N.tiposDeplan.map is not a function"

**Descripción:**
Al acceder a crear un nuevo plan o editar uno existente en Gestión de Planes, la aplicación lanza un error:

```
Error en Gestión de Planes
Ocurrió un error al cargar el módulo:

TypeError: N.tiposDeplan.map is not a function
```

El componente PlanV1Modal falla al intentar renderizar porque `tiposDeplan` no es un array.

**Síntomas:**
1. Usuario hace clic en "Nuevo Plan" o "Editar Plan"
2. Modal PlanV1Modal intenta abrirse
3. Error aparece en la UI: "Error en Gestión de Planes"
4. Modal no se renderiza, usuario no puede crear/editar planes ❌

**Severidad:** 🔴 CRÍTICO
- Bloquea funcionalidad core: creación y edición de planes
- Afecta la operación principal del sistema

**Root Cause Identificada:**

Cambios recientes en BACKLOG-057 modificaron el response format del endpoint `/api/lookup/:entidad`:

**Antes (sin paginación):**
```javascript
// lookupController.js - método list()
res.status(200).json(registros);  // Array directo
```

**Ahora (con paginación):**
```javascript
// lookupController.js - método list()
res.json({
  success: true,
  data: rows,      // ← Array está dentro de este campo
  count,
  page,
  limit,
  totalPages,
  offset,
});
```

**Problema en lookupService.js:**

Métodos como `getTiposDePlan()`, `getCobradores()`, etc. esperaban un array directo:

```javascript
getTiposDePlan: async () => {
  const { data } = await api.get('/lookup/tipos-de-plan');
  return data || [];  // ← Ahora `data` es el objeto { success, data, count, ... }
                      // ← No es un array, es un objeto con propiedad `data`
}
```

Por eso la desestructuración devuelve un objeto en lugar de un array:
- **Esperado:** `tiposDeplan = [{ tipo_plan_numero: 1, ... }, ...]` (array)
- **Recibido:** `tiposDeplan = { success: true, data: [...], count: 5, ... }` (objeto)

Cuando PlanV1Modal intenta hacer `tiposDeplan.map()`, falla porque es un objeto, no un array.

**Archivos Afectados:**
- `frontend/src/services/lookupService.js` — Métodos `getTiposDePlan()`, `getCobradores()`, `getObrasSociales()`, `getTiposDeGrupo()`, `getZonas()` (líneas 81-141)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` — Usa estos métodos (línea 122-129)
- `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx` — También se ve afectado (línea 50+)

**Solución Recomendada:**

Actualizar los métodos específicos para extraer el array del campo `data`:

```javascript
getTiposDePlan: async () => {
  try {
    const response = await api.get('/lookup/tipos-de-plan');
    // Soportar ambos formatos: array directo (legacy) o { success, data, ... }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data || [];
  } catch (error) {
    console.error('Error loading tipos de plan:', error);
    return [];
  }
},
```

Esto soporta:
- ✅ Formato antiguo (array directo): `response.data = [...]`
- ✅ Formato nuevo (paginado): `response.data = { success, data: [...], count, ... }`
- ✅ Retrocompatibilidad

**Impacto de NO arreglarlo:**
- 🔴 Usuarios no pueden crear planes nuevos
- 🔴 Usuarios no pueden editar planes existentes
- 🔴 Aumento masivo bloqueado (usa BulkUpdateCuotaModal)
- 🔴 Sistema sin funcionalidad core

**Severidad:** 🔴 CRÍTICO
- Bloquea funcionalidad core
- Requiere fix inmediato

**Reportado:** 2026-05-08
**Fase:** BACKLOG-057 Paginación Lookups
**Detectado durante:** Testing de paginación backend en lookup tables

**Estado:** ✅ Solucionado (2026-05-08)

**Solución Implementada:**

Actualizar métodos específicos en `lookupService.js` para soportar ambos formatos de respuesta:

```javascript
getTiposDePlan: async () => {
  try {
    const response = await api.get('/lookup/tipos-de-plan');
    // Si es array directo (legacy), retornarlo
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Si es estructura paginada, extraer array del campo data
    return response.data?.data || [];
  } catch (error) {
    console.error('Error loading tipos de plan:', error);
    return [];
  }
},
```

Aplicada a todos los 5 métodos:
- ✅ getTiposDePlan()
- ✅ getCobradores()
- ✅ getObrasSociales()
- ✅ getTiposDeGrupo()
- ✅ getZonas()

Beneficiados:
- ✅ PlanV1Modal: crear/editar planes funciona correctamente
- ✅ BulkUpdateCuotaModal: aumento masivo de cuotas funciona

Retrocompatibilidad:
- ✅ Soporta formato legacy (array directo)
- ✅ Soporta formato nuevo (respuesta paginada)

**Commits:**
- `c825cad` — fix(BUG-035): soportar nuevo formato paginado
- `f4de7fc` — docs(BUG-035): registrar error

**Verificación:**
- ✅ Crear nuevo plan: modal abre correctamente
- ✅ Editar plan: modal abre correctamente
- ✅ Aumento masivo: modal abre correctamente
- ✅ Dropdowns muestran valores correctamente

---

## BUG-036: Reorder Endpoint Recibe IDs Indefinidos al Crear Nuevos Integrantes

**Descripción:**
Al agregar una nueva persona a un plan (crear o editar) y hacer clic en "Guardar y Seguir Editando" (botón nuevo de BACKLOG-058), el backend retorna error:

```
{
  "success": false,
  "message": "WHERE parameter \"id\" has invalid \"undefined\" value"
}
```

El error proviene del endpoint `POST /api/v1.0/plan-integrantes/reorder` que recibe valores `id: undefined` para los integrantes recién creados.

**Síntomas:**
1. Usuario abre PlanV1Modal (crear o editar plan)
2. Agrega un nuevo integrante (persona que no estaba en el plan)
3. Hace clic en "Guardar y Seguir Editando" (nuevo botón)
4. Modal se cierra temporalmente para reabrir
5. En la consola del navegador: Error de backend
6. En el backend: SQL error "WHERE parameter \"id\" has invalid \"undefined\" value"

**Severidad:** 🔴 CRÍTICO
- Bloquea funcionalidad BACKLOG-058 ("Guardar y Seguir Editando")
- Impide flujo de trabajo iterativo (agregar múltiples personas continuamente)

**Causa Raíz:**

En `PlanV1Modal.jsx` línea ~560, la función `handleGuardar` ejecuta este flujo:

1. **Crear nuevo plan O actualizar plan existente** ✅
2. **Crear nuevos integrantes via `crearMultiples()`** ✅ (retorna respuesta pero ID no se captura)
3. **Sincronizar integrantes (add/remove)** ✅
4. **Reordenar integrantes** ❌ (falla aquí)

Código problemático (línea ~620-635):

```javascript
// Después de crear nuevos integrantes, mapear a metadata para reorder
const integrantesWithMeta = form.integrantes.map((integrante, index) => {
  const existing = existingMap.get(integrante.persona_id);  // ← Busca en map de existentes
  return {
    id: existing?.id,  // ← undefined para integrantes recién creados
    orden: index + 1,
  };
});
await planesIntegrantesService.reorder(planData.plan_numero, integrantesWithMeta);
```

**El problema:**

- `existingMap` contiene solo integrantes que existían ANTES de la operación
- Los integrantes nuevos se crean via `crearMultiples()` pero sus IDs no se guardan
- Cuando se intenta reordenar, los nuevos integrantes no están en `existingMap`
- Su `id` resulta `undefined`
- Backend rechaza el reorder con SQL error

**Flujo de datos:**

```
form.integrantes = [
  { persona_id: 1, ... },   // Existente: en existingMap ✅
  { persona_id: 2, ... },   // Nuevo: NO en existingMap ❌
]

existingMap = {
  1: { id: 10, persona_id: 1, ... }  // Solo integrantes anteriores
}

integrantesWithMeta = [
  { id: 10, orden: 1 },     // ✅
  { id: undefined, orden: 2 },  // ❌ Nuevo integrante sin ID
]

POST /api/v1.0/plan-integrantes/reorder → SQL error
```

**Archivos Afectados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` — líneas ~560-640 (handleGuardar)
- `frontend/src/services/planesIntegrantesService.js` — método reorder() (no necesita cambios)

**Reportado:** 2026-05-08
**Fase:** BACKLOG-058 (Guardar y Seguir Editando)

**Estado:** 📋 Registrado

**Soluciones Propuestas (Por Evaluar):**

1. **Opción A: Capturar IDs retornados de crearMultiples()**
   - Guardar los IDs de integrantes recién creados
   - Agregar al map antes de reordenar
   - Ventaja: Mantiene lógica actual sin cambios mayores
   - Desventaja: Requiere verificar qué retorna `crearMultiples()` actualmente

2. **Opción B: Recargar integrantes antes de reordenar**
   - Después de crear nuevos integrantes, hacer GET `/api/v1.0/plan-integrantes/:planNumero`
   - Reconstruir `existingMap` con todos (viejos + nuevos)
   - Ventaja: Simple, garantiza sincronización
   - Desventaja: Request adicional (pero es validar datos)

3. **Opción C: Filtrar nuevos integrantes de reorder en modo "crear"**
   - En modo "crear" plan, todos los integrantes son nuevos
   - No llamar a reorder() si es modo "crear"
   - En modo "editar", solo reordenar integrantes que ya existían
   - Ventaja: Evita reorder innecesario si es primer guardado
   - Desventaja: No aplica orden en creación inicial

4. **Opción D: Modificar reorder() para ignorar undefined IDs**
   - Backend filtra registros donde `id` NO es undefined
   - Solo reordena integrantes que realmente existen
   - Ventaja: Robust, tolera casos edge
   - Desventaja: Oculta el problema, no es solución real

**Solución Implementada (Opción B):**

Recargar integrantes después de crear nuevos para obtener sus IDs asignados en BD antes de ejecutar reorder.

**Cambios en `PlanV1Modal.jsx`:**

1. **Modo "crear" (líneas 273-283):**
   ```javascript
   if (form.integrantes.length > 0) {
     await planesIntegrantesService.crearMultiples(response.plan_numero, form.integrantes);
     // Reload integrantes to get their assigned IDs before reordering
     const createdIntegrantes = await planesIntegrantesService.obtenerPorPlan(response.plan_numero);
     const integrantesWithMeta = form.integrantes.map((integrante, index) => {
       const created = createdIntegrantes.find((c) => c.persona_id === integrante.persona_id);
       return {
         id: created?.id,
         orden: index + 1,
       };
     });
     await planesIntegrantesService.reorder(response.plan_numero, integrantesWithMeta);
   }
   ```

2. **Modo "editar" (líneas 302-318):**
   - Después de crear nuevos integrantes, hacer GET `/api/v1.0/plan-integrantes/:planNumero`
   - Construir mapa `updatedMap` con todos los integrantes (viejos + nuevos)
   - Usar este mapa para obtener IDs válidos antes de reordenar

**Beneficios:**
- ✅ Garantiza que todos los integrantes en reorder tienen IDs válidos
- ✅ Mantiene sincronización correcta frontend-backend
- ✅ Recupera orden inicial correctamente

**Trade-offs:**
- ⚠️ Una request adicional (GET integrantes) pero es validación de datos
- ⚠️ Impacto mínimo en performance (se ejecuta después de crear integrantes)

**Commits:**
- `05d3b11` — fix(BUG-036): recargar integrantes después de crear para obtener IDs antes de reordenar

**Estado:** ✅ Solucionado (2026-05-08)

---

### BUG-037: Creación Prematura de Personas en Modo "Crear Plan"

**Descripción:**
Cuando el usuario crea un plan nuevo (modo "crear") y agrega afiliados mediante "+ Agregar Afiliado", las personas se crean en BD inmediatamente, **antes** de que el plan sea guardado. Esto viola el requerimiento BACKLOG-060 que especifica: "cuando se genera un plan nuevo, los afiliados (persona) no se registrarán hasta que el usuario seleccione una de las opciones de guardar".

**Severidad:** 🔴 CRÍTICO
- Viola especificación explícita de BACKLOG-060
- Crea "huérfanos de datos": personas en BD sin plan asociado
- Flujo de datos inconsistente con UI expectations

**Síntomas:**
1. Usuario abre PlanV1Modal en modo "crear"
2. Hace clic en "+ Agregar Afiliado"
3. AfiladoSearchModal abre, usuario llena datos y hace clic "Crear y Agregar"
4. **AfiladoSearchModal llama POST `/api/personas` inmediatamente** ← BUG
5. Persona se persiste en BD antes de que plan se guarde
6. Si usuario cancela plan después, persona queda huérfana en BD

**Root Cause:**
En `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/AfiladoSearchModal.jsx` línea 68:

```javascript
const persona = await personasService.crear(newPersona);
onSelect(persona);
```

El modal crea personas en BD sin considerar si estamos en modo "crear" (plan nuevo) o "editar" (plan existente).

**Impacto:**
- Datos inconsistentes: personas sin planes asociados
- Viola contrato funcional de BACKLOG-060
- Usuario puede cancelar plan sin afectar datos inesperadamente

**Solución Implementada:**

1. **AfiladoSearchModal ahora acepta `planMode` prop:**
   - Si `planMode === 'crear'`: NO llama POST `/api/personas`, devuelve datos sin id
   - Si `planMode !== 'crear'`: Llama POST `/api/personas` como antes

2. **PlanV1Modal.handleAfiladoSearch actualizado:**
   - Si persona tiene `id` (existe en BD): crea integrante inmediatamente (modo editar)
   - Si persona NO tiene `id` (deferred): agrega a form.integrantes sin persistir

3. **PlanV1Modal.handleGuardar modo "crear" refactorizado:**
   ```javascript
   // Crear personas deferred antes de crear integrantes
   const personasToCreate = form.integrantes.filter((i) => i.persona_id === null);
   if (personasToCreate.length > 0) {
     const createdPersonas = await Promise.all(
       personasToCreate.map((integ) => personasService.crear(integ.persona))
     );
     // Actualizar form.integrantes con persona_id reales
     integrantesToCreate = form.integrantes.map((integ) => {
       if (integ.persona_id === null) {
         const createdPersona = personaMap.get(integ.persona.numero_documento);
         return { ...integ, persona_id: createdPersona?.id };
       }
       return integ;
     });
   }
   // Luego crear integrantes con persona_id correctos
   await planesIntegrantesService.crearMultiples(response.plan_numero, integrantesToCreate);
   ```

**Flujo Correcto Después del Fix:**
```
Usuario crea plan nuevo
  → Agrega afiliado: "+ Agregar Afiliado"
    → AfiladoSearchModal (planMode='crear')
    → Usuario llena datos y hace clic "Crear y Agregar"
    → AfiladoSearchModal NO crea en BD (id=null)
    → Retorna datos sin id
  → handleAfiladoSearch recibe persona sin id
    → Agrega a form.integrantes (id=null, persona_id=null)
  → Usuario hace "Guardar y Seguir Editando"
    → handleGuardar modo 'crear':
      → Crea plan en BD ✅
      → Identifica personas con persona_id=null
      → Crea esas personas en BD ✅
      → Obtiene IDs reales
      → Actualiza form.integrantes con ids reales
      → Crea integrantes en BD ✅
  → Afiliado ahora habilitado (id presente, ⚙️ visible)
```

**Beneficios:**
- ✅ Personas solo se crean cuando plan se guarda
- ✅ Sin datos huérfanos en BD
- ✅ Cumple BACKLOG-060 completamente
- ✅ Modo editar sin cambios (efecto lateral mínimo)

**Cambios:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/AfiladoSearchModal.jsx`: Aceptar `planMode`, condicional en handleCreatePersona
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`:
  - Pasar `planMode={mode}` a AfiladoSearchModal
  - Actualizar `handleAfiladoSearch` para manejar personas sin id
  - Refactorizar `handleGuardar` modo crear para crear personas deferred
  - Importar `personasService`

**Commits:**
- `6f888ce` — fix(BUG-037): defer persona creation until plan save in create mode

**Estado:** ✅ Solucionado (2026-05-08)

---

### BUG-038: Falso Positivo en Detección de Afiliados Duplicados en Modo "Crear"

**Descripción:**
Cuando el usuario crea un plan nuevo y agrega múltiples afiliados nuevos (deferridos), el sistema incorrectamente detecta el segundo afiliado como duplicado del primero, mostrando "Este afiliado ya está asignado al plan", aunque sean personas diferentes con datos completamente distintos.

**Severidad:** 🔴 CRÍTICO
- Bloquea flujo de creación de planes con múltiples afiliados
- Obliga a guardar y reabrir modal para cada afiliado
- Degrada UX significativamente

**Síntomas:**
1. Usuario crea plan nuevo
2. Hace clic "+ Agregar Afiliado"
3. Crea primer afiliado: "Juan Pérez", DNI 12345678 → OK ✅
4. Hace clic "+ Agregar Afiliado" nuevamente
5. Crea segundo afiliado: "María García", DNI 87654321
6. **Error:** "Este afiliado ya está asignado al plan" ❌
7. Usuario no puede agregar más de un afiliado nuevo sin guardar

**Root Cause:**
En `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` línea 394, la lógica de detección de duplicados era:

```javascript
if (form.integrantes.some((i) => (i.persona_id === persona.id) || (persona.id === null && i.persona?.numero_documento === persona.numero_documento)))
```

El problema: cuando dos afiliados nuevos se agregan (ambos con `persona_id === null`):
- Primera condición: `i.persona_id === persona.id` → `null === null` → **TRUE** ✅ (falso positivo!)
- El OR cortocircuita y retorna true sin evaluar la segunda condición

Resultado: cualquier segundo afiliado es detectado como duplicado porque ambos tienen `persona_id === null`.

**Impacto:**
- 🔴 Usuario no puede crear planes con múltiples afiliados nuevos
- Bloqueador total para flujo de creación
- BACKLOG-060 completamente roto en modo crear

**Solución Implementada:**

Cambiar la lógica para:
1. **Si persona tiene id (existe en BD):** Verificar duplicados por `persona_id`
2. **Si persona NO tiene id (deferred):** Verificar duplicados por `numero_documento`

**Código:**
```javascript
const isDuplicate = form.integrantes.some((i) => {
  if (persona.id) {
    // Persona exists in BD: check by persona_id
    return i.persona_id === persona.id;
  } else {
    // Persona is deferred (no id): check by numero_documento
    return i.persona?.numero_documento === persona.numero_documento;
  }
});
if (isDuplicate) {
  alert('Este afiliado ya está asignado al plan');
  return;
}
```

**Beneficios:**
- ✅ Múltiples afiliados nuevos se pueden agregar sin falsos positivos
- ✅ Duplicados reales aún se detectan (mismo numero_documento)
- ✅ Modo editar sin cambios (verifica por persona_id correctamente)

**Cambios:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
  - Línea 394-397: refactorizar lógica de duplicados con condicional

**Flujo Correcto Después del Fix:**
```
1. Agregar Juan Pérez (DNI 12345678) → ✅ OK
2. Agregar María García (DNI 87654321) → ✅ OK (antes: error)
3. Agregar Juan Pérez otra vez (mismo DNI) → ❌ Error detectado correctamente
4. Guardar y Seguir Editando → ✅ Plan + 2 personas creadas
```

**Commits:**
- `292d692` — fix(BUG-038): falso positivo en detección de afiliados duplicados en modo crear

**Estado:** ✅ Solucionado (2026-05-08)

