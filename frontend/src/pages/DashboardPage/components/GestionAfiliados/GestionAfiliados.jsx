import React, { useCallback, useEffect, useState } from 'react';
import afiliadosService from '../../../../services/afiliadosService';
import GrupoDetalleModal, { ModalSeleccionNuevoTitular } from '../GrupoDetalleModal/GrupoDetalleModal';
import './GestionAfiliados.scss';

// ── Formulario de creación / edición ────────────────────────────────────────

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  fecha_nacimiento: '',
  tipo_documento: 'DNI',
  numero_documento: '',
  genero: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigo_postal: '',
  email_contacto: '',
  telefonos: '',
  rol: 'titular',
  grupo_familiar_id: '',
};

function FormAfiliado({ inicial, preset, grupos, onGuardar, onCancelar, cargando, rolFijo = false }) {
  const [form, setForm] = useState({
    ...FORM_VACIO,
    ...inicial,
    telefonos: inicial?.telefonos ? JSON.stringify(inicial.telefonos) : '',
    rol: preset?.rol || inicial?.rol || 'titular',
    grupo_familiar_id: preset?.grupo_familiar_id || inicial?.grupo_familiar_id || '',
  });
  const [errores, setErrores] = useState({});

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.apellido.trim()) e.apellido = 'El apellido es requerido';
    if (!form.tipo_documento) e.tipo_documento = 'El tipo de documento es requerido';
    if (!form.numero_documento.trim()) e.numero_documento = 'El número de documento es requerido';
    else if (form.numero_documento.trim().length < 6) e.numero_documento = 'Debe tener al menos 6 caracteres';
    if (form.rol === 'beneficiario' && !form.grupo_familiar_id) {
      e.grupo_familiar_id = 'El grupo familiar es requerido para un beneficiario';
    }
    if (form.telefonos.trim()) {
      try {
        const parsed = JSON.parse(form.telefonos);
        if (!Array.isArray(parsed)) e.telefonos = 'Debe ser un arreglo JSON válido';
      } catch {
        e.telefonos = 'Formato JSON inválido';
      }
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validar();
    if (Object.keys(e2).length > 0) { setErrores(e2); return; }
    const payload = { ...form };
    payload.telefonos = form.telefonos.trim() ? JSON.parse(form.telefonos) : null;
    if (!payload.fecha_nacimiento) payload.fecha_nacimiento = null;
    if (!payload.genero) payload.genero = null;
    if (payload.rol === 'titular') payload.grupo_familiar_id = null;
    else payload.grupo_familiar_id = parseInt(payload.grupo_familiar_id, 10) || null;
    onGuardar(payload);
  };

  return (
    <form className="gestion-afiliados__form" onSubmit={handleSubmit} noValidate>
      <div className="gestion-afiliados__form-grid">

        <div className="gestion-afiliados__field">
          <label>Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} maxLength={100} />
          {errores.nombre && <span className="gestion-afiliados__field-error">{errores.nombre}</span>}
        </div>

        <div className="gestion-afiliados__field">
          <label>Apellido *</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} maxLength={100} />
          {errores.apellido && <span className="gestion-afiliados__field-error">{errores.apellido}</span>}
        </div>

        <div className="gestion-afiliados__field">
          <label>Tipo de documento *</label>
          <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange}>
            <option value="DNI">DNI</option>
            <option value="CI">CI</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
          {errores.tipo_documento && <span className="gestion-afiliados__field-error">{errores.tipo_documento}</span>}
        </div>

        <div className="gestion-afiliados__field">
          <label>Número de documento *</label>
          <input name="numero_documento" value={form.numero_documento} onChange={handleChange} maxLength={20} />
          {errores.numero_documento && <span className="gestion-afiliados__field-error">{errores.numero_documento}</span>}
        </div>

        {!rolFijo && (
          <div className="gestion-afiliados__field">
            <label>Rol</label>
            <select name="rol" value={form.rol} onChange={handleChange} disabled={!!inicial}>
              <option value="titular">Titular</option>
              <option value="beneficiario">Beneficiario</option>
            </select>
          </div>
        )}

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

        <div className="gestion-afiliados__field">
          <label>Fecha de nacimiento</label>
          <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento || ''} onChange={handleChange} />
        </div>

        <div className="gestion-afiliados__field">
          <label>Género</label>
          <select name="genero" value={form.genero || ''} onChange={handleChange}>
            <option value="">— Sin especificar —</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="gestion-afiliados__field gestion-afiliados__field--full">
          <label>Dirección</label>
          <input name="direccion" value={form.direccion || ''} onChange={handleChange} maxLength={255} />
        </div>

        <div className="gestion-afiliados__field">
          <label>Ciudad</label>
          <input name="ciudad" value={form.ciudad || ''} onChange={handleChange} maxLength={100} />
        </div>

        <div className="gestion-afiliados__field">
          <label>Provincia</label>
          <input name="provincia" value={form.provincia || ''} onChange={handleChange} maxLength={100} />
        </div>

        <div className="gestion-afiliados__field">
          <label>Código postal</label>
          <input name="codigo_postal" value={form.codigo_postal || ''} onChange={handleChange} maxLength={10} />
        </div>

        <div className="gestion-afiliados__field">
          <label>Email de contacto</label>
          <input type="email" name="email_contacto" value={form.email_contacto || ''} onChange={handleChange} maxLength={255} />
        </div>

        <div className="gestion-afiliados__field gestion-afiliados__field--full">
          <label>
            Teléfonos{' '}
            <span className="gestion-afiliados__field-hint">
              (JSON, ej: [{'"tipo":"celular","numero":"1123456789"'}])
            </span>
          </label>
          <textarea name="telefonos" value={form.telefonos || ''} onChange={handleChange} rows={2} />
          {errores.telefonos && <span className="gestion-afiliados__field-error">{errores.telefonos}</span>}
        </div>
      </div>

      <div className="gestion-afiliados__form-actions">
        <button type="submit" className="gestion-afiliados__btn gestion-afiliados__btn--primary" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" className="gestion-afiliados__btn gestion-afiliados__btn--secondary" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Tabla admin ──────────────────────────────────────────────────────────────

function TablaAfiliados({ afiliados, grupos, pagination, onEditar, onEliminar, onVerGrupo, onPaginar, filtros, onFiltroChange }) {
  const grupoMap = Object.fromEntries((grupos || []).map((g) => [g.id, g]));

  return (
    <div>
      <div className="gestion-afiliados__filtros">
        <input
          className="gestion-afiliados__filtro-input"
          placeholder="Buscar por nombre, documento o email..."
          value={filtros.search}
          onChange={(e) => onFiltroChange('search', e.target.value)}
        />
        <select
          className="gestion-afiliados__filtro-select"
          value={filtros.estado}
          onChange={(e) => onFiltroChange('estado', e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="suspendido">Suspendido</option>
        </select>
        <select
          className="gestion-afiliados__filtro-select"
          value={filtros.rol}
          onChange={(e) => onFiltroChange('rol', e.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="titular">Titular</option>
          <option value="beneficiario">Beneficiario</option>
        </select>
      </div>

      {afiliados.length === 0 ? (
        <p className="gestion-afiliados__empty">No se encontraron afiliados.</p>
      ) : (
        <>
          <div className="gestion-afiliados__tabla-wrapper">
            <table className="gestion-afiliados__tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Rol</th>
                  <th>Grupo familiar</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {afiliados.map((a) => {
                  const grupo = a.grupo || (a.grupo_familiar_id ? grupoMap[a.grupo_familiar_id] : null);
                  return (
                    <tr key={a.id}>
                      <td>{a.nombre} {a.apellido}</td>
                      <td>{a.tipo_documento} {a.numero_documento}</td>
                      <td>
                        <span className={`gestion-afiliados__rol-badge gestion-afiliados__rol-badge--${a.rol}`}>
                          {a.rol === 'titular' ? 'Titular' : 'Beneficiario'}
                        </span>
                      </td>
                      <td>
                        {grupo ? (
                          <button
                            className="gestion-afiliados__btn-grupo"
                            onClick={() => onVerGrupo(a.grupo_familiar_id)}
                            title="Ver grupo familiar"
                          >
                            {grupo.nombre}
                          </button>
                        ) : '—'}
                      </td>
                      <td>{a.email_contacto ?? '—'}</td>
                      <td>
                        <span className={`gestion-afiliados__estado gestion-afiliados__estado--${a.estado}`}>
                          {a.estado}
                        </span>
                      </td>
                      <td className="gestion-afiliados__tabla-acciones">
                        <button
                          className="gestion-afiliados__btn-icon gestion-afiliados__btn-icon--edit"
                          onClick={() => onEditar(a)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          className="gestion-afiliados__btn-icon gestion-afiliados__btn-icon--delete"
                          onClick={() => onEliminar(a)}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="gestion-afiliados__paginacion">
            <span className="gestion-afiliados__paginacion-info">
              {pagination.total} afiliados — Página {pagination.page} de {pagination.pages}
            </span>
            <div className="gestion-afiliados__paginacion-btns">
              <button
                className="gestion-afiliados__btn gestion-afiliados__btn--secondary"
                onClick={() => onPaginar(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Anterior
              </button>
              <button
                className="gestion-afiliados__btn gestion-afiliados__btn--secondary"
                onClick={() => onPaginar(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Modal de confirmación ────────────────────────────────────────────────────

function ModalConfirmar({ afiliado, onConfirmar, onCancelar, cargando }) {
  return (
    <div className="gestion-afiliados__modal-overlay">
      <div className="gestion-afiliados__modal">
        <h3 className="gestion-afiliados__modal-title">Confirmar eliminación</h3>
        <p>
          ¿Estás seguro de que querés eliminar a{' '}
          <strong>{afiliado.nombre} {afiliado.apellido}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="gestion-afiliados__modal-actions">
          <button
            className="gestion-afiliados__btn gestion-afiliados__btn--danger"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button
            className="gestion-afiliados__btn gestion-afiliados__btn--secondary"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

function GestionAfiliados() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [afiliados, setAfiliados] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filtros, setFiltros] = useState({ search: '', estado: '', rol: '' });

  const [modalAfiliado, setModalAfiliado] = useState(null); // null | 'crear' | 'editar'
  const [afiliadoEditando, setAfiliadoEditando] = useState(null);
  const [afiliadoBorrando, setAfiliadoBorrando] = useState(null);
  const [formPreset, setFormPreset] = useState(null);
  const [grupoModalId, setGrupoModalId] = useState(null);
  // null | { afiliado, beneficiarios: Array }
  const [eliminacionPendiente, setEliminacionPendiente] = useState(null);

  // ── Carga ──────────────────────────────────────────────────────────────────

  const cargarAfiliados = useCallback(async (page = 1) => {
    setError(null);
    try {
      const result = await afiliadosService.listar({ page, limit: 10, ...filtros });
      setAfiliados(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar afiliados.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const cargarGrupos = useCallback(async () => {
    try {
      const data = await afiliadosService.listarGrupos();
      setGrupos(data);
    } catch {
      // no-op: grupos no críticos para mostrar la tabla
    }
  }, []);

  useEffect(() => {
    Promise.all([cargarAfiliados(), cargarGrupos()]);
  }, [cargarAfiliados, cargarGrupos]);

  useEffect(() => {
    if (!loading) {
      cargarAfiliados(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 4000);
  };

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

  const handleEditar = (afiliado) => {
    setAfiliadoEditando(afiliado);
    setFormPreset(null);
    setModalAfiliado('editar');
    setError(null);
    setMensaje(null);
  };

  const handleEliminar = async () => {
    setActionLoading(true);
    try {
      await afiliadosService.eliminar(afiliadoBorrando.id);
      mostrarMensaje('Afiliado eliminado correctamente.');
      setAfiliadoBorrando(null);
      await cargarAfiliados(pagination.page);
      await cargarGrupos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el afiliado.');
      setAfiliadoBorrando(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = () => {
    setModalAfiliado(null);
    setAfiliadoEditando(null);
    setFormPreset(null);
    setError(null);
  };

  const handleSolicitarEliminar = async (afiliado) => {
    if (afiliado.rol !== 'titular' || !afiliado.grupo_familiar_id) {
      setAfiliadoBorrando(afiliado);
      return;
    }
    try {
      const grupo = await afiliadosService.obtenerGrupo(afiliado.grupo_familiar_id);
      const beneficiarios = (grupo.miembros || []).filter((m) => m.rol === 'beneficiario');
      if (beneficiarios.length > 0) {
        setEliminacionPendiente({ afiliado, beneficiarios });
      } else {
        setAfiliadoBorrando(afiliado);
      }
    } catch {
      setAfiliadoBorrando(afiliado);
    }
  };

  const handleConfirmarNuevoTitularYEliminar = async (nuevoTitularId) => {
    setActionLoading(true);
    setError(null);
    try {
      await afiliadosService.actualizar(nuevoTitularId, { rol: 'titular' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al promover el nuevo titular.');
      setActionLoading(false);
      return;
    }
    try {
      await afiliadosService.eliminar(eliminacionPendiente.afiliado.id);
      mostrarMensaje('Afiliado eliminado y nuevo titular asignado.');
      setEliminacionPendiente(null);
      await cargarAfiliados(pagination.page);
      await cargarGrupos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el titular anterior.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNuevoAfiliado = () => {
    setFormPreset(null);
    setModalAfiliado('crear');
    setError(null);
    setMensaje(null);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="gestion-afiliados">
        <div className="gestion-afiliados__loading">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="gestion-afiliados">
      <div className="gestion-afiliados__header">
        <h2 className="gestion-afiliados__title">Gestión de Afiliados</h2>
        <button
          className="gestion-afiliados__btn gestion-afiliados__btn--primary"
          onClick={handleNuevoAfiliado}
        >
          + Nuevo afiliado
        </button>
      </div>

      {error && <div className="gestion-afiliados__alert gestion-afiliados__alert--error">{error}</div>}
      {mensaje && (
        <div className={`gestion-afiliados__alert gestion-afiliados__alert--${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

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

      {afiliadoBorrando && (
        <ModalConfirmar
          afiliado={afiliadoBorrando}
          onConfirmar={handleEliminar}
          onCancelar={() => setAfiliadoBorrando(null)}
          cargando={actionLoading}
        />
      )}

      {grupoModalId && (
        <GrupoDetalleModal
          grupoId={grupoModalId}
          onClose={() => setGrupoModalId(null)}
          onRefresh={() => { cargarAfiliados(pagination.page); cargarGrupos(); }}
        />
      )}

      {eliminacionPendiente && (
        <ModalSeleccionNuevoTitular
          beneficiarios={eliminacionPendiente.beneficiarios}
          onConfirmar={handleConfirmarNuevoTitularYEliminar}
          onCancelar={() => setEliminacionPendiente(null)}
          cargando={actionLoading}
        />
      )}
    </div>
  );
}

export default GestionAfiliados;
