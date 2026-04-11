# Entidades Lookup + Planes — Design Spec

**Fecha:** 2026-04-11  
**Alcance:** Migraciones, CRUD de entidades lookup (1-5), modelo de Planes y Personas, interfaz de Planes, Historial/Recibos, Listados, UI  
**Estado:** Aprobado por usuario — pendiente de implementación

---

## Contexto

El sistema anterior fue descartado. La base existente es:
- Backend: auth completo (`/api/auth`, modelo `Usuario`, migración `1.0.0_usuarios`)
- Frontend: LandingPage, LoginPage, RegisterPage, DashboardPage (solo `DatosPersonales`)

---

## 1. Base de datos

### Migración `1.0.1_tablas_lookup`

Crea las 5 tablas de entidades de lookup. PKs enteras sin `AUTO_INCREMENT` — el valor lo determina el backend.

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

**`downgrade.sql`:** DROP TABLE en este orden (dependencias primero):
```sql
DROP TABLE IF EXISTS tipos_de_grupo;
DROP TABLE IF EXISTS servicios_adicionales;
DROP TABLE IF EXISTS obras_sociales;
DROP TABLE IF EXISTS tipos_de_plan;
DROP TABLE IF EXISTS cobradores;
```
(La migración `1.0.2` que crea las FKs debe haberse revertido antes de ejecutar este downgrade.)

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

**`downgrade.sql` para 1.0.2:** DROP TABLE en este orden:
```sql
DROP TABLE IF EXISTS integrante_servicios;
DROP TABLE IF EXISTS plan_integrantes;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS personas;
```

**Constraint de titular:** exactamente un `plan_integrante` por plan con `rol='titular'` — validado a nivel backend (no FK), porque MySQL no soporta CHECK con subqueries.

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
  periodo               DATE         NOT NULL,   -- primer día del mes: 2026-04-01
  numero_afiliado       VARCHAR(50)  NOT NULL,   -- snapshot
  titular_apellido      VARCHAR(100) NOT NULL,   -- snapshot
  titular_nombre        VARCHAR(100) NOT NULL,   -- snapshot
  obra_social_nombre    VARCHAR(100) NOT NULL,   -- snapshot
  tipo_plan_nombre      VARCHAR(100) NOT NULL,   -- snapshot
  tipo_de_grupo_nombre  VARCHAR(100) NOT NULL,   -- snapshot
  cobrador_apellido     VARCHAR(100) NOT NULL,   -- snapshot
  cobrador_nombre       VARCHAR(100) NOT NULL,   -- snapshot
  domicilio             VARCHAR(255),            -- snapshot
  valor_cuota           DECIMAL(10,2) NOT NULL,  -- snapshot
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
  apellido          VARCHAR(100) NOT NULL,   -- snapshot
  nombre            VARCHAR(100) NOT NULL,   -- snapshot
  tipo_documento    ENUM('DNI','LC','LE','PASAPORTE') NOT NULL,  -- snapshot
  numero_documento  VARCHAR(20)  NOT NULL,   -- snapshot
  fecha_nacimiento  DATE         NOT NULL,   -- snapshot
  fecha_cobertura   DATE         NOT NULL,   -- snapshot
  rol               ENUM('titular','integrante') NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE
);
```

**`downgrade.sql` para 1.0.3:**
```sql
DROP TABLE IF EXISTS recibo_integrantes;
DROP TABLE IF EXISTS recibos;
DROP TABLE IF EXISTS historial_cuota;
```

---

## 2. Backend — Entidades lookup

### Arquitectura

Un único `lookupController.js` genérico parametrizado por configuración. Una sola ruta dinámica:

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
    campos: ['cobrador_apellido', 'cobrador_nombre'],  // orden de display
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

### Lógica de cada operación

**`GET /api/lookup/:entidad`**
- Devuelve todos los registros ordenados por `pkField` ASC.

**`POST /api/lookup/:entidad`**
- Valida que todos los `campos` requeridos no estén vacíos → 422.
- Si se provee `pkField`: verifica unicidad → 409 `"El número X ya existe"`.
- Si no se provee: `SELECT MAX(pkField) + 1` (o 1 si vacío) como PK.
- Inserta y devuelve 201.

**`PUT /api/lookup/:entidad/:numero`**
- Verifica existencia → 404.
- Valida campos → 422.
- Actualiza `fecha_actualizacion` + campos. Devuelve 200.

**`DELETE /api/lookup/:entidad/:numero`**
- Verifica existencia → 404.
- Para cada entrada en `refsCheck`: `COUNT(*)` con el FK → si > 0, devuelve 409 `"No se puede eliminar, está en uso"`.
- Elimina y devuelve 200.

---

## 3. Backend — Planes y Personas

### `personasController.js`

**`GET /api/personas?search=texto`**
- Busca por `apellido`, `nombre` o `numero_documento` (LIKE `%texto%`), máximo 10 resultados.
- Devuelve: `id`, `apellido`, `nombre`, `tipo_documento`, `numero_documento`, `fecha_nacimiento`, `fecha_cobertura`.
- Usado exclusivamente desde el formulario de Plan (autocomplete de búsqueda de integrante).
- **Comportamiento de edición compartida:** si se editan los datos personales de una persona existente, el cambio se aplica globalmente (afecta a todos los planes donde esté vinculada esa persona).

No se exponen endpoints de creación/edición/eliminación directa de personas.

### `planesController.js`

**`GET /api/planes`**
- Filtros opcionales: `estado`, `cobrador_numero`, `os_numero`.
- Paginación: `page`, `limit` (default 20).
- Devuelve lista con datos del plan + nombre de cobrador, obra social, tipo (joins).

**`GET /api/planes/:id`**
- Detalle completo: datos del plan + integrantes con sus datos de persona, credencial, rol y servicios.

**`GET /api/planes/siguiente-numero-afiliado`**
- Calcula `MAX(CAST(numero_afiliado AS UNSIGNED)) + 1`.
- Si no hay registros o ninguno es numérico, devuelve `1`.
- Devuelve: `{ siguiente: "42" }`.
- **⚠️ Importante:** Esta ruta debe registrarse en Express **antes** que `GET /api/planes/:id`, de lo contrario Express captura el literal `"siguiente-numero-afiliado"` como valor de `:id`.

**`POST /api/planes`** (transacción)
1. Valida campos del plan (numero_afiliado único, al menos 1 integrante, exactamente 1 titular).
2. Para cada integrante:
   - Si `persona_id` provisto: verifica existencia.
   - Si no: crea `persona` nueva con los datos provistos.
3. Crea `plan`.
4. Crea `plan_integrantes` con `credencial` y `rol`.
5. Crea `integrante_servicios` para cada servicio seleccionado.
6. Si cualquier paso falla: rollback completo.

**`PUT /api/planes/:id`** (transacción)
- Actualiza datos del plan.
- Sincroniza integrantes: elimina los que no estén en la nueva lista, actualiza los existentes, agrega nuevos.
- Valida exactamente 1 titular antes de commit.

**`DELETE /api/planes/:id`**
- Elimina plan + `plan_integrantes` + `integrante_servicios` en cascada (la FK CASCADE lo maneja).
- Las personas no se eliminan (pueden pertenecer a otros planes).

**`GET /api/planes/:id/historial-cuota`**
- Devuelve todos los registros de `historial_cuota` para el plan, ordenados por `fecha_cambio DESC`.

**`PATCH /api/planes/aumento-masivo`** *(registrar antes que `/:id`)*

Body: `{ "planes": [1, 2, 3], "porcentaje": 10.5 }` — si `planes` es array vacío, aplica a **todos** los planes.

Lógica (una transacción):
1. Recupera `valor_cuota` actual de cada plan seleccionado.
2. Calcula `valor_nuevo = ROUND(valor_actual * (1 + porcentaje / 100), 2)`.
3. Actualiza `valor_cuota` en `planes`.
4. Inserta registro en `historial_cuota` (valor anterior, valor nuevo, fecha, usuario).
5. Rollback si cualquier paso falla.

Devuelve 200 con lista de `{ plan_numero, valor_anterior, valor_nuevo }` por cada plan afectado.

---

### `recibosController.js`

**`POST /api/recibos/generar`**

Body: `{ "periodo": "2026-04-01", "planes": [1, 2, 3] }` — si `planes` vacío, usa todos los planes `ACTIVO`.

Lógica (transacción):
1. Para cada plan: si ya existe recibo con ese `(plan_numero, periodo)`, lo omite sin error.
2. Resuelve snapshots mediante joins: cobrador, obra social, tipo de plan, tipo de grupo, domicilio, titular.
3. Inserta en `recibos`.
4. Para cada recibo: inserta todos los integrantes del plan en `recibo_integrantes` (snapshot completo).
5. Devuelve los registros creados con sus integrantes (para previsualización inmediata).

**`GET /api/recibos?periodo=YYYY-MM-DD`**
- Lista todos los recibos del período con sus `recibo_integrantes`.

**`GET /api/recibos/:id`**
- Detalle de un recibo con sus `recibo_integrantes`.

---

## 4. Frontend — Entidades lookup

### Componente compartido `LookupCRUD`

**Ubicación:** `frontend/src/components/LookupCRUD/LookupCRUD.jsx` + `LookupCRUD.scss`

**Props:**
```typescript
titulo:    string               // "Cobradores"
endpoint:  string               // "/lookup/cobradores"
campos: Array<{
  name:       string            // nombre del campo en el objeto
  label:      string            // label visible
  tipo?:      'numero_pk'       // si es la PK manual; omitir para texto normal
  requerido?: boolean
}>
```

**Comportamiento:**
- Tabla con una columna por campo + columna "Acciones" (Editar / Eliminar).
- Botón "+ Nuevo" → abre modal (overlay, `max-width: 960px`).
- Campo `numero_pk` en creación: input numérico opcional con placeholder "Se asigna automáticamente".
- Campo `numero_pk` en edición: deshabilitado (no editable).
- Eliminar: modal de confirmación pequeño (`max-width: 480px`). Si el backend responde 409, muestra el mensaje sin ejecutar la eliminación.

### Componente `ErrorDisplay`

**Ubicación:** `frontend/src/components/ErrorDisplay/ErrorDisplay.jsx`

Usado en todos los módulos. Recibe:
```javascript
{ mensaje: string, detalle?: string }
```
Muestra el `mensaje` amigable y un enlace "Ver detalle" que expande el `detalle` técnico (texto del error del backend).

### 5 páginas wrapper en el dashboard

```
DashboardPage/components/
├── Cobradores/Cobradores.jsx
├── TiposDePlan/TiposDePlan.jsx
├── ObrasSociales/ObrasSociales.jsx
├── ServiciosAdicionales/ServiciosAdicionales.jsx
└── TiposDeGrupo/TiposDeGrupo.jsx
```

Cada una es un wrapper mínimo que renderiza `<LookupCRUD>` con su configuración.

### Menú del dashboard

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
```

---

## 5. Frontend — Planes

### Pantalla principal

Lista paginada de planes con:
- Filtros: estado, cobrador, obra social
- Columnas: número, número afiliado, cobrador, obra social, tipo grupo, valor cuota, estado
- Botón "+ Nuevo plan"
- Acciones por fila: botón "Editar" (abre modal), botón "Eliminar" (modal de confirmación)

### Formulario de Plan (modal, 2 pestañas)

**Pestaña 1 — Datos del plan:**

| Campo | Tipo UI |
|-------|---------|
| Número de afiliado | Texto + botón "Sugerir" (llama a `GET /api/planes/siguiente-numero-afiliado`) |
| Tipo de plan | Dropdown (cargado desde `GET /api/lookup/tipos-de-plan`) |
| Cobrador | Dropdown (cargado desde `GET /api/lookup/cobradores`) |
| Tipo de grupo | Dropdown (cargado desde `GET /api/lookup/tipos-de-grupo`) |
| Obra social | Dropdown (cargado desde `GET /api/lookup/obras-sociales`) |
| Teléfono 1 | Texto |
| Teléfono 2 | Texto |
| Domicilio | Texto |
| Localidad | Texto |
| Valor cuota | Numérico decimal (ARS) |
| Estado | Radio o select: ACTIVO / SUSPENDIDO |

**Pestaña 2 — Integrantes:**

Tabla de integrantes ya vinculados al plan. Columnas: apellido, nombre, tipo doc, nro doc, credencial, rol, servicios. Acciones por fila: "Editar", "Eliminar".

Botón **"+ Agregar integrante"** → abre **sub-modal de búsqueda**:

- Input de búsqueda libre (apellido, nombre, número de documento).
- Llama a `GET /api/personas?search=...` en tiempo real (debounce 300ms).
- Resultados muestran: apellido, nombre, tipo doc, nro doc, fecha nacimiento.
- El usuario puede:
  - **Seleccionar una persona existente** → cierra búsqueda y abre el **popup de vinculación [A]** con datos personales pre-cargados.
  - **"Nueva persona"** → cierra búsqueda y abre el **popup de vinculación [A]** con datos personales vacíos.

**Popup de vinculación [A]** (usado tanto para agregar como para editar un integrante):

Dos secciones dentro del mismo popup:

*Sección 1 — Datos personales* (campos de la entidad `personas`):
| Campo | Tipo |
|-------|------|
| Apellido | Texto, requerido |
| Nombre | Texto, requerido |
| Tipo de documento | Select: DNI / LC / LE / PASAPORTE, requerido |
| Número de documento | Texto, requerido |
| Fecha de nacimiento | Date, requerido |
| Fecha de cobertura | Date, requerido |

*Sección 2 — Datos de vinculación* (campos de `plan_integrantes`):
| Campo | Tipo |
|-------|------|
| Credencial | Texto, 1 caracter, requerido |
| Rol | Select: titular / integrante. Aviso si ya existe un titular en el plan. |
| Servicios adicionales | Checkboxes (cargados desde `GET /api/lookup/servicios-adicionales`) |

Al guardar el popup [A]:
- Si es persona nueva: crea `persona` + `plan_integrante` + `integrante_servicios`.
- Si es persona existente: actualiza datos personales de la persona (aplica a todos sus planes) + crea o actualiza `plan_integrante` + `integrante_servicios`.

**Validación al guardar el plan:**
- Al menos 1 integrante
- Exactamente 1 integrante con `rol = 'titular'`
- `numero_afiliado` no vacío

**Pestaña adicional — Historial de cuota** (solo en edición):

Tabla con columnas: fecha del cambio, valor anterior, valor nuevo. Carga desde `GET /api/planes/:id/historial-cuota`.

---

### Aumentos masivos — dentro de la pantalla de Planes

La tabla de planes suma una columna de **checkboxes**. El header de la lista agrega:

- Input numérico "% de aumento"
- Botón "Aplicar aumento" (habilitado si hay al menos 1 plan seleccionado o si se usa "todos")

Flujo:
1. Usuario selecciona planes individualmente o con "Seleccionar todos".
2. Ingresa el porcentaje.
3. Click "Aplicar aumento" → **modal de confirmación** con tabla: plan, valor actual → valor nuevo.
4. Confirma → `PATCH /api/planes/aumento-masivo` → la lista se recarga con los nuevos valores.

---

### Generación de recibos — dentro de la pantalla de Planes

Botón **"Generar recibos"** en el header de la lista (junto a "+ Nuevo plan").

Flujo:
1. Click "Generar recibos" → modal con:
   - Selector de período (mes / año).
   - Opción: todos los planes activos / solo los seleccionados.
2. Click "Generar" → `POST /api/recibos/generar`.
3. El modal muestra **previsualización** de los recibos generados (lista compacta).
4. Botón **"Imprimir PDF"** → abre ventana nueva con todos los recibos en formato imprimible; dispara `window.print()`.

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
│  (fecha nacimiento + fecha cobertura)    │
│                                          │
│  Fecha de emisión: 11/04/2026            │
└──────────────────────────────────────────┘
```

Cada recibo ocupa su propia página (`page-break-after: always` en CSS de impresión).

---

## 6. Manejo de errores — regla general

Aplica a **todos** los módulos del sistema.

Cualquier operación que falle (red, validación backend, error de BD) muestra el componente `ErrorDisplay`:

```
[!] No se pudo guardar el cobrador.      ← mensaje amigable
    [Ver detalle ▾]                       ← expandible
    El número 42 ya existe.               ← detalle técnico (colapsado por defecto)
```

Los mensajes amigables se definen por operación y tipo de error:
- 409 en creación: "El número {X} ya existe."
- 409 en eliminación: "No se puede eliminar, está en uso."
- 422: "Hay campos con errores. Revisá el formulario."
- 404: "El registro no fue encontrado."
- 500/red: "Ocurrió un error inesperado. Intentá de nuevo."

---

## 7. Listados

Tres pantallas de consulta/navegación agrupadas bajo "Listados" en el menú. Todas reutilizan el formulario completo de Plan (con todas sus funcionalidades) al hacer click en un plan.

### Menú del dashboard

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
```

---

### Pantalla: Búsqueda de Afiliados

Input de búsqueda libre (apellido o nombre). Llama a `GET /api/personas?search=...` con debounce 300ms.

Tabla de resultados: apellido, nombre, tipo doc, nro doc, fecha nacimiento.

Click en una fila → **sub-modal** con los planes donde esa persona está activa. Llama a `GET /api/planes?persona_id=X`. Columnas: nro afiliado, tipo de plan, obra social, estado.

Click en un plan del sub-modal → abre el formulario completo del plan (mismo componente que la pantalla Planes, con todas sus funcionalidades).

---

### Pantalla: Listado de Planes

Lista de planes con filtros: estado, cobrador, obra social, número de afiliado. Usa `GET /api/planes` (endpoint existente).

Sin herramientas de gestión masiva (sin checkboxes de aumento, sin generación de recibos — esas acciones quedan exclusivamente en la pantalla Planes).

Click en una fila → abre el formulario completo del plan.

---

### Pantalla: Planes por Cobrador

Dropdown para seleccionar cobrador (cargado desde `GET /api/lookup/cobradores`). Al seleccionar → tabla de planes de ese cobrador via `GET /api/planes?cobrador_numero=X`. Columnas: nro afiliado, tipo de plan, obra social, tipo de grupo, valor cuota, estado.

Click en una fila → abre el formulario completo del plan.

---

### Backend — modificación al endpoint existente

`GET /api/planes` suma el filtro opcional `persona_id`: hace join con `plan_integrantes` para devolver los planes donde esa persona es integrante. No se crean nuevos endpoints.

---

## 8. Archivos a crear/modificar

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
| `backend/src/controllers/lookupController.js` | Crear |
| `backend/src/controllers/personasController.js` | Crear |
| `backend/src/controllers/planesController.js` | Crear |
| `backend/src/controllers/recibosController.js` | Crear |
| `backend/src/routes/lookup.js` | Crear |
| `backend/src/routes/personas.js` | Crear |
| `backend/src/routes/planes.js` | Crear |
| `backend/src/routes/recibos.js` | Crear |
| `backend/src/index.js` | Modificar (montar nuevas rutas) |

### Frontend

| Archivo | Acción |
|---------|--------|
| `frontend/src/components/LookupCRUD/LookupCRUD.jsx` | Crear |
| `frontend/src/components/LookupCRUD/LookupCRUD.scss` | Crear |
| `frontend/src/components/ErrorDisplay/ErrorDisplay.jsx` | Crear |
| `frontend/src/components/ErrorDisplay/ErrorDisplay.scss` | Crear |
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

## 9. Especificaciones de Interfaz

### Sistema de temas

Cuatro temas seleccionables: **Claro**, **Oscuro**, **Azul corporativo**, **Verde**.

Implementados como variables CSS en clases aplicadas al `<body>`:

```css
/* Ejemplo de estructura */
body.theme-claro   { --color-bg: #f5f5f5; --color-surface: #ffffff; --color-primary: #4a90d9; --color-text: #1a1a1a; ... }
body.theme-oscuro  { --color-bg: #1a1a2e; --color-surface: #16213e; --color-primary: #4a90d9; --color-text: #e0e0e0; ... }
body.theme-azul    { --color-bg: #e8f0fe; --color-surface: #ffffff; --color-primary: #1a73e8; --color-text: #1a1a1a; ... }
body.theme-verde   { --color-bg: #e8f5e9; --color-surface: #ffffff; --color-primary: #2e7d32; --color-text: #1a1a1a; ... }
```

Variables mínimas requeridas: `--color-bg`, `--color-surface`, `--color-surface-alt`, `--color-primary`, `--color-primary-hover`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-danger`, `--color-row-alt`.

El tema seleccionado se persiste en `localStorage` (carga inmediata sin flash) y también en el perfil del usuario en backend (campo `tema_preferido` en tabla `usuarios`).

**Puntos de acceso al selector:**
- **Topbar:** componente `ThemeSwitcher` con 4 círculos de color clickeables, siempre visible
- **Mi Cuenta → Datos Personales:** dropdown con los 4 temas

---

### Layout — Desktop

```
┌─────────────────────────────────────────────────────┐
│ TOPBAR (fijo)  [☰ toggle] GestSocial    [temas][👤] │
├──────────┬──────────────────────────────────────────┤
│ SIDEBAR  │                                          │
│ (220px   │         CONTENIDO PRINCIPAL              │
│  o 60px  │         (sin margen excesivo)            │
│ colaps.) │                                          │
└──────────┴──────────────────────────────────────────┘
```

- Sidebar colapsable: expandido (~220px, íconos + texto) ↔ colapsado (~60px, solo íconos)
- Toggle con botón `«` / `»` en el borde del sidebar
- Estado persistido en `localStorage`
- Contenido principal: padding interno `16px`, sin margen adicional

---

### Layout — Móvil

```
┌─────────────────────┐
│ TOPBAR (fijo)       │
├─────────────────────┤
│                     │
│  CONTENIDO          │
│  (scroll vertical)  │
│                     │
├─────────────────────┤
│ BOTTOM NAV (fijo)   │
│ [Cuenta][Maest][Pla][List] │
└─────────────────────┘
```

- Sin sidebar
- Bottom navigation bar fija: Mi Cuenta, Maestros, Planes, Listados (íconos + etiqueta corta)
- "Maestros" abre un menú secundario (sheet o drawer) con las 5 sub-pantallas
- Breakpoint mobile: `≤ 768px`

---

### Tablas

| Propiedad | Desktop | Móvil |
|-----------|---------|-------|
| Altura de fila | ~36px | ~48px |
| Tipografía | 13–14px | 14–15px |
| Columnas | Todas | Solo esenciales (resto en detalle) |
| Cebrado | Filas pares con `--color-row-alt` | Igual |
| Header | Fijo con scroll vertical | Fijo |

En móvil, columnas no esenciales se ocultan con `display: none` en el breakpoint. El botón de acciones abre un menú contextual o navega al detalle.

---

### Formularios

Layout mixto:
- **Desktop:** campos cortos (número, fecha, credencial, tipo doc, valor) en grilla de 2–3 columnas; campos largos (domicilio, localidad, nombre completo) en ancho completo
- **Móvil:** siempre una columna, sin grilla

Implementación: CSS Grid con `grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))` para campos cortos; clase `.field--full` para forzar ancho completo.

---

### Tipografía

- Fuente: `Inter` (Google Fonts — `weights: 400, 500, 600`)
- Tamaño base: `14px` desktop, `15px` móvil
- Headings de sección: `16px`, `font-weight: 600`
- Labels de formulario: `12px`, `font-weight: 500`, `text-transform: uppercase`, `letter-spacing: 0.05em`
