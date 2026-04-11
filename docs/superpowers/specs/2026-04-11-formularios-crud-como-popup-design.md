# Diseño: Formularios CRUD como popup

**Fecha:** 2026-04-11  
**Rama:** V_1.0.1  
**Alcance:** GestionAfiliados y GestionPlanes

---

## Contexto y motivación

Actualmente, los formularios de creación y edición en `GestionAfiliados` y `GestionPlanes` usan un patrón de "vista inline": un estado `vista` ('lista' | 'crear' | 'editar') reemplaza el contenido de la tabla por el formulario. Esto interrumpe el flujo del usuario y no es consistente con el patrón modal ya establecido en `GrupoDetalleModal`.

Se establece la regla general: **todo CRUD debe presentarse como popup modal**, no inline.

Además, el campo de selección de grupo familiar para beneficiarios en GestionAfiliados se mejora de un `<select>` plano a un autocomplete con filtrado client-side.

---

## Regla general aplicada

- Todo formulario de alta/edición se renderiza en un overlay modal (`position: fixed; inset: 0`) con un contenedor de `max-width: 960px; width: 95%` — misma anchura que la tabla de datos.
- Los modales de confirmación de eliminación (max-width pequeño) no cambian.

---

## Componente 1: GestionAfiliados

### Cambios en estado

**Antes:**
```js
const [vista, setVista] = useState('lista'); // 'lista' | 'crear' | 'editar'
```

**Después:**
```js
// vista se elimina
const [modalAfiliado, setModalAfiliado] = useState(null); // null | 'crear' | 'editar'
```

La tabla siempre está visible. El modal se superpone sobre ella.

### Estructura del modal

```
overlay (position: fixed, full screen, rgba background)
└── modal (max-width: 960px, width: 95%, max-height: 90vh, overflow-y: auto)
    ├── header
    │   ├── título ("Nuevo afiliado" | "Editar afiliado")
    │   └── botón ✕ → cierra modal
    └── FormAfiliado (componente existente, sin cambios de lógica interna)
```

El overlay se cierra al hacer click fuera del modal (igual que GrupoDetalleModal).

### Autocomplete de grupo familiar

Se reemplaza el `<select name="grupo_familiar_id">` dentro de `FormAfiliado` cuando `rol === 'beneficiario'` y `!rolFijo` por un componente autocomplete inline:

**Comportamiento:**
1. El usuario escribe en un `<input>` de texto libre.
2. Se filtra el array `grupos` (ya cargado en memoria) por coincidencia en: nombre del grupo, nombre del titular o apellido del titular (case-insensitive).
3. Se muestra una lista desplegable (`<ul>` posicionado absolutamente bajo el input) con hasta 8 resultados.
4. Al hacer click en un ítem: se setea `grupo_familiar_id` en el estado del form y se muestra el nombre del grupo en el input. La lista se cierra.
5. Si el usuario borra el texto después de seleccionar, `grupo_familiar_id` vuelve a vacío.
6. La lista se cierra al hacer click fuera (evento `blur` con delay para permitir el click en ítems).
7. Validación existente sin cambios: si `rol === 'beneficiario'` y `grupo_familiar_id` está vacío, muestra error.

**Estado interno del autocomplete (dentro de `FormAfiliado`):**
```js
const [grupoInput, setGrupoInput] = useState('');      // texto visible
const [grupoAbierto, setGrupoAbierto] = useState(false); // dropdown visible
```

**No requiere cambios en backend ni en `afiliadosService`.**

### Flujos afectados

| Acción | Antes | Después |
|--------|-------|---------|
| Click "+ Nuevo afiliado" | `setVista('crear')` — reemplaza tabla | Abre modal sobre la tabla |
| Click "Editar" en fila | `setVista('editar')` — reemplaza tabla | Abre modal sobre la tabla |
| Guardar exitoso | `setVista('lista')` | Cierra modal |
| Cancelar / ✕ | `setVista('lista')` | Cierra modal |

### SCSS

`GestionAfiliados.scss` ya tiene `.gestion-afiliados__modal-overlay` y `.gestion-afiliados__modal` (usados para el confirm de delete, max-width 540px). Se agrega una variante `--form` con el ancho completo:

```scss
&__modal {
  // existente: max-width: 540px (confirm delete)
  
  &--form {
    max-width: 960px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
  }
}
```

---

## Componente 2: GestionPlanes

### Cambios en estado

**Antes:**
```js
const [vista, setVista] = useState('lista'); // 'lista' | 'crear' | 'editar'
```

**Después:**
```js
// vista se elimina
const [modalPlan, setModalPlan] = useState(null); // null | 'crear' | 'editar'
```

### Estructura del modal

```
overlay (position: fixed, full screen, rgba background)
└── modal (max-width: 960px, width: 95%, max-height: 90vh, overflow-y: auto)
    ├── header
    │   ├── título ("Nuevo plan" | "Editar plan: {nombre}")
    │   └── botón ✕ → cierra modal
    └── FormPlan (componente existente, sin cambios de lógica interna)
```

### Flujos afectados

| Acción | Antes | Después |
|--------|-------|---------|
| Click "+ Nuevo plan" | `setVista('crear')` — reemplaza tabla | Abre modal sobre la tabla |
| Click "Editar" en fila | `setVista('editar')` — reemplaza tabla | Abre modal sobre la tabla |
| Guardar exitoso | `setVista('lista')` | Cierra modal |
| Cancelar / ✕ | `setVista('lista')` | Cierra modal |

### SCSS

`GestionPlanes.scss` agrega overlay/modal para el formulario. El modal de confirm de delete existente (`max-width: 420px`) no cambia. Se agrega:

```scss
&__modal--form {
  max-width: 960px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}
```

---

## Lo que NO cambia

- `GrupoDetalleModal`: "+Agregar beneficiario" ya es un sub-modal popup — sin cambios.
- Modales de confirmación de eliminación en ambos componentes — sin cambios.
- `ModalSeleccionNuevoTitular` en GestionAfiliados — sin cambios.
- Lógica de `handleGuardar`, `handleEliminar`, servicios, validaciones — sin cambios.
- Backend — sin cambios.

---

## Archivos a modificar

1. `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx`
   - Eliminar estado `vista`, agregar `modalAfiliado`
   - Envolver `FormAfiliado` en overlay modal
   - Reemplazar `<select>` de grupo por autocomplete inline

2. `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss`
   - Agregar variante `__modal--form` con ancho completo

3. `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx`
   - Eliminar estado `vista`, agregar `modalPlan`
   - Envolver `FormPlan` en overlay modal

4. `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.scss`
   - Agregar overlay/modal para el formulario
