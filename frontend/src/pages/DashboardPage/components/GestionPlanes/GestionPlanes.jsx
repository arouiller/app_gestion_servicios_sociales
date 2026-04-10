import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import planesService from '../../../../services/planesService';
import './GestionPlanes.scss';

// ── Helpers ──────────────────────────────────────────────────────────────────

function linesToArray(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function arrayToLines(arr) {
  if (!arr) return '';
  if (Array.isArray(arr)) return arr.join('\n');
  if (typeof arr === 'string') {
    try { return JSON.parse(arr).join('\n'); } catch { return arr; }
  }
  return '';
}

const FORM_VACIO = {
  nombre: '',
  descripcion: '',
  precio_mensual: '',
  duracion_meses: '12',
  limite_dependientes: '5',
  cobertura: '',
  beneficios: '',
  estado: 'activo',
};

// ── Tarjeta de plan (vista usuario) ─────────────────────────────────────────

function TarjetaPlan({ plan, onEditar, onEliminar, isAdmin }) {
  const precio = parseFloat(plan.precio_mensual).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  });

  return (
    <div className={`gestion-planes__card gestion-planes__card--${plan.estado}`}>
      <div className="gestion-planes__card-header">
        <div>
          <h3 className="gestion-planes__card-nombre">{plan.nombre}</h3>
          <span className={`gestion-planes__estado gestion-planes__estado--${plan.estado}`}>
            {plan.estado}
          </span>
        </div>
        <div className="gestion-planes__card-precio">
          <span className="gestion-planes__card-precio-monto">{precio}</span>
          <span className="gestion-planes__card-precio-label">/ mes</span>
        </div>
      </div>

      {plan.descripcion && (
        <p className="gestion-planes__card-desc">{plan.descripcion}</p>
      )}

      <div className="gestion-planes__card-meta">
        <span>Duración: <strong>{plan.duracion_meses} meses</strong></span>
        <span>Dependientes: <strong>hasta {plan.limite_dependientes}</strong></span>
      </div>

      {Array.isArray(plan.cobertura) && plan.cobertura.length > 0 && (
        <div className="gestion-planes__card-lista">
          <span className="gestion-planes__card-lista-titulo">Cobertura</span>
          <ul>
            {plan.cobertura.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(plan.beneficios) && plan.beneficios.length > 0 && (
        <div className="gestion-planes__card-lista">
          <span className="gestion-planes__card-lista-titulo">Beneficios</span>
          <ul>
            {plan.beneficios.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {isAdmin && (
        <div className="gestion-planes__card-actions">
          <button
            className="gestion-planes__btn-icon gestion-planes__btn-icon--edit"
            onClick={() => onEditar(plan)}
          >
            Editar
          </button>
          <button
            className="gestion-planes__btn-icon gestion-planes__btn-icon--delete"
            onClick={() => onEliminar(plan)}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────────────

function FormPlan({ inicial, onGuardar, onCancelar, cargando, isAdmin }) {
  const [form, setForm] = useState({
    ...FORM_VACIO,
    ...inicial,
    precio_mensual: inicial?.precio_mensual ? String(inicial.precio_mensual) : '',
    duracion_meses: inicial?.duracion_meses ? String(inicial.duracion_meses) : '12',
    limite_dependientes: inicial?.limite_dependientes ? String(inicial.limite_dependientes) : '5',
    cobertura: arrayToLines(inicial?.cobertura),
    beneficios: arrayToLines(inicial?.beneficios),
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
    if (!form.precio_mensual || isNaN(parseFloat(form.precio_mensual))) {
      e.precio_mensual = 'Ingresá un precio válido';
    } else if (parseFloat(form.precio_mensual) <= 0) {
      e.precio_mensual = 'El precio debe ser mayor a 0';
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validar();
    if (Object.keys(e2).length > 0) { setErrores(e2); return; }

    onGuardar({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio_mensual: parseFloat(form.precio_mensual),
      duracion_meses: parseInt(form.duracion_meses, 10) || 12,
      limite_dependientes: parseInt(form.limite_dependientes, 10) || 5,
      cobertura: linesToArray(form.cobertura),
      beneficios: linesToArray(form.beneficios),
      estado: form.estado,
    });
  };

  return (
    <form className="gestion-planes__form" onSubmit={handleSubmit} noValidate>
      <div className="gestion-planes__form-grid">
        <div className="gestion-planes__field gestion-planes__field--full">
          <label>Nombre del plan *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} maxLength={150} />
          {errores.nombre && <span className="gestion-planes__field-error">{errores.nombre}</span>}
        </div>

        <div className="gestion-planes__field gestion-planes__field--full">
          <label>Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} />
        </div>

        <div className="gestion-planes__field">
          <label>Precio mensual (ARS) *</label>
          <input
            type="number"
            name="precio_mensual"
            value={form.precio_mensual}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
          {errores.precio_mensual && (
            <span className="gestion-planes__field-error">{errores.precio_mensual}</span>
          )}
        </div>

        <div className="gestion-planes__field">
          <label>Duración (meses)</label>
          <input
            type="number"
            name="duracion_meses"
            value={form.duracion_meses}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div className="gestion-planes__field">
          <label>Límite de dependientes</label>
          <input
            type="number"
            name="limite_dependientes"
            value={form.limite_dependientes}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="gestion-planes__field">
          <label>Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="descontinuado">Descontinuado</option>
          </select>
        </div>

        <div className="gestion-planes__field gestion-planes__field--full">
          <label>
            Cobertura{' '}
            <span className="gestion-planes__field-hint">(un ítem por línea)</span>
          </label>
          <textarea
            name="cobertura"
            value={form.cobertura}
            onChange={handleChange}
            rows={4}
            placeholder="Consultas médicas&#10;Estudios básicos&#10;..."
          />
        </div>

        <div className="gestion-planes__field gestion-planes__field--full">
          <label>
            Beneficios{' '}
            <span className="gestion-planes__field-hint">(un ítem por línea)</span>
          </label>
          <textarea
            name="beneficios"
            value={form.beneficios}
            onChange={handleChange}
            rows={4}
            placeholder="Red de prestadores&#10;Atención 24/7&#10;..."
          />
        </div>
      </div>

      <div className="gestion-planes__form-actions">
        <button
          type="submit"
          className="gestion-planes__btn gestion-planes__btn--primary"
          disabled={cargando}
        >
          {cargando ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          className="gestion-planes__btn gestion-planes__btn--secondary"
          onClick={onCancelar}
          disabled={cargando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Modal confirmación ────────────────────────────────────────────────────────

function ModalConfirmar({ plan, onConfirmar, onCancelar, cargando }) {
  return (
    <div className="gestion-planes__modal-overlay">
      <div className="gestion-planes__modal">
        <h3 className="gestion-planes__modal-title">Eliminar plan</h3>
        <p>
          ¿Estás seguro de que querés eliminar el plan{' '}
          <strong>{plan.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="gestion-planes__modal-actions">
          <button
            className="gestion-planes__btn gestion-planes__btn--danger"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button
            className="gestion-planes__btn gestion-planes__btn--secondary"
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

function GestionPlanes() {
  const { isAdmin } = useAuth();

  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [filtroEstado, setFiltroEstado] = useState('');
  const [vista, setVista] = useState('lista'); // 'lista' | 'crear' | 'editar'
  const [planEditando, setPlanEditando] = useState(null);
  const [planBorrando, setPlanBorrando] = useState(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      const data = await planesService.listar(params);
      setPlanes(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar planes.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 4000);
  };

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
      setVista('lista');
      setPlanEditando(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el plan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEliminar = async () => {
    setActionLoading(true);
    try {
      await planesService.eliminar(planBorrando.id);
      mostrarMensaje('Plan eliminado correctamente.');
      setPlanBorrando(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el plan.');
      setPlanBorrando(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditar = (plan) => {
    setPlanEditando(plan);
    setVista('editar');
    setError(null);
    setMensaje(null);
  };

  const handleCancelar = () => {
    setVista('lista');
    setPlanEditando(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="gestion-planes">
        <div className="gestion-planes__loading">Cargando planes...</div>
      </div>
    );
  }

  return (
    <div className="gestion-planes">
      <div className="gestion-planes__header">
        <h2 className="gestion-planes__title">Planes de Servicio</h2>
        {vista === 'lista' && isAdmin && (
          <button
            className="gestion-planes__btn gestion-planes__btn--primary"
            onClick={() => { setVista('crear'); setError(null); setMensaje(null); }}
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

      {vista === 'lista' && (
        <>
          {isAdmin && (
            <div className="gestion-planes__filtros">
              <select
                className="gestion-planes__filtro-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="descontinuado">Descontinuado</option>
              </select>
            </div>
          )}

          {planes.length === 0 ? (
            <p className="gestion-planes__empty">
              {isAdmin ? 'No hay planes. Creá el primero.' : 'No hay planes disponibles.'}
            </p>
          ) : (
            <div className="gestion-planes__grid">
              {planes.map((plan) => (
                <TarjetaPlan
                  key={plan.id}
                  plan={plan}
                  isAdmin={isAdmin}
                  onEditar={handleEditar}
                  onEliminar={(p) => setPlanBorrando(p)}
                />
              ))}
            </div>
          )}
        </>
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
            isAdmin={isAdmin}
          />
        </>
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
}

export default GestionPlanes;
