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

**🔴 INSTRUCCIÓN IMPORTANTE PARA CLAUDE:**
- **NUNCA** marques un item como "✅ Solucionado" sin una indicación explícita del usuario
- Aunque la implementación esté completa, el item debe quedar en estado "🚀 Desarrollado" hasta que el usuario diga explícitamente "marca el item como solucionado" o "marca BACKLOG-XXX como resuelto"
- Esta regla asegura que el usuario tenga control explícito sobre el estado de cada requerimiento
- Si ya implementaste un item y el usuario NO indicó marcarlo como solucionado, actualiza el estado a "🚀 Desarrollado" en lugar de "✅ Solucionado"
- Solo el usuario puede indicar transiciones a "✅ Solucionado" o "🚫 Descartado"

**Nota:** Si un backlog item desarrollado encuentra problemas, se abre un bug en BUGS.md y el item vuelve a estado "Desarrollado" hasta que se resuelva el bug.


## Items

| ID | Prioridad | Estado | Descripción | Contexto / Motivo | Archivos estimados |
|----|-----------|--------|-------------|-------------------|----|
| BACKLOG-066 | 🔴 Alta | ✅ Solucionado | Agregar soporte para valor especial "0" en "Items por página" para deshabilitar paginación | Implementado y verificado: (1) Frontend: usePagination.js detecta items_per_page=0 y devuelve todos los items sin paginación. (2) Backend: planesController.js y lookupController.js manejan limit=0 sin aplicar límite. (3) UI: ConfiguracionNotificaciones permite 0-1000, actualizado hint y tip. (4) Todas las páginas adaptadas: GestionPlanesV1, LookupCRUD, GestionBugs, GestionAuditoria. Commits: 6638e8d, 10c38e1, 20773da, 5525fb1, 25027aa, 0b0f392, 30ac697 | ConfiguracionNotificaciones.jsx, Pagination.jsx, usePagination.js, planesController.js, lookupController.js, GestionPlanesV1.jsx, LookupCRUD.jsx, GestionBugs.jsx, GestionAuditoria.jsx |
| BACKLOG-063 | 🔴 Alta | ✅ Solucionado | Mejorar presentación de afiliados y números de recibo | Implementado y verificado: (1) Identificador zona-numero en PlanV1Modal header, RecibosPage, ReciboDetalleModal. (2) Campo numero_recibo con endpoint sugerencia, input en GenerarRecibosModal, migración 2.0.27. (3) Recibos existentes con numero_recibo=id, zona_codigo via JOIN. Commits: b0be0f1, ccd015f, 814255a, 14c639c, 0359b09, fb8c661, 1f56946, f44dcdf (fix), c8a0fda (fix) | Recibo.js, recibosController.js, recibosService.js, GenerarRecibosModal.jsx, RecibosPage.jsx, PlanV1Modal.jsx, ReciboDetalleModal.jsx, migrations/2.0.27 |
| BACKLOG-062 | 🟡 Media | ✅ Solucionado | Optimizar actualización de planes: endpoint único para PUT + sync integrantes + PATCH | Implementado y verificado: POST /planes/actualizar-completo/:id consolida 4 llamadas en 1. Transacción atómica Sequelize. Backend maneja actualización de plan + sincronización de integrantes + reorder en una sola operación. Frontend usa 1 llamada en lugar de 4. Commit: 671a625 | planesController.js, planesV1Service.js, PlanV1Modal.jsx |
| BACKLOG-061 | 🟡 Media | ✅ Solucionado | Optimizar creación de planes: endpoint único para plan + personas + integrantes | Implementado y verificado: POST /planes/crear-completo consolida 6 llamadas en 1. Transacción atómica Sequelize. Backend maneja personas deferred, integrantes y reorder en una sola operación. Frontend usa 1 llamada en lugar de 6. Commit: 89dfe24 | planesController.js, planesV1Service.js, PlanV1Modal.jsx |
| BACKLOG-060 | 🔴 Alta | ✅ Solucionado | Habilitar servicios para afiliados después de guardar plan nuevo | En modo crear, los afiliados se guardan todo junto con el plan (no auto-save). Después de "Guardar y Seguir Editando", habilitar selección de servicios. Botón ⚙️ se habilita automáticamente tras guardar. Commits: ab26cd4, 6f888ce (BUG-037 fix) | PlanV1Modal.jsx |
| BACKLOG-059 | 🔴 Alta | ✅ Solucionado | Guardado automático de afiliados al agregar a plan existente | Cuando un afiliado es agregado a un plan ya registrado, se guarda automáticamente sin esperar a "Guardar y Seguir Editando". Posición = última, rol automático (titular/adherente). Simplifica flujo, reduce clicks, mejor UX. Implementado con auto-save en modo editar. Commits: 388a3a8, 051dcfc | PlanV1Modal.jsx |
| BACKLOG-057 | 🟡 Media | ✅ Solucionado | Modal de confirmación obligatorio al eliminar servicios adicionales | Cuando un usuario intenta eliminar un servicio adicional desde la pantalla de gestión, siempre mostrar modal de confirmación, incluso si el servicio no tiene referencias (integrantes asociados). Cambio: LookupCRUD.jsx handleDelete() ahora abre modal siempre en lugar de intentar eliminar primero. Commit: c02ec29 | LookupCRUD.jsx |
| BACKLOG-068 | 🔴 Alta | ✅ Solucionado | Habilitar eliminación de planes para cualquier estado | Actualmente el icono de delete solo es visible si plan.estado === 'ACTIVO'. Requerimiento: habilitar eliminación para cualquier tipo de plan, independientemente de su estado. Implementado: (1) Removida condición `plan.estado === 'ACTIVO'` en GestionPlanesV1.jsx línea 377 (2) Actualizada spec RF-3 para reflejar que cualquier plan puede eliminarse. Backend ya permitía eliminación sin restricción. Commits: 483ddbd, 3574a5d | GestionPlanesV1.jsx, 2026-05-15-eliminar-planes-confirm-cascada-design.md |
| BACKLOG-056 | 🟡 Media | ✅ Solucionado | Mostrar último aumento masivo al generar recibos | Al generar recibos, mostrar cuál fue el último aumento masivo realizado (fecha, porcentaje, usuario que lo realizó) debajo del mensaje de qué mes se generarán recibos. Mejora transparencia: usuarios ven instantáneamente qué aumento afectará los nuevos recibos. Commits: ecac358, 5c9ed69, 09339a1 | GenerarRecibosModal.jsx, recibosService.js, recibosController.js, routes/recibos.js |
| BACKLOG-055 | 🟡 Media | ✅ Solucionado | Historial de aumentos de cuota - listado centralizado con pop-up | Crear tabla `aumentos_masivos` (fecha, porcentaje, usuario) para registrar cada operación de aumento masivo. Accesible desde GestionPlanesV1 a través de botón "Ver historial de aumentos" al lado del botón de aumento masivo. Listado ordenado en forma descendente (más recientes primero). Mejora trazabilidad y consulta de cambios históricos. Commits: adb523f, 13d95cf, ec8ba58, 52e4fc9, 4b6f20d | migrations/2.0.26, AumentoMasivo.js, planesController.js, HistorialAumentosModal.jsx |
| BACKLOG-054 | 🔴 Alta | ✅ Solucionado | Aumento de cuotas masivo: solo porcentajes, redondeo configurable | Mejorar funcionalidad de aumento masivo: (1) eliminar opción de aumento fijo, solo permitir porcentajes; (2) redondeo siempre hacia arriba (ceil); (3) precisión decimal del redondeo configurable desde UI. Commits: 28d4044, 3231b73, 9db9c06 | BulkUpdateCuotaModal.jsx, planesController.js, ConfiguracionNotificaciones.jsx, migrations/2.0.25, migrations/2.0.26 |
| BACKLOG-053 | 🟡 Media | 🚫 Descartado | Posicionamiento automático de nuevo plan en grilla ordenada | **Descartado a favor de BACKLOG-057 (Sortable Headers)**: Implementación global de ordenamiento dinámico en headers supersede este requerimiento. Con sortable headers, usuarios pueden ordenar por zona + número_afiliado directamente, consiguiendo posicionamiento correcto sin reposicionamiento automático. Solución más general y reutilizable. | GestionPlanesV1.jsx, sortUtil.js, useSortable.js |
| BACKLOG-052 | 🟡 Media | ✅ Solucionado | Redimensionamiento manual de columnas con persistencia en localStorage | Permitir que los usuarios cambien manualmente el ancho de las columnas en las tablas (GestionPlanesV1, LookupCRUD). Las preferencias de ancho se guardan en localStorage y persisten entre sesiones del navegador. Mejora UX: usuarios pueden ajustar columnas según sus preferencias. Hook useColumnResize con drag & drop en headers. Completado en todas las 17 tablas del sistema. Commits: 2c816f9, 56a3e0b, effa576, 2d2b9c5, 5448447, 54e636c, 044754c, 6da9a82, c17531d, ff405ba, d882cc7, f4d1fd5, 700555b, 036adf0 | useColumnResize hook, todas las tablas, _table-standard.scss |
| BACKLOG-051 | 🟡 Media | ✅ Solucionado | Reformatear tabla de listado de planes - columnas virtuales | En la tabla GestionPlanesV1 (listado principal de planes): (1) crear columna virtual "Identificador" con formato zona_codigo + "-" + numero_afiliado (ej: "01-00042"); (2) eliminar columna numero_afiliado redundante; (3) agregar columna "Titular" con datos del titular del plan (apellido, nombre). Mejora UX: información más útil e identificación clara de planes por zona. Commits: ee8c18e, 636d9e4 | GestionPlanesV1.jsx, planesController.js |
| BACKLOG-050 | 🟡 Media | ✅ Solucionado | Reformatear tabla de afiliados en tab de PlanV1Modal | Mejorar presentación de integrantes en tab de afiliados. Eliminar columnas redundantes (orden, apellido, nombre individuales), agregar combinadas (apellido, nombre). Agregar fechas (nacimiento, cobertura) con cálculo de edad. Agregar servicios adicionales concatenados con 2 letras. Commits: 8f600d4, d1d0082, 20f55c0, 911f013 | PlanV1Modal.jsx, formatters.js, planesController.js, index.js |
| BACKLOG-049 | 🟡 Media | ✅ Solucionado | Números de documento duplicados permitidos — remover constraint UNIQUE | Permitir que múltiples personas tengan el mismo número de documento. La migración 2.0.8 ya removió el constraint UNIQUE a nivel de BD. Se actualizó Persona.js para alinear el modelo. Se removió validación de duplicados en personasController.js. Commits: 4eec97e, 469fece, 54ec323 | Persona.js model |
| BACKLOG-048 | 🔴 Alta | ✅ Solucionado | Integrantes ordenables con drag & drop — rol por posición | Permitir reordenar integrantes de un plan mediante drag & drop en PlanV1Modal. El rol (titular vs integrante) se determina automáticamente por posición: primeros en lista = titulares, resto = integrantes. Campo `orden` en tabla plan_integrantes refleja el reorden. Migración para actualizar rol en registros existentes donde no está definido. Mejora UX y simplifica gestión de roles. | migrations/2.0.24, PlanIntegrante.js, PlanV1Modal.jsx, usePlanV1Form.js, planesIntegrantesService.js |
| BACKLOG-047 | 🔴 Alta | ✅ Solucionado | Número de afiliado: formato de 5 dígitos con padding y auto-incremento | Estandarizar formato de número de afiliado a exactamente 5 dígitos (00001, 00002, etc.). Implementar auto-padding a izquierda con ceros. Validar unicidad. Sugerir automáticamente MAX+1 al crear plan. Mejora consistencia, evita duplicados, simplifica auditoría. | planesController.js, PlanV1Model.js, PlanV1Modal.jsx, usePlanV1Form.js, validateors/planesValidators.js, planesV1Service.js |
| BACKLOG-046 | 🟡 Media | ✅ Solucionado | Eliminar tablas legacy: afiliados, grupos_familiares, historial_grupo_familiar, planes_v2_backup | Auditoría completada: 0 referencias en código. Migración 2.0.23 con DROP TABLE + downgrade idempotente. Modelo Plan.js (planes_v2_backup) eliminado. historialController.js (orphaned, requería modelos inexistentes) eliminado. Commits: e69c0cf (migración), 0f6cd44 (cleanup). | migrations/2.0.23 |
| BACKLOG-045 | 🔴 Alta | ✅ Solucionado | Agregar zona y localidad a planes con dropdowns en UI | Cada plan debe tener asociado una zona (FK zona_id) y una localidad (FK localidad_id) en BD. UI debe permitir seleccionar zona y localidad mediante dropdowns en PlanV1Modal. Migración 2.0.22 para agregar campos. Mejora geolocalización y gestión territorial de planes. | migrations/2.0.22, PlanV1.js, planesController.js, PlanV1Modal.jsx, usePlanV1Form.js |
| BACKLOG-044 | 🔴 Alta | ✅ Solucionado | Migración 2.0.19 - Eliminar zona de planes y agregar nuevos estados | Eliminar campo zona de planes y zona_id de plan_integrantes (campos legados sin FK formal). Agregar nuevos estados al ENUM: ELIMINADO y PROMOCION. Crear endpoint getAll para listados sin restricción de zona. Corregir asociaciones de modelos. | migrations/2.0.19, PlanV1.js, PlanIntegrante.js, models/index.js, listadosController.js, listadosService.js |
| BACKLOG-043 | 🔴 Alta | ✅ Solucionado | Nueva entidad Zona independiente con CRUD | Nueva tabla Zona (código: 2 dígitos, nombre: string). Zona es una entidad **independiente** de Provincia y Localidad (no jerárquica). CRUD completo en interfaz de gestiones. Requiere migración, modelos, controladores, servicios, componente UI. | migrations/2.0.20, Zona.js model, lookupController.js, GestionZonas.jsx |
| BACKLOG-042 | 🔴 Alta | ✅ Solucionado | Mover enlace de Gestión Provincias/Localidades a sección de Gestiones | Enlace integrado en sección Gestión del Dashboard junto con Cobradores, Obras Sociales, Servicios, Tipos de Grupo, Tipos de Plan. Mejora UX y discoverability. Iconos estandarizados con ActionButton/IconButton. | DashboardPage.jsx, ProvinciaRow.jsx, GestionProvinciasZonas.scss |
| BACKLOG-040 | 🔴 Alta | ✅ Solucionado | Selector de Zona en Formulario de Afiliados | Dropdown de zona en PlanV1Modal. Carga zonas disponibles de tabla zonas. Asigna zona a nivel de plan, no a cada afiliado. Mejora UX permitiendo designar zona geográfica para cada plan. | PlanV1Modal.jsx, planesIntegrantesController.js, zonaService.js, planesIntegrantesService.js |
| BACKLOG-036 | 🔴 Alta | ✅ Solucionado | Entidad Provincias y Zonas - CRUD jerárquico | Estructura jerárquica: Provincia (1) → (N) Zonas. CRUD unificado en pantalla con tree view. Requiere 2 tablas con FK, migración de datos, endpoints API dual, pantalla jerárquica. Base para otros requerimientos. | migrations/v2.0.x, Provincia/Zona models, controllers, GestionProvinciasZonas.jsx, servicios |
| BACKLOG-035 | 🔴 Alta | ✅ Solucionado | Optimizar espacio de trabajo: sidebar colapsable y ocultable | (1) Reducir márgenes/padding a izquierda y derecha. (2) Menú sidebar con collapse automático (expandir item → colapsan otros). (3) Botón/icono para ocultar sidebar completamente a la izquierda, con toggle para reabrirlo. Mejora UX permitiendo máximo espacio para contenido. | DashboardPage.jsx, DashboardPage.scss, Sidebar component |
| BACKLOG-034 | 🔴 Alta | ✅ Solucionado | Herramienta de Ejecución de Queries SQL (Admin Only) | Administrador puede ingresar queries SQL (SELECT, INSERT, UPDATE, DELETE), ejecutarlas y ver resultados. Útil para auditoría, diagnóstico, análisis de datos y correcciones de BD. Prohibidas operaciones DROP, ALTER, CREATE. Con límite de resultados (1000) y logging de ejecución. | queryExecController.js, admin.js, QueryExecPage.jsx, queryExecService.js |
| BACKLOG-033 | 🟡 Media | ✅ Solucionado | Estandarizar estructura de barras de filtros en pantallas de gestión | Estructura estándar implementada: título arriba, debajo barra de filtros con búsqueda (izquierda expandida) + botones (derecha). Todos alineados verticalmente al centro. Aplicado en todas las pantallas de gestión con flexbox y BEM. | GestionPlanesV1.jsx, LookupCRUD.jsx, BusquedaAfiliados.jsx, GestionAuditoria.jsx, SCSS |
| BACKLOG-064 | 🔴 Alta | ✅ Solucionado | Eliminar recibos por período desde tabla de períodos | En la vista de períodos de Gestión de Recibos, agregar icono 🗑 en cada fila de período. Al hacer clic, mostrar modal de confirmación simple que muestre periodo y cantidad de recibos. Si confirma, eliminar todos los recibos del período en cascada (ReciboIntegrante + Recibo + PeriodosRecibos). Mejora manejo de datos y recuperación de errores de generación. Commits: b44d768, 21dc35e | ConfirmDeletePeriodoRecibosModal.jsx, ConfirmDeletePeriodoRecibosModal.scss, RecibosPage.jsx, recibosService.js, recibos.js routes, recibosController.js |
| BACKLOG-065 | 🔴 Alta | 📋 Registrado | Impresión de recibos en PDF | En el formulario mostrado después de generar recibos, agregar botón "Imprimir" que genere un PDF con todos los recibos del período generado. PDF debe incluir detalles de cada recibo (número, afiliado, titular, obra social, cuota) en formato de tabla o listado. | GenerarRecibosModal.jsx, recibosService.js, recibosController.js, pdfkit (dependency) |
| BACKLOG-032 | 🔴 Alta | ✅ Solucionado | Sistema de Auditoría - Listado de Acceso a Endpoints del Backend | Admin solo: listado de accesos a endpoints mostrando usuario, fecha/hora, endpoint invocado, parámetros. Trazabilidad completa, compliance, detección de actividad sospechosa. Requiere tabla audit_log, middleware global, sanitización de datos sensibles, escritura asíncrona. | migrations/2.0.14, auditMiddleware.js, auditLog model/controller, AuditLogPage.jsx, auditService.js |
| BACKLOG-031 | 🔴 Alta | ✅ Solucionado | Implementar paginación en listados (>10 registros) | Todos los listados (planes, afiliados, cobradores, obras sociales, servicios adicionales, tipos de grupo, tipos de plan) deben paginar cuando excedan 10 registros. Mejora UX y performance. Requiere componente de paginación reutilizable y actualización de servicios backend. | GestionPlanesV1.jsx, BusquedaAfiliados.jsx, LookupCRUD.jsx, Pagination.jsx, múltiples servicios |
| BACKLOG-030 | 🟢 Baja | ✅ Solucionado | Modificar sección de Soporte en Footer (WhatsApp + Email) | Mejorar accesibilidad del contacto directo en landing page. Reemplazar "Contacto" por link WhatsApp (+54 11 3355 2955) y agregar link de Email (alejandro.rouiller@gmail.com). Facilita soporte rápido para usuarios. | Footer.jsx, Footer.scss |
| BACKLOG-029 | 🟡 Media | ✅ Solucionado | Sistema de Gestión de Bugs (Reportes de Problemas) | Sistema centralizado de reporte y gestión de bugs donde usuarios pueden registrar problemas con editor de texto enriquecido (Quill) y soporte de imágenes. Flujo de estados controlado por admin (REGISTRADO → DESARROLLADO/DESESTIMADO → CERRADO). Números únicos auto-generados (BUG-0001, BUG-0002, etc.). | migrations/2.0.11, bugsController.js, routes/v1.0/bugs.js, bugsService.js, GestionBugs.jsx, BugFormModal.jsx, BugDetalleModal.jsx, StatusBadge.scss |
| BACKLOG-025 | 🔴 Alta | ✅ Solucionado | Implementar debounce configurable en búsquedas de texto | Todas las búsquedas por texto deberían iniciarse después de 2000ms (configurable) sin input. Mejora: reduce llamadas al servidor, mejor UX. Afecta: BusquedaAfiliados, LookupCRUD, y otros. Requiere backend config y posible migración BD 2.0.9 para tabla de configuración. | useDebounce hook, configService, ConfiguracionApp |
| BACKLOG-023 | 🔴 Alta | ✅ Solucionado | Agregar campo abreviacion a Tipos de Plan | Campo requerido (NOT NULL) en tabla tipo_plan. Disponible en BD y UI (crear/editar). Ej: "Plan Premium" → "PP", "Plan Basic" → "PB". Facilita identificación rápida en listas y reportes. | migrations/2.0.7, models/TipoDePlan, TiposDePlan.jsx |
| BACKLOG-022 | 🔴 Alta | ✅ Solucionado | Agregar campo abreviacion a Tipos de Grupo | Campo requerido (NOT NULL) en tabla tipo_grupo. Disponible en BD y UI (crear/editar). Ej: "Familiar" → "FAM", "Individual" → "IND". Mejora usabilidad en formularios y reportes. | migrations/2.0.7, models/TipoDeGrupo, TiposDeGrupo.jsx |
| BACKLOG-021 | 🔴 Alta | ✅ Solucionado | Navegación automática a campo con error en PlanV1Modal | Al crear/editar plan, si falta dato o hay error del backend, UI navega automáticamente al tab y campo afectado. Mejora UX: usuario ve dónde está el problema sin búsqueda manual. Implementado: FIELD_TO_TAB, navigateToFirstError(), validate() retorna errors object, manejo de 422/409. | PlanV1Modal.jsx, usePlanV1Form.js, planesController.js |
| BACKLOG-020 | 🔴 Alta | ✅ Solucionado | Auto-generación y validación de número de afiliado numérico | Campo número_afiliado es STRING con representación numérica. UI solo permite números. Sistema propone MAX+1. Validación de unicidad. Implementado: validación regex /^\d+$/ en frontend y backend, inputMode="numeric", pattern="[0-9]*", regla numeric en schema, validación en crear/actualizar. | PlanV1Modal.jsx, usePlanV1Form.js, planesController.js, validate.js, v1.0-planes.js |
| BACKLOG-019 | 🔴 Alta | ✅ Solucionado | Eliminar entidades lookup con asociaciones en cascada | Al eliminar cobrador/OS/servicio/tipo grupo/tipo plan, si hay asociaciones, confirmación y eliminación en cascada. No bloqueo, sino opción de proceder. Implementado con migración 2.0.5. | lookupController.js, LookupCRUD.jsx, migrations, ConfirmDeleteWithRefsModal |
| BACKLOG-018 | 🔴 Alta | ✅ Solucionado | Centralizar manejo de respuestas del backend con success: false | Estandarizar presentación de errores. Al recibir respuesta con success: false y message, generar alerta unificada. Mejora UX y reduce duplicación de manejo de errores. | services/api.js, context/AuthContext.jsx, múltiples servicios |
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
| BACKLOG-067 | 🔴 Alta | ✅ Solucionado | Eliminar plan con confirmación de cascada | Al hacer clic en acción de "eliminar" un plan, mostrar modal que ofrece dos opciones: "Suspender" o "Eliminar". Si "Suspender": proceder como actualmente. Si "Eliminar": pedir confirmación adicional indicando que es irreversible, luego eliminar plan y todos sus dependientes (integrantes, recibos, historiales de cuota, etc). Actualizar grilla tras eliminación. (Commits: bea185d, f467520, 0ed8de6, 8eb415e, 39f8860, 561e466, 05f9b65) | ConfirmDeletePlanModal.jsx, ConfirmDeletePlanPermanentModal.jsx, planesController.js, planesV1Service.js, GestionPlanesV1.jsx |
| BACKLOG-069 | 🔴 Alta | ✅ Solucionado | Reordenar botones en modal de confirmación de eliminación de plan | En el modal de confirmación de eliminación de plan, cambiar orden de botones de (Suspender plan, Cancelar, Eliminar Plan) a (Cancelar, Eliminar Plan, Suspender Plan). Mejora UX: acciones más seguras (Cancelar) a la izquierda, acción destructiva confirmada (Eliminar Plan) al centro, y acción alternativa (Suspender Plan) a la derecha. Implementado en ConfirmDeletePlanModal.jsx. Commit: 66f0f1d | ConfirmDeletePlanModal.jsx |
| BACKLOG-070 | 🟡 Media | ✅ Solucionado | Reorganizar "Configuración de la Aplicación" y mejorar estilo de parámetros | Reorganizar página de configuración UI con nuevo orden de secciones: (1) Redondeo de cuotas, (2) Configuración UI (unificar Configuración de búsquedas + Configuración UI), (3) Configuración de notificaciones, (4) Configuración de auditoría. Además, actualizar estilo del parámetro redondeo_precision para mantener consistencia con otros parámetros (borde, color, icono). Renombrar menú "Configuración UI" a "Configuración de la Aplicación". Implementado y pushado. Commits: 5206b2d, eae96be, 1c2ef21, 6dad90f | ConfiguracionNotificaciones.jsx, DashboardPage.jsx |
| BACKLOG-071 | 🔴 Alta | ✅ Solucionado | Permitir porcentajes negativos en aumento masivo de cuotas | Implementado: (1) Frontend: remover min="0.01", cambiar validación de `<= 0` a `!valor`, actualizar hints, mostrar signos dinámicos en preview (+10% o -15%, con diferencias). (2) Backend: cambiar validación de `<= 0` a `!valor` en planesController.js. Cálculo matemático ya soporta negativos. (3) Ancho del modal duplicado a 90vw. Spec: 2026-05-15-permitir-porcentajes-negativos-aumento-masivo-design.md. Commits: 7b6a03b, 2443693, 72c6550, 535c98c, cab41fc, d7cee0c, d303792, 54d14d3, 98d05b0, a651354 | BulkUpdateCuotaModal.jsx, BulkUpdateCuotaModal.scss, planesController.js |
| BACKLOG-072 | 🔴 Alta | 📋 Registrado | Búsqueda en gestión de planes: filtrar solo por apellido del titular | Actualmente la búsqueda por cadena de texto busca en múltiples campos. Requerimiento: restringir búsqueda solo al apellido del titular. | GestionPlanesV1.jsx, planesService.js |
| BACKLOG-073 | 🔴 Alta | 📋 Registrado | Navegación por teclado en gestión de planes con registro activo | Implementar concepto de "registro activo" en tabla de planes. Navegación: ↑/↓ (un registro), scroll up/down (una página). ALT+G abre información del plan activo. Visual: fila resaltada. | GestionPlanesV1.jsx, PlanV1Modal.jsx, usePagination.js |
| BACKLOG-074 | 🟡 Media | ✅ Solucionado | Reordenar campos en formulario de planes: zona a la izquierda del número de afiliado | Implementado: zona movida al inicio del formulario, display personalizado que muestra solo código cuando está seleccionado (código+nombre en dropdown). State zonaCodigo + handler handleZonaChange + estilos CSS. BUG-051 detectado y resuelto. Commits: 63c1aad, cd43ce2, c63e0b5, 312bffa, bc5f971 | PlanV1Modal.jsx, PlanV1Modal.scss |
| BACKLOG-075 | 🟡 Media | ✅ Solucionado | Orden de campos en formulario de planes | Implementado: nuevo orden establecido (Zona, Número Afiliado, Tipo Grupo, Tipo Plan, Cobrador, Obra Social, Estado, Valor Cuota, Domicilio, Teléfono, Localidad). Commit: 63c1aad | PlanV1Modal.jsx |
| BACKLOG-076 | 🔴 Alta | ✅ Solucionado | Navegación por teclado en PlanV1Modal: Enter para abrir plan + atajos de tabs | Implementado y verificado: (1) GestionPlanesV1.jsx: ALT+G reemplazado por Enter para abrir plan. (2) PlanV1Modal.jsx: atajos ALT+A (Afiliados), ALT+R (Recibos), ALT+D (Datos), ALT+H (Historial) + auto-focus en primer componente interactivo de cada tab. (3) Nuevo hook useTabNavigation.js para reutilización. Commits: 0490891, 8b3074f, 46b6d96, fc141a4 | GestionPlanesV1.jsx, PlanV1Modal.jsx, useTabNavigation.js |
| BACKLOG-077 | 🔴 Alta | ✅ Solucionado | Remover sticky header en Gestión de Planes | Implementado y verificado: (1) Removido position: sticky y top: 0 del header principal (.gestion-planes-v1__sticky-header). (2) Removido position: sticky, top: 0 y z-index del table header (thead tr). (3) Agregado position: sticky; top: 0 al thead dentro del contenedor scrollable para header flotante interno. (4) Agregado scroll-padding-top: 50px para evitar que primer registro quede oculto. (5) Tabla adaptada dinámicamente al espacio disponible con flex: 1 y min-height: 100vh. El header principal scrollea normalmente, tabla tiene scroll interno, usuario nunca excede viewport. Commits: b7bc1b7, d79d156, f9ccd55, a5e387d, 93df11f | GestionPlanesV1.jsx, GestionPlanesV1.scss |

## Detalles de Items

### BACKLOG-056: Mostrar Último Aumento Masivo al Generar Recibos

**Descripción:**
Al generar recibos de un determinado mes/año, mostrar al usuario cuál fue el **último aumento masivo** que se realizó en el sistema (fecha, porcentaje aplicado, usuario que lo realizó). Esta información debe aparecer **debajo del mensaje** que indica qué recibos de qué mes se generarán.

**Contexto:**
Mejora la transparencia del flujo de generación de recibos. Los usuarios pueden ver instantáneamente qué aumento afectará los valores de los recibos a generar. Evita confusiones sobre qué tasa se aplicó en cada generación.

**Requerimientos Funcionales:**

1. **Ubicación en UI**
   - Componente: `GenerarRecibosModal.jsx`
   - Posición: Debajo del mensaje "Se generarán recibos para mes de XXXX/YYYY"
   - Formato de visualización: Sección informativa destacada

2. **Datos a Mostrar**
   - Fecha del último aumento (formato: DD/MM/YYYY HH:MM:SS)
   - Porcentaje aplicado (ej: "5.50%")
   - Usuario que realizó el aumento (apellido, nombre)
   - Ejemplo: "Último aumento: 5.50% realizado el 07/05/2026 14:30:22 por Juan Pérez"

3. **Comportamiento**
   - Si NO hay aumentos masivos previos en el sistema → mostrar "Sin aumentos masivos registrados"
   - Si hay aumentos → mostrar siempre el más reciente (ORDER BY fecha DESC LIMIT 1)
   - Información es de SOLO LECTURA (no editable)

4. **Datos del Backend**
   - Consultar tabla `aumentos_masivos` (ya existe desde BACKLOG-055)
   - Usar la asociación `AumentoMasivo.belongsTo(Usuario)` para obtener datos del usuario
   - Retornar en respuesta de generación de recibos o en endpoint separado de consulta

**Requerimientos Backend:**

1. **Endpoint Consulta (opción simple)**
   - GET `/api/recibos/ultimo-aumento-masivo`
   - Respuesta: `{ success: true, data: { fecha, porcentaje, usuario: { apellido, nombre } } }` o `{ success: true, data: null }`

2. **Controller recibosController.js**
   - Nueva función `getUltimoAumentoMasivo()` que consulta AumentoMasivo orderBy DESC fecha limit 1

**Requerimientos Frontend:**

1. **Componente GenerarRecibosModal.jsx**
   - Hook `useEffect` para cargar último aumento masivo al abrir modal
   - Estado: `const [ultimoAumento, setUltimoAumento] = useState(null)`
   - Renderizar información debajo del mensaje de mes a generar
   - Manejo de carga (loading) y error

2. **Servicio recibosService.js**
   - Nueva función: `getUltimoAumentoMasivo()` que consume `/api/recibos/ultimo-aumento-masivo`

**Archivos a Modificar:**
- `backend/src/controllers/recibosController.js` (agregar función getUltimoAumentoMasivo)
- `backend/src/routes/recibos.js` (agregar GET /ultimo-aumento-masivo)
- `frontend/src/services/recibosService.js` (agregar método getUltimoAumentoMasivo)
- `frontend/src/pages/DashboardPage/components/GenerarRecibosModal/GenerarRecibosModal.jsx` (cargar y mostrar información)

**Estado:** 📋 Registrado (pendiente de implementar)

---

### BACKLOG-057: Modal de Confirmación Obligatorio al Eliminar Servicios Adicionales

**Descripción:**
Cuando un usuario intenta eliminar un servicio adicional desde la pantalla de gestión de Servicios Adicionales, siempre mostrar un modal de confirmación, incluso si el servicio NO tiene referencias (integrantes asociados). Actualmente, si el servicio no tiene referencias, se elimina directamente sin pedir confirmación.

**Contexto:**
Mejora la UX mediante consistencia en el flujo de confirmación. Todos los items de lookup que se eliminen deben pasar por modal de confirmación, independientemente de si tienen referencias o no. Esto previene eliminaciones accidentales y aumenta la confiabilidad percibida de la aplicación.

**Estado Actual:**
- Si servicio NO tiene referencias → se elimina directamente (sin modal)
- Si servicio SÍ tiene referencias → se muestra modal con opción de eliminar en cascada o cancelar

**Estado Deseado:**
- SIEMPRE mostrar modal de confirmación, incluso sin referencias
- Modal muestra: nombre del servicio, cantidad de integrantes que lo usan (0 si ninguno), botones Confirmar/Cancelar

**Requerimientos Funcionales:**

1. **Modal de Confirmación**
   - Componente: `ConfirmDeleteWithRefsModal.jsx`
   - Mostrar: "¿Está seguro que desea eliminar '{nombre_servicio}'?"
   - Si hay referencias: mostrar cantidad de integrantes que lo usan
   - Si NO hay referencias: mostrar "Este servicio no tiene referencias"
   - Botones: "Eliminar" (rojo) y "Cancelar"

2. **Flujo de Eliminación**
   - Usuario hace click en icono de eliminar
   - Se abre modal de confirmación (siempre)
   - Usuario elige: Eliminar o Cancelar
   - Si Eliminar:
     - Si NO hay referencias → eliminar servicio directamente
     - Si HAY referencias → eliminar servicio + todos los registros de integrante_servicios

3. **Backend**
   - Endpoint: `DELETE /api/lookup/servicios-adicionales/:id`
   - Query param: `force=true` (opcional, para forzar eliminación en cascada)
   - Comportamiento: SIEMPRE eliminar (no retornar 409 sin force)
   - Cambiar lógica: remover condición `if (referenciaEncontrada && !forceDelete) → return 409`

**Implementación:**

**Frontend (LookupCRUD.jsx)**
- ✅ Cambió `handleDelete()` para abrir modal de confirmación SIEMPRE (sin intentar eliminar primero)
- ✅ `handleConfirmDeleteWithRefs()` ya usa `force=true`, que maneja eliminación en cascada si es necesario
- ✅ Modal se muestra incluso sin referencias (estado inicializado con referencias=0)

**Testing Realizado:**
1. ✅ Eliminar servicio sin referencias → modal aparece → confirmar → servicio se elimina
2. ✅ Eliminar servicio con referencias → modal aparece → confirmar → servicio + referencias se eliminan
3. ✅ Cancelar en cualquier caso → modal cierra, nada se elimina

**Cambios:**
- ✅ `frontend/src/components/LookupCRUD/LookupCRUD.jsx` (cambió handleDelete, ahora abre modal siempre)
- No requería cambios en backend (lógica de cascada ya estaba en lugar)

**Estado:** ✅ Solucionado (2026-05-07)

**Commit:** c02ec29 — feat(lookup): modal de confirmación obligatorio al eliminar items sin referencias

---

### BACKLOG-047: Número de Afiliado - Formato 5 Dígitos con Padding y Auto-Incremento

**Descripción:**
Estandarizar el formato del número de afiliado a exactamente **5 dígitos** con relleno automático a la izquierda con ceros. El sistema debe validar unicidad, aplicar padding automático, y sugerir el siguiente número (MAX + 1) al crear nuevos planes.

**Requerimientos Funcionales:**

1. **Formato de 5 Dígitos**
   - ✅ Número de afiliado debe ser STRING de longitud **exactamente 5**
   - ✅ Ejemplos válidos: "00001", "00100", "01250", "99999"
   - ❌ Ejemplos inválidos: "1" (debe ser "00001"), "123" (debe ser "00123"), "123456" (más de 5)

2. **Auto-Padding a Izquierda**
   - Si usuario ingresa "1" → se convierte a "00001"
   - Si usuario ingresa "123" → se convierte a "00123"
   - Si usuario ingresa "1250" → se convierte a "01250"
   - Si usuario ingresa "00100" → se mantiene "00100"
   - El padding debe aplicarse ANTES de guardar en BD

3. **Validación de Unicidad**
   - Número de afiliado debe ser UNIQUE en tabla planes
   - Al crear: verificar que no exista otro plan con el mismo número (después del padding)
   - Al editar: verificar que no exista otro plan diferente con el mismo número
   - Retornar error 409 si duplicado: "Ya existe un plan con número de afiliado {numero}"

4. **Auto-Incremento y Sugerencia**
   - Al abrir modal de creación de plan: calcular MAX(numero_afiliado) en BD
   - Sugerir siguiente número: MAX + 1 (padded a 5 dígitos)
   - Ejemplos:
     - Si MAX es "00099" → sugerir "00100"
     - Si MAX es "00999" → sugerir "01000"
     - Si MAX es "99998" → sugerir "99999"
     - Si BD vacía → sugerir "00001"

5. **Validación de Rango**
   - Mínimo: "00001" (0 no es válido)
   - Máximo: "99999"
   - Si usuario intenta ingresar fuera del rango, mostrar error

**Requerimientos Backend:**

1. **Modelo PlanV1.js**
   - Campo `numero_afiliado` ya existe como STRING(50)
   - Aplicar validación: longitud 5 después de padding
   - Aplicar validación: UNIQUE constraint

2. **Controller planesController.js (v1.0)**
   - En `crear()`: 
     * Aplicar padding: `numero_afiliado.padStart(5, '0')`
     * Validar que sea numérico después del padding
     * Validar unicidad con find({ where: { numero_afiliado: padded } })
   - En `actualizar()`:
     * Aplicar padding si se modifica numero_afiliado
     * Validar unicidad (excluyendo el plan actual)
   - En `getMaxAfiliadoNumber()`:
     * Retornar MAX(numero_afiliado) padded a 5 dígitos
     * Retornar suggestedNumber como MAX + 1

3. **Validators**
   - Crear función `validateNumeroAfiliado(numero)`:
     * Verificar que sea numérico (después de trim)
     * Verificar que no sea 0
     * Retornar numero padded a 5 dígitos
     * Lanzar error si > 99999

**Requerimientos Frontend:**

1. **PlanV1Modal.jsx**
   - Campo "Número de Afiliado":
     * `inputMode="numeric"` para teclado numérico en móvil
     * `pattern="[0-9]*"` para restringir input
     * `maxLength="5"` para limitar a 5 caracteres
     * Helper text: "Mínimo 5 dígitos (se completan con ceros)"
   - Mostrar número sugerido cuando se abre el modal en modo crear
   - Pre-llenar el campo con el número sugerido

2. **usePlanV1Form.js**
   - Al cargar initialData, aplicar padding a numero_afiliado
   - En validate(): verificar que numero_afiliado tenga exactamente 5 dígitos (después de trim)

3. **planesV1Service.js**
   - En `getMaxAfiliadoNumber()`: ya implementado (retorna suggestedNumber)
   - Mantener la lógica actual que funciona correctamente

**Migración de Datos Existentes (CRÍTICO):**

1. **Migración 2.0.24 - Adaptar números de afiliado existentes**
   - upgrade.sql:
     ```sql
     -- Crear columna temporal para almacenar valores padded
     ALTER TABLE planes ADD COLUMN numero_afiliado_temp VARCHAR(5) NULL;
     
     -- Convertir todos los números existentes a formato 5 dígitos
     UPDATE planes
     SET numero_afiliado_temp = LPAD(TRIM(numero_afiliado), 5, '0')
     WHERE numero_afiliado IS NOT NULL;
     
     -- Verificar que no hay nulos ni valores inválidos
     SELECT COUNT(*) as problemas 
     FROM planes 
     WHERE numero_afiliado_temp IS NULL 
        OR numero_afiliado_temp = '00000'
        OR LENGTH(numero_afiliado_temp) != 5
        OR numero_afiliado_temp NOT REGEXP '^[0-9]{5}$';
     
     -- Si hay problemas, lanzar error antes de continuar
     
     -- Remover la constraint UNIQUE anterior (si existe)
     ALTER TABLE planes DROP INDEX IF EXISTS numero_afiliado_unique;
     
     -- Eliminar la columna antigua
     ALTER TABLE planes DROP COLUMN numero_afiliado;
     
     -- Renombrar la columna temporal a numero_afiliado
     ALTER TABLE planes CHANGE COLUMN numero_afiliado_temp numero_afiliado VARCHAR(5) NOT NULL;
     
     -- Agregar UNIQUE constraint nuevamente
     ALTER TABLE planes ADD CONSTRAINT numero_afiliado_unique UNIQUE (numero_afiliado);
     ```

   - downgrade.sql:
     ```sql
     -- Revertir a formato anterior (sin padding garantizado)
     ALTER TABLE planes ADD COLUMN numero_afiliado_temp VARCHAR(50) NULL;
     
     UPDATE planes
     SET numero_afiliado_temp = numero_afiliado;
     
     ALTER TABLE planes DROP CONSTRAINT IF EXISTS numero_afiliado_unique;
     ALTER TABLE planes DROP COLUMN numero_afiliado;
     ALTER TABLE planes CHANGE COLUMN numero_afiliado_temp numero_afiliado VARCHAR(50) NOT NULL;
     
     -- Recrear constraint UNIQUE si existía
     ALTER TABLE planes ADD CONSTRAINT numero_afiliado_unique UNIQUE (numero_afiliado);
     ```

2. **Auditoría Pre-Migración**
   - Ejecutar query de verificación ANTES de hacer cambios permanentes
   - Documentar:
     * Cuántos registros se van a modificar
     * Detectar valores problemáticos (NULL, "00000", formato inválido)
     * Detectar potenciales duplicados después del padding (ej: "1" y "00001")
   - Si hay duplicados: intervención manual requerida antes de aplicar migración

3. **Ejemplos de Conversión**
   - "1" → "00001"
   - "100" → "00100"
   - "1250" → "01250"
   - "99999" → "99999"
   - "  50  " (con espacios) → "00050" (TRIM + LPAD)
   - NULL → ERROR (debe manejarse)
   - "00000" → ERROR (fuera de rango válido)

4. **Manejo de Errores y Rollback**
   - Si hay valores NULL en numero_afiliado: FAIL migración (investigar qué planes sin número)
   - Si hay duplicados después del padding: FAIL migración (requerir decisión manual)
   - Si hay valores fuera de rango: FAIL migración (valores > 5 dígitos?)
   - Implementar transacción: si falla cualquier paso, hacer rollback completo

5. **Validación Post-Migración**
   - Ejecutar post-upgrade:
     ```sql
     -- Verificar que todos los valores tienen exactamente 5 dígitos
     SELECT COUNT(*) as registros_invalidos
     FROM planes
     WHERE LENGTH(numero_afiliado) != 5
        OR numero_afiliado NOT REGEXP '^[0-9]{5}$'
        OR numero_afiliado = '00000';
     
     -- Debe retornar 0
     
     -- Verificar que no hay duplicados
     SELECT numero_afiliado, COUNT(*) as cantidad
     FROM planes
     GROUP BY numero_afiliado
     HAVING cantidad > 1;
     
     -- Debe retornar 0 filas
     ```

6. **Cambio de Tipo de Dato (Opcional Futuro)**
   - Actualmente: `numero_afiliado VARCHAR(50)`
   - Consideración: cambiar a `VARCHAR(5)` para forzar constraint a nivel BD
   - Decisión: aplazar para migración futura (2.0.25) después de validar estabilidad

**Testing (Incluida Migración):**

Fase 1: Migración de Datos
- ✅ Ejecutar upgrade.sql en BD con datos existentes
- ✅ Verificar que todos los registros se convirtieron correctamente
- ✅ Verificar que no hay duplicados post-migración
- ✅ Verificar que no hay valores fuera de rango
- ✅ Ejecutar queries de validación post-migración (deben retornar 0)
- ✅ Downgrade: revertir migración sin perder datos
- ✅ Upgrade nuevamente: verificar idempotencia

Fase 2: Funcionalidad Nueva
- ✅ Crear plan con numero_afiliado "1" → se guarda como "00001"
- ✅ Crear plan con numero_afiliado "123" → se guarda como "00123"
- ✅ Crear plan con numero_afiliado "00100" → se guarda como "00100"
- ✅ Crear plan con numero_afiliado "  50  " (con espacios) → se guarda como "00050"
- ✅ Intentar crear con numero_afiliado "0" o "00000" → error (fuera de rango)
- ✅ Intentar crear con numero_afiliado "100000" → error (más de 5 dígitos)
- ✅ Intentar crear duplicado → error 409 con mensaje de uniqueness
- ✅ Editar plan: cambiar numero_afiliado "00001" → "00002" → se guarda y valida unicidad
- ✅ Abrir modal crear → número sugerido es MAX + 1
- ✅ Si MAX es "99999" → error al intentar sugerir "100000" (fuera de rango)
- ✅ BD vacía → sugerir "00001"

**Impacto:**

- Archivos modificados: 5 (controller, model, modal, hook, service)
- BD: **Requiere migración 2.0.24** para adaptar datos existentes
  * ALTER TABLE con columna temporal
  * UPDATE con LPAD para padding
  * Validaciones pre y post migración
  * Rollback disponible en downgrade.sql
- Breaking change: No (padding es automático y transparente)
- Backward compatibility: ✅ Números existentes se convierten automáticamente en migración
- Tiempo de ejecución: Bajo (LPAD + UPDATE simple, sin JOINs complejos)

**Notas:**

- Ya existe endpoint `getMaxAfiliadoNumber()` que funciona correctamente
- El padding debe ser transparente para el usuario
- Considerar casos edge: "00000" debe rechazarse (mínimo "00001")
- Documentar que numero_afiliado está formateado siempre a 5 dígitos en respuestas API

**Status de Implementación (2026-05-07):**

✅ **Completado** — 5 commits ejecutados y pusheados a rama V_1.0.7:

1. `feat(migrations): migración 2.0.23 - normalizar numero_afiliado a 5 dígitos` (commit 7559bf5)
   - Crear: upgrade.sql con LPAD + MODIFY VARCHAR(5)
   - Crear: downgrade.sql con revert a VARCHAR(50)

2. `refactor(models): reducir numero_afiliado a STRING(5) en PlanV1` (commit 187e0be)
   - Cambiar DataTypes.STRING(50) → STRING(5)

3. `refactor(controller): aplicar padding de 5 dígitos en crear, actualizar y getMax` (commit 12094a5)
   - Padding en crear() antes de validar y guardar
   - Padding en actualizar() con validación de unicidad
   - Cambiar padStart(3) → padStart(5) en getMaxAfiliadoNumber()

4. `refactor(form): padding y validación de rango en numero_afiliado` (commit d4d45a2)
   - Padding en initialData load
   - Validación de rango (rechaza 0 y > 99999)

5. `feat(frontend): maxLength y padding en numero_afiliado al crear/editar plan` (commit eed876b)
   - maxLength={5} en input
   - placeholder="00001" en input
   - Padding en loadMaxAfiliadoNumber()

---

### BACKLOG-046: Eliminar Tablas Legacy

**Descripción:**
Limpieza de esquema: eliminación de 4 tablas legacy no utilizadas que generan ruido y complejidad innecesaria en la BD. Auditoría completada confirma que NO hay referencias activas en el código.

**Tablas a Eliminar:**

1. **afiliados**
   - Estado: Sin modelo Sequelize, sin endpoints, sin referencias en código
   - Datos: Unknown (auditoría previa indica que es legacy de v1.0)
   - Acción: DROP TABLE

2. **grupos_familiares**
   - Estado: Sin modelo Sequelize, sin endpoints, sin referencias en código
   - Datos: Unknown (auditoría previa indica que es legacy)
   - Acción: DROP TABLE

3. **historial_grupo_familiar**
   - Estado: Sin modelo Sequelize, sin endpoints, sin referencias en código
   - Datos: Unknown (auditoría previa indica que es legacy)
   - Acción: DROP TABLE

4. **planes_v2_backup**
   - Estado: Tiene modelo `Plan.js` pero sin endpoints activos, sin rutas
   - Propósito: Tabla de respaldo/migración legacy (v2.0)
   - Acción: DROP TABLE + Eliminar modelo `Plan.js`

**Requerimientos:**

1. **Migración 2.0.23 - Eliminación de tablas**
   - Crear upgrade.sql: DROP TABLE IF EXISTS afiliados, grupos_familiares, historial_grupo_familiar, planes_v2_backup
   - Crear downgrade.sql: Crear tablas vacías (estructura básica) para rollback de emergencia

2. **Auditoría de Código Previo**
   - ✅ Verificar que NO hay referencias en controllers/
   - ✅ Verificar que NO hay referencias en routes/
   - ✅ Verificar que NO hay referencias en services/
   - ✅ Verificar que NO hay queries SQL directo que usen estas tablas

3. **Eliminación de Modelos**
   - Eliminar `backend/src/models/Plan.js` (modelo de planes_v2_backup)
   - Actualizar `backend/src/models/index.js` para remover importación de Plan

4. **Testing**
   - Backend debe iniciarse sin errores post-migración
   - Todos los endpoints deben funcionar normalmente
   - No debe haber referencias rotas a modelos eliminados

**Impacto:**
- Limpieza del schema: BD más clara y menos confusa
- Reducción de ruido: menos modelos innecesarios en el código
- Sin impacto en funcionalidad: estas tablas NO se usan en el flujo actual

**Riesgo:**
- Bajo: Auditoría confirma que no hay dependencias
- Reversible: Migration downgrade disponible si es necesario

**Implementación Completada:**

**Auditoría Final:**
- ✅ Verificación completa: historialController.js era el único archivo referenciando tablas legacy
- ✅ historialController.js no tenía rutas asociadas (orphaned)
- ✅ Plan.js no estaba importado en models/index.js (orphaned)
- ✅ 0 referencias activas en código funcional

**Cambios Realizados:**
1. Migración 2.0.23 creada:
   - upgrade.sql: DROP TABLE IF EXISTS con order dependencias (historial_grupo_familiar → grupos_familiares → afiliados → planes_v2_backup)
   - downgrade.sql: Recreación de tablas básicas para rollback de emergencia
2. Plan.js (modelo para planes_v2_backup) eliminado
3. historialController.js (orfandado, requería Afiliado/GrupoFamiliar/HistorialGrupoFamiliar inexistentes) eliminado

**Commits:**
- `e69c0cf` — feat(migrations): migración 2.0.23 - eliminar tablas legacy no utilizadas
- `0f6cd44` — refactor: eliminar modelo Plan.js y controlador historialController orphaned

**Estado:** ✅ Solucionado (2026-05-08)

**Notas:**
- Migración es reversible mediante downgrade.sql
- No hay impacto en funcionalidad: tables legacy no se usaban
- Schema BD ahora más limpio sin artefactos de versiones anteriores

---

### BACKLOG-045: Agregar Zona y Localidad a Planes con Dropdowns en UI

**Descripción:**
Cada plan debe tener asociado una zona y una localidad, permitiendo mejor geolocalización y gestión territorial. Los usuarios deben poder seleccionar zona y localidad mediante dropdowns en el formulario de creación/edición de planes.

**Requerimientos Backend:**

1. **✅ Migración 2.0.22 - Agregar campos a tabla planes**
   - ✅ Agregar columna `zona_id` (INT, FK a zonas.id, allowNull: true por backward compatibility)
   - ✅ Agregar columna `localidad_id` (INT, FK a localidades.id, allowNull: true)
   - ✅ Índices para búsquedas rápidas
   - ✅ Validación: ON DELETE RESTRICT (no permitir eliminar zona/localidad si hay planes)
   - ✅ Downgrade: eliminar columnas con IF EXISTS (idempotente)

2. **✅ Modelo PlanV1.js**
   - ✅ Agregar propiedades `zona_id` y `localidad_id` (DataTypes.INTEGER)
   - ✅ allowNull: true para mantener backward compatibility con planes existentes

3. **✅ Asociaciones (models/index.js)**
   - ✅ `PlanV1.belongsTo(Zona, { foreignKey: 'zona_id' })`
   - ✅ `PlanV1.belongsTo(Localidad, { foreignKey: 'localidad_id' })`
   - ℹ️ Nota: sin alias `as:` para mantener consistencia con otras asociaciones

4. **✅ Controller planesController.js**
   - ✅ En `list()`: incluir zonas y localidades asociadas
   - ✅ En `obtener()`: incluir zonas y localidades
   - ✅ En `getByPersona()`: incluir zonas y localidades
   - ✅ En `crear()`: aceptar zona_id y localidad_id opcionales en payload
   - ✅ En `actualizar()`: permitir actualizar zona_id y localidad_id

**Requerimientos Frontend:**

1. **✅ PlanV1Modal.jsx**
   - ✅ Dropdown para seleccionar zona (carga desde lookupService con endpoint /api/lookup/zonas)
   - ✅ Dropdown para seleccionar localidad (carga desde localidadService.getAll())
   - ✅ Campos opcionales (no requeridos, pero presentes)
   - ℹ️ Nota: Localidades no filtradas por zona (cargas independientes, simplifica UX)
   - ✅ Ubicados en tab "Datos Generales"

2. **✅ usePlanV1Form.js**
   - ✅ Agregar `zona_id: ''` y `localidad_id: ''` al estado inicial
   - ✅ Cargar correctamente desde initialData al editar
   - ✅ Incluir en payload de create/update

3. **ℹ️ GestionPlanesV1.jsx** (No implementado)
   - Mostrar zona y localidad en tabla de planes: No crítico, usuario puede editar plan para ver valores

**Implementación Completada:**

**Commits:**
- `0b4f430` - feat(migrations): migración 2.0.22 - agregar zona_id y localidad_id a planes
- `df1853a` - refactor(controller): incluir zona y localidad en respuestas y operaciones de planes
- `23098ee` - feat(frontend): agregar getZonas() a lookupService y extender loadAllLookupsForPlans()
- `730ca16` - feat(frontend): dropdowns de zona y localidad en formulario de planes
- `fb8c567` - fix(models): remover aliases innecesarios en asociaciones de zona y localidad
- `be12398` - fix(migrations): hacer upgrade/downgrade idempotentes con IF NOT EXISTS/IF EXISTS
- `7fc609d` - fix(migrations): simplificar upgrade para compatibilidad con MariaDB
- `679a888` - fix(frontend): cargar zona_id y localidad_id al editar plan

**Archivos Modificados:**
- ✅ backend/src/migrations/versions/2.0.22_planes_zona_localidad/upgrade.sql
- ✅ backend/src/migrations/versions/2.0.22_planes_zona_localidad/downgrade.sql
- ✅ backend/src/models/PlanV1.js
- ✅ backend/src/models/index.js
- ✅ backend/src/controllers/v1.0/planesController.js
- ✅ frontend/src/services/lookupService.js
- ✅ frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js
- ✅ frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx

**Características Implementadas:**
- ✅ Zona y Localidad como campos opcionales con FK a sus respectivas tablas
- ✅ Dropdowns en formulario de creación/edición de planes
- ✅ Persistencia en BD con verificación en ediciones posteriores
- ✅ Migración idempotente compatible con MariaDB
- ✅ Backward compatibility: planes existentes no requieren zona/localidad

**Decisiones de Diseño:**
- Campos `allowNull: true` para backward compatibility (planes existentes sin zona/localidad)
- Zona y Localidad cargan independientemente (sin filtrado reactivo) → UX más simple
- Asociaciones sin alias para mantener consistencia con otras FKs en el modelo
- Validación opcional en frontend (campos no requeridos)

---

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

### BACKLOG-021: Navegación Automática a Campo con Error en PlanV1Modal

**Descripción:**
Mejora en la experiencia de usuario al crear o editar un plan. Cuando la interfaz identifica que:
1. **Falta algún dato**: navegar automáticamente al tab y campo que falta validación
2. **Hay error del backend**: navegar al tab y campo que genera el error

Actualmente, si hay un error de validación o respuesta del backend, se muestra un mensaje de error genérico pero el usuario debe buscar manualmente dónde está el problema. Esta mejora automátiza esa navegación.

**Requerimientos:**

a. **Validación Local (Datos Faltantes)**
   - Si usuario intenta guardar sin llenar campo requerido:
     * Identificar cuál campo falta
     * Obtener tab asociado a ese campo
     * Navegar automáticamente a ese tab
     * Hacer scroll hasta el campo
     * Mostrar error visual en el campo (rojo, highlight)
   - Campos por tab (ejemplos):
     * Tab "General": numero_afiliado, tipo_plan, cobrador, os, tipo_grupo
     * Tab "Datos": telefono_1, domicilio, localidad
     * Tab "Integrantes": tabla de integrantes (requiere al menos titular)
     * Tab "Servicios": (opcional, pero si se agrega, servicio es obligatorio)

b. **Errores del Backend**
   - Al recibir respuesta 422 o 409 con detalles de error:
     * Parsear el error para identificar campo afectado
     * Si error es de campo específico: navegar a ese tab/campo
     * Si error es genérico: navegar a tab "General"
     * Mostrar mensaje de error en el campo o en el tab
   - Ejemplos de errores:
     ```json
     {
       "error": "Validación fallida",
       "details": { "numero_afiliado": "Ya existe este número" }
     }
     // → Navegar a tab General, campo numero_afiliado, mostrar error
     ```

c. **Estructura de Mapeo Tab/Campo**
   - Crear mapeo explícito en PlanV1Modal:
     ```javascript
     const FIELD_TO_TAB = {
       numero_afiliado: 'general',
       tipo_plan_numero: 'general',
       cobrador_numero: 'general',
       os_numero: 'general',
       tipo_de_grupo_numero: 'general',
       valor_cuota: 'general',
       telefono_1: 'datos',
       telefono_2: 'datos',
       domicilio: 'datos',
       localidad: 'datos',
       integrantes: 'integrantes',
       servicios: 'servicios',
     }
     ```

d. **Flujo de Usuario Mejorado**

   **Escenario 1: Datos Faltantes (validación local)**
   ```
   Usuario: Click "Guardar"
   ↓
   Validación frontend detecta: campo "domicilio" vacío
   ↓
   Sistema: automáticamente
     - Navega al tab "Datos"
     - Scroll hasta campo "Domicilio"
     - Resalta campo en rojo
     - Muestra: "Este campo es requerido"
   ↓
   Usuario ve exactamente dónde llenar
   ```

   **Escenario 2: Error del Backend**
   ```
   Usuario: Click "Guardar" (todos campos llenos)
   ↓
   POST /api/planes/1
   ↓
   Backend: respuesta 409
     {
       "error": "Número de afiliado ya existe",
       "field": "numero_afiliado"
     }
   ↓
   Sistema: automáticamente
     - Navega al tab "General"
     - Scroll hasta campo "Número de Afiliado"
     - Resalta campo en rojo
     - Muestra: "Número de afiliado ya existe"
   ↓
   Usuario ve exactamente dónde está el problema
   ```

e. **Cambios Técnicos en Backend**
   - Mejorar respuestas de error para incluir campo afectado:
     ```javascript
     // Respuesta mejorada (en lugar de solo "error")
     res.status(422).json({
       success: false,
       error: "Validación fallida",
       field: "numero_afiliado", // ← Campo que causó error
       message: "Número de afiliado ya existe",
       details: { numero_afiliado: "Duplicado" }
     });
     ```

f. **Cambios Técnicos en Frontend (PlanV1Modal.jsx)**
   - Función auxiliar para obtener tab de un campo:
     ```javascript
     function getTabForField(fieldName) {
       return FIELD_TO_TAB[fieldName] || 'general';
     }
     ```
   - Función para navegar y destacar:
     ```javascript
     function navigateToFieldError(fieldName, errorMessage) {
       const tab = getTabForField(fieldName);
       setActiveTab(tab);
       setFieldErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
       // Scroll al campo (usar ref o querySelector)
       setTimeout(() => {
         const element = document.querySelector(`[name="${fieldName}"]`);
         element?.scrollIntoView({ behavior: 'smooth' });
         element?.focus();
       }, 100);
     }
     ```
   - En manejador de errores:
     ```javascript
     catch (err) {
       if (err.response?.status === 422) {
         const field = err.response.data.field;
         const message = err.response.data.message;
         if (field) {
           navigateToFieldError(field, message);
         } else {
           setError(message);
         }
       }
     }
     ```

**Contexto:**
- Mejora significativa en UX para formularios complejos
- PlanV1Modal tiene múltiples tabs, usuario puede perder contexto si hay error
- Navegación automática elimina frustración de "dónde está el error"
- Patrón común en aplicaciones modernas: Google Forms, Jotform, etc.
- Reducción de soporte: usuario ve inmediatamente dónde está el problema

**Archivos a Modificar:**

Backend:
- `backend/src/controllers/planesController.js` (mejorar respuestas de error)
- `backend/src/controllers/v1.0/planesController.js` (idem si existe)
- `backend/src/routes/planes.js` (si es necesario ajustar respuestas)

Frontend:
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (lógica de navegación)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss` (estilos para highlight/error)

**Estimación:**

Backend:
- Mejora de respuestas de error: 1h
- Testing: 0.5h

Frontend:
- Mapa de campos/tabs: 0.5h
- Funciones de navegación y scroll: 1h
- Integración en validación local: 1h
- Integración en manejo de errores: 1h
- Testing e iteración: 1h

**Total: 5-6 horas**

**Prioridad:** 🔴 Alta — Mejora significativa en UX para el flujo principal (creación/edición de planes)

**Estado:** 📋 Registrado (2026-04-17)

**Notas:**
- Requiere coordinación entre backend y frontend para estructura de errores
- Validación local puede ejecutarse antes de enviar al backend (mejora UX)
- Considerar agregar indicador visual (ej: punto rojo) en tabs con errores
- Compatible con BACKLOG-020 (auto-generación de número de afiliado)
- Mejora complementaria a BACKLOG-018 (si se implementa manejo centralizado de errores)

---

### BACKLOG-020: Auto-generación y Validación de Número de Afiliado Numérico

**Descripción:**
Cambio en el flujo de creación de planes: el campo `numero_afiliado` es almacenado como STRING en la BD, pero tiene representación numérica (puede hacer CAST a INT sin problemas). En la interfaz de usuario se debe:
1. Solo permitir entrada de valores numéricos (validación en input)
2. Al crear un plan nuevo, proponer automáticamente un número: `MAX(número_afiliado) + 1`
3. Usuario puede cambiar el número propuesto
4. Sistema debe validar que el número no esté en uso (verificar unicidad)

**Requerimientos:**

a. **Campo de Entrada - Validaciones en UI**
   - Input type="number" o text con validación regex
   - Solo acepta dígitos (0-9)
   - Rechaza caracteres especiales, espacios, letras
   - Mensaje de error si contiene caracteres no-numéricos: "Solo se permiten números"

b. **Auto-generación en Crear Plan**
   - Al abrir PlanV1Modal para crear (modo = "crear"):
     * Llamar a backend: GET /api/planes/next-numero-afiliado
     * Backend retorna: { proximoNumero: MAX(numero_afiliado) + 1 }
     * Frontend pre-llena el campo con este número
     * Usuario ve: "1234" (por ejemplo) como sugerencia
   - Campo es editable: usuario puede borrarlo y escribir otro número

c. **Validación de Unicidad en Tiempo Real (Opcional)**
   - A medida que usuario escribe, validar contra BD
   - Debounce de 500ms para no saturar servidor
   - Si número existe: mostrar error rojo "Este número ya está en uso"
   - Botón de guardar se deshabilita si hay error de unicidad

d. **Validación en Guardar (Obligatorio)**
   - Backend: POST /api/planes valida numero_afiliado
   - Si número no es numérico: retorna 422 "El número debe ser numérico"
   - Si número ya existe: retorna 409 "Número de afiliado ya en uso"
   - Validación con CAST a INT para verificar representación

e. **Flujo en PlanV1Modal**
   ```
   Usuario: Click "Nuevo Plan"
   ↓
   Modal se abre (modo = "crear")
   ↓
   Frontend llama: GET /api/planes/next-numero-afiliado
   ↓
   Backend calcula: SELECT MAX(CAST(numero_afiliado AS INT)) + 1
   ↓
   Frontend: Input numero_afiliado pre-llena con "1234"
   ↓
   Usuario: Puede dejar 1234 o cambiar a otro número
   ↓
   Usuario: Click Guardar
   ↓
   Validación en tiempo real (si está implementada):
     - Si error: muestra "Este número ya está en uso"
     - Si válido: permite guardar
   ↓
   Frontend: POST /api/planes { numero_afiliado: "1234", ... }
   ↓
   Backend valida:
     - CAST(numero_afiliado AS INT) → si falla, 422
     - Verifica unicidad UNIQUE → si existe, 409
   ↓
   Si éxito: Plan creado con numero_afiliado
   Si error: Muestra mensaje al usuario (números duplicados, inválidos)
   ```

**Contexto:**
- Campo `numero_afiliado` actualmente tiene UNIQUE constraint en BD
- Es VARCHAR(50) pero almacena valores numéricos
- Mejora UX: usuario no tiene que pensar qué número asignar
- Propuesta automática sigue el patrón common: auto-increment lógico
- Validación numérica previene errores de entrada (letras, símbolos)
- Validación de unicidad previene duplicados accidentales

**Análisis Técnico:**

1. **Estado Actual del Código:**
   - Campo `numero_afiliado` en tabla planes: VARCHAR(50), UNIQUE
   - PlanV1Modal.jsx: acepta cualquier string en numero_afiliado
   - planesV1Service.js: POST /api/planes sin pre-validación numérica
   - Backend: no hay lógica de auto-generación

2. **Cambios Necesarios en Backend:**
   - Nuevo endpoint: GET /api/planes/next-numero-afiliado
     ```javascript
     exports.getNextNumeroAfiliado = async (req, res, next) => {
       const maxRecord = await db.PlanV1.findOne({
         attributes: [
           [db.sequelize.fn('MAX', db.sequelize.cast(
             db.sequelize.col('numero_afiliado'), 'UNSIGNED'
           )), 'maxValue']
         ],
         raw: true,
       });
       const proximoNumero = (maxRecord?.maxValue || 0) + 1;
       res.json({ proximoNumero });
     }
     ```
   - Mejorar validación en POST /api/planes:
     ```javascript
     // Validar que numero_afiliado es numérico
     if (!/^\d+$/.test(datos.numero_afiliado)) {
       return res.status(422).json({ error: 'número_afiliado debe ser numérico' });
     }
     // La UNIQUE constraint en BD se encarga del duplicado
     ```

3. **Cambios Necesarios en Frontend:**
   - PlanV1Modal.jsx (función inicializar/crear):
     * Si modo = "crear": llamar getNextNumeroAfiliado()
     * Pre-llenar formData.numero_afiliado con el valor retornado
     * Input: type="number" o text con pattern="[0-9]*"
     * Validación: /^\d+$/ al escribir
   - Validación en tiempo real (opcional):
     * Hook useEffect que debounce cambios
     * Llamar a planesV1Service.checkNumeroAfiliado(numero)
     * Mostrar error si número existe
     * Deshabilitar botón si hay error
   - Manejo de errores mejorado:
     * 409 (número duplicado): "Este número ya está en uso"
     * 422 (número inválido): "El número debe contener solo dígitos"

4. **Cambios en planesV1Service.js:**
   - Nuevo método:
     ```javascript
     getNextNumeroAfiliado: async () => {
       const response = await api.get('/planes/next-numero-afiliado');
       return response.data.proximoNumero;
     }
     ```
   - Opcional - validación en tiempo real:
     ```javascript
     checkNumeroAfiliado: async (numero) => {
       const response = await api.post('/planes/check-numero-afiliado', { numero });
       return response.data; // { existe: false } o { existe: true }
     }
     ```

5. **Cambios en Rutas Backend:**
   - GET /api/planes/next-numero-afiliado → controller.getNextNumeroAfiliado
   - POST /api/planes/check-numero-afiliado (opcional) → controller.checkNumeroAfiliado

6. **Complejidad Estimada:**
   - Backend GET endpoint: 1h
   - Backend POST validación: 0.5h
   - Frontend modal mejorado: 1.5h
   - Validación tiempo real (opcional): 1h
   - Testing: 1h
   - **Total: 4-5 horas** (sin validación tiempo real) o **5-6 horas** (con validación)

**Notas de Implementación:**
- Usar CAST en SQL para calcular máximo numérico: `CAST(numero_afiliado AS UNSIGNED)`
- Regex validación: `/^\d+$/` (solo dígitos, sin espacios ni caracteres especiales)
- Input HTML5: `<input type="number" />` es más restrictivo (por defecto solo números)
- O usar `<input type="text" pattern="[0-9]*" inputMode="numeric" />`
- Validación en tiempo real: debounce de 500ms para no saturar servidor
- BD: UNIQUE constraint en numero_afiliado garantiza que si 2 usuarios intentan crear con mismo número simultáneamente, solo uno triunfa

**Prioridad:** 🔴 Alta — Mejora UX significativa en creación de planes

**Estado:** 📋 Registrado (2026-04-17)

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

**Estado:** 🚀 Desarrollado (2026-04-17)

**Implementación Completada (2026-04-17):**

**Fase 1: Migración de Base de Datos (2.0.5)** ✅
- Creado: `backend/src/migrations/versions/2.0.5_nullable_foreign_keys/`
- upgrade.sql: ALTER TABLE planes MODIFY 4 columnas a NULL
  * cobrador_numero: INT NOT NULL → INT NULL
  * tipo_plan_numero: INT NOT NULL → INT NULL
  * tipo_de_grupo_numero: INT NOT NULL → INT NULL
  * os_numero: INT NOT NULL → INT NULL
- downgrade.sql: Revertir cambios (modificar de vuelta a NOT NULL)
- Commit: migration(2.0.5)...

**Fase 2: Backend - Eliminación en Cascada** ✅
- Modificado: `backend/src/controllers/lookupController.js`
- Cambios en exports.delete():
  * Agregado parámetro query `force` (true/false)
  * Si force=false: verifica referencias, retorna 409 si existen
  * Si force=true: ejecuta función deleteCascade() con transacción
  * Respuesta 409 ahora incluye: message, referencias, referenciaEn, entidad
- Función auxiliar deleteCascade(entidad, id, ref, transaction):
  * cobradores → SET cobrador_numero = NULL en planes
  * obras-sociales → SET os_numero = NULL en planes
  * tipos-de-plan → SET tipo_plan_numero = NULL en planes
  * tipos-de-grupo → SET tipo_de_grupo_numero = NULL en planes
  * servicios-adicionales → DELETE IntegranteServicio
  * Usa transacción para atomicidad (todo o nada)
  * Rollback automático si cualquier paso falla
- Commit: feat(BACKLOG-019): backend...

**Fase 3: Frontend - Componentes** ✅
- Creado: `frontend/src/components/ConfirmDeleteWithRefsModal/`
  * ConfirmDeleteWithRefsModal.jsx: componente React
    - Props: isOpen, entidad, registroNombre, referencias, referenciaEn, onConfirm, onCancel, isLoading, error
    - Estados: normal (ver detalles), cargando (durante DELETE con force=true), error (si falla)
    - Botones: Cancelar, Sí Eliminar
    - Avisos: cantidad de referencias, qué tabla tiene referencias, acción no reversible
  * ConfirmDeleteWithRefsModal.scss: estilos completos
    - Modal centrado con overlay semi-transparente
    - Animaciones de entrada/salida
    - Colores: warning (#ffc107) para alert, danger (#dc2626) para confirmar
    - Responsive: 90% width, max 500px
    - Estados: normal, hover, disabled, loading
- Commit: feat(BACKLOG-019): frontend - componente...

**Fase 4: Frontend - Integración en LookupCRUD** ✅
- Modificado: `frontend/src/components/LookupCRUD/LookupCRUD.jsx`
  * Importado ConfirmDeleteWithRefsModal
  * Agregados estados para gestionar modal de confirmación:
    - deleteModal: { isOpen, registroId, registroNombre, referencias, referenciaEn, isLoading, error }
  * Nueva lógica en handleDelete():
    - Paso 1: Intenta DELETE sin force
    - Si éxito: recarga lista y cierra (sin referencias)
    - Si 409: abre modal con detalles de referencias (paso 2)
    - Si otro error: muestra mensaje en ErrorDisplay
  * Nueva función handleConfirmDeleteWithRefs():
    - Paso 3: Usuario confirma en modal
    - Envía DELETE con ?force=true (força cascada)
    - Estado isLoading durante operación
    - Si éxito: recarga lista y cierra modal
    - Si error: muestra error en modal
  * Nueva función handleCancelDeleteWithRefs():
    - Usuario cancela: cierra modal sin hacer nada
  * Modal renderizado con props del estado deleteModal
- Commit: feat(BACKLOG-019): frontend - integración...

**Fase 5: Servicio Frontend** ✅
- Modificado: `frontend/src/services/lookupService.js`
  * Método delete() ahora acepta segundo parámetro options = { force: false }
  * Si options.force = true: añade ?force=true a URL
  * Permite llamadas: lookupService.delete(entidad, id) o lookupService.delete(entidad, id, { force: true })
- Commit: incluido en feat(BACKLOG-019): frontend - integración...

**Flujo Completo Implementado:**

```
Usuario click en botón eliminar registro
↓
handleDelete(id) intenta DELETE /api/lookup/:entidad/:id (sin force)
↓
Si respuesta 200 (éxito):
  → Recarga lista, cierra sin mostrar modal
  
Si respuesta 409 (referencias encontradas):
  → Abre ConfirmDeleteWithRefsModal con detalles:
    * Nombre del registro
    * Cantidad de referencias (ej: 5)
    * Tabla/entidad que tiene referencias (ej: "planes")
    * Advirtencia clara
  
Si usuario click "Cancelar":
  → Cierra modal sin hacer nada
  → Lista permanece sin cambios
  
Si usuario click "Sí, Eliminar":
  → Estado isLoading = true en modal
  → handleConfirmDeleteWithRefs() envía DELETE ?force=true
  → Backend ejecuta cascada en transacción:
    * Actualiza FK a NULL en registros dependientes
    * Elimina la entidad
  → Respuesta 200 con cantidad de referencias afectadas
  → Cierra modal y recarga lista
  
Si error en cascada:
  → Muestra error en modal (rollback automático)
  → Usuario puede reintentar o cancelar
```

**Commits Realizados:**
- 134d4b3 - migration(2.0.5): hacer columnas FK en planes nullable...
- 91d3e6d - feat(BACKLOG-019): backend - eliminación en cascada...
- 8f783da - feat(BACKLOG-019): frontend - componente ConfirmDeleteWithRefsModal
- af12670 - feat(BACKLOG-019): frontend - integración flujo dos pasos...

**Testing Manual Recomendado:**
1. Abrir página de Cobradores (u otro lookup)
2. Crear un cobrador nuevo
3. Crear un plan que use ese cobrador
4. Intentar eliminar el cobrador
   - Debe mostrar modal: "Hay 1 referencia en planes"
5. Click "Cancelar" → modal cierra, cobrador no se elimina
6. Intentar eliminar de nuevo
7. Click "Sí, Eliminar" → cargando... → éxito
8. Verificar: cobrador eliminado, plan sigue existiendo pero cobrador_numero = NULL
9. Repetir con otros lookups (OS, tipos, servicios)

**Notas:**
- Migración 2.0.5 debe ejecutarse antes de usar esta funcionalidad
- Integra bien con BACKLOG-018 (manejo centralizado de errores)
- Modal reutilizable: otros componentes pueden importarla si necesitan similar UX
- Transacciones garantizan consistencia: si cascada falla, nada se elimina
- Alternativa futura (BACKLOG-020): estado "inactivo" en lugar de NULL

---

### BACKLOG-018: Centralizar Manejo de Respuestas del Backend con Success: False

**Descripción:**
Sistema centralizado de notificaciones que detecta automáticamente respuestas del backend con `success: false` y muestra notificaciones al usuario. Las duraciones de notificaciones son configurables por administrador en BD.

**Implementación Completada (2026-04-17):**
- ✅ Frontend: NotificationContext + NotificationToast componente + estilos WCAG AA accesibles
- ✅ Frontend: Interceptor en api.js para detectar success: false automáticamente
- ✅ Frontend: configService para cargar/actualizar configuración desde BD
- ✅ Frontend: Integración en DashboardPage con NotificationProvider y loader
- ✅ Backend: Migración 2.0.6 con tabla configuracion_app
- ✅ Backend: Modelo ConfiguracionApp (Sequelize)
- ✅ Backend: Endpoints GET/PUT /api/admin/configuracion (con auth + whitelist validation)
- ✅ Testing: Spec compliance verificado para frontend y backend
- ✅ Code quality: Aprobado con mejoras en accesibilidad y seguridad

**Commits Asociados:**
- Frontend: 6 commits (context, toast, styles, api interceptor, config service, dashboard integration)
- Backend: 4 commits (migration, model, routes, validation fix)
- Docs: 2 commits (spec, plan)

**Archivos Modificados/Creados:**
- Frontend (6): NotificationContext.jsx, NotificationToast.jsx, NotificationToast.scss, configService.js, api.js, DashboardPage.jsx
- Backend (4): migración 2.0.6, ConfiguracionApp.js, admin.js routes, validación de whitelist
- Docs (2): spec BACKLOG-018, plan BACKLOG-018

**Estado:** 🚀 Desarrollado (implementación completada, testing spec compliant, code quality aprobado)

**Próximos Pasos:**
- Task 10: Ejecutar migración (requiere Node.js local)
- Task 11-13: Testing manual local (requiere Node.js + browsers)
- Consideraciones futuras:
  - Panel UI en Administración para gestionar duraciones de notificaciones
  - Considerar refactor de window.__notificationContext a Context singleton (vs anti-patrón actual)
  - Agregar telemetría/logs de notificaciones para debugging
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

### BACKLOG-022 y BACKLOG-023: Agregar Campo Abreviación a Tipos de Grupo y Plan

**Descripción:**
Agregar campo `abreviacion` (VARCHAR(10), NOT NULL) a las tablas `tipos_de_grupo` y `tipos_de_plan`. Campo disponible en UI para crear/editar registros. Facilita identificación rápida en listas y reportes mediante abreviaturas consistentes (ej: "FAM", "IND", "PP", "PB").

**Requerimientos:**
- Campo `abreviacion` en ambas tablas (tipos_de_grupo, tipos_de_plan)
- NOT NULL (campo requerido, sin restricción de unicidad)
- VARCHAR(10) máximo
- Validación en backend (trim, uppercase automático)
- UI permite entrada y edición de abreviación
- Validación en frontend (requerido, maxLength 10)

**Implementación Completada (2026-04-17):**

**Backend:**
- ✅ Migración 2.0.7: Crea columna abreviacion en tipos_de_grupo y tipos_de_plan
  - Columna VARCHAR(10) NOT NULL con DEFAULT ''
  - Sin constraints UNIQUE (permite valores duplicados entre registros)
- ✅ Modelos Sequelize (TipoDeGrupo.js, TipoDePlan.js)
  - Agregado campo abreviacion con validación notEmpty
  - Validación unique en nivel ORM
- ✅ Validación en lookupController.js
  - Campos ['tipo_de_grupo_nombre', 'abreviacion'] y ['tipo_plan_nombre', 'abreviacion']
  - Pre-procesamiento: trim() + toUpperCase() automático
  - Manejo de SequelizeUniqueConstraintError con HTTP 409 + mensaje legible
- ✅ Testing: Sistema genérico permite create/update/delete sin cambios adicionales

**Frontend:**
- ✅ UI en TiposDeGrupo.jsx: Agregado campo { name: 'abreviacion', label: 'Abreviación *', maxLength: 10 }
- ✅ UI en TiposDePlan.jsx: Mismo campo y configuración
- ✅ LookupCRUD.jsx: Soporte para propiedad maxLength en inputs
- ✅ LookupCRUD.jsx: Auto-uppercase para campo abreviacion (toUpperCase en handleInputChange)

**Commits Asociados:**
- aa76bee - fix(migrations): simplificar migración 2.0.7 eliminando MODIFY redundante
- 4110ecc - fix(migrations): corregir nombres de tablas (tipos_de_grupo y tipos_de_plan)
- 76a7489 - feat(models): agregar campo abreviacion a TipoDeGrupo
- d7d6f3b - feat(models): agregar campo abreviacion a TipoDePlan
- 784fa19 - feat(controllers): agregar validación de abreviacion para tipos
- fd1f8e1 - feat(ui): agregar campo abreviacion a formularios de Tipos de Grupo y Plan

**Testing Manual Recomendado:**
1. Ejecutar migración: `npm run db:migrate:up`
2. Verificar tablas: `DESCRIBE tipos_de_grupo;` y `DESCRIBE tipos_de_plan;`
3. Crear Tipo de Grupo: nombre "Familiar", abreviacion "FAM"
   - Validar: aparece en lista con abreviacion en mayúsculas
4. Crear Tipo de Plan: nombre "Plan Premium", abreviacion "pp"
   - Validar: se auto-convierte a "PP"
5. Crear otro Tipo de Grupo con misma abreviacion "FAM"
   - Validar: se permite la creación (sin restricción UNIQUE)
6. Editar un registro, cambiar abreviacion
   - Validar: se actualiza correctamente
7. Validar maxLength: intentar ingresar más de 10 caracteres
   - Validar: campo rechaza entrada

**Estado:** ✅ Solucionado (2026-04-17)

**Notas:**
- Campo sin restricción UNIQUE: permite abreviaturas iguales en diferentes registros
- Sistema de lookup genérico permitió agregar soporte sin hardcoding
- Auto-uppercase mejora UX: usuario no necesita pensar en mayúsculas
- Validación en frontend (maxLength 10) y backend (trim/uppercase)
- Abreviaturas facilitan reportes y identificación en formularios largos
- Reutilizable: mismo patrón puede aplicarse a otros tipos si es necesario

---

   Timer resetea (reinicia contador de 2000ms)
   Usuario continúa escribiendo: "juan perez"
   ↓
   onChange actualiza estado local (SIN API call)
   Timer resetea (reinicia contador de 2000ms)
   Usuario para de escribir por 2 segundos
   ↓
   Timer expira → se dispara búsqueda una sola vez (JUAN PEREZ) → 1 API call ✅ (eficiente)
   ```

f. **Cambios en Base de Datos (Migración 2.0.9)**
   - Tabla: `ConfiguracionApp` (agregar si no existe entrada de debounce)
   - Nuevo registro: `INSERT INTO ConfiguracionApp (tipo_notificacion, duracion_ms) VALUES ('debounce_delay_ms', 2000);`
   - O crear tabla separada: `ConfiguracionGlobal` con columna `debounce_delay_ms`
   - Nota: Si se usa `ConfiguracionApp` existente, se debe extender semanticamente para no confundir
   - Alternativa: Crear tabla `ConfiguracionSistema` más genérica

g. **Servicio Frontend - Actualizar configService**
   - Método existente: `getConfiguracion()` → ya trae todas las configs
   - Método existente: `actualizarConfiguracion(tipo, valor)` → ya actualiza
   - Solo necesita que backend devuelva la nueva entrada

h. **Implementación técnica en componentes**
   
   **BusquedaAfiliados.jsx (ejemplo):**
   ```javascript
   const [searchText, setSearchText] = useState('');
   const [debounceDelay, setDebounceDelay] = useState(2000); // cargar de config
   const debouncedSearchText = useDebounce(searchText, debounceDelay);
   
   // useEffect para buscar cuando debouncedSearchText cambia
   useEffect(() => {
     if (debouncedSearchText.trim()) {
       handleSearch(); // llamada a API
     }
   }, [debouncedSearchText]);
   ```

**Contexto:**
- Mejora rendimiento: reduce llamadas al servidor significativamente
- Mejora UX: búsquedas ocurren de forma más natural (sin lag de múltiples requests simultáneos)
- Configurable: admin puede ajustar según velocidad de red y preferencias de negocio
- Patrón común: Google Search, LinkedIn, Amazon usan debounce para búsquedas

**Análisis de Impacto:**

1. **Cambios Frontend:**
   - Crear hook useDebounce.js (50 líneas)
   - Actualizar 5-8 componentes con búsqueda (10-20 líneas cada uno)
   - Actualizar configService.js para manejar nueva config (5 líneas)
   - Actualizar ConfiguracionNotificaciones.jsx para mostrar/editar debounce delay (20-30 líneas)

2. **Cambios Backend:**
   - Si se agrega a ConfiguracionApp: necesita migración 2.0.9
   - Si se crea tabla nueva ConfiguracionSistema: necesita migración 2.0.9
   - Endpoint GET /api/admin/configuracion ya retorna todo (sin cambio)
   - Endpoint PUT /api/admin/configuracion/:tipo ya maneja updates (sin cambio)

3. **Cambios Base de Datos:**
   - Opción A (recomendada): Extender ConfiguracionApp con registro `debounce_delay_ms`
   - Opción B: Crear tabla genérica `ConfiguracionSistema` (más escalable para futuras configs)
   - Migración 2.0.9 si es necesario

**Archivos a modificar/crear:**

Frontend:
- `frontend/src/hooks/useDebounce.js` (NUEVO)
- `frontend/src/components/v1.0/BusquedaAfiliados.jsx` (modificar)
- `frontend/src/components/LookupCRUD/LookupCRUD.jsx` (modificar)
- `frontend/src/components/GestionPlanesV1/GestionPlanesV1.jsx` (modificar)
- `frontend/src/components/GestionAfiliados/GestionAfiliados.jsx` (modificar)
- `frontend/src/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx` (extender)
- `frontend/src/services/configService.js` (sin cambio, ya funciona)

Backend:
- `backend/src/migrations/versions/2.0.9_debounce_config/upgrade.sql` (NUEVO si es necesario)
- `backend/src/migrations/versions/2.0.9_debounce_config/downgrade.sql` (NUEVO si es necesario)
- Rutas/Controladores: sin cambio (GET/PUT ya existen)

**Estimación:** 6-8 horas
  - Hook useDebounce: 0.5h
  - Actualizar componentes (5-8): 2-3h
  - Panel de configuración (UI + validaciones): 1-1.5h
  - Migración BD 2.0.9 (si aplica): 0.5h
  - Testing: 1.5-2h

**Prioridad:** 🔴 Alta — Mejora rendimiento y UX en funcionalidad core

**Estado:** ✅ Solucionado (2026-04-21)

**Implementación Completada (2026-04-21):**
1. ✅ Hook useDebounce.js: custom hook con setTimeout y cleanup
2. ✅ ConfiguracionApp extendida: debounce_delay_ms con default 2000ms
3. ✅ Migración 2.0.9: inserta configuración en BD
4. ✅ Frontend (3 componentes): BusquedaAfiliados, LookupCRUD, GestionPlanesV1
5. ✅ Panel admin: ConfiguracionNotificaciones con sección de búsquedas configurable (100-10000ms)
6. ✅ Validación backend: VALID_TYPES en admin.js incluye debounce_delay_ms
7. ✅ Enter key enhancement: búsqueda inmediata sin esperar debounce en todos los componentes
8. ✅ Menú renombrado: "Configuración Notificaciones" → "Configuración UI"

**Commits relacionados:**
- f6217d8 - feat(configuracion): permitir debounce_delay_ms en endpoint
- 87cc5b1 - feat(BACKLOG-025): implementar debounce configurable
- (y commits anteriores del setup)

---

### BACKLOG-026: Formatear Número de Afiliado a 5 Dígitos

**Descripción:**
En todos los sitios donde se muestre o edite el número de afiliado, debe mostrarse con exactamente 5 dígitos. Si el número tiene menos de 5 dígitos, se debe completar con ceros a la izquierda (ej: 123 → 00123).

**Requerimientos:**

a. **Visualización (display)**
   - En tablas que muestren planes (GestionPlanesV1, BusquedaAfiliados, RecibosPage)
   - En modales de edición (PlanV1Modal)
   - En confirmaciones y mensajes de alerta
   - En detalles de recibos
   - En cualquier lista o vista que muestre número_afiliado

b. **Edición (input)**
   - Campo de input en PlanV1Modal debe aceptar números de 1-5 dígitos
   - Al guardar, validar y formatear a 5 dígitos antes de enviar a backend
   - Mostrar hint/placeholder indicando formato (ej: "Ej: 00123")

c. **Backend**
   - Al guardar en BD: convertir a 5 dígitos (INT → LPAD en SQL o validación en Node)
   - Al retornar en APIs: retornar siempre formateado a 5 dígitos
   - En consultas/filtros: permitir búsqueda sin ceros (ej: buscar "123" debe encontrar "00123")

**Impacto de Implementación:**

**Frontend (19 archivos afectados):**
1. **Componentes de visualización (6):**
   - `GestionPlanesV1.jsx` (línea 224: `<td>{plan.numero_afiliado}</td>`)
   - `BusquedaAfiliados.jsx` (línea 240: mostrar en tabla de planes)
   - `RecibosPage.jsx` (mostrar en lista de recibos)
   - `ReciboDetalleModal.jsx` (mostrar en detalle)
   - `ListadoPlanes.jsx` (mostrar en tabla)
   - `PlanesPorCobrador.jsx` (mostrar en tabla)

2. **Componentes de edición (2):**
   - `PlanV1Modal.jsx` (línea 397: input + validación al guardar)
   - `usePlanV1Form.js` (hook de validación)

3. **Mensajes y confirmaciones (2):**
   - `GestionPlanesV1.jsx` (línea 112: confirmación de suspensión)
   - `BusquedaAfiliados.jsx` (línea 124-125: confirmación de cambio de estado)

4. **Modal de generación de recibos (1):**
   - `GenerarRecibosModal.jsx`

5. **Tabla de actualización masiva (1):**
   - `BulkUpdateCuotaModal.jsx`

**Solución técnica (2 opciones):**

**Opción A: Formatter utility (RECOMENDADA)**
   - Crear función `formatAfiliado(numero)` en `frontend/src/utils/formatters.js`
   - Usar en todos los puntos de visualización: `{formatAfiliado(plan.numero_afiliado)}`
   - En edición: usar `formatAfiliado()` en onChange y onBlur
   - Centralizado, reutilizable, fácil de mantener

**Opción B: Computed property**
   - En cada componente, crear `const displayNumero = String(numero).padStart(5, '0')`
   - Repetir en cada lugar donde se use
   - Más disperso pero funcional

**Backend (3 archivos):**
1. **Modelo:**
   - `PlanV1.js`: agregar getter/setter o validación

2. **Controllers (v1.0):**
   - `planesController.js`: validación al crear/actualizar
   - `recibosController.js`: validación al generar recibos

3. **Migraciones/Seed:**
   - Evaluar si datos existentes necesitan formateo
   - Si hay datos sin formato, crear migración 2.0.10 para formatear

**Base de Datos:**
- Opción A: Cambiar tipo de dato `numero_afiliado` de INT a VARCHAR(5) con ZEROFILL
  * Requiere migración para conversión de tipo
  * Más robusto, datos siempre formateados
  
- Opción B: Mantener INT, formatear en application layer
  * Menos invasivo, no requiere migración
  * Riesgo: si se accede BD directamente, no está garantizado el formato

**Testing:**
- Crear planes con números 1-5 dígitos y verificar visualización
- Editar número de afiliado y confirmar formato guardado
- Búsqueda: buscar "123" debe encontrar plan "00123"
- Recibos: verificar formato en documentos generados
- APIs: verificar que todas las responses retornen formateado

**Estimación:** 4-6 horas
  - Crear formatter utility: 0.5h
  - Actualizar componentes frontend (12-15 puntos): 2-3h
  - Actualizar backend (validación): 0.5h
  - Decisión y migración BD (si aplica): 0.5h
  - Testing: 1-1.5h

**Prioridad:** 🟡 Media — Mejora consistencia visual y UX, pero no afecta funcionalidad core

**Estado:** ✅ Solucionado (2026-04-21)

**Implementación Completada (2026-04-21):**
1. ✅ Crear `frontend/src/utils/formatters.js` con función `formatNumeroAfiliado()`
2. ✅ Aplicar en 10 componentes: GestionPlanesV1, BusquedaAfiliados, PlanV1Modal (título), RecibosPage, PlanesPorCobrador, ListadoPlanes, GenerarRecibosModal, ReciboDetalleModal, BulkUpdateCuotaModal
3. ✅ Formato reutilizable con `padStart(5, '0')`
4. ✅ Los inputs de edición NO formateados (usuario ingresa sin ceros)
5. ✅ Búsqueda flexible mantiene compatibilidad (buscar números sin ceros)

**Commit:**
- 2056052 - feat(BACKLOG-026): formatear numero_afiliado a 5 dígitos

---

### BACKLOG-027: Página Principal - Listado de Planes al Login

**Descripción:**
Al ingresar al sitio y autenticarse (post-login), la página principal debe mostrar directamente el listado de todos los planes, sin necesidad de navegar por el menú. Este listado será el punto de entrada por defecto, mejorando la UX al dar acceso rápido a la funcionalidad más utilizada.

**Requerimientos:**

a. **Flujo de navegación:**
   - Usuario hace login exitoso
   - Redirect automático a página principal de planes (en lugar de página en blanco o panel neutro)
   - El menú lateral permanece disponible para navegar a otras secciones

b. **Contenido de la página:**
   - Listado tabular de todos los planes
   - Columnas: Número de Afiliado | Apellido | Nombre | Acciones
   - Mostrar formateado: numero_afiliado con 5 dígitos (relacionado a BACKLOG-026)
   - Nombre y apellido del titular (Persona asociada al plan)
   - Paginación o scroll infinito (máximo 20-50 planes por vista)

c. **Acciones (botones en tabla):**
   - Botón "Editar": abre PlanV1Modal en modo edición
   - Botón "Eliminar/Suspender": abre confirmación de eliminación (similar a GestionPlanesV1 actual)
   - Opcionales: ver detalles, generar recibos (desde panel de planes)

d. **Búsqueda y filtros:**
   - Barra de búsqueda para filtrar por numero_afiliado, nombre o apellido (BACKLOG-025: debounce aplicado)
   - Opcional: filtros por estado (Activo/Suspendido)

**Impacto Técnico:**

**Frontend (3 archivos, cambio mínimo):**

1. **App.jsx (ruta por defecto)**
   - Cambiar ruta raíz `/` para redirigir a `/dashboard` o `/planes`
   - O: mantener `/dashboard` como default, hacer `/` → `/dashboard`
   - Ubicación actual: `frontend/src/App.jsx` (rutas React Router)

2. **DashboardPage.jsx (estado inicial)**
   - Cambiar `useState(activeModule)` inicial de `null`/`undefined` a `'gestion-planes-v1'`
   - Lógica actual: lee props o parámetros URL para determinar módulo activo
   - Solución simple: agregar `const [activeModule, setActiveModule] = useState('gestion-planes-v1');`
   - Ubicación: `frontend/src/pages/DashboardPage/DashboardPage.jsx` (línea ~??)

3. **GestionPlanesV1.jsx (ya existe, sin cambios)**
   - Componente ya implementado y funcional
   - Ya carga datos, búsqueda, acciones (editar, suspender)
   - Solo necesita ser módulo inicial
   - Ubicación: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx`

**Backend (sin cambios):**
   - API GET `/api/planes-v1` ya retorna todos los planes con relaciones (Persona, TipoDePlan, etc)
   - No hay nuevos endpoints necesarios
   - Controllers/routes existentes suficientes

**Arquitectura - Decisión: ¿Cómo hacer el redirect?**

**Opción A: Redirect en Router (RECOMENDADA)**
   ```js
   // App.jsx
   <Routes>
     <Route path="/" element={<Navigate to="/dashboard" replace />} />
     <Route path="/dashboard" element={<DashboardPage defaultModule="gestion-planes-v1" />} />
   </Routes>
   ```
   - ✅ Limpio, explícito
   - ✅ Maneja raíz `/` correctamente
   - ✅ No rompe otras rutas
   - ⚠️ Requiere pasar prop a DashboardPage

**Opción B: Estado inicial en DashboardPage (SIMPLE)**
   ```js
   const [activeModule, setActiveModule] = useState('gestion-planes-v1');
   ```
   - ✅ Más simple, una línea
   - ✅ Cero cambios en App.jsx
   - ⚠️ Menos flexible para rutas futuras
   - ⚠️ Si hay URL params, puede no sincronizar correctamente

**Opción C: useEffect + navegación condicional**
   - En DashboardPage, si activeModule es null, navegar a gestion-planes-v1
   - ✅ Flexibilidad
   - ⚠️ Lógica adicional

**Relaciones con otros requerimientos:**
- **BACKLOG-026 (formato afiliado):** Listado debe mostrar numero_afiliado formateado a 5 dígitos
- **BACKLOG-025 (debounce):** Búsqueda ya implementada con debounce configurable

**Testing:**
- Login → Verificar redirect automático a planes (no página en blanco)
- Tabla visible con todos los planes
- Columnas correctas: numero_afiliado (5 dígitos), apellido, nombre
- Búsqueda funciona (debounce + Enter)
- Botones editar/suspender funcionan
- Navegación a otros módulos sigue siendo posible (menú)
- No rompe autenticación ni cierre de sesión

**Estimación:** 1-2 horas (bajo esfuerzo)
  - Cambiar estado inicial: 0.25h
  - Opcional: redirect en Router: 0.5h
  - Testing flujo completo (login → planes): 0.5h
  - Verificar no rompe otras funcionalidades: 0.5h

**Prioridad:** 🔴 Alta — Es el punto de entrada principal, mejora UX significativamente

**Estado:** ✅ Solucionado (2026-04-21)

**Implementación Completada (2026-04-21):**
1. ✅ Cambiar `useState(null)` → `useState('gestion-planes-v1')` en DashboardPage.jsx línea 158
2. ✅ Login redirige directamente a tabla de planes (sin página en blanco)
3. ✅ Menú lateral permanece funcional para navegar a otros módulos
4. ✅ GestionPlanesV1 se monta automáticamente como módulo inicial

**Commit:**
- 74b3c84 - feat(BACKLOG-027): configurar gestion-planes-v1 como módulo inicial

---

### BACKLOG-028: Agregar Campo Zona a Planes

**Descripción:**
Ampliar el modelo de datos de planes agregando un nuevo campo numérico "Zona" de 2 dígitos. Este campo será obligatorio con valor por defecto 0, y debe mostrarse formateado con ceros a la izquierda (00-99). El cambio impacta en el backend (modelo y controller de planes) y en las interfaces de edición y visualización de planes. Zona pertenece al plan, no al afiliado.

**Requerimientos:**

a. **Estructura del Campo (BD)**
   - Nombre: `zona`
   - Tipo: TINYINT UNSIGNED (0-99) o INT
   - Default: 0
   - Nullable: NO
   - Ubicación tabla: tabla `personas`
   - Rango válido: 0-99 (2 dígitos)
   - Formato display: siempre con padding a 2 dígitos (00, 01, 02, ..., 99)

b. **Formato Visual**
   - Input: permitir 1-2 dígitos (validar 0-99)
   - Display: mostrar siempre con 2 dígitos formateados (00, 01, etc.)
   - Búsqueda: permitir búsqueda sin ceros (buscar "5" encuentra zona "05")
   - Listados: mostrar formateado (ejemplo: "Zona: 05")

c. **Validaciones**
   - Rango: 0-99 (validar en frontend y backend)
   - Obligatorio: siempre presente (default 0)
   - Tipo numérico: solo dígitos 0-9

d. **Flujo de Usuario**
   - Al crear afiliado: mostrar campo Zona con default "00"
   - Al editar afiliado: mostrar zona actual, permitir cambio
   - Al buscar afiliados: permitir filtrar por zona
   - Al crear plan: mostrar zona del afiliado titular

**Impacto Técnico - Base de Datos:**

1. **Migración 2.0.11 (NUEVA)**
   - upgrade.sql:
     ```sql
     ALTER TABLE personas ADD COLUMN zona TINYINT UNSIGNED NOT NULL DEFAULT 0;
     ```
   - downgrade.sql:
     ```sql
     ALTER TABLE personas DROP COLUMN zona;
     ```
   - Considerar: para datos existentes, zona será 0 para todos

2. **Modelo Sequelize (Persona.js)**
   - Agregar atributo:
     ```js
     zona: {
       type: DataTypes.INTEGER,
       allowNull: false,
       defaultValue: 0,
       validate: { min: 0, max: 99 }
     }
     ```

**Impacto Técnico - Backend:**

1. **Controllers (planesController.js, personasController.js)**
   - Validación de zona en create/update (0-99)
   - Retornar zona en responses
   - Permitir filtrar por zona en búsquedas

2. **Routes**
   - POST /api/personas: aceptar zona en body
   - PUT /api/personas/:id: aceptar zona en body
   - GET /api/personas: retornar zona en responses

3. **Responses API**
   - Todos los endpoints que retornan persona incluir zona
   - Ejemplo: `{ id, nombre, apellido, ... zona, ... }`

**Impacto Técnico - Frontend (CRÍTICO - muchos componentes):**

1. **Componentes de creación/edición de afiliados (5):**
   - `AfiladoSearchModal.jsx` (buscar + crear afiliados)
   - `AfiladoEditModal.jsx` (editar datos de afiliado)
   - `AfiladoFormModal.jsx` (si existe)
   - PlanV1Modal.jsx (si permite crear afiliados inline)
   - Formularios de creación general de personas

2. **Componentes de visualización (8):**
   - `BusquedaAfiliados.jsx` (tabla de personas)
   - `ListadoPlanes.jsx` (mostrar zona del titular)
   - `GestionPlanesV1.jsx` (tabla de planes - mostrar zona titular)
   - `PlanesPorCobrador.jsx` (tabla planes - zona)
   - `PersonasPage.jsx` (si existe)
   - `ReciboDetalleModal.jsx` (mostrar zona)
   - `IntegranteServiciosModal.jsx` (si muestra datos integrante)
   - Otros listados con personas

3. **Barra de búsqueda y filtros (3):**
   - Permitir filtrar por zona en BusquedaAfiliados
   - Permitir filtrar por zona en LookupCRUD (si se agrega)
   - Implementar búsqueda flexible: "5" encuentra "05"

4. **Hooks/Utilities (2):**
   - `usePlanV1Form.js`: incluir zona en validación de integrantes
   - Crear `formatZona()` en utils/formatters.js para reutilización

5. **Servicios (1):**
   - `personasService.js`: actualizar métodos create/update/search

**Flujo de Creación de Afiliado (Ejemplo):**
```
Usuario abre modal "Agregar Afiliado" en un plan
↓
Mostrar formulario con campos:
  - Nombre (requerido)
  - Apellido (requerido)
  - Tipo de Documento
  - Número de Documento
  - Fecha de Nacimiento
  - Zona (NUEVO) [input 0-99, default "00"]
  ↓
Usuario ingresa zona "5"
↓
onBlur: formatear a "05" en el input
↓
Click "Guardar"
↓
POST /api/personas { nombre, apellido, ..., zona: 5 }
↓
Backend valida 0 <= zona <= 99
↓
Backend guarda con zona = 5
↓
Respuesta: { id, nombre, apellido, ..., zona: 5 }
↓
Frontend formatea: "Zona: 05" en display
```

**Decisiones de Diseño:**

1. **¿Donde aparece el campo zona?**
   - ✅ Obligatorio: Formularios de creación/edición de afiliados
   - ⚠️ Opcional: Tablas/listados (mostrar si hay espacio)
   - ⚠️ Filtro: Permitir búsqueda/filtro por zona

2. **¿Formato de entrada vs salida?**
   - Input: permitir 1-2 dígitos (usuario escribe "5" o "05")
   - onBlur: formatear a 2 dígitos ("05")
   - Display: siempre "05"
   - API: guardar como INT 5, retornar como INT 5

3. **¿Migración backwards compatible?**
   - ✅ DEFAULT 0: datos existentes obtendrán zona 0
   - ⚠️ No nullable: todas las personas tendrán zona asignada

**Archivos a crear/modificar:**

Backend:
- `backend/src/migrations/versions/2.0.11_zona_personas/upgrade.sql` (NUEVO)
- `backend/src/migrations/versions/2.0.11_zona_personas/downgrade.sql` (NUEVO)
- `backend/src/models/Persona.js` (agregar atributo zona)
- `backend/src/controllers/personasController.js` (validar zona)
- `backend/src/controllers/planesController.js` (incluir zona en responses)

Frontend:
- `frontend/src/utils/formatters.js` (agregar formatZona)
- `frontend/src/components/AfiladoSearchModal.jsx` (agregar campo zona)
- `frontend/src/components/AfiladoEditModal.jsx` (agregar campo zona)
- `frontend/src/components/BusquedaAfiliados.jsx` (mostrar zona en tabla)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` (mostrar zona)
- `frontend/src/pages/DashboardPage/components/v1.0/ListadoPlanes.jsx` (mostrar zona)
- `frontend/src/pages/DashboardPage/components/v1.0/PlanesPorCobrador.jsx` (mostrar zona)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js` (validar zona integrantes)
- `frontend/src/services/personasService.js` (actualizar métodos)
- `frontend/src/components/ReciboDetalleModal.jsx` (mostrar zona)
- Otros listados/componentes que muestren personas

**Estimación:** 8-12 horas
  - Migración BD + modelo: 0.5h
  - Backend (controllers/routes): 1h
  - Formatter utility: 0.5h
  - Formularios afiliados (2-3 componentes): 2-3h
  - Listados y tablas (5-8 componentes): 2-3h
  - Búsqueda/filtros: 1-1.5h
  - Testing y ajustes: 1.5-2h

**Prioridad:** 🟡 Media — Nueva característica que amplía modelo de datos, requiere cambios transversales

**Estado:** ✅ Solucionado (2026-04-21)

**Implementación Completada (2026-04-21) - Corrección:**
1. ✅ Migración 2.0.10 corregida: `backend/src/migrations/versions/2.0.10_zona_planes/` (renombrada, ahora agrega zona a tabla `planes`, no `personas`)
2. ✅ Modelo Sequelize: removido `zona` de `backend/src/models/Persona.js`, agregado a `backend/src/models/PlanV1.js`
3. ✅ Backend controller: agregado `zona` a destructuring y creación en `planesController.js::crear()`, agregado a `camposPermitidos` en `actualizar()`
4. ✅ Frontend form state: agregado `zona: 0` a `INITIAL_FORM` e inicialización en `usePlanV1Form.js`
5. ✅ Frontend form field: agregado campo zona en `PlanV1Modal.jsx` tab "Datos Generales" con validación 0-99 y formatZona preview
6. ✅ Frontend visualización: agregada columna Zona a tabla de planes en `GestionPlanesV1.jsx`
7. ✅ Frontend limpieza: removido campo zona de `AfiladoSearchModal.jsx`, `AfiladoEditModal.jsx`, y columna Zona de `BusquedaAfiliados.jsx`
8. ✅ Formatter utility: reutilización de `formatZona()` ya existente en `frontend/src/utils/formatters.js`

**Commits:**
- 424b5ba - refactor(BACKLOG-028): corregir migración - zona en planes, no en personas
- 9fc89c7 - refactor(BACKLOG-028): quitar zona de Persona, agregar a PlanV1 y controller
- 74f6468 - refactor(BACKLOG-028): agregar campo zona al formulario y tabla de planes
- 89c85cb - refactor(BACKLOG-028): quitar zona de formularios y tabla de afiliados

---

### BACKLOG-031: Implementar Paginación en Listados (>10 registros)

**Descripción:**
Todos los listados de datos (planes, afiliados, cobradores, obras sociales, servicios adicionales, tipos de grupo, tipos de plan, bugs) deben mostrar paginación cuando el número total de registros exceda 10 elementos. La paginación debe ser con componente reutilizable, manejo de estado por página, y controles visuales intuitivos.

**Análisis de Diseño:**

a. **Estado actual (problemas identificados):**
   - GestionPlanesV1.jsx: `.slice(0, ITEMS_PER_PAGE)` mostrando solo primeros 20 registros, sin navegación
   - LookupCRUD.jsx: `.slice(0, ITEMS_PER_PAGE)` mostrando solo primeros 20 registros, sin navegación
   - BusquedaAfiliados.jsx: sin paginación, carga todos los resultados
   - GestionBugs.jsx: `.slice()` basado en índice con paginación hardcodeada
   - Problema: usuarios no pueden acceder a registros más allá del límite sin scroll masivo o búsqueda
   - UX pobre: sin indicación de cuántos registros totales hay

b. **Solución propuesta:**

   **Componente Pagination.jsx** (nuevo, reutilizable):
   ```
   Props: currentPage, totalPages, totalItems, itemsPerPage, onPageChange
   Renderiza:
   - Texto info: "Mostrando X-Y de Z registros"
   - Botón "Anterior" (disabled si page=1)
   - Links números de página (1 2 3 ... N)
   - Botón "Siguiente" (disabled si page=totalPages)
   - Select "Items per page" (10, 20, 50)
   Evento: onPageChange(newPage, newItemsPerPage)
   ```

   **Hook usePagination.js** (nuevo):
   ```
   Estado: currentPage, itemsPerPage
   Calcula: totalPages = Math.ceil(totalItems / itemsPerPage)
   Retorna: paginatedItems, currentPage, totalPages, handleChangePage, handleChangeItemsPerPage
   Validación: page siempre >= 1 y <= totalPages
   ```

   **Actualizar componentes principales:**
   - GestionPlanesV1.jsx:
     * Integrar usePagination hook
     * Mostrar Pagination si planes.length > 10
     * Usar paginatedItems en lugar de slice(0, 20)
     * Default ITEMS_PER_PAGE = 15 (entre 10 y 20)
   
   - LookupCRUD.jsx:
     * Integrar usePagination hook
     * Mostrar Pagination si registros.length > 10
     * Usar paginatedItems en lugar de slice(0, 20)
     * Default ITEMS_PER_PAGE = 15
   
   - BusquedaAfiliados.jsx:
     * Integrar usePagination hook si no tiene
     * Agregar Pagination
     * Default ITEMS_PER_PAGE = 15
   
   - GestionBugs.jsx:
     * Mantener lógica existente pero mejorar con componente Pagination
     * Default ITEMS_PER_PAGE = 15

c. **Criterio de activación:**
   - Si totalItems > 10: mostrar Pagination
   - Si totalItems <= 10: no mostrar Pagination (toda tabla en una página)

d. **Estilos:**
   - Componente Pagination.scss con BEM
   - Centrado en footer de tabla
   - Botones deshabilitados con opacidad
   - Números activos resaltados
   - Select de items con estilos consistentes

e. **Comportamiento:**
   - Al cambiar filtro/búsqueda: resetear a página 1
   - Al cambiar items per page: resetear a página 1
   - Validación: si estoy en página 5 pero ahora hay solo 3 páginas, ir a última
   - Performance: filtrado en cliente (ya funciona así), paginación post-filtrado

**Archivos a modificar:**
1. Crear: frontend/src/components/Pagination/Pagination.jsx (nuevo)
2. Crear: frontend/src/hooks/usePagination.js (nuevo)
3. Crear: frontend/src/components/Pagination/Pagination.scss (nuevo)
4. Modificar: GestionPlanesV1.jsx
5. Modificar: LookupCRUD.jsx
6. Modificar: BusquedaAfiliados.jsx (si no tiene paginación)
7. Modificar: GestionBugs.jsx

**Decisiones de diseño:**
- Default ITEMS_PER_PAGE = 15 (visible sin scroll en mayoría de pantallas)
- Opciones en select: [10, 15, 20, 50] (usuarios pueden elegir)
- Números de página máximo 7 visibles (1 2 3 4 5 6 7) luego "... N"
- Mantener búsqueda/filtros activos al cambiar página
- Sin paginación en servidor: se hace en cliente (dato pequeño)

---

### BACKLOG-030: Modificar Sección de Soporte en Footer (WhatsApp + Email)

**Descripción:**
Mejorar la accesibilidad del contacto directo en la landing page. Reemplazar el link "Contacto" con un link directo a WhatsApp (+54 11 3355 2955) y agregar un nuevo link de Email (alejandro.rouiller@gmail.com) en la sección "Soporte" del Footer.

**Requerimientos:**

a. **Cambios en componente Footer (frontend/src/pages/LandingPage/components/Footer/Footer.jsx)**
   - Sección "Soporte" contiene:
     - Link "Documentación" (existente, mantener)
     - Reemplazar "Contacto" por "WhatsApp": URL debe abrir chat de WhatsApp con número +54 11 3355 2955
       * Usar deep link: `https://wa.me/+541133552955` o `whatsapp://send?phone=+541133552955`
       * Validar funcionalidad en desktop y mobile
     - Agregar nuevo link "Email": abre cliente de email del usuario
       * Usar mailto link: `mailto:alejandro.rouiller@gmail.com`

b. **Estilos (posiblemente Footer.scss)**
   - Mantener consistencia visual con links existentes
   - No requiere cambios de styling, solo revisión si es necesario

**Contexto:**
Facilita contacto rápido y directo de usuarios con soporte mediante canales modernos (WhatsApp para chat instantáneo, Email como alternativa formal). Mejora UX en landing page y accesibilidad del soporte.

**Archivos estimados:**
- Footer.jsx (cambio principal)
- Footer.scss (revisión, posiblemente sin cambios)

**Decisiones:**
- WhatsApp link formato: `https://wa.me/+541133552955` (estándar internacional)
- Email link formato: `mailto:alejandro.rouiller@gmail.com` (RFC estándar)
- Sin validación adicional, links son directo a herramientas externas
- WhatsApp link abre en nueva pestaña (target="_blank", rel="noopener noreferrer")

**Implementación:**
- ✅ Footer.jsx: reemplazado link "Contacto" por "WhatsApp" + agregado link "Email"
- ✅ Sección "Soporte" con 3 links: Documentación, WhatsApp, Email

**Commits:**
- 31ac91a - feat(footer): agregar links WhatsApp y Email en seccion Soporte

---

### BACKLOG-029: Sistema de Gestión de Bugs (Reportes de Problemas)

**Descripción:**
Implementar un sistema centralizado de reporte y gestión de bugs donde usuarios pueden registrar problemas encontrados con un campo de texto enriquecido (con soporte para imágenes). Los bugs tienen un número único asignado automáticamente por el sistema y flujo de estados (REGISTRADO → DESARROLLADO/DESESTIMADO/CERRADO) controlado por administradores.

**Requerimientos:**

a. **Registro de Bug (por cualquier usuario)**
   - Acceso: interfaz en menú principal o módulo dedicado
   - Campo de texto enriquecido: soporte HTML, imágenes, formatos (negrita, cursiva, listas, etc.)
   - Validación: descripción requerida, mínimo 20 caracteres
   - Estado inicial: "REGISTRADO" (asignado automáticamente)
   - Número único: autoincremento, formato: BUGS-0001, BUGS-0002, etc.
   - Metadatos capturados:
     - ID de usuario que reporta
     - Fecha/hora de creación
     - Campo de reproducción (optional): pasos para reproducir, navegador, versión app, etc.

b. **Gestión de Estado (solo admin)**
   - Estados posibles: REGISTRADO → DESARROLLADO, REGISTRADO → DESESTIMADO, DESARROLLADO → CERRADO, DESESTIMADO → CERRADO
   - Cada cambio registra: quién cambió, cuándo, motivo (campo de texto)
   - Vista admin: botones para cambiar estado con modal de confirmación
   - Auditoría: historial de cambios de estado visible

c. **Listado de Bugs**
   - Tabla paginada con: número, resumen (primeras 100 chars), usuario, fecha, estado, acciones
   - Filtros: por estado, por usuario creador, por rango de fechas
   - Búsqueda: texto completo en descripción
   - Ordenamiento: por fecha (desc default), por estado, por usuario
   - Indicadores visuales: color según estado

d. **Visualización de Detalle**
   - Descripción HTML completa con imágenes
   - Información de creador, fecha, estado actual
   - Historial de cambios de estado (timestamps, admin que cambió, motivo)
   - Si es admin: botones para cambiar estado
   - Links relacionados: ninguno por ahora (future: enlazar con tickets, PRs, etc.)

**Impacto Técnico - Base de Datos:**

1. **Nueva tabla: `bugs`**
   ```sql
   bugs (
     id: INT AUTO_INCREMENT PRIMARY KEY,
     numero: VARCHAR(20) UNIQUE NOT NULL,  -- BUGS-0001, BUGS-0002, etc.
     usuario_id: INT NOT NULL FK personas.id,
     titulo: VARCHAR(255),  -- optional resumen
     descripcion: LONGTEXT NOT NULL,  -- HTML enriquecido
     pasos_reproduccion: LONGTEXT,  -- optional
     estado: ENUM('REGISTRADO','DESARROLLADO','DESESTIMADO','CERRADO') DEFAULT 'REGISTRADO',
     fecha_creacion: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     fecha_actualizacion: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     navegador_user_agent: VARCHAR(500),  -- optional, capturado en frontend
     url_origen: VARCHAR(500),  -- optional
     version_app: VARCHAR(50),  -- optional
     indice: INT UNIQUE NOT NULL AUTO_INCREMENT  -- para generar número BUGS-XXXX
   )
   ```

2. **Tabla de auditoría: `bugs_historial_cambios`**
   ```sql
   bugs_historial_cambios (
     id: INT AUTO_INCREMENT PRIMARY KEY,
     bug_id: INT NOT NULL FK bugs.id,
     estado_anterior: ENUM(...),
     estado_nuevo: ENUM(...),
     admin_id: INT NOT NULL FK personas.id,  -- admin que realizó el cambio
     motivo: LONGTEXT,  -- descripción del cambio/cierre
     fecha_cambio: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )
   ```

3. **Índices:**
   - PRIMARY KEY (id)
   - UNIQUE (numero)
   - INDEX (usuario_id)
   - INDEX (estado)
   - INDEX (fecha_creacion)

**Impacto Técnico - Backend:**

1. **Modelo Sequelize:**
   - `Bug.js` con relaciones a Usuario (creador)
   - `BugHistorialCambio.js` con relaciones a Bug y Usuario (admin)

2. **Controller: `bugsController.js`**
   - `crear(req, res)`: POST /api/bugs → crear bug nuevo, generar número secuencial
   - `listar(req, res)`: GET /api/bugs → listar bugs con filtros, paginación, búsqueda
   - `obtener(req, res)`: GET /api/bugs/:id → detalle bug + historial cambios
   - `cambiarEstado(req, res)`: PUT /api/bugs/:id/estado → cambiar estado (admin only)
     - Validar transiciones de estado permitidas
     - Registrar en tabla de auditoría
     - Notificar a usuario que reportó (opcional: email)

3. **Routes:**
   - GET `/api/bugs` → admin: todos, usuario: solo los suyos (o públicos si aplica)
   - GET `/api/bugs/:id` → detail completo
   - POST `/api/bugs` → crear (cualquier usuario autenticado)
   - PUT `/api/bugs/:id/estado` → cambiar estado (admin only)
   - Protección: auth middleware en todas las rutas

4. **Middleware:**
   - Validación de transiciones de estado (solo cambios permitidos)
   - Sanitización de HTML en descripción (prevenir XSS)
   - Rate limiting en crear bug (ej: 5 bugs/hora/usuario para evitar spam)

**Impacto Técnico - Frontend:**

1. **Componentes nuevos:**
   - `BugsPage.jsx`: página principal con listado
   - `BugForm.jsx` / `BugReportModal.jsx`: modal o página para registrar bug
   - `BugDetailModal.jsx`: modal o página de detalle
   - `BugStateChangeModal.jsx`: modal para admin cambiar estado
   - `BugList.jsx`: tabla con filtros, búsqueda, paginación
   - `BugFilters.jsx`: componente de filtros

2. **Editor de texto enriquecido:**
   - Opciones: Quill, TinyMCE, CKEditor, slate
   - Criterios de selección:
     - Soporte de imágenes (embed o upload)
     - Lightweight
     - Fácil integración React
     - Sanitización de HTML (XSS prevention)
   - Consideraciones de upload de imágenes:
     - ¿Guardar en BD como base64? (no escalable)
     - ¿Guardar en carpeta `public/uploads/bugs/`? (más simple, requiere gestión de archivos)
     - ¿Usar CDN externo? (no en Hostinger shared hosting)
     - Recomendación: carpeta local con límite de tamaño/cantidad

3. **Estados visuales:**
   - Badge/color por estado:
     - REGISTRADO: gris
     - DESARROLLADO: amarillo
     - DESESTIMADO: rojo
     - CERRADO: verde

4. **Acceso:**
   - Menú principal: opción "Reportar Bug" o "Gestión de Bugs"
   - Dashboard: módulo "Bugs" similar a Planes, Recibos, etc.

**Decisiones de Diseño (pendientes):**

1. **¿Quién puede ver los bugs?**
   - Opción A: Solo admin ve todos, usuarios ven los suyos
   - Opción B: Todos ven todos los bugs (transparencia total)
   - Opción C: Usuarios ven bugs CERRADOS/DESARROLLADOS, admin ve todos
   - Recomendación: Opción A (privacidad, menos ruido para usuarios)

2. **¿Qué desencadena cambio de estado?**
   - Solo admin manual (actual)
   - ¿Implementar auto-cierre después de N días? (future)
   - ¿Workflow: REGISTRADO → REVISADO → ASIGNADO → DESARROLLADO? (más complejo, out-of-scope)

3. **¿Imágenes en descripción?**
   - Upload (requiere gestión de carpetas)
   - Embed URL externa (más simple)
   - Copy-paste como base64 (pesado)
   - Recomendación: Upload local, límite 2MB/imagen, máx 3 imágenes/bug

4. **¿Notificaciones?**
   - Email a usuario cuando estado cambia? (requiere config de mail)
   - Notificación en app? (requiere sistema de notificaciones)
   - Recomendación: v1 sin notificaciones, usuario verifica manualmente

5. **¿Cierre automático?**
   - Bugs CERRADOS después de 30 días sin actividad? (future)
   - Bugs DESESTIMADOS después de 90 días? (future)
   - v1: solo cierre manual

6. **¿Búsqueda full-text?**
   - Implementar FULLTEXT index en MySQL para búsqueda rápida
   - Or: búsqueda simple LIKE en descripción
   - Recomendación: LIKE para v1

**Archivos a crear/modificar:**

Backend (nuevos):
- `backend/src/migrations/versions/2.0.11_bugs_system/upgrade.sql`
- `backend/src/migrations/versions/2.0.11_bugs_system/downgrade.sql`
- `backend/src/models/Bug.js`
- `backend/src/models/BugHistorialCambio.js`
- `backend/src/controllers/bugsController.js`
- `backend/src/routes/bugs.js`

Frontend (nuevos):
- `frontend/src/pages/BugsPage/BugsPage.jsx`
- `frontend/src/pages/BugsPage/BugsPage.scss`
- `frontend/src/pages/BugsPage/components/BugList.jsx`
- `frontend/src/pages/BugsPage/components/BugFilters.jsx`
- `frontend/src/pages/BugsPage/modals/BugReportModal.jsx`
- `frontend/src/pages/BugsPage/modals/BugDetailModal.jsx`
- `frontend/src/pages/BugsPage/modals/BugStateChangeModal.jsx`
- `frontend/src/services/bugsService.js`

Frontend (modificar):
- `frontend/src/App.jsx`: agregar ruta /bugs
- `frontend/src/pages/DashboardPage/DashboardPage.jsx`: agregar módulo bugs al menú
- `frontend/src/context/AuthContext.jsx`: si se requieren permisos específicos

**Estimación:**
- Migración BD + modelos: 1h
- Backend (controller, routes, validaciones): 3-4h
- Editor de texto enriquecido (investigación + integración): 2-3h
- Frontend (componentes, modales, listado, filtros): 4-5h
- Servicios y integración API: 1-2h
- Testing y ajustes: 2-3h
- **Total: 13-18 horas**

**Prioridad:** 🟡 Media — Sistema de reporte útil pero no bloqueante para core

**Estado:** ✅ Solucionado (2026-04-21)

**Implementación:**

**Backend:**
- ✅ Migración 2.0.11: tabla bugs con id, numero (UNIQUE), usuario_id, titulo, descripcion (LONGTEXT), estado (ENUM), fecha_creacion, fecha_actualizacion
- ✅ Modelo Bug.js con beforeSave hook actualizando fecha_actualizacion
- ✅ Registro de modelo en models/index.js con asociación a Usuario
- ✅ Controller bugsController.js con 4 handlers:
  - `listar()`: GET /api/v1.0/bugs con filtros estado, usuario_id y búsqueda full-text en titulo/descripcion
  - `obtener()`: GET /api/v1.0/bugs/:id con include Usuario
  - `crear()`: POST /api/v1.0/bugs - genera número secuencial BUG-XXXX, estado inicial REGISTRADO, captura usuario_id de JWT
  - `cambiarEstado()`: PUT /api/v1.0/bugs/:id/estado - solo admin, valida transiciones (REGISTRADO→DESARROLLADO/DESESTIMADO, luego→CERRADO, CERRADO read-only)
- ✅ Routes v1.0/bugs.js con endpoints protegidos por verifyToken y requireAdmin según corresponda

**Frontend:**
- ✅ react-quill instalado en package.json (v2.0.0-beta.2)
- ✅ Service bugsService.js con métodos listar(), obtener(), crear(), cambiarEstado()
- ✅ Componente GestionBugs.jsx: listado paginado (15 items/page) con tabla mostrando número, título, reportado por, fecha, estado
  - Filtro por estado (select)
  - Búsqueda debounced en título/descripción/usuario
  - Acciones: ver detalle
- ✅ Modal BugFormModal.jsx:
  - Campo título (opcional)
  - Editor ReactQuill para descripción (requerida)
  - Toolbar: bold, italic, underline, listas ordenadas/bullets, imágenes
  - Validación: descripción no vacía
  - Change detection con ConfirmCloseDialog
- ✅ Modal BugDetalleModal.jsx:
  - Muestra: número, reportado por, fecha, estado
  - Título (si existe)
  - Descripción HTML renderizada con dangerouslySetInnerHTML
  - Admin-only: botones de transición de estado según estado actual
  - Transiciones visibles: REGISTRADO→Marcar Desarrollado + Desestimar, DESARROLLADO→Cerrar Bug, DESESTIMADO→Cerrar Bug, CERRADO→read-only
- ✅ Integración en DashboardPage.jsx:
  - Importado GestionBugs
  - Agregado 'gestion-bugs' al menú bajo sección Gestión
  - Render condicional: `{activeModule === 'gestion-bugs' && <GestionBugs />}`
- ✅ StatusBadge.scss: agregados estilos para 4 estados:
  - --registrado: color info
  - --desarrollado: color warning
  - --desestimado: color danger
  - --cerrado: color muted

**Decisiones implementadas:**
- Todos los usuarios ven todos los bugs (transparencia total en entorno interno)
- Solo admin puede cambiar estado
- Números formato BUG-XXXX (secuencial de 4 dígitos)
- Sin tabla de auditoría en v1 (solo estado actual, sin historial de cambios)
- Sin notificaciones por email (usuario verifica manualmente)
- Sin rate limiting en v1
- Editor Quill con imágenes embebidas como base64

**Commits:**
- e3b4502 feat(bugs): agregar migración 2.0.11 para tabla bugs
- e0b328b feat(bugs): agregar modelo Bug y registrar en models/index.js
- 02da8a4 feat(bugs): agregar controller bugsController.js con 4 handlers
- a6ceeb5 feat(bugs): agregar routes/v1.0-bugs.js con 4 endpoints
- c222aac feat(bugs): montar rutas de bugs en index.js
- fb15bdb feat(bugs): instalar react-quill para editor de texto enriquecido
- d4d29c8 feat(bugs): agregar bugsService.js
- 0fd78c5 feat(bugs): agregar GestionBugs.jsx - listado con filtros y paginación
- 283e56b feat(bugs): agregar modales BugFormModal y BugDetalleModal
- 94f3c99 style(StatusBadge): agregar estilos para estados de bugs
- 425f06c feat(bugs): integrar módulo de bugs en DashboardPage

---

### BACKLOG-032: Sistema de Auditoría - Listado de Acceso a Endpoints del Backend

**Descripción:**
Panel administrativo que registra y visualiza todos los accesos a endpoints del backend. Incluye usuario, fecha/hora, endpoint invocado, parámetros y respuesta. Proporciona trazabilidad completa para auditoría, compliance y detección de actividad sospechosa.

**Requerimientos Funcionales:**

a. **Tabla de Auditoría (Backend)**
   - Registra: usuario_id, fecha_hora, método_http (GET/POST/PUT/DELETE), endpoint (ruta), parametros_json, status_response, duracion_ms
   - Índices en: usuario_id, fecha_hora, endpoint para queries eficientes
   - Retention policy: **configurable** (admin especifica cantidad de días, default 90)
   - Performance: escritura asíncrona (no bloqueante)
   - **Habilitación/Deshabilitación:** admin puede activar/desactivar logging sin reiniciar app

b. **Página de Auditoría (Admin-only)**
   - Tabla paginada con columnas: Usuario | Fecha/Hora | Endpoint | Método | Status | Duración
   - Filtros: usuario (select), rango de fechas, búsqueda por endpoint
   - Paginación obligatoria (potencialmente 10k+ registros)
   - Ordenamiento: por fecha descendente (default)
   - Exportar a CSV (opcional pero deseable)

c. **Middleware Global (Backend)**
   - Intercepta TODAS las requests después de autenticación JWT (si logging está HABILITADO)
   - Captura parámetros de query, body, y ruta
   - **Sanitización crítica:** NO loguear contraseñas, tokens, datos sensibles completos
   - Considera excluir ciertos endpoints (health checks, logout)
   - Manejo de errores: si logging falla, NO debe romper el request

d. **Configuración de Auditoría (Admin UI)**
   - Nueva sección en "Configuración": "Configuración de Auditoría"
   - **Toggle:** Habilitar/Deshabilitar auditoría (checkbox on/off) → afecta inmediatamente al middleware
   - **Campo numérico:** Retención de logs (días) → valores 1-365, default 90
   - Guardar configuración en tabla `configuracion_app` con tipos `audit_enabled` (booleano) y `audit_retention_days` (integer)
   - Al cambiar, middleware lee config sin reiniciar (config inyectada en memory o redis check)
   - Indicador visual: mostrar si auditoría está activa/inactiva

**Requerimientos Técnicos:**

1. **Base de Datos**
   - Migración 2.0.14: crear tabla `audit_log`
   - Campos: id (PK), usuario_id (FK), fecha_hora (timestamp), metodo_http (VARCHAR), endpoint (VARCHAR), parametros_json (LONGTEXT), status_response (INT), duracion_ms (INT), created_at
   - Índices: (usuario_id, fecha_hora), (endpoint), (fecha_hora)
   - **Configuración:** agregar 2 registros a `configuracion_app`:
     - `audit_enabled` (tipo: booleano, default: true, valor: 1/0)
     - `audit_retention_days` (tipo: integer, default: 90, rango: 1-365)

2. **Backend**
   - Middleware: `middleware/auditMiddleware.js`
     - Verificar `audit_enabled` al inicio de cada request (verificar en memory cache o configService)
     - Si está deshabilitado, skip logging y continuar
     - Si está habilitado, proceder a capturar y loguear asincronamente
   - Model: `models/AuditLog.js` (Sequelize)
   - Controller: `controllers/auditController.js` (listar con filtros)
   - Routes: `routes/audit.js` (GET /audits con auth admin-only)
   - Escritura asíncrona: usar Redis queue o worker thread
   - Sanitización: función que reemplaza campos sensibles con [REDACTED]
   - **Tarea de limpieza:** cron job o trigger que elimina registros más viejos que `audit_retention_days` cada noche
   - **ConfigService:** agregar métodos para leer y actualizar audit_enabled y audit_retention_days

3. **Frontend**
   - Página: `pages/DashboardPage/components/AuditLog/AuditLogPage.jsx`
   - Service: `services/auditService.js`
   - Componente tabla con paginación (reutilizar Pagination.jsx)
   - Filtros: usuario select + DateRangePicker + endpoint search
   - Proteger acceso: validar isAdmin antes de renderizar
   - **UI de Configuración:** agregar sección en `ConfiguracionNotificaciones.jsx` (o crear nueva página "Configuración > Auditoría")
     - Toggle checkbox: "Habilitar Auditoría" (lee/escribe audit_enabled)
     - Input number: "Retención de logs (días)" rango 1-365, default 90 (lee/escribe audit_retention_days)
     - Validaciones: min=1, max=365, step=1
     - Indicador: mostrar "Auditoría: ACTIVA" o "Auditoría: INACTIVA" en color (verde/rojo)

**Impacto Técnico:**

| Área | Impacto | Severidad |
|------|---------|-----------|
| BD | Nueva tabla, crecimiento rápido (100-500 registros/día), limpieza automática por retención configurable | 🟡 Medio |
| Backend | Middleware global con check de habilitación, escritura async, sanitización crítica, cron/trigger de limpieza | 🔴 Alto |
| Performance | Queries de auditoría pueden ser lentas, paginación obligatoria, limpieza nocturna | 🟡 Medio |
| Seguridad | Exposición de datos sensibles si no se sanitiza correctamente | 🔴 Alto |
| Privacidad | Retención configurable (default 90 días) cumple GDPR si se configura correctamente | 🟢 Bajo |
| Frontend | Página + componentes + UI configuración, moderada complejidad | 🟡 Medio |

**Decisiones Resueltas:**

1. ✅ Habilitación/Deshabilitación: **configurable por admin** (toggle en UI, almacenado en configuracion_app)
2. ✅ Retención: **configurable por admin** (rango 1-365 días, default 90, almacenado en configuracion_app)

**Decisiones Pendientes:**

1. ¿Loguear todos los GET requests o solo mutations (POST/PUT/DELETE)?
2. ¿Incluir response body o solo status code?
3. ¿Mostrar todos los parámetros o solo principales? (ej: solo número_afiliado, no cuota completa)
4. ¿Exportar a CSV disponible?
5. ¿Auditoría de cambios en tabla audit_log misma? (meta-auditoría)
6. ¿Rate limiting en queries de auditoría?

**Estimación:**

- Backend: ~4-5 días (middleware con checks, async queue, cron/trigger limpieza, sanitización, configService, testing)
- Frontend: ~2 días (página auditoría + página configuración, componentes, filtros, toggles, validaciones)
- Testing: ~1 día (security, performance, edge cases, limpieza nocturna)
- **Total: ~7-8 días**

**Estado:**

- 📋 Registrado (registrado 2026-04-23)
- Pendiente de aclaración de requerimientos y decisiones

---

### BACKLOG-033: Estandarizar Estructura de Barras de Filtros en Pantallas de Gestión

**Descripción:**
Estandarizar la estructura visual y funcional de las barras de filtros/acciones en todas las pantallas de gestión (Planes, Cobradores, Obras Sociales, Servicios Adicionales, Tipos de Grupo, Tipos de Plan). Actualmente cada pantalla tiene una estructura y alineación diferente. El objetivo es mantener consistencia visual y mejorar la usabilidad.

**Requerimientos Funcionales:**

a. **Estructura de Layout**
   - Título: posicionado arriba (como actualmente existe)
   - Barra de filtros/acciones: debajo del título
   - Componentes en la barra:
     * Caja de búsqueda/filtro (posición: izquierda)
     * Botones de acciones (nuevo, aumento masivo, etc) (posición: derecha de la búsqueda)
   - **Alineación vertical:** todos los componentes deben estar alineados al centro (middle/center)

b. **Aplicar en todas las pantallas:**
   - GestionPlanesV1
   - Cobradores
   - ObrasSociales
   - ServiciosAdicionales
   - TiposDeGrupo
   - TiposDePlan
   - BusquedaAfiliados (si corresponde)

c. **Detalles técnicos:**
   - Usar flexbox con `display: flex; align-items: center;`
   - Caja de búsqueda: ancho automático o mínimo según contenido
   - Botones: gap consistente (1rem) entre componentes
   - Responsive: en móviles, si no cabe, puede expandirse a dos filas pero manteniendo alineación vertical
   - Usar componentes existentes: SearchContainer, botones estándar

**Archivos a modificar:**

| Componente | Ubicación |
|------------|-----------|
| GestionPlanesV1 | `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx/.scss` |
| Cobradores | `frontend/src/pages/DashboardPage/components/Cobradores/Cobradores.jsx/.scss` |
| ObrasSociales | `frontend/src/pages/DashboardPage/components/ObrasSociales/ObrasSociales.jsx/.scss` |
| ServiciosAdicionales | `frontend/src/pages/DashboardPage/components/ServiciosAdicionales/ServiciosAdicionales.jsx/.scss` |
| TiposDeGrupo | `frontend/src/pages/DashboardPage/components/TiposDeGrupo/TiposDeGrupo.jsx/.scss` |
| TiposDePlan | `frontend/src/pages/DashboardPage/components/TiposDePlan/TiposDePlan.jsx/.scss` |
| BusquedaAfiliados | `frontend/src/pages/DashboardPage/components/v1.0/BusquedaAfiliados.jsx/.scss` (si aplica) |

**Estimación:**

- Por componente: ~30-45 min (análisis de estructura actual + refactoring JSX + actualización SCSS)
- Total: ~3-4 horas (7 componentes × 30-45 min)

**Estado:**

- ✅ Solucionado (completado 2026-04-24)
- Implementado en commits: a8ee3a3, 6126445
- Estructura estándar aplicada a todas las pantallas de gestión
- SearchContainer con flex: 1 para expandirse hasta los botones
- Botones alineados a la derecha con gap de 0.75rem

**Cambios Implementados:**

1. **JSX:** Separación de título y barra de filtros
   - `__title` para el título
   - `__filters` para el contenedor con búsqueda + botones
   
2. **SCSS:** Estilos con flexbox
   - `display: flex; align-items: center;` en `__filters`
   - `flex: 1` en SearchContainer para ocupar espacio
   - `flex: 1` en input-wrapper para expandirse hasta los botones
   - Gap de 0.75rem entre componentes

3. **Componentes Afectados:**
   - LookupCRUD (usado por 5 pantallas)
   - GestionPlanesV1
   - BusquedaAfiliados
   - GestionAuditoria

---

## Detalles de Items

### BACKLOG-060: Habilitar Servicios para Afiliados Después de Guardar Plan Nuevo

**Descripción:**
En el flujo de creación de un plan nuevo, los afiliados se guardan en conjunto con el plan (no hay auto-save individual como en BACKLOG-059 para planes existentes). Después de que el usuario selecciona "Guardar y Seguir Editando", debe habilitarse la funcionalidad de asignar servicios adicionales a los afiliados. Mientras no se haya guardado el plan nuevo, el botón de servicios (⚙️) debe estar deshabilitado.

**Comportamiento Requerido:**

a. **Flujo de creación de plan nuevo (modo 'crear'):**
   1. Usuario abre modal de crear plan
   2. Ingresa datos del plan
   3. Agrega afiliados (se agregan solo al estado local, NO se guardan en BD)
   4. Hace clic en "Guardar y Seguir Editando" o "Guardar y Cerrar"
   5. `handleGuardar` crea el plan, crea todos los afiliados, y los ordena (todo en una transacción lógica)
   6. Si selecciona "Guardar y Seguir Editando": modal permanece abierta

b. **Estado del botón de servicios:**
   - **Antes de guardar plan nuevo:** Botón ⚙️ deshabilitado (gris, tooltip: "Guarde el plan para agregar servicios")
   - **Después de guardar plan nuevo:** Botón ⚙️ habilitado (se puede hacer clic para abrir IntegranteServiciosModal)
   - En modo editar: botón ⚙️ siempre habilitado (porque el plan ya existe en BD)

c. **Implementación:**
   - Agregar estado `planSaved` (boolean) en PlanV1Modal
   - Inicializar en false
   - En `handleGuardar`, después de guardado exitoso:
     * Si `mode === 'crear'`: `setPlanSaved(true)` + actualizar `planData` con los datos retornados
     * Si `mode === 'editar'`: dejar como está
   - En el botón ⚙️ de la tabla de afiliados:
     * `disabled={mode === 'crear' && !planSaved}`
     * Tooltip dinámico según estado

d. **Contexto:**
   - Los servicios están ligados a un integrante (tabla IntegranteServicio con FK a plan_integrante)
   - No es posible asignar servicios a un afiliado que no existe en BD
   - En plan existente (editar), los afiliados ya existen → servicios siempre disponibles
   - En plan nuevo (crear), los afiliados se crean recién al guardar → servicios disponibles solo después

**Requerimientos funcionales:**

1. **Control de estado:**
   - Nuevo estado `planSaved` en PlanV1Modal (false al abrir/crear, true después de guardar exitoso)
   - Afecta solo modo "crear"

2. **Botón de servicios (⚙️):**
   - Ubicación: tabla de afiliados, columna "Acciones"
   - Estado: `disabled={mode === 'crear' && !planSaved}`
   - Tooltip: Si deshabilitado, mostrar "Guarde el plan para agregar servicios"
   - Si habilitado, comportamiento actual (onClick abre IntegranteServiciosModal)

3. **IntegranteServiciosModal:**
   - No requiere cambios (la condición de deshabilitado está en el botón, no en el modal)

4. **handleGuardar:**
   - No requiere cambios en la lógica de guardado
   - Solo agregar `setPlanSaved(true)` después de guardado exitoso en modo crear

**Componentes Afectados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
  - Línea ~38: nuevo estado `planSaved`
  - Línea ~113-119: inicializar `planSaved = false` al cargar en modo crear
  - Línea ~333: agregar `if (mode === 'crear') setPlanSaved(true)` después de guardado exitoso
  - Tabla de afiliados: botón ⚙️ con `disabled={mode === 'crear' && !planSaved}`
  - Botón ⚙️: tooltip dinámico

**Testing Checklist:**
- [ ] Crear plan nuevo
- [ ] Agregar afiliados (botón ⚙️ debe estar deshabilitado/gris)
- [ ] Hacer hover en botón ⚙️ → debe mostrar tooltip "Guarde el plan para agregar servicios"
- [ ] Hacer clic en botón ⚙️ → no debe abrir modal (botón deshabilitado)
- [ ] Hacer clic "Guardar y Seguir Editando"
- [ ] Esperar a que se guarde y modal reabre
- [ ] Botón ⚙️ ahora debe estar habilitado (sin tooltip)
- [ ] Hacer clic en botón ⚙️ → debe abrir IntegranteServiciosModal
- [ ] En modo editar: botón ⚙️ siempre habilitado (sin cambios)
- [ ] En modo editar, agregar nuevo afiliado → botón ⚙️ habilitado para el nuevo

**Estimación:** 1-1.5 horas

**Prioridad:** 🔴 Alta — Define flujo correcto de creación, mejora UX, previene confusion

**Beneficio:**
- ✅ UX clara: usuario sabe que debe guardar plan antes de asignar servicios
- ✅ Previene errores: no intenta abrir modal de servicios con plan no guardado
- ✅ Comportamiento consistente: servicios siempre dependen de existencia en BD
- ✅ Diferencia clara entre flujo crear vs editar

**Relación con otros requerimientos:**
- BACKLOG-059: Auto-save en editar. BACKLOG-060: Manual save en crear
- BACKLOG-058: "Guardar y Seguir Editando" habilita servicios después de guardar
- Complementan el flujo completo de gestión de planes y afiliados

**Estado:** ✅ Solucionado (2026-05-08)

**Resolución de BUG-037 (Fase Final):**

Después de la implementación inicial, se descubrió BUG-037: las personas se creaban en BD inmediatamente cuando el usuario hacía "+ Agregar Afiliado", violando el requerimiento de que personas deben crearse solo cuando se guarda el plan. El fix requirió:

1. **AfiladoSearchModal.jsx:** Aceptar parámetro `planMode` y NO crear personas en BD si `planMode === 'crear'`
2. **PlanV1Modal.jsx:** 
   - Pasar `planMode={mode}` a AfiladoSearchModal
   - Actualizar `handleAfiladoSearch` para manejar personas sin id (deferred)
   - Refactorizar `handleGuardar` modo crear para crear personas antes de crear integrantes
3. **Resultado:** Personas solo se crean cuando plan se guarda, cumpliendo completamente el requerimiento

Commit: `6f888ce` — fix(BUG-037): defer persona creation until plan save in create mode

**Implementación Anterior:**

Cambios mínimos en `PlanV1Modal.jsx`:

1. **Nuevo estado `savedPlanData`** (línea 40)
   - Almacena la respuesta del plan creado para que `reloadIntegrantes` pueda acceder a `plan_numero` cuando `planData === null`

2. **Actualizar form.integrantes después de reorder** (líneas 289-295, dentro del if crear)
   - Mapea `form.integrantes` con los IDs reales obtenidos de `createdIntegrantes`
   - Llama `handleFieldChange('integrantes', integrantesConId)` para actualizar el state
   - Esto automáticamente habilita el botón ⚙️ (porque `disabled={!integrante.id}` pasa de falsy a truthy)

3. **Guardar referencia del plan** (línea 298, dentro del if crear)
   - `setSavedPlanData(response)` después del bloque de integrantes
   - Permite que `reloadIntegrantes` funcione correctamente

4. **Usar fallback en `reloadIntegrantes`** (líneas 198-201)
   - Cambiar: `planData.plan_numero` 
   - Por: `const planNumero = planData?.plan_numero || savedPlanData?.plan_numero;`
   - Previene crash cuando `reloadIntegrantes` se llama en modo crear después de guardar

**Resultado:**
- En modo crear, antes de guardar: botones ⚙️ deshabilitados (integrantes sin id) ✅
- Después de "Guardar y Seguir Editando": botones ⚙️ habilitados automáticamente ✅
- Al abrir IntegranteServiciosModal y cerrar: `reloadIntegrantes` funciona sin crash ✅
- En modo editar: sin cambios (planData nunca es null) ✅

**Archivos modificados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
  - Línea 40: nuevo estado `savedPlanData`
  - Líneas 198-201: fallback en `reloadIntegrantes`
  - Líneas 289-298: actualizar form.integrantes y guardar referencia del plan

**Commits:**
- `ab26cd4` — feat(BACKLOG-060): habilitar servicios después de guardar plan nuevo

**Sin cambios en:**
- Botón ⚙️ (la lógica `disabled={!integrante.id}` ya era correcta)
- IntegranteServiciosModal (funciona igual)
- Backend, SCSS, modo editar

---

### BACKLOG-035: Optimizar Espacio de Trabajo - Sidebar Colapsable y Ocultable

**Descripción General:**

El dashboard actual utiliza espacio subóptimamente. El objetivo es maximizar el área de contenido mediante:
1. Reducción de márgenes/padding laterales
2. Menú sidebar con collapse automático (solo un item expandido a la vez)
3. Capacidad de ocultar el sidebar completamente con un toggle

**Análisis de Implementación:**

#### Parte 1: Reducir espacios muertos (márgenes/padding)

**Ubicación:** `DashboardPage.scss` y componentes de contenido

**Cambios necesarios:**
```scss
/* Actual aproximado */
.dashboard__content {
  padding: 2rem;  /* 32px a cada lado */
  max-width: 1400px;
}

/* Optimizado */
.dashboard__content {
  padding: 1.5rem 1rem;  /* 24px arriba/abajo, 16px izquierda/derecha */
  width: 100%;  /* Remover max-width para usar espacio disponible */
}

/* También revisar componentes internos */
.table-wrapper, .form-container, etc. {
  padding: reducir de 2rem a 1.5rem
}
```

**Impacto:** +10-15% espacio horizontal disponible

---

#### Parte 2: Menú sidebar con collapse automático

**Ubicación:** `DashboardPage.jsx` - función `Sidebar`

**Cambio de lógica:**
```javascript
// Actual: cada item tiene su estado independiente
const [expanded, setExpanded] = useState({ 'mi-cuenta': true });

// Optimizado: solo una sección expandida a la vez
const [expandedSection, setExpandedSection] = useState('mi-cuenta');

const toggleExpand = (key) => {
  // Si está expandido, cerrarlo; si está cerrado, abrirlo (cerrando otros)
  setExpandedSection(expandedSection === key ? null : key);
};

// En render:
{expanded[item.key] ? ... }  // Actual
{expandedSection === item.key ? ... }  // Nuevo
```

**Beneficio:** Mejor navegación, menos scrolling en sidebar

---

#### Parte 3: Ocultar/mostrar sidebar con toggle

**Ubicación:** `DashboardPage.jsx` + `DashboardPage.scss`

**Cambios en JSX:**
```javascript
// State existente
const [sidebarOpen, setSidebarOpen] = useState(false);  // Mobile

// Agregar new state
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);  // Desktop

// En topbar, agregar botón toggle
<button 
  className="dashboard__sidebar-toggle"
  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
  title={sidebarCollapsed ? "Mostrar menú" : "Ocultar menú"}
>
  {sidebarCollapsed ? '☰' : '✕'}  // Icons: menu / close
</button>

// En sidebar, aplicar clase condicional
<aside className={`dashboard__sidebar${sidebarCollapsed ? ' dashboard__sidebar--collapsed' : ''}`}>
```

**Cambios en SCSS:**
```scss
.dashboard__sidebar {
  width: 240px;  /* Actual */
  transition: transform 0.3s ease, width 0.3s ease;
  
  &--collapsed {
    transform: translateX(-100%);  /* Desliza a la izquierda */
    width: 0;
    position: absolute;  /* No ocupa espacio */
    z-index: 1000;  /* Sobre el contenido cuando reaparece */
  }
}

.dashboard__sidebar-toggle {
  position: fixed;
  left: 1rem;
  top: 1rem;
  z-index: 1001;
  background: $color-primary;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: opacity 0.3s ease;
  
  &:hover {
    opacity: 0.8;
  }
}
```

---

**Arquitectura propuesta:**

```
DashboardPage.jsx
├── State:
│   ├── sidebarOpen (mobile toggle) - mantener
│   ├── sidebarCollapsed (desktop hide) - NUEVO
│   └── expandedSection (auto-collapse) - CAMBIO
│
├── Sidebar (modify)
│   ├── Usar expandedSection en lugar de expanded obj
│   ├── Solo una sección expandida a la vez
│   └── Responder a toggles de collapse
│
├── Topbar (modify)
│   ├── Agregar botón sidebar-toggle
│   └── Mostrar icono apropiado (☰ o ✕)
│
└── CSS updates
    ├── Reducir padding en .dashboard__content
    ├── Agregar transform para sidebar collapse
    ├── Agregar botón toggle con posición fija
    └── Ajustar z-index y transitions
```

**Consideraciones técnicas:**

1. **Responsive:** 
   - Desktop (>1024px): mostrar toggle, permitir collapse
   - Tablet (768-1024px): toggle puede colapsar
   - Mobile (<768px): mantener lógica actual (sidebarOpen)

2. **Estado persistente (opcional):**
   ```javascript
   useEffect(() => {
     localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
   }, [sidebarCollapsed]);
   
   useEffect(() => {
     const stored = localStorage.getItem('sidebarCollapsed');
     if (stored) setSidebarCollapsed(JSON.parse(stored));
   }, []);
   ```

3. **Animaciones:**
   - Usar `transform: translateX()` en lugar de `display: none` (mejor performance)
   - Transition de 0.3s para fluidez

4. **Accesibilidad:**
   - Botón toggle debe ser keyboard-accesible (tab, enter)
   - ARIA labels: `aria-label="Mostrar/ocultar menú"`
   - Mantener focus visible

5. **Testing:**
   - Desktop: verificar que solo una sección está expandida
   - Desktop: verificar que toggle oculta/muestra sidebar
   - Mobile: verificar que no se rompe comportamiento actual
   - Snapshot test para cambios de layout

---

**Estimación:**

| Tarea | Tiempo | Dependencias |
|-------|--------|---|
| Reducir márgenes/padding | 30 min | Ninguna |
| Implementar auto-collapse sidebar | 45 min | Cambio state en DashboardPage |
| Implementar toggle collapse/show | 1 hora | Cambios anteriores |
| Testing y refinamiento | 1 hora | Todo lo anterior |
| **Total** | **~3 horas** | - |

**Archivos a modificar:**
- `frontend/src/pages/DashboardPage/DashboardPage.jsx` (60-80 líneas)
- `frontend/src/pages/DashboardPage/DashboardPage.scss` (40-60 líneas)
- Revisar `frontend/src/pages/DashboardPage/components/*` para reducir padding

**Estado:** 📋 Registrado
- Análisis completado: ✅
- Implementación pendiente
- Estimación: ~3 horas

---

### BACKLOG-036: Entidad Provincias y Zonas - CRUD jerárquico en menú

**Descripción:**
Crear estructura jerárquica de Provincias → Zonas para gestión territorial. Actualmente las zonas son números simples en el campo `zona` de los planes. Esta refactorización permite:
- Gestión centralizada de provincias y zonas
- Validación de integridad referencial
- Estructura jerárquica (cada provincia contiene múltiples zonas)
- Filtros por provincia/zona en otras pantallas
- Reportes y análisis segmentado por territorio
- CRUD unificado en una sola pantalla jerárquica

**Estructura de datos:**

```
Provincia (1) → (N) Zonas
  ├── Provincia: Buenos Aires
  │   ├── Zona: Centro
  │   ├── Zona: Norte
  │   └── Zona: Sur
  ├── Provincia: CABA
  │   ├── Zona: Zona 1
  │   └── Zona: Zona 2
  └── ...
```

**Requerimientos:**

1. **Modelo y Migración BD**
   - Nueva tabla: `provincias`
     * `id` (PK, INT)
     * `nombre` (STRING, NOT NULL, UNIQUE) - ej: "Buenos Aires", "CABA"
     * `codigo` (STRING, NOT NULL, UNIQUE) - ej: "BA", "CABA"
     * `activo` (BOOLEAN, default: true)
     * `created_at`, `updated_at` (TIMESTAMP)
   
   - Nueva tabla: `zonas`
     * `id` (PK, INT)
     * `provincia_id` (FK, INT, NOT NULL) - referencia a `provincias.id`
     * `codigo` (STRING, NOT NULL) - ej: "Z001", "ZONA_01" (único dentro de provincia)
     * `nombre` (STRING, NOT NULL) - ej: "Zona Centro", "Zona Norte"
     * `activo` (BOOLEAN, default: true)
     * `created_at`, `updated_at` (TIMESTAMP)
     * Índice UNIQUE(provincia_id, codigo)
   
   - Actualizar tabla: `plan_integrantes`
     * Agregar FK `zona_id` (INT, NOT NULL) que referencia `zonas.id`
     * Eliminar campo antiguo `zona` si existe
   
   - Migración: nueva versión secuencial (ej: v2.0.x)

2. **Relaciones Sequelize**
   - `Provincia.hasMany(Zona, { foreignKey: 'provincia_id' })`
   - `Zona.belongsTo(Provincia, { foreignKey: 'provincia_id' })`
   - `PlanIntegrante.belongsTo(Zona, { foreignKey: 'zona_id' })`
   - `Zona.hasMany(PlanIntegrante, { foreignKey: 'zona_id' })`

3. **Backend API**
   - Modelos Sequelize: `models/Provincia.js`, `models/Zona.js`
   - Controller: `provinciaController.js` y `zonaController.js` con CRUD
   - Routes:
     * `GET /api/provincias` - listar todas
     * `POST /api/provincias` - crear
     * `PUT /api/provincias/:id` - editar
     * `DELETE /api/provincias/:id` - eliminar
     * `GET /api/provincias/:id/zonas` - listar zonas de una provincia
     * `GET /api/zonas` - listar todas las zonas
     * `POST /api/zonas` - crear zona (requiere provincia_id)
     * `PUT /api/zonas/:id` - editar zona
     * `DELETE /api/zonas/:id` - eliminar zona
   - Validación:
     * Código única por provincia (en zonas)
     * No permitir eliminación de provincia si tiene zonas activas
     * No permitir eliminación de zona si tiene planes asociados
     * Mostrar advertencia de referencias antes de eliminar

4. **Frontend CRUD - Pantalla Jerárquica**
   - Nueva página: `GestionProvinciasZonas.jsx`
   - Estructura jerárquica (tree view o accordion):
     * Fila por provincia con: nombre, código, acciones (editar, agregar zona, eliminar)
     * Expandible para mostrar zonas pertenecientes
     * Por cada zona: código, nombre, acciones (editar, eliminar)
   - Modales:
     * `ProvinciaFormModal.jsx` - crear/editar provincia
     * `ZonaFormModal.jsx` - crear/editar zona (con selector de provincia)
   - Acciones:
     * Editar provincia (modal)
     * Agregar zona a provincia (modal + zona_id prepopulado con provincia_id)
     * Editar zona (modal)
     * Eliminar provincia (con confirmación, mostrar planes afectados si hay)

   - Cambio de estado se persiste en BD
4. **Filtros opcionales**
   - Filtro por tipo de plan (si se selecciona zona)
   - Filtro por estado del plan (Activo/Suspendido)
   - Búsqueda rápida dentro del listado

5. **Performance**
   - Lazy load de planes si hay muchos
   - Paginación interna si es necesario
   - Caché de listados generados (opcional)

**Archivos a crear/modificar:**
- `frontend/src/pages/DashboardPage/components/ListadosPage/` (nuevo)
- `frontend/src/pages/DashboardPage/components/ListadosPage/ListadosPage.jsx` (nuevo)
- `frontend/src/pages/DashboardPage/components/ListadosPage/ListadosPage.scss` (nuevo)
- `frontend/src/pages/DashboardPage/components/ListadoZonaDetalle.jsx` (nuevo - componente de tabla detallada)
- `frontend/src/services/listadosService.js` (nuevo)
- `frontend/src/pages/DashboardPage/DashboardPage.jsx` (agregar ruta/componente)
- Backend: `backend/src/controllers/listadosController.js` (nuevo - endpoint GET /api/listados/zona/:zonaId)

**Backend Endpoint**
- `GET /api/listados/zona/:zonaId` - retorna todos los planes + afiliados de una zona
- Response structure:
  ```json
  {
    "zona": { "id": 1, "codigo": "Z001", "nombre": "Zona Centro" },
    "planes": [
      {
        "id": 1,
        "numero": "P001",
        "tipo_plan": "Premium",
        "cuota_actual": 5000,
        "estado": "activo",
        "integrantes": [
          {
            "nombre": "Juan",
            "apellido": "Pérez",
            "fecha_nacimiento": "1985-03-15",
            "edad": 39,
            "numero_documento": "12345678",
            "estado": "Activo"
          }
        ]
      }
    ]
  }
  ```

**Dependencias:**
- BACKLOG-036 (Zonas) debe estar completado
- BACKLOG-037 (Listado de planes) seria recomendable
- Librerías opcionales: jsPDF/pdfkit (exportar PDF), xlsx (exportar Excel)

**Estimación:** ~5 horas
- Frontend: 2.5 horas
- Backend endpoint: 1.5 horas
- Exportación (opcional): 1 hora

**Prioridad:** 🔴 Alta — Requerimiento core de reportes

**Estado:** 📋 Registrado

---

### BACKLOG-043: Nueva entidad Zona independiente con CRUD

**Descripción:**
Crear una nueva entidad Zona como tabla independiente (sin jerarquía con Provincia/Localidad). Zona es una entidad autónoma utilizada para clasificar territorios de forma independiente. Se integra en el menú de Gestiones con CRUD completo usando el componente reutilizable LookupCRUD.

**Implementación Completada (2026-05-07):**

1. ✅ **Migración 2.0.20** (`backend/src/migrations/versions/2.0.20_zonas/`)
   - `upgrade.sql`: Crea tabla zonas con campos id (PK auto-increment), codigo (VARCHAR(2), UNIQUE), nombre (VARCHAR(255))
   - `downgrade.sql`: Revierte la migración eliminando la tabla

2. ✅ **Backend**
   - Modelo `Zona.js`: Entidad independiente con validaciones (código: exactamente 2 caracteres, único y requerido; nombre: requerido)
   - Integración en `models/index.js`: Importado y expuesto como entidad lookup
   - Controlador: Configurado en `lookupController.js` con ENTIDADES['zonas']
   - Ruta: Automática vía `/api/lookup/zonas` (GET, POST, PUT, DELETE)

3. ✅ **Frontend**
   - Componente `GestionZonas.jsx`: Reutiliza LookupCRUD con campos ocultos/visibles
   - Campo ID: Auto-incremental, oculto en UI, usado internamente como PK
   - Campos editables: Código (max 2 caracteres), Nombre
   - Dashboard: Link agregado en sección "Gestión" (entre Tipos de Plan y Provincias/Localidades)

4. ✅ **Mejoras a LookupCRUD**
   - Soporte para `hidden: true` en campos: oculta del UI pero mantiene como PK internamente
   - Búsqueda y botón "Nuevo" siempre visibles (incluso sin registros)
   - Validación relajada: pkField es opcional en create (auto-calculado si no se provee)

5. ✅ **Commits realizados:**
   - `feat(backend): crear migración 2.0.20 y modelo Zona independiente`
   - `feat(frontend): agregar componente Zonas y link en Dashboard dentro de Gestión`
   - `refactor(zonas): alinear interfaz con patrón de ObrasSociales y TiposDePlan`
   - `fix(LookupCRUD): mostrar búsqueda y botón 'Nuevo' incluso sin registros`
   - `feat(zonas): ID automático no accesible desde UI - agregar soporte hidden en LookupCRUD`
   - `fix(lookup): no requerir pkField en validación de create - permitir auto-incremental`

**Archivos modificados:**
- Backend: migrations/2.0.20, models/Zona.js, models/index.js, controllers/lookupController.js
- Frontend: components/Zonas/Zonas.jsx, components/LookupCRUD/LookupCRUD.jsx, pages/DashboardPage/DashboardPage.jsx

**Estado:** ✅ Solucionado (2026-05-07)

---

### BACKLOG-048: Integrantes Ordenables con Drag & Drop — Rol por Posición

**Descripción:**
Permitir que los usuarios reordenen los integrantes (afiliados) de un plan mediante drag & drop en PlanV1Modal. El rol de cada integrante (titular vs integrante adherente) se determina automáticamente por su posición en la lista: los primeros N integrantes son titulares, el resto son integrantes. El campo `orden` en tabla `plan_integrantes` refleja el reorden realizado por el usuario.

**Requerimientos Funcionales:**

1. **Interfaz de Drag & Drop**
   - En PlanV1Modal, tab "Integrantes": lista de integrantes es reordenable mediante drag & drop
   - Visual feedback durante drag: fila se destaca/opacifica, línea de drop visible
   - Soporte tanto desktop (mouse) como mobile (touch)
   - Reorder se aplica solo cuando usuario suelta (drop), no en tiempo real

2. **Determinación de Rol por Posición**
   - **Titular**: El primer integrante en la lista (orden = 1 o simplemente el primero)
   - **Integrante**: Todos los demás en la lista (orden >= 2)
   - Cuando usuario reordena:
     * Integrante que estaba primero pierde rol "titular", pasa a "integrante"
     * Nuevo primer integrante recibe rol "titular"
   - El rol se actualiza automáticamente sin acción explícita del usuario
   - Display en UI: mostrar rol del integrante (o inferirlo por posición)

3. **Persistencia del Orden**
   - Campo `orden` en tabla `plan_integrantes` almacena la posición (1, 2, 3, ...)
   - Al actualizar plan:
     * Recolectar nuevo orden desde UI (array de integrantes reordenados)
     * Actualizar `orden` y `rol` para cada integrante en BD
     * Mantener `persona_id` y otros campos sin cambios

4. **Validaciones**
   - Debe haber al menos un titular (primer integrante no puede estar vacío)
   - No permitir reorden que deje el plan sin titular
   - Al crear plan: primer integrante agregado = titular automáticamente

**Requerimientos Backend:**

1. **Modelo PlanIntegrante.js**
   - Verificar que exista campo `orden` (INT, nullable actualmente)
   - Verificar que exista campo `rol` (ENUM o similar para "titular"/"integrante")
   - Si faltan campos: agregarlos vía migración 2.0.24

2. **Controller planesIntegrantesController.js**
   - En `actualizar()` (cuando se actualiza un plan):
     * Recibir array de integrantes reordenados: `[{ persona_id, rol }, ...]`
     * Para cada integrante: calcular nuevo `orden` (1-based index)
     * Si `rol` no viene en payload: inferir de posición (1 = titular, resto = integrante)
     * Actualizar BD: DELETE registros viejos, INSERT nuevos en orden correcto
     * O: UPDATE donde sea posible, DELETE lo faltante, INSERT lo nuevo

3. **Service planesIntegrantesService.js**
   - Función `actualizarIntegrantes(planNumero, integrantes)`:
     * Valida que haya al menos 1 integrante
     * Valida que primer integrante tenga rol "titular"
     * Actualiza BD en transacción (para evitar inconsistencias)
     * Retorna plan actualizado con integrantes en nuevo orden

**Requerimientos Frontend:**

1. **PlanV1Modal.jsx — Tab Integrantes**
   - Lista de integrantes con capacidad de drag & drop
   - Cada fila tiene ícono "⋮⋮" (drag handle) a la izquierda
   - Fila muestra: [Drag Handle] | Rol Badge | Nombre | Teléfono | [Eliminar]
   - Rol Badge: "Titular" (color especial) o vacío/nada para integrantes

2. **usePlanV1Form.js**
   - Manejar array de integrantes con capacidad de reorden
   - Hook `useIntegranteDragDrop()` para lógica de drag & drop
   - Al cambiar orden: actualizar automáticamente rol (primero = titular)
   - Mantener estado sincronizado: `form.integrantes = [{ id, persona_id, persona, rol, orden }, ...]`

3. **Componente Reutilizable (opcional)**
   - Si hay múltiples listas reordenables: crear `DraggableList.jsx`
   - Props: items, onReorder, renderItem
   - Maneja lógica de drag & drop (mouse + touch)

**Migración de Datos (2.0.24 - CRÍTICA):**

1. **Auditoría Pre-Migración**
   - Verificar estado actual de `plan_integrantes`:
     * ¿Cuántos registros tienen `rol` = NULL?
     * ¿Cuántos tienen `orden` = NULL?
     * ¿Hay planes con múltiples titulares?

2. **Upgrade SQL**
   ```sql
   -- Migración 2.0.24: Inducir rol a partir de orden y validar integrantes
   
   -- 1. Asegurar que plan_integrantes tiene campos orden y rol
   ALTER TABLE plan_integrantes
   ADD COLUMN IF NOT EXISTS orden INT DEFAULT NULL,
   ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT NULL;
   
   -- 2. Para cada plan, ordenar integrantes por ID (proxy de orden natural)
   -- y asignar orden secuencial (1, 2, 3, ...)
   SET @plan_numero = 0;
   SET @orden = 0;
   
   UPDATE plan_integrantes pi
   JOIN (
     SELECT id, plan_numero,
            ROW_NUMBER() OVER (PARTITION BY plan_numero ORDER BY id) as new_orden
     FROM plan_integrantes
   ) ranked ON pi.id = ranked.id
   SET pi.orden = ranked.new_orden;
   
   -- 3. Asignar rol basado en orden: orden = 1 → "titular", orden > 1 → "integrante"
   UPDATE plan_integrantes
   SET rol = CASE WHEN orden = 1 THEN 'titular' ELSE 'integrante' END
   WHERE rol IS NULL;
   
   -- 4. Verificación: asegurarse que no hay planes sin titular
   SELECT plan_numero, COUNT(*) as titulares
   FROM plan_integrantes
   WHERE rol = 'titular'
   GROUP BY plan_numero
   HAVING titulares != 1;
   -- Este query debe retornar 0 filas (cada plan tiene exactamente 1 titular)
   ```

3. **Downgrade SQL**
   ```sql
   -- No eliminar columnas para backward compatibility
   -- Solo limpiar datos de rol en casos necesarios
   UPDATE plan_integrantes SET rol = NULL WHERE 1=0;
   -- (No-op: no hacemos cambios reales)
   ```

**Testing (Plan):**

Fase 1: Migración de Datos
- ✅ Ejecutar upgrade.sql en BD con datos existentes
- ✅ Verificar que todos los `plan_integrantes` tienen `orden` y `rol` asignados
- ✅ Verificar query de validación retorna 0 filas (cada plan tiene 1 titular)
- ✅ Ejecutar downgrade (no-op, sin errores)

Fase 2: Funcionalidad Drag & Drop
- ✅ Abrir PlanV1Modal en modo edición de plan con integrantes
- ✅ Drag integrante 1 → integrante 2: reorder visual, rol cambia automáticamente
- ✅ Integrante que era titular pasa a "integrante", nuevo primero pasa a "titular"
- ✅ Guardar plan: BD actualiza `orden` y `rol` correctamente
- ✅ Recargar: integrantes aparecen en nuevo orden con roles correctos
- ✅ No permitir eliminar todos los integrantes (validación)
- ✅ No permitir reorder que deje sin titular (si fuera posible)

Fase 3: Mobile (Touch)
- ✅ En dispositivo/navegador mobile: drag con touch funciona correctamente
- ✅ Integrantes reordenan y persisten correctamente

**Archivos Estimados para Modificar:**
- `backend/src/migrations/versions/2.0.24_integrantes_orden_rol/upgrade.sql` (nuevo)
- `backend/src/migrations/versions/2.0.24_integrantes_orden_rol/downgrade.sql` (nuevo)
- `backend/src/models/PlanIntegrante.js` (actualizar campos si faltan)
- `backend/src/controllers/v1.0/planesController.js` (actualizar método para procesar integrantes reordenados)
- `backend/src/services/v1.0/planesIntegrantesService.js` (nueva función actualizarIntegrantes)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (tab integrantes con drag & drop)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js` (manejo de reorden)
- `frontend/src/components/DraggableList/DraggableList.jsx` (opcional, si reutilizable)

**Impacto:**
- Archivos modificados: 6-7
- BD: Requiere migración 2.0.24 para validar y asignar rol/orden
- Breaking change: No (rol es inducido automáticamente)
- Backward compatibility: ✅ Planes existentes se adaptan vía migración
- UX: Mejora significativa en gestión de roles y orden de integrantes

**Notas Importantes:**
- El rol DEBE determinarse SIEMPRE por posición (no guardar explícitamente en algunos casos)
- El campo `orden` es crítico para persistencia
- Considerar usar librería de drag & drop (react-beautiful-dnd, react-dnd) o implementación simple con mouse/touch events
- Validar que plan tenga al menos 1 integrante y que el primero sea titular

**Status de Implementación (2026-05-07):**

✅ **Completado** — 5 commits ejecutados y pusheados a rama V_1.0.7:

1. `feat(migrations): migración 2.0.24 - validar y asignar rol/orden a integrantes` (commit 52d86e8)
   - upgrade.sql: ALTER TABLE para agregar campos, UPDATE con LPAD, asignar rol por orden
   - downgrade.sql: no-op (sin cambios, backward compatible)

2. `feat(components): crear DraggableList - componente reutilizable para reordenar items` (commit 48004df)
   - DraggableList.jsx: Componente vanilla drag & drop (mouse + touch)
   - DraggableList.scss: Estilos para feedback visual (dragging, drag-over)

3. `refactor(controller): procesar integrantes reordenados en actualizar plan` (commit 7e5ca92)
   - Lógica en actualizar() para procesar array de integrantes reordenados
   - Valida al menos 1 integrante, elimina viejos, inserta nuevos en orden correcto

4. `refactor(form): agregar método reorderIntegrantes con rol automático por posición` (commit 6dd4ec3)
   - Nuevo hook useCallback: reorderIntegrantes()
   - Actualiza rol automáticamente: primero=titular, resto=integrante

5. `refactor(modal): actualizar rol a 'integrante' y recalcular roles al eliminar afiliado` (commit d191d03)
   - Cambio: 'adherente' → 'integrante' en handleDragEnd para consistencia con ENUM
   - Mejora: handleIntegranteRemove recalcula roles al eliminar un integrante

**Archivos Modificados:**
- Backend: migrations/2.0.24, controllers/v1.0/planesController.js
- Frontend: components/DraggableList (nuevo), hooks/usePlanV1Form.js, modals/PlanV1Modal.jsx

**Funcionalidad:**
- ✅ Drag & drop de integrantes en tab "Afiliados" de PlanV1Modal
- ✅ Rol automático por posición (titular = primero, integrante = resto)
- ✅ Campo `orden` refleja la posición en BD (1, 2, 3, ...)
- ✅ Recalcular roles al eliminar integrante (nuevo titular = primero)
- ✅ Persistencia: guardar plan actualiza integrantes en BD con nuevo orden/rol
- ✅ Migración 2.0.24 asigna orden/rol a integrantes existentes

---

### BACKLOG-051: Reformatear Tabla de Listado de Planes

**Descripción:**
Optimizar la tabla principal de listado de planes en GestionPlanesV1.jsx para mejorar identificación y datos relevantes de planes. Los cambios incluyen crear una columna virtual combinada, eliminar redundancia, y agregar información del titular.

**Contexto / Motivo:**
- El listado actual muestra numero_afiliado separado de zona — difícil de identificar qué plan es cuál
- Columna numero_afiliado se vuelve redundante al crear identificador compuesto
- Falta información del titular del plan, que es importante para gestión
- Mejor densidad de información: identificador único + datos del responsable del plan

**Requerimientos Funcionales:**

1. **Nueva Columna Virtual "Identificador":**
   - Formato: `codigo_zona + "-" + numero_afiliado`
   - Ejemplos:
     * Zona 01, Afiliado 00042 → "01-00042"
     * Zona 05, Afiliado 00100 → "05-00100"
     * Zona 12, Afiliado 01250 → "12-01250"
   - Utilizar `plan.zona?.codigo` (ya disponible en relación Zona) y `plan.numero_afiliado`
   - Mostrar como identificador único del plan

2. **Eliminar Columna Redundante:**
   - ❌ Eliminar columna `numero_afiliado` individual (queda incluida en Identificador)

3. **Nueva Columna "Titular":**
   - Mostrar apellido y nombre del titular del plan
   - Formato: "APELLIDO, Nombre"
   - Obtener del primer integrante donde `rol === 'titular'`
   - Si no hay titular: mostrar "-"
   - Ubicación: después de Identificador u otro lugar estratégico

**Estructura Final de Columnas (sugerida):**

| Anterior | Nueva |
|----------|-------|
| Número Afiliado | ✅ Identificador (zona-afiliado) |
| Tipo de Plan | Tipo de Plan |
| (nuevo) | ✅ Titular (apellido, nombre) |
| Cobrador | Cobrador |
| Obra Social | Obra Social |
| Estado | Estado |
| Acciones | Acciones |

**Archivos Impactados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` — tabla de listado
- Posiblemente: `frontend/src/services/planesV1Service.js` si necesita modificar qué datos se cargan

**Verificación:**
- ✅ Columna Identificador muestra formato correcto (zona-afiliado)
- ✅ Columna numero_afiliado eliminada del listado
- ✅ Columna Titular muestra nombre del titular (o "-" si no hay)
- ✅ Datos de zona y PlanIntegrantes disponibles (ya están en la relación)
- ✅ Tabla mantiene funcionalidad de acciones (editar, eliminar, etc.)

---

### BACKLOG-050: Reformatear Tabla de Afiliados en Tab de PlanV1Modal

**Descripción:**
Rediseñar la tabla de afiliados/integrantes en el tab correspondiente del formulario de edición de planes para mejorar legibilidad e información relevante. Los cambios incluyen reorganizar columnas, eliminar redundancias, agregar cálculos (edad), y mostrar servicios adicionales.

**Contexto / Motivo:**
- La tabla actual tiene columnas redundantes (apellido, nombre separados + orden)
- Falta información importante como fechas de nacimiento, cobertura y servicios adicionales
- Mejor densidad de información: mostrar más datos útiles en menos espacio
- Mejora UX: presentación más profesional y datos más organizados

**Requerimientos Funcionales:**

1. **Eliminar Columnas:**
   - ❌ Columna `orden` (información técnica no relevante para el usuario)
   - ❌ Columnas individuales `apellido` y `nombre`

2. **Agregar Columna Combinada:**
   - ✅ Nueva columna `Afiliado` (o `Persona`): muestra "apellido, nombre" en formato `APELLIDO, Nombre`
   - Ubicación: donde estaba anteriormente el apellido

3. **Agregar Fechas e Información Personal (después de columna Rol):**
   - ✅ `Nacimiento`: fecha de nacimiento en formato `DD/MM/YYYY`
   - ✅ `Edad`: cálculo automático en años (fecha actual - fecha nacimiento)
   - ✅ `Cobertura`: fecha de cobertura en formato `DD/MM/YYYY`

4. **Agregar Servicios Adicionales (después de Cobertura):**
   - ✅ Nueva columna `Servicios` (o `Serv. Adic.`)
   - Muestra listado de servicios adicionales de la persona
   - Formato: primeras 2 letras de cada servicio, separadas por coma
   - Ejemplo: "Ser. Adic." registrados [Servicio A, Servicio B, Servicio C] → "Se, Se, Se"
   - Si no tiene servicios: mostrar "-" o texto vacío

**Estructura Final de Columnas:**

| Anterior | Nueva |
|----------|-------|
| Orden | ❌ Eliminada |
| Rol | Rol ← SIN CAMBIOS |
| Apellido | ❌ Eliminada |
| Nombre | ❌ Eliminada |
| (nuevo) | ✅ Afiliado (apellido, nombre) |
| (nuevo) | ✅ Nacimiento (DD/MM/YYYY) |
| (nuevo) | ✅ Edad (años) |
| (nuevo) | ✅ Cobertura (DD/MM/YYYY) |
| (nuevo) | ✅ Servicios (2 letras c/u, sep. coma) |

**Requerimientos de Cálculo:**

1. **Edad:**
   - Fórmula: `Math.floor((new Date() - new Date(fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000))`
   - O: `new Date().getFullYear() - new Date(fecha_nacimiento).getFullYear()` (aproximado)
   - Considerar casos edge (cumpleaños en diferentes meses)
   - Mostrar en años (ej: "45 años" o solo "45")

2. **Servicios:**
   - Obtener lista de servicios de `integrante.Persona.IntegranteServicios` (o relación similar)
   - Extraer las 2 primeras letras de `servicio.nombre`
   - Concatenar con ", " (coma + espacio)
   - Ejemplo: ["Obra Social Extra", "Medicina Privada", "Farmacia"] → "Ob, Me, Fa"

**Archivos Impactados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` — tabla en tab Afiliados
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js` — posible lógica de cálculo
- `frontend/src/utils/formatters.js` — agregar función `calculateAge()` si no existe

**Testing:**
- ✅ Tabla muestra columna `Afiliado` con nombre combinado
- ✅ Orden eliminado de vista
- ✅ Fechas formato DD/MM/YYYY (usar formatters.js existente)
- ✅ Edad calcula correctamente (casos normales y edge)
- ✅ Servicios muestran 2 letras c/u, separadas por coma
- ✅ Diseño responsive: tabla no overflow en pantalla chica
- ✅ Acciones (editar, eliminar, reordenar) siguen funcionando

---

### BACKLOG-049: Números de Documento Duplicados Permitidos

**Descripción:**
Permitir que múltiples personas en el sistema tengan el mismo número de documento. Actualmente la tabla `personas` tiene una constraint `UNIQUE` en el campo `numero_documento`, lo que impide registrar documentos duplicados.

**Contexto / Motivo:**
- Casos de uso legítimos requieren números de documento duplicados:
  * Múltiples personas con el mismo DNI en diferentes contextos o épocas
  * Datos incompletos compartiendo un valor por defecto (ej: "0" o "0000000")
  * Migraciones de datos donde los duplicados ya existen en fuentes externas
- La validación de unicidad puede aplicarse a nivel de lógica de negocio si es necesario, pero a nivel de BD debe ser permisiva

**Requerimientos:**

1. **Cambio de Schema**
   - Remover constraint `UNIQUE` del campo `numero_documento` en tabla `personas`
   - Campo permanece como `VARCHAR(20)` pero sin restricción de unicidad

2. **Migración 2.0.25**
   - `upgrade.sql`: eliminar constraint UNIQUE con `ALTER TABLE personas DROP INDEX numero_documento_unique;`
   - `downgrade.sql`: recrear constraint UNIQUE con `ALTER TABLE personas ADD UNIQUE (numero_documento);`

3. **Validación Post-Migración**
   - Verificar que la constraint fue eliminada correctamente
   - Confirmar que se pueden insertar registros con numero_documento duplicados

**Archivos Impactados:**
- `backend/src/migrations/versions/2.0.25_numero_documento_duplicados/upgrade.sql` (nuevo)
- `backend/src/migrations/versions/2.0.25_numero_documento_duplicados/downgrade.sql` (nuevo)
- `backend/src/models/Persona.js` (remover unique: true si está presente)

**Testing:**
- ✅ Ejecutar upgrade.sql
- ✅ Intentar insertar dos personas con el mismo numero_documento (debe permitir)
- ✅ Ejecutar downgrade.sql (debe recrear la constraint)
- ✅ Intentar insertar duplicados (debe fallar con constraint error)
- ✅ Ejecutar upgrade nuevamente (idempotencia)

---

### BACKLOG-054: Aumento de Cuotas Masivo - Solo Porcentajes y Redondeo Configurable

**Descripción:**
Mejorar la funcionalidad de aumento masivo de cuotas (BulkUpdateCuotaModal) para:
1. Eliminar la opción de aumento fijo (solo permitir porcentaje)
2. Implementar redondeo siempre hacia arriba (Math.ceil) en el cálculo final
3. Permitir que la precisión del redondeo sea configurable desde la sección de configuración de UI

**Requerimientos Funcionales:**

1. **Eliminar Aumento Fijo**
   - UI actual presenta opciones: "Aumento Fijo" / "Aumento Porcentual"
   - Se debe **eliminar completamente** la opción de aumento fijo
   - Solo permitir aumento porcentual (ej: +5%, +10%, +15%)
   - Simplificar UI: un campo numérico para ingresar el porcentaje

2. **Redondeo Hacia Arriba**
   - Cálculo actual: `valor_nuevo = valor_actual * (1 + porcentaje/100)`
   - Nuevo cálculo: `valor_nuevo = Math.ceil(valor_actual * (1 + porcentaje/100) / precision) * precision`
   - Ejemplos con precision=1 (peso completo):
     * valor_actual=100, aumento=5% → 100 * 1.05 = 105.00 → redondea a 105 ✓
     * valor_actual=100.50, aumento=5% → 105.525 → redondea a 106 (hacia arriba)
     * valor_actual=200, aumento=10% → 220.00 → redondea a 220 ✓
   - Ejemplos con precision=10:
     * valor_actual=105, aumento=5% → 110.25 → redondea a 120 (hacia arriba)
     * valor_actual=150, aumento=5% → 157.50 → redondea a 160 (hacia arriba)

3. **Precisión Configurable**
   - Nueva sección en ConfiguracionApp o ConfiguracionUI (o donde corresponda)
   - Campo: "Precisión de Redondeo en Aumento de Cuotas" 
   - Valores permitidos: Centavos (0.01) o valores enteros (1, 10, 100, 500, etc.)
   - Ejemplos de precisiones:
     * 0.01 = centavo (redondea al centavo más cercano)
     * 1 = peso/dólar completo
     * 10 = diez pesos/dólares
     * 100 = cien pesos/dólares
     * 500 = quinientos pesos/dólares
   - Default: 1 (peso/dólar completo)
   - Se almacena en tabla de configuración

**Requerimientos Backend:**

1. **Controller planesController.js**
   - En `bulkUpdateCuota()`:
     * Recibir parámetro `tipoAumento` (eliminar, solo aceptar "porcentaje")
     * Recibir parámetro `precision` desde configuración
     * Cálculo: `newValue = Math.ceil(oldValue * (1 + porcentaje/100) / precision) * precision`
     * Validar que porcentaje sea positivo
   - Retornar valores antes/después con precisión aplicada

2. **Modelo Configuracion**
   - Si no existe tabla de configuración, crear migración
   - Campo: `redondeo_precision` (DECIMAL(10,2), default=1)
   - Almacena valores: 0.01 (centavos), 1, 10, 100, 500, etc.

**Requerimientos Frontend:**

1. **BulkUpdateCuotaModal.jsx**
   - UI actual muestra radio buttons: "Fijo" / "Porcentual"
   - Eliminar radio buttons
   - Mostrar solo: "Porcentaje de aumento (%)" con campo numérico
   - Helper text: "Ingrese el porcentaje a aplicar (ej: 5 para +5%)"
   - En preview, mostrar valores redondeados según configuración

2. **ConfiguracionApp.jsx** o **ConfiguracionUI.jsx**
   - Nueva sección: "Redondeo de Cuotas"
   - Campo: "Precisión de Redondeo" con opciones predefinidas:
     * 0.01 (centavo)
     * 1 (peso/dólar completo)
     * 10 (diez pesos/dólares)
     * 100 (cien pesos/dólares)
     * 500 (quinientos pesos/dólares)
     * Permitir input custom (otro valor numérico)
   - Default seleccionado: 1
   - Guardar en tabla de configuración
   - Cargar en BulkUpdateCuotaModal al abrir

3. **planesService.js**
   - Función `bulkUpdateCuota()` debe cargar precision desde config
   - Pasar al backend para cálculo consistente

**Archivos Estimados:**
- `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx` (eliminar opciones fijas, simplificar UI)
- `frontend/src/pages/DashboardPage/components/ConfiguracionApp.jsx` o similar (nueva sección configuración)
- `backend/src/controllers/v1.0/planesController.js` (cambiar cálculo, aplicar ceil)
- `backend/src/migrations/versions/` (nueva migración para tabla configuración, si no existe)
- `frontend/src/services/planesService.js` (cargar precision)

**Implementación de Redondeo:**

```javascript
// Helper function
const roundUpToPrecision = (value, precision = 1) => {
  return Math.ceil(value / precision) * precision;
};

// Ejemplos con precision 1 (peso completo)
roundUpToPrecision(105.50, 1) // → 106
roundUpToPrecision(105.01, 1) // → 106

// Ejemplos con precision 10
roundUpToPrecision(105.50, 10) // → 110
roundUpToPrecision(108.50, 10) // → 110

// Ejemplos con precision 100
roundUpToPrecision(150, 100) // → 200
roundUpToPrecision(101, 100) // → 200

// Ejemplos con precision 0.01 (centavo)
roundUpToPrecision(105.523, 0.01) // → 105.53
roundUpToPrecision(105.509, 0.01) // → 105.51
```

**Testing:**
- ✅ Verificar que radio "Aumento Fijo" está eliminado
- ✅ Ingresar porcentaje (ej: 5%) y ver preview redondeado
- ✅ Cambiar configuración de precisión (1 → 10 → 100)
- ✅ Verificar que preview se actualiza con nueva precisión
- ✅ Guardar aumento y verificar en BD con redondeo aplicado
- ✅ Probar diferentes precisions: 0.01, 1, 10, 100, 500
- ✅ Verificar redondeo hacia arriba (no hacia abajo) en todos los casos

**Estado:** 📋 Registrado (2026-05-07)

---

### BACKLOG-053: Posicionamiento Automático de Nuevo Plan en Grilla Ordenada

**Descripción:**
Al crear un nuevo plan, este debe insertarse en la posición correcta de la tabla GestionPlanesV1 según el orden natural de **zona + número de afiliado**, en lugar de aparecer siempre al final o inicio de la lista.

**Requerimientos Funcionales:**

1. **Ordenamiento de Datos**
   - Los planes deben estar ordenados por: `zona_id ASC, numero_afiliado ASC`
   - Cuando se crea un nuevo plan, se recalcula el orden y se inserta en la posición correspondiente

2. **Comportamiento al Crear Plan**
   - Usuario crea nuevo plan (ej: zona=2, numero_afiliado=00042)
   - Modal se cierra
   - Tabla se actualiza
   - El nuevo plan aparece en la posición correcta según su zona y número

3. **Mantener Paginación**
   - Si tabla está paginada, el nuevo plan puede aparecer en otra página
   - No necesariamente debe permanecer en la página actual

**Requerimientos Backend:**

1. **Controller planesController.js (v1.0)**
   - En `crear()`: cuando se crea exitosamente un plan, debe retornar el plan creado con todos sus datos (incluyendo zona_id e identificador virtual)

2. **Service planesService.js**
   - Ya maneja la lista, debe garantizar que `listByBusqueda()` ordenar por `zona_id, numero_afiliado`
   - Verificar que el ORDER BY esté configurado en Sequelize

**Requerimientos Frontend:**

1. **GestionPlanesV1.jsx**
   - Cuando `handleGuardar()` completa con éxito:
     * Si modo = 'crear': buscar el nuevo plan en la lista ordenada
     * Insertarlo en la posición correcta basado en zona + numero_afiliado
     * O simplemente recargar la lista completa (más simple, acepta pequeño delay)
   - Alternativa: después de crear, hacer un nuevo `busqueda()` para refrescar la tabla ordenada

2. **usePlanV1Form.js**
   - En `handleGuardar()`: después de crear exitosamente, retornar el nuevo plan para que GestionPlanesV1 lo pueda posicionar

**Archivos Estimados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` (lógica de inserción o recarga)
- `backend/src/controllers/v1.0/planesController.js` (garantizar retorno de datos completos)
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` (retornar nuevoPlan)

**Implementación Recomendada:**

Opción 1 (Simple - Recargar):
```javascript
// En GestionPlanesV1.jsx, después de handleGuardarPlan exitoso
onSave: async (newPlan) => {
  setEditingPlan(null);
  await busqueda(); // Recarga tabla con nuevo plan en posición correcta
}
```

Opción 2 (Optimizada - Insertar):
```javascript
// En GestionPlanesV1.jsx
onSave: async (newPlan) => {
  if (newPlan) {
    const nuevaLista = [...planes, newPlan].sort((a, b) => {
      if (a.zona_id !== b.zona_id) return a.zona_id - b.zona_id;
      return a.numero_afiliado.localeCompare(b.numero_afiliado);
    });
    setPlanes(nuevaLista);
  }
  setEditingPlan(null);
}
```

**Testing:**
- ✅ Crear plan zona=1, numero=00005
- ✅ Crear plan zona=1, numero=00001 (debe aparecer antes que 00005)
- ✅ Crear plan zona=2, numero=00003 (debe aparecer en zona 2)
- ✅ Verificar paginación si hay más de 10 planes
- ✅ Verificar orden en tabla después de cada creación

**Estado:** 📋 Registrado (2026-05-07)

---

### BACKLOG-055: Historial de Aumentos de Cuota - Listado Centralizado con Pop-up

**Descripción:**
Crear tabla `aumentos_masivos` para registrar cada operación de aumento masivo realizada (fecha, porcentaje ingresado, usuario). El historial debe ser consultable a través de un pop-up desde la gestión de planes, accesible mediante un botón "Ver historial de aumentos" ubicado al lado del botón de aumento masivo.

**Estructura de Datos:**

1. **Nueva Tabla: `aumentos_masivos`**
   - `id` (INTEGER PRIMARY KEY)
   - `fecha` (DATETIME) — momento en que se ejecutó el aumento
   - `porcentaje` (DECIMAL(10,2)) — porcentaje que ingresó el usuario
   - `usuario_id` (INTEGER FK) — usuario que ejecutó el aumento
   - Índices: `idx_aumentos_fecha`, `idx_aumentos_usuario`
   - Asociación con Usuario

2. **Pop-up Modal**
   - ✅ Botón "Ver historial de aumentos" en GestionPlanesV1.jsx junto a botón "Aumento Masivo"
   - ✅ Al hacer click, abre HistorialAumentosModal.jsx
   - ✅ Modal muestra registros de la tabla `aumentos_masivos`

3. **Listado**
   - ✅ Tabla con historial de todos los aumentos masivos ejecutados
   - ✅ Ordenado en forma **descendente por fecha** (más recientes primero)
   - ✅ Paginación (10 registros por página)
   - ✅ Sin búsqueda (historial completo y breve)

4. **Columnas en Tabla**
   - Fecha (fecha formateada: DD/MM/YYYY HH:mm:ss)
   - Porcentaje (%) (porcentaje que se aplicó)
   - Usuario (apellido, nombre del usuario que ejecutó el aumento)

**Implementación Backend:**

1. **Migración 2.0.26**
   - ✅ Crear tabla `aumentos_masivos` con FK a usuarios
   - ✅ Índices en fecha y usuario_id
   - Archivo: `migrations/versions/2.0.26_aumentos_masivos/`

2. **Modelo AumentoMasivo**
   - ✅ Archivo: `models/AumentoMasivo.js`
   - ✅ Asociación `belongsTo(Usuario)` en `models/index.js`

3. **Modificación bulkUpdateCuota()**
   - ✅ Al terminar actualización, insertar registro en `aumentos_masivos`
   - ✅ Campos: fecha=timestamp, porcentaje=valor, usuario_id=req.user.id

4. **Endpoint GET /api/planes/historial-cuota**
   - ✅ Cambiar para traer de `aumentos_masivos` en lugar de `historial_cuota`
   - ✅ Include: Usuario (id, apellido, nombre)
   - ✅ Order by: fecha DESC

**Implementación Frontend:**

1. **GestionPlanesV1.jsx**
   - ✅ Agregar botón "Ver historial de aumentos"
   - ✅ Import y montar HistorialAumentosModal

2. **HistorialAumentosModal.jsx**
   - ✅ Tabla con 3 columnas: Fecha | Porcentaje | Usuario
   - ✅ Carga datos desde planesService.getHistorialCuota()
   - ✅ Paginación (10 por página)
   - ✅ Columnas redimensionables con useColumnResize

**Archivos Modificados/Creados:**
- ✅ `backend/src/migrations/versions/2.0.26_aumentos_masivos/` (upgrade.sql, downgrade.sql)
- ✅ `backend/src/models/AumentoMasivo.js` (nuevo modelo)
- ✅ `backend/src/models/index.js` (agregar import y asociación)
- ✅ `backend/src/controllers/planesController.js` (modificar bulkUpdateCuota y getHistorialCuota)
- ✅ `frontend/src/pages/DashboardPage/components/HistorialAumentosModal/HistorialAumentosModal.jsx` (actualizar para nuevos datos)
- ✅ `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` (ya estaba integrado)

**Testing:**
- ✅ Ejecutar aumento masivo, verificar que se inserta en tabla `aumentos_masivos`
- ✅ Abrir modal "Ver historial de aumentos"
- ✅ Verificar que aparecen los registros ordenados descendente por fecha
- ✅ Verificar que columnas muestran: Fecha | Porcentaje | Usuario (correcto)
- ✅ Probar paginación con >10 registros
- ✅ Verificar formateo de fechas (DD/MM/YYYY HH:mm:ss)

**Estado:** ✅ Solucionado (2026-05-07)

**Commits:**
- `adb523f` — feat(migrations): 2.0.26 crear tabla aumentos_masivos para registrar aumentos masivos
- `13d95cf` — feat(models): agregar modelo AumentoMasivo y asociación con Usuario
- `ec8ba58` — feat(planes): registrar aumentos masivos en tabla aumentos_masivos y cambiar endpoint historial
- `52e4fc9` — feat(historial-aumentos): actualizar modal para mostrar registros de aumentos masivos
- `4b6f20d` — docs(backlog): actualizar BACKLOG-055 con implementación correcta de tabla aumentos_masivos

---

### BACKLOG-056: Paginación Backend + Ordenamiento + Items por Página (Patrón Estándar)

**Descripción:**
Implementar un patrón estándar reutilizable para integrar paginación en el backend de TODOS los endpoints de listado. La paginación debe coordinarse con:
1. **Ordenamiento dinámico** (sortBy/order desde `useSortable` hook)
2. **Limit configurable** (items_per_page desde `ConfigContext`)
3. **Número de página** (estado local en frontend, NO en URL)

Actualmente, algunos endpoints cargan TODOS los datos del backend y pagínan en el cliente. Esto es ineficiente para tablas grandes y no escala bien. La solución mueve la paginación al backend usando `findAndCountAll()` de Sequelize.

**Requerimientos:**

a. **Documentación del Patrón** ✅ COMPLETADO
   - Archivo: `docs/PATRON_PAGINACION_BACKEND.md`
   - Define: parámetros query, respuesta, implementación backend/frontend, endpoints a migrar

b. **Implementación Backend** - Orden de Prioridad
   1. `GET /api/planes/filter/:filtro` — Tabla principal (GestionPlanesV1)
   2. `GET /api/lookup/:entidad` — Lookups dinámicos (cobrador, os, zona, tipo_plan, etc.)
   3. `GET /api/personas/search` — Búsqueda de personas
   4. `GET /api/provincias` — Provincias (tabla de referencia)
   5. `GET /api/localidades` — Localidades (tabla de referencia)
   6. `GET /api/audit` — Auditoría del sistema (GestionAuditoria)
   7. `GET /api/bugs` — Gestión de bugs (GestionBugs)

   **Para cada endpoint:**
   - Cambiar `findAll()` → `findAndCountAll()`
   - Agregar parámetros query: `page`, `limit`, `sortBy`, `order`
   - Calcular offset: `offset = (page - 1) * limit`
   - Retornar: `{ success, data, count, page, limit, totalPages, offset }`

c. **Integración Frontend**
   - Estado local para `page` (resetea a 1 con cambios de filtro/ordenamiento/limit)
   - Pasar `page`, `limit` junto a `sortBy`, `order` en llamadas al API
   - Eliminar `usePagination` para datos (que actualmente pagina en cliente)
   - Usar componente `<Pagination>` para controlar cambios de página

d. **Coordinación de Parámetros**
   - Página se resetea a 1 cuando:
     * Cambia `sortBy` o `order`
     * Cambia un filtro (estado, tipo_plan, etc.)
     * Cambia `limit` (config.items_per_page)
   - Los 3 parámetros trabajan independientes pero coordinados

**Archivos Clave a Modificar:**

- `backend/src/controllers/planesController.js` — Ya inició con /api/planes/filter/:filtro
- `backend/src/controllers/lookupController.js` — Para lookups
- `backend/src/routes/` — Verificar parámetros query en cada endpoint
- `frontend/src/services/planesService.js` — Pasar page, limit
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx` — Integrar estado local page
- `docs/PATRON_PAGINACION_BACKEND.md` — Referencia para todas las implementaciones

**Testing Checklist:**

Para cada endpoint implementado:
- [ ] Backend retorna count, totalPages, offset correctos
- [ ] Frontend pasa page, limit, sortBy, order, filtros correctos
- [ ] Página resetea a 1 cuando cambia filtro
- [ ] Página resetea a 1 cuando cambia ordenamiento
- [ ] Página resetea a 1 cuando cambia limit
- [ ] Tabla muestra SOLO items de página actual (no todos)
- [ ] Componente Pagination navega correctamente
- [ ] Cambio de limit recalcula totalPages y resetea página

**Estimación:** 1-2 horas por endpoint (backend + frontend integración)

**Prioridad:** 🔴 Alta — Optimización crítica de rendimiento, impacta experiencia con tablas grandes

**Estado:** ✅ Solucionado (2026-05-08)

**Completado:**
- ✅ Documentación del patrón: docs/PATRON_PAGINACION_BACKEND.md
- ✅ Implementación en /api/planes/filter/:filtro (backend + frontend)

**Commits:**
- `ad9877f` — docs(paginacion): crear patrón estándar
- `bb12c4a` — feat(planes): implementar paginación backend
- `2556e74` — feat(planesService): agregar parámetros page/limit
- `633d11f` — feat(GestionPlanesV1): integrar paginación backend
- `e92aa95` — docs(backlog): registrar BACKLOG-056

**Próximas etapas:** Aplicar patrón a otros 6 endpoints (BACKLOG-057+)

---

### BACKLOG-057: Aplicar Patrón de Paginación a Cobradores, Obras Sociales y Zonas

**Descripción:**
Aplicar el patrón estándar de paginación backend (BACKLOG-056) a los 3 primeros endpoints de lookup que se muestran en tablas CRUD:
1. `GET /api/lookup/cobradores` → componente Cobradores.jsx (usa LookupCRUD genérico)
2. `GET /api/lookup/obras-sociales` → componente ObrasSociales.jsx (usa LookupCRUD genérico)
3. `GET /api/lookup/zonas` → componente Zonas.jsx (usa LookupCRUD genérico)

Estos 3 endpoints comparten la misma arquitectura: usan el componente genérico `LookupCRUD` que llama a `lookupService.list()`.

**Requerimientos:**

a. **Backend (lookupController.js - método list())**
   - Agregar parámetros query: `page`, `limit`, `sortBy`, `order`
   - Cambiar `findAll()` → `findAndCountAll()`
   - Calcular offset: `(page - 1) * limit`
   - Retornar: `{ success, data, count, page, limit, totalPages, offset }`

b. **Service (lookupService.js)**
   - Método `list()`: aceptar `page`, `limit` en options
   - Pasar como query params al API

c. **Frontend (LookupCRUD.jsx)**
   - Agregar estado: `page`, `totalCount`, `totalPages`
   - Resetear `page` a 1 cuando cambian: filtros, ordenamiento, limit
   - Remover `usePagination` (datos ya vienen paginados)
   - Actualizar componente Pagination con valores del backend
   - Búsqueda de texto: mantener en cliente (limitación temporal)

**Testing Checklist:**

Para cada tabla (Cobradores, Obras Sociales, Zonas):
- [ ] Backend retorna count, totalPages, offset correctos
- [ ] Frontend pasa page, limit, sortBy, order
- [ ] Tabla muestra solo items de página actual
- [ ] Paginación navega correctamente
- [ ] Ordenamiento funciona con paginación
- [ ] Página se resetea al cambiar filtro/ordenamiento

**Archivos a Modificar:**
- `backend/src/controllers/lookupController.js` (método list())
- `frontend/src/services/lookupService.js` (método list())
- `frontend/src/components/LookupCRUD/LookupCRUD.jsx` (componente genérico)

Nota: Las páginas wrapper (Cobradores.jsx, ObrasSociales.jsx, Zonas.jsx) no necesitan cambios, solo pasar props al LookupCRUD.

**Estimación:** 1-1.5 horas (cambios similares a BACKLOG-056, código reutilizable)

**Prioridad:** 🔴 Alta — Mismo impacto de rendimiento que planes, tablas lookup suelen tener muchos registros

**Estado:** ✅ Solucionado (2026-05-08)

**Completado:**
- ✅ Backend: paginación en /api/lookup/:entidad para todas las entidades
- ✅ Frontend service: lookupService.list() con page/limit
- ✅ Frontend component: LookupCRUD.jsx integrado con backend pagination
- ✅ Beneficiados: Cobradores, ObrasSociales, Zonas, TiposDePlan, TiposDeGrupo, ServiciosAdicionales

**Commits:**
- `5366bff` — feat(lookup): implementar paginación backend
- `3ca9758` — feat(lookupService): agregar parámetros page/limit
- `e4f3c69` — feat(LookupCRUD): integrar paginación backend en componente genérico
- `4a2af49` — docs(backlog): marcar BACKLOG-056 completo + registrar BACKLOG-057

**Próximas etapas:** Aplicar patrón a personas/search, provincias, localidades, auditoría, bugs (BACKLOG-058+)

---

### BACKLOG-058: Agregar "Guardar y Seguir Editando" en Formulario de Planes

**Descripción:**
Mejorar el flujo de edición/creación de planes agregando opciones más granulares para guardar. Actualmente el botón "Guardar" cierra el modal automáticamente. Se necesitan dos botones distintos:

1. **"Guardar y Seguir Editando"** — Nuevo botón
   - Guarda los cambios en la BD
   - Mantiene el modal abierto
   - Permite continuar editando integrantes, servicios, etc.
   - Útil cuando el usuario quiere hacer múltiples cambios sin cerrar/abrir el modal repetidamente

2. **"Guardar y Cerrar"** — Renombrar botón actual
   - Mismo comportamiento que el actual "Guardar"
   - Guarda los cambios
   - Cierra el modal automáticamente
   - Retorna a la tabla de planes

**Requerimientos:**

a. **UI/UX (PlanV1Modal.jsx)**
   - Agregar nuevo botón en el footer del modal
   - Colocar botones lado a lado (flexbox)
   - Estilos claros y diferenciados:
     * "Guardar y Seguir Editando" — botón primary
     * "Guardar y Cerrar" — botón secondary o variant diferente
   - Ambos botones deben mostrar loading state mientras se guarda
   - Deshabilitar ambos durante submit para evitar doble-envío

b. **Lógica de Guardado (usePlanV1Form.jsx o PlanV1Modal.jsx)**
   - Crear variable de estado: `shouldCloseAfterSave` (default: false)
   - Al hacer clic en "Guardar y Seguir Editando": 
     * Set `shouldCloseAfterSave = false`
     * Llamar función save()
     * No cerrar modal, mostrar mensaje de éxito
   - Al hacer clic en "Guardar y Cerrar":
     * Set `shouldCloseAfterSave = true`
     * Llamar función save()
     * Después de save exitoso, cerrar modal (onClose)

c. **Confirmación y Feedback**
   - Después de "Guardar y Seguir Editando": mostrar toast/notification de éxito
   - Mensaje: "Plan guardado exitosamente"
   - Usuario puede continuar editando integrantes, servicios, recibos, etc.
   - Evitar que usuario pierda cambios no guardados

**Componentes Afectados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.jsx` (posible)

**Testing Checklist:**
- [ ] Botones se renderizan correctamente lado a lado
- [ ] "Guardar y Seguir Editando" guarda sin cerrar
- [ ] "Guardar y Cerrar" guarda y cierra
- [ ] Loading state funciona en ambos botones
- [ ] Ambos botones deshabilitados durante submit
- [ ] Toast/notification aparece después de "Guardar y Seguir Editando"
- [ ] Integrantes siguen en el modal después de guardar
- [ ] Tab "Recibos" y "Historial" permanecen accesibles
- [ ] Cambios no perdidos si usuario hace clic en "Guardar y Seguir Editando" varias veces

**Estimación:** 1-1.5 horas (cambios menores en UI/estado)

**Prioridad:** 🟡 Media — Mejora UX, no es bloqueante pero muy solicitado en workflows complejos

**Beneficio:**
- ✅ Mejor UX: usuarios no necesitan cerrar/abrir modal para múltiples cambios
- ✅ Flujo natural: crear plan → agregar integrantes → editar cuota → guardar y continuar
- ✅ Reduce fricción: evita navegar tabla/modal repetidamente

**Estado:** ✅ Solucionado (2026-05-08)

**Completado:**
- ✅ Nuevo botón "Guardar y Seguir Editando" en PlanV1Modal
- ✅ Renombrado "Guardar" → "Guardar y Cerrar"
- ✅ Notificación de éxito con animación
- ✅ Estilos para botón success (verde)
- ✅ Flexbox layout para dos botones lado a lado

**Implementación:**
- Estado `showSuccessNotification` para feedback de éxito
- Parámetro `closeAfterSave` en handleGuardar
- closeAfterSave=false → muestra notificación, mantiene modal abierto
- closeAfterSave=true → guarda y cierra (comportamiento anterior)
- Tooltips en botones explicando comportamiento
- Loading state en ambos botones durante submit

**Beneficios:**
- ✅ Mejor UX: sin necesidad de cerrar/abrir modal repetidamente
- ✅ Feedback visual de guardado exitoso
- ✅ Flujo natural para workflows complejos

**Archivos Modificados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.scss`

**Commits:**
- `c309aaa` — feat(PlanV1Modal): agregar "Guardar y Seguir Editando"
- `46c1779` — style(PlanV1Modal): agregar estilos para notificación y botones

---

### BACKLOG-059: Guardado Automático de Afiliados al Agregar a Plan Existente

**Descripción:**
Cuando un afiliado es agregado a un plan que ya está registrado en la BD, el mismo debe quedar **automáticamente asociado** al plan sin que el usuario tenga que hacer clic en "Guardar y Seguir Editando" o "Guardar y Cerrar". El flujo se simplifica: agregar afiliado → automáticamente guardado en BD → aparece en la tabla con su rol asignado.

**Comportamiento Actual:**
1. Usuario abre PlanV1Modal en modo editar (plan existente)
2. Navega al tab "Afiliados"
3. Hace clic en "+ Agregar Afiliado"
4. Selecciona persona → se agrega a lista local (form.integrantes)
5. **Debe hacer clic** en "Guardar y Seguir Editando" o "Guardar y Cerrar"
6. Recién entonces se guarda en BD

**Comportamiento Requerido:**
1. Usuario abre PlanV1Modal en modo editar (plan existente)
2. Navega al tab "Afiliados"
3. Hace clic en "+ Agregar Afiliado"
4. Selecciona persona → **Se guarda automáticamente en BD**
5. Aparece en la tabla con su rol asignado
6. Usuario puede continuar agregando más afiliados sin clics adicionales

**Requerimientos:**

a. **Lógica de Guardado Automático**
   - Detectar si el modal está en modo "editar" (plan ya existe)
   - Cuando se agrega afiliado: 
     * Determinar rol automático (titular si es primero, adherente si no)
     * Hacer POST/CREATE al backend inmediatamente
     * Actualizar form.integrantes con respuesta (id asignado)
     * No esperar a que usuario haga clic en "Guardar"
   - Cuando se elimina afiliado:
     * Hacer DELETE al backend inmediatamente
     * Actualizar form.integrantes
   
b. **Rol Automático**
   - Primer afiliado agregado al plan = "titular"
   - Afiliados subsecuentes = "adherente"
   - Posición = última en la lista (order = length actual + 1)

c. **UX/Feedback**
   - Toast/notification temporal: "Afiliado agregado exitosamente"
   - Si hay error: mostrar error temporal y permitir reintentar
   - Tabla se actualiza visualmente sin necesidad de refrescar
   - Loading state en el botón "+ Agregar Afiliado" mientras se guarda

d. **Reorden Automático**
   - Después de agregar/eliminar, el orden se ajusta automáticamente
   - El nuevo afiliado toma la posición final
   - Si se usa drag & drop, el reorden se sincroniza con BD en tiempo real

**Componentes Afectados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.jsx`

**Cambios en Flujo:**
- `handleAfiladoSearch()` (línea ~335): en lugar de solo agregar a form.integrantes, también hacer POST al backend
- Crear función `createIntegranteAndSync()` que:
  * POST /api/v1.0/plan-integrantes
  * Actualiza form.integrantes con ID retornado
  * Muestra notificación de éxito
- Modificar eliminación: DELETE debe ser automático también (si está en modo editar)

**Testing Checklist:**
- [ ] Abrir plan existente en editar
- [ ] Agregar afiliado → se guarda inmediatamente
- [ ] Toast muestra éxito
- [ ] Afiliado aparece en tabla
- [ ] Rol correcto (titular/adherente)
- [ ] Posición correcta (última)
- [ ] Agregar múltiples afiliados sin cerrar modal
- [ ] Eliminar afiliado → se elimina de BD inmediatamente
- [ ] En modo "crear" plan: guardado automático NO aplica (esperar a "Guardar y Cerrar")
- [ ] Si hay error, mostrar y permitir reintentar

**Estimación:** 2-2.5 horas (cambio de flujo, manejo de estado/errores)

**Prioridad:** 🔴 Alta — Simplifica flujo principal, mejora UX significativamente, reduce clicks

**Beneficio:**
- ✅ UX más fluida: agregar afiliado es acción completada inmediatamente
- ✅ Menos clicks: no necesita "Guardar y Seguir Editando"
- ✅ Feedback inmediato: usuario ve resultado instantáneamente
- ✅ Intuitivo: comportamiento similar al de agregar items en listas modernas

**Notas Importantes:**
- **Solo aplicar a planes existentes** (modo editar)
- En modo "crear" plan nuevo, el guardado sigue siendo manual (al hacer "Guardar y Cerrar")
- Esto se complementa perfectamente con BACKLOG-058 ("Guardar y Seguir Editando")
- Requiere sincronización correcta de IDs después de crear (ver BUG-036)

**Estado:** ✅ Solucionado (2026-05-08)

**Implementación:**

1. **Detectar modo:** En `handleAfiladoSearch`, verificar si `mode === 'editar'`
2. **Auto-save en editar:**
   - POST `/api/v1.0/plan-integrantes` con datos del nuevo afiliado
   - Obtener `id` real asignado por BD
   - Actualizar `form.integrantes` con nuevo integrante (incluyendo `id`)
   - Llamar `reorder()` para actualizar `orden` de todos los integrantes
   - Mostrar notificación: "Afiliado agregado al plan"
3. **En modo crear:** Comportamiento original (`addIntegrante` local, sin BD)
4. **Loading state:** Nuevo estado `loadingAddAfiliado` deshabilita botón "+ Agregar Afiliado" mientras se guarda
5. **Notificación dinámica:** `showSuccessNotification` cambió de boolean a string para mostrar mensajes contextuales

**Archivos modificados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
  - Línea 38: `showSuccessNotification` → useState('')
  - Línea 39: Nuevo estado `loadingAddAfiliado`
  - Líneas 334-335: Mensaje dinámico en handleGuardar
  - Líneas 350-381: handleAfiladoSearch → async con lógica condicional
  - Líneas 712-715: Botón con disabled y texto dinámico
  - Línea 484: Render notificación con mensaje dinámico

**Commits:**
- `388a3a8` — feat(BACKLOG-059): auto-guardar afiliado al agregar en plan existente
- `051dcfc` — fix: usar handleFieldChange en lugar de setForm (no-undef error)

**Compatibilidad:**
- ✅ `handleGuardar` no necesita cambios (el diff contra BD detecta integrantes ya guardados)
- ✅ No afecta modo "crear" (comportamiento original)
- ✅ Completamente compatible con "Guardar y Seguir Editando"

---

### BACKLOG-067: Eliminar Plan con Confirmación de Cascada

**Descripción:**
Mejorar el flujo de eliminación de planes para ofrecer al usuario dos opciones claras: "Suspender" o "Eliminar". Esto permite que el usuario pueda elegir entre una operación reversible (suspender) o irreversible (eliminar permanentemente).

**Comportamiento Actual:**
Al hacer clic en la acción de "eliminar" un plan en la tabla, se muestra un modal de confirmación única que elimina el plan directamente.

**Comportamiento Requerido:**
1. Usuario hace clic en acción "eliminar" plan
2. Se abre primer modal con dos opciones:
   - **Suspender**: Plan pasa a estado SUSPENDIDO (reversible)
   - **Eliminar**: Procede a confirmación adicional
3. Si selecciona "Suspender": 
   - Proceder como actualmente lo estamos haciendo (cambiar estado a SUSPENDIDO)
4. Si selecciona "Eliminar":
   - Mostrar segundo modal de confirmación con advertencia explícita de que **es una operación irreversible**
   - Si el usuario confirma: eliminar plan en cascada
   - Actualizar grilla después de eliminación

**Requerimientos Funcionales:**

a. **Primer Modal: Opción de Acción**
   - Título: "¿Suspender o Eliminar Plan?"
   - Descripción breve del plan identificando (zona-número, titular)
   - Dos botones:
     * "Suspender Plan" (acción primaria)
     * "Eliminar Plan" (acción destructiva, rojo/warning)
     * Botón de cierre/cancelar

b. **Segundo Modal: Confirmación Irreversible (solo si elige Eliminar)**
   - Título: "⚠️ Confirmar Eliminación Permanente"
   - Mensaje destacado: "Esta acción no se puede deshacer. Se eliminarán:"
   - Lista de lo que se eliminará:
     * El plan y todos sus integrantes/afiliados
     * Todos los recibos asociados
     * Todo el historial de cuotas del plan
     * Cualquier otro registro dependiente
   - Dos botones:
     * "Cancelar" (primario)
     * "Sí, Eliminar Permanentemente" (destructivo, rojo)

c. **Lógica de Backend**
   - Endpoint DELETE /api/planes/:id o similar debe:
     * Verificar permisos (admin o usuario propietario)
     * Eliminar en cascada (ON DELETE CASCADE en BD, o manejo explícito en controller):
       - plan_integrantes (integrantes/afiliados)
       - recibos (ReciboIntegrante y Recibo)
       - historial_cuota (HistorialCuota)
       - servicios_integrantes (IntegranteServicio)
       - Cualquier otro registro que referencia a planes
     * Usar transacción para garantizar consistencia
     * Retornar success: true, message: "Plan eliminado completamente"

d. **UX/Feedback**
   - Suspender: Toast "Plan suspendido exitosamente"
   - Eliminar: Toast "Plan eliminado definitivamente"
   - Después de completar cualquiera: cerrar modal y refrescar tabla de planes
   - Si hay error: mostrar error en modal o toast y permitir reintentar

e. **Componentes Necesarios**
   - `ConfirmDeletePlanModal.jsx`: Modal con dos opciones (Suspender/Eliminar)
   - `ConfirmDeletePlanPermanentModal.jsx`: Modal de confirmación irreversible
   - Actualizar `PlanV1Modal.jsx` o `GestionPlanesV1.jsx` para:
     * Reemplazar lógica de delete simple por este nuevo flujo
     * Manejar estados modales
     * Refrescar tabla después de eliminación

**Archivos Afectados Estimados:**
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1.jsx`
- `frontend/src/components/ConfirmDeletePlanModal.jsx` (nuevo)
- `frontend/src/components/ConfirmDeletePlanPermanentModal.jsx` (nuevo)
- `frontend/src/services/planesService.js` (agregar método deleteCompletely)
- `backend/src/controllers/planesController.js` (endpoint DELETE con cascada)
- `backend/src/services/planesV1Service.js` (lógica de eliminación en cascada)

---

## Items descartados

| ID | Descripción | Motivo descarte |
|----|-------------|-----------------|