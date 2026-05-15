# Especificación: Panel de Migraciones para Administradores

**Fecha:** 2026-04-12  
**Versión:** 1.0  
**Estado:** Aprobado

---

## Resumen Ejecutivo

Crear un panel de administración integrado en el DashboardPage que permita a los administradores:
1. Ver versiones de base de datos disponibles y estado actual
2. Aplicar upgrades/downgrades con preview de SQL
3. Consultar historial completo de migraciones
4. Monitorear estadísticas de la BD (tablas y registros)

El sistema aprovecha la infraestructura existente de `migrationManager.js` exponiendo su funcionalidad a través de nuevos endpoints REST y un componente React.

---

## Requisitos Funcionales

### RF1: Visualización de Versiones Disponibles
- El admin ve lista de todas las versiones en `backend/src/migrations/versions/`
- Cada versión muestra:
  - Número de versión (ej: 1.0.0, 1.0.1)
  - Descripción (extraída del nombre de la carpeta)
  - Estado actual (aplicada/pendiente)
  - Botón de acción contextual:
    - Si versión < actual: "Downgrade"
    - Si versión == actual: deshabilitado
    - Si versión es la siguiente: "Upgrade"

### RF2: Preview de Migraciones
- Al clickear "Upgrade" o "Downgrade", se abre modal con:
  - **Datos básicos:** Versión actual → versión destino
  - **Descripción:** Texto descriptivo de la migración
  - **SQL completo:** Contenido literal de upgrade.sql o downgrade.sql (scrollable)
  - **Botones:** "Cancelar" | "Confirmar Ejecución"
- El SQL se obtiene del backend sin ejecutarse

### RF3: Ejecución de Migraciones
- Al confirmar preview, la página entra en estado **loading** (overlay semi-transparente con spinner)
- El backend ejecuta la migración en transacción
- Una vez completada, se muestra resultado:
  - **Éxito:** Modal con ✅ "Upgrade/Downgrade exitoso. Versión: X.X.X. Duración: Ys"
  - **Fallo:** Modal con ❌ error específico y recomendación (ej: "Revierte datos incorrectos")
- Después de cerrar modal, la UI se actualiza automáticamente:
  - Tab "Versiones" refleja nueva versión actual
  - Tab "Historial" muestra nuevo registro
  - Tab "Estadísticas" recarga conteos de tablas

### RF4: Historial de Migraciones
- Tabla con todas las migraciones realizadas (upgrades y downgrades), más recientes primero
- Columnas:
  - Versión
  - Descripción
  - Tipo (upgrade/downgrade)
  - Estado (exitosa/fallida)
  - Fecha de ejecución (timestamp)
  - Duración (en segundos, ej: "2.5s")
- Los datos vienen de la tabla `historial_migraciones`

### RF5: Estadísticas de BD
- **Versión actual:** Mostrada prominentemente (ej: "Versión actual: 1.0.2")
- **Tabla de conteos:**
  - Nombre de tabla | Cantidad de registros
  - Ordenada alfabéticamente por nombre
  - Incluye todas las tablas de la BD, excepto tablas internas (`migraciones_bd`, `historial_migraciones`)
- **Botón "Refrescar"** que recarga datos sin recargar la página
- Los datos vienen del método `getDbStats()` de migrationManager.js

### RF6: Control de Acceso
- Panel **solo visible** para usuarios con `role === 'admin'`
- Middleware backend rechaza todas las rutas `/api/migrations/*` si no es admin
- Si usuario no autenticado intenta acceder, retorna 401 Unauthorized
- Si usuario autenticado pero no admin, retorna 403 Forbidden

---

## Requisitos No Funcionales

### RNF1: Performance
- Preview debe retornarse en < 500ms (solo lectura de archivos)
- Historial y estadísticas en < 1s
- Ejecución de migración se muestra con estado loading (no timeout en UI)

### RNF2: UX
- Confirmación obligatoria antes de ejecutar cualquier migración
- Estado visual claro mientras se ejecuta (loading overlay)
- Mensajes de error claros y específicos
- Modal de preview scrollable para SQL muy largo

### RNF3: Datos
- Historial es append-only (nunca se borra)
- Cada ejecución registra duración para auditoría
- Transacciones garantizan consistencia (revierte si hay error)

---

## Arquitectura Backend

### Cambios a `migrationManager.js`

**Nueva columna en `historial_migraciones`:**
```sql
ALTER TABLE historial_migraciones ADD COLUMN duracion_ms INT DEFAULT NULL;
```

**Nuevos métodos:**

1. **`getPreview(version, direction)`**
   ```js
   // Retorna el SQL sin ejecutar
   // Input: version ("1.0.2"), direction ("upgrade" | "downgrade")
   // Output: { version, direction, sql, description, nextVersion }
   ```

2. **`execute(direction)`**
   ```js
   // Wrapper unificado para upgrade/downgrade que registra duración
   // Input: direction ("upgrade" | "downgrade")
   // Output: { success, version, message, duration } | { success: false, error }
   ```

### Nuevos archivos

**`backend/src/controllers/migrationsController.js`**
```js
// GET /api/migrations/list
// GET /api/migrations/history
// GET /api/migrations/stats
// GET /api/migrations/preview/:version/:direction
// POST /api/migrations/execute
```

**`backend/src/routes/migrations.js`**
- Todas las rutas protegidas por middleware de admin
- Error handling uniforme (status codes: 200, 400, 401, 403, 500)

### Middleware
- Ruta protegida por `auth.js` (JWT válido)
- Además, middleware de admin que verifica `user.role === 'admin'`

---

## Arquitectura Frontend

### Nuevo componente: `MigrationsDashboard.jsx`

**Props:** ninguna (lee user context para verificar admin)

**Estructura interna:**
```
MigrationsDashboard
├── state (zustand o Context):
│   ├── versions: []
│   ├── history: []
│   ├── stats: { currentVersion, tables: [] }
│   ├── loading: boolean
│   ├── preview: { open, version, direction, sql }
│   └── error: null | string
│
├── useEffect (montaje):
│   └─ loadVersions(), loadHistory(), loadStats()
│
├── Tabs container:
│   ├── VersionesTab
│   ├── HistorialTab
│   └── EstadisticasTab
│
└── PreviewModal (condicional)
    └─ Mostrado cuando preview.open === true
```

**Componentes hijos:**

1. **`VersionesTab.jsx`**
   - Renderiza versiones en cards o lista
   - Cada versión muestra estado visual (✅ aplicada / ⏳ pendiente)
   - Botón "Upgrade/Downgrade" dispara `openPreview(version, direction)`

2. **`HistorialTab.jsx`**
   - Tabla con historial de migraciones
   - Paginación si hay muchos registros (ej: 20 por página)

3. **`EstadisticasTab.jsx`**
   - Muestra versión actual como texto/badge
   - Tabla de `tabla | registros`
   - Botón "Refrescar" dispara `loadStats()`

4. **`PreviewModal.jsx`**
   - Modal que muestra preview antes de ejecutar
   - Contenido:
     - "Versión actual: X.X.X → X.X.X (descripción)"
     - Área scrollable con SQL
     - Botones: "Cancelar" | "Confirmar"
   - Al confirmar, dispara `executeAction()` y muestra estado loading

### Servicio: `migrationsService.js`
```js
export const migrationsAPI = {
  list: () => GET /api/migrations/list,
  history: () => GET /api/migrations/history,
  stats: () => GET /api/migrations/stats,
  preview: (version, direction) => GET /api/migrations/preview/:version/:direction,
  execute: (direction) => POST /api/migrations/execute,
};
```

---

## Flujo de Datos

### Upgrade/Downgrade Flow
```
1. User clicks "Upgrade to 1.0.2"
   └─ openPreview(version="1.0.2", direction="upgrade")

2. Frontend GET /api/migrations/preview/1.0.2/upgrade
   ├─ Backend reads upgrade.sql from disk
   └─ Response: { version, direction, sql, description, nextVersion }

3. PreviewModal opens with SQL content

4. User clicks "Confirmar"
   └─ executeAction(direction="upgrade")
   └─ UI enters loading state

5. Frontend POST /api/migrations/execute { direction: "upgrade" }
   ├─ Backend calls migrationManager.execute("upgrade")
   ├─ Transacción: ejecuta SQL, registra en historial con duración
   └─ Response: { success: true, version, message, duration } or { success: false, error }

6. Loading state ends
   ├─ Si success:
   │  └─ Show success modal
   │  └─ Reload all tabs (versions, history, stats)
   └─ Si error:
      └─ Show error modal
      └─ Reload versions (para reflejar estado si cambió)
```

---

## Error Handling

| Escenario | Backend Response | Frontend Action |
|-----------|------------------|-----------------|
| SQL inválido | 400 + error message | Mostrar error modal con detalles |
| Foreign key violation | 400 + "Constraint violated" | Mostrar error específico |
| Versión no encontrada | 400 + "Version folder not found" | Mostrar error |
| Admin check falló | 403 Forbidden | Mostrar "Acceso denegado" |
| No autenticado | 401 Unauthorized | Redirigir a login |
| Error DB conexión | 500 | Mostrar "Error del servidor" |

---

## Testing

### Backend Tests
- `migrationsController.spec.js`:
  - GET /list retorna formato correcto
  - GET /preview/:version/:direction retorna SQL
  - POST /execute ejecuta y retorna duración
  - Middleware admin bloquea usuarios no-admin
  - Error handling retorna status codes correctos

### Frontend Tests
- `MigrationsDashboard.spec.jsx`:
  - Renderiza 3 tabs
  - Versiones se cargan en montaje
  - Click "Upgrade" abre PreviewModal
  - Confirmar preview dispara API execute
  - Loading state se muestra durante ejecución
  - Resultado exitoso muestra modal y recarga datos
  - Error muestra mensaje específico

---

## Consideraciones de Seguridad

1. **Autenticación:** JWT requerido en todas las rutas
2. **Autorización:** Solo admin puede acceder a `/api/migrations/*`
3. **SQL Injection:** No aplica (SQL viene de archivos estáticos en el servidor, no de entrada de usuario)
4. **Transacciones:** Todas las migraciones están en transacciones para garantizar consistencia
5. **Auditoría:** Historial append-only registra quién (usuario) hizo qué, cuándo y con qué resultado

---

## Métricas de Éxito

- ✅ Admin puede ver todas las versiones disponibles
- ✅ Admin puede ver historial completo de migraciones
- ✅ Admin puede ver estadísticas de BD (versión actual, tablas, registros)
- ✅ Upgrade/downgrade con preview y confirmación funciona sin errores
- ✅ Duración de migraciones se registra correctamente
- ✅ Usuarios no-admin no pueden ver el panel

---

## Apéndice: Estructura de Directorios

```
backend/src/
├── migrations/
│   ├── migrationManager.js (modificado: +getPreview, +execute, duracion_ms)
│   └── versions/
│       ├── 1.0.0_usuarios/
│       ├── 1.0.1_tablas_lookup/
│       └── 1.0.2_planes_y_personas/
├── controllers/
│   └── migrationsController.js (nuevo)
└── routes/
    └── migrations.js (nuevo)

frontend/src/pages/DashboardPage/components/
└── MigrationsDashboard/
    ├── MigrationsDashboard.jsx
    ├── tabs/
    │   ├── VersionesTab.jsx
    │   ├── HistorialTab.jsx
    │   └── EstadisticasTab.jsx
    ├── modals/
    │   └── PreviewModal.jsx
    └── services/
        └── migrationsService.js
```

---

**Fin de la especificación.**
