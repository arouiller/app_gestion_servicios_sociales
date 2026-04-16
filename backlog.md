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
| BACKLOG-005 | 🟡 Media | ✅ Completado | Mejorar columna "Cambio" en tab Historial de Cuota | Implementado y aprobado: Nueva columna que muestra tipo de cambio (Fijo/Porcentual) con valor. Lógica de inferencia de tipo por cálculo dinámico | PlanV1Modal.jsx |
| BACKLOG-004 | 🔴 Alta | ⏳ Pendiente | Panel de Gestión de Usuarios: CRUD + cambio de rol + blanqueo de contraseña | Requerimiento core: solo admin puede acceder. Necesita: listar usuarios, crear nuevos (email), cambiar rol, blanquear contraseña. Usuarios nuevos/blanqueados loguearse solo con email y cambiar contraseña en primer acceso | Múltiples (GestionUsuarios.jsx, usuariosController, usuariosService, rutas) |
| BACKLOG-003 | 🟡 Media | ⏳ Pendiente | Estandarizar formato de listados: mismo layout para todas las tablas + iconos consistentes para acciones | Requerimiento transversal: todos los formularios con listados (Planes, Cobradores, Servicios, Tipos de Plan, Obras Sociales, etc.) deben tener el mismo formato visual y usar los mismos iconos (ej: ✎ editar, 🗑 eliminar, 👁 ver detalle) en todos los formularios | Múltiples componentes (todas las tablas de listado) |
| BACKLOG-002 | 🔴 Alta | 🔄 Desarrollado | Agregar tab de recibos en vista de plan | Implementado: Tab de recibos con paginación, carga dinámica y visualización de detalles. BUG-008 resuelto | PlanDetailModal.jsx, recibosService.js |
| BACKLOG-001 | 🟡 Media | 🔄 Desarrollado | Mejorar preview de aumento de cuotas: navegación completa + comparación antes/después | Implementado con BUG-009 resuelto: Tabla con alineación correcta, paginación, búsqueda y contraste antes/después | BulkUpdateCuotaModal.jsx, SCSS |

## Detalles de Items

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

**Notas:**
- Primera fase: crear componente y estilos estándar
- Segunda fase: aplicar progresivamente a todos los formularios
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

## Items descartados

| ID | Descripción | Motivo descarte |
|----|-------------|-----------------|