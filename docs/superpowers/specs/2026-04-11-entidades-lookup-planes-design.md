# Entidades Lookup + Planes — Design Spec

**Fecha:** 2026-04-11  
**Alcance:** Migraciones, CRUD de entidades lookup (1-5), modelo de Planes y Personas, interfaz de Planes  
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
```

**Seed en `upgrade.sql`:**
```sql
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
- Busca por `apellido` o `nombre` (LIKE `%texto%`), máximo 10 resultados.
- Devuelve: `id`, `apellido`, `nombre`, `fecha_nacimiento`, `fecha_cobertura`.
- Usado exclusivamente desde el formulario de Plan (autocomplete).

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

*(Pantalla a implementar en iteración posterior — spec de interfaz incluida para referencia)*

### Pantalla principal

Lista paginada de planes con:
- Filtros: estado, cobrador, obra social
- Columnas: número, número afiliado, cobrador, obra social, tipo grupo, valor cuota, estado
- Botón "+ Nuevo plan"
- Acciones por fila: Ver/Editar, Eliminar

### Formulario de Plan (modal, 2 pestañas)

**Pestaña 1 — Datos del plan:**

| Campo | Tipo |
|-------|------|
| Número de afiliado | Texto + botón "Sugerir" (llama a `/planes/siguiente-numero-afiliado`) |
| Tipo de plan | Dropdown (cargado desde `/lookup/tipos-de-plan`) |
| Cobrador | Dropdown (cargado desde `/lookup/cobradores`) |
| Tipo de grupo | Dropdown (cargado desde `/lookup/tipos-de-grupo`) |
| Obra social | Dropdown (cargado desde `/lookup/obras-sociales`) |
| Teléfono 1 | Texto |
| Teléfono 2 | Texto |
| Domicilio | Texto |
| Localidad | Texto |
| Valor cuota | Numérico decimal |
| Estado | ACTIVO / SUSPENDIDO |

**Pestaña 2 — Integrantes:**

- Tabla de integrantes con: apellido, nombre, credencial, rol, servicios contratados. Acciones: editar, eliminar.
- Botón "+ Agregar integrante" → sub-modal con:
  - Autocomplete de búsqueda de personas (llama a `/api/personas?search=...`)
  - Si no existe: formulario inline con apellido, nombre, fecha nacimiento, fecha cobertura
  - Campo credencial (1 caracter, requerido)
  - Checkboxes de servicios adicionales
  - Selector de rol (titular / integrante) con aviso si ya hay un titular

**Validación al guardar:**
- Al menos 1 integrante
- Exactamente 1 integrante con rol `titular`
- `numero_afiliado` no vacío

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

## 7. Archivos a crear/modificar

### Backend

| Archivo | Acción |
|---------|--------|
| `backend/src/migrations/versions/1.0.1_tablas_lookup/upgrade.sql` | Crear |
| `backend/src/migrations/versions/1.0.1_tablas_lookup/downgrade.sql` | Crear |
| `backend/src/migrations/versions/1.0.2_planes_y_personas/upgrade.sql` | Crear |
| `backend/src/migrations/versions/1.0.2_planes_y_personas/downgrade.sql` | Crear |
| `backend/src/models/Cobrador.js` | Crear |
| `backend/src/models/TipoDePlan.js` | Crear |
| `backend/src/models/ObraSocial.js` | Crear |
| `backend/src/models/ServicioAdicional.js` | Crear |
| `backend/src/models/TipoDeGrupo.js` | Crear |
| `backend/src/models/Persona.js` | Crear |
| `backend/src/models/Plan.js` | Crear |
| `backend/src/models/PlanIntegrante.js` | Crear |
| `backend/src/models/IntegranteServicio.js` | Crear |
| `backend/src/controllers/lookupController.js` | Crear |
| `backend/src/controllers/personasController.js` | Crear |
| `backend/src/controllers/planesController.js` | Crear |
| `backend/src/routes/lookup.js` | Crear |
| `backend/src/routes/personas.js` | Crear |
| `backend/src/routes/planes.js` | Crear |
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
| `frontend/src/pages/DashboardPage/components/Cobradores/Cobradores.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/TiposDePlan/TiposDePlan.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/ObrasSociales/ObrasSociales.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/ServiciosAdicionales/ServiciosAdicionales.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/TiposDeGrupo/TiposDeGrupo.jsx` | Crear |
| `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx` | Crear (iteración posterior) |
| `frontend/src/pages/DashboardPage/DashboardPage.jsx` | Modificar (menú + módulos) |
