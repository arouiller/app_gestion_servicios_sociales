# Análisis: Estado de Implementación vs Spec Unificada

**Fecha:** 2026-04-13  
**Rama actual:** V_1.0.1_migrations  
**Decisión de usuario:** Usar modelo de SPEC (1.0.x), descartar modelo actual (2.0.x)

---

## 1. Resumen Ejecutivo

**Conflicto fundamental:** El código actual implementa un modelo de BD diferente (`2.0.x`, `grupos_familiares`, `afiliados`) al especificado en la spec unificada (`1.0.x`, `personas`, `plan_integrantes`).

**Decisión:** Mantener spec unificada (1.0.x), refactorizar el código actual.

**Impacto:**
- ✅ Panel de Migraciones: **Reutilizable** (versión agnóstica)
- ✅ Lookup (cobradores, tipos, etc.): **Reutilizable** (identidad es la misma)
- ❌ Modelos BD/Backend: **REQUIERE REFACTOR** (2.0.x → 1.0.x)
- ❌ Frontend: **Parcialmente reutilizable** (componentes lookup OK, afiliados/grupos OK, planes necesita cambios)

---

## 2. Estado Actual (2.0.x)

### Backend — Migraciones

| Versión | Archivo | Estado | Notas |
|---------|---------|--------|-------|
| 1.0.0 | `1.0.0_usuarios/` | ✅ Implementada | Login funciona. **MANTENER** |
| 2.0.0 | `2.0.0_grupos_familiares/` | ✅ Implementada | Crea tabla `grupos_familiares`. **DESCARTAR** |
| 2.0.1 | `2.0.1_lookup_tables/` | ✅ Implementada | Cobradores, tipos, obras, servicios. **RENOMBRAR a 1.0.1** |
| 2.0.2 | `2.0.2_main_tables/` | ✅ Implementada | Afiliados, planes, historial. **REEMPLAZAR por 1.0.2 + 1.0.3** |

### Backend — Controllers/Routes

| Archivo | Estado | Acción |
|---------|--------|--------|
| `migrationsController.js` | ✅ Implementado | **MANTENER** (agnóstico) |
| `lookupController.js` | ✅ Implementado | **MANTENER** (identidad igual) |
| `afiliadosController.js` | ✅ Implementado | **DESCARTAR** (será personasController) |
| `gruposController.js` | ✅ Implementado | **DESCARTAR** |
| `historialController.js` | ✅ Implementado | **DESCARTAR** |
| `planesController.js` | ✅ Implementado | **REFACTOR** (cambiar modelo de datos) |

### Routes montadas

```javascript
/api/migrations/*   — ✅ OK, mantener
/api/lookup/*       — ✅ OK, mantener
/api/afiliados/*    — ❌ REMOVER
/api/grupos/*       — ❌ REMOVER
/api/planes/*       — ⚠️ REFACTOR (requiere cambios)
```

### Models Sequelize

| Modelo | Status | Acción |
|--------|--------|--------|
| Cobrador | ✅ | **MANTENER** |
| TipoDePlan | ✅ | **MANTENER** |
| ObraSocial | ✅ | **MANTENER** |
| ServicioAdicional | ✅ | **MANTENER** |
| TipoDeGrupo | ✅ | **MANTENER** |
| Afiliado | ✅ | **REFACTOR** → Persona |
| GrupoFamiliar | ✅ | **ELIMINAR** |
| Plan | ✅ | **REFACTOR** (estructura diferente) |

---

## 3. Frontend — Componentes

### Lookup (CRUD Genérico)

| Componente | Status | Acción |
|---|---|---|
| `Cobradores/` | ✅ | **MANTENER** |
| `TiposDePlan/` | ✅ | **MANTENER** |
| `ObrasSociales/` | ✅ | **MANTENER** |
| `ServiciosAdicionales/` | ✅ | **MANTENER** |
| `TiposDeGrupo/` | ✅ | **MANTENER** |

### Especiales

| Componente | Status | Acción |
|---|---|---|
| `GestionAfiliados/` | ✅ | **REFACTOR** → BusquedaAfiliados (personas) |
| `GestionGruposFamiliares/` | ✅ | **ELIMINAR** |
| `GrupoDetalleModal/` | ✅ | **ELIMINAR** |
| `GestionPlanes/` | ✅ | **REFACTOR** (cambiar estructura) |
| `MigrationsDashboard/` | ✅ | **MANTENER** |
| `DatosPersonales/` | ✅ | **MANTENER** |

### Menú actual vs requerido

**Actual:**
```
Mi Cuenta → Datos Personales
Maestros → Cobradores, Tipos de Plan, Obras Sociales, Servicios Adicionales, Tipos de Grupo
Gestión → Afiliados, Grupos Familiares, Planes
Administración → Migraciones
```

**Requerido:**
```
Mi Cuenta → Datos Personales
Maestros → Cobradores, Tipos de Plan, Obras Sociales, Servicios Adicionales, Tipos de Grupo
Planes → [Gestión de Planes con CRUD]
Listados → Búsqueda de Afiliados, Listado de Planes, Planes por Cobrador
[ADMIN] Administración → Migraciones
```

---

## 4. Cambios Pendientes: Detalle

### 4.1 Migraciones

#### ✅ Mantener
- `1.0.0_usuarios/` — Ya existe, funcional

#### ⚠️ Renombrar
- `2.0.1_lookup_tables/` → `1.0.1_tablas_lookup/`
  - Cambiar nombre de carpeta en disco
  - Actualizar comentario SQL
  - Actualizar historial_migraciones en BD si ya fue ejecutada

#### ❌ Eliminar
- `2.0.0_grupos_familiares/` — No existe en spec
- `2.0.2_main_tables/` — Será reemplazado por 1.0.2 + 1.0.3

#### ✨ Crear nuevas
- `1.0.2_planes_y_personas/` — Crear `personas`, `planes`, `plan_integrantes`, `integrante_servicios` (reemplaza parcialmente 2.0.2)
- `1.0.3_historial_cuota_y_recibos/` — Crear `historial_cuota`, `recibos`, `recibo_integrantes`

### 4.2 Models Backend

#### ✅ Mantener
- Cobrador, TipoDePlan, ObraSocial, ServicioAdicional, TipoDeGrupo

#### ❌ Reemplazar
- `Afiliado.js` → `Persona.js` (estructura muy diferente)
  - Quitar: `genero`, `rol`, `grupo_familiar_id`, `telefonos` (JSON)
  - Mantener: `nombre`, `apellido`, `tipo_documento`, `numero_documento`, `fecha_nacimiento`
  - Agregar: `fecha_cobertura`

- `Plan.js` — Refactorizar completamente
  - Actual: `afiliados` (JSON), `cobertura` (JSON), `beneficios` (JSON)
  - Nueva estructura: `persona_id`, `plan_integrantes[]`, `integrante_servicios[]`

#### ❌ Eliminar
- `GrupoFamiliar.js` — No existe en spec
- `Afiliado.js` — Será `Persona.js`

#### ✨ Crear nuevas
- `Persona.js` — Estructura simple: id, apellido, nombre, tipo_documento, numero_documento, fecha_nacimiento, fecha_cobertura
- `PlanIntegrante.js` — id, plan_numero, persona_id, rol, credencial
- `IntegranteServicio.js` — plan_integrante_id, servicio_adicional_numero
- `HistorialCuota.js` — id, plan_numero, valor_anterior, valor_nuevo, fecha_cambio, usuario_id
- `Recibo.js` — id, plan_numero, periodo, [snapshots]
- `ReciboIntegrante.js` — id, recibo_id, [snapshots de persona]

### 4.3 Controllers Backend

#### ✅ Mantener
- `migrationsController.js`
- `lookupController.js`

#### ❌ Eliminar
- `afiliadosController.js` (será `personasController`)
- `gruposController.js`
- `historialController.js`

#### ⚠️ Refactorizar
- `planesController.js` — Cambiar lógica de CRUD según nuevo modelo

#### ✨ Crear nuevas
- `personasController.js` — GET /api/personas?search= (solo búsqueda, no CRUD)
- `recibosController.js` — POST /api/recibos/generar, GET /api/recibos/:id

### 4.4 Routes Backend

#### ✅ Mantener
- `/api/migrations/*`
- `/api/lookup/*`

#### ❌ Eliminar
- `/api/afiliados/*`
- `/api/grupos/*`

#### ⚠️ Refactorizar
- `/api/planes/*` — Cambiar endpoints según spec

#### ✨ Crear nuevas
- `/api/personas?search=...` (solo lectura)
- `/api/recibos/...` (generar, listar, detalle)

### 4.5 Frontend — Componentes

#### ✅ Mantener
- Todo en `Cobradores/`, `TiposDePlan/`, `ObrasSociales/`, `ServiciosAdicionales/`, `TiposDeGrupo/`
- `MigrationsDashboard/`
- `DatosPersonales/`

#### ❌ Eliminar
- `GestionGruposFamiliares/`
- `GrupoDetalleModal/`

#### ⚠️ Refactorizar
- `GestionAfiliados/` → Hacer dos componentes:
  - `BusquedaAfiliados/` (búsqueda de personas, lista planes asociados)
  - Integrar búsqueda de personas en el modal de Plan
  
- `GestionPlanes/` — Cambiar CRUD según nuevo modelo:
  - Quitar campos: cobertura (JSON), beneficios (JSON)
  - Agregar: integrantes (tabla), historial de cuota (pestaña)
  - Cambiar modal de integrante

### 4.6 Menú Dashboard

#### Actual
```
Mi Cuenta → Datos Personales
Maestros → [5 CRUD]
Gestión → Afiliados, Grupos Familiares, Planes
Administración → Migraciones
```

#### Requerido
```
Mi Cuenta → Datos Personales
Maestros → [5 CRUD]
Planes → [Gestión de Planes]
Listados → Búsqueda de Afiliados, Listado de Planes, Planes por Cobrador
[ADMIN] Administración → Migraciones
```

---

## 5. Checklist de Cambios

### Fase 1: Cleanup BD
- [ ] Renombrar carpeta `2.0.1_lookup_tables/` → `1.0.1_tablas_lookup/`
- [ ] Eliminar carpeta `2.0.0_grupos_familiares/`
- [ ] Eliminar/archivar carpeta `2.0.2_main_tables/`
- [ ] Crear carpeta `1.0.2_planes_y_personas/` con SQL correcto
- [ ] Crear carpeta `1.0.3_historial_cuota_y_recibos/` con SQL
- [ ] ¿Ejecutar downgrade de 2.0.2, 2.0.1, 2.0.0 en BD real para resetear?

### Fase 2: Backend Models
- [ ] Eliminar `Afiliado.js`, `GrupoFamiliar.js`
- [ ] Crear `Persona.js`, `PlanIntegrante.js`, `IntegranteServicio.js`
- [ ] Crear `HistorialCuota.js`, `Recibo.js`, `ReciboIntegrante.js`
- [ ] Actualizar `Plan.js` con nueva estructura
- [ ] Actualizar `index.js` para exportar modelos correctos

### Fase 3: Backend Controllers/Routes
- [ ] Eliminar `afiliadosController.js`, `gruposController.js`, `historialController.js`
- [ ] Crear `personasController.js`, `recibosController.js`
- [ ] Refactorizar `planesController.js`
- [ ] Eliminar rutas `/api/afiliados/*`, `/api/grupos/*`
- [ ] Agregar rutas `/api/personas`, `/api/recibos/*`
- [ ] Actualizar `index.js` para montar rutas correctas

### Fase 4: Frontend Components
- [ ] Eliminar `GestionGruposFamiliares/`, `GrupoDetalleModal/`
- [ ] Refactorizar `GestionAfiliados/` → `BusquedaAfiliados/`
- [ ] Refactorizar `GestionPlanes/` (cambiar modelo de datos)
- [ ] Actualizar servicios: `afiliadosService.js` → `personasService.js`, agregar `recibosService.js`
- [ ] Actualizar DashboardPage: menú, rutas, componentes

### Fase 5: Menú Dashboard
- [ ] Actualizar estructura de menú (quitar Gestión, agregar Listados)
- [ ] Agregar sección Admin (visible solo si role === admin)
- [ ] Verificar acceso a Migraciones solo para admin

---

## 6. Conflictos y Decisiones Pendientes

### ❓ Conflicto: ¿Resetear BD o migrar gradualmente?

**Opción A: Resetear (Limpio, recomendado)**
- Ejecutar downgrades: 2.0.2 → 2.0.1 → 2.0.0 → 1.0.0 (o directamente DROP si es desarrollo)
- Ejecutar upgrade: 1.0.1 → 1.0.2 → 1.0.3
- Pro: Sistema coherente desde cero
- Con: Perderán datos si hay datos actuales

**Opción B: Migrar gradualmente (Complejo)**
- Crear path de migración: 2.0.2 → 1.0.2 (conversión data)
- Deletear 2.0.0_grupos_familiares
- Pro: Preserva datos existentes
- Con: Migración manual, difícil de mantener

**Recomendación:** Opción A si es entorno de desarrollo; Opción B si hay datos en producción.

### ❓ Conflicto: ¿Mantener código 2.0.x en git?

**Opción A: Borrar completamente**
- Git rm directorios/archivos 2.0.x
- Historial queda limpie
- Pro: Menos confusión
- Con: Perderá información (aunque está en git log)

**Opción B: Crear rama de archivo (archive)**
- Crear rama `archive/v2.0-grupos-familiares`
- Dejar rama `main` sin código 2.0.x
- Pro: Información preservada, accesible si necesita
- Con: Más ramas, pero documentado

**Recomendación:** Opción B (profesional, preserva historial).

---

## 7. Resumen de Implementación

| Componente | Actual | Requerido | Cambio | Esfuerzo |
|---|---|---|---|---|
| Panel Migraciones | ✅ | ✅ | Mantener | ✅ Ninguno |
| Lookup CRUD | ✅ | ✅ | Mantener/Renombrar | ⚠️ Bajo |
| Modelos BD | 2.0.x | 1.0.x | Refactor completo | ⚠️ Medio-Alto |
| Controllers | 6 | 5-6 | Eliminar 3, Crear 2, Refactor 1 | ⚠️ Medio |
| Routes | Afiliados, Grupos, Planes | Personas, Planes, Recibos | Cambio | ⚠️ Bajo |
| Frontend | Afiliados/Grupos/Planes | Planes/Listados/Búsqueda | Refactor | ⚠️ Medio |
| Menú Dashboard | 4 secciones | 4 secciones reformulado | Reorganizar | ✅ Bajo |
| BD Data | 2.0.2+ | 1.0.3 | Resetear o migrar | ⚠️ Bajo-Medio |

---

**Fin del análisis.**
