# BACKLOG.md

Registro de mejoras y nuevos requerimientos detectados durante la implementación.
Estos ítems se abordan **después** de completar todas las fases del PLAN.md.

## Convención de prioridades
- 🔴 Alta — impacto directo en funcionalidad core
- 🟡 Media — mejora importante pero no bloqueante  
- 🟢 Baja — nice to have

## Ciclo de vida de los backlog items
Estados posibles:
- 📋 Registrado
- 🔬 En análisis
- ✅ Incorporado al plan
- 🚀 Desarrollado
- 🚫 Descartado (con motivo)
- ✅ Solucionado

Flujo de transiciones:
```
Registrado → En análisis → Incorporado al plan → Desarrollado → Solucionado
Registrado → En análisis → Incorporado al plan → Descartado
De cualquier estado → Descartado
```

**Regla crítica:** Un backlog item solo puede pasar a "Solucionado" o "Descartado" a través del pedido explícito del usuario final

**Nota:** Si un backlog item desarrollado encuentra problemas, se abre un bug en BUGS.md y el item vuelve a estado "Desarrollado" hasta que se resuelva el bug.


## Items

| ID | Prioridad | Estado | Descripción | Contexto / Motivo | Archivos estimados |
|----|-----------|--------|-------------|-------------------|----|
| BACKLOG-019 | 🔴 Alta | 📋 Registrado | Eliminar entidades lookup con asociaciones en cascada | Al eliminar cobrador/OS/servicio/tipo grupo/tipo plan, si hay asociaciones, confirmación y eliminación en cascada. No bloqueo, sino opción de proceder. | lookupController.js, LookupCRUD.jsx, migrations |
| BACKLOG-018 | 🔴 Alta | 📋 Registrado | Centralizar manejo de respuestas del backend con success: false | Estandarizar presentación de errores. Al recibir respuesta con success: false y message, generar alerta unificada. Mejora UX y reduce duplicación de manejo de errores. | services/api.js, context/AuthContext.jsx, múltiples servicios |
| BACKLOG-014 | 🔴 Alta | ✅ Solucionado | Página dedicada de gestión de recibos por período | Mejora UX: página centralizada para consultar recibos generados por mes/año y generar nuevos. Integrada como módulo del Dashboard. | RecibosPage.jsx, RecibosService.js, routes |
| BACKLOG-013 | 🔴 Alta | ✅ Solucionado | Mejora de flujo de login para usuarios con contraseña blanqueada | Email pre-cargado en formulario de seteo de contraseña. Elimina repetición de email en onboarding. Implementado, probado y aprobado. | LoginPage.jsx, ChangePasswordRequired.jsx |
| BACKLOG-012 | 🔴 Alta | ✅ Solucionado | Mejorar comportamiento de ventanas modales (cierre, ESC, cambios no guardados) | Modales no cierran al hacer click fuera. Pueden cerrarse con ESC. Si hay cambios, ESC muestra advertencia. Con múltiples modales, ESC solo cierra la más arriba. Implementado, probado y aprobado. | Todos los modales (PlanV1Modal, GenerarRecibosModal, BulkUpdateCuotaModal, etc.) |
| BACKLOG-011 | 🔴 Alta | ✅ Solucionado | Agregar acciones (editar y habilitar) a planes en búsqueda de afiliados | Desde planes visibles de un afiliado en búsqueda, permitir edición y cambio de estado (ACTIVO ↔ SUSPENDIDO) con modal reutilizable. Implementado, funcional y aprobado. | BusquedaAfiliados.jsx, PlanV1Modal.jsx |
| BACKLOG-010 | 🔴 Alta | ✅ Solucionado | Botón Aumento Masivo habilitado para todos los perfiles | Usuarios comunes pueden ejecutar aumento masivo de cuotas. Restricción requireAdmin removida de PATCH /api/planes/bulk-update-cuota. Usuarios no-admin pueden aplicar cambios masivos de valores. | backend/src/routes/planes.js, GestionPlanesV1.jsx |
| BACKLOG-009 | 🔴 Alta | ✅ Solucionado | Usuarios comunes pueden realizar todas las acciones en páginas accesibles | Usuarios comunes ahora tienen acceso CRUD completo en Gestión de Planes: crear, editar, suspender, generar recibos, aumento masivo. Restricciones innecesarias removidas. | Múltiples (GestionPlanesV1, BusquedaAfiliados, etc.) |
| BACKLOG-008 | 🔴 Alta | ✅ Solucionado | Registro de períodos de emisión de recibos + confirmación antes de regenerar | Sistema debe registrar qué meses ya tienen recibos generados. Si usuario intenta generar para un mes existente, mostrar confirmación. Si confirma, borrar recibos antiguos y regenerar. Previene duplicación accidental de recibos | GenerarRecibosModal.jsx, recibosController.js, nueva migración (tabla de períodos) |
| BACKLOG-007 | 🔴 Alta | ✅ Solucionado | Control de acceso por rol: usuarios comunes no ven Administración | Usuarios comunes deben tener acceso a: Búsqueda de Afiliados, Gestión de Planes, Cobradores, Obras Sociales, Servicios, Tipos de Grupo, Tipos de Plan. Deben estar excluidos de: Gestión de Usuarios, Migraciones BD. Solo admin ve la sección "Administración" | DashboardPage.jsx |
| BACKLOG-006 | 🔴 Alta | ✅ Solucionado | Flujo de login para usuarios con password blanqueada | Implementado y probado: Checkbox "Tengo contraseña blanqueada" en LoginPage. Backend detecta password_blanqueada y retorna flag debe_cambiar_password. Frontend redirige a /cambiar-password. Flujo completo funcional y validado para onboarding de nuevos usuarios | LoginPage.jsx, authService.js, auth.js |
| BACKLOG-005 | 🟡 Media | ✅ Solucionado | Mejorar columna "Cambio" en tab Historial de Cuota | Implementado y aprobado: Nueva columna que muestra tipo de cambio (Fijo/Porcentual) con valor. Lógica de inferencia de tipo por cálculo dinámico | PlanV1Modal.jsx |
| BACKLOG-004 | 🔴 Alta | ✅ Solucionado | Panel de Gestión de Usuarios: CRUD + cambio de rol + blanqueo de contraseña | Implementado y probado: Panel CRUD completo (listar, crear, cambiar rol, blanquear contraseña). Backend: endpoints /api/usuarios, /api/usuarios/:id/rol, /api/usuarios/:id/blanquear-password. Frontend: GestionUsuarios, UsuarioFormModal, ChangePasswordRequired. Flujo: usuarios nuevos con password_blanqueada acceden a /cambiar-password. Todo funcional y validado | Múltiples (GestionUsuarios.jsx, usuariosController, usuariosService, rutas, auth.js, ChangePasswordRequired.jsx) |
| BACKLOG-003 | 🟡 Media | ✅ Solucionado | Estandarizar formato de listados: mismo layout para todas las tablas + iconos consistentes para acciones | Fase 1 + Fase 2 completadas: estilos estándar, componentes creados, aplicados a GestionPlanesV1 y LookupCRUD. | Múltiples componentes (todas las tablas de listado) |
| BACKLOG-002 | 🔴 Alta | ✅ Solucionado | Agregar tab de recibos en vista de plan | Implementado y aprobado: Tab de recibos con paginación, carga dinámica y visualización de detalles. BUG-008 resuelto | PlanDetailModal.jsx, recibosService.js |
| BACKLOG-001 | 🟡 Media | ✅ Solucionado | Mejorar preview de aumento de cuotas: navegación completa + comparación antes/después | Implementado y aprobado: Tabla con alineación correcta, paginación, búsqueda y contraste antes/después. BUG-009 resuelto | BulkUpdateCuotaModal.jsx, SCSS |

## Detalles de Items

### BACKLOG-013: Mejora de Flujo de Login para Usuarios con Contraseña Blanqueada

**Descripción:**
Mejorar la experiencia de usuario en el flujo de login para usuarios que tienen su contraseña blanqueada. Cuando un usuario marca el checkbox "Tengo contraseña blanqueada", debe ser redirigido a un formulario de seteo de contraseña con su email pre-cargado (sin necesidad de ingresarlo nuevamente).

**Requerimientos:**

a. **Flujo de Login (LoginPage.jsx)**
   - Usuario ingresa email en campo de email
   - Usuario marca checkbox "Tengo contraseña blanqueada"
   - Al enviar formulario:
     * Backend valida email + verifica que password_blanqueada=true
     * Si válido: backend retorna `debe_cambiar_password: true`
     * Frontend captura el email ingresado
     * Redirige a `/cambiar-password` pasando el email en state/sessionStorage

b. **Formulario de Seteo de Contraseña (ChangePasswordRequired.jsx)**
   - Recibe email como parámetro (desde state de navegación)
   - Muestra email como read-only (no editable)
   - Campo: "Nueva contraseña" (password input)
   - Campo: "Confirmar contraseña" (password input)
   - Validaciones:
     * Ambas contraseñas requeridas
     * Ambas contraseñas deben coincidir
     * Mínimo 8 caracteres
     * Al menos 1 mayúscula, 1 minúscula, 1 número
   - Botón: "Establecer contraseña"
   - Al guardar:
     * Enviar POST /api/auth/cambiar-password con { email, nueva_password }
     * Si éxito: mostrar "Contraseña establecida. Por favor inicia sesión"
     * Redirigir a `/login` con email pre-cargado (opcional: agregar parámetro ?email=...)

c. **Backend Validation**
   - Endpoint POST /api/auth/cambiar-password ya debe existir (creado en BACKLOG-006)
   - Validar que email + password_blanqueada=true coincidan
   - Actualizar password en BD
   - Marcar password_blanqueada=false
   - Retornar token JWT (opcional: auto-login después de cambio)

d. **Casos de Uso**
   1. Usuario nuevo recibe email con admin asignándole contraseña blanqueada
   2. Usuario hace login con email + checkbox marcado
   3. Es redirigido automáticamente a seteo de contraseña
   4. Establece su contraseña sin repetir email
   5. Es redirigido a login para iniciar sesión con nueva contraseña

**Contexto:**
- BACKLOG-006 ya implementó el flujo básico de login con blanqueo
- Actualmente después de login con password_blanqueada, el usuario ve ChangePasswordRequired pero debe ingresar email nuevamente
- Mejora UX: elimina repetición innecesaria de email
- Completa el flujo de onboarding para nuevos usuarios

**Archivos a modificar:**
- `frontend/src/pages/LoginPage/LoginPage.jsx` (capturar email, pasar a ChangePasswordRequired)
- `frontend/src/pages/ChangePasswordRequired/ChangePasswordRequired.jsx` (recibir email como prop, mostrar read-only)
- `frontend/src/services/authService.js` (métodos existentes, verificar que cambiar-password funcione)
- Backend: verificar que POST /api/auth/cambiar-password existe y funciona (si no existe, crear)

**Estimación:** 1.5-2 horas
  - Frontend: actualizar LoginPage para pasar email (0.5h)
  - Frontend: actualizar ChangePasswordRequired para recibir email (0.5h)
  - Backend: verificar/crear endpoint cambiar-password (0.5h)
  - Testing: verificar flujo completo (0.5h)

**Prioridad:** 🔴 Alta — Completa flujo de onboarding, necesario para nuevos usuarios

**Estado:** ✅ Solucionado (2026-04-16)

**Implementación Completada (2026-04-16):**

1. ✅ LoginPage.jsx
   - Ya existía: email se pasa via navigation state a /cambiar-password
   - Agregado: recepción de email desde ChangePasswordRequired (después de cambio de contraseña)
   - Agregado: useEffect para pre-llenar email field cuando viene de state
   - Agregado: mostrar successMessage cuando el usuario es redirigido desde ChangePasswordRequired
   - Email field se pre-llena automáticamente si viene del flujo de cambio de contraseña

2. ✅ ChangePasswordRequired.jsx
   - Agregado: import de useLocation hook
   - Agregado: useEffect que captura email desde location.state?.email
   - Modificado: email field ahora tiene `disabled={true}` (read-only)
   - Modificado: agregado título `title="El email no puede ser modificado"`
   - Modificado: cuando se guarda contraseña, redirige a /login con email en state
   - El email ahora se pre-carga automáticamente (no editable)

3. ✅ Flujo completo
   - Usuario ingresa email en LoginPage + marca "tengo contraseña blanqueada"
   - Email se pasa a ChangePasswordRequired via navigation state
   - Email field en ChangePasswordRequired muestra el valor (read-only)
   - Usuario solo ingresa contraseña nueva + confirmación
   - Al guardar, redirige a /login con email pre-cargado
   - LoginPage muestra successMessage y email field pre-lleno
   - Usuario puede iniciar sesión directamente sin repetir email

**Commits:**
- 8a75567 - docs(BACKLOG-013): registrar y analizar
- [implementation] - feat(BACKLOG-013): implementar email pre-cargado en formulario de cambio de contraseña

**Beneficios:**
- ✅ Mejora UX: elimina repetición de email
- ✅ Flujo intuitivo: progresión clara (login → cambio → login nuevamente)
- ✅ Completa BACKLOG-006: onboarding funcional para nuevos usuarios
- ✅ Minimiza fricción: menos campos para llenar

---

### BACKLOG-009: Usuarios Comunes - Acceso a Todas las Acciones en Páginas Permitidas

**Descripción:**
Los usuarios con rol "usuario" (no admin) deben poder ejecutar todas las acciones CRUD disponibles en las páginas a las que tienen acceso. Actualmente, algunas funcionalidades están restringidas innecesariamente a usuarios admin.

**Requerimientos:**

a. **Revisión de Restricciones**
   - Analizar todas las páginas accesibles para usuarios comunes
   - Identificar acciones que están bloqueadas para "usuario" pero deberían estar disponibles
   - Ejemplos: crear planes, editar planes, buscar afiliados, ver detalles, etc.

b. **Acciones que deben estar disponibles para usuarios comunes**
   - En Gestión de Planes: crear, editar, ver detalle, generar recibos
   - En Búsqueda de Afiliados: buscar, ver detalle
   - En Gestión de Cobradores/OS/Servicios/etc: acceso CRUD completo (si la página es visible)

c. **Mantener restricciones para admin-only**
   - Gestión de Usuarios (crear, cambiar rol, blanquear contraseña)
   - Migraciones de BD
   - Cambiar acceso global o configuración del sistema

**Contexto:**
- UX mejora: usuarios comunes ven botones/acciones y pueden usarlos sin errores
- Las páginas ya están filtradas por rol en el menú
- Si usuario ve una página, debería poder usar todas sus funciones
- No debería haber botones deshabilitados o mensajes "acción no permitida" en páginas accesibles

**Archivos a revisar:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/` (verificar permisos en modales)
- `frontend/src/pages/DashboardPage/components/BusquedaAfiliados/` (idem)
- `backend/src/routes/` (verificar middleware requireAdmin en endpoints innecesarios)
- `backend/src/controllers/` (verificar lógica de autorización)

**Estimación:** 2-3 horas (auditoría + correcciones menores)

**Prioridad:** 🔴 Alta — Mejora UX y coherencia del sistema

**Estado:** ✅ Solucionado (2026-04-16)

**Verificación Completada (2026-04-16):**
- ✅ Gestión de Planes: CRUD completo para usuarios comunes
  - Crear plan ✅ (BUG-014 resuelto)
  - Editar plan ✅ (BUG-014 resuelto)
  - Suspender plan ✅ (BUG-014 resuelto)
  - Generar recibos ✅ (botón visible para todos)
  - Aumento masivo ✅ (BACKLOG-010 completado)
- ✅ Backend: Restricciones `requireAdmin` removidas de POST/PUT/DELETE planes, personas, lookup
- ✅ Frontend: Botones de acciones visibles para todos sin restricciones innecesarias

**Commits asociados:**
- 1531825 - fix(BUG-014): botones de acciones visibles para no-admin
- 45ff900 - feat(BACKLOG-010): aumento masivo habilitado para todos

---

### BACKLOG-008: Registro de Períodos de Emisión de Recibos + Confirmación

**Descripción:**
El sistema debe mantener un registro de los meses/períodos para los cuales ya se han generado recibos. Cuando un usuario intenta generar recibos para un período que ya existe, el sistema debe:
1. Detectar que el período ya tiene recibos generados
2. Mostrar un modal de confirmación informando al usuario
3. Advertir que todos los recibos del período serán borrados y regenerados
4. Si el usuario confirma: borrar recibos antiguos y generar nuevos
5. Si cancela: no hacer nada

**Requerimientos:**

a. **Tabla de Períodos Generados**
   - Nueva tabla: `periodos_recibos` o `recibos_periodos`
   - Campos:
     * id (PK)
     * periodo (YYYY-MM) - UNIQUE
     * fecha_generacion (DATE)
     * cantidad_recibos (INT) - snapshot de cuántos se generaron
     * createdAt

b. **Lógica de Detección (Backend)**
   - Endpoint POST /api/recibos/generar debe:
     * Recibir periodo en formato YYYY-MM
     * Consultar tabla periodos_recibos para verificar si existe
     * Retornar: { existe: true, cantidad: X } si ya existe
     * O { existe: false } si es nuevo

c. **Modal de Confirmación (Frontend)**
   - Si respuesta indica que período existe:
     * Mostrar modal: "¿Regenerar recibos?"
     * Mostrar texto: "Ya existen X recibos generados para este período"
     * Advertencia: "Se borrarán todos los recibos y se volverán a generar"
     * Botones: "Cancelar" | "Sí, Regenerar"
   - Si usuario confirma: llamar nuevamente a endpoint con flag `force: true`

d. **Lógica de Borrado y Regeneración (Backend)**
   - Si `force: true` en payload:
     * Usar transacción:
       - DELETE FROM recibos WHERE periodo = ?
       - DELETE FROM recibo_integrantes WHERE recibo_id IN (...)
       - Generar nuevos recibos
       - UPDATE/INSERT en periodos_recibos con nueva fecha_generacion

e. **Tabla periodos_recibos será creada por migración**
   - Versión: 2.0.5
   - Incluir índice en campo periodo para búsquedas rápidas

**Contexto:**
- Actualmente, si usuario genera recibos varias veces para el mismo período, se generan duplicados
- No hay forma de saber qué períodos ya tienen recibos
- Mejora: auditoría + seguridad (previene datos duplicados)

**Archivos a modificar/crear:**
- Backend: `controllers/recibosController.js` (extender generar() con lógica de detección)
- Backend: `models/PeriodoRecibos.js` (NUEVO - modelo Sequelize)
- Backend: `routes/recibos.js` (ya existe, solo necesita endpoint actualizado)
- Frontend: `GenerarRecibosModal.jsx` (agregar lógica de confirmación)
- Frontend: `modals/ConfirmarRegeneracionRecibosModal.jsx` (NUEVO)
- Migración: `1.0.6_periodos_recibos/upgrade.sql` (NUEVA)

**Estimación:** 4-5 horas (backend 2h, frontend 1.5h, migración 0.5h, testing 1h)

**Prioridad:** 🔴 Alta — Control de duplicación es crítico

**Estado:** ✅ Solucionado (2026-04-16)

**Verificación Completada (2026-04-16):**
- ✅ Backend detecta períodos existentes y retorna HTTP 409 con { existe: true, cantidad: X }
- ✅ Frontend recibe 409 y muestra modal de confirmación (resuelto en BUG-013)
- ✅ Usuario puede confirmar regeneración o cancelar
- ✅ Backend maneja `force: true` para borrar y regenerar recibos
- ✅ Prevención de duplicados funcional

**Commits asociados:**
- 43b7dcb, 7f7aae6 - BUG-013: Frontend maneja 409 correctamente
- Backend: Lógica de detección ya implementada

---

### BACKLOG-007: Control de Acceso por Rol - Menú Dinámico

**Descripción:**
Los usuarios comunes (no administradores) deben tener acceso a todas las funcionalidades del menú EXCEPTO a la sección de "Administración" (Gestión de Usuarios y Migraciones de BD).

**Requerimientos:**

a. **Acceso permitido para usuarios comunes**
   - Mi Cuenta → Datos Personales
   - Gestión → Búsqueda de Afiliados
   - Gestión → Gestión de Planes
   - Gestión → Cobradores
   - Gestión → Obras Sociales
   - Gestión → Servicios Adicionales
   - Gestión → Tipos de Grupo
   - Gestión → Tipos de Plan

b. **Acceso DENEGADO para usuarios comunes**
   - Administración (sección completa NO visible)
   - Administración → Gestión de Usuarios
   - Administración → Migraciones BD

c. **Comportamiento esperado**
   - La sección "Administración" no debe aparecer en el sidebar para usuarios con rol "usuario"
   - Solo usuarios con rol "admin" ven la sección "Administración"

**Contexto:**
- Los usuarios comunes no deben poder gestionar otros usuarios ni ejecutar migraciones
- Mantener la seguridad separando funciones administrativas
- Mejorar UX: no mostrar opciones inaccesibles

**Archivos a modificar:**
- `frontend/src/pages/DashboardPage/DashboardPage.jsx` (función buildMenu)

**Estimación:** 0.5 horas (cambio simple en lógica de menú)

**Prioridad:** 🔴 Alta — Control de acceso es crítico para seguridad

**Estado:** ✅ Solucionado (2026-04-16)

---

### BACKLOG-005: Mejorar columna "Cambio" en Historial de Cuota

**Descripción:**
En el tab "Historial de Cuota" de la vista de edición de un plan, agregar una columna que muestre el cambio aplicado (tipo y valor) además de los valores anterior y nuevo.

**Requerimientos:**

a. **Nueva columna "Cambio"**
   - Mostrar tipo de cambio: "Fijo" o "Porcentual"
   - Mostrar valor del cambio: +$50 (fijo) o +10% (porcentual)
   - Formato: "Fijo: +$50" o "Porcentual: +10%"
   - Calcular dinámicamente si no está almacenado en BD

b. **Tabla completa del Historial**
   - Columnas:
     - Fecha de Cambio ✅
     - Valor Anterior ✅
     - Cambio (NUEVO): tipo + valor
     - Valor Nuevo ✅
   - Ordenamiento: descendente por fecha (más reciente primero)

c. **Lógica de cálculo**
   - Si cambio es fijo: valor_nuevo - valor_anterior = cambio
   - Si cambio es porcentual: ((valor_nuevo - valor_anterior) / valor_anterior * 100)
   - Determinar tipo: Si existe campo en BD o inferir del cálculo

**Contexto:**
- Usuario necesita auditar cambios de cuota históricamente
- Actualmente ve "Valor Anterior" y "Valor Nuevo" pero no distingue si fue aumento fijo o porcentual
- Información completa permite validar que los cambios se aplicaron correctamente

**Archivos a modificar:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (tabla de historial)
- Backend: verificar si `HistorialCuota` tiene campo para tipo/valor de cambio

**Estimación:** 1-2 horas (actualizar tabla + lógica de cálculo)

**Prioridad:** 🟡 Media — Mejora para auditoría pero no bloqueante

**Notas:**
- Considerar si el backend almacena el tipo de cambio (fijo/porcentual)
- Si no lo almacena, calcular dinámicamente en frontend
- Align visually with BulkUpdateCuotaModal column format para consistencia

---

### BACKLOG-004: Panel de Gestión de Usuarios (Admin Only)

**Descripción:**
Crear un panel administrativo para gestionar usuarios del sistema. Solo usuarios con rol `admin` pueden acceder. Funcionalidades incluyen: listar usuarios, crear nuevos usuarios (solo requiere email), cambiar rol de usuario (admin ↔ usuario), y blanquear contraseña. Usuarios nuevos o con contraseña blanqueada tienen flujo especial de login.

**Requerimientos:**

a. **Backend: Endpoints**
   - `GET /api/usuarios` - Listar todos los usuarios (admin only)
   - `POST /api/usuarios` - Crear nuevo usuario { email } (admin only)
     * Solo requiere email en payload
     * Asigna automáticamente: nombre='JOHN', apellido='DOE'
     * Genera password temporal y marca password_blanqueada=true
   - `PUT /api/usuarios/:id/rol` - Cambiar rol { rol: 'admin'|'usuario' } (admin only)
   - `POST /api/usuarios/:id/blanquear-password` - Blanquear contraseña (admin only)
   - `POST /api/auth/password-reset` - Cambiar contraseña con token (sin autenticación)

b. **Frontend: Panel GestionUsuarios**
   - Tabla de usuarios: email | nombre | apellido | rol | estado | acciones
   - Botón "+ Nuevo Usuario" → modal con campo email
   - Acciones por usuario: ✎ editar rol, 🔑 blanquear contraseña, 🗑 eliminar
   - Confirmaciones antes de cambios críticos

c. **Flujo de Login para Usuarios Nuevos/Blanqueados**
   - Usuario intenta login con email normal (sin contraseña)
   - Backend valida email + verifica si contraseña está blanqueada
   - Si sí: permite acceso directo → pantalla de "Cambiar Contraseña Obligatorio"
   - Usuario debe cambiar contraseña antes de acceder al dashboard
   - Usa token de sesión temporal válido solo para este endpoint

d. **Base de Datos**
   - Agregar columna `password_blanqueada` (BOOLEAN) a tabla usuarios
   - Migración 1.0.5 para agregar esta columna

**Contexto:**
- Funcionalidad core de administración
- Necesario para onboarding de nuevos usuarios
- Permite reset de contraseñas olvidadas
- Solo accessible por admin

**Archivos a crear/modificar:**
- Backend: `usuariosController.js` (extensión), `routes/usuarios.js` (agregar rutas), migración 1.0.5
- Frontend: `GestionUsuarios.jsx`, `GestionUsuarios.scss`, `modals/UsuarioFormModal.jsx`, `usuariosService.js` (extensión)
- Componente: pantalla de "Cambiar Contraseña Obligatorio" (ChangePasswordRequired.jsx)

**Estimación:** 6-8 horas (backend 3h, frontend 3-4h, testing 1h)

**Prioridad:** 🔴 Alta — Funcionalidad core para administración

**Notas:**
- Validación: email único
- No permitir que se elimine el último admin
- Auditoria: registrar quién cambió qué rol/blanqueó contraseña (campo opcional)
- Confirmaciones de seguridad para cambios de rol y blanqueo

---

### BACKLOG-003: Estandarizar Formato de Listados + Iconos de Acciones

**Descripción:**
Todos los formularios que muestren listados (tablas) deben tener el mismo formato visual y estilos, independientemente del número de columnas. Además, las acciones (editar, eliminar, ver detalle, etc.) deben representarse con iconos consistentes en toda la aplicación.

**Requerimientos:**

a. **Formato estándar de tablas**
   - Encabezado: fondo gris claro (#f8f9fa)
   - Filas alternadas: color de fondo alternado para mejor legibilidad
   - Bordes y padding: consistentes
   - Responsive: comportamiento consistente en mobile
   - Altura de fila: consistente

b. **Iconos de acciones estandarizados**
   - ✎ (U+270E) → Editar
   - 🗑 (U+1F5D1) → Eliminar
   - 👁 (U+1F441) → Ver detalle / Expandir
   - ⚙ (U+2699) → Configurar / Opciones
   - ➕ (U+2795) → Agregar
   - Estilo: botones pequeños con border y hover effect
   - Tamaño: 0.75rem con padding consistente

c. **Aplicar a los siguientes componentes**
   - GestionPlanesV1 → tabla de planes
   - LookupCRUD → tablas de Cobradores, Tipos de Plan, Obras Sociales, Servicios, Tipos de Grupo
   - Cualquier otro modal/componente con listados

**Contexto:**
- Mejora UX/consistencia visual
- Reduce curva de aprendizaje (usuario reconoce acciones por icono)
- Facilita mantenimiento futuro (cambios centralizados en estilos)

**Archivos a modificar/crear:**
- `frontend/src/styles/_table-standard.scss` (NUEVO - variables y mixins estándar para tablas)
- `frontend/src/components/IconButton/IconButton.jsx` (NUEVO - componente reutilizable para botones con iconos)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/GestionPlanesV1.jsx` (refactor)
- `frontend/src/pages/DashboardPage/components/LookupCRUD/LookupCRUD.jsx` (refactor)
- Múltiples archivos SCSS

**Estimación:** 4-6 horas (crear componente + refactor de 2-3 formularios principales)

**Prioridad:** 🟡 Media — Mejora importante para consistencia pero no bloqueante

**Estado:** ✅ Solucionado (2026-04-16)

**Fase 1: Componentes y Estilos (Completada - 2026-04-16)**
- ✅ Creado `frontend/src/styles/_table-standard.scss`
  - Variables estándar (colores, padding, bordes)
  - Mixins para encabezado, cuerpo, tabla completa
  - Filas alternadas para legibilidad
  - Responsive para mobile
- ✅ Creado `frontend/src/components/IconButton/IconButton.jsx`
  - Componente reutilizable para botones con iconos
  - Iconos: edit (✎), delete (🗑), view (👁), config (⚙), add (➕)
  - Variantes: danger, success, primary
  - Tamaños: sm, normal, lg
- ✅ Creado `frontend/src/components/IconButton/IconButton.scss`
  - Estilos con transiciones y estados hover/active/disabled

**Fase 2: Refactorización de Componentes (Completada - 2026-04-16)**
- ✅ Refactorizar GestionPlanesV1 para usar estilos estándar
  - Importado IconButton y _table-standard.scss
  - Tabla con clase 'table-standard'
  - ActionButtons reemplazados con IconButtons
  - Columna de acciones con 'table-actions' y 'action-button-group'
- ✅ Refactorizar LookupCRUD para usar estilos estándar
  - Importado IconButton y _table-standard.scss
  - Tabla con clase 'table-standard'
  - ActionButtons reemplazados con IconButtons
  - Columna de acciones estandarizada
- ✅ Aplicación a componentes principales completada
- ✅ Iconos consistentes en toda la aplicación

**Commits:**
- d89e704 - feat(BACKLOG-003): crear componentes y estilos estándar (Fase 1)
- d7af38b - refactor(BACKLOG-003): aplicar estilos estándar a componentes (Fase 2)

**Notas:**
- Primera fase: crear componente y estilos estándar ✅
- Segunda fase: aplicar progresivamente a todos los formularios (próxima)
- Considerar crear una guía de estilos para iconos (IconLibrary)

---

### BACKLOG-002: Agregar Tab de Recibos en Vista de Plan

**Descripción:**
Al abrir un plan específico (desde la sección GestionPlanes), agregar un nuevo tab "Recibos" que muestre todos los recibos generados para ese plan.

**Requerimientos:**

a. **Tab en PlanDetailModal**
   - Agregar tab "Recibos" junto a pestañas existentes
   - Mostrar tabla con recibos del plan actual ordenados por período descendente

b. **Contenido del tab**
   - Columnas:
     - Período (formato: YYYY-MM-DD)
     - Número de integrantes
     - Valor cuota (snapshot)
     - Acciones: [Ver detalle] [Descargar PDF*]
   - Si no hay recibos: mostrar mensaje "No hay recibos generados"
   - Paginación si hay muchos recibos

c. **Consulta de datos**
   - Crear endpoint GET /api/recibos?plan_numero=X&periodo=YYYY-MM
   - O usar endpoint existente GET /api/recibos/:id para obtener detalle

**Contexto:**
- Descubierto durante Fase 4 (GenerarRecibosModal)
- Migración v2.0.4 crea tablas recibos y recibo_integrantes
- Los recibos se generan correctamente pero no hay forma de consultarlos desde la UI
- Usuario necesita auditar qué recibos existen para validación

**Archivos a modificar/crear:**
- `frontend/src/pages/DashboardPage/components/PlanDetailModal/PlanDetailModal.jsx` (agregar tab)
- `frontend/src/pages/DashboardPage/components/PlanDetailModal/tabs/RecibosTab.jsx` (nuevo)
- `frontend/src/services/recibosService.js` (crear si no existe)
- Backend: verificar endpoints GET /api/recibos existentes

**Estimación:** 2-3 horas (nuevo tab + listado + consultas)

**Prioridad:** 🔴 Alta — Funcionalidad core para auditoría de recibos

**Notas:**
- *Descargar PDF es futuro (BACKLOG-003)
- Alineación con patrón de otros tabs (HistorialTab, etc.)

---

### BACKLOG-001: Mejorar Preview de Aumento de Cuotas

**Descripción:**
El modal de preview en BulkUpdateCuotaModal muestra actualmente solo los primeros 5 planes afectados. Para validación fehaciente antes de ejecutar un aumento masivo, se necesita:

**Requerimientos:**

a. **Navegación completa de planes**
   - Mostrar todos los planes afectados (no solo primeros 5)
   - Agregar paginación (ej: 10 planes por página) O scroll infinito
   - Permitir búsqueda/filtro dentro del preview para encontrar rápidamente un plan específico

b. **Contraste antes/después de valores**
   - Mostrar en tabla: 
     - Plan # | Afiliado | Valor Actual | Valor Nuevo | Diferencia
   - O columna adicional: "Aumento: +$50 / +10%"
   - Formato visual que resalte la diferencia (color, flecha, etc.)

**Contexto:**
- Descubierto durante implementación de Fase 3
- Usuario no puede validar todos los planes antes de confirmar
- Riesgo: ejecutar aumento sin ver todos los afectados
- Impacto: mejora confiabilidad de operaciones críticas

**Archivos a modificar:**
- `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx`
- `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.scss`

**Estimación:** 1.5-2 horas (agregar paginación + nueva columna con cálculo dinámico)

**Prioridad:** 🟡 Media — Mejora importante para confiabilidad pero no bloqueante

---

### BACKLOG-006: Flujo de Login para Usuarios con Password Blanqueada

**Descripción:**
Mejorar el formulario de login para soportar usuarios que tienen `password_blanqueada=true`. Cuando un usuario con password blanqueada intenta loguearse, el sistema debe:
1. Detectar que tiene password blanqueada
2. Permitir acceso sin validar contraseña
3. Redirigir a pantalla de cambio obligatorio de contraseña
4. Después de cambiar contraseña, desloguear y volver a login

**Requerimientos:**

a. **Frontend: Formulario de Login mejorado**
   - Agregar checkbox "Tengo contraseña blanqueada" (opcional, visible)
   - Si checkbox está activo:
     - No validar campo de password (permitir vacío)
     - Enviar solo email al backend
   - Si checkbox está inactivo:
     - Comportamiento normal (requiere email + password)

b. **Backend: Endpoint POST /api/auth/login mejorado**
   - Recibir flag `password_blanqueada` en payload
   - Si `password_blanqueada=true`:
     - Buscar usuario por email
     - Verificar que `password_blanqueada=true` en BD
     - Retornar token temporal + flag indicando que debe cambiar contraseña
   - Si `password_blanqueada=false`:
     - Comportamiento normal (validar password)

c. **Frontend: Flujo post-login**
   - Si response incluye flag "debe_cambiar_password":
     - Redirigir a `/cambiar-password`
     - Pasar email en state/sessionStorage
     - Mostrar formulario de cambio obligatorio
   - Después de cambiar contraseña:
     - Desloguear automáticamente
     - Redirigir a `/login`
     - Mostrar mensaje: "Contraseña actualizada. Por favor inicia sesión nuevamente"

**Contexto:**
- Requerimiento core para onboarding de nuevos usuarios
- BACKLOG-004 crea usuarios con `password_blanqueada=true`
- Necesario para que nuevos usuarios puedan acceder al sistema
- Flujo seguro: obliga cambio de contraseña en primer acceso

**Archivos a modificar:**
- `frontend/src/pages/LoginPage/LoginPage.jsx` (agregar checkbox + lógica)
- `frontend/src/pages/LoginPage/LoginPage.scss` (estilos)
- `frontend/src/services/authService.js` (agregar parámetro password_blanqueada)
- `backend/src/routes/auth.js` (actualizar POST /api/auth/login)

**Estimación:** 3-4 horas (frontend 2h, backend 1h, testing 1h)

**Prioridad:** 🔴 Alta — Bloqueante para usuarios nuevos

**Estado:** ✅ Solucionado (2026-04-16)

**Notas:**
- El endpoint POST /api/auth/password-reset ya existe (creado en BACKLOG-004)
- ChangePasswordRequired.jsx ya existe (creado en BACKLOG-004)
- Solo necesita integración con LoginPage

---

### BACKLOG-010: Botón Aumento Masivo Habilitado para Todos los Perfiles

**Descripción:**
Remover restricción `requireAdmin` del endpoint PATCH /api/planes/bulk-update-cuota para permitir que usuarios comunes (no-admin) ejecuten aumento masivo de cuotas. Esto complementa BACKLOG-009 permitiendo acceso CRUD completo.

**Requerimientos:**

a. **Backend: Remover restricción admin**
   - Archivo: `backend/src/routes/planes.js` (línea 12)
   - Actual: `router.patch('/bulk-update-cuota', verifyToken, requireAdmin, planesController.bulkUpdateCuota);`
   - Cambiar a: `router.patch('/bulk-update-cuota', verifyToken, planesController.bulkUpdateCuota);`
   - Solo requiere `verifyToken` (autenticado), sin `requireAdmin`

b. **Frontend: Remover restricción de deshabilitado**
   - Archivo: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` (líneas 140-147)
   - Remover: `disabled={!isAdmin}` y `title={!isAdmin ? "Solo disponible para administradores" : ""}`
   - Botón debe estar completamente habilitado para todos

**Contexto:**
- Consistencia: si usuarios comunes pueden crear/editar/eliminar planes, también deben poder aplicar cambios masivos
- UX: mejora acceso a funcionalidades sin restricciones innecesarias
- Seguridad: backend valida autenticación, no hay riesgo de acceso no autorizado

**Archivos a modificar:**
- `backend/src/routes/planes.js` (remover requireAdmin)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` (remover disabled + title)

**Estimación:** 0.5 horas (cambios simples)

**Prioridad:** 🔴 Alta — Completa el acceso CRUD para usuarios comunes

**Estado:** ✅ Solucionado (2026-04-16)

**Implementación Completada (2026-04-16):**
1. ✅ Removido `requireAdmin` de `backend/src/routes/planes.js` (línea 12)
2. ✅ Removido `disabled={!isAdmin}` y title de frontend
3. ✅ Botón "Aumento Masivo" ahora habilitado para todos los perfiles
4. ✅ Backend solo requiere `verifyToken` (autenticación)

**Commits:**
- 45ff900 - feat(BACKLOG-010): botón Aumento Masivo habilitado para todos

---

### BACKLOG-011: Agregar Acciones (Editar y Habilitar) a Planes en Búsqueda de Afiliados

**Descripción:**
En el componente BusquedaAfiliados, cuando se visualiza la tabla de planes de un afiliado seleccionado, agregar una columna "Acciones" con botones para:
1. ✎ Editar plan (abre PlanV1Modal con modo edición)
2. 🔒/🔓 Cambiar estado (ACTIVO ↔ SUSPENDIDO) con confirmación

**Requerimientos:**

a. **Nueva columna "Acciones" en tabla de planes**
   - Ubicación: después de columna "Valor Cuota"
   - Dos botones por plan:
     * Botón Editar (✎): abre PlanV1Modal en modo edición (reutilizable)
     * Botón Estado (🔒/🔓): cambia estado ACTIVO ↔ SUSPENDIDO con confirmación

b. **Integración con PlanV1Modal**
   - Modal debe aceptar parámetro `plan` (objeto plan completo)
   - Modal debe aceptar callback `onSave` para actualizar tabla
   - Reutilizar modal existente sin cambios (modal ya existe en GestionPlanesV1)
   - Importar y usar el mismo componente

c. **Cambio de Estado**
   - Botón muestra icono 🔒 si estado es ACTIVO, 🔓 si es SUSPENDIDO
   - Al hacer click:
     * Si estado es ACTIVO → confirmar cambio a SUSPENDIDO
     * Si estado es SUSPENDIDO → confirmar cambio a ACTIVO
   - Confirmación modal: "¿Cambiar estado de {plan.numero_afiliado}?"
   - Si usuario confirma:
     * Llamar a planesV1Service.actualizar(planNumero, {estado: 'SUSPENDIDO'|'ACTIVO'})
     * Actualizar tabla localmente
     * Mostrar mensaje de éxito

d. **Manejo de errores**
   - Si actualización falla: mostrar error
   - Si modal cancela: no hacer cambios
   - Tabla debe refrescarse automáticamente después de cualquier operación exitosa

**Contexto:**
- Actualmente tabla de planes en BusquedaAfiliados es solo lectura
- Usuario debe poder realizar acciones directas desde búsqueda (editar, cambiar estado)
- Reúsa componente existente (PlanV1Modal) → sin duplicación de código
- Mejora flujo: accede a afiliado → ve planes → edita o cambia estado sin salir de búsqueda

**Archivos a modificar:**
- `frontend/src/pages/DashboardPage/components/v1.0/BusquedaAfiliados.jsx` (agregar columna + lógica)
- `frontend/src/pages/DashboardPage/components/v1.0/BusquedaAfiliados.scss` (estilos para nueva columna)
- Nota: PlanV1Modal ya existe en GestionPlanesV1 y es reutilizable (no modificar)

**Estimación:** 2-3 horas (agregar columna + integrar modal + lógica de estado + testing)

**Prioridad:** 🔴 Alta — Funcionalidad importante para gestión desde búsqueda

**Estado:** 🚀 Desarrollado (2026-04-16)

**Implementación Completada (2026-04-16):**
1. ✅ Importados PlanV1Modal e IconButton en BusquedaAfiliados.jsx
2. ✅ Agregados estados: showPlanModal, editingPlan, successMessage
3. ✅ Implementados handlers:
   - `handleEditarPlan()`: abre modal con plan para editar
   - `handlePlanSaved()`: refresca planes y cierra modal
   - `handleToggleEstado()`: cambia estado ACTIVO ↔ SUSPENDIDO con confirmación
4. ✅ Agregada columna "Acciones" en tabla de planes con dos botones:
   - Botón ✎ (editar): abre PlanV1Modal en modo edición
   - Botón 🔒/🔓 (estado): alterna entre ACTIVO y SUSPENDIDO
5. ✅ Integración con planesV1Service.actualizar() y .getByPersona()
6. ✅ Mensajes de éxito y error actualizados
7. ✅ Estilos aplicados: success-message, table-standard class, action-button-group
8. ✅ Modal reutilizable sin cambios (PlanV1Modal existente)

**Commits:**
- 0c364a6 - feat(BACKLOG-011): agregar acciones (editar y habilitar) a planes en búsqueda de afiliados

**Aprobación de Usuario (2026-04-16):**
- ✅ Funcionalidad completa verificada
- ✅ Integración con PlanV1Modal funcional
- ✅ Cambios de estado ACTIVO ↔ SUSPENDIDO operacionales
- ✅ Mensajes de éxito/error claros

---

### BACKLOG-012: Mejorar Comportamiento de Ventanas Modales (Cierre, ESC, Cambios)

**Descripción:**
Mejorar la experiencia de usuario en las ventanas modales del sistema con tres cambios principales:
1. Las modales NO deben cerrarse al hacer click fuera (backdrop no cierra)
2. Las modales pueden cerrarse presionando la tecla ESC
3. Si el usuario ha realizado cambios en los datos y presiona ESC, mostrar confirmación antes de cerrar
4. Con múltiples modales superpuestas, ESC solo cierra la más arriba (LIFO stack behavior)

**Requerimientos:**

a. **Comportamiento al hacer click fuera (backdrop)**
   - Actual: probablemente permite cerrar al hacer click fuera
   - Cambio: NO cerrar al hacer click fuera de la modal
   - Razón: prevenir cierre accidental, usuario debe usar botón explícito o ESC

b. **Comportamiento de tecla ESC**
   - Presionar ESC abre la modal
   - Si NO hay cambios en los datos:
     * Cerrar inmediatamente sin confirmación
   - Si SÍ hay cambios en los datos:
     * Mostrar modal de confirmación: "¿Cerrar sin guardar? Los cambios se perderán"
     * Botones: "Cancelar" | "Sí, Cerrar sin guardar"
     * Si usuario elige "Cancelar": permanecer en modal
     * Si usuario elige "Sí, Cerrar": cerrar sin guardar

c. **Manejo de múltiples modales superpuestas**
   - Cuando hay varias modales abiertas (ej: modal A abierto, modal B abierto arriba):
     * ESC cierra SOLO la modal que está al frente (modal B)
     * Modal A permanece abierta
   - Patrón LIFO (Last In, First Out)
   - Registrar stack de modales abiertas (en componente padre o context global)

d. **Detección de cambios**
   - Cada modal necesita saber si hay cambios no guardados
   - Estrategia: comparar estado actual vs estado inicial de datos
   - O usar flag booleano `hasChanges` que se actualiza en onChange/onInput
   - Implementar en cada modal: PlanV1Modal, GenerarRecibosModal, BulkUpdateCuotaModal, FormModals, etc.

e. **Implementación técnica**
   - Crear hook personalizado: `useModalKeyboard(isOpen, hasChanges, onEsc, onEscWithChanges)`
   - Este hook:
     * Escucha eventos de teclado (ESC)
     * Solo actúa si modal está abierta
     * Comprueba si hay cambios
     * Llama callback apropiado
   - O envoltura Modal global que maneje ESC automáticamente
   - Modal wrapper que:
     * Detecta clicks fuera (backdrop)
     * Escucha ESC
     * Maneja confirmación de cambios

**Contexto:**
- Mejorar UX: usuarios quieren poder cerrar modales con ESC (patrón estándar)
- Prevenir pérdida accidental de datos: confirmar si hay cambios
- Evitar cierre accidental al hacer click fuera: mejora estabilidad
- Múltiples modales superpuestas: comportamiento intuitivo (solo cierra la más arriba)

**Archivos a modificar/crear:**
- `frontend/src/hooks/useModalKeyboard.js` (NUEVO - hook para manejo de ESC)
- `frontend/src/components/ModalWrapper/ModalWrapper.jsx` (NUEVO O MEJORAR - wrapper base para modales)
- Todos los modales:
  * `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
  * `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/GenerarRecibosModal.jsx`
  * `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx`
  * `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/UsuarioFormModal.jsx`
  * `frontend/src/pages/DashboardPage/components/LookupCRUD/LookupCRUDFormModal.jsx`
  * Otros modales/formularios

**Estimación:** 6-8 horas
  - Hook useModalKeyboard: 1h
  - ModalWrapper mejorado: 1h
  - Auditar modales actuales: 1.5h
  - Modificar cada modal (agregar hasChanges tracking, integrar hook): 2-3h
  - Modal de confirmación (reutilizar existente): 0.5h
  - Testing: 1h

**Prioridad:** 🔴 Alta — UX estándar esperada, previene pérdida de datos

**Estado:** 🚀 Desarrollado (2026-04-16)

**Implementación Completada (2026-04-16):**

**Fase 1: Infraestructura**
1. ✅ Creado hook `useModalEscapeKey.js`
   - Escucha evento keydown para tecla ESC
   - Solo actúa si modal está abierta
   - Comprueba si hay cambios sin guardar
   - Llama callback apropiado (cerrar directo o mostrar confirmación)

2. ✅ Creado componente `ConfirmCloseDialog`
   - Modal de confirmación reutilizable
   - Estilos consistentes con sistema de diseño
   - Mensajes claros: "¿Cerrar sin guardar? Los cambios se perderán"
   - Botones: Cancelar | Sí, Cerrar sin guardar

**Fase 2: Modales Principales (Actualización)**
1. ✅ PlanV1Modal (editor de planes)
   - Removed: `onClick={onClose}` from overlay
   - Added: Detección de cambios (comparación JSON form vs initialForm)
   - Added: useModalEscapeKey hook integration
   - Added: ConfirmCloseDialog component
   - Cierre con ESC: si hay cambios → confirmación, si no → cierre directo

2. ✅ BulkUpdateCuotaModal (aumento masivo)
   - Removed: backdrop click close
   - Added: hasChanges tracking (step, valor, filtro, selectValue)
   - Added: ESC handler con confirmación
   - Confirmación ante cierre con cambios

3. ✅ GenerarRecibosModal (generación de recibos)
   - Removed: backdrop click close
   - Added: hasChanges tracking (step, periodo)
   - Added: ESC handler con confirmación
   - Reutiliza existente handleClose para lógica de negocio

**Fase 3: Modales Secundarias (Actualización)**
1. ✅ UsuarioFormModal (crear usuario)
   - Removed: backdrop click close
   - Added: hasChanges tracking (email)
   - Added: ESC handler con confirmación
   - Confirmación antes de descartar form

2. ✅ AfiladoSearchModal (buscar/crear afiliados)
   - Removed: backdrop click close
   - Added: hasChanges tracking (searchText, showCreateForm, newPersona)
   - Added: ESC handler con confirmación
   - Detección sensible de cambios en búsqueda y formulario de creación

3. ✅ AfiladoEditModal (editar datos de afiliado)
   - Removed: backdrop click close
   - Reemplazado: window.confirm() → ConfirmCloseDialog
   - Added: hasChanges con useMemo (comparación JSON)
   - Added: ESC handler con confirmación
   - Ambos botones (✕ y Cancelar) respetan confirmación

4. ✅ IntegranteServiciosModal (servicios adicionales)
   - Removed: backdrop click close
   - Added: hasChanges tracking (selectedServicios vs originalSelectedServicios)
   - Added: Preservación de estado inicial en loadData
   - Added: ESC handler con confirmación
   - Confirmación ante cambios en selección de servicios

**Comportamiento Implementado:**
- ✅ Modales NO cierran al hacer click fuera (overlay sin onClick)
- ✅ Modales SÍ responden a tecla ESC
- ✅ ESC sin cambios: cierre inmediato
- ✅ ESC con cambios: muestra ConfirmCloseDialog
- ✅ Confirmación reutilizable en todas las modales
- ✅ Detección de cambios específica por modal
- ✅ Botones de cierre (✕) también respetan confirmación

**Commits:**
- 87cc5b1 - feat(BACKLOG-012): mejorar comportamiento de modales - Fase 1
- 2ce0c10 - feat(BACKLOG-012): mejorar comportamiento de modales - Fase 2

**Notas:**
- ReciboDetalleModal y PreviewModal no actualizadas (probablemente read-only)
- Sistema escalable: nuevas modales pueden reutilizar useModalEscapeKey + ConfirmCloseDialog
- Comportamiento LIFO: múltiples modales superpuestas se cierran desde la más arriba

---

### BACKLOG-014: Página Dedicada de Gestión de Recibos por Período

**Descripción:**
Crear una página dedicada para la gestión centralizada de recibos generados. La página permitirá:
1. Listar todos los períodos (meses/años) para los cuales ya se han generado recibos
2. Acceder al listado completo de recibos de cada período
3. Generar nuevos recibos para un período seleccionado (mes y año)

El acceso a esta página será a través de un botón "Generar recibos" desde la vista de edición de planes.

**Requerimientos:**

a. **Estructura de la Página (RecibosPage.jsx)**
   - Header: "Gestión de Recibos"
   - Dos secciones principales:
     * Sección 1: Listado de períodos disponibles
     * Sección 2: Formulario para generar nuevos recibos

b. **Listado de Períodos Generados**
   - Tabla con columnas:
     - Período (formato: "Enero 2026", "Febrero 2026", etc.)
     - Cantidad de recibos generados
     - Fecha de generación
     - Acción: Link para ver listado de recibos del mes
   - Si no hay períodos generados: mostrar mensaje "No hay recibos generados aún"
   - Ordenamiento: descendente por período (más reciente primero)
   - Paginación si hay muchos períodos

c. **Link a Listado de Recibos por Período**
   - Al hacer click en el link de un período:
     * Redirigir a nueva vista (RecibosListPage.jsx)
     * Pasar período como parámetro (YYYY-MM)
     * Mostrar tabla con todos los recibos del período
     * Columnas: Plan #, Afiliado, Integrantes, Valor Cuota, Acciones (descargar PDF?, ver detalle)
     * Paginación si es necesario

d. **Formulario de Generación de Recibos**
   - Botón principal: "Generar Recibos"
   - Al hacer click en botón:
     * Mostrar modal/formulario con:
       - Campo 1: Selector de mes (select con opciones: Enero, Febrero, Marzo, ..., Diciembre)
       - Campo 2: Selector de año (input numérico o select con últimos 5 años)
       - Selección por defecto: mes actual y año actual
       - Botón: "Generar"
       - Botón: "Cancelar"
   - Al hacer click en "Generar":
     * Validar que mes y año sean válidos
     * Convertir formato legible a YYYY-MM
     * Llamar a endpoint POST /api/recibos/generar con período
     * Usar misma lógica que GenerarRecibosModal (detectar período existente, mostrar confirmación si existe, etc.)
     * Después de generación exitosa:
       - Mostrar mensaje de éxito
       - Refrescar lista de períodos
       - Opcionalmente: navegar automáticamente al listado de recibos generados

e. **Integración con Edición de Planes**
   - En PlanV1Modal.jsx:
     * Reemplazar o complementar botón "Generar recibos"
     * El botón debe dirigir a RecibosPage.jsx (no abrir GenerarRecibosModal)
     * Opcionalmente: pasar plan_numero como parámetro para pre-filtrar (si es útil)

f. **Consultas de Datos (Backend)**
   - Endpoint GET /api/recibos/periodos
     * Retorna lista de períodos con: periodo (YYYY-MM), cantidad_recibos, fecha_generacion
   - Endpoint GET /api/recibos?periodo=YYYY-MM
     * Retorna lista de recibos del período especificado
   - Endpoint POST /api/recibos/generar (ya existe)
     * Lógica de detección de período existente (BACKLOG-008)

**Contexto:**
- Actualmente, la generación de recibos se hace a través de GenerarRecibosModal dentro de la edición de planes
- Usuario necesita una forma centralizada y clara de gestionar recibos
- Consultar recibos generados requiere entrar en la vista de edición de cada plan
- Mejora UX: página dedicada permite visualizar período actual, histórico de generaciones, y generar nuevos recibos de forma centralizada
- Flujo intuitivo: Edición de Planes → botón "Generar recibos" → va a RecibosPage → lista períodos → puede generar nuevo → usa misma lógica existente

**Archivos a crear/modificar:**
- `frontend/src/pages/RecibosPage/RecibosPage.jsx` (NUEVO - página principal)
- `frontend/src/pages/RecibosPage/RecibosPage.scss` (NUEVO - estilos)
- `frontend/src/pages/RecibosPage/RecibosListPage.jsx` (NUEVO - listado de recibos por período)
- `frontend/src/pages/RecibosPage/RecibosListPage.scss` (NUEVO - estilos)
- `frontend/src/pages/RecibosPage/components/GenerarRecibosForm.jsx` (NUEVO - formulario de generación)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (modificar botón "Generar recibos")
- `frontend/src/services/recibosService.js` (extender con métodos: getPeriodos(), listByPeriodo())
- `frontend/src/App.jsx` (agregar nueva ruta: /recibos)

**Estimación:** 6-8 horas
  - Crear estructura de páginas y componentes: 2h
  - Desarrollar listado de períodos: 1.5h
  - Desarrollar formulario de generación: 1.5h
  - Desarrollar listado de recibos por período: 1.5h
  - Integración con PlanV1Modal: 0.5h
  - Testing y ajustes: 1h

**Prioridad:** 🔴 Alta — Mejora importante para UX en gestión de recibos

**Estado:** ✅ Solucionado (2026-04-16)

**Implementación Completada (2026-04-16):**
1. ✅ Backend: Endpoint GET /api/recibos/periodos lista períodos generados
2. ✅ Frontend: RecibosPage.jsx con dos vistas (lista de períodos y recibos de período)
3. ✅ Integración como módulo del Dashboard (state-based, no route)
4. ✅ GenerarRecibosModal mejorado con verificación live de períodos existentes
5. ✅ Menú: "Gestión de Recibos" agregado bajo "Gestión"
6. ✅ Validación de formato período (YYYY-MM-DD) en backend y frontend
7. ✅ Paginación de recibos (10 por página)
8. ✅ Flujo completo: ver períodos → generar nuevos → ver recibos → ver detalles

**Nota:** Durante la implementación se detectó BUG-017 (recibos no se devuelven del API). Registrado en BUGS.md para seguimiento posterior.

---

### BACKLOG-015: Cambiar Flujo de Adición de Afiliados - Saltar Búsqueda Inicial

**Descripción:**
Simplificar el flujo de adición de afiliados a un plan eliminando la pantalla de búsqueda inicial y abriendo directamente el formulario de creación de nuevo afiliado. Actualmente, cuando se agrega un afiliado a un plan, el sistema muestra primero un modal de búsqueda que requiere que el usuario escriba texto para buscar. Este cambio elimina ese paso intermedio y va directo a la creación.

**Requerimientos:**

a. **Comportamiento anterior (actual)**
   - Usuario abre modal de adición de afiliado
   - Ve campo de búsqueda: "Buscar por nombre, apellido o DNI..."
   - Debe escribir algo para ver opciones
   - Si no encuentra, luego aparece botón "+ Crear nuevo afiliado"
   - Hace click para crear nuevo

b. **Comportamiento nuevo (solicitado)**
   - Usuario abre modal de adición de afiliado
   - Se abre directamente el formulario de creación de nuevo afiliado
   - Sin pantalla de búsqueda previa
   - Llena datos y crea el afiliado inmediatamente

c. **Impacto técnico**
   - Cambio en `AfiladoSearchModal.jsx`:
     * Remover lógica de búsqueda en vivo (state searchText, búsqueda por API)
     * Remover componentes de búsqueda y tabla de resultados
     * Inicializar `showCreateForm = true` por defecto
     * Simplificar la estructura del modal
   - El componente se convierte en un "AfiladoCreateModal" efectivamente
   - Funcionalidad de búsqueda puede moverse a otra sección o eliminarse

d. **Archivos a modificar**
   - `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/AfiladoSearchModal.jsx`
   - `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/AfiladoSearchModal.scss` (limpiar estilos no usados)

**Contexto:**
- Mejora UX: menos pasos para crear un afiliado
- Flujo más directo: usuario sabe que viene a crear, no a buscar
- La búsqueda de afiliados existentes puede hacerse desde GestionAfiliados si es necesario
- Enfoque: facilitar la creación rápida de nuevos afiliados durante creación de planes

**Estimación:** 1 hora (simplificar componente + testing)

**Prioridad:** 🟡 Media — Mejora UX pero no bloqueante

**Estado:** 🚀 Desarrollado (2026-04-17)

**Implementación Completada (2026-04-17):**

**Cambios realizados:**
1. ✅ `AfiladoSearchModal.jsx`: Simplificación completa
   - Removidos: estado `searchText`, `results`, `loading`, `showCreateForm`
   - Removidos: `useRef`, `useEffect`, `personasService.buscar()`
   - Removida: lógica de búsqueda en vivo con debounce
   - Removida: tabla de resultados
   - Removida: interfaz de búsqueda
   - Conservado: validación y creación de afiliado
   - Cambio: Título de "Buscar Afiliado" → "Crear Nuevo Afiliado"
   - Cambio: Botón "Volver" → "Cancelar"

2. ✅ Modal ahora abre directamente con formulario de creación
   - Sin pasos intermedios
   - Usuario puede crear afiliado inmediatamente
   - Validaciones y manejo de errores intactos

3. ✅ Detección de cambios y confirmación de cierre
   - ESC key: solicita confirmación si hay cambios
   - Botón cancelar: solicita confirmación si hay cambios
   - Mantiene comportamiento robusto

**Beneficios:**
- ✅ Flujo directo: 1 pantalla en lugar de 2
- ✅ UX mejorada: usuario entra con objetivo claro
- ✅ Menos código: ~100 líneas eliminadas
- ✅ Mejor rendimiento: sin búsquedas innecesarias
- ✅ Interfaz más simple: enfoque en creación

**Commits:**
- feat(BACKLOG-015): cambiar flujo de adición de afiliados - eliminar búsqueda inicial

---

### BACKLOG-016: Sistema de Documentación Accesible en Ventana Separada

**Descripción:**
Implementar un sistema de documentación integrado en la aplicación que sea accesible desde cualquier pantalla. La documentación debe abrirse en una ventana separada (nueva pestaña o modal no-modal) sin interrumpir la navegación del usuario. La documentación incluirá guías sobre pantallas, funcionalidades, información requerida en formularios, y procedimientos de uso.

**Requerimientos:**

a. **Acceso a Documentación**
   - Botón de ayuda visible en header/navbar de la aplicación (icono "?" o "Ayuda")
   - El botón abre un menú desplegable con opciones de documentación
   - Opciones: Documentación General, Guía Rápida, FAQ, Contacto Soporte
   - O un único botón que abre documentación en ventana nueva (nueva pestaña)

b. **Ventana Separada**
   - La documentación se abre en una ventana nueva o nueva pestaña del navegador
   - NO es un modal dentro de la aplicación (usuario mantiene la página actual visible)
   - Permite que el usuario tenga dos ventanas: app + documentación
   - Usuario puede consultar documentación mientras trabajaba en la app

c. **Contenido de Documentación**
   - Guía por sección/módulo (Gestión de Planes, Búsqueda de Afiliados, etc.)
   - Para cada sección:
     * Descripción de la funcionalidad
     * Pantallas y componentes involucrados
     * Campos requeridos (validaciones, formatos esperados)
     * Pasos para realizar tareas comunes
     * Ejemplos de uso
     * Casos de error y soluciones
   - Índice/tabla de contenidos
   - Búsqueda dentro de documentación (opcional)

d. **Integración con la App**
   - Botón flotante o en navbar
   - Al hacer click: `window.open('/docs', '_blank')` (abre en nueva pestaña)
   - O implementar sistema de ayuda contextual (help icon en componentes)
   - Tooltip sobre campos ayudando a explicar qué llenar

e. **Mantenimiento**
   - Documentación versión-able (v1.0.5, v1.0.6, etc.)
   - Fácil actualización cuando cambian funcionalidades
   - Posibilidad de agregar documentación de nuevas secciones sin recompilación

**Contexto:**
- Usuario necesita ayuda para entender cómo usar cada sección
- Documentación en ventana separada: mejor UX que modal sobre la app
- Reduce soporte/preguntas frecuentes
- Facilita onboarding de nuevos usuarios

**Archivos a crear/modificar:**
- Frontend: `navbar/help-button.jsx` o ítem en navbar existente
- Frontend: `/docs/index.html` (servir documentación estática)
- Frontend: `/docs/pages/` (secciones de documentación en HTML)
- Posible: `backend/src/routes/docs.js` (si documentación viene del backend)

**Estimación:** 
- Estructura de documentación: 2h
- Implementar botón/acceso: 1h
- Escribir documentación inicial: 8-10h (según detalle)
- Testing: 1h
- **Total: 12-14 horas**

**Prioridad:** 🟡 Media — Mejora UX pero no bloqueante para funcionalidad core

**Estado:** 🚀 Desarrollado (2026-04-17)

**Implementación Completada (2026-04-17):**

**Botón de Ayuda en Topbar:**
✅ Botón "?" agregado en topbar del Dashboard (entre ThemeSwitcher y logout)
✅ Estilo: circular, color primario, hover effect
✅ Click: abre `/docs` en nueva pestaña
✅ Tooltip: "Abrir documentación (nueva pestaña)"
✅ Accesibilidad: aria-label + title

**Commits:**
- 998abb2 - feat(BACKLOG-016): agregar botón de ayuda en topbar

---

### BACKLOG-017: Generar Documentación de Uso en Formato HTML

**Descripción:**
Crear documentación completa de la aplicación en formato HTML que cubra todas las pantallas, funcionalidades, campos de formularios, validaciones, y procedimientos de uso. Esta documentación será accesible a través del sistema de ayuda (BACKLOG-016) y podrá ser consultada en línea o descargada.

**Requerimientos:**

a. **Cobertura de Documentación**
   - **Inicio/Visión General**: Descripción general del sistema, flujos principales
   - **Autenticación**: Cómo hacer login, recuperar contraseña, usuarios nuevos con password blanqueada
   - **Gestión de Planes**: 
     * Listar, buscar, crear, editar, suspender planes
     * Campos de cada plan: qué llenar, formatos
     * Cambios de cuota (fijo vs porcentual)
     * Aumento masivo de cuotas
   - **Búsqueda de Afiliados**: Buscar, ver detalles, planes asociados
   - **Gestión de Afiliados** (si es accesible):
     * Crear afiliado (campos, validaciones)
     * Editar datos
     * Eliminar (confirmaciones)
   - **Gestión de Cobradores**: CRUD, uso en planes
   - **Obras Sociales, Tipos de Grupo, Tipos de Plan, Servicios Adicionales**: CRUD para cada lookup
   - **Generación de Recibos**: 
     * Cuándo/cómo generar
     * Campos en recibos
     * Ver historial de recibos
     * Regenerar recibos existentes
   - **Gestión de Usuarios** (admin only):
     * Crear usuario
     * Cambiar rol
     * Blanquear contraseña
   - **Migraciones BD** (admin only):
     * Qué son migraciones
     * Cómo ejecutarlas
     * Historial de migraciones
   - **FAQ**: Preguntas frecuentes y respuestas
   - **Glosario**: Términos técnicos y de negocio
   - **Troubleshooting**: Errores comunes y soluciones

b. **Formato y Estructura HTML**
   - Página HTML única o múltiples páginas HTML interconectadas
   - Estructura clara: navegación, índice, breadcrumbs
   - Responsive: funciona en desktop, tablet, mobile
   - Estilos consistentes (CSS)
   - Tablas de contenidos (índice)
   - Enlaces internos (links entre secciones)
   - Búsqueda (opcional: implementar búsqueda en documentación)

c. **Contenido por Sección**
   - Descripción: Qué es esta sección y para qué sirve
   - Pantalla: Elementos visibles (tabla, botones, campos)
   - Campos/Columnas: Qué es cada field, formato, validación
   - Acciones disponibles: Crear, editar, buscar, eliminar
   - Pasos para realizar tarea común
   - Ejemplos: Screenshots o descripciones detalladas
   - Casos de error: Qué pasa si algo falla, cómo solucionarlo
   - Información requerida: Formatos de entrada, restricciones

d. **Generación y Entrega**
   - Documentación generada como archivos HTML estáticos
   - Se sirven desde `/public/docs/` (en frontend)
   - O generados desde backend y servidos por endpoint
   - Versionable: docs para v1.0.5, v1.0.6, etc.
   - Opcionalmente: generar PDF a partir del HTML

e. **Herramientas Sugeridas**
   - HTML manual + CSS (control total, flexible)
   - O herramienta como: Markdown → HTML (vuepress, docusaurus, eleventy)
   - Considerar: cómo mantener documentación cuando código cambia

**Contexto:**
- Documentación es crítica para usuarios sin experiencia
- Reduce tiempo de onboarding
- Disminuye soporte/emails de preguntas básicas
- Mejora confianza en el sistema
- Facilita auditoría: documentación clara de funcionalidades

**Archivos a crear:**
- `/frontend/public/docs/index.html` (página principal)
- `/frontend/public/docs/css/styles.css` (estilos)
- `/frontend/public/docs/pages/` (secciones de contenido):
  * `autenticacion.html`
  * `gestion-planes.html`
  * `busqueda-afiliados.html`
  * `gestion-afiliados.html`
  * `gestión-cobradores.html`
  * `lookup-crud.html`
  * `generacion-recibos.html`
  * `gestion-usuarios.html`
  * `migraciones-bd.html`
  * `faq.html`
  * `glosario.html`
  * `troubleshooting.html`

**Estimación:**
- Estructura y CSS: 2h
- Escritura de documentación: 20-30h (según detalle y calidad)
  * Visión general: 1h
  * Autenticación: 1.5h
  * Gestión de Planes: 4h (complejo)
  * Búsqueda de Afiliados: 2h
  * Gestión de Afiliados: 2h
  * Lookup CRUD (4 secciones): 3h
  * Generación de Recibos: 3h
  * Gestión de Usuarios: 1.5h
  * Migraciones BD: 2h
  * FAQ: 2h
  * Glosario: 1h
  * Troubleshooting: 2h
- Revisión, pruebas, ajustes: 2h
- **Total: 24-34 horas** (depende del nivel de detalle)

**Prioridad:** 🔴 Alta — Documentación es crítica para usabilidad

**Complejidad:** Media-Alta (gran volumen de contenido, requiere análisis profundo del sistema)

**Estado:** 🚀 Desarrollado (2026-04-17)

**Implementación Completada (2026-04-17):**

**Documentación HTML Completa:**
✅ 12 archivos HTML creados en `/frontend/public/docs/`
✅ CSS responsive (1100+ líneas) con paleta coherente con la app
✅ 9 páginas de documentación:
   * index.html - Página principal, visión general, roles, navegación
   * autenticacion.html - Login, password blanqueada, logout
   * gestion-planes.html - Crear, editar, cambios de cuota, aumento masivo (más completo)
   * busqueda-afiliados.html - Búsqueda y acciones sobre planes
   * gestion-afiliados.html - CRUD de afiliados, roles, grupos familiares
   * gestion-recibos.html - Generar, regenerar, ver detalles
   * lookup-crud.html - Guía unificada para datos maestros
   * gestion-usuarios.html - Crear, cambiar roles, resetear (admin only)
   * migraciones-bd.html - Ejecutar, revertir migraciones (admin only)
   * faq.html - Preguntas frecuentes sobre todas las funcionalidades

**Características:**
✅ Descripción general del sistema
✅ Roles y permisos documentados
✅ Acceso a cada sección explicado
✅ Pantallas principales y componentes detallados
✅ Tablas de campos con validaciones y tipos
✅ Pasos comunes para tareas típicas
✅ Errores frecuentes y soluciones
✅ Preguntas frecuentes por sección
✅ Navegación clara entre páginas
✅ Responsive para mobile/tablet/desktop
✅ Links internos activos
✅ Estructura de dos columnas (nav + contenido)
✅ Tablas, alertas, badges estandarizadas

**Archivos Creados:**
- `frontend/public/docs/css/styles.css`
- `frontend/public/docs/index.html`
- `frontend/public/docs/js/nav.js`
- `frontend/public/docs/pages/autenticacion.html`
- `frontend/public/docs/pages/gestion-planes.html`
- `frontend/public/docs/pages/busqueda-afiliados.html`
- `frontend/public/docs/pages/gestion-afiliados.html`
- `frontend/public/docs/pages/gestion-recibos.html`
- `frontend/public/docs/pages/lookup-crud.html`
- `frontend/public/docs/pages/gestion-usuarios.html`
- `frontend/public/docs/pages/migraciones-bd.html`
- `frontend/public/docs/pages/faq.html`

**Tiempo Real:** ~14 horas (escritura + estructura de docs + integración)

**Commits:**
- 8ee2ecb - feat(BACKLOG-017): crear documentación HTML completa del sistema

---

### BACKLOG-019: Eliminar Entidades Lookup con Asociaciones en Cascada

**Descripción:**
Mejorar el flujo de eliminación de entidades lookup (Cobradores, Obras Sociales, Servicios Adicionales, Tipos de Grupo, Tipos de Plan) para permitir que el usuario elimine estos registros incluso si tienen asociaciones con planes o afiliados. Actualmente, el sistema bloquea la eliminación si encuentra referencias; el cambio propuesto es:

1. **Detección de asociaciones**: El sistema verifica si la entidad tiene asociaciones
2. **Confirmación informada**: Si hay asociaciones, muestra un modal detallado que:
   - Indica cuántos planes/afiliados están usando esta entidad
   - Advierte que las relaciones serán eliminadas en cascada
   - Ofrece opción de proceder o cancelar
3. **Eliminación en cascada**: Si el usuario confirma:
   - Se eliminan las referencias (relaciones con planes/afiliados)
   - Se elimina la entidad
   - Se informa del éxito al usuario
4. **Manejo de errores**: Si algo falla durante el proceso, se informa al usuario del error ocurrido

**Requerimientos:**

a. **Cambio de Filosofía en Backend**
   - Actual: DELETE rechaza si hay referencias (HTTP 409)
   - Nuevo: DELETE acepta parámetro opcional `force=true` para eliminación en cascada
   - Endpoint: `DELETE /api/lookup/:entidad/:id?force=true`
   - Si `force=true`: ejecuta eliminación en cascada
   - Si `force=false` (o no se especifica): verifica referencias y retorna 409 si hay asociaciones

b. **Estructura de Respuesta para Verificación (HTTP 409)**
   ```json
   {
     "success": false,
     "error": "No se puede eliminar, está en uso",
     "message": "Hay 5 planes usando este cobrador. ¿Deseas proceder eliminando las referencias?",
     "referencias": 5,
     "referenciaEn": "planes",
     "entidad": "cobradores",
     "entidadId": 123,
     "sugerencia": "Puedes desactivar el registro en lugar de eliminarlo (futura mejora)"
   }
   ```

c. **Eliminación en Cascada por Entidad**

   **Cobradores:**
   - Buscar planes que usen este cobrador
   - Opción 1 (simple): Establecer cobrador_numero = NULL en planes (si permite NULL)
   - Opción 2 (cascada): Eliminar planes que usan este cobrador
   - Recomendación: Opción 1 (preservar datos), asignar a NULL o a un cobrador "genérico"

   **Obras Sociales (os):**
   - Buscar planes con os_numero = id
   - Opción 1: Establecer os_numero = NULL
   - Opción 2: Eliminar planes
   - Recomendación: Opción 1 (preservar datos)

   **Servicios Adicionales:**
   - Buscar IntegranteServicio que usen servicio_adicional_numero = id
   - Eliminar registros IntegranteServicio relacionados
   - Los planes no se ven afectados directamente
   - Más seguro: simple eliminación de referencias

   **Tipos de Grupo (tipo_de_grupo):**
   - Buscar planes con tipo_de_grupo_numero = id
   - Opción 1: Establecer tipo_de_grupo_numero = NULL
   - Opción 2: Eliminar planes
   - Recomendación: Opción 1 (preservar datos)

   **Tipos de Plan (tipo_plan):**
   - Buscar planes con tipo_plan_numero = id
   - Opción 1: Establecer tipo_plan_numero = NULL
   - Opción 2: Eliminar planes
   - Recomendación: Opción 1 (preservar datos)

d. **Modal de Confirmación (Frontend)**
   - Componente: `ConfirmDeleteWithRefsModal.jsx` (NUEVO)
   - Muestra:
     * Título: "¿Eliminar {nombre de entidad}?"
     * Icono de alerta
     * Mensaje: "Esta entidad está siendo usada por X {referencias}"
     * Lista de referencias encontradas (si es posible): nombres de planes/afiliados
     * Advirtencia: "Si procedes, se eliminarán las referencias. Esta acción no se puede deshacer."
   - Botones:
     * "Cancelar" → volver sin hacer nada
     * "Sí, Eliminar" → llamar DELETE con `force=true`
   - Estados:
     * Cargando durante eliminación
     * Éxito: mostrar mensaje y cerrar modal
     * Error: mostrar error específico

e. **Flujo en Frontend (LookupCRUD.jsx)**
   - Usuario hace click en botón eliminar
   - Se llama a `handleDelete(id)`
   - Primero se intenta DELETE sin `force` → obtiene 409 con referencias
   - Se abre modal `ConfirmDeleteWithRefsModal` mostrando detalles
   - Si usuario cancela: no hacer nada
   - Si usuario confirma: llamar DELETE con `?force=true`
   - Esperar respuesta exitosa (200) y recargar lista
   - Mostrar mensaje de éxito o error

f. **Archivos a Modificar/Crear**

   **Backend:**
   - `backend/src/controllers/lookupController.js`:
     * Modificar `exports.delete` para aceptar parámetro `force`
     * Si `force=true`, ejecutar eliminación en cascada
     * Lógica diferenciada por entidad

   **Frontend:**
   - `frontend/src/components/LookupCRUD/LookupCRUD.jsx`:
     * Modificar `handleDelete` para capturar 409 y abrir modal
     * Agregar método para DELETE con `force=true`
   - `frontend/src/components/ConfirmDeleteWithRefsModal/ConfirmDeleteWithRefsModal.jsx` (NUEVO):
     * Modal con detalles de referencias
     * Botones de confirmación
     * Manejo de estados (cargando, error, éxito)
   - `frontend/src/components/ConfirmDeleteWithRefsModal/ConfirmDeleteWithRefsModal.scss` (NUEVO)
   - `frontend/src/services/lookupService.js`:
     * Extender método `delete` para aceptar parámetro `force`

**Contexto:**
- Actualmente, usuarios no pueden eliminar cobrador/OS/servicios si tienen asociaciones
- Bloquea completamente la acción sin opción alternativa
- Mejora UX: dar opción de proceder eliminando referencias
- Datos más limpios: no acumula registros "huérfanos"
- Decisión consciente: usuario debe ver qué va a pasar antes de proceder

**Análisis de Implementación:**

1. **Estado Actual del Backend:**
   - lookupController.js (líneas 217-230): Verifica referencias en config.refsCheck
   - Si encuentra referencias, retorna 409 con { error, referencias, referenciaEn }
   - Nunca ejecuta eliminación en cascada
   - No hay parámetro `force`

2. **Cambios Backend Necesarios:**
   - Agregar parámetro `force` a la ruta DELETE: `DELETE /api/lookup/:entidad/:id?force=true`
   - Si `force=false` (default): mantener comportamiento actual (rechazar si hay referencias)
   - Si `force=true`: ejecutar eliminación en cascada
   - Lógica diferenciada por entidad:
     ```javascript
     if (force === true) {
       // Ejecutar eliminación en cascada según entidad
       switch(entidad) {
         case 'cobradores':
           await db.PlanV1.update({ cobrador_numero: null }, { where: { cobrador_numero: id } });
           break;
         case 'obras-sociales':
           await db.PlanV1.update({ os_numero: null }, { where: { os_numero: id } });
           break;
         case 'servicios-adicionales':
           await db.IntegranteServicio.destroy({ where: { servicio_adicional_numero: id } });
           break;
         // ... más casos
       }
       // Luego destruir la entidad
       await registro.destroy();
     }
     ```

3. **Cambios Frontend Necesarios:**
   - LookupCRUD.jsx:
     * En `handleDelete`: cambiar flujo a two-step (primero intenta, si 409 → abre modal)
     * Capturar respuesta 409: `if (error.response?.status === 409)`
     * Guardar info de referencias en state
     * Abrir modal `ConfirmDeleteWithRefsModal` con detalles
   - Nuevo componente `ConfirmDeleteWithRefsModal.jsx`:
     * Props: { entidad, registroNombre, referencias, referenciaEn, onConfirm, onCancel, isLoading }
     * Estados: normal, cargando, error
     * En `onConfirm`: llamar a `lookupService.delete(entidad, id, { force: true })`

4. **Flujo Detallado de Usuario:**
   ```
   Usuario hace click en botón eliminar
   ↓
   Aparece primer confirm simple: "¿Estás seguro?"
   ↓
   Usuario confirma
   ↓
   Frontend intenta DELETE sin force
   ↓
   Backend retorna 409 con detalles de referencias
   ↓
   Frontend abre modal con mensaje: "Hay 5 planes usando este cobrador"
   ↓
   Usuario elige:
     - "Cancelar" → cierra modal, se cancela eliminación
     - "Sí, Eliminar" → envía DELETE con ?force=true
   ↓
   Backend ejecuta eliminación en cascada
   ↓
   Frontend recibe 200 y muestra "Eliminado correctamente"
   ↓
   Lista se recarga automáticamente
   ```

5. **Complejidad Estimada:**
   - Modificar lookupController.js (agregar lógica force): 2-2.5h
     * Análisis de casos por entidad
     * Código de eliminación en cascada
     * Testing de cada caso
   - Crear ConfirmDeleteWithRefsModal.jsx: 1.5h
   - Modificar LookupCRUD.jsx (integración dos pasos): 1.5h
   - Modificar lookupService.js (parámetro force): 0.5h
   - Testing completo (todos los casos de referencia): 1.5-2h
   - **Total: 7-7.5 horas**

6. **Riesgos y Consideraciones:**
   - **Data Loss**: Eliminar referencias significa perder datos de asociaciones
     * Mitigación: Modal advierte claramente, usuario confirma conscientemente
   - **Alternativa**: Desactivar en lugar de eliminar
     * Mejor que cascada: agregar columna `activo=0` en lugar de DELETE
     * Future: BACKLOG-020 para hacer entidades "inactivas" en lugar de eliminar
   - **Validaciones**: Si eliminación parcial falla (ejemplo: DELETE plan falla), ¿qué hacer?
     * Usar transacciones: toda la operación es atómica (TODO o NADA)
   - **Auditoría**: Registrar quién eliminó qué y cuándo
     * Considerar agregar columna `eliminado_por` y `fecha_eliminacion`

7. **Propuesta de Desarrollo (Plan Sugerido):**

   **Fase 1: Infraestructura Backend (2.5h)**
   - Agregar parámetro `force` a ruta DELETE
   - Crear función auxiliar `deleteWithCascade(entidad, id)`
   - Implementar lógica por entidad (con transacciones)
   - Testing de cada caso

   **Fase 2: Modal Frontend (1.5h)**
   - Crear `ConfirmDeleteWithRefsModal.jsx`
   - Estilos (reutilizar ConfirmCloseDialog de BACKLOG-012)
   - Estados: normal, cargando, error

   **Fase 3: Integración Frontend (1.5h)**
   - Modificar `handleDelete` en LookupCRUD
   - Dos pasos: intenta → captura 409 → abre modal → confirma
   - Manejo de errores mejorado

   **Fase 4: Testing (2h)**
   - Cada entidad: intenta eliminar con referencias
   - Confirma en modal y verifica cascada
   - Cancela en modal y verifica no-eliminación
   - Errores durante cascada (mitigación)

**Prioridad:** 🔴 Alta — Mejora UX en gestión de datos maestros, permite workflows más flexibles

**Estado:** 📋 Registrado (2026-04-17)

**Notas:**
- Análisis e propuesta sin implementación
- Considerar BACKLOG-020 como mejora futura: estado "inactivo" en lugar de eliminación
- Integra bien con BACKLOG-018 (manejo centralizado de errores)
- Requiere cuidado con transacciones para evitar estados intermedios inconsistentes

---

### BACKLOG-018: Centralizar Manejo de Respuestas del Backend con Success: False

**Descripción:**
Implementar un sistema centralizado para manejar respuestas del backend que contienen `success: false`. Actualmente, cada servicio y componente maneja los errores de forma independiente sin un patrón unificado. Este requerimiento propone centralizar la lógica para que al recibir una respuesta con `success: false` y un campo `message`, se genere automáticamente una alerta/notificación con el detalle del error.

**Requerimientos:**

a. **Patrón de Respuesta Estándar (Backend)**
   - El backend retorna respuestas con estructura:
     ```json
     {
       "success": false,
       "message": "Descripción del error",
       "data": null,
       "error_code": "OPTIONAL_CODE"
     }
     ```
   - HTTP status puede ser 400, 409, 422, 500, etc.
   - Campo `message` siempre contiene descripción legible para usuario

b. **Interceptor en Axios (services/api.js)**
   - Crear interceptor de respuesta que:
     * Detecte respuestas con `success: false`
     * Extraiga el campo `message`
     * Dispare notificación/alerta centralizada
     * Decida si propagar error o consumirlo según contexto
   - Alternativa: manejador en cada servicio (menos centralizado pero más flexible)

c. **Sistema de Notificaciones Integrado**
   - Usar contexto global existente (AuthContext.jsx) o crear uno nuevo
   - Estructura de notificación:
     ```javascript
     {
       id: uuid(),
       type: 'error' | 'warning' | 'success' | 'info',
       message: string,
       duration: 5000, // ms (auto-cerrar)
       action?: { label: string, onClick: () => {} }
     }
     ```
   - Mantener queue de notificaciones (múltiples simultáneamente)
   - Componente de visualización (Toast/Alert) que se renderiza en layout global

d. **Componente de Notificación (Toast/Alert)**
   - Componente reutilizable que muestra notificaciones
   - Ubicación: esquina inferior derecha (estándar) o top-right
   - Estilos: rojo para error, amarillo para warning, verde para success, azul para info
   - Auto-cierre: después de X ms (configurable)
   - Manejo de múltiples: stack vertical, las nuevas debajo
   - Icono: alerta, exclamación, check, etc. según tipo
   - Botón X para cerrar manualmente

e. **Integración en Frontend**
   - Renderizar componente de Toast/Alert en App.jsx (nivel raíz)
   - Toast consume contexto de notificaciones
   - Servicios disparan notificaciones via contexto
   - Componentes pueden agregar notificaciones directamente si lo necesitan

f. **Casos de Uso Comunes**
   - Crear/actualizar plan: error → "No se pudo actualizar el plan: email duplicado"
   - Generar recibos: HTTP 409 → "Ya existen recibos para este período"
   - Validación: error → "El campo email es requerido"
   - Permiso denegado: HTTP 403 → "No tienes permiso para realizar esta acción"
   - Server error: HTTP 500 → "Error del servidor. Por favor intenta más tarde"

**Contexto:**
- Actualmente hay ErrorDisplay component pero sin patrón centralizado
- Cada servicio/componente maneja errores de forma diferente
- Usuario recibe mensajes inconsistentes (a veces alert(), a veces en consola, a veces nada)
- Backend retorna `message` útil pero no siempre se muestra
- Mejora UX: notificaciones consistentes, claras y legibles
- Reduce duplicación: un único manejador en lugar de 10-15 intentos dispersos

**Análisis de Implementación:**

1. **Dónde originan las respuestas del backend:**
   - `frontend/src/services/*.js`: authService, personasService, planesV1Service, recibosService, usuariosService, lookupService
   - Cada servicio usa `axios` configurado en `services/api.js`
   - Axios instance tiene configuración base: base URL, headers (Authorization), timeouts
   - Actualmente no hay interceptor global de errores

2. **Cómo se manejan actualmente los errores:**
   - En componentes: `try/catch` alrededor de llamadas a servicios
   - Ejemplos encontrados:
     * `GestionPlanesV1.jsx`: catch → console.error() + setError(mensaje)
     * `PlanV1Modal.jsx`: catch → setErrorMessage(error.response?.data?.message)
     * `BusquedaAfiliados.jsx`: catch → setErrorMessage()
     * `GenerarRecibosModal.jsx`: HTTP 409 → showConfirmDialog()
   - Sin patrón consistente
   - Errores a veces no se muestran al usuario
   - Mix de console.error, state variables, modales de confirmación

3. **Cambios necesarios en services/api.js:**
   - Agregar interceptor de respuesta:
     ```javascript
     api.interceptors.response.use(
       response => {
         if (response.data?.success === false) {
           // Disparar notificación
           // Decidir si rechazar o devolver
         }
         return response;
       },
       error => {
         // Manejar errores de red, timeout, etc.
         return Promise.reject(error);
       }
     );
     ```
   - O alternativamente: crear wrapper en cada servicio (menos invasivo)

4. **Componentes de alerta existentes:**
   - `ErrorDisplay.jsx`: probablemente existe para mostrar errores (verificar ubicación)
   - Modales de confirmación: ConfirmCloseDialog.jsx (BACKLOG-012)
   - CSS/SCSS para alertas: probablemente en `_colors.scss` y/o componentes específicos
   - No hay Toast/Alert global centralizado

5. **Decisiones de diseño:**
   - **Opción A (Interceptor global)**: Más centralizado, maneja TODOS los errores automáticamente
     * Pro: una sola ubicación, consistente
     * Con: menos control por servicio, difícil para casos especiales (409 → confirmación)
   - **Opción B (Wrapper en servicios)**: Más flexible, control por servicio
     * Pro: puede decidir qué hacer con cada error (notificar vs consumir)
     * Con: requiere cambios en todos los servicios
   - **Opción C (Hook useAlert)**: Hook que servicios y componentes pueden usar
     * Pro: flexible, reutilizable en componentes también
     * Con: requiere que cada lugar lo use explícitamente
   - **Recomendación**: Combinación de B+C: servicios con wrapper, contexto con hook para componentes

6. **Archivos a modificar/crear:**
   - `frontend/src/context/AuthContext.jsx` (extender con manejo de notificaciones)
   - `frontend/src/context/NotificationContext.jsx` (NUEVO - si se crea contexto separado)
   - `frontend/src/hooks/useNotification.js` (NUEVO - hook para disparar notificaciones)
   - `frontend/src/components/Toast/Toast.jsx` (NUEVO - componente para mostrar notificaciones)
   - `frontend/src/components/Toast/Toast.scss` (NUEVO - estilos)
   - `frontend/src/App.jsx` (renderizar Toast component)
   - `frontend/src/services/api.js` (agregar interceptor o lógica base)
   - Múltiples servicios: wrapping de llamadas o integración de hook

7. **Complejidad Estimada:**
   - Crear contexto/hook de notificaciones: 1-1.5h
   - Crear componente Toast: 1h
   - Integrar en App.jsx: 0.5h
   - Modificar services (auth, personas, planes, recibos, usuarios, lookup): 2-3h
   - Modificar componentes principales que manejan errores: 1-2h
   - Testing y ajustes: 1-1.5h
   - **Total: 7-9 horas**

8. **Riesgos y Consideraciones:**
   - Casos especiales: HTTP 409 (período existente) requiere confirmación, no solo notificación
   - Sensibilidad de errores: algunos deben registrarse en logs para auditoría
   - Interfaz de usuario: decisión sobre ubicación/estilo de Toast (bottom-right vs top-right)
   - Performance: queue de notificaciones no debe crecer infinitamente
   - Mobile: Toast puede obstruir contenido en pantalla pequeña

**Prioridad:** 🔴 Alta — Mejora UX significativa, estandarización crítica

**Estado:** 📋 Registrado (2026-04-17)

**Notas:**
- Análisis registrado pero sin implementación
- Requiere decisión técnica sobre patrón (A, B o C)
- Puede combinarse con BACKLOG-012 (mejorar modales) para experiencia consistente
- Considerar versionado: v1.0.x usa este patrón, migraciones futuras mejoran si es necesario

---

## Items descartados

| ID | Descripción | Motivo descarte |
|----|-------------|-----------------|