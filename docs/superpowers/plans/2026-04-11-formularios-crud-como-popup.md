# Formularios CRUD como Popup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir los formularios inline de creación/edición de GestionAfiliados y GestionPlanes en overlays modales, y reemplazar el select de grupo familiar por un autocomplete con filtrado client-side.

**Architecture:** Se eliminan los estados `vista` de ambos componentes y se reemplazan por `modalAfiliado`/`modalPlan` (`null | 'crear' | 'editar'`). Los formularios existentes (`FormAfiliado`, `FormPlan`) no cambian su lógica interna — solo se envuelven en un overlay modal. El autocomplete de grupo familiar vive dentro de `FormAfiliado` como estado local.

**Tech Stack:** React (hooks), SCSS (BEM), sin librerías externas.

---

## File Map

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx` | Eliminar `vista`, agregar `modalAfiliado`, envolver `FormAfiliado` en overlay, reemplazar select grupo por autocomplete |
| `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss` | Agregar estilos de autocomplete (el `__modal--form` ya existe en el SCSS) |
| `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx` | Eliminar `vista`, agregar `modalPlan`, envolver `FormPlan` en overlay |
| `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.scss` | Agregar variante `__modal--form` con ancho completo |

---

## Task 1: GestionAfiliados — convertir crear/editar a popup modal

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx`

- [ ] **Step 1.1: Reemplazar estado `vista` por `modalAfiliado`**

En `GestionAfiliados` (línea 372), reemplazar:
```jsx
const [vista, setVista] = useState('lista');
```
por:
```jsx
const [modalAfiliado, setModalAfiliado] = useState(null); // null | 'crear' | 'editar'
```

- [ ] **Step 1.2: Actualizar `handleEditar`**

Reemplazar (línea 452):
```jsx
const handleEditar = (afiliado) => {
  setAfiliadoEditando(afiliado);
  setFormPreset(null);
  setVista('editar');
  setError(null);
  setMensaje(null);
};
```
por:
```jsx
const handleEditar = (afiliado) => {
  setAfiliadoEditando(afiliado);
  setFormPreset(null);
  setModalAfiliado('editar');
  setError(null);
  setMensaje(null);
};
```

- [ ] **Step 1.3: Actualizar `handleCancelar`**

Reemplazar (línea 476):
```jsx
const handleCancelar = () => {
  setVista('lista');
  setAfiliadoEditando(null);
  setFormPreset(null);
  setError(null);
};
```
por:
```jsx
const handleCancelar = () => {
  setModalAfiliado(null);
  setAfiliadoEditando(null);
  setFormPreset(null);
  setError(null);
};
```

- [ ] **Step 1.4: Actualizar `handleGuardar` — cerrar modal en vez de cambiar vista**

Dentro de `handleGuardar` (línea 422), reemplazar las dos ocurrencias de `setVista('lista')` por `setModalAfiliado(null)`:

```jsx
const handleGuardar = async (payload) => {
  setActionLoading(true);
  setError(null);
  try {
    if (afiliadoEditando) {
      await afiliadosService.actualizar(afiliadoEditando.id, payload);
      mostrarMensaje('Afiliado actualizado correctamente.');
      setModalAfiliado(null);
      setAfiliadoEditando(null);
      setFormPreset(null);
      await cargarAfiliados(pagination.page);
      await cargarGrupos();
    } else {
      const response = await afiliadosService.crear(payload);
      const grupoId = response.data?.grupo_familiar_id;
      mostrarMensaje('Afiliado creado exitosamente.');
      setModalAfiliado(null);
      setAfiliadoEditando(null);
      setFormPreset(null);
      await cargarAfiliados(pagination.page);
      await cargarGrupos();
      if (grupoId) setGrupoModalId(grupoId);
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Error al guardar los datos.');
  } finally {
    setActionLoading(false);
  }
};
```

- [ ] **Step 1.5: Reemplazar el bloque de render de crear/editar por el overlay modal**

En el return de `GestionAfiliados`, reemplazar:

```jsx
{vista === 'lista' && (
  <TablaAfiliados ... />
)}

{(vista === 'crear' || vista === 'editar') && (
  <FormAfiliado
    inicial={afiliadoEditando}
    preset={formPreset}
    grupos={grupos}
    onGuardar={handleGuardar}
    onCancelar={handleCancelar}
    cargando={actionLoading}
  />
)}
```

por:

```jsx
<TablaAfiliados
  afiliados={afiliados}
  grupos={grupos}
  pagination={pagination}
  filtros={filtros}
  onFiltroChange={handleFiltroChange}
  onEditar={handleEditar}
  onEliminar={handleSolicitarEliminar}
  onVerGrupo={(id) => setGrupoModalId(id)}
  onPaginar={(p) => cargarAfiliados(p)}
/>

{modalAfiliado && (
  <div
    className="gestion-afiliados__modal-overlay"
    onClick={(e) => e.target === e.currentTarget && handleCancelar()}
  >
    <div className="gestion-afiliados__modal gestion-afiliados__modal--form">
      <div className="gestion-afiliados__modal-header">
        <h3 className="gestion-afiliados__modal-title">
          {modalAfiliado === 'crear' ? 'Nuevo afiliado' : 'Editar afiliado'}
        </h3>
        <button className="gestion-afiliados__modal-close" onClick={handleCancelar}>✕</button>
      </div>
      <FormAfiliado
        inicial={afiliadoEditando}
        preset={formPreset}
        grupos={grupos}
        onGuardar={handleGuardar}
        onCancelar={handleCancelar}
        cargando={actionLoading}
      />
    </div>
  </div>
)}
```

- [ ] **Step 1.6: Actualizar el botón "+ Nuevo afiliado"**

Reemplazar (línea 543):
```jsx
onClick={() => { setFormPreset(null); setVista('crear'); setError(null); setMensaje(null); }}
```
por:
```jsx
onClick={() => { setFormPreset(null); setModalAfiliado('crear'); setError(null); setMensaje(null); }}
```

Y eliminar la condición `{vista === 'lista' && ...}` del botón — ahora siempre visible:
```jsx
<button
  className="gestion-afiliados__btn gestion-afiliados__btn--primary"
  onClick={() => { setFormPreset(null); setModalAfiliado('crear'); setError(null); setMensaje(null); }}
>
  + Nuevo afiliado
</button>
```

- [ ] **Step 1.7: Verificar en browser**

Arrancar el frontend (`npm start` en `frontend/`). Verificar:
- La tabla de afiliados siempre es visible.
- Click en "+ Nuevo afiliado" abre el modal sobre la tabla.
- Click en "Editar" en una fila abre el modal con datos pre-rellenados.
- Click fuera del modal o en ✕ lo cierra.
- Guardar exitosamente cierra el modal.

- [ ] **Step 1.8: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx
git commit -m "feat: GestionAfiliados create/edit in popup modal instead of inline view"
```

---

## Task 2: GestionAfiliados — autocomplete para grupo familiar

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx`
- Modify: `frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss`

- [ ] **Step 2.1: Agregar estado del autocomplete en `FormAfiliado`**

Al inicio de `FormAfiliado` (después de la declaración de `[errores, setErrores]`), agregar:

```jsx
// Inicializa el texto visible del autocomplete si se está editando un beneficiario
const initialGrupoInput = () => {
  const id = preset?.grupo_familiar_id || inicial?.grupo_familiar_id;
  if (id && grupos.length > 0) {
    const g = grupos.find((gr) => gr.id === id || gr.id === Number(id));
    if (g) return `${g.nombre}${g.titular ? ` (${g.titular.apellido}, ${g.titular.nombre})` : ''}`;
  }
  return '';
};

const [grupoInput, setGrupoInput] = useState(initialGrupoInput);
const [grupoAbierto, setGrupoAbierto] = useState(false);
```

- [ ] **Step 2.2: Agregar función de filtrado y handler de selección**

Después del estado del autocomplete, agregar:

```jsx
const gruposFiltrados = grupos
  .filter((g) => {
    if (!grupoInput.trim()) return true;
    const q = grupoInput.toLowerCase();
    const nombre = g.nombre?.toLowerCase() || '';
    const titular = g.titular
      ? `${g.titular.nombre} ${g.titular.apellido}`.toLowerCase()
      : '';
    return nombre.includes(q) || titular.includes(q);
  })
  .slice(0, 8);

const handleGrupoInputChange = (e) => {
  setGrupoInput(e.target.value);
  setGrupoAbierto(true);
  setForm((prev) => ({ ...prev, grupo_familiar_id: '' }));
  if (errores.grupo_familiar_id) setErrores((prev) => ({ ...prev, grupo_familiar_id: null }));
};

const handleSeleccionarGrupo = (g) => {
  setForm((prev) => ({ ...prev, grupo_familiar_id: g.id }));
  setGrupoInput(
    `${g.nombre}${g.titular ? ` (${g.titular.apellido}, ${g.titular.nombre})` : ''}`
  );
  setGrupoAbierto(false);
};
```

- [ ] **Step 2.3: Reemplazar el `<select>` de grupo por el autocomplete en el JSX de `FormAfiliado`**

Localizar el bloque (línea ~117):
```jsx
{form.rol === 'beneficiario' && !rolFijo && (
  <div className="gestion-afiliados__field">
    <label>Grupo familiar *</label>
    <select name="grupo_familiar_id" value={form.grupo_familiar_id} onChange={handleChange}>
      <option value="">— Seleccionar grupo —</option>
      {grupos.map((g) => (
        <option key={g.id} value={g.id}>
          {g.nombre} {g.titular ? `(${g.titular.apellido}, ${g.titular.nombre})` : ''}
        </option>
      ))}
    </select>
    {errores.grupo_familiar_id && <span className="gestion-afiliados__field-error">{errores.grupo_familiar_id}</span>}
  </div>
)}
```

Reemplazar por:
```jsx
{form.rol === 'beneficiario' && !rolFijo && (
  <div className="gestion-afiliados__field gestion-afiliados__field--autocomplete">
    <label>Grupo familiar *</label>
    <input
      type="text"
      autoComplete="off"
      placeholder="Buscar grupo familiar..."
      value={grupoInput}
      onChange={handleGrupoInputChange}
      onFocus={() => setGrupoAbierto(true)}
      onBlur={() => setTimeout(() => setGrupoAbierto(false), 150)}
    />
    {grupoAbierto && gruposFiltrados.length > 0 && (
      <ul className="gestion-afiliados__autocomplete-list">
        {gruposFiltrados.map((g) => (
          <li
            key={g.id}
            className="gestion-afiliados__autocomplete-item"
            onMouseDown={() => handleSeleccionarGrupo(g)}
          >
            <span className="gestion-afiliados__autocomplete-nombre">{g.nombre}</span>
            {g.titular && (
              <span className="gestion-afiliados__autocomplete-titular">
                {g.titular.apellido}, {g.titular.nombre}
              </span>
            )}
          </li>
        ))}
      </ul>
    )}
    {errores.grupo_familiar_id && (
      <span className="gestion-afiliados__field-error">{errores.grupo_familiar_id}</span>
    )}
  </div>
)}
```

- [ ] **Step 2.4: Agregar estilos del autocomplete en GestionAfiliados.scss**

Al final de `GestionAfiliados.scss` (antes del cierre de `.gestion-afiliados {}`), agregar:

```scss
// ── Autocomplete de grupo familiar ────────────────────────────────────────────
&__field--autocomplete {
  position: relative;
}

&__autocomplete-list {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  z-index: 20;
  max-height: 220px;
  overflow-y: auto;
}

&__autocomplete-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;

  &:hover { background: #f3f4f6; }
}

&__autocomplete-nombre {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

&__autocomplete-titular {
  font-size: 0.78rem;
  color: #6b7280;
}
```

- [ ] **Step 2.5: Verificar en browser**

Con el modal abierto y rol "Beneficiario":
- Escribir letras en el campo grupo familiar → aparece lista filtrada.
- Seleccionar un ítem → el input muestra el nombre del grupo y la lista se cierra.
- Borrar el texto → `grupo_familiar_id` se vacía.
- Intentar guardar sin seleccionar grupo → aparece el error de validación.
- Al editar un beneficiario existente → el campo aparece pre-rellenado con el nombre del grupo.

- [ ] **Step 2.6: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.jsx
git add frontend/src/pages/DashboardPage/components/GestionAfiliados/GestionAfiliados.scss
git commit -m "feat: replace grupo familiar select with client-side autocomplete in FormAfiliado"
```

---

## Task 3: GestionPlanes — convertir crear/editar a popup modal

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx`
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.scss`

- [ ] **Step 3.1: Agregar estilos de overlay y modal form en GestionPlanes.scss**

En `GestionPlanes.scss`, dentro de `.gestion-planes {}`, el bloque `&__modal-overlay` y `&__modal` ya existen para el confirm de delete. Agregar debajo de `&__modal { ... }` la variante form:

```scss
&__modal--form {
  max-width: 960px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

&__modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

&__modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

&__modal-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  padding: 0.2rem;
  flex-shrink: 0;

  &:hover { color: #111827; }
}
```

- [ ] **Step 3.2: Reemplazar estado `vista` por `modalPlan` en `GestionPlanes`**

Reemplazar (línea 337):
```jsx
const [vista, setVista] = useState('lista');
```
por:
```jsx
const [modalPlan, setModalPlan] = useState(null); // null | 'crear' | 'editar'
```

- [ ] **Step 3.3: Actualizar `handleGuardar`**

Reemplazar las dos ocurrencias de `setVista('lista')` en `handleGuardar` por `setModalPlan(null)`:

```jsx
const handleGuardar = async (payload) => {
  setActionLoading(true);
  setError(null);
  try {
    if (planEditando) {
      await planesService.actualizar(planEditando.id, payload);
      mostrarMensaje('Plan actualizado correctamente.');
    } else {
      await planesService.crear(payload);
      mostrarMensaje('Plan creado exitosamente.');
    }
    setModalPlan(null);
    setPlanEditando(null);
    cargar();
  } catch (err) {
    setError(err.response?.data?.message || 'Error al guardar el plan.');
  } finally {
    setActionLoading(false);
  }
};
```

- [ ] **Step 3.4: Actualizar `handleEditar`**

Reemplazar (línea 399):
```jsx
const handleEditar = (plan) => {
  setPlanEditando(plan);
  setVista('editar');
  setError(null);
  setMensaje(null);
};
```
por:
```jsx
const handleEditar = (plan) => {
  setPlanEditando(plan);
  setModalPlan('editar');
  setError(null);
  setMensaje(null);
};
```

- [ ] **Step 3.5: Actualizar `handleCancelar`**

Reemplazar (línea 406):
```jsx
const handleCancelar = () => {
  setVista('lista');
  setPlanEditando(null);
  setError(null);
};
```
por:
```jsx
const handleCancelar = () => {
  setModalPlan(null);
  setPlanEditando(null);
  setError(null);
};
```

- [ ] **Step 3.6: Reemplazar render de vista inline por tabla siempre visible + overlay modal**

En el return de `GestionPlanes`, reemplazar:

```jsx
{vista === 'lista' && isAdmin && (
  <button
    className="gestion-planes__btn gestion-planes__btn--primary"
    onClick={() => { setVista('crear'); setError(null); setMensaje(null); }}
  >
    + Nuevo plan
  </button>
)}
```
y
```jsx
{vista === 'lista' && (
  <TablaPlanes ... />
)}

{(vista === 'crear' || vista === 'editar') && (
  <>
    <h3 className="gestion-planes__form-title">
      {vista === 'crear' ? 'Nuevo plan' : `Editando: ${planEditando?.nombre}`}
    </h3>
    <FormPlan
      inicial={planEditando}
      onGuardar={handleGuardar}
      onCancelar={handleCancelar}
      cargando={actionLoading}
    />
  </>
)}
```

por el siguiente bloque completo (reemplaza todo el cuerpo del return desde `<div className="gestion-planes">`):

```jsx
return (
  <div className="gestion-planes">
    <div className="gestion-planes__header">
      <h2 className="gestion-planes__title">Planes de Servicio</h2>
      {isAdmin && (
        <button
          className="gestion-planes__btn gestion-planes__btn--primary"
          onClick={() => { setModalPlan('crear'); setError(null); setMensaje(null); }}
        >
          + Nuevo plan
        </button>
      )}
    </div>

    {error && (
      <div className="gestion-planes__alert gestion-planes__alert--error">{error}</div>
    )}
    {mensaje && (
      <div className={`gestion-planes__alert gestion-planes__alert--${mensaje.tipo}`}>
        {mensaje.texto}
      </div>
    )}

    <TablaPlanes
      planes={planesFiltrados}
      isAdmin={isAdmin}
      filtros={filtros}
      onFiltroChange={handleFiltroChange}
      onEditar={handleEditar}
      onEliminar={(p) => setPlanBorrando(p)}
    />

    {modalPlan && (
      <div
        className="gestion-planes__modal-overlay"
        onClick={(e) => e.target === e.currentTarget && handleCancelar()}
      >
        <div className="gestion-planes__modal gestion-planes__modal--form">
          <div className="gestion-planes__modal-header">
            <h3 className="gestion-planes__modal-title">
              {modalPlan === 'crear' ? 'Nuevo plan' : `Editar plan: ${planEditando?.nombre}`}
            </h3>
            <button className="gestion-planes__modal-close" onClick={handleCancelar}>✕</button>
          </div>
          <FormPlan
            inicial={planEditando}
            onGuardar={handleGuardar}
            onCancelar={handleCancelar}
            cargando={actionLoading}
          />
        </div>
      </div>
    )}

    {planBorrando && (
      <ModalConfirmar
        plan={planBorrando}
        onConfirmar={handleEliminar}
        onCancelar={() => setPlanBorrando(null)}
        cargando={actionLoading}
      />
    )}
  </div>
);
```

- [ ] **Step 3.7: Verificar en browser**

- La tabla de planes siempre es visible.
- Click en "+ Nuevo plan" abre el modal sobre la tabla.
- Click en "Editar" en una fila abre el modal con datos pre-rellenados y título "Editar plan: {nombre}".
- Click fuera del modal o en ✕ lo cierra.
- Guardar exitosamente cierra el modal.
- El modal de confirm de delete sigue funcionando igual.

- [ ] **Step 3.8: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx
git add frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.scss
git commit -m "feat: GestionPlanes create/edit in popup modal instead of inline view"
```
