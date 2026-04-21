import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePlanV1Form } from '../hooks/usePlanV1Form';
import ActionButton from '../../../../../components/ActionButton/ActionButton';
import { formatNumeroAfiliado } from '../../../../../utils/formatters';
import planesV1Service from '../../../../../services/planesV1Service';
import planesIntegrantesService from '../../../../../services/planesIntegrantesService';
import lookupService from '../../../../../services/lookupService';
import recibosService from '../../../../../services/recibosService';
import AfiladoSearchModal from './AfiladoSearchModal';
import AfiladoEditModal from './AfiladoEditModal';
import ReciboDetalleModal from './ReciboDetalleModal';
import IntegranteServiciosModal from './IntegranteServiciosModal';
import ConfirmCloseDialog from '../../../../../components/ConfirmCloseDialog/ConfirmCloseDialog';
import { useModalEscapeKey } from '../../../../../hooks/useModalEscapeKey';
import './PlanV1Modal.scss';

function PlanV1Modal({ mode, planData, onClose, onSave }) {
  const { form, errors, handleFieldChange, addIntegrante, removeIntegrante, updateIntegranteRol, validate, reset, setErrors } = usePlanV1Form(planData);

  // Mapeo de campos a tabs para navegación automática de errores
  const FIELD_TO_TAB = {
    numero_afiliado: 'datos',
    tipo_plan_numero: 'datos',
    cobrador_numero: 'datos',
    os_numero: 'datos',
    tipo_de_grupo_numero: 'datos',
    valor_cuota: 'datos',
    integrantes: 'afiliados',
  };
  const TAB_ORDER = ['datos', 'afiliados'];

  const [loading, setLoading] = useState(false);
  const [lookupData, setLookupData] = useState({
    tiposDeplan: [],
    cobradores: [],
    obrasSociales: [],
    tiposDeGrupo: [],
  });

  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'afiliados' | 'recibos' | 'historial'
  const [maxAfiliadoNumber, setMaxAfiliadoNumber] = useState(null);
  const [historialCuota, setHistorialCuota] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [recibos, setRecibos] = useState([]);
  const [recibosLoading, setRecibosLoading] = useState(false);
  const [recibosPage, setRecibosPage] = useState(1);
  const recibosPerPage = 10;

  // Secondary modals
  const [afiladoSearchOpen, setAfiladoSearchOpen] = useState(false);
  const [afiladoEditOpen, setAfiladoEditOpen] = useState(null); // null or persona_id
  const [reciboDetailOpen, setReciboDetailOpen] = useState(null); // null or recibo id
  const [serviciosModalOpen, setServiciosModalOpen] = useState(null); // null or integrante.id

  // Store initial form state for change detection
  const initialFormRef = useRef(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Initialize and detect if form has changes
  useEffect(() => {
    if (initialFormRef.current === null) {
      initialFormRef.current = JSON.stringify(form);
    }
  }, []);

  const hasChanges = useMemo(() => {
    if (!initialFormRef.current) return false;
    return JSON.stringify(form) !== initialFormRef.current;
  }, [form]);

  // Handle ESC key with confirmation if there are changes
  const handleEscapeWithChanges = useCallback(() => {
    setShowConfirmClose(true);
  }, []);

  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    onClose?.();
  }, [onClose]);

  const handleCancelClose = useCallback(() => {
    setShowConfirmClose(false);
  }, []);

  // Use ESC key handler
  useModalEscapeKey(true, hasChanges, onClose, hasChanges ? handleEscapeWithChanges : undefined);

  // Load lookups and max affiliate number on mount
  useEffect(() => {
    loadLookupData();
    if (mode === 'crear') {
      loadMaxAfiliadoNumber();
    } else if (mode === 'editar' && planData?.plan_numero) {
      // Load full plan data with integrantes
      loadFullPlanData();
    }
  }, [mode, planData?.plan_numero]);

  const loadLookupData = async () => {
    try {
      const lookups = await lookupService.loadAllLookupsForPlans();
      setLookupData(lookups);
    } catch (err) {
      console.error('Error loading lookups:', err);
      setLookupData({
        tiposDeplan: [],
        cobradores: [],
        obrasSociales: [],
        tiposDeGrupo: [],
      });
    }
  };

  const loadMaxAfiliadoNumber = async () => {
    try {
      const data = await planesV1Service.getMaxAfiliadoNumber();
      console.log('[PlanV1Modal] Max affiliate number data:', data);
      if (data && data.suggestedNumber) {
        setMaxAfiliadoNumber(data.suggestedNumber);
        handleFieldChange('numero_afiliado', String(data.suggestedNumber));
        console.log('[PlanV1Modal] Set suggested number:', data.suggestedNumber);
      }
    } catch (err) {
      console.error('Error loading max affiliate number:', err);
    }
  };

  const loadFullPlanData = async () => {
    try {
      const fullPlan = await planesV1Service.obtener(planData.plan_numero);
      console.log('[PlanV1Modal] Loaded full plan data:', fullPlan);

      // Actualizar el form con los datos completos incluyendo integrantes
      if (fullPlan && fullPlan.PlanIntegrantes) {
        // Convertir PlanIntegrantes al formato esperado por el form
        const integrantes = fullPlan.PlanIntegrantes.map(pi => ({
          id: pi.id,
          persona_id: pi.persona_id,
          persona: pi.Persona,
          rol: pi.rol,
        }));
        console.log('[PlanV1Modal] Integrantes encontrados:', integrantes);
        handleFieldChange('integrantes', integrantes);
      }
    } catch (err) {
      console.error('Error loading full plan data:', err);
    }
  };

  const loadHistorialCuota = async () => {
    try {
      setHistorialLoading(true);
      const data = await planesV1Service.obtenerHistorialCuota(planData.plan_numero);
      console.log('[PlanV1Modal] Historial de cuota:', data);
      setHistorialCuota(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading historial cuota:', err);
      setHistorialCuota([]);
    } finally {
      setHistorialLoading(false);
    }
  };

  const loadRecibos = async () => {
    try {
      setRecibosLoading(true);
      const data = await recibosService.listByPlanNumero(planData.plan_numero);
      console.log('[PlanV1Modal] Recibos:', data);
      setRecibos(Array.isArray(data) ? data : []);
      setRecibosPage(1);
    } catch (err) {
      console.error('Error loading recibos:', err);
      setRecibos([]);
    } finally {
      setRecibosLoading(false);
    }
  };

  const handleGuardar = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      navigateToFirstError(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        numero_afiliado: form.numero_afiliado,
        tipo_plan_numero: form.tipo_plan_numero,
        cobrador_numero: form.cobrador_numero,
        tipo_de_grupo_numero: form.tipo_de_grupo_numero,
        os_numero: form.os_numero,
        estado: form.estado,
        valor_cuota: parseFloat(form.valor_cuota),
        domicilio: form.domicilio || null,
        telefono_1: form.telefono_1 || null,
      };

      if (mode === 'crear') {
        // Create plan
        const response = await planesV1Service.crear(payload);

        // Create integrantes for new plan
        if (form.integrantes.length > 0) {
          await planesIntegrantesService.crearMultiples(response.plan_numero, form.integrantes);
        }
      } else {
        // Update plan
        await planesV1Service.actualizar(planData.plan_numero, payload);

        // Sync integrantes (add/remove/update roles)
        const existingIntegrantes = await planesIntegrantesService.obtenerPorPlan(planData.plan_numero);
        const existingMap = new Map(existingIntegrantes.map((i) => [i.persona_id, i]));
        const formMap = new Map(form.integrantes.map((i) => [i.persona_id, i]));

        // Delete integrantes that were removed
        for (const existing of existingIntegrantes) {
          if (!formMap.has(existing.persona_id)) {
            await planesIntegrantesService.eliminar(existing.id);
          }
        }

        // Add new integrantes
        for (const integrante of form.integrantes) {
          if (!existingMap.has(integrante.persona_id)) {
            await planesIntegrantesService.crear({
              plan_numero: planData.plan_numero,
              persona_id: integrante.persona_id,
              rol: integrante.rol,
            });
          }
        }

        // Update roles for existing integrantes
        for (const integrante of form.integrantes) {
          const existing = existingMap.get(integrante.persona_id);
          if (existing && existing.rol !== integrante.rol) {
            await planesIntegrantesService.actualizar(existing.id, { rol: integrante.rol });
          }
        }
      }

      onSave();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors);
        navigateToFirstError(serverErrors);
      } else {
        console.error('Error saving plan:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAfiladoSearch = (persona) => {
    if (form.integrantes.some((i) => i.persona_id === persona.id)) {
      alert('Este afiliado ya está asignado al plan');
      return;
    }
    // Open role selector - for now, default to 'adherente', user can change in table
    addIntegrante(persona, 'adherente');
    setAfiladoSearchOpen(false);
  };

  const handleIntegranteEdit = (personaId) => {
    setAfiladoEditOpen(personaId);
  };

  const handleIntegranteEditSave = (updatedPersona) => {
    // Update integrante's persona data
    const updatedForm = {
      ...form,
      integrantes: form.integrantes.map((i) =>
        i.persona_id === updatedPersona.id ? { ...i, persona: updatedPersona } : i
      ),
    };
    handleFieldChange('integrantes', updatedForm.integrantes);
    setAfiladoEditOpen(null);
  };

  const handleIntegranteRemove = (personaId) => {
    if (form.integrantes.filter((i) => i.rol === 'titular').length === 1 &&
        form.integrantes.find((i) => i.persona_id === personaId)?.rol === 'titular') {
      alert('No puedes quitar el único titular. Designa otro primero.');
      return;
    }
    removeIntegrante(personaId);
  };

  const handleRolChange = (personaId, newRol) => {
    // Validate: don't allow changing only titular to adherente
    if (form.integrantes.filter((i) => i.rol === 'titular').length === 1 &&
        form.integrantes.find((i) => i.persona_id === personaId)?.rol === 'titular' &&
        newRol !== 'titular') {
      alert('Debe haber al menos un titular. Designa otro primero.');
      return;
    }
    updateIntegranteRol(personaId, newRol);
  };

  const navigateToFirstError = (errorObj) => {
    for (const tab of TAB_ORDER) {
      const firstErrorField = Object.keys(errorObj).find(f => FIELD_TO_TAB[f] === tab);
      if (firstErrorField) {
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`field-${firstErrorField}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el?.focus();
        }, 100);
        break;
      }
    }
  };

  return (
    <>
      <div className="plan-v1-modal__overlay" />
      <div className="plan-v1-modal">
        <div className="plan-v1-modal__header">
          <h3>{mode === 'crear' ? 'Nuevo Plan' : `Editar Plan: ${formatNumeroAfiliado(planData?.numero_afiliado)}`}</h3>
          <button
            className="plan-v1-modal__close"
            onClick={() => {
              if (hasChanges) {
                setShowConfirmClose(true);
              } else {
                onClose?.();
              }
            }}
          >
            ✕
          </button>
        </div>

        <div className="plan-v1-modal__body">
          {/* Tabs */}
          <div className="plan-v1-modal__tabs">
            <button
              type="button"
              className={`plan-v1-modal__tab ${activeTab === 'datos' ? 'active' : ''}`}
              onClick={() => setActiveTab('datos')}
            >
              Datos Generales
            </button>
            <button
              type="button"
              className={`plan-v1-modal__tab ${activeTab === 'afiliados' ? 'active' : ''}`}
              onClick={() => setActiveTab('afiliados')}
            >
              Afiliados
            </button>
            {mode === 'editar' && (
              <button
                type="button"
                className={`plan-v1-modal__tab ${activeTab === 'recibos' ? 'active' : ''}`}
                onClick={async () => {
                  setActiveTab('recibos');
                  if (recibos.length === 0 && !recibosLoading) {
                    await loadRecibos();
                  }
                }}
              >
                Recibos
              </button>
            )}
            {mode === 'editar' && (
              <button
                type="button"
                className={`plan-v1-modal__tab ${activeTab === 'historial' ? 'active' : ''}`}
                onClick={async () => {
                  setActiveTab('historial');
                  if (historialCuota.length === 0) {
                    await loadHistorialCuota();
                  }
                }}
              >
                Historial de Cuota
              </button>
            )}
          </div>

          <form className="plan-v1-modal__form" onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
            {/* Tab: Datos Generales */}
            {activeTab === 'datos' && (
            <div className="plan-v1-modal__tab-content">
            <div className="plan-v1-modal__form-grid">
              <div className="plan-v1-modal__field">
                <label>Número de Afiliado *</label>
                <input
                  id="field-numero_afiliado"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.numero_afiliado}
                  onChange={(e) => handleFieldChange('numero_afiliado', e.target.value)}
                />
                {errors.numero_afiliado && <span className="plan-v1-modal__error">{errors.numero_afiliado}</span>}
              </div>

              <div className="plan-v1-modal__field">
                <label>Tipo de Plan *</label>
                <select
                  id="field-tipo_plan_numero"
                  value={form.tipo_plan_numero}
                  onChange={(e) => handleFieldChange('tipo_plan_numero', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {lookupData.tiposDeplan.map((t) => (
                    <option key={t.tipo_plan_numero} value={t.tipo_plan_numero}>
                      {t.tipo_plan_nombre}
                    </option>
                  ))}
                </select>
                {errors.tipo_plan_numero && <span className="plan-v1-modal__error">{errors.tipo_plan_numero}</span>}
              </div>

              <div className="plan-v1-modal__field">
                <label>Cobrador *</label>
                <select
                  id="field-cobrador_numero"
                  value={form.cobrador_numero}
                  onChange={(e) => handleFieldChange('cobrador_numero', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {lookupData.cobradores.map((c) => (
                    <option key={c.cobrador_numero} value={c.cobrador_numero}>
                      {c.cobrador_apellido}, {c.cobrador_nombre}
                    </option>
                  ))}
                </select>
                {errors.cobrador_numero && <span className="plan-v1-modal__error">{errors.cobrador_numero}</span>}
              </div>

              <div className="plan-v1-modal__field">
                <label>Obra Social *</label>
                <select
                  id="field-os_numero"
                  value={form.os_numero}
                  onChange={(e) => handleFieldChange('os_numero', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {lookupData.obrasSociales.map((o) => (
                    <option key={o.os_numero} value={o.os_numero}>
                      {o.os_nombre}
                    </option>
                  ))}
                </select>
                {errors.os_numero && <span className="plan-v1-modal__error">{errors.os_numero}</span>}
              </div>

              <div className="plan-v1-modal__field">
                <label>Tipo de Grupo *</label>
                <select
                  id="field-tipo_de_grupo_numero"
                  value={form.tipo_de_grupo_numero}
                  onChange={(e) => handleFieldChange('tipo_de_grupo_numero', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {lookupData.tiposDeGrupo.map((tg) => (
                    <option key={tg.tipo_de_grupo_numero} value={tg.tipo_de_grupo_numero}>
                      {tg.tipo_de_grupo_nombre}
                    </option>
                  ))}
                </select>
                {errors.tipo_de_grupo_numero && <span className="plan-v1-modal__error">{errors.tipo_de_grupo_numero}</span>}
              </div>

              <div className="plan-v1-modal__field">
                <label>Estado *</label>
                <select
                  value={form.estado}
                  onChange={(e) => handleFieldChange('estado', e.target.value)}
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
                </select>
              </div>

              <div className="plan-v1-modal__field">
                <label>Valor de Cuota (ARS) *</label>
                <input
                  id="field-valor_cuota"
                  type="number"
                  step="0.01"
                  value={form.valor_cuota}
                  onChange={(e) => handleFieldChange('valor_cuota', e.target.value)}
                />
                {errors.valor_cuota && <span className="plan-v1-modal__error">{errors.valor_cuota}</span>}
              </div>

              <div className="plan-v1-modal__field">
                <label>Domicilio</label>
                <input
                  type="text"
                  value={form.domicilio}
                  onChange={(e) => handleFieldChange('domicilio', e.target.value)}
                />
              </div>

              <div className="plan-v1-modal__field">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={form.telefono_1}
                  onChange={(e) => handleFieldChange('telefono_1', e.target.value)}
                />
              </div>
            </div>
            </div>
            )}

            {/* Tab: Afiliados */}
            {activeTab === 'afiliados' && (
              <div className="plan-v1-modal__tab-content">
                <div className="plan-v1-modal__afiliados-header">
                  <h4>Afiliados</h4>
                  <button
                    type="button"
                    className="plan-v1-modal__btn plan-v1-modal__btn--secondary"
                    onClick={() => setAfiladoSearchOpen(true)}
                  >
                    + Agregar Afiliado
                  </button>
                </div>

                {errors.integrantes && <span className="plan-v1-modal__error">{errors.integrantes}</span>}

                {form.integrantes.length === 0 ? (
                  <p className="plan-v1-modal__empty">Aún no hay afiliados. Agregá al menos uno.</p>
                ) : (
                  <table className="plan-v1-modal__afiliados-tabla">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>DNI</th>
                        <th>Rol</th>
                        <th>Servicios</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.integrantes.map((integrante) => (
                        <tr key={integrante.persona_id}>
                          <td>{integrante.persona?.nombre}</td>
                          <td>{integrante.persona?.apellido}</td>
                          <td>{integrante.persona?.numero_documento}</td>
                          <td>
                            <select
                              value={integrante.rol}
                              onChange={(e) => handleRolChange(integrante.persona_id, e.target.value)}
                            >
                              <option value="titular">Titular</option>
                              <option value="adherente">Adherente</option>
                            </select>
                          </td>
                          <td>
                            <ActionButton
                              variant="icon"
                              icon="⚙️"
                              onClick={() => integrante.id && setServiciosModalOpen(integrante.id)}
                              disabled={!integrante.id}
                              title="Servicios"
                            />
                          </td>
                          <td>
                            <ActionButton
                              variant="icon"
                              icon="✎"
                              onClick={() => handleIntegranteEdit(integrante.persona_id)}
                              title="Editar"
                            />
                            <ActionButton
                              variant="icon"
                              icon="🗑"
                              onClick={() => handleIntegranteRemove(integrante.persona_id)}
                              title="Quitar"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab: Recibos */}
            {activeTab === 'recibos' && (
              <div className="plan-v1-modal__tab-content">
                <h4>Recibos del plan</h4>
                {recibosLoading ? (
                  <p className="plan-v1-modal__empty">Cargando recibos...</p>
                ) : recibos.length === 0 ? (
                  <p className="plan-v1-modal__empty">No hay recibos generados aún.</p>
                ) : (
                  <>
                    <table className="plan-v1-modal__recibos-tabla">
                      <thead>
                        <tr>
                          <th>Período</th>
                          <th>Número de Integrantes</th>
                          <th>Valor Cuota</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recibos
                          .slice((recibosPage - 1) * recibosPerPage, recibosPage * recibosPerPage)
                          .map((recibo) => (
                            <tr key={recibo.id} className="plan-v1-modal__recibo-row">
                              <td>{new Date(recibo.periodo).toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit' })}</td>
                              <td>{recibo.ReciboIntegrantes?.length || 0}</td>
                              <td>${parseFloat(recibo.valor_cuota).toFixed(2)}</td>
                              <td>
                                <ActionButton
                                  type="button"
                                  variant="icon"
                                  icon="👁️"
                                  onClick={() => setReciboDetailOpen(recibo.id)}
                                  title="Ver detalle"
                                />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {/* Paginación */}
                    {recibos.length > recibosPerPage && (
                      <div className="plan-v1-modal__pagination">
                        <button
                          type="button"
                          disabled={recibosPage === 1}
                          onClick={() => setRecibosPage(recibosPage - 1)}
                          className="plan-v1-modal__btn plan-v1-modal__btn--small"
                        >
                          ← Anterior
                        </button>
                        <span className="plan-v1-modal__pagination-info">
                          Página {recibosPage} de {Math.ceil(recibos.length / recibosPerPage)}
                        </span>
                        <button
                          type="button"
                          disabled={recibosPage >= Math.ceil(recibos.length / recibosPerPage)}
                          onClick={() => setRecibosPage(recibosPage + 1)}
                          className="plan-v1-modal__btn plan-v1-modal__btn--small"
                        >
                          Siguiente →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab: Historial de Cuota */}
            {activeTab === 'historial' && (
              <div className="plan-v1-modal__tab-content">
                <h4>Historial de Cuota</h4>
                {historialLoading ? (
                  <p className="plan-v1-modal__empty">Cargando historial...</p>
                ) : !historialCuota || historialCuota.length === 0 ? (
                  <p className="plan-v1-modal__empty">No hay cambios de cuota registrados.</p>
                ) : (
                  <table className="plan-v1-modal__historial-tabla">
                    <thead>
                      <tr>
                        <th>Fecha de Cambio</th>
                        <th>Valor Anterior</th>
                        <th>Cambio</th>
                        <th>Valor Nuevo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialCuota.map((cambio, idx) => {
                        const valorAnterior = parseFloat(cambio.valor_anterior || 0);
                        const valorNuevo = parseFloat(cambio.valor_nuevo || 0);
                        const diferencia = valorNuevo - valorAnterior;
                        const porcentajeChange = valorAnterior > 0 ? ((diferencia / valorAnterior) * 100) : 0;

                        // Determinar si fue fijo o porcentual (inferir del cálculo)
                        // Si el cambio es muy cercano a un múltiplo de 0.01 y no es 0, probablemente fue fijo
                        const esFijo = diferencia % 1 === 0 || Math.abs(diferencia) < 0.01;

                        return (
                          <tr key={idx}>
                            <td>{new Date(cambio.fecha_cambio).toLocaleDateString('es-AR')}</td>
                            <td>${valorAnterior.toFixed(2)}</td>
                            <td className="plan-v1-modal__cambio-cell">
                              {esFijo
                                ? `Fijo: +$${diferencia.toFixed(2)}`
                                : `Porcentual: +${porcentajeChange.toFixed(1)}%`
                              }
                            </td>
                            <td>${valorNuevo.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="plan-v1-modal__footer">
          <button className="plan-v1-modal__btn plan-v1-modal__btn--primary" onClick={handleGuardar} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="plan-v1-modal__btn plan-v1-modal__btn--secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>

      {/* Secondary modals */}
      {afiladoSearchOpen && <AfiladoSearchModal onClose={() => setAfiladoSearchOpen(false)} onSelect={handleAfiladoSearch} />}
      {afiladoEditOpen && (
        <AfiladoEditModal
          personaId={afiladoEditOpen}
          personaData={form.integrantes.find(i => i.persona_id === afiladoEditOpen)?.persona}
          onClose={() => setAfiladoEditOpen(null)}
          onSave={handleIntegranteEditSave}
        />
      )}
      {reciboDetailOpen && <ReciboDetalleModal reciboId={reciboDetailOpen} onClose={() => setReciboDetailOpen(null)} />}
      {serviciosModalOpen && (
        <IntegranteServiciosModal
          planIntegranteId={serviciosModalOpen}
          onClose={() => setServiciosModalOpen(null)}
        />
      )}

      {/* Confirmation dialog for closing with unsaved changes */}
      <ConfirmCloseDialog
        isOpen={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title="¿Cerrar sin guardar?"
      />
    </>
  );
}

export default PlanV1Modal;
