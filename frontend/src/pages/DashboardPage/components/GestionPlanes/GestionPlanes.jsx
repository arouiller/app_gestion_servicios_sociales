// frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx
import React, { useEffect, useState } from 'react';
import planesService from '../../../../services/planesService';
import personasService from '../../../../services/personasService';
import lookupService from '../../../../services/lookupService';
import ErrorDisplay from '../../../../components/ErrorDisplay/ErrorDisplay';
import './GestionPlanes.scss';

const GestionPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  // Datos de referencia para el formulario
  const [cobradores, setCobradores] = useState([]);
  const [tiposDeGrupo, setTiposDeGrupo] = useState([]);
  const [tiposDePlan, setTiposDePlan] = useState([]);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [serviciosAdicionales, setServiciosAdicionales] = useState([]);
  const [personasSearch, setPersonasSearch] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar todo al montar
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [planes, cobradores, tiposGrupo, tiposPlan, obrasSoc, servicios] = await Promise.all([
        planesService.list(),
        lookupService.list('cobradores'),
        lookupService.list('tipos-de-grupo'),
        lookupService.list('tipos-de-plan'),
        lookupService.list('obras-sociales'),
        lookupService.list('servicios-adicionales'),
      ]);
      setPlanes(planes.data || planes);
      setCobradores(cobradores);
      setTiposDeGrupo(tiposGrupo);
      setTiposDePlan(tiposPlan);
      setObrasSociales(obrasSoc);
      setServiciosAdicionales(servicios);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (plan = null) => {
    if (plan) {
      setFormData({
        ...plan,
        integrantes: plan.PlanIntegrantes || [],
      });
      setEditingId(plan.plan_numero);
    } else {
      setFormData({
        integrantes: [{ rol: 'titular', credencial: 'A', servicios: [] }],
      });
      setEditingId(null);
      // Pre-cargar siguiente número de afiliado
      planesService.obtenerSiguienteNumeroAfiliado().then(siguiente => {
        setFormData(prev => ({ ...prev, numero_afiliado: siguiente }));
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({});
    setEditingId(null);
    setSearchQuery('');
    setPersonasSearch([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setPersonasSearch([]);
      return;
    }
    try {
      const personas = await personasService.search(query);
      setPersonasSearch(personas);
    } catch (err) {
      console.error('Error buscando personas:', err);
    }
  };

  const addIntegrante = () => {
    setFormData(prev => ({
      ...prev,
      integrantes: [
        ...prev.integrantes,
        { rol: 'integrante', credencial: 'A', servicios: [] },
      ],
    }));
  };

  const removeIntegrante = (index) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.filter((_, i) => i !== index),
    }));
  };

  const updateIntegrante = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.map((int, i) => (
        i === index ? { ...int, [field]: value } : int
      )),
    }));
  };

  const selectPersona = (index, persona) => {
    updateIntegrante(index, 'persona_id', persona.id);
    updateIntegrante(index, 'apellido', persona.apellido);
    updateIntegrante(index, 'nombre', persona.nombre);
    updateIntegrante(index, 'tipo_documento', persona.tipo_documento);
    updateIntegrante(index, 'numero_documento', persona.numero_documento);
    updateIntegrante(index, 'fecha_nacimiento', persona.fecha_nacimiento);
    updateIntegrante(index, 'fecha_cobertura', persona.fecha_cobertura);
    setSearchQuery('');
    setPersonasSearch([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await planesService.update(editingId, formData);
      } else {
        await planesService.create(formData);
      }
      await loadAll();
      handleCloseForm();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await planesService.delete(id);
        await loadAll();
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  if (loading) return <div className="gestion-planes loading">Cargando...</div>;

  return (
    <div className="gestion-planes">
      <div className="header">
        <h2>Gestión de Planes</h2>
        <button onClick={() => handleOpenForm()} className="btn-primary">
          + Nuevo Plan
        </button>
      </div>

      <table className="planes-table">
        <thead>
          <tr>
            <th>Número Afiliado</th>
            <th>Cobrador</th>
            <th>Obra Social</th>
            <th>Tipo</th>
            <th>Valor Cuota</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {planes.map(plan => (
            <tr key={plan.plan_numero}>
              <td>{plan.numero_afiliado}</td>
              <td>{plan.Cobrador?.cobrador_nombre}</td>
              <td>{plan.ObraSocial?.os_nombre}</td>
              <td>{plan.TipoDePlan?.tipo_plan_nombre}</td>
              <td>${plan.valor_cuota}</td>
              <td>{plan.estado}</td>
              <td className="acciones">
                <button onClick={() => handleOpenForm(plan)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(plan.plan_numero)} className="btn-delete">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3>{editingId ? 'Editar' : 'Crear'} Plan</h3>

            {/* Pestaña 1: Datos del Plan */}
            <fieldset>
              <legend>Datos del Plan</legend>

              <div className="form-row">
                <div className="form-group">
                  <label>Número Afiliado *</label>
                  <input
                    type="text"
                    name="numero_afiliado"
                    value={formData.numero_afiliado || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cobrador *</label>
                  <select
                    name="cobrador_numero"
                    value={formData.cobrador_numero || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {cobradores.map(c => (
                      <option key={c.cobrador_numero} value={c.cobrador_numero}>
                        {c.cobrador_apellido} {c.cobrador_nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Obra Social *</label>
                  <select
                    name="os_numero"
                    value={formData.os_numero || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {obrasSociales.map(o => (
                      <option key={o.os_numero} value={o.os_numero}>
                        {o.os_nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Plan *</label>
                  <select
                    name="tipo_plan_numero"
                    value={formData.tipo_plan_numero || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {tiposDePlan.map(t => (
                      <option key={t.tipo_plan_numero} value={t.tipo_plan_numero}>
                        {t.tipo_plan_nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo de Grupo *</label>
                  <select
                    name="tipo_de_grupo_numero"
                    value={formData.tipo_de_grupo_numero || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {tiposDeGrupo.map(t => (
                      <option key={t.tipo_de_grupo_numero} value={t.tipo_de_grupo_numero}>
                        {t.tipo_de_grupo_nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor Cuota</label>
                  <input
                    type="number"
                    name="valor_cuota"
                    step="0.01"
                    value={formData.valor_cuota || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select name="estado" value={formData.estado || 'ACTIVO'} onChange={handleInputChange}>
                    <option value="ACTIVO">Activo</option>
                    <option value="SUSPENDIDO">Suspendido</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono 1</label>
                  <input
                    type="tel"
                    name="telefono_1"
                    value={formData.telefono_1 || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono 2</label>
                  <input
                    type="tel"
                    name="telefono_2"
                    value={formData.telefono_2 || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Domicilio</label>
                <input
                  type="text"
                  name="domicilio"
                  value={formData.domicilio || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Localidad</label>
                <input
                  type="text"
                  name="localidad"
                  value={formData.localidad || ''}
                  onChange={handleInputChange}
                />
              </div>
            </fieldset>

            {/* Pestaña 2: Integrantes */}
            <fieldset>
              <legend>Integrantes del Plan</legend>

              {formData.integrantes?.map((integrante, index) => (
                <div key={index} className="integrante-block">
                  <div className="integrante-header">
                    <h4>Integrante {index + 1} {integrante.rol === 'titular' ? '(Titular)' : ''}</h4>
                    {formData.integrantes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIntegrante(index)}
                        className="btn-remove"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rol *</label>
                      <select
                        value={integrante.rol || 'integrante'}
                        onChange={(e) => updateIntegrante(index, 'rol', e.target.value)}
                      >
                        <option value="titular">Titular</option>
                        <option value="integrante">Integrante</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Credencial *</label>
                      <input
                        type="text"
                        maxLength="1"
                        value={integrante.credencial || ''}
                        onChange={(e) => updateIntegrante(index, 'credencial', e.target.value)}
                      />
                    </div>
                  </div>

                  {!integrante.persona_id && (
                    <div className="form-group search-personas">
                      <label>Buscar Persona Existente</label>
                      <input
                        type="text"
                        placeholder="Apellido, nombre o documento..."
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                      {personasSearch.length > 0 && (
                        <ul className="search-results">
                          {personasSearch.map(persona => (
                            <li
                              key={persona.id}
                              onClick={() => selectPersona(index, persona)}
                            >
                              {persona.apellido} {persona.nombre} ({persona.numero_documento})
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="hint">o completar datos manualmente abajo</p>
                    </div>
                  )}

                  {integrante.persona_id ? (
                    <div className="persona-display">
                      <p>
                        <strong>{integrante.apellido} {integrante.nombre}</strong>
                      </p>
                      <p>{integrante.tipo_documento}: {integrante.numero_documento}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const newIntegrantes = [...formData.integrantes];
                          newIntegrantes[index] = {
                            rol: integrante.rol,
                            credencial: integrante.credencial,
                            servicios: integrante.servicios || [],
                          };
                          setFormData(prev => ({ ...prev, integrantes: newIntegrantes }));
                        }}
                        className="btn-change"
                      >
                        Cambiar persona
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Apellido *</label>
                          <input
                            type="text"
                            value={integrante.apellido || ''}
                            onChange={(e) => updateIntegrante(index, 'apellido', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Nombre *</label>
                          <input
                            type="text"
                            value={integrante.nombre || ''}
                            onChange={(e) => updateIntegrante(index, 'nombre', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Tipo de Documento *</label>
                          <select
                            value={integrante.tipo_documento || 'DNI'}
                            onChange={(e) => updateIntegrante(index, 'tipo_documento', e.target.value)}
                          >
                            <option value="DNI">DNI</option>
                            <option value="LC">LC</option>
                            <option value="LE">LE</option>
                            <option value="PASAPORTE">Pasaporte</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Número de Documento *</label>
                          <input
                            type="text"
                            value={integrante.numero_documento || ''}
                            onChange={(e) => updateIntegrante(index, 'numero_documento', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Fecha de Nacimiento *</label>
                          <input
                            type="date"
                            value={integrante.fecha_nacimiento || ''}
                            onChange={(e) => updateIntegrante(index, 'fecha_nacimiento', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Fecha de Cobertura *</label>
                          <input
                            type="date"
                            value={integrante.fecha_cobertura || ''}
                            onChange={(e) => updateIntegrante(index, 'fecha_cobertura', e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group full-width">
                    <label>Servicios Adicionales</label>
                    <div className="servicios-list">
                      {serviciosAdicionales.map(servicio => (
                        <label key={servicio.servicio_adicional_numero} className="checkbox">
                          <input
                            type="checkbox"
                            checked={(integrante.servicios || []).includes(servicio.servicio_adicional_numero)}
                            onChange={(e) => {
                              const servicios = integrante.servicios || [];
                              if (e.target.checked) {
                                servicios.push(servicio.servicio_adicional_numero);
                              } else {
                                servicios.splice(servicios.indexOf(servicio.servicio_adicional_numero), 1);
                              }
                              updateIntegrante(index, 'servicios', [...servicios]);
                            }}
                          />
                          {servicio.servicio_adicional_nombre}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addIntegrante} className="btn-add-integrante">
                + Agregar Integrante
              </button>
            </fieldset>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={handleCloseForm} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <ErrorDisplay error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default GestionPlanes;
