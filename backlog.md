# BACKLOG.md

Registro de mejoras y nuevos requerimientos detectados durante la implementación.
Estos ítems se abordan **después** de completar todas las fases del PLAN.md.

## Convención de prioridades
- 🔴 Alta — impacto directo en funcionalidad core
- 🟡 Media — mejora importante pero no bloqueante  
- 🟢 Baja — nice to have

## Convención de estados
- ⏳ Pendiente
- 🔄 En análisis
- ✅ Incorporado al plan
- 🔄 Desarrollado
- 🚫 Descartado (con motivo)
- ✅ Aprobado

## Items

| ID | Prioridad | Estado | Descripción | Contexto / Motivo | Archivos estimados |
|----|-----------|--------|-------------|-------------------|--------------------|
| BACKLOG-010 | 🔴 Alta | ✅ Completado | Botón Aumento Masivo habilitado para todos los perfiles | Usuarios comunes pueden ejecutar aumento masivo de cuotas. Restricción requireAdmin removida de PATCH /api/planes/bulk-update-cuota. Usuarios no-admin pueden aplicar cambios masivos de valores. | backend/src/routes/planes.js, GestionPlanesV1.jsx |
| BACKLOG-009 | 🔴 Alta | ✅ Completado | Usuarios comunes pueden realizar todas las acciones en páginas accesibles | Usuarios comunes ahora tienen acceso CRUD completo en Gestión de Planes: crear, editar, suspender, generar recibos, aumento masivo. Restricciones innecesarias removidas. | Múltiples (GestionPlanesV1, BusquedaAfiliados, etc.) |
| BACKLOG-008 | 🔴 Alta | ✅ Completado | Registro de períodos de emisión de recibos + confirmación antes de regenerar | Sistema debe registrar qué meses ya tienen recibos generados. Si usuario intenta generar para un mes existente, mostrar confirmación. Si confirma, borrar recibos antiguos y regenerar. Previene duplicación accidental de recibos | GenerarRecibosModal.jsx, recibosController.js, nueva migración (tabla de períodos) |
| BACKLOG-007 | 🔴 Alta | ✅ Completado | Control de acceso por rol: usuarios comunes no ven Administración | Usuarios comunes deben tener acceso a: Búsqueda de Afiliados, Gestión de Planes, Cobradores, Obras Sociales, Servicios, Tipos de Grupo, Tipos de Plan. Deben estar excluidos de: Gestión de Usuarios, Migraciones BD. Solo admin ve la sección "Administración" | DashboardPage.jsx |
| BACKLOG-006 | 🔴 Alta | ✅ Completado | Flujo de login para usuarios con password blanqueada | Implementado y probado: Checkbox "Tengo contraseña blanqueada" en LoginPage. Backend detecta password_blanqueada y retorna flag debe_cambiar_password. Frontend redirige a /cambiar-password. Flujo completo funcional y validado para onboarding de nuevos usuarios | LoginPage.jsx, authService.js, auth.js |
| BACKLOG-005 | 🟡 Media | ✅ Completado | Mejorar columna "Cambio" en tab Historial de Cuota | Implementado y aprobado: Nueva columna que muestra tipo de cambio (Fijo/Porcentual) con valor. Lógica de inferencia de tipo por cálculo dinámico | PlanV1Modal.jsx |
| BACKLOG-004 | 🔴 Alta | ✅ Completado | Panel de Gestión de Usuarios: CRUD + cambio de rol + blanqueo de contraseña | Implementado y probado: Panel CRUD completo (listar, crear, cambiar rol, blanquear contraseña). Backend: endpoints /api/usuarios, /api/usuarios/:id/rol, /api/usuarios/:id/blanquear-password. Frontend: GestionUsuarios, UsuarioFormModal, ChangePasswordRequired. Flujo: usuarios nuevos con password_blanqueada acceden a /cambiar-password. Todo funcional y validado | Múltiples (GestionUsuarios.jsx, usuariosController, usuariosService, rutas, auth.js, ChangePasswordRequired.jsx) |
| BACKLOG-003 | 🟡 Media | ✅ Completado | Estandarizar formato de listados: mismo layout para todas las tablas + iconos consistentes para acciones | Fase 1 + Fase 2 completadas: estilos estándar, componentes creados, aplicados a GestionPlanesV1 y LookupCRUD. | Múltiples componentes (todas las tablas de listado) |
| BACKLOG-002 | 🔴 Alta | ✅ Completado | Agregar tab de recibos en vista de plan | Implementado y aprobado: Tab de recibos con paginación, carga dinámica y visualización de detalles. BUG-008 resuelto | PlanDetailModal.jsx, recibosService.js |
| BACKLOG-001 | 🟡 Media | ✅ Completado | Mejorar preview de aumento de cuotas: navegación completa + comparación antes/después | Implementado y aprobado: Tabla con alineación correcta, paginación, búsqueda y contraste antes/después. BUG-009 resuelto | BulkUpdateCuotaModal.jsx, SCSS |

## Detalles de Items

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

**Estado:** ✅ Completado

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

**Estado:** ✅ Completado

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

**Estado:** 🔄 Desarrollado

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

**Estado:** ✅ Completado

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

**Estado:** 🔄 Desarrollado

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

**Estado:** ✅ Completado

**Implementación Completada (2026-04-16):**
1. ✅ Removido `requireAdmin` de `backend/src/routes/planes.js` (línea 12)
2. ✅ Removido `disabled={!isAdmin}` y title de frontend
3. ✅ Botón "Aumento Masivo" ahora habilitado para todos los perfiles
4. ✅ Backend solo requiere `verifyToken` (autenticación)

**Commits:**
- 45ff900 - feat(BACKLOG-010): botón Aumento Masivo habilitado para todos

---

## Items descartados

| ID | Descripción | Motivo descarte |
|----|-------------|-----------------|