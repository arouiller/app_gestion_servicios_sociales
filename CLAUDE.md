# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

The project has a working scaffold with partial-to-substantial implementation across backend and frontend.
It is currently in **audit and correction phase**: identifying gaps between requirements and existing code,
fixing inconsistencies, detecting dead code, and completing missing functionality.

The `docs/` folder contains analysis documents, plans, and specs generated during this phase — treat them
as context, not as source of truth. **The source of truth for requirements are the specs under `docs/superpowers/specs/`.**

---

## Project Structure

```
/
├── CLAUDE.md
├── backend/
│   ├── src/
│   │   ├── index.js                  # Entry point
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/              # Active controllers (current version)
│   │   │   ├── historialController.js
│   │   │   ├── lookupController.js
│   │   │   ├── migrationsController.js
│   │   │   └── planesController.js
│   │   ├── controllers/v1.0/         # Legacy v1.0 controllers (keep, do not delete)
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification
│   │   │   └── validate.js           # Request validation
│   │   ├── migrations/
│   │   │   ├── migrationManager.js   # Custom migration runner
│   │   │   └── versions/             # SQL upgrade/downgrade scripts per version
│   │   ├── models/                   # Sequelize models (current version)
│   │   ├── routes/                   # Express routes (current version)
│   │   └── routes/v1.0/              # Legacy v1.0 routes (keep, do not delete)
│   └── scripts/
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── components/               # Shared/reusable components
│       ├── context/
│       │   └── AuthContext.jsx       # Auth state (do not replace with Zustand)
│       ├── pages/
│       │   └── DashboardPage/        # Main app shell with all section components
│       │       └── components/       # Section-level components (GestionPlanes, etc.)
│       └── services/                 # All API calls go through service files
│           └── v1.0/                 # Legacy v1.0 services (keep, do not delete)
├── docs/
│   ├── analisis-implementacion-2026-04-13.md
│   ├── plan-refactor-incremental-2026-04-13.md
│   ├── ARQUITECTURA.md
│   └── superpowers/
│       ├── plans/                    # Implementation plans (context only)
│       └── specs/                    # ← REQUIREMENTS SOURCE OF TRUTH
└── .claude/
    └── skills/                       # Claude Code skill prompts
```

---

## Commands

### Backend (`backend/`)
```bash
npm run dev                  # Development with hot reload (nodemon)
npm start                    # Production
npm test                     # Jest tests
npm run lint                 # ESLint
npm run db:migrate:init      # Initialize migration system
npm run db:migrate:list      # List available migrations
npm run db:migrate:up        # Run next migration
npm run db:migrate:down      # Revert last migration
npm run seed                 # Seed database
```

### Frontend (`frontend/`)
```bash
npm start        # Development (proxies API to localhost:5000)
npm run build    # Production build → build/
npm test         # React Testing Library tests
npm run lint     # ESLint
```

---

## Architecture

### Backend (Express MVC)
- **Entry**: `backend/src/index.js`
- **Pattern**: Routes → Controllers → Models (Sequelize)
- **Middleware**: `auth.js` (JWT verification), `validate.js` (request validation), `errorHandler.js`
- **Logging**: Winston (`utils/logger.js`)
- All routes require `Authorization: Bearer <token>` except `/api/auth/*`

### Frontend (React)
- **State**: Context API for auth (`AuthContext.jsx`) — do not replace with Zustand
- **State (other)**: Zustand is available for complex UI state that is NOT auth or server data
- **HTTP**: Axios instance configured in `services/api.js` — all API calls go through service files, never directly from components
- **Styles**: SCSS. Global variables in `styles/_colors.scss`
- **Frontend proxy**: `package.json` proxies `/api/*` to `http://localhost:5000` in development

### Versioning (v1.0 legacy)
There are parallel `v1.0` folders in controllers, routes, models, and services. These are **legacy** and must be kept
intact. Do not merge, rename, or delete them without explicit instruction. New development goes in the non-versioned folders.

### Authentication Flow
1. Frontend triggers Google OAuth via `@react-oauth/google`
2. Backend receives Google token at `POST /api/auth/google`, validates with `google-auth-library`
3. Backend issues JWT (7-day expiry) stored client-side
4. All subsequent requests use `Authorization: Bearer <jwt>`

### Roles
- **admin**: full access including generating cuotas, confirming payments, and all migration endpoints
- **usuario**: read-only access to own data; can register own payments

### Database Migrations
Custom Node.js system — **not** Sequelize migrations. Each version is a folder under
`backend/src/migrations/versions/` with `upgrade.sql` and `downgrade.sql`. The `migrationManager.js`
tracks execution in the `migraciones_bd` table. Migrations can also be triggered from the admin panel UI.

**Do not modify the migration system without explicit instruction.**

### Key Domain Entities
- `Persona` → core person record
- `PlanIntegrante` / `PlanV1` → plan membership (v1.0 legacy model in parallel)
- `HistorialCuota` → payment history
- `Recibo` / `ReciboIntegrante` → receipts
- `IntegranteServicio` → additional services per member
- `ObraSocial`, `TipoDeGrupo`, `TipoDePlan` → lookup tables
- `Cobrador` → collector/agent entity
- `Usuario` → system user

---

## Environment Variables

Backend `.env` (see `.env.example`):
```
NODE_ENV, PORT, API_URL
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET, JWT_EXPIRE
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
FRONTEND_URL, LOG_LEVEL
```

Frontend `.env` (see `.env.example`):
```
REACT_APP_API_URL, REACT_APP_GOOGLE_CLIENT_ID, REACT_APP_ENV, REACT_APP_APP_NAME
```

---

## Deployment Target

Hostinger shared hosting — Node.js app via cPanel, MySQL 8.0, static frontend in `public_html/`.
See `docs/DEPLOYMENT.md` for step-by-step. **Avoid dependencies that require root access or external services.**

---

## Restrictions

- Do not modify the custom migration system without explicit instruction
- Do not replace `AuthContext` with Zustand — Context API is intentional for auth and notifications
- Do not change the DB schema directly — always use the migration system
- Do not delete or merge `v1.0` legacy folders (controllers, routes, services, models)
- Do not add dependencies incompatible with Hostinger shared hosting
- **No hay Node.js disponible en el entorno** — No es posible ejecutar `npm install`, `npm run dev`, `npm run build`, o hacer testing/debugging local. Todas las pruebas y despliegues deben realizarse en el servidor de Hostinger o en un entorno externo

---

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`
- **Dead code detection**: `refactor_tool` with dead code mode

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |
| `list_communities` | Grouping related code for audit purposes |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

## Audit Workflow (current phase)

When asked to audit, gap-analyze, or plan work, follow this sequence:

1. Read all specs in `docs/superpowers/specs/` — these are the requirements source of truth
2. Use `get_architecture_overview` + `list_communities` to understand current code structure
3. Use `refactor_tool` (dead code mode) to identify unused code
4. Cross-reference specs vs implemented routes/controllers/components
5. Produce a `GAP_ANALYSIS.md` with: ✅ implemented / ⚠️ partial / ❌ missing / 🗑️ dead code
6. Produce a `PLAN.md` with prioritized, ordered work items and affected files

## Git Conventions

### Rama de trabajo
Siempre trabajar sobre la rama que está selecta

### Commits
- **Atómicos**: un commit por archivo modificado, o por unidad lógica mínima de cambio
- **Formato de mensaje**: `tipo(scope): descripción corta en español`
- **Push automático**: después de cada commit, ejecutar `git push origin rama` (donde rama es la rama que estamos trabajando)

### Tipos de commit
| Tipo | Usar cuando |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Reorganización sin cambio de comportamiento |
| `docs` | Cambios en documentación |
| `style` | Cambios de formato/SCSS sin lógica |
| `test` | Agregado o corrección de tests |
| `chore` | Tareas de mantenimiento (deps, config) |

### Scope
Usar el nombre del módulo o componente afectado. Ejemplos:
- `feat(planes): agregar validación de cuotas`
- `fix(auth): corregir expiración de JWT`
- `refactor(personas): separar lógica de búsqueda`
- `docs(claude): actualizar gap analysis`

### Reglas
- Nunca hacer commit de archivos `.env`
- No hacer commit si hay errores de lint
- Siempre incluir el scope

## Bug Tracking

- Ante cualquier bug detectado durante la implementación, registrarlo 
  inmediatamente en `BUGS.md` antes de continuar.
- **No avanzar a la siguiente fase del PLAN.md si hay bugs con estado 
  🔴 o 🟡 en la fase actual.**
- Al resolver un bug, actualizar su estado en `BUGS.md` e incluir el 
  commit del fix en la columna correspondiente.
- Si un bug bloquea el avance, detener la implementación y reportar 
  el estado al usuario antes de continuar.
- Cambios en `BUGS.md` (registrar/actualizar bugs) pueden incluirse 
  en push sin requerir commit separado - se combinan con el siguiente 
  commit de trabajo relacionado, o se hacen push sin etiqueta de commit 
  dedicada si es solo actualización de documentación de tracking.
- El usuario puede reportar bugs directamente en la conversación 
  o cargándolos manualmente en `BUGS.md`.
- Ante cualquier mención de un bug por parte del usuario, 
  registrarlo en `BUGS.md` inmediatamente si no está ya cargado, 
  asignarle un ID correlativo, y priorizarlo sobre cualquier 
  tarea de implementación en curso.

## Backlog de mejoras

- Durante la implementación, si se detecta una posible mejora o nuevo 
  requerimiento, registrarlo en `BACKLOG.md` con su prioridad y contexto.
- No implementar ítems del backlog durante la ejecución de las fases del PLAN.md.
- Al finalizar todas las fases, revisar el BACKLOG.md con el usuario 
  antes de incorporar cualquier ítem al plan.
- Cambios en `BACKLOG.md` y `BUGS.md` (registrar/actualizar items) pueden incluirse 
  en push sin requerir commit separado - se combinan con el siguiente commit de trabajo 
  relacionado, o se hacen push sin etiqueta de commit dedicada si es solo actualización 
  de documentación de tracking.