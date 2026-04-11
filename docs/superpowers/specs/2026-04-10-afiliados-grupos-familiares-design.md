# Diseño: Mejoras en Afiliados y Grupos Familiares

**Fecha:** 2026-04-10  
**Rama:** V_1.0.1

---

## Resumen

Mejoras al módulo de afiliados y grupos familiares que incorporan:
1. Filtro por rol en el listado de afiliados (titular / beneficiario / todos)
2. Sección de gestión de beneficiarios inline al editar un titular
3. Flujo de desvinculación de beneficiario con confirmación y promoción automática a titular
4. Historial de membresía de grupos familiares (quién ingresó / fue dado de baja, cuándo y por quién)

---

## Estado actual

- `afiliados` ya tiene columna `rol ENUM('titular','beneficiario')` y `grupo_familiar_id`
- Al crear un titular se auto-crea un `grupos_familiares` (lógica ya implementada)
- El modal de grupo tiene un botón "Quitar" que cambia el rol a titular y setea `grupo_familiar_id = null`, pero no crea grupo nuevo ni registra historial
- No existe tabla de historial
- El listado de afiliados no soporta filtro por rol

---

## Base de datos

### Nueva migración: `1.0.3_historial_grupos`

```sql
-- upgrade.sql
CREATE TABLE historial_grupo_familiar (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id      INT NOT NULL,
  afiliado_id   INT NOT NULL,
  accion        ENUM('ingreso','baja') NOT NULL,
  usuario_id    INT NOT NULL,
  notas         VARCHAR(255) NULL,
  fecha         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hgf_grupo    FOREIGN KEY (grupo_id)    REFERENCES grupos_familiares(id) ON DELETE CASCADE,
  CONSTRAINT fk_hgf_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id)         ON DELETE CASCADE,
  CONSTRAINT fk_hgf_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)           ON DELETE CASCADE,
  INDEX idx_hgf_grupo    (grupo_id),
  INDEX idx_hgf_afiliado (afiliado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- downgrade.sql
DROP TABLE IF EXISTS historial_grupo_familiar;
```

### Momentos de escritura al historial

| Acción | Registro |
|--------|----------|
| Crear afiliado titular | `ingreso` en el grupo auto-creado |
| Agregar beneficiario a un grupo | `ingreso` en ese grupo |
| Desvincular beneficiario | `baja` en el grupo original + `ingreso` en el nuevo grupo auto-creado |

---

## Backend

### Modificaciones a `afiliadosController.js`

**`listar`**: agregar soporte para filtro `rol` en `req.query`. Si está presente, se agrega `where.rol = rol`.

**`crear`**: después de crear el afiliado, registrar en `historial_grupo_familiar`:
- Titular: `accion = 'ingreso'`, `grupo_id = grupo_auto_creado.id`
- Beneficiario: `accion = 'ingreso'`, `grupo_id = grupo_familiar_id`
- `usuario_id = req.userId`

### Modificaciones a `gruposController.js`

**Nuevo endpoint: `POST /api/grupos-familiares/:id/desvincular/:afiliadoId`** (admin only)

Flujo:
1. Validar que el afiliado existe, pertenece al grupo `:id` y tiene `rol = 'beneficiario'`
2. Crear nuevo `grupos_familiares` con `nombre = "Familia [Apellido] [Nombre]"`
3. Actualizar afiliado: `rol = 'titular'`, `grupo_familiar_id = nuevo_grupo.id`
4. Registrar `baja` en historial del grupo original (`grupo_id = :id`)
5. Registrar `ingreso` en historial del nuevo grupo (`grupo_id = nuevo_grupo.id`)
6. Responder con el afiliado actualizado y el nuevo grupo

### Nuevo controlador: `historialController.js`

**`listarHistorial`** — `GET /api/grupos-familiares/:id/historial`

Acceso:
- Admin: puede consultar cualquier grupo
- Usuario no-admin: solo puede consultar el historial del grupo al que pertenece su afiliado

Respuesta: array de entradas ordenadas por `fecha DESC`, cada una con:
```json
{
  "id": 1,
  "accion": "ingreso",
  "fecha": "2026-04-10T...",
  "afiliado": { "id": 5, "nombre": "Juan", "apellido": "Pérez" },
  "ejecutado_por": { "id": 2, "nombre": "Admin" }
}
```

### Nuevas rutas en `grupos.js`

```
POST /api/grupos-familiares/:id/desvincular/:afiliadoId  — admin only
GET  /api/grupos-familiares/:id/historial                — cualquier usuario autenticado
```

---

## Frontend

### `afiliadosService.js` — nuevos métodos

```js
listar(params)  // agrega parámetro rol al existente
desvincularBeneficiario(grupoId, afiliadoId)   // POST /grupos-familiares/:id/desvincular/:afiliadoId
obtenerHistorialGrupo(grupoId)                  // GET /grupos-familiares/:id/historial
```

### `GestionAfiliados.jsx`

**Filtro por rol:**
- Agregar `<select>` con opciones: Todos, Titular, Beneficiario en la barra de filtros de `TablaAfiliados`
- El valor se incluye en `filtros` y se pasa a `afiliadosService.listar`

**Sección de beneficiarios al editar un titular:**
- Cuando `vista === 'editar'` y el afiliado tiene `rol === 'titular'`, debajo del `FormAfiliado` se renderiza `SeccionBeneficiarios`
- `SeccionBeneficiarios` recibe el `grupo_familiar_id` del titular, carga los miembros del grupo y muestra una tabla con: nombre, documento, estado, botón "Desvincular"
- Botón "**+ Agregar beneficiario**" abre `ModalNuevoBeneficiario` con el formulario completo, `rol` fijo en `'beneficiario'` (sin selector de rol), `grupo_familiar_id` pre-cargado

**`ModalConfirmarDesvinculacion`** (nuevo):
- Se abre al hacer clic en "Desvincular" sobre un beneficiario
- Mensaje: _"¿Confirmás que querés desvincular a [Nombre Apellido] del grupo? Pasará a ser titular de su propio grupo 'Familia [Apellido] [Nombre]'."_
- Al confirmar llama a `afiliadosService.desvincularBeneficiario(grupoId, afiliadoId)`
- Reemplaza al actual botón "Quitar" del `GrupoModal`

**`GrupoModal` — sección historial (admin):**
- Agrega pestaña o sección colapsable "Historial" que carga `afiliadosService.obtenerHistorialGrupo(grupoId)`
- Tabla: Fecha | Afiliado | Acción | Ejecutado por

### `PerfilAfiliado` (usuario no-admin)

- Si el afiliado tiene `grupo_familiar_id`, se agrega sección colapsable "Historial del grupo" que carga `afiliadosService.obtenerHistorialGrupo(grupo_familiar_id)`
- Solo visible si hay historial

---

## Flujo completo de desvinculación

```
Admin clic "Desvincular" en beneficiario
  → ModalConfirmarDesvinculacion (muestra nombre del nuevo grupo)
    → Confirmar
      → POST /api/grupos-familiares/:id/desvincular/:afiliadoId
        → crea nuevo grupo "Familia Apellido Nombre"
        → actualiza afiliado (titular, nuevo grupo)
        → registra baja en grupo original
        → registra ingreso en nuevo grupo
      → refresca lista de miembros + historial
```

---

## Lo que NO cambia

- La lógica de auto-creación de grupo al crear un titular (ya funciona)
- El flujo de creación de beneficiario desde el modal de grupo (se mantiene, también accesible desde la sección inline del titular)
- Los permisos existentes (admin vs usuario)
- La paginación y otros filtros del listado de afiliados
