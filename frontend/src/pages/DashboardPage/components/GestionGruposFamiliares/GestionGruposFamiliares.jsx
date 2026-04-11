import React, { useCallback, useEffect, useState } from 'react';
import afiliadosService from '../../../../services/afiliadosService';
import './GestionGruposFamiliares.scss';

// ── Modal de confirmación de desvinculación ───────────────────────────────────

function ModalConfirmarDesvinculacion({ afiliado, onConfirmar, onCancelar, cargando }) {
  return (
    <div className="grupos-fam__modal-overlay">
      <div className="grupos-fam__modal">
        <h3 className="grupos-fam__modal-title">Confirmar desvinculación</h3>
        <p>
          ¿Confirmás que querés desvincular a{' '}
          <strong>{afiliado.nombre} {afiliado.apellido}</strong> del grupo?
          Pasará a ser titular de su propio grupo{' '}
          <strong>"Familia {afiliado.apellido} {afiliado.nombre}"</strong>.
        </p>
        <div className="grupos-fam__modal-actions">
          <button
            className="grupos-fam__btn grupos-fam__btn--danger"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Desvinculando...' : 'Confirmar desvinculación'}
          </button>
          <button
            className="grupos-fam__btn grupos-fam__btn--secondary"
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

// ── Modal de formulario de nuevo beneficiario ─────────────────────────────────

const FORM_VACIO = {
  nombre: '', apellido: '', fecha_nacimiento: '', tipo_documento: 'DNI',
  numero_documento: '', genero: '', direccion: '', ciudad: '', provincia: '',
  codigo_postal: '', email_contacto: '', telefonos: '',
};

function FormBeneficiario({ grupoId, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({ ...FORM_VACIO });
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
    if (form.telefonos.trim()) {
      try { const p = JSON.parse(form.telefonos); if (!Array.isArray(p)) e.telefonos = 'Debe ser un arreglo JSON'; }
      catch { e.telefonos = 'Formato JSON inválido'; }
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validar();
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
    <form className="grupos-fam__form" onSubmit={handleSubmit} noValidate>
      <div className="grupos-fam__form-grid">
        <div className="grupos-fam__field">
          <label>Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} maxLength={100} />
          {errores.nombre && <span className="grupos-fam__field-error">{errores.nombre}</span>}
        </div>
        <div className="grupos-fam__field">
          <label>Apellido *</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} maxLength={100} />
          {errores.apellido && <span className="grupos-fam__field-error">{errores.apellido}</span>}
        </div>
        <div className="grupos-fam__field">
          <label>Tipo de documento *</label>
          <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange}>
            <option value="DNI">DNI</option>
            <option value="CI">CI</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </div>
        <div className="grupos-fam__field">
          <label>Número de documento *</label>
          <input name="numero_documento" value={form.numero_documento} onChange={handleChange} maxLength={20} />
          {errores.numero_documento && <span className="grupos-fam__field-error">{errores.numero_documento}</span>}
        </div>
        <div className="grupos-fam__field">
          <label>Fecha de nacimiento</label>
          <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
        </div>
        <div className="grupos-fam__field">
          <label>Género</label>
          <select name="genero" value={form.genero} onChange={handleChange}>
            <option value="">— Sin especificar —</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="grupos-fam__field grupos-fam__field--full">
          <label>Dirección</label>
          <input name="direccion" value={form.direccion} onChange={handleChange} maxLength={255} />
        </div>
        <div className="grupos-fam__field">
          <label>Ciudad</label>
          <input name="ciudad" value={form.ciudad} onChange={handleChange} maxLength={100} />
        </div>
        <div className="grupos-fam__field">
          <label>Provincia</label>
          <input name="provincia" value={form.provincia} onChange={handleChange} maxLength={100} />
        </div>
        <div className="grupos-fam__field">
          <label>Código postal</label>
          <input name="codigo_postal" value={form.codigo_postal} onChange={handleChange} maxLength={10} />
        </div>
        <div className="grupos-fam__field">
          <label>Email de contacto</label>
          <input type="email" name="email_contacto" value={form.email_contacto} onChange={handleChange} maxLength={255} />
        </div>
        <div className="grupos-fam__field grupos-fam__field--full">
          <label>
            Teléfonos{' '}
            <span className="grupos-fam__field-hint">(JSON, ej: [{'"tipo":"celular","numero":"1123456789"'}])</span>
          </label>
          <textarea name="telefonos" value={form.telefonos} onChange={handleChange} rows={2} />
          {errores.telefonos && <span className="grupos-fam__field-error">{errores.telefonos}</span>}
        </div>
      </div>
      <div className="grupos-fam__form-actions">
        <button type="submit" className="grupos-fam__btn grupos-fam__btn--primary" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar beneficiario'}
        </button>
        <button type="button" className="grupos-fam__btn grupos-fam__btn--secondary" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Modal de detalle de grupo ─────────────────────────────────────────────────

function GrupoDetalleModal({ grupoId, onClose, onRefresh }) {
  const [grupo, setGrupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nombreEdit, setNombreEdit] = useState('');
  const [desvinculando, setDesvinculando] = useState(null);
  const [desvinculandoCargando, setDesvinculandoCargando] = useState(false);
  const [mostrarFormBeneficiario, setMostrarFormBeneficiario] = useState(false);
  const [formCargando, setFormCargando] = useState(false);
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
    <div className="grupos-fam__modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="grupos-fam__modal grupos-fam__modal--detalle">

        {/* Header */}
        <div className="grupos-fam__modal-header">
          {editando ? (
            <div className="grupos-fam__modal-nombre-edit">
              <input
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
                className="grupos-fam__modal-nombre-input"
                autoFocus
              />
              <button className="grupos-fam__btn grupos-fam__btn--primary" onClick={handleGuardarNombre}>Guardar</button>
              <button className="grupos-fam__btn grupos-fam__btn--secondary" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          ) : (
            <div className="grupos-fam__modal-titulo-row">
              <h3 className="grupos-fam__modal-title">{loading ? '...' : grupo?.nombre}</h3>
              {!loading && (
                <button className="grupos-fam__btn-icon grupos-fam__btn-icon--edit" onClick={() => setEditando(true)}>
                  Renombrar
                </button>
              )}
            </div>
          )}
          <button className="grupos-fam__modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="grupos-fam__alert grupos-fam__alert--error">{error}</div>}

        {loading ? (
          <div className="grupos-fam__loading">Cargando grupo...</div>
        ) : (
          <>
            {/* Tabla de miembros */}
            <div className="grupos-fam__tabla-wrapper">
              <table className="grupos-fam__tabla">
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
                  {(!grupo?.miembros || grupo.miembros.length === 0) && (
                    <tr><td colSpan={5} className="grupos-fam__empty">Sin miembros registrados.</td></tr>
                  )}
                  {grupo?.miembros?.map((m) => (
                    <tr key={m.id}>
                      <td>{m.nombre} {m.apellido}</td>
                      <td>{m.tipo_documento} {m.numero_documento}</td>
                      <td>
                        <span className={`grupos-fam__rol-badge grupos-fam__rol-badge--${m.rol}`}>
                          {m.rol === 'titular' ? 'Titular' : 'Beneficiario'}
                        </span>
                      </td>
                      <td>
                        <span className={`grupos-fam__estado grupos-fam__estado--${m.estado}`}>
                          {m.estado}
                        </span>
                      </td>
                      <td>
                        {m.rol === 'beneficiario' && (
                          <button
                            className="grupos-fam__btn-icon grupos-fam__btn-icon--delete"
                            onClick={() => setDesvinculando(m)}
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

            {/* Historial colapsable */}
            <div className="grupos-fam__historial-seccion">
              <button
                className="grupos-fam__historial-toggle"
                onClick={() => mostrarHistorial ? setMostrarHistorial(false) : cargarHistorial()}
              >
                {mostrarHistorial ? '▲ Ocultar historial' : '▼ Ver historial del grupo'}
              </button>

              {mostrarHistorial && (
                historialLoading ? (
                  <div className="grupos-fam__loading">Cargando historial...</div>
                ) : historial.length === 0 ? (
                  <p className="grupos-fam__empty">Sin historial registrado.</p>
                ) : (
                  <div className="grupos-fam__tabla-wrapper">
                    <table className="grupos-fam__tabla">
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
                              <span className={`grupos-fam__accion-badge grupos-fam__accion-badge--${h.accion}`}>
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

            {/* Acciones */}
            <div className="grupos-fam__modal-actions">
              <button
                className="grupos-fam__btn grupos-fam__btn--primary"
                onClick={() => setMostrarFormBeneficiario(true)}
              >
                + Agregar beneficiario
              </button>
              <button className="grupos-fam__btn grupos-fam__btn--secondary" onClick={onClose}>
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

      {mostrarFormBeneficiario && (
        <div className="grupos-fam__modal-overlay" onClick={(e) => e.target === e.currentTarget && setMostrarFormBeneficiario(false)}>
          <div className="grupos-fam__modal grupos-fam__modal--form">
            <div className="grupos-fam__modal-header">
              <h3 className="grupos-fam__modal-title">Nuevo beneficiario</h3>
              <button className="grupos-fam__modal-close" onClick={() => setMostrarFormBeneficiario(false)}>✕</button>
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
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function GestionGruposFamiliares() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grupoDetalleId, setGrupoDetalleId] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await afiliadosService.listarGrupos();
      setGrupos(data);
    } catch {
      setError('Error al cargar los grupos familiares.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const gruposFiltrados = grupos.filter((g) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      g.nombre.toLowerCase().includes(q) ||
      (g.titular && `${g.titular.nombre} ${g.titular.apellido}`.toLowerCase().includes(q))
    );
  });

  return (
    <div className="grupos-fam">
      <div className="grupos-fam__header">
        <h2 className="grupos-fam__title">Grupos Familiares</h2>
      </div>

      {error && <div className="grupos-fam__alert grupos-fam__alert--error">{error}</div>}

      <div className="grupos-fam__filtros">
        <input
          className="grupos-fam__filtro-input"
          placeholder="Buscar por nombre del grupo o titular..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grupos-fam__loading">Cargando grupos familiares...</div>
      ) : gruposFiltrados.length === 0 ? (
        <p className="grupos-fam__empty">No se encontraron grupos familiares.</p>
      ) : (
        <div className="grupos-fam__tabla-wrapper">
          <table className="grupos-fam__tabla">
            <thead>
              <tr>
                <th>Nombre del grupo</th>
                <th>Titular</th>
                <th>Miembros</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gruposFiltrados.map((g) => (
                <tr key={g.id}>
                  <td className="grupos-fam__nombre-cell">{g.nombre}</td>
                  <td>
                    {g.titular
                      ? `${g.titular.nombre} ${g.titular.apellido}`
                      : <span className="grupos-fam__sin-titular">Sin titular</span>}
                  </td>
                  <td className="grupos-fam__cantidad">{g.total_miembros}</td>
                  <td>
                    <span className={`grupos-fam__estado grupos-fam__estado--${g.estado}`}>
                      {g.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="grupos-fam__btn-icon grupos-fam__btn-icon--view"
                      onClick={() => setGrupoDetalleId(g.id)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grupos-fam__total">
        {!loading && `${gruposFiltrados.length} grupo${gruposFiltrados.length !== 1 ? 's' : ''}`}
      </div>

      {grupoDetalleId && (
        <GrupoDetalleModal
          grupoId={grupoDetalleId}
          onClose={() => setGrupoDetalleId(null)}
          onRefresh={cargar}
        />
      )}
    </div>
  );
}

export default GestionGruposFamiliares;
