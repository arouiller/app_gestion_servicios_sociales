# Especificación Unificada: Panel de Migraciones + CRUD Entidades + Planes

**Fecha:** 2026-04-13  
**Versión:** 1.0  
**Estado:** Aprobado — pendiente de implementación  
**Fuente:** Fusión de 2026-04-11 (Entidades Lookup + Planes) + 2026-04-12 (Panel de Migraciones)

---

## Resumen Ejecutivo

Implementación de un sistema completo de gestión de servicios sociales en 3 componentes interdependientes:

1. **Panel de Migraciones** (infraestructura transversal) — permitir a admins ejecutar migraciones de BD desde UI
2. **Migraciones de BD** (1.0.1, 1.0.2, 1.0.3) — crear tablas de entidades lookup, planes, personas, historial y recibos
3. **CRUD + Planes** — interfaces y endpoints para gestionar cobradores, tipos de plan, planes, personas, recibos

El Panel de Migraciones se implementa **primero** como infraestructura; luego se usan sus funcionalidades para ejecutar las 3 migraciones necesarias.

---

## 1. Infraestructura: Panel de Migraciones para Administradores

### Propósito

Crear un panel de administración integrado en DashboardPage que permita a administradores:
- Ver versiones de BD disponibles y estado actual
- Aplicar upgrades/downgrades con preview de SQL
- Consultar historial completo de migraciones
- Monitorear estadísticas de la BD

Aprovecha la infraestructura existente de `migrationManager.js`.

---

### RF1: Visualización de Versiones Disponibles

- El admin ve lista de todas las versiones en `backend/src/migrations/versions/`
- Cada versión muestra:
  - Número de versión (ej: 1.0.0, 1.0.1, 1.0.2, 1.0.3)
  - Descripción (extraída del nombre de la carpeta)
  - Estado actual (aplicada/pendiente)
  - Botón de acción contextual:
    - Si versión < actual: "Downgrade"
    - Si versión == actual: deshabilitado
    - Si versión es la siguiente: "Upgrade"

### RF2: Preview de Migraciones

- Al clickear "Upgrade" o "Downgrade", se abre modal con:
  - Datos básicos: Versión actual → versión destino
  - Descripción: Texto descriptivo de la migración
  - SQL completo: Contenido literal de upgrade.sql o downgrade.sql (scrollable)
  - Botones: "Cancelar" | "Confirmar Ejecución"
- El SQL se obtiene del backend sin ejecutarse

### RF3: Ejecución de Migraciones

- Al confirmar preview, la página entra en estado **loading** (overlay semi-transparente con spinner)
- El backend ejecuta la migración en transacción
- Una vez completada, se muestra resultado:
  - **Éxito:** Modal con ✅ "Upgrade/Downgrade exitoso. Versión: X.X.X. Duración: Ys"
  - **Fallo:** Modal con ❌ error específico y recomendación
- Después de cerrar modal, la UI se actualiza automáticamente

### RF4: Historial de Migraciones

- Tabla con todas las migraciones realizadas (upgrades y downgrades), más recientes primero
- Columnas: Versión, Descripción, Tipo (upgrade/downgrade), Estado (exitosa/fallida), Fecha de ejecución (timestamp), Duración (en segundos)
- Los datos vienen de la tabla `historial_migraciones`

### RF5: Estadísticas de BD

- **Versión actual:** Mostrada prominentemente (ej: "Versión actual: 1.0.3")
- **Tabla de conteos:**
  - Nombre de tabla | Cantidad de registros
  - Ordenada alfabéticamente
  - Incluye todas las tablas, excepto `migraciones_bd`, `historial_migraciones`
- **Botón "Refrescar"** que recarga datos sin recargar la página
- Los datos vienen del método `getDbStats()` de migrationManager.js

### RF6: Control de Acceso

- Panel **solo visible** para usuarios con `role === 'admin'`
- Middleware backend rechaza todas las rutas `/api/migrations/*` si no es admin
- Si usuario no autenticado intenta acceder, retorna 401 Unauthorized
- Si usuario autenticado pero no admin, retorna 403 Forbidden

---

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

### Backend: Panel de Migraciones

#### Cambios a `migrationManager.js`

**Nueva columna en `historial_migraciones`:**
```sql
ALTER TABLE historial_migraciones ADD COLUMN duracion_ms INT DEFAULT NULL;
```

**Nuevos métodos:**

1. **`getPreview(version, direction)`**
   - Retorna el SQL sin ejecutar
   - Input: version ("1.0.2"), direction ("upgrade" | "downgrade")
   - Output: `{ version, direction, sql, description, nextVersion }`

2. **`execute(direction)`**
   - Wrapper unificado para upgrade/downgrade que registra duración
   - Input: direction ("upgrade" | "downgrade")
   - Output: `{ success, version, message, duration }` o `{ success: false, error }`

#### Nuevos archivos

**`backend/src/controllers/migrationsController.js`**
```
GET /api/migrations/list           → obtener todas las versiones
GET /api/migrations/history        → obtener historial de ejecuciones
GET /api/migrations/stats          → obtener estadísticas de BD
GET /api/migrations/preview/:version/:direction → preview de SQL
POST /api/migrations/execute       → ejecutar migración
```

**`backend/src/routes/migrations.js`**
- Todas las rutas protegidas por middleware de admin
- Error handling uniforme (status codes: 200, 400, 401, 403, 500)

### Frontend: Panel de Migraciones

#### Componente: `MigrationsDashboard.jsx`

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

1. **`VersionesTab.jsx`** — Renderiza versiones en cards o lista; cada versión muestra estado visual
2. **`HistorialTab.jsx`** — Tabla con historial de migraciones; paginación si hay muchos registros
3. **`EstadisticasTab.jsx`** — Muestra versión actual + tabla de `tabla | registros` + botón "Refrescar"
4. **`PreviewModal.jsx`** — Modal que muestra preview; contenido scrollable con SQL; botones "Cancelar" | "Confirmar"

#### Servicio: `migrationsService.js`
```js
export const migrationsAPI = {
  list: () => GET /api/migrations/list,
  history: () => GET /api/migrations/history,
  stats: () => GET /api/migrations/stats,
  preview: (version, direction) => GET /api/migrations/preview/:version/:direction,
  execute: (direction) => POST /api/migrations/execute,
};
```

#### Ubicación en Dashboard

Menú principal agrega:
```
Mi Cuenta
  └── Datos Personales
Maestros
  ├── Cobradores
  ├── Tipos de Plan
  ├── Obras Sociales
  ├── Servicios Adicionales
  └── Tipos de Grupo
Planes
Listados
  ├── Búsqueda de Afiliados
  ├── Listado de Planes
  └── Planes por Cobrador
[ADMIN ONLY]
Administración
  └── Migraciones
```

---

## 2. Migraciones de Base de Datos

Las 3 migraciones siguientes se pueden ejecutar través del Panel de Migraciones o mediante CLI. Se implementan **después** que el Panel esté funcional.

### Migración `1.0.1_tablas_lookup`

Crea 5 tablas de entidades de lookup. PKs enteras sin `AUTO_INCREMENT` — el valor lo determina el backend.

```sql
CREATE TABLE cobradores (
  cobrador_numero     INT          NOT NULL,
  cobrador_apellido   VARCHAR(100) NOT NULL,
  cobrador_nombre     VARCHAR(100) NOT NULL,
  fecha_creacion      DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cobrador_numero)
);

CREATE TABLE tipos_de_plan (
  tipo_plan_numero    INT          NOT NULL,
  tipo_plan_nombre    VARCHAR(100) NOT NULL,
  fecha_creacion      DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tipo_plan_numero)
);

CREATE TABLE obras_sociales (
  os_numero           INT          NOT NULL,
  os_nombre           VARCHAR(100) NOT NULL,
  fecha_creacion      DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (os_numero)
);

CREATE TABLE servicios_adicionales (
  servicio_adicional_numero    INT          NOT NULL,
  servicio_adicional_nombre    VARCHAR(100) NOT NULL,
  fecha_creacion               DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion          DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (servicio_adicional_numero)
);

CREATE TABLE tipos_de_grupo (
  tipo_de_grupo_numero    INT          NOT NULL,
  tipo_de_grupo_nombre    VARCHAR(100) NOT NULL,
  fecha_creacion          DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion     DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tipo_de_grupo_numero)
);

INSERT INTO tipos_de_grupo (tipo_de_grupo_numero, tipo_de_grupo_nombre) VALUES
  (1, 'Individual'),
  (2, 'Grupo familiar'),
  (3, 'Titular y adherente');
```

**downgrade.sql:**
```sql
DROP TABLE IF EXISTS tipos_de_grupo;
DROP TABLE IF EXISTS servicios_adicionales;
DROP TABLE IF EXISTS obras_sociales;
DROP TABLE IF EXISTS tipos_de_plan;
DROP TABLE IF EXISTS cobradores;
```

---

### Migración `1.0.2_planes_y_personas`

```sql
CREATE TABLE personas (
  id                      INT          NOT NULL AUTO_INCREMENT,
  apellido                VARCHAR(100) NOT NULL,
  nombre                  VARCHAR(100) NOT NULL,
  tipo_documento          ENUM('DNI','LC','LE','PASAPORTE') NOT NULL,
  numero_documento        VARCHAR(20)  NOT NULL,
  fecha_nacimiento        DATE         NOT NULL,
  fecha_cobertura         DATE         NOT NULL,
  fecha_creacion          DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion     DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE TABLE planes (
  plan_numero             INT          NOT NULL AUTO_INCREMENT,
  tipo_plan_numero        INT          NOT NULL,
  cobrador_numero         INT          NOT NULL,
  tipo_de_grupo_numero    INT          NOT NULL,
  os_numero               INT          NOT NULL,
  numero_afiliado         VARCHAR(50)  NOT NULL,
  telefono_1              VARCHAR(30),
  telefono_2              VARCHAR(30),
  domicilio               VARCHAR(255),
  localidad               VARCHAR(100),
  valor_cuota             DECIMAL(10,2),
  estado                  ENUM('ACTIVO','SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO',
  fecha_creacion          DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion     DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (plan_numero),
  UNIQUE KEY uq_numero_afiliado (numero_afiliado),
  FOREIGN KEY (tipo_plan_numero)     REFERENCES tipos_de_plan(tipo_plan_numero),
  FOREIGN KEY (cobrador_numero)      REFERENCES cobradores(cobrador_numero),
  FOREIGN KEY (tipo_de_grupo_numero) REFERENCES tipos_de_grupo(tipo_de_grupo_numero),
  FOREIGN KEY (os_numero)            REFERENCES obras_sociales(os_numero)
);

CREATE TABLE plan_integrantes (
  id              INT         NOT NULL AUTO_INCREMENT,
  plan_numero     INT         NOT NULL,
  persona_id      INT         NOT NULL,
  rol             ENUM('titular','integrante') NOT NULL,
  credencial      CHAR(1)     NOT NULL,
  fecha_creacion  DATETIME    NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_persona (plan_numero, persona_id),
  FOREIGN KEY (plan_numero)  REFERENCES planes(plan_numero) ON DELETE CASCADE,
  FOREIGN KEY (persona_id)   REFERENCES personas(id)
);

CREATE TABLE integrante_servicios (
  plan_integrante_id          INT NOT NULL,
  servicio_adicional_numero   INT NOT NULL,
  PRIMARY KEY (plan_integrante_id, servicio_adicional_numero),
  FOREIGN KEY (plan_integrante_id)        REFERENCES plan_integrantes(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_adicional_numero) REFERENCES servicios_adicionales(servicio_adicional_numero)
);
```

**downgrade.sql:**
```sql
DROP TABLE IF EXISTS integrante_servicios;
DROP TABLE IF EXISTS plan_integrantes;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS personas;
```

**Constraint de titular:** exactamente un `plan_integrante` por plan con `rol='titular'` — validado a nivel backend.

---

### Migración `1.0.3_historial_cuota_y_recibos`

```sql
CREATE TABLE historial_cuota (
  id              INT            NOT NULL AUTO_INCREMENT,
  plan_numero     INT            NOT NULL,
  valor_anterior  DECIMAL(10,2)  NOT NULL,
  valor_nuevo     DECIMAL(10,2)  NOT NULL,
  fecha_cambio    DATETIME       NOT NULL DEFAULT NOW(),
  usuario_id      INT            NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (plan_numero)  REFERENCES planes(plan_numero) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)
);

CREATE TABLE recibos (
  id                    INT          NOT NULL AUTO_INCREMENT,
  plan_numero           INT          NOT NULL,
  periodo               DATE         NOT NULL,
  numero_afiliado       VARCHAR(50)  NOT NULL,
  titular_apellido      VARCHAR(100) NOT NULL,
  titular_nombre        VARCHAR(100) NOT NULL,
  obra_social_nombre    VARCHAR(100) NOT NULL,
  tipo_plan_nombre      VARCHAR(100) NOT NULL,
  tipo_de_grupo_nombre  VARCHAR(100) NOT NULL,
  cobrador_apellido     VARCHAR(100) NOT NULL,
  cobrador_nombre       VARCHAR(100) NOT NULL,
  domicilio             VARCHAR(255),
  valor_cuota           DECIMAL(10,2) NOT NULL,
  fecha_emision         DATETIME     NOT NULL DEFAULT NOW(),
  usuario_id            INT          NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recibo_plan_periodo (plan_numero, periodo),
  FOREIGN KEY (plan_numero)  REFERENCES planes(plan_numero),
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)
);

CREATE TABLE recibo_integrantes (
  id                INT          NOT NULL AUTO_INCREMENT,
  recibo_id         INT          NOT NULL,
  apellido          VARCHAR(100) NOT NULL,
  nombre            VARCHAR(100) NOT NULL,
  tipo_documento    ENUM('DNI','LC','LE','PASAPORTE') NOT NULL,
  numero_documento  VARCHAR(20)  NOT NULL,
  fecha_nacimiento  DATE         NOT NULL,
  fecha_cobertura   DATE         NOT NULL,
  rol               ENUM('titular','integrante') NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE
);
```

**downgrade.sql:**
```sql
DROP TABLE IF EXISTS recibo_integrantes;
DROP TABLE IF EXISTS recibos;
DROP TABLE IF EXISTS historial_cuota;
```

---

## 3. Backend — Entidades Lookup (CRUD Genérico)

### Arquitectura

Un único `lookupController.js` parametrizado por configuración. Una sola ruta dinámica:

```
GET    /api/lookup/:entidad        → listar
POST   /api/lookup/:entidad        → crear
PUT    /api/lookup/:entidad/:numero → actualizar
DELETE /api/lookup/:entidad/:numero → eliminar
```

Todas protegidas con `verifyToken`.

### Mapa de configuración (`ENTIDADES`)

```javascript
const ENTIDADES = {
  cobradores: {
    model: Cobrador,
    pkField: 'cobrador_numero',
    campos: ['cobrador_apellido', 'cobrador_nombre'],
    refsCheck: [{ model: Plan, fk: 'cobrador_numero' }],
  },
  'tipos-de-plan': {
    model: TipoDePlan,
    pkField: 'tipo_plan_numero',
    campos: ['tipo_plan_nombre'],
    refsCheck: [{ model: Plan, fk: 'tipo_plan_numero' }],
  },
  'obras-sociales': {
    model: ObraSocial,
    pkField: 'os_numero',
    campos: ['os_nombre'],
    refsCheck: [{ model: Plan, fk: 'os_numero' }],
  },
  'servicios-adicionales': {
    model: ServicioAdicional,
    pkField: 'servicio_adicional_numero',
    campos: ['servicio_adicional_nombre'],
    refsCheck: [{ model: IntegranteServicio, fk: 'servicio_adicional_numero' }],
  },
  'tipos-de-grupo': {
    model: TipoDeGrupo,
    pkField: 'tipo_de_grupo_numero',
    campos: ['tipo_de_grupo_nombre'],
    refsCheck: [{ model: Plan, fk: 'tipo_de_grupo_numero' }],
  },
};
```

### Operaciones

**`GET /api/lookup/:entidad`** — Devuelve todos los registros ordenados por `pkField` ASC.

**`POST /api/lookup/:entidad`**
- Valida que todos los `campos` requeridos no estén vacíos → 422
- Si se provee `pkField`: verifica unicidad → 409 "El número X ya existe"
- Si no se provee: `SELECT MAX(pkField) + 1` como PK
- Inserta y devuelve 201

**`PUT /api/lookup/:entidad/:numero`**
- Verifica existencia → 404
- Valida campos → 422
- Actualiza `fecha_actualizacion` + campos. Devuelve 200

**`DELETE /api/lookup/:entidad/:numero`**
- Verifica existencia → 404
- Para cada entrada en `refsCheck`: `COUNT(*)` con el FK → si > 0, devuelve 409 "No se puede eliminar, está en uso"
- Elimina y devuelve 200

---

## 4. Backend — Planes y Personas

### `personasController.js`

**`GET /api/personas?search=texto`**
- Busca por `apellido`, `nombre` o `numero_documento` (LIKE `%texto%`), máximo 10 resultados
- Devuelve: `id`, `apellido`, `nombre`, `tipo_documento`, `numero_documento`, `fecha_nacimiento`, `fecha_cobertura`
- Usado exclusivamente desde el formulario de Plan (autocomplete de búsqueda de integrante)
- **Comportamiento de edición compartida:** si se editan los datos de una persona existente, el cambio se aplica globalmente

No se exponen endpoints de creación/edición/eliminación directa de personas.

### `planesController.js`

**`GET /api/planes`**
- Filtros opcionales: `estado`, `cobrador_numero`, `os_numero`, `persona_id`
- Paginación: `page`, `limit` (default 20)
- Devuelve lista con datos del plan + nombre de cobrador, obra social, tipo (joins)

**`GET /api/planes/siguiente-numero-afiliado`**
- Calcula `MAX(CAST(numero_afiliado AS UNSIGNED)) + 1`
- Si no hay registros o ninguno es numérico, devuelve `1`
- Devuelve: `{ siguiente: "42" }`
- **⚠️ Importante:** Registrar en Express **antes** que `GET /api/planes/:id`

**`GET /api/planes/:id`**
- Detalle completo: datos del plan + integrantes con sus datos, credencial, rol y servicios

**`POST /api/planes`** (transacción)
1. Valida campos del plan (numero_afiliado único, al menos 1 integrante, exactamente 1 titular)
2. Para cada integrante:
   - Si `persona_id` provisto: verifica existencia
   - Si no: crea `persona` nueva con los datos provistos
3. Crea `plan`, `plan_integrantes`, `integrante_servicios`
4. Si cualquier paso falla: rollback completo

**`PUT /api/planes/:id`** (transacción)
- Actualiza datos del plan
- Sincroniza integrantes: elimina, actualiza, agrega nuevos
- Valida exactamente 1 titular antes de commit

**`DELETE /api/planes/:id`**
- Elimina plan + cascada (`plan_integrantes` + `integrante_servicios`)
- Las personas no se eliminan (pueden pertenecer a otros planes)

**`GET /api/planes/:id/historial-cuota`**
- Devuelve todos los registros de `historial_cuota` para el plan, ordenados por `fecha_cambio DESC`

**`PATCH /api/planes/aumento-masivo`** *(registrar antes que `/:id`)*

Body: `{ "planes": [1, 2, 3], "porcentaje": 10.5 }` — si `planes` es array vacío, aplica a **todos** los planes.

Lógica (transacción):
1. Recupera `valor_cuota` actual de cada plan seleccionado
2. Calcula `valor_nuevo = ROUND(valor_actual * (1 + porcentaje / 100), 2)`
3. Actualiza `valor_cuota` en `planes`
4. Inserta registro en `historial_cuota` (valor anterior, valor nuevo, fecha, usuario)
5. Rollback si cualquier paso falla

Devuelve 200 con lista de `{ plan_numero, valor_anterior, valor_nuevo }`

### `recibosController.js`

**`POST /api/recibos/generar`**

Body: `{ "periodo": "2026-04-01", "planes": [1, 2, 3] }` — si `planes` vacío, usa todos los planes `ACTIVO`.

Lógica (transacción):
1. Para cada plan: si ya existe recibo con ese `(plan_numero, periodo)`, lo omite
2. Resuelve snapshots mediante joins: cobrador, obra social, tipo de plan, tipo de grupo, domicilio, titular
3. Inserta en `recibos`
4. Para cada recibo: inserta todos los integrantes del plan en `recibo_integrantes` (snapshot completo)
5. Devuelve los registros creados con sus integrantes (para previsualización inmediata)

**`GET /api/recibos?periodo=YYYY-MM-DD`**
- Lista todos los recibos del período con sus `recibo_integrantes`

**`GET /api/recibos/:id`**
- Detalle de un recibo con sus `recibo_integrantes`

---

## 5. Frontend — Entidades Lookup

### Componente compartido `LookupCRUD`

**Ubicación:** `frontend/src/components/LookupCRUD/LookupCRUD.jsx` + `LookupCRUD.scss`

**Props:**
```typescript
titulo:    string
endpoint:  string
campos: Array<{
  name:       string
  label:      string
  tipo?:      'numero_pk'
  requerido?: boolean
}>
```

**Comportamiento:**
- Tabla con una columna por campo + columna "Acciones" (Editar / Eliminar)
- Botón "+ Nuevo" → abre modal (overlay, `max-width: 960px`)
- Campo `numero_pk` en creación: input numérico opcional con placeholder "Se asigna automáticamente"

### 5 Páginas Wrapper en Dashboard

Cada una es un wrapper mínimo que renderiza `<LookupCRUD>`:
- `frontend/src/pages/DashboardPage/components/Cobradores/Cobradores.jsx`
- `frontend/src/pages/DashboardPage/components/TiposDePlan/TiposDePlan.jsx`
- `frontend/src/pages/DashboardPage/components/ObrasSociales/ObrasSociales.jsx`
- `frontend/src/pages/DashboardPage/components/ServiciosAdicionales/ServiciosAdicionales.jsx`
- `frontend/src/pages/DashboardPage/components/TiposDeGrupo/TiposDeGrupo.jsx`

---

## 6. Frontend — Planes

### Pantalla Principal: Gestion de Planes

**Ubicación:** `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx`

Lista paginada de planes con:
- **Filtros:** estado, cobrador, obra social
- **Columnas:** número, número afiliado, cobrador, obra social, tipo grupo, valor cuota, estado
- **Botones:** "+ Nuevo plan", "Generar recibos"
- **Acciones por fila:** "Editar" (abre modal), "Eliminar" (modal de confirmación)
- **Checkboxes** para aumento masivo (ver sección siguiente)

### Formulario de Plan (Modal, 2+ pestañas)

**Pestaña 1 — Datos del plan:**

| Campo | Tipo UI |
|-------|---------|
| Número de afiliado | Texto + botón "Sugerir" |
| Tipo de plan | Dropdown |
| Cobrador | Dropdown |
| Tipo de grupo | Dropdown |
| Obra social | Dropdown |
| Teléfono 1 | Texto |
| Teléfono 2 | Texto |
| Domicilio | Texto |
| Localidad | Texto |
| Valor cuota | Numérico decimal (ARS) |
| Estado | Radio: ACTIVO / SUSPENDIDO |

**Pestaña 2 — Integrantes:**

Tabla de integrantes vinculados. Columnas: apellido, nombre, tipo doc, nro doc, credencial, rol, servicios. Acciones: "Editar", "Eliminar".

Botón **"+ Agregar integrante"** → abre **sub-modal de búsqueda**:
- Input de búsqueda libre (apellido, nombre, número de documento)
- Llama a `GET /api/personas?search=...` con debounce 300ms
- Resultados: apellido, nombre, tipo doc, nro doc, fecha nacimiento
- Usuario puede:
  - **Seleccionar persona existente** → abre **popup de vinculación [A]** con datos pre-cargados
  - **"Nueva persona"** → abre **popup de vinculación [A]** con datos vacíos

**Popup de vinculación [A]:**

*Sección 1 — Datos personales:*
| Campo | Tipo |
|-------|------|
| Apellido | Texto, requerido |
| Nombre | Texto, requerido |
| Tipo de documento | Select: DNI / LC / LE / PASAPORTE, requerido |
| Número de documento | Texto, requerido |
| Fecha de nacimiento | Date, requerido |
| Fecha de cobertura | Date, requerido |

*Sección 2 — Datos de vinculación:*
| Campo | Tipo |
|-------|------|
| Credencial | Texto, 1 caracter, requerido |
| Rol | Select: titular / integrante. Aviso si ya existe un titular. |
| Servicios adicionales | Checkboxes |

Al guardar:
- Si persona nueva: crea `persona` + `plan_integrante` + `integrante_servicios`
- Si persona existente: actualiza datos personales (aplica a todos sus planes) + crea o actualiza vinculación

**Pestaña 3 — Historial de cuota** (solo en edición):

Tabla con columnas: fecha del cambio, valor anterior, valor nuevo. Carga desde `GET /api/planes/:id/historial-cuota`.

**Validación al guardar:**
- Al menos 1 integrante
- Exactamente 1 integrante con `rol = 'titular'`
- `numero_afiliado` no vacío

### Aumentos Masivos

La tabla de planes suma una columna de **checkboxes**. El header agrega:
- Input numérico "% de aumento"
- Botón "Aplicar aumento" (habilitado si hay al menos 1 plan seleccionado o "Seleccionar todos")

Flujo:
1. Usuario selecciona planes individualmente o con "Seleccionar todos"
2. Ingresa el porcentaje
3. Click "Aplicar aumento" → **modal de confirmación** con tabla: plan, valor actual → valor nuevo
4. Confirma → `PATCH /api/planes/aumento-masivo` → la lista se recarga

### Generación de Recibos

Botón **"Generar recibos"** en el header de la lista (junto a "+ Nuevo plan").

Flujo:
1. Click "Generar recibos" → modal con:
   - Selector de período (mes / año)
   - Opción: todos los planes activos / solo los seleccionados
2. Click "Generar" → `POST /api/recibos/generar`
3. Modal muestra **previsualización** de los recibos generados (lista compacta)
4. Botón **"Imprimir PDF"** → abre ventana nueva con `window.print()`

**Formato de cada recibo en la vista de impresión:**

```
┌──────────────────────────────────────────┐
│  Recibo N°: 00042                        │
│  Período: Abril 2026                     │
│                                          │
│  N° Asociado:   00123                    │
│  Plan:          Plan Familiar            │
│  Tipo de Grupo: Grupo familiar           │
│  Domicilio:     Av. Siempre Viva 742     │
│  Monto cuota:   $ 15.000,00              │
│                                          │
│  Integrantes:                            │
│  Rol      | Apellido | Nombre | Doc      │
│  Titular  | García   | Juan   | DNI ...  │
│  Adher.   | García   | María  | DNI ...  │
│                                          │
│  Fecha de emisión: 11/04/2026            │
└──────────────────────────────────────────┘
```

Cada recibo en su propia página (`page-break-after: always`).

---

## 7. Frontend — Listados

Tres pantallas de consulta bajo "Listados" en el menú. Todas reutilizan el formulario completo de Plan al hacer click.

### Menú Dashboard Completo

```
Mi Cuenta
  └── Datos Personales
Maestros
  ├── Cobradores
  ├── Tipos de Plan
  ├── Obras Sociales
  ├── Servicios Adicionales
  └── Tipos de Grupo
Planes
Listados
  ├── Búsqueda de Afiliados
  ├── Listado de Planes
  └── Planes por Cobrador
[ADMIN ONLY]
Administración
  └── Migraciones
```

### Pantalla: Búsqueda de Afiliados

Input de búsqueda libre (apellido o nombre). Llama a `GET /api/personas?search=...` con debounce 300ms.

Tabla de resultados: apellido, nombre, tipo doc, nro doc, fecha nacimiento.

Click en una fila → **sub-modal** con los planes donde esa persona está activa. Llama a `GET /api/planes?persona_id=X`.

Click en un plan del sub-modal → abre el formulario completo del plan.

### Pantalla: Listado de Planes

Lista de planes con filtros: estado, cobrador, obra social, número de afiliado. Usa `GET /api/planes`.

Sin herramientas masivas (sin checkboxes, sin generación de recibos — esas acciones quedan exclusivamente en "Planes").

Click en una fila → abre el formulario completo del plan.

### Pantalla: Planes por Cobrador

Dropdown para seleccionar cobrador. Al seleccionar → tabla de planes de ese cobrador via `GET /api/planes?cobrador_numero=X`.

Click en una fila → abre el formulario completo del plan.

---

## 8. Manejo de Errores

Cualquier operación que falle muestra el componente `ErrorDisplay`:

```
[!] No se pudo guardar el cobrador.
    [Ver detalle ▾]
    El número 42 ya existe.
```

Mensajes amigables por operación y tipo de error:
- 409 en creación: "El número {X} ya existe."
- 409 en eliminación: "No se puede eliminar, está en uso."
- 422: "Hay campos con errores. Revisá el formulario."
- 404: "El registro no fue encontrado."
- 500/red: "Ocurrió un error inesperado. Intentá de nuevo."

---

## 9. Especificaciones de Interfaz

### Sistema de Temas

Cuatro temas seleccionables: **Claro**, **Oscuro**, **Azul corporativo**, **Verde**.

Implementados como variables CSS en clases aplicadas al `<body>`:

```css
body.theme-claro   { --color-bg: #f5f5f5; --color-primary: #4a90d9; ... }
body.theme-oscuro  { --color-bg: #1a1a2e; --color-primary: #4a90d9; ... }
body.theme-azul    { --color-bg: #e8f0fe; --color-primary: #1a73e8; ... }
body.theme-verde   { --color-bg: #e8f5e9; --color-primary: #2e7d32; ... }
```

Variables mínimas: `--color-bg`, `--color-surface`, `--color-surface-alt`, `--color-primary`, `--color-primary-hover`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-danger`, `--color-row-alt`.

Persistencia: `localStorage` + perfil de usuario en backend (`campo tema_preferido` en `usuarios`).

**Puntos de acceso:**
- **Topbar:** componente `ThemeSwitcher` (4 círculos de color clickeables)
- **Mi Cuenta → Datos Personales:** dropdown con 4 temas

### Layout — Desktop

```
┌─────────────────────────────────────────────────────┐
│ TOPBAR (fijo)  [☰ toggle] GestSocial    [temas][👤] │
├──────────┬──────────────────────────────────────────┤
│ SIDEBAR  │         CONTENIDO PRINCIPAL              │
│ (220px   │         (padding interno 16px)           │
│  o 60px  │                                          │
│ colaps.) │                                          │
└──────────┴──────────────────────────────────────────┘
```

- Sidebar colapsable: expandido (~220px) ↔ colapsado (~60px)
- Toggle con botón «/» en el borde
- Estado persistido en `localStorage`

### Layout — Móvil

```
┌─────────────────────┐
│ TOPBAR (fijo)       │
├─────────────────────┤
│  CONTENIDO          │
│  (scroll vertical)  │
├─────────────────────┤
│ BOTTOM NAV (fijo)   │
│ [Cuenta][Maest][Pla][List][Admin] │
└─────────────────────┘
```

- Sin sidebar
- Bottom navigation bar fija: Mi Cuenta, Maestros, Planes, Listados, [Administración si admin]
- "Maestros" abre menú secundario (sheet) con 5 sub-pantallas
- Breakpoint: `≤ 768px`

### Tablas

| Propiedad | Desktop | Móvil |
|-----------|---------|-------|
| Altura de fila | ~36px | ~48px |
| Tipografía | 13–14px | 14–15px |
| Columnas | Todas | Solo esenciales |
| Cebrado | Filas pares con `--color-row-alt` | Igual |
| Header | Fijo | Fijo |

En móvil, columnas no esenciales se ocultan con `display: none`.

### Formularios

**Desktop:** campos cortos (número, fecha, credencial) en grilla de 2–3 columnas; campos largos (domicilio, nombre completo) en ancho completo.

**Móvil:** siempre una columna.

Implementación: CSS Grid con `grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))`.

### Tipografía

- Fuente: `Inter` (Google Fonts — `weights: 400, 500, 600`)
- Tamaño base: `14px` desktop, `15px` móvil
- Headings de sección: `16px`, `font-weight: 600`
- Labels de formulario: `12px`, `font-weight: 500`, `text-transform: uppercase`, `letter-spacing: 0.05em`

---

## 10. Archivos a Crear/Modificar

### Backend

| Archivo | Acción |
|---------|--------|
| `backend/src/migrations/versions/1.0.1_tablas_lookup/upgrade.sql` | Crear |
| `backend/src/migrations/versions/1.0.1_tablas_lookup/downgrade.sql` | Crear |
| `backend/src/migrations/versions/1.0.2_planes_y_personas/upgrade.sql` | Crear |
| `backend/src/migrations/versions/1.0.2_planes_y_personas/downgrade.sql` | Crear |
| `backend/src/migrations/versions/1.0.3_historial_cuota_y_recibos/upgrade.sql` | Crear |
| `backend/src/migrations/versions/1.0.3_historial_cuota_y_recibos/downgrade.sql` | Crear |
| `backend/src/models/Cobrador.js` | Crear |
| `backend/src/models/TipoDePlan.js` | Crear |
| `backend/src/models/ObraSocial.js` | Crear |
| `backend/src/models/ServicioAdicional.js` | Crear |
| `backend/src/models/TipoDeGrupo.js` | Crear |
| `backend/src/models/Persona.js` | Crear |
| `backend/src/models/Plan.js` | Crear |
| `backend/src/models/PlanIntegrante.js` | Crear |
| `backend/src/models/IntegranteServicio.js` | Crear |
| `backend/src/models/HistorialCuota.js` | Crear |
| `backend/src/models/Recibo.js` | Crear |
| `backend/src/models/ReciboIntegrante.js` | Crear |
| `backend/src/controllers/migrationsController.js` | Crear |
| `backend/src/controllers/lookupController.js` | Crear |
| `backend/src/controllers/personasController.js` | Crear |
| `backend/src/controllers/planesController.js` | Crear |
| `backend/src/controllers/recibosController.js` | Crear |
| `backend/src/routes/migrations.js` | Crear |
| `backend/src/routes/lookup.js` | Crear |
| `backend/src/routes/personas.js` | Crear |
| `backend/src/routes/planes.js` | Crear |
| `backend/src/routes/recibos.js` | Crear |
| `backend/src/index.js` | Modificar (montar nuevas rutas) |

### Frontend

| Archivo | Acción |
|---------|--------|
| `frontend/src/components/MigrationsDashboard/MigrationsDashboard.jsx` | Crear |
| `frontend/src/components/MigrationsDashboard/tabs/VersionesTab.jsx` | Crear |
| `frontend/src/components/MigrationsDashboard/tabs/HistorialTab.jsx` | Crear |
| `frontend/src/components/MigrationsDashboard/tabs/EstadisticasTab.jsx` | Crear |
| `frontend/src/components/MigrationsDashboard/modals/PreviewModal.jsx` | Crear |
| `frontend/src/components/LookupCRUD/LookupCRUD.jsx` | Crear |
| `frontend/src/components/LookupCRUD/LookupCRUD.scss` | Crear |
| `frontend/src/components/ErrorDisplay/ErrorDisplay.jsx` | Crear |
| `frontend/src/components/ErrorDisplay/ErrorDisplay.scss` | Crear |
| `frontend/src/services/migrationsService.js` | Crear |
| `frontend/src/services/lookupService.js` | Crear |
| `frontend/src/services/planesService.js` | Crear |
| `frontend/src/services/personasService.js` | Crear |
| `frontend/src/services/recibosService.js` | Crear |
| `frontend/src/pages/DashboardPage/components/Cobradores/Cobradores.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/TiposDePlan/TiposDePlan.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/ObrasSociales/ObrasSociales.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/ServiciosAdicionales/ServiciosAdicionales.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/TiposDeGrupo/TiposDeGrupo.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.scss` | Crear |
| `frontend/src/pages/DashboardPage/components/BusquedaAfiliados/BusquedaAfiliados.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/ListadoPlanes/ListadoPlanes.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/PlanesPorCobrador/PlanesPorCobrador.jsx` | Crear |
| `frontend/src/pages/DashboardPage/DashboardPage.jsx` | Modificar (menú + módulos) |
| `frontend/src/styles/themes.scss` | Crear |
| `frontend/src/styles/variables.scss` | Crear |
| `frontend/src/components/ThemeSwitcher/ThemeSwitcher.jsx` | Crear |

---

## 11. Flujos de Datos Clave

### Flujo de Ejecución de Migraciones (Transversal)

```
1. Admin navega a Administración → Migraciones
   └─ MigrationsDashboard carga versiones, historial, estadísticas

2. Admin ve "Versión actual: 1.0.0. Siguiente: 1.0.1_tablas_lookup"
   └─ Click en botón "Upgrade" para 1.0.1

3. Frontend GET /api/migrations/preview/1.0.1/upgrade
   └─ Backend retorna SQL + descripción

4. Modal de preview muestra SQL de 1.0.1
   └─ Click "Confirmar"

5. UI entra en estado loading
   └─ Frontend POST /api/migrations/execute { direction: "upgrade" }

6. Backend ejecuta SQL en transacción, registra en historial_migraciones
   └─ Response: { success: true, version: "1.0.1", duration: "2.5s" }

7. Modal de éxito, se recarga:
   ├─ Tab Versiones: versión actual = 1.0.1, siguiente = 1.0.2
   ├─ Tab Historial: nuevo registro de migración
   └─ Tab Estadísticas: nuevas tablas aparecen

8. Admin repite para 1.0.2 y 1.0.3
   └─ Sistema está listo para datos: tablas de entidades, planes, historial, recibos creadas
```

### Flujo de Creación de Plan

```
1. Usuario en "Planes" → click "+ Nuevo plan"
   └─ Modal formulario abre (pestaña "Datos del plan")

2. Usuario rellena campos, busca cobrador/tipos, etc.
   └─ Click "Siguiente" → pestaña "Integrantes"

3. En pestaña "Integrantes": click "+ Agregar integrante"
   └─ Sub-modal de búsqueda abre

4. Usuario busca persona o crea nueva
   └─ Selecciona → popup [A] abre con datos personales + vinculación

5. Rellena datos y click "Guardar integrante"
   └─ Popup cierra, tabla de integrantes actualiza

6. Agrega otro integrante (ídem)
   └─ Debe haber exactamente 1 titular

7. Click "Guardar plan"
   └─ Frontend POST /api/planes
   └─ Backend: transacción crea plan + integrantes + servicios
   └─ Response: { plan_numero: 42, ... }

8. Modal cierra, lista de planes recarga
   └─ Nuevo plan visible en tabla
```

### Flujo de Generación de Recibos

```
1. Usuario en "Planes" → click "Generar recibos"
   └─ Modal con selector de período abre

2. Selecciona mes/año y "Todos los planes activos"
   └─ Click "Generar"

3. Frontend POST /api/recibos/generar { periodo: "2026-04-01", planes: [] }
   └─ Backend: para cada plan activo, inserta recibo + integrantes (snapshots)

4. Modal muestra lista compacta de recibos generados
   └─ Click "Imprimir PDF"

5. Nueva ventana abre con recibos en formato imprimible
   └─ Trigger window.print() para imprenta
```

---

## 12. Consideraciones de Seguridad

1. **Autenticación:** JWT requerido en todas las rutas
2. **Autorización:**
   - Rutas `/api/migrations/*` restringidas a admin
   - Rutas `/api/lookup/*`, `/api/planes/*`, `/api/recibos/*` requieren autenticación
   - Usuario no puede acceder a datos de otros usuarios (planteado como futura validación si roles lo requieren)
3. **SQL Injection:** SQL viene de archivos estáticos en el servidor, no de entrada de usuario
4. **Transacciones:** Todas las operaciones críticas están en transacciones para garantizar consistencia
5. **Auditoría:** Historial de migraciones registra duración y estado; historial_cuota registra cambios en cuotas

---

## 13. Métricas de Éxito

- ✅ Panel de Migraciones permite admin ejecutar migraciones 1.0.1, 1.0.2, 1.0.3
- ✅ CRUD de entidades lookup funciona (crear, leer, actualizar, eliminar)
- ✅ Creación de planes con integrantes, servicios, validaciones
- ✅ Edición de planes con sincronización de integrantes
- ✅ Aumentos masivos de cuota registran historial
- ✅ Generación de recibos con snapshots correctos
- ✅ Listados de búsqueda, planes, planes por cobrador funcionan
- ✅ Usuarios no-admin no ven panel de migraciones
- ✅ Sistema de temas funciona en todos los componentes
- ✅ Layout responsive en desktop y móvil

---

**Fin de la especificación unificada.**
