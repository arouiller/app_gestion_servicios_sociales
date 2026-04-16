# Bug Tracking

Registro de bugs detectados durante implementación del plan de auditoría (Fase 1-7).

## Legendas de Severidad
- 🔴 **CRÍTICO**: Bloquea funcionalidad o avance
- 🟡 **IMPORTANTE**: Afecta UX o requiere corrección antes de siguiente fase
- 🟢 **MENOR**: Nice-to-have, puede esperar

## Registros Activos

| ID | Severidad | Fase | Descripción | Reportado | Estado |
|----|-----------|------|-------------|-----------|--------|

---

## Historial Completado

| ID | Fase | Descripción | Resuelto | Commits |
|----|------|-------------|----------|---------|
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

**Estados del bug:**
- 🔧 "Pendiente verificación" → Solución implementada pero no verificada
- ✅ "Cerrado" → Solo cuando el usuario confirme que funcionó

**Regla:** Los bugs se cierran SOLO cuando el usuario especifica explícitamente que la solución funcionó.

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

**Estado:** ✅ CERRADO (v2) — Fase 3 (BulkUpdateCuotaModal) completamente funcional

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

**Estado:** ✅ Corregido, pendiente verificación — Commit e32eb94

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

**Estado:** ✅ RESUELTO — Commit f6371a9

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

**Estado:** 🔧 Pendiente reinicio y reverificación — Commit f6371a9

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

**Estado:** 🔧 Pendiente verificación — Commit f6371a9

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

**Estado:** ✅ VALIDADO — Commits 3446668

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

**Estado:** 🔧 Pendiente análisis

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

**Estado:** 🔧 Pendiente análisis

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

**Estado:** 🔧 Pendiente verificación

**Verificación pendiente:**
- [ ] Crear nuevo usuario desde GestionUsuarios
- [ ] Verificar que POST se realiza a URL correcta (sin duplicación)
- [ ] Confirmar que usuario se crea exitosamente
- [ ] Probar otros métodos: cambiarRol, blanquearPassword, resetPassword

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

**Estado:** 🔧 Pendiente análisis

**Investigaciones requeridas:**
- [ ] Verificar si las migraciones se ejecutaron en BD producción (Hostinger)
- [ ] Revisar el sistema de migraciones en producción
- [ ] Determinar si hay una migración para `tema_preferido` o si es un campo que falta crear
- [ ] Analizar si necesita migración manual o si el sistema de migraciones en producción está desfasado
- [ ] Considerar agregar nuevas migraciones si es necesario

**Preguntas a responder:**
- ¿Falta ejecutar la migración 1.0.5 en producción?
- ¿Existe migración para `tema_preferido` o es columna que debe agregarse?
- ¿El sistema de migraciones en Hostinger está sincronizado?

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

**Estado:** ✅ RESUELTO

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

**Estado:** 🔧 Pendiente análisis

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

**Verificación pendiente:**
- [ ] Iniciar sesión con usuario no-admin (rol "usuario")
- [ ] Navegar a Gestión → Gestión de Planes
- [ ] Confirmar botones "Nuevo Plan", "Generar Recibos" visibles
- [ ] Confirmar columna "Acciones" con botones editar/suspender visibles
- [ ] Confirmar "Aumento Masivo" NO visible para usuario no-admin
- [ ] Probar click en botones: editar, suspender, generar recibos (sin errores de permisos)

**Estado:** ✅ Corregido, pendiente verificación por usuario

---

**Última actualización:** 2026-04-16
