import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
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
};

function FormAfiliado({ inicial, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({
    ...FORM_VACIO,
    ...inicial,
    telefonos: inicial?.telefonos ? JSON.stringify(inicial.telefonos) : '',
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
    if (Object.keys(e2).length > 0) {
      setErrores(e2);
      return;
    }
    const payload = { ...form };
    payload.telefonos = form.telefonos.trim() ? JSON.parse(form.telefonos) : null;
    if (!payload.fecha_nacimiento) payload.fecha_nacimiento = null;
    if (!payload.genero) payload.genero = null;
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

// ── Vista de perfil propio (usuario no-admin) ────────────────────────────────

function PerfilAfiliado({ afiliado, onEditar }) {
  const campos = [
    { label: 'Nombre completo', valor: `${afiliado.nombre} ${afiliado.apellido}` },
    { label: 'Documento', valor: `${afiliado.tipo_documento} ${afiliado.numero_documento}` },
    { label: 'Fecha de nacimiento', valor: afiliado.fecha_nacimiento ?? '—' },
    { label: 'Género', valor: afiliado.genero ?? '—' },
    { label: 'Dirección', valor: afiliado.direccion ?? '—' },
    { label: 'Ciudad', valor: afiliado.ciudad ?? '—' },
    { label: 'Provincia', valor: afiliado.provincia ?? '—' },
    { label: 'Código postal', valor: afiliado.codigo_postal ?? '—' },
    { label: 'Email de contacto', valor: afiliado.email_contacto ?? '—' },
  ];

  return (
    <div className="gestion-afiliados__perfil">
      <div className="gestion-afiliados__perfil-header">
        <div className="gestion-afiliados__perfil-avatar">
          {afiliado.nombre[0]}{afiliado.apellido[0]}
        </div>
        <div>
          <h3 className="gestion-afiliados__perfil-nombre">{afiliado.nombre} {afiliado.apellido}</h3>
          <span className={`gestion-afiliados__estado gestion-afiliados__estado--${afiliado.estado}`}>
            {afiliado.estado}
          </span>
        </div>
      </div>

      <div className="gestion-afiliados__perfil-grid">
        {campos.map(({ label, valor }) => (
          <div key={label} className="gestion-afiliados__perfil-field">
            <span className="gestion-afiliados__perfil-label">{label}</span>
            <span className="gestion-afiliados__perfil-valor">{valor}</span>
          </div>
        ))}
      </div>

      {afiliado.telefonos && (
        <div className="gestion-afiliados__telefonos">
          <span className="gestion-afiliados__perfil-label">Teléfonos</span>
          <div className="gestion-afiliados__telefonos-lista">
            {afiliado.telefonos.map((t, i) => (
              <span key={i} className="gestion-afiliados__telefono-badge">
                {t.tipo}: {t.numero}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="gestion-afiliados__perfil-actions">
        <button className="gestion-afiliados__btn gestion-afiliados__btn--primary" onClick={onEditar}>
          Editar datos
        </button>
      </div>
    </div>
  );
}

// ── Tabla admin ──────────────────────────────────────────────────────────────

function TablaAfiliados({ afiliados, pagination, onEditar, onEliminar, onPaginar, filtros, onFiltroChange }) {
  return (
    <div>
      {/* Filtros */}
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
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {afiliados.map((a) => (
                  <tr key={a.id}>
                    <td>{a.nombre} {a.apellido}</td>
                    <td>{a.tipo_documento} {a.numero_documento}</td>
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
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
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  // Estado compartido
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Estado usuario no-admin
  const [miPerfil, setMiPerfil] = useState(null);
  const [tienePerfil, setTienePerfil] = useState(false);

  // Estado admin
  const [afiliados, setAfiliados] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filtros, setFiltros] = useState({ search: '', estado: '' });

  // Vista activa: 'lista' | 'crear' | 'editar'
  const [vista, setVista] = useState('lista');
  const [afiliadoEditando, setAfiliadoEditando] = useState(null);
  const [afiliadoBorrando, setAfiliadoBorrando] = useState(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────

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

  const cargarMiPerfil = useCallback(async () => {
    setError(null);
    try {
      const perfil = await afiliadosService.me();
      setMiPerfil(perfil);
      setTienePerfil(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setTienePerfil(false);
      } else {
        setError(err.response?.data?.message || 'Error al cargar tu perfil.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      cargarAfiliados();
    } else {
      cargarMiPerfil();
    }
  }, [isAdmin, cargarAfiliados, cargarMiPerfil]);

  // Recarga al cambiar filtros (admin)
  useEffect(() => {
    if (isAdmin && !loading) {
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
      if (isAdmin) {
        cargarAfiliados(pagination.page);
      } else {
        cargarMiPerfil();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los datos.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditar = (afiliado) => {
    setAfiliadoEditando(afiliado);
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
      cargarAfiliados(pagination.page);
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
    setError(null);
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
        <h2 className="gestion-afiliados__title">
          {isAdmin ? 'Gestión de Afiliados' : 'Mi Perfil de Afiliado'}
        </h2>
        {vista === 'lista' && (isAdmin || !tienePerfil) && (
          <button
            className="gestion-afiliados__btn gestion-afiliados__btn--primary"
            onClick={() => { setVista('crear'); setError(null); setMensaje(null); }}
          >
            {isAdmin ? '+ Nuevo afiliado' : 'Completar mi perfil'}
          </button>
        )}
      </div>

      {error && <div className="gestion-afiliados__alert gestion-afiliados__alert--error">{error}</div>}
      {mensaje && (
        <div className={`gestion-afiliados__alert gestion-afiliados__alert--${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Vista lista / perfil */}
      {vista === 'lista' && (
        <>
          {isAdmin ? (
            <TablaAfiliados
              afiliados={afiliados}
              pagination={pagination}
              filtros={filtros}
              onFiltroChange={handleFiltroChange}
              onEditar={handleEditar}
              onEliminar={(a) => setAfiliadoBorrando(a)}
              onPaginar={(p) => cargarAfiliados(p)}
            />
          ) : (
            tienePerfil
              ? <PerfilAfiliado afiliado={miPerfil} onEditar={() => handleEditar(miPerfil)} />
              : (
                <div className="gestion-afiliados__aviso">
                  <p>Todavía no completaste tu perfil de afiliado. Hacé clic en <strong>Completar mi perfil</strong> para empezar.</p>
                </div>
              )
          )}
        </>
      )}

      {/* Formulario crear / editar */}
      {(vista === 'crear' || vista === 'editar') && (
        <FormAfiliado
          inicial={afiliadoEditando}
          onGuardar={handleGuardar}
          onCancelar={handleCancelar}
          cargando={actionLoading}
        />
      )}

      {/* Modal confirmación borrado */}
      {afiliadoBorrando && (
        <ModalConfirmar
          afiliado={afiliadoBorrando}
          onConfirmar={handleEliminar}
          onCancelar={() => setAfiliadoBorrando(null)}
          cargando={actionLoading}
        />
      )}
    </div>
  );
}

export default GestionAfiliados;
