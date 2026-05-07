import React, { useCallback, useEffect, useState } from 'react';
import afiliadosService from '../../../../services/afiliadosService';
import useColumnResize from '../../../../hooks/useColumnResize';
import './GrupoDetalleModal.scss';

// ── Constante compartida ─────────────────────────────────────────────────────

const FORM_VACIO = {
  nombre: '', apellido: '', fecha_nacimiento: '', tipo_documento: 'DNI',
  numero_documento: '', genero: '', direccion: '', ciudad: '', provincia: '',
  codigo_postal: '', email_contacto: '', telefonos: '',
};

function validarCampos(form) {
  const e = {};
  if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
  if (!form.apellido.trim()) e.apellido = 'El apellido es requerido';
  if (!form.tipo_documento) e.tipo_documento = 'El tipo de documento es requerido';
  if (!form.numero_documento.trim()) e.numero_documento = 'El número de documento es requerido';
  else if (form.numero_documento.trim().length < 6) e.numero_documento = 'Debe tener al menos 6 caracteres';
  if (form.telefonos?.trim()) {
    try {
      const p = JSON.parse(form.telefonos);
      if (!Array.isArray(p)) e.telefonos = 'Debe ser un arreglo JSON';
    } catch {
      e.telefonos = 'Formato JSON inválido';
    }
  }
  return e;
}

// ── FormBeneficiario ─────────────────────────────────────────────────────────

function FormBeneficiario({ grupoId, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [errores, setErrores] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validarCampos(form);
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }
    const payload = { ...form };
    payload.telefonos = form.telefonos.trim() ? JSON.parse(form.telefonos) : null;
    if (!payload.fecha_nacimiento) payload.fecha_nacimiento = null;
    if (!payload.genero) payload.genero = null;
    payload.rol = 'beneficiario';
    payload.grupo_familiar_id = grupoId;
    onGuardar(payload);
  };

  return (
    <form className="grupo-detalle__form" onSubmit={handleSubmit} noValidate>
      <div className="grupo-detalle__form-grid">
        <div className="grupo-detalle__field">
          <label>Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} maxLength={100} />
          {errores.nombre && <span className="grupo-detalle__field-error">{errores.nombre}</span>}
        </div>
        <div className="grupo-detalle__field">
          <label>Apellido *</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} maxLength={100} />
          {errores.apellido && <span className="grupo-detalle__field-error">{errores.apellido}</span>}
        </div>
        <div className="grupo-detalle__field">
          <label>Tipo de documento *</label>
          <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange}>
            <option value="DNI">DNI</option>
            <option value="CI">CI</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
          {errores.tipo_documento && <span className="grupo-detalle__field-error">{errores.tipo_documento}</span>}
        </div>
        <div className="grupo-detalle__field">
          <label>Número de documento *</label>
          <input name="numero_documento" value={form.numero_documento} onChange={handleChange} maxLength={20} />
          {errores.numero_documento && <span className="grupo-detalle__field-error">{errores.numero_documento}</span>}
        </div>
        <div className="grupo-detalle__field">
          <label>Fecha de nacimiento</label>
          <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
        </div>
        <div className="grupo-detalle__field">
          <label>Género</label>
          <select name="genero" value={form.genero} onChange={handleChange}>
            <option value="">— Sin especificar —</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="grupo-detalle__field grupo-detalle__field--full">
          <label>Dirección</label>
          <input name="direccion" value={form.direccion} onChange={handleChange} maxLength={255} />
        </div>
        <div className="grupo-detalle__field">
          <label>Ciudad</label>
          <input name="ciudad" value={form.ciudad} onChange={handleChange} maxLength={100} />
        </div>
        <div className="grupo-detalle__field">
          <label>Provincia</label>
          <input name="provincia" value={form.provincia} onChange={handleChange} maxLength={100} />
        </div>
        <div className="grupo-detalle__field">
          <label>Código postal</label>
          <input name="codigo_postal" value={form.codigo_postal} onChange={handleChange} maxLength={10} />
        </div>
        <div className="grupo-detalle__field">
          <label>Email de contacto</label>
          <input type="email" name="email_contacto" value={form.email_contacto} onChange={handleChange} maxLength={255} />
        </div>
        <div className="grupo-detalle__field grupo-detalle__field--full">
          <label>
            Teléfonos{' '}
            <span className="grupo-detalle__field-hint">(JSON, ej: [{'"tipo":"celular","numero":"1123456789"'}])</span>
          </label>
          <textarea name="telefonos" value={form.telefonos} onChange={handleChange} rows={2} />
          {errores.telefonos && <span className="grupo-detalle__field-error">{errores.telefonos}</span>}
        </div>
      </div>
      <div className="grupo-detalle__form-actions">
        <button type="submit" className="grupo-detalle__btn grupo-detalle__btn--primary" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar beneficiario'}
        </button>
        <button type="button" className="grupo-detalle__btn grupo-detalle__btn--secondary" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── FormMiembro ──────────────────────────────────────────────────────────────

function FormMiembro({ miembro, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({
    ...FORM_VACIO,
    ...miembro,
    telefonos: miembro?.telefonos ? JSON.stringify(miembro.telefonos) : '',
  });
  const [errores, setErrores] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validarCampos(form);
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }
    const payload = { ...form };
    payload.telefonos = form.telefonos?.trim() ? JSON.parse(form.telefonos) : null;
    if (!payload.fecha_nacimiento) payload.fecha_nacimiento = null;
    if (!payload.genero) payload.genero = null;
    onGuardar(payload);
  };

  return (
    <form className="grupo-detalle__form" onSubmit={handleSubmit} noValidate>
      <div className="grupo-detalle__form-grid">
        <div className="grupo-detalle__field">
          <label>Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} maxLength={100} />
          {errores.nombre && <span className="grupo-detalle__field-error">{errores.nombre}</span>}
        </div>
        <div className="grupo-detalle__field">
          <label>Apellido *</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} maxLength={100} />
          {errores.apellido && <span className="grupo-detalle__field-error">{errores.apellido}</span>}
        </div>
        <div className="grupo-detalle__field">
          <label>Tipo de documento *</label>
          <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange}>
            <option value="DNI">DNI</option>
            <option value="CI">CI</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
          {errores.tipo_documento && <span className="grupo-detalle__field-error">{errores.tipo_documento}</span>}
        </div>
        <div className="grupo-detalle__field">
          <label>Número de documento *</label>
          <input name="numero_documento" value={form.numero_documento} onChange={handleChange} maxLength={20} />
          {errores.numero_documento && <span className="grupo-detalle__field-error">{errores.numero_documento}</span>}
        </div>
        <div className="grupo-detalle__field">
          <label>Fecha de nacimiento</label>
          <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento || ''} onChange={handleChange} />
        </div>
        <div className="grupo-detalle__field">
          <label>Género</label>
          <select name="genero" value={form.genero || ''} onChange={handleChange}>
            <option value="">— Sin especificar —</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="grupo-detalle__field grupo-detalle__field--full">
          <label>Dirección</label>
          <input name="direccion" value={form.direccion || ''} onChange={handleChange} maxLength={255} />
        </div>
        <div className="grupo-detalle__field">
          <label>Ciudad</label>
          <input name="ciudad" value={form.ciudad || ''} onChange={handleChange} maxLength={100} />
        </div>
        <div className="grupo-detalle__field">
          <label>Provincia</label>
          <input name="provincia" value={form.provincia || ''} onChange={handleChange} maxLength={100} />
        </div>
        <div className="grupo-detalle__field">
          <label>Código postal</label>
          <input name="codigo_postal" value={form.codigo_postal || ''} onChange={handleChange} maxLength={10} />
        </div>
        <div className="grupo-detalle__field">
          <label>Email de contacto</label>
          <input type="email" name="email_contacto" value={form.email_contacto || ''} onChange={handleChange} maxLength={255} />
        </div>
        <div className="grupo-detalle__field grupo-detalle__field--full">
          <label>
            Teléfonos{' '}
            <span className="grupo-detalle__field-hint">(JSON, ej: [{'"tipo":"celular","numero":"1123456789"'}])</span>
          </label>
          <textarea name="telefonos" value={form.telefonos || ''} onChange={handleChange} rows={2} />
          {errores.telefonos && <span className="grupo-detalle__field-error">{errores.telefonos}</span>}
        </div>
      </div>
      <div className="grupo-detalle__form-actions">
        <button type="submit" className="grupo-detalle__btn grupo-detalle__btn--primary" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button type="button" className="grupo-detalle__btn grupo-detalle__btn--secondary" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── ModalSeleccionNuevoTitular ───────────────────────────────────────────────

export function ModalSeleccionNuevoTitular({ beneficiarios, onConfirmar, onCancelar, cargando }) {
  const [seleccionado, setSeleccionado] = useState(null);

  return (
    <div className="grupo-detalle__overlay">
      <div className="grupo-detalle__modal grupo-detalle__modal--small">
        <h3 className="grupo-detalle__modal-title">Seleccionar nuevo titular</h3>
        <p className="grupo-detalle__modal-desc">
          El afiliado que vas a eliminar es titular del grupo. Seleccioná quién asumirá como nuevo
          titular antes de continuar.
        </p>
        <div className="grupo-detalle__radio-list">
          {beneficiarios.map((b) => (
            <label key={b.id} className="grupo-detalle__radio-item">
              <input
                type="radio"
                name="nuevo_titular"
                value={b.id}
                checked={seleccionado === b.id}
                onChange={() => setSeleccionado(b.id)}
              />
              <span>{b.nombre} {b.apellido} — {b.tipo_documento} {b.numero_documento}</span>
            </label>
          ))}
        </div>
        <div className="grupo-detalle__modal-actions">
          <button
            className="grupo-detalle__btn grupo-detalle__btn--danger"
            onClick={() => onConfirmar(seleccionado)}
            disabled={!seleccionado || cargando}
          >
            {cargando ? 'Procesando...' : 'Confirmar y eliminar'}
          </button>
          <button
            className="grupo-detalle__btn grupo-detalle__btn--secondary"
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

// ── GrupoDetalleModal ────────────────────────────────────────────────────────

function GrupoDetalleModal({ grupoId, onClose, onRefresh }) {
  const [grupo, setGrupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nombreEdit, setNombreEdit] = useState('');
  const [miembroEditando, setMiembroEditando] = useState(null);
  // null | { miembro, tipo: 'simple' } | { miembro, tipo: 'titular_con_beneficiarios', beneficiarios }
  const [miembroEliminando, setMiembroEliminando] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [mostrarFormBeneficiario, setMostrarFormBeneficiario] = useState(false);
  const [formCargando, setFormCargando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  // Column resize hooks for 2 tables
  const { widths: widthsMiembros, getResizeHandle: getResizeHandleMiembros } = useColumnResize(
    'grupo-detalle-miembros',
    { nombre: 160, documento: 140, rol: 100, estado: 110, acciones: 120 }
  );
  const { widths: widthsHistorial, getResizeHandle: getResizeHandleHistorial } = useColumnResize(
    'grupo-detalle-historial',
    { fecha: 180, afiliado: 160, accion: 140, ejecutadoPor: 140 }
  );

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

  const handleSolicitarEliminar = (miembro) => {
    if (miembro.rol !== 'titular') {
      setMiembroEliminando({ miembro, tipo: 'simple' });
      return;
    }
    const beneficiarios = (grupo?.miembros || []).filter((m) => m.rol === 'beneficiario');
    if (beneficiarios.length > 0) {
      setMiembroEliminando({ miembro, tipo: 'titular_con_beneficiarios', beneficiarios });
    } else {
      setMiembroEliminando({ miembro, tipo: 'simple' });
    }
  };

  const handleConfirmarEliminarSimple = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await afiliadosService.eliminar(miembroEliminando.miembro.id);
      setMiembroEliminando(null);
      await cargar();
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el miembro.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmarNuevoTitular = async (nuevoTitularId) => {
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
      await afiliadosService.eliminar(miembroEliminando.miembro.id);
      setMiembroEliminando(null);
      await cargar();
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el titular anterior.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGuardarMiembro = async (payload) => {
    setFormCargando(true);
    setError(null);
    try {
      await afiliadosService.actualizar(miembroEditando.id, payload);
      setMiembroEditando(null);
      await cargar();
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los cambios.');
    } finally {
      setFormCargando(false);
    }
  };

  const handleGuardarBeneficiario = async (payload) => {
    setFormCargando(true);
    setError(null);
    try {
      await afiliadosService.crear(payload);
      setMostrarFormBeneficiario(false);
      await cargar();
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el beneficiario.');
    } finally {
      setFormCargando(false);
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

  return (
    <div className="grupo-detalle__overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="grupo-detalle__modal">

        {/* Header */}
        <div className="grupo-detalle__modal-header">
          {editando ? (
            <div className="grupo-detalle__nombre-edit">
              <input
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
                className="grupo-detalle__nombre-input"
                autoFocus
              />
              <button className="grupo-detalle__btn grupo-detalle__btn--primary" onClick={handleGuardarNombre}>Guardar</button>
              <button className="grupo-detalle__btn grupo-detalle__btn--secondary" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          ) : (
            <div className="grupo-detalle__titulo-row">
              <h3 className="grupo-detalle__modal-title">{loading ? '...' : grupo?.nombre}</h3>
              {!loading && (
                <button className="grupo-detalle__btn-icon grupo-detalle__btn-icon--edit" onClick={() => setEditando(true)}>
                  Renombrar
                </button>
              )}
            </div>
          )}
          <button className="grupo-detalle__modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="grupo-detalle__alert grupo-detalle__alert--error">{error}</div>}

        {loading ? (
          <div className="grupo-detalle__loading">Cargando grupo...</div>
        ) : (
          <>
            {/* Tabla de miembros */}
            <div className="grupo-detalle__tabla-wrapper">
              <table className="grupo-detalle__tabla">
                <thead>
                  <tr>
                    <th style={{ width: widthsMiembros.nombre }}>Nombre{getResizeHandleMiembros('nombre')}</th>
                    <th style={{ width: widthsMiembros.documento }}>Documento{getResizeHandleMiembros('documento')}</th>
                    <th style={{ width: widthsMiembros.rol }}>Rol{getResizeHandleMiembros('rol')}</th>
                    <th style={{ width: widthsMiembros.estado }}>Estado{getResizeHandleMiembros('estado')}</th>
                    <th style={{ width: widthsMiembros.acciones }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(!grupo?.miembros || grupo.miembros.length === 0) && (
                    <tr><td colSpan={5} className="grupo-detalle__empty">Sin miembros registrados.</td></tr>
                  )}
                  {grupo?.miembros?.map((m) => (
                    <tr key={m.id}>
                      <td>{m.nombre} {m.apellido}</td>
                      <td>{m.tipo_documento} {m.numero_documento}</td>
                      <td>
                        <span className={`grupo-detalle__rol-badge grupo-detalle__rol-badge--${m.rol}`}>
                          {m.rol === 'titular' ? 'Titular' : 'Beneficiario'}
                        </span>
                      </td>
                      <td>
                        <span className={`grupo-detalle__estado grupo-detalle__estado--${m.estado}`}>
                          {m.estado}
                        </span>
                      </td>
                      <td>
                        <button
                          className="grupo-detalle__btn-icon grupo-detalle__btn-icon--edit"
                          onClick={() => setMiembroEditando(m)}
                        >
                          Editar
                        </button>
                        <button
                          className="grupo-detalle__btn-icon grupo-detalle__btn-icon--delete"
                          onClick={() => handleSolicitarEliminar(m)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Historial colapsable */}
            <div className="grupo-detalle__historial-seccion">
              <button
                className="grupo-detalle__historial-toggle"
                onClick={() => mostrarHistorial ? setMostrarHistorial(false) : cargarHistorial()}
              >
                {mostrarHistorial ? '▲ Ocultar historial' : '▼ Ver historial del grupo'}
              </button>
              {mostrarHistorial && (
                historialLoading ? (
                  <div className="grupo-detalle__loading">Cargando historial...</div>
                ) : historial.length === 0 ? (
                  <p className="grupo-detalle__empty">Sin historial registrado.</p>
                ) : (
                  <div className="grupo-detalle__tabla-wrapper">
                    <table className="grupo-detalle__tabla">
                      <thead>
                        <tr>
                          <th style={{ width: widthsHistorial.fecha }}>Fecha{getResizeHandleHistorial('fecha')}</th>
                          <th style={{ width: widthsHistorial.afiliado }}>Afiliado{getResizeHandleHistorial('afiliado')}</th>
                          <th style={{ width: widthsHistorial.accion }}>Acción{getResizeHandleHistorial('accion')}</th>
                          <th style={{ width: widthsHistorial.ejecutadoPor }}>Ejecutado por{getResizeHandleHistorial('ejecutadoPor')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((h) => (
                          <tr key={h.id}>
                            <td>{new Date(h.fecha).toLocaleString('es-AR')}</td>
                            <td>{h.afiliado ? `${h.afiliado.nombre} ${h.afiliado.apellido}` : '—'}</td>
                            <td>
                              <span className={`grupo-detalle__accion-badge grupo-detalle__accion-badge--${h.accion}`}>
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

            {/* Acciones del modal */}
            <div className="grupo-detalle__modal-actions">
              <button
                className="grupo-detalle__btn grupo-detalle__btn--primary"
                onClick={() => setMostrarFormBeneficiario(true)}
              >
                + Agregar beneficiario
              </button>
              <button className="grupo-detalle__btn grupo-detalle__btn--secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sub-modal: editar miembro */}
      {miembroEditando && (
        <div className="grupo-detalle__overlay" onClick={(e) => e.target === e.currentTarget && setMiembroEditando(null)}>
          <div className="grupo-detalle__modal">
            <div className="grupo-detalle__modal-header">
              <h3 className="grupo-detalle__modal-title">Editar miembro</h3>
              <button className="grupo-detalle__modal-close" onClick={() => setMiembroEditando(null)}>✕</button>
            </div>
            <FormMiembro
              miembro={miembroEditando}
              onGuardar={handleGuardarMiembro}
              onCancelar={() => setMiembroEditando(null)}
              cargando={formCargando}
            />
          </div>
        </div>
      )}

      {/* Sub-modal: nuevo beneficiario */}
      {mostrarFormBeneficiario && (
        <div className="grupo-detalle__overlay" onClick={(e) => e.target === e.currentTarget && setMostrarFormBeneficiario(false)}>
          <div className="grupo-detalle__modal">
            <div className="grupo-detalle__modal-header">
              <h3 className="grupo-detalle__modal-title">Nuevo beneficiario</h3>
              <button className="grupo-detalle__modal-close" onClick={() => setMostrarFormBeneficiario(false)}>✕</button>
            </div>
            <FormBeneficiario
              grupoId={grupoId}
              onGuardar={handleGuardarBeneficiario}
              onCancelar={() => setMostrarFormBeneficiario(false)}
              cargando={formCargando}
            />
          </div>
        </div>
      )}

      {/* Confirmación simple de eliminación */}
      {miembroEliminando?.tipo === 'simple' && (
        <div className="grupo-detalle__overlay">
          <div className="grupo-detalle__modal grupo-detalle__modal--small">
            <h3 className="grupo-detalle__modal-title">Confirmar eliminación</h3>
            <p className="grupo-detalle__modal-desc">
              ¿Estás seguro de que querés eliminar a{' '}
              <strong>{miembroEliminando.miembro.nombre} {miembroEliminando.miembro.apellido}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="grupo-detalle__modal-actions">
              <button
                className="grupo-detalle__btn grupo-detalle__btn--danger"
                onClick={handleConfirmarEliminarSimple}
                disabled={actionLoading}
              >
                {actionLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                className="grupo-detalle__btn grupo-detalle__btn--secondary"
                onClick={() => setMiembroEliminando(null)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selección de nuevo titular */}
      {miembroEliminando?.tipo === 'titular_con_beneficiarios' && (
        <ModalSeleccionNuevoTitular
          beneficiarios={miembroEliminando.beneficiarios}
          onConfirmar={handleConfirmarNuevoTitular}
          onCancelar={() => setMiembroEliminando(null)}
          cargando={actionLoading}
        />
      )}
    </div>
  );
}

export default GrupoDetalleModal;
