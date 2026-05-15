# Diseño: Gestión de Planes v1.0

**Fecha**: 2026-04-13  
**Versión**: V_1.0.2  
**Rama**: `V_1.0.2`

## Resumen Ejecutivo

Implementar una pantalla de gestión de planes v1.0 que permita crear, editar y consultar planes con su grupo de afiliados asociados. Los planes utilizan el modelo relacional v1.0 (PlanV1 + PlanIntegrante) y están ligados a Obra Social, Tipo de Plan, Cobrador y Tipo de Grupo.

## Requisitos Funcionales

### RF1: Listar Planes
- Tabla con listado de todos los planes (modelo PlanV1)
- Columnas: Número de afiliado, Tipo de Plan, Cobrador, Obra Social, Estado
- Botones de acción: Editar, Suspender (no eliminar)
- Estado visual diferente para planes SUSPENDIDO vs ACTIVO
- Filtros opcionales (estado, cobrador, obra social)

### RF2: Crear Nuevo Plan
Al hacer click en "Nuevo Plan":

1. **Modal principal se abre** con:
   - **Formulario del plan** (2 columnas):
     - Número de afiliado (auto-sugerido basado en MAX + 1, editable, debe ser único)
     - Tipo de Plan (select con lookup)
     - Cobrador (select con lookup)
     - Obra Social (select con lookup)
     - Tipo de Grupo (select con lookup)
     - Estado (select: ACTIVO por defecto)
     - Valor de Cuota (número, decimales)
     - Domicilio (texto)
     - Teléfono (texto)
   
   - **Tab "Afiliados"** (visible inmediatamente):
     - Tabla vacía con columnas: Nombre, Apellido, DNI, Rol, Acciones
     - Botón "Agregar Afiliado"
   
   - **Pie**: Botón "Guardar" + "Cancelar"

2. **Agregar Afiliados** (click en "Agregar Afiliado"):
   - Abre modal secundario **AfiladoSearchModal**:
     - Campos de búsqueda: Nombre, Apellido, DNI
     - Botón "Buscar"
     - Tabla de resultados (Nombre, Apellido, DNI, Select)
     - Botón "Crear nuevo afiliado" si no encuentra
   
   - Si selecciona afiliado existente:
     - Select para elegir rol: Titular / Adherente
     - Botón "Confirmar" → agrega a tabla
   
   - Si hace click "Crear nuevo":
     - Form con campos: Nombre, Apellido, Tipo de Documento (select), Número de Documento, Fecha de Nacimiento, Fecha de Cobertura
     - Select para rol inicial
     - Botón "Crear y agregar" → crea en tabla personas y agrega al plan

3. **Validación al guardar**:
   - Debe haber al menos 1 Titular
   - Número de afiliado debe ser único
   - No puede haber afiliados duplicados
   - Campos obligatorios: número_afiliado, tipo_plan, cobrador, valor_cuota, al menos 1 titular

### RF3: Editar Plan Existente
Al hacer click en "Editar" en la tabla:

1. **Modal principal se abre** con:
   - **Mismo formulario** que crear (con datos precargados)
   - **Tabs**: "Afiliados" | "Recibos"
   
   - **Tab "Afiliados"**:
     - Tabla de afiliados actuales
     - Columnas: Nombre, Apellido, DNI, Rol (select editable), Acciones (lápiz + basura)
     - Botón "Agregar Afiliado" (mismo modal que RF2)
   
   - **Tab "Recibos"** (solo si existen):
     - Tabla: Número de recibo, Período (mes/año), Monto
     - Recibos son clickeables → abre modal de detalles

2. **Editar datos del afiliado** (click en lápiz):
   - Abre **AfiladoEditModal**:
     - Campos editables: Nombre, Apellido, Tipo de Documento, Número de Documento, Fecha de Nacimiento, Fecha de Cobertura
     - El rol se cambia desde el select de la tabla, NO en este modal
     - Botón "Guardar cambios" → actualiza BD en tabla personas

3. **Cambiar rol del afiliado** (select "Titular/Adherente"):
   - Select editable directamente en la tabla
   - Cambio inmediato sin confirmación extra
   - Validación: No permite dejar sin Titular

4. **Quitar afiliado** (click en basura):
   - Confirmación: "¿Estás seguro?"
   - Elimina la relación plan_integrante (afiliado permanece en BD)

5. **Ver detalle de recibo** (click en fila de recibo):
   - Abre modal **ReciboDetalleModal** con:
     - Número de recibo
     - Período
     - Número de afiliado
     - Titular (apellido, nombre)
     - Obra Social
     - Tipo de Plan
     - Tipo de Grupo
     - Cobrador
     - Domicilio
     - Valor de cuota
     - Fecha de emisión

### RF4: Suspender Plan
Al hacer click en "Suspender":
- Cambiar estado a SUSPENDIDO
- Confirmación: "¿Estás seguro?"
- Plan no se elimina, solo cambia estado
- Sigue siendo editable (datos, afiliados)

### RF5: Encabezado Fijo en Tabla de Planes
Cuando la cantidad de planes mostrados en la tabla genera una barra de scroll vertical:
- El encabezado de la tabla (row con nombres de columnas) permanece fijo en la parte superior
- Los elementos de control arriba de la tabla permanecen fijos:
  - Título "Planes"
  - Textbox de búsqueda/filtro
  - Botones de acciones (Nuevo Plan, etc.)
- Al hacer scroll vertical, solo el contenido (filas de planes) se desplaza
- El encabezado y controles siguen siendo visibles y accesibles
- **Implementación**: Usar CSS `position: sticky` o `position: fixed` según sea necesario para mantener usabilidad

## Validaciones y Reglas de Negocio

### Validaciones de Rol Titular
1. **Debe haber al menos 1 Titular** en todo momento
2. Si intentas quitar el único Titular:
   - Mostrar error: "No puedes quitar el único titular. Asigna otro titular primero."
3. Si intentas cambiar el único Titular a Adherente:
   - Mostrar error: "Debe haber al menos un titular. Designa otro primero."
4. **Solución**: Forzar cambio de rol a otro afiliado antes de permitir la acción

### Validaciones de Número de Afiliado
1. Auto-sugerido = MAX(numero_afiliado) + 1
2. Debe ser único en la BD
3. Editable pero validado contra duplicados
4. Error si intenta usar uno existente: "Ya existe un plan con ese número de afiliado"

### Validaciones de Duplicados
1. No se puede agregar el mismo afiliado dos veces al mismo plan
2. Al buscar/seleccionar afiliado, verificar que no esté ya en la tabla
3. Error si intenta duplicar: "Este afiliado ya está asignado al plan"

### Validaciones al Guardar Plan
1. Campos obligatorios:
   - numero_afiliado
   - tipo_plan_numero
   - cobrador_numero
   - tipo_de_grupo_numero
   - os_numero
   - valor_cuota
   - Al menos 1 afiliado con rol Titular
2. Errores mostrados en rojo junto al campo

### Planes Suspendidos
1. Estado SUSPENDIDO no genera nuevos recibos
2. Pero pueden editarse datos, afiliados, cambiar estado a ACTIVO nuevamente

## Arquitectura Técnica

### Frontend

**Componentes:**
- `GestionPlanesV1.jsx` — Tabla de planes, acciones principales
- `PlanV1Modal.jsx` — Modal principal (formulario + tabs)
- `AfiladoSearchModal.jsx` — Modal de búsqueda/creación de afiliados
- `AfiladoEditModal.jsx` — Modal de edición de datos del afiliado
- `ReciboDetalleModal.jsx` — Modal de detalles del recibo

**Servicios:**
- `planesV1Service.js` — Llamadas a `/api/v1.0/planes`
- `planesIntegrantesService.js` (o dentro de planesV1Service) — CRUD de afiliados en plan
- `personasService.js` — Búsqueda/creación de afiliados
- `recibosService.js` — Obtener recibos de un plan

**Estado:**
- Context API o zustand para notificaciones (éxito/error)
- useState local en cada modal para formularios

**Estilos:**
- SCSS con estructura modular por componente
- Reutilizar variables de color/spacing existentes
- Modales con max-width: 960px (patrón del proyecto)

### Backend

**Endpoints utilizados (ya existen):**
- `GET /api/v1.0/planes` — Listar planes
- `GET /api/v1.0/planes/:planNumero` — Obtener un plan con afiliados
- `POST /api/v1.0/planes` — Crear plan
- `PUT /api/v1.0/planes/:planNumero` — Actualizar plan
- `DELETE /api/v1.0/planes/:planNumero` — Eliminar (no usar, usar cambio de estado)

**Modelos:**
- `PlanV1` — Plan con todos los campos
- `PlanIntegrante` — Relación plan-persona con rol
- `Persona` — Datos del afiliado
- `Recibo` — Recibos generados

**Controllers:**
- `v1.0/planesController.js` — Ya implementado
- `v1.0/personasController.js` — Para búsqueda/creación de personas

## Flujo de Datos

```
Usuario abre GestionPlanesV1
  ↓
GET /api/v1.0/planes → Tabla se carga
  ↓
Click "Nuevo Plan" → PlanV1Modal abre (vacío)
  ↓
Rellena formulario + agrega afiliados via AfiladoSearchModal
  ↓
Click "Guardar"
  ├─ POST /api/v1.0/planes (crea plan)
  ├─ POST plan_integrantes (crea relaciones con afiliados)
  ├─ Mensaje de éxito
  └─ Tabla se actualiza

---

Click "Editar" en plan existente → PlanV1Modal abre (con datos)
  ↓
Tabs: "Afiliados" | "Recibos"
  ├─ Tab Afiliados:
  │   ├─ Puede agregar/editar/quitar
  │   ├─ Click "Agregar" → AfiladoSearchModal
  │   ├─ Click lápiz → AfiladoEditModal
  │   └─ Click basura → Confirma y quita
  │
  └─ Tab Recibos:
      ├─ GET /api/v1.0/planes/:planNumero (con include de recibos)
      └─ Click recibo → ReciboDetalleModal

Click "Guardar cambios"
  ├─ PUT /api/v1.0/planes/:planNumero (actualiza plan)
  ├─ Actualiza relaciones de afiliados
  └─ Mensaje de éxito
```

## Estructura de Carpetas (Frontend)

```
frontend/src/
├── pages/DashboardPage/components/
│   └── GestionPlanesV1/
│       ├── GestionPlanesV1.jsx (componente principal)
│       ├── GestionPlanesV1.scss
│       ├── modals/
│       │   ├── PlanV1Modal.jsx
│       │   ├── PlanV1Modal.scss
│       │   ├── AfiladoSearchModal.jsx
│       │   ├── AfiladoSearchModal.scss
│       │   ├── AfiladoEditModal.jsx
│       │   ├── AfiladoEditModal.scss
│       │   ├── ReciboDetalleModal.jsx
│       │   └── ReciboDetalleModal.scss
│       └── hooks/
│           └── usePlanV1Form.js (lógica compartida)
├── services/
│   ├── planesV1Service.js
│   ├── planesIntegrantesService.js
│   └── (o consolidar en planesV1Service.js)
```

## Casos de Uso Principales

### CU1: Admin crea nuevo plan
1. Click "Nuevo Plan"
2. Rellena formulario (tipo plan, cobrador, obra social, etc.)
3. Agrega al menos 1 afiliado como Titular
4. Agrega más afiliados como Adherentes (opcional)
5. Click "Guardar"
6. Plan se crea con todos sus afiliados
7. Mensaje: "Plan creado exitosamente"

### CU2: Admin edita un plan existente
1. Click "Editar" en tabla
2. Modifica datos del plan (valor cuota, domicilio, etc.)
3. Tab "Afiliados": puede agregar/quitar/cambiar rol de afiliados
4. Click "Guardar cambios"
5. Plan y afiliados se actualizan
6. Mensaje: "Plan actualizado correctamente"

### CU3: Admin consulta recibos de un plan
1. Click "Editar" en tabla
2. Tab "Recibos" (si existen)
3. Tabla muestra recibos (número, período, monto)
4. Click en recibo → ve detalles completos

### CU4: Cambiar rol de afiliado
1. En tabla de afiliados, select "Rol"
2. Elige Titular o Adherente
3. Si hay validación (ej: solo 1 Titular), muestra error
4. Cambio se aplica inmediatamente al guardar plan

## Testing Scope

### Manual Testing (Smoke Tests)
- [ ] Crear plan nuevo completo (con múltiples afiliados)
- [ ] Editar plan existente
- [ ] Agregar/quitar afiliados
- [ ] Cambiar rol de afiliado
- [ ] Ver detalles de recibo
- [ ] Suspender plan
- [ ] Validaciones (error si falta Titular, número duplicado, etc.)

### Automatizado
- Service tests para planesV1Service
- Component tests para modales (si aplica)

## Notas de Implementación

1. **Reutilizar LookupCRUD** para selects dinámicos (tipo plan, cobrador, etc.) si existe
2. **Mantener modales con max-width 960px** (patrón del proyecto)
3. **Validación dual**: Frontend (UX) + Backend (seguridad)
4. **Manejo de errores**: Mostrar mensajes claros del backend en alertas
5. **Loading states**: Deshabilitar botones durante operaciones async
6. **Auto-sugerencia de número de afiliado**: Hacer en frontend (o backend en GET al abrir modal)

## Dependencias y Modelos

- `PlanV1` — Modelo principal
- `PlanIntegrante` — Relación plan-persona
- `Persona` — Datos del afiliado
- `TipoDePlan`, `Cobrador`, `TipoDeGrupo`, `ObraSocial` — Lookups
- `Recibo` — Para tab de recibos

## Definición de Listo

- [ ] Componente GestionPlanesV1 renderiza tabla de planes
- [ ] Modal de crear plan funciona (form + tabla de afiliados)
- [ ] Modal de editar plan funciona
- [ ] Búsqueda y creación de afiliados funciona
- [ ] Tab de recibos muestra datos correctos
- [ ] Todas las validaciones funcionan
- [ ] Errores se muestran correctamente
- [ ] Mensajes de éxito se muestran
- [ ] Estados ACTIVO/SUSPENDIDO funcionan
- [ ] Encabezado y controles quedan fijos al hacer scroll en tabla (RF5)
