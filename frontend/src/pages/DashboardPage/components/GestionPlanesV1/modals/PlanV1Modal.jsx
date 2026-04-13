import React, { useState, useEffect, useCallback } from 'react';
import { usePlanV1Form } from '../hooks/usePlanV1Form';
import planesV1Service from '../../../../../services/planesV1Service';
import planesIntegrantesService from '../../../../../services/planesIntegrantesService';
import lookupService from '../../../../../services/lookupService';
import AfiladoSearchModal from './AfiladoSearchModal';
import AfiladoEditModal from './AfiladoEditModal';
import ReciboDetalleModal from './ReciboDetalleModal';
import './PlanV1Modal.scss';

function PlanV1Modal({ mode, planData, onClose, onSave }) {
  const { form, errors, handleFieldChange, addIntegrante, removeIntegrante, updateIntegranteRol, validate, reset } = usePlanV1Form(planData);
  const [loading, setLoading] = useState(false);
  const [lookupData, setLookupData] = useState({
    tiposDeplan: [],
    cobradores: [],
    obrasSociales: [],
    tiposDeGrupo: [],
  });

  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'afiliados' | 'recibos'
  const [maxAfiliadoNumber, setMaxAfiliadoNumber] = useState(null);

  // Secondary modals
  const [afiladoSearchOpen, setAfiladoSearchOpen] = useState(false);
  const [afiladoEditOpen, setAfiladoEditOpen] = useState(null); // null or persona_id
  const [reciboDetailOpen, setReciboDetailOpen] = useState(null); // null or recibo id

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

  const handleGuardar = async () => {
    if (!validate()) return;

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
      console.error('Error saving plan:', err);
      alert(`Error al guardar el plan: ${err.message}`);
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

  return (
    <>
      <div className="plan-v1-modal__overlay" onClick={onClose} />
      <div className="plan-v1-modal">
        <div className="plan-v1-modal__header">
          <h3>{mode === 'crear' ? 'Nuevo Plan' : `Editar Plan: ${planData?.numero_afiliado}`}</h3>
          <button className="plan-v1-modal__close" onClick={onClose}>✕</button>
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
            {(mode === 'editar' && planData?.Recibos?.length > 0) && (
              <button
                type="button"
                className={`plan-v1-modal__tab ${activeTab === 'recibos' ? 'active' : ''}`}
                onClick={() => setActiveTab('recibos')}
              >
                Recibos
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
                  type="text"
                  value={form.numero_afiliado}
                  onChange={(e) => handleFieldChange('numero_afiliado', e.target.value)}
                />
                {errors.numero_afiliado && <span className="plan-v1-modal__error">{errors.numero_afiliado}</span>}
              </div>

              <div className="plan-v1-modal__field">
                <label>Tipo de Plan *</label>
                <select
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
                            <button
                              type="button"
                              className="plan-v1-modal__btn-icon"
                              onClick={() => handleIntegranteEdit(integrante.persona_id)}
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="plan-v1-modal__btn-icon plan-v1-modal__btn-icon--danger"
                              onClick={() => handleIntegranteRemove(integrante.persona_id)}
                              title="Quitar"
                            >
                              🗑
                            </button>
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
                <h4>Recibos</h4>
                {!planData?.Recibos || planData.Recibos.length === 0 ? (
                  <p className="plan-v1-modal__empty">No hay recibos generados aún.</p>
                ) : (
                  <table className="plan-v1-modal__recibos-tabla">
                    <thead>
                      <tr>
                        <th>Número de Recibo</th>
                        <th>Período</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planData.Recibos.map((recibo) => (
                        <tr
                          key={recibo.id}
                          onClick={() => setReciboDetailOpen(recibo.id)}
                          className="plan-v1-modal__recibo-row"
                        >
                          <td>{recibo.id}</td>
                          <td>{new Date(recibo.periodo).toLocaleDateString('es-AR')}</td>
                          <td>${parseFloat(recibo.valor_cuota).toFixed(2)}</td>
                        </tr>
                      ))}
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
    </>
  );
}

export default PlanV1Modal;
