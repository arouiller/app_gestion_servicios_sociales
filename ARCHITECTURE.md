# 🏗️ Arquitectura del Sistema - App Gestión Servicios Sociales

Documento de referencia que describe la estructura general, dependencias y flujos de datos del sistema.

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Capas de la Arquitectura](#capas-de-la-arquitectura)
3. [Modelos de Base de Datos](#modelos-de-base-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Servicios Frontend](#servicios-frontend)
6. [Componentes React](#componentes-react)
7. [Flujos Principales](#flujos-principales)
8. [Diagrama Interactivo](#diagrama-interactivo)

---

## Descripción General

La aplicación sigue una **arquitectura en capas** (layered architecture) con separación clara entre:

- **Backend**: Express.js + Sequelize + MySQL
- **Frontend**: React 18 + Zustand + Context API
- **Comunicación**: REST API con Axios

### Características Principales

✅ **Escalabilidad**: Modelos y componentes reutilizables  
✅ **Mantenibilidad**: Separación de responsabilidades  
✅ **Performance**: Caché, paginación, ordenamiento optimizado  
✅ **Seguridad**: JWT, validación, auditoría  

---

## Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│         PRESENTACIÓN (React Components)                 │
│  • Pages: GestionPlanesV1, RecibosPage, etc.          │
│  • Modals: PlanV1Modal, GenerarRecibosModal, etc.     │
│  • Shared: LookupCRUD, SearchContainer, etc.          │
└──────────────────────────────────────────────────────────┘
                              ↓ (HTTP Calls)
┌─────────────────────────────────────────────────────────┐
│       SERVICIOS (Frontend Services Layer)               │
│  • planesV1Service, recibosService, lookupService      │
│  • configService, migrationsService, etc.              │
│  • Abstraen la comunicación con la API                 │
└──────────────────────────────────────────────────────────┘
                              ↓ (HTTP)
┌─────────────────────────────────────────────────────────┐
│           API GATEWAY (Express.js)                      │
│  • Rutas: /api/planes, /api/recibos, /api/usuarios    │
│  • Middleware: auth, validación, auditoría             │
│  • Soporte para CRUD completo                          │
└──────────────────────────────────────────────────────────┘
                              ↓ (Sequelize)
┌─────────────────────────────────────────────────────────┐
│       MODELOS (Sequelize ORM)                          │
│  • Modelos: PlanV1, Persona, Recibo, etc.             │
│  • Asociaciones: belongsTo, hasMany, etc.             │
│  • Validaciones a nivel de modelo                      │
└──────────────────────────────────────────────────────────┘
                              ↓ (SQL)
┌─────────────────────────────────────────────────────────┐
│      BASE DE DATOS (MySQL 8.0)                         │
│  • Tablas: planes, personas, recibos, etc.            │
│  • Índices para búsquedas rápidas                      │
│  • Transacciones para consistencia                     │
└──────────────────────────────────────────────────────────┘
```

---

## Modelos de Base de Datos

### 📌 Categorías Principales

#### 1️⃣ **Entidades Lookup** (Catálogos)
Son datos de referencia que no se crean frecuentemente:

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Cobrador` | `cobradores` | Agentes de cobranza |
| `TipoDePlan` | `tipo_plan` | Tipos de planes ofrecidos |
| `ObraSocial` | `obra_social` | Obras sociales/prepagas |
| `ServicioAdicional` | `servicios_adicionales` | Servicios extras |
| `TipoDeGrupo` | `tipo_grupo` | Tipos de grupos familiares |
| `Zona` | `zonas` | Zonas geográficas |

#### 2️⃣ **Entidades Principales** (Core)

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Usuario` | `usuarios` | Usuarios del sistema |
| `Persona` | `personas` | Personas/afiliados |
| `PlanV1` | `planes` | Planes de membresía |
| `PlanIntegrante` | `plan_integrantes` | Integrantes de un plan |
| `IntegranteServicio` | `integrante_servicios` | Servicios de un integrante |

#### 3️⃣ **Geografía**

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Provincia` | `provincias` | Provincias |
| `Localidad` | `localidades` | Localidades (FK: Provincia) |

#### 4️⃣ **Recibos**

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Recibo` | `recibos` | Recibos emitidos |
| `ReciboIntegrante` | `recibo_integrantes` | Integrantes en recibo |
| `PeriodosRecibos` | `periodos_recibos` | Períodos con recibos generados |

#### 5️⃣ **Auditoría**

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `HistorialCuota` | `historial_cuota` | Historial de cambios de cuota |
| `AuditLog` | `audit_log` | Log de acceso a endpoints |
| `AumentoMasivo` | `aumentos_masivos` | Registro de aumentos masivos |
| `Bug` | `bugs` | Sistema de reporte de bugs |

#### 6️⃣ **Configuración**

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `ConfiguracionApp` | `configuracion_app` | Parámetros globales |

### 📊 Relaciones Principales

```
PlanV1
  ├── TipoDePlan (FK: tipo_plan_numero)
  ├── Cobrador (FK: cobrador_numero)
  ├── TipoDeGrupo (FK: tipo_de_grupo_numero)
  ├── ObraSocial (FK: os_numero)
  ├── Zona (FK: zona_id)
  ├── Localidad (FK: localidad_id)
  ├── PlanIntegrante (1:N)
  │   ├── Persona (FK: persona_id)
  │   └── IntegranteServicio (1:N)
  │       └── ServicioAdicional (FK: servicio_adicional_numero)
  └── Recibo (1:N)
      ├── ReciboIntegrante (1:N)
      └── Usuario (FK: usuario_id)
```

---

## API Endpoints

### 🔐 Autenticación

```
POST   /api/auth/login                  Login usuario
POST   /api/auth/google                 Google OAuth
POST   /api/auth/cambiar-password       Cambiar contraseña
```

### 📋 Planes

```
GET    /api/planes                      Listar planes
GET    /api/planes/filter/:filtro       Filtrar planes (optimizado)
POST   /api/planes                      Crear plan
PUT    /api/planes/:id                  Actualizar plan
POST   /api/planes/crear-completo       ⭐ Crear plan+personas+integrantes (OPTIMIZADO)
POST   /api/planes/actualizar-completo/:id  ⭐ Actualizar plan+integrantes (OPTIMIZADO)
PATCH  /api/planes/bulk-update-cuota    Aumento masivo de cuotas
```

**Endpoints optimizados (BACKLOG-061, BACKLOG-062):**
- `crear-completo`: Consolidación de 6 llamadas en 1 (plan + personas + integrantes + reorder)
- `actualizar-completo`: Consolidación de 4 llamadas en 1 (update + integrantes + reorder + load)

### 👥 Personas

```
POST   /api/personas                    Crear persona
GET    /api/personas/search             Buscar personas
PUT    /api/personas/:id                Actualizar persona
```

### 💰 Recibos

```
GET    /api/recibos                     Listar recibos
GET    /api/recibos/:id                 Obtener recibo
POST   /api/recibos/generar             Generar recibos (período)
GET    /api/recibos/periodos            Listar períodos con recibos
GET    /api/recibos/numero-max          Sugerir próximo número
```

### 🎛️ Lookup

```
GET    /api/lookup                      Listar todas las entidades
GET    /api/lookup/:entidad             Listar entidad específica
GET    /api/lookup/zonas                Listar zonas
POST   /api/lookup/:entidad             Crear
PUT    /api/lookup/:entidad/:id         Actualizar
DELETE /api/lookup/:entidad/:id         Eliminar (con cascada)
```

### ⚙️ Administración

```
GET    /api/usuarios                    Listar usuarios
POST   /api/usuarios                    Crear usuario
PUT    /api/usuarios/:id/rol            Cambiar rol
PUT    /api/usuarios/:id/blanquear      Blanquear contraseña
GET    /api/migrations                  Listar migraciones
POST   /api/migrations/execute          Ejecutar migración
GET    /api/admin/configuracion         Obtener configuración
GET    /api/audit-log                   Log de auditoría
GET    /api/bugs                        Listar bugs
POST   /api/bugs                        Crear bug
```

### 🌍 Geografía

```
GET    /api/provincias                  Listar provincias
POST   /api/provincias                  Crear provincia
GET    /api/localidades                 Listar localidades
POST   /api/localidades                 Crear localidad
```

---

## Servicios Frontend

Cada servicio encapsula la comunicación HTTP con la API:

| Servicio | Endpoints |
|----------|-----------|
| `authService` | Login, cambiar contraseña |
| `planesV1Service` | CRUD planes + crear-completo + actualizar-completo |
| `planesService` | Filtros, bulk update, paginación |
| `personasService` | CRUD personas, búsqueda |
| `recibosService` | Listar, generar, períodos |
| `lookupService` | CRUD entidades lookup |
| `usuariosService` | Gestión de usuarios |
| `configService` | Obtener configuración app |
| `migrationsService` | Listar y ejecutar migraciones |
| `provinciaService` | CRUD provincias |
| `localidadService` | CRUD localidades |
| `integranteServiciosService` | Servicios de integrantes |
| `planesIntegrantesService` | Gestión de integrantes |
| `bugsService` | CRUD bugs |
| `auditService` | Log de auditoría |

---

## Componentes React

### 📄 Páginas Principales

- **DashboardPage**: Shell principal con navegación sidebar
- **RecibosPage**: Gestión de recibos por período
- **ChangePasswordRequired**: Cambio obligatorio de contraseña

### 📋 Gestión de Planes

- **GestionPlanesV1**: Tabla principal de planes (con paginación, ordenamiento, búsqueda)
- **PlanV1Modal**: Formulario de crear/editar plan (6 tabs)
- **BusquedaAfiliados**: Búsqueda avanzada de personas
- **AfiladoSearchModal**: Modal para buscar y agregar afiliados
- **GenerarRecibosModal**: Generación de recibos (4 steps)
- **BulkUpdateCuotaModal**: Aumento masivo de cuotas
- **IntegranteServiciosModal**: Asignación de servicios adicionales
- **HistorialAumentosModal**: Historial de aumentos masivos

### 💰 Recibos

- **RecibosPage**: Listado y búsqueda de recibos
- **ReciboDetalleModal**: Detalles de recibo
- **GenerarRecibosModal**: (compartido)

### 🌍 Geografía

- **GestionProvinciasZonas**: Gestión territorial jerárquica
- **ProvinciaRow**: Fila de provincia con árbol de localidades/zonas
- **ZonaFormModal**: Formulario de zona

### ⚙️ Administración

- **GestionUsuarios**: Gestión de usuarios del sistema
- **MigrationsDashboard**: Ejecución de migraciones BD
- **GestionBugs**: Sistema de reporte de bugs
- **GestionAuditoria**: Log de auditoría de accesos
- **ConfiguracionNotificaciones**: Configuración global

### 🎛️ Componentes Genéricos

- **LookupCRUD**: Componente reutilizable para CRUD de entidades lookup
- **Cobradores**: Especialización de LookupCRUD para cobradores

---

## Flujos Principales

### 1️⃣ Creación de Plan (BACKLOG-061 Optimizado)

```
Frontend (PlanV1Modal)
  └─> planesV1Service.crearCompleto({
        plan: {...},
        personas: [{...}],
        integrantes: [{...}]
      })
    └─> POST /api/planes/crear-completo
      └─> Backend (planesController.crearCompleto)
        ├─> Sequelize.transaction() [ATÓMICO]
        ├─> Crear personas deferred (sin ID anterior)
        ├─> Crear plan + personas
        ├─> Crear integrantes + reorder
        └─> Responder con plan actualizado
    └─> Frontend actualiza estado con respuesta única
```

**Beneficio**: 6 llamadas → 1 llamada (90% menos tráfico)

### 2️⃣ Actualización de Plan (BACKLOG-062 Optimizado)

```
Frontend (PlanV1Modal)
  └─> planesV1Service.actualizarCompleto(planNumero, {
        plan: {...},
        integrantes: [{...}]
      })
    └─> POST /api/planes/actualizar-completo/:id
      └─> Backend (planesController.actualizarCompleto)
        ├─> Sequelize.transaction() [ATÓMICO]
        ├─> Actualizar plan
        ├─> Sincronizar integrantes (agregar/eliminar/reorder)
        ├─> Recargar integrantes completos
        └─> Responder con estado actualizado
    └─> Frontend actualiza estado con respuesta única
```

**Beneficio**: 4 llamadas → 1 llamada (75% menos tráfico)

### 3️⃣ Generación de Recibos

```
Frontend (GenerarRecibosModal)
  ├─> Paso 1: Validar período
  ├─> Paso 2: Seleccionar planes
  ├─> Paso 3: Revisar aumento masivo aplicable
  └─> Paso 4: Confirmar
    └─> recibosService.generar({
          planes: [...],
          periodo: "2026-05-01",
          numeroInicialRecibo: 1001
        })
      └─> POST /api/recibos/generar
        └─> Backend (recibosController.generar)
          ├─> Transacción atómica
          ├─> Crear recibos con numero_recibo secuencial
          ├─> Snapshot zona_codigo del plan
          ├─> Registrar período
          └─> Responder con resumen
```

### 4️⃣ Búsqueda de Personas

```
Frontend (BusquedaAfiliados)
  └─> Escribir búsqueda
    └─> useDebounce (2000ms)
      └─> personasService.search({...})
        └─> POST /api/personas/search
          └─> Backend (personasController.search)
            ├─> Filtrar por documento, nombre, etc.
            ├─> Cargar planes asociados
            └─> Responder con personas + planes
```

---

## Diagrama Interactivo

📊 **Abre el archivo `ARCHITECTURE_DIAGRAM.html` en tu navegador**

El diagrama incluye 4 vistas:

### 1. Diagrama Completo
Muestra todas las capas y relaciones:
- Modelos de BD con asociaciones
- Endpoints API organizados por módulo
- Servicios Frontend
- Componentes React
- Todas las dependencias entre capas

### 2. Modelos de BD
Vista enfocada en entidades y relaciones:
- Categorías: Lookup, Core, Recibos, Geografía, Auditoría
- Campos principales de cada modelo
- Foreign keys y relaciones (belongsTo, hasMany)

### 3. Endpoints API
Vista de la capa de integración:
- Endpoints organizados por dominio
- Métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- Endpoints optimizados destacados

### 4. Componentes Frontend
Vista de presentación:
- Componentes organizados por sección
- Relaciones padre-hijo (abre, muestra)
- Componentes compartidos y genéricos

---

## 🔑 Conceptos Clave

### Transacciones Atómicas

Operaciones críticas usan `Sequelize.transaction()`:
- Creación de plan completo
- Actualización con sincronización
- Generación de recibos
- Cambios en cascada

**Beneficio**: Si algo falla, todo se revierte (ACID compliance)

### Caché & Optimización

- **localStorage**: Configuración app, preferencias de usuario
- **in-memory**: Estado de React (Zustand + Context)
- **paginación backend**: 15 items/página configurable
- **índices BD**: Búsquedas rápidas

### Validación Multicapa

```
Frontend
  ├─> Validación de tipos (React)
  └─> validate hook (UX)
      └─> Backend
          ├─> Validación de request
          ├─> Validación de reglas de negocio
          └─> Validación de constraints BD
```

### Auditoría Completa

- Cada endpoint registra acceso en `audit_log`
- Usuario, timestamp, endpoint, parámetros
- Disponible en GestionAuditoria

---

## 📈 Performance

### Endpoints Optimizados

| Operación | Antes | Después | Mejora |
|-----------|-------|---------|--------|
| Crear plan | 6 llamadas | 1 llamada | -83% |
| Actualizar plan | 4 llamadas | 1 llamada | -75% |
| Cargar GestionPlanesV1 | 5-6 llamadas | 2-3 llamadas | -50% |

### Paginación

- Backend: 15 items/página (configurable)
- Ordenamiento dinámico: sortBy + order (persistente)
- Búsqueda debounced: 2000ms

### Índices BD

```sql
-- Búsquedas rápidas
CREATE INDEX idx_planes_numero ON planes(plan_numero);
CREATE INDEX idx_planes_zona ON planes(zona_id);
CREATE INDEX idx_personas_doc ON personas(numero_documento);
CREATE INDEX idx_recibos_plan ON recibos(plan_numero);
```

---

## 🚀 Próximos Pasos

- ✅ Optimización de queryFILTROS (BACKLOG-061, BACKLOG-062)
- ✅ Eliminación de tablas legacy (BACKLOG-046)
- ✅ API call deduplication (BUG-032)
- 🎯 Implementar WebSockets para actualizaciones en tiempo real
- 🎯 Cache layer Redis para datos frecuentes

---

## 📞 Soporte

Para preguntas sobre la arquitectura, consulta:
- `docs/ARQUITECTURA.md` - Análisis detallado
- `ARCHITECTURE_DIAGRAM.html` - Diagrama interactivo
- `/docs/superpowers/specs/` - Especificaciones técnicas

**Última actualización**: 2026-05-08  
**Versión**: 1.0.7
