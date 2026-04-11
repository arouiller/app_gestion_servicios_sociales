# Arquitectura de la Aplicación — GestSocial

**Versión documentada:** V_1.0.1  
**Fecha:** 2026-04-11  
**Propósito:** Referencia de arquitectura, patrones y convenciones para nuevos desarrollos.

---

## 1. Visión general

Aplicación web de gestión de servicios sociales. Arquitectura cliente-servidor clásica:

- **Backend:** API REST en Node.js/Express con Sequelize (ORM) sobre MySQL.
- **Frontend:** React SPA con React Router, comunicación via Axios.
- **Deployment target:** Hostinger shared hosting (Node.js via cPanel, MySQL 8.0, frontend estático en `public_html/`).

---

## 2. Estructura de carpetas

```
App_gestion_servicios_sociales/
├── backend/
│   ├── scripts/
│   │   ├── build.js               # Script de compilación
│   │   └── migrate.js             # CLI de migraciones
│   └── src/
│       ├── index.js               # Entry point del servidor
│       ├── config/
│       │   └── database.js        # Configuración Sequelize (MySQL)
│       ├── middleware/
│       │   ├── auth.js            # Verificación JWT, generación de token
│       │   └── validate.js        # Motor de validación de formularios
│       ├── models/                # Modelos Sequelize
│       ├── controllers/           # Lógica de negocio
│       ├── routes/                # Definición de endpoints
│       └── migrations/
│           ├── migrationManager.js
│           └── versions/          # Una carpeta por versión (upgrade.sql + downgrade.sql)
│
├── frontend/
│   └── src/
│       ├── App.jsx                # Configuración de rutas
│       ├── index.scss             # Estilos globales
│       ├── context/
│       │   └── AuthContext.jsx    # Estado global de autenticación
│       ├── components/
│       │   └── ProtectedRoute.jsx # Guard de rutas privadas
│       ├── services/
│       │   ├── api.js             # Instancia Axios con interceptores
│       │   └── *.Service.js       # Un service por dominio
│       ├── pages/                 # Una carpeta por página
│       └── styles/
│           └── auth.scss          # Estilos compartidos de autenticación
│
└── docs/                          # Documentación del proyecto
```

---

## 3. Backend

### 3.1 Entry point (`src/index.js`)

El servidor configura en orden:
1. Middleware de seguridad: `helmet`, `cors`
2. Parsing: `express.json({ limit: '10mb' })`
3. Logging: `morgan`
4. Montaje de rutas
5. Servicio del build de frontend (SPA fallback)
6. Middleware global de errores
7. Graceful shutdown (`SIGTERM`, `SIGINT`)

**Rutas montadas:**

| Prefijo | Archivo | Protección |
|---------|---------|-----------|
| `/api/auth` | `routes/auth.js` | Pública |
| `/api/afiliados` | `routes/afiliados.js` | `verifyToken` |
| `/api/grupos-familiares` | `routes/grupos.js` | `verifyToken` |
| `/api/planes` | `routes/planes.js` | `verifyToken` (mutaciones: `requireAdmin`) |
| `/api/migrations` | `routes/migrations.js` | `verifyToken` + `requireAdmin` |

### 3.2 Autenticación y autorización

**Flujo JWT:**
1. El cliente hace `POST /api/auth/login` con email + password.
2. El backend verifica el hash con `bcryptjs`, genera un JWT firmado con `JWT_SECRET` (expiración `JWT_EXPIRE`, default 7 días).
3. El cliente almacena el token en `localStorage`.
4. Todas las requests subsiguientes envían `Authorization: Bearer <token>`.
5. El middleware `verifyToken` decodifica el token y setea `req.user`, `req.userId`, `req.userRole`.

**Roles:**
- `admin` — acceso total, incluyendo mutaciones de planes y gestión de migraciones.
- `usuario` — acceso de lectura a endpoints de negocio; puede actualizar sus propios datos de perfil.

**Middleware de auth (`src/middleware/auth.js`):**

```javascript
verifyToken(req, res, next)   // Verifica JWT, setea req.user/req.userId/req.userRole
requireAdmin(req, res, next)  // Requiere req.user.rol === 'admin'
generateToken(usuario)        // Crea JWT con payload {id, email, nombre, apellido, rol}
```

### 3.3 Validación de entradas (`src/middleware/validate.js`)

Motor de validación custom basado en reglas. Se usa así:

```javascript
// En una ruta:
router.post('/', validate({ 
  nombre: [required('Nombre'), minLength(2, 'Nombre')],
  email:  [required('Email'), email()],
}), controller.crear);
```

**Reglas disponibles:** `required`, `minLength`, `maxLength`, `email`, `password`, `match`

Retorna `422` con `{ errors: { campo: "mensaje" } }` si alguna validación falla.

### 3.4 Modelos (`src/models/`)

Todos los modelos usan `timestamps: false` y `freezeTableName: true`. Las fechas se manejan manualmente.

**Convención de campos de auditoría:**
- `fecha_creacion` — seteado en insert.
- `fecha_actualizacion` — actualizado en cada save via `beforeSave` hook.
- `estado` — ENUM con valores explícitos (ej: `activo`, `inactivo`, `suspendido`).

**Modelos actuales:**

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Usuario` | `usuarios` | Cuentas de sistema (empleados/admins) |
| `Afiliado` | `afiliados` | Personas afiliadas (titular o beneficiario) |
| `GrupoFamiliar` | `grupos_familiares` | Agrupación familiar de afiliados |
| `Plan` | `planes` | Planes de servicio disponibles |
| `HistorialGrupoFamiliar` | `historial_grupo_familiar` | Log de altas y bajas por grupo |

**Modelo `Usuario` — métodos importantes:**
```javascript
instance.verificarPassword(pwd)        // bcrypt compare
instance.toSafeJSON()                  // excluye password_hash
static  Usuario.hashPassword(pwd)      // bcrypt hash
static  Usuario.registrarLogin(userId) // actualiza ultimo_login
```

**Modelo `Plan` — getters JSON:**
Los campos `cobertura` y `beneficios` son `JSON` con getter automático que parsea si llega como string.

### 3.5 Controllers (`src/controllers/`)

Patrón: un controller por dominio. Cada función es `async (req, res)` cubierta por `express-async-errors`.

**Convenciones de respuesta:**

| Situación | HTTP | Body |
|-----------|------|------|
| OK sin datos relevantes | 200 | `{ success: true, message: "..." }` |
| OK con datos | 200 | `{ success: true, data: [...] }` |
| Creación | 201 | `{ success: true, message: "...", data: {...} }` |
| No encontrado | 404 | `{ success: false, message: "..." }` |
| Conflicto (ej: duplicado) | 409 | `{ success: false, message: "..." }` |
| Validación | 422 | `{ errors: { campo: "msg" } }` |
| Sin autorización | 401 | `{ success: false, message: "..." }` |
| Prohibido | 403 | `{ success: false, message: "..." }` |

**Patrón de operaciones con transacción** (para operaciones multi-tabla):
```javascript
const t = await sequelize.transaction();
try {
  // operaciones...
  await t.commit();
} catch (err) {
  await t.rollback();
  throw err;
}
```

### 3.6 Sistema de migraciones (`src/migrations/`)

**Diseño:** Sistema custom, independiente de Sequelize migrations.

Cada versión es una carpeta nombrada `X.Y.Z_descripcion/` con:
- `upgrade.sql` — DDL a aplicar
- `downgrade.sql` — DDL para revertir

**Tablas de control en la BD:**
- `migraciones_bd` — estado actual por versión (upsertable).
- `historial_migraciones` — log append-only de todos los eventos.

**API del `migrationManager`:**

```javascript
list()       → Array de versiones con estado (aplicada/pendiente)
upgrade()    → Ejecuta el próximo upgrade.sql pendiente (en transacción)
downgrade()  → Revierte el último downgrade.sql aplicado (en transacción)
reapply()    → down + up de la versión actual (atómico)
getHistory() → Historial completo de eventos
getDbStats() → Versión actual + conteo de filas por tabla
```

**CLI:** `npm run db:migrate:up`, `npm run db:migrate:down`, etc.  
**Admin UI:** Disponible desde el panel de administración (endpoint `/api/migrations`).

**Convención de nombres de versión:** `X.Y.Z_nombre_descriptivo`

---

## 4. Frontend

### 4.1 Routing (`src/App.jsx`)

```
/           → LandingPage            (pública)
/login      → LoginPage              (pública)
/register   → RegisterPage           (pública)
/dashboard  → ProtectedRoute         (requiere autenticación)
               └── DashboardPage
* → /       (redirect)
```

`AuthContext` envuelve toda la aplicación.

### 4.2 Autenticación en el cliente

**Almacenamiento:** `localStorage`
- `jwt_token` — el JWT
- `user` — objeto usuario serializado

**`AuthContext` (`context/AuthContext.jsx`)** — valores expuestos:

```javascript
user            // objeto usuario o null
loading         // true mientras verifica localStorage al arrancar
isAuthenticated // boolean derivado de user
isAdmin         // user.rol === 'admin'
login(data)     // llama al API, guarda en localStorage
register(data)  // llama al API
logout()        // limpia localStorage
updateUser(u)   // actualiza en memoria + localStorage
```

**`ProtectedRoute` (`components/ProtectedRoute.jsx`):**
```javascript
// Uso:
<ProtectedRoute>          // Solo requiere autenticación
<ProtectedRoute requireAdmin>  // Además requiere rol admin
```

### 4.3 HTTP client (`services/api.js`)

Instancia Axios configurada con:
- `baseURL` desde `REACT_APP_API_URL` (default `http://localhost:5000/api`)
- **Request interceptor:** adjunta `Authorization: Bearer <token>` automáticamente.
- **Response interceptor:** ante un `401` con token activo, limpia localStorage y redirige a `/login?expired=1`.

**Regla:** todas las llamadas al API pasan por esta instancia, nunca por `axios` directamente.

### 4.4 Services (`src/services/`)

Un archivo de service por dominio. Cada service importa `api` y expone funciones async:

```javascript
// Patrón:
const afiliadosService = {
  listar: async (params = {}) => {
    const { data } = await api.get('/afiliados', { params });
    return data;
  },
  // ...
};
export default afiliadosService;
```

Los componentes nunca llaman a `api` directamente — siempre usan el service correspondiente.

### 4.5 Páginas (`src/pages/`)

Cada página vive en su propia carpeta con su SCSS:

```
pages/
├── LandingPage/
│   ├── LandingPage.jsx
│   ├── LandingPage.scss
│   └── components/        # Sub-componentes propios de la página
├── LoginPage/
│   └── LoginPage.jsx
├── RegisterPage/
│   └── RegisterPage.jsx
└── DashboardPage/
    ├── DashboardPage.jsx
    ├── DashboardPage.scss
    └── components/         # Módulos del dashboard
```

**Regla:** Los componentes internos de una página viven en `pages/NombrePage/components/`. Los componentes reutilizables entre páginas van en `src/components/`.

### 4.6 Estilos

**Metodología:** BEM (Block__Element--Modifier).

**Organización:**
- `src/index.scss` — reset global, variables CSS, tipografía base.
- `src/styles/auth.scss` — estilos compartidos de las páginas de autenticación (glassmorphism cards).
- Cada componente/página tiene su propio `.scss` en la misma carpeta.

**Convención BEM:**
```scss
.nombre-componente { }
.nombre-componente__elemento { }
.nombre-componente__elemento--modificador { }
```

**Regla de modales/popups:**  
Todo formulario CRUD (crear/editar registros) se presenta como overlay modal con:
- `max-width: 960px; width: 95%` — mismo ancho que las listas de datos.
- `max-height: 90vh; overflow-y: auto` — para formularios largos.
- Overlay fijo con `position: fixed; inset: 0; z-index: 1000`.
- Se cierra al hacer click fuera (verificando `e.target === e.currentTarget`).

---

## 5. Variables de entorno

### Backend (`.env`)

```
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=app_gestion_servicios_sociales
DB_USER=root
DB_PASSWORD=

JWT_SECRET=<secreto largo y aleatorio>
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env`)

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=GestSocial
REACT_APP_ENV=development
```

---

## 6. Flujo de autenticación completo

```
Registro:
  RegisterPage → POST /api/auth/register
               ← 201 + {success, message}
               → redirect a /login

Login:
  LoginPage → POST /api/auth/login
            ← 200 + {token, user}
            → localStorage.setItem('jwt_token', token)
            → localStorage.setItem('user', JSON.stringify(user))
            → redirect a /dashboard

Requests autenticadas:
  api.js interceptor → adjunta Authorization: Bearer <token>
  backend verifyToken → decodifica → req.user

Expiración / logout:
  Response 401 con token en localStorage
  → api.js interceptor limpia localStorage
  → window.location.href = '/login?expired=1'
```

---

## 7. Manejo de errores

### Backend

- `express-async-errors` — captura errores en funciones async sin try/catch.
- Middleware global de errores en `index.js` — loguea y formatea la respuesta.
- En desarrollo (`NODE_ENV=development`): incluye stack trace en la respuesta.
- En producción: solo el mensaje de error.

### Frontend

- Los services lanzan el error (`Promise.reject`) para que el componente lo maneje.
- Los componentes capturan errores en el `catch` del handler y los muestran al usuario.
- Los errores globales de sesión (401) los maneja el interceptor de `api.js`.

---

## 8. Dependencias clave

### Backend

| Paquete | Versión | Uso |
|---------|---------|-----|
| `express` | ^4.18.2 | Framework HTTP |
| `sequelize` | ^6.32.0 | ORM MySQL |
| `mysql2` | ^3.4.4 | Driver MySQL |
| `jsonwebtoken` | ^9.0.0 | JWT |
| `bcryptjs` | ^2.4.3 | Hash de contraseñas |
| `helmet` | ^7.0.0 | Headers de seguridad |
| `cors` | ^2.8.5 | CORS |
| `morgan` | ^1.10.0 | Logging HTTP |
| `express-async-errors` | ^3.1.1 | Error handling async |
| `dotenv` | ^16.0.3 | Variables de entorno |

### Frontend

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | ^18.2.0 | UI library |
| `react-router-dom` | ^6.12.0 | Routing |
| `axios` | ^1.4.0 | HTTP client |
| `sass` | ^1.62.1 | SCSS |
| `@react-oauth/google` | ^0.12.0 | Google OAuth (disponible, no implementado) |
| `zustand` | ^4.3.9 | State management (disponible, no implementado) |
| `recharts` | ^2.7.2 | Gráficos (disponible, no implementado) |
| `react-toastify` | ^9.1.3 | Notificaciones toast |
| `date-fns` | ^2.30.0 | Utilidades de fechas |

---

## 9. Comandos de desarrollo

### Backend (`backend/`)

```bash
npm run dev              # Desarrollo con hot reload (nodemon)
npm start                # Producción
npm test                 # Jest
npm run db:migrate:list  # Listar migraciones
npm run db:migrate:up    # Aplicar próxima migración
npm run db:migrate:down  # Revertir última migración
npm run seed             # Seed de base de datos
```

### Frontend (`frontend/`)

```bash
npm start        # Desarrollo (proxy de API a localhost:5000)
npm run build    # Build de producción → build/
npm test         # Tests
```

---

## 10. Convenciones y buenas prácticas establecidas

### General
- Los requerimientos nuevos se diseñan primero (spec en `docs/superpowers/specs/`) y luego se implementan (plan en `docs/superpowers/plans/`).

### Backend
- Cada dominio tiene su propio `model`, `controller` y `route`.
- Las operaciones que afectan múltiples tablas usan transacciones Sequelize.
- La validación de entrada va en el middleware `validate()` en la ruta, no en el controller.
- Los controllers retornan errores de negocio con el código HTTP apropiado (ver tabla en §3.5).
- Nunca auto-timestamps — usar `fecha_creacion` y `fecha_actualizacion` manuales.

### Frontend
- Todos los componentes son funcionales con hooks.
- Estado local con `useState` / `useReducer`. Estado global solo vía `AuthContext` (o `zustand` para futuras necesidades).
- Nunca llamar a `axios` directamente — siempre a través del service correspondiente.
- Los formularios CRUD se presentan como popups modales, no como vistas inline (ver §4.6).
- Los componentes internos de una página van en `pages/NombrePage/components/`.
- Cada componente tiene su propio archivo SCSS con BEM.
- La lógica de negocio vive en los services, no en los componentes.
