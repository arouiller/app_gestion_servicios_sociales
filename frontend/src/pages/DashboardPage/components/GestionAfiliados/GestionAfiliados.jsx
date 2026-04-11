import React, { useCallback, useEffect, useState } from 'react';
import afiliadosService from '../../../../services/afiliadosService';
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

// ── Modal de confirmación de desvinculación ──────────────────────────────────

function ModalConfirmarDesvinculacion({ afiliado, onConfirmar, onCancelar, cargando }) {
  return (
    <div className="gestion-afiliados__modal-overlay">
      <div className="gestion-afiliados__modal">
        <h3 className="gestion-afiliados__modal-title">Confirmar desvinculación</h3>
        <p>
          ¿Confirmás que querés desvincular a{' '}
          <strong>{afiliado.nombre} {afiliado.apellido}</strong> del grupo?
          Pasará a ser titular de su propio grupo{' '}
          <strong>"Familia {afiliado.apellido} {afiliado.nombre}"</strong>.
        </p>
        <div className="gestion-afiliados__modal-actions">
          <button
            className="gestion-afiliados__btn gestion-afiliados__btn--danger"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Desvinculando...' : 'Confirmar desvinculación'}
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

// ── Sección de beneficiarios (visible al editar un titular) ──────────────────

function SeccionBeneficiarios({ grupoId, onRefresh }) {
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desvinculando, setDesvinculando] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [mostrarFormBeneficiario, setMostrarFormBeneficiario] = useState(false);
  const [formCargando, setFormCargando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const grupo = await afiliadosService.obtenerGrupo(grupoId);
      setMiembros((grupo.miembros || []).filter((m) => m.rol === 'beneficiario'));
    } catch {
      setError('Error al cargar los beneficiarios del grupo.');
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDesvincular = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await afiliadosService.desvincularBeneficiario(grupoId, desvinculando.id);
      setDesvinculando(null);
      await cargar();
      onRefresh();
    } catch {
      setError('Error al desvincular el beneficiario.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGuardarBeneficiario = async (payload) => {
    setFormCargando(true);
    setError(null);
    try {
      await afiliadosService.crear({ ...payload, rol: 'beneficiario', grupo_familiar_id: grupoId });
      setMostrarFormBeneficiario(false);
      await cargar();
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el beneficiario.');
    } finally {
      setFormCargando(false);
    }
  };

  return (
    <div className="gestion-afiliados__beneficiarios-seccion">
      <div className="gestion-afiliados__beneficiarios-header">
        <h4 className="gestion-afiliados__beneficiarios-titulo">Beneficiarios del grupo</h4>
        <button
          className="gestion-afiliados__btn gestion-afiliados__btn--primary"
          onClick={() => setMostrarFormBeneficiario(true)}
        >
          + Agregar beneficiario
        </button>
      </div>

      {error && <div className="gestion-afiliados__alert gestion-afiliados__alert--error">{error}</div>}

      {loading ? (
        <div className="gestion-afiliados__loading">Cargando beneficiarios...</div>
      ) : miembros.length === 0 ? (
        <p className="gestion-afiliados__empty">Este grupo no tiene beneficiarios.</p>
      ) : (
        <div className="gestion-afiliados__tabla-wrapper">
          <table className="gestion-afiliados__tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((m) => (
                <tr key={m.id}>
                  <td>{m.nombre} {m.apellido}</td>
                  <td>{m.tipo_documento} {m.numero_documento}</td>
                  <td>
                    <span className={`gestion-afiliados__estado gestion-afiliados__estado--${m.estado}`}>
                      {m.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="gestion-afiliados__btn-icon gestion-afiliados__btn-icon--delete"
                      onClick={() => setDesvinculando(m)}
                      title="Desvincular del grupo"
                    >
                      Desvincular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {desvinculando && (
        <ModalConfirmarDesvinculacion
          afiliado={desvinculando}
          onConfirmar={handleDesvincular}
          onCancelar={() => setDesvinculando(null)}
          cargando={actionLoading}
        />
      )}

      {mostrarFormBeneficiario && (
        <div className="gestion-afiliados__modal-overlay" onClick={(e) => e.target === e.currentTarget && setMostrarFormBeneficiario(false)}>
          <div className="gestion-afiliados__modal gestion-afiliados__modal--form">
            <div className="gestion-afiliados__modal-header">
              <h3 className="gestion-afiliados__modal-title">Nuevo beneficiario</h3>
              <button className="gestion-afiliados__modal-close" onClick={() => setMostrarFormBeneficiario(false)}>✕</button>
            </div>
            <FormAfiliado
              inicial={null}
              preset={{ rol: 'beneficiario', grupo_familiar_id: grupoId }}
              grupos={[]}
              onGuardar={handleGuardarBeneficiario}
              onCancelar={() => setMostrarFormBeneficiario(false)}
              cargando={formCargando}
              rolFijo
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal de grupo familiar ──────────────────────────────────────────────────

function GrupoModal({ grupoId, onClose, onAgregarBeneficiario, onRefresh }) {
  const [grupo, setGrupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [desvinculando, setDesvinculando] = useState(null);
  const [desvinculandoCargando, setDesvinculandoCargando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nombreEdit, setNombreEdit] = useState('');
  const [error, setError] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await afiliadosService.obtenerGrupo(grupoId);
      setGrupo(data);
      setNombreEdit(data.nombre);
    } catch {
      setError('Error al cargar el grupo familiar.');
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDesvincular = async () => {
    setDesvinculandoCargando(true);
    setError(null);
    try {
      await afiliadosService.desvincularBeneficiario(grupoId, desvinculando.id);
      setDesvinculando(null);
      await cargar();
      onRefresh();
    } catch {
      setError('Error al desvincular el beneficiario.');
    } finally {
      setDesvinculandoCargando(false);
    }
  };

  const cargarHistorial = async () => {
    if (historial.length > 0) { setMostrarHistorial(true); return; }
    setHistorialLoading(true);
    try {
      const data = await afiliadosService.obtenerHistorialGrupo(grupoId);
      setHistorial(data);
      setMostrarHistorial(true);
    } catch {
      setError('Error al cargar el historial del grupo.');
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleGuardarNombre = async () => {
    if (!nombreEdit.trim()) return;
    setError(null);
    try {
      await afiliadosService.actualizarGrupo(grupoId, { nombre: nombreEdit.trim() });
      setEditando(false);
      await cargar();
      onRefresh();
    } catch {
      setError('Error al actualizar el nombre del grupo.');
    }
  };

  return (
    <div className="gestion-afiliados__modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gestion-afiliados__modal gestion-afiliados__modal--grupo">
        <div className="gestion-afiliados__modal-header">
          {editando ? (
            <div className="gestion-afiliados__modal-nombre-edit">
              <input
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
                className="gestion-afiliados__modal-nombre-input"
                autoFocus
              />
              <button className="gestion-afiliados__btn gestion-afiliados__btn--primary" onClick={handleGuardarNombre}>
                Guardar
              </button>
              <button className="gestion-afiliados__btn gestion-afiliados__btn--secondary" onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <div className="gestion-afiliados__modal-titulo-row">
              <h3 className="gestion-afiliados__modal-title">{loading ? '...' : grupo?.nombre}</h3>
              {!loading && (
                <button
                  className="gestion-afiliados__btn-icon gestion-afiliados__btn-icon--edit"
                  onClick={() => setEditando(true)}
                  title="Renombrar grupo"
                >
                  Renombrar
                </button>
              )}
            </div>
          )}
          <button className="gestion-afiliados__modal-close" onClick={onClose} title="Cerrar">✕</button>
        </div>

        {error && <div className="gestion-afiliados__alert gestion-afiliados__alert--error">{error}</div>}

        {loading ? (
          <div className="gestion-afiliados__loading">Cargando grupo...</div>
        ) : (
          <>
            <div className="gestion-afiliados__tabla-wrapper">
              <table className="gestion-afiliados__tabla">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {grupo?.miembros?.length === 0 && (
                    <tr><td colSpan={5} className="gestion-afiliados__empty">Sin miembros registrados.</td></tr>
                  )}
                  {grupo?.miembros?.map((m) => (
                    <tr key={m.id}>
                      <td>{m.nombre} {m.apellido}</td>
                      <td>{m.tipo_documento} {m.numero_documento}</td>
                      <td>
                        <span className={`gestion-afiliados__rol-badge gestion-afiliados__rol-badge--${m.rol}`}>
                          {m.rol === 'titular' ? 'Titular' : 'Beneficiario'}
                        </span>
                      </td>
                      <td>
                        <span className={`gestion-afiliados__estado gestion-afiliados__estado--${m.estado}`}>
                          {m.estado}
                        </span>
                      </td>
                      <td>
                        {m.rol === 'beneficiario' && (
                          <button
                            className="gestion-afiliados__btn-icon gestion-afiliados__btn-icon--delete"
                            onClick={() => setDesvinculando(m)}
                            title="Desvincular del grupo"
                          >
                            Desvincular
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="gestion-afiliados__historial-seccion">
              <button
                className="gestion-afiliados__historial-toggle"
                onClick={() => mostrarHistorial ? setMostrarHistorial(false) : cargarHistorial()}
              >
                {mostrarHistorial ? '▲ Ocultar historial' : '▼ Ver historial del grupo'}
              </button>

              {mostrarHistorial && (
                historialLoading ? (
                  <div className="gestion-afiliados__loading">Cargando historial...</div>
                ) : historial.length === 0 ? (
                  <p className="gestion-afiliados__empty">Sin historial registrado.</p>
                ) : (
                  <div className="gestion-afiliados__tabla-wrapper">
                    <table className="gestion-afiliados__tabla">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Afiliado</th>
                          <th>Acción</th>
                          <th>Ejecutado por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((h) => (
                          <tr key={h.id}>
                            <td>{new Date(h.fecha).toLocaleString('es-AR')}</td>
                            <td>{h.afiliado ? `${h.afiliado.nombre} ${h.afiliado.apellido}` : '—'}</td>
                            <td>
                              <span className={`gestion-afiliados__accion-badge gestion-afiliados__accion-badge--${h.accion}`}>
                                {h.accion === 'ingreso' ? 'Ingreso' : 'Baja'}
                              </span>
                            </td>
                            <td>{h.ejecutado_por ? `${h.ejecutado_por.nombre} ${h.ejecutado_por.apellido}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            <div className="gestion-afiliados__modal-actions">
              <button
                className="gestion-afiliados__btn gestion-afiliados__btn--primary"
                onClick={() => onAgregarBeneficiario(grupoId)}
              >
                + Agregar beneficiario
              </button>
              <button className="gestion-afiliados__btn gestion-afiliados__btn--secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>

      {desvinculando && (
        <ModalConfirmarDesvinculacion
          afiliado={desvinculando}
          onConfirmar={handleDesvincular}
          onCancelar={() => setDesvinculando(null)}
          cargando={desvinculandoCargando}
        />
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

  const [vista, setVista] = useState('lista');
  const [afiliadoEditando, setAfiliadoEditando] = useState(null);
  const [afiliadoBorrando, setAfiliadoBorrando] = useState(null);
  const [formPreset, setFormPreset] = useState(null);
  const [grupoModalId, setGrupoModalId] = useState(null);

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
      } else {
        await afiliadosService.crear(payload);
        mostrarMensaje('Afiliado creado exitosamente.');
      }
      setVista('lista');
      setAfiliadoEditando(null);
      setFormPreset(null);
      await cargarAfiliados(pagination.page);
      await cargarGrupos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los datos.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditar = (afiliado) => {
    setAfiliadoEditando(afiliado);
    setFormPreset(null);
    setVista('editar');
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
    setVista('lista');
    setAfiliadoEditando(null);
    setFormPreset(null);
    setError(null);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleAgregarBeneficiario = (grupoId) => {
    setGrupoModalId(null);
    setFormPreset({ rol: 'beneficiario', grupo_familiar_id: grupoId });
    setAfiliadoEditando(null);
    setVista('crear');
    setError(null);
    setMensaje(null);
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
        {vista === 'lista' && (
          <button
            className="gestion-afiliados__btn gestion-afiliados__btn--primary"
            onClick={() => { setFormPreset(null); setVista('crear'); setError(null); setMensaje(null); }}
          >
            + Nuevo afiliado
          </button>
        )}
      </div>

      {error && <div className="gestion-afiliados__alert gestion-afiliados__alert--error">{error}</div>}
      {mensaje && (
        <div className={`gestion-afiliados__alert gestion-afiliados__alert--${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {vista === 'lista' && (
        <TablaAfiliados
          afiliados={afiliados}
          grupos={grupos}
          pagination={pagination}
          filtros={filtros}
          onFiltroChange={handleFiltroChange}
          onEditar={handleEditar}
          onEliminar={(a) => setAfiliadoBorrando(a)}
          onVerGrupo={(id) => setGrupoModalId(id)}
          onPaginar={(p) => cargarAfiliados(p)}
        />
      )}

      {(vista === 'crear' || vista === 'editar') && (
        <>
          <FormAfiliado
            inicial={afiliadoEditando}
            preset={formPreset}
            grupos={grupos}
            onGuardar={handleGuardar}
            onCancelar={handleCancelar}
            cargando={actionLoading}
          />
          {vista === 'editar' && afiliadoEditando?.rol === 'titular' && afiliadoEditando?.grupo_familiar_id && (
            <SeccionBeneficiarios
              grupoId={afiliadoEditando.grupo_familiar_id}
              onRefresh={() => { cargarAfiliados(pagination.page); cargarGrupos(); }}
            />
          )}
        </>
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
        <GrupoModal
          grupoId={grupoModalId}
          onClose={() => setGrupoModalId(null)}
          onAgregarBeneficiario={handleAgregarBeneficiario}
          onRefresh={() => { cargarAfiliados(pagination.page); cargarGrupos(); }}
        />
      )}
    </div>
  );
}

export default GestionAfiliados;
