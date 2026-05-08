import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { usePlanV1Form } from '../hooks/usePlanV1Form';
import ActionButton from '../../../../../components/ActionButton/ActionButton';
import { formatNumeroAfiliado, formatDate, calculateAge } from '../../../../../utils/formatters';
import planesV1Service from '../../../../../services/planesV1Service';
import planesIntegrantesService from '../../../../../services/planesIntegrantesService';
import personasService from '../../../../../services/personasService';
import lookupService from '../../../../../services/lookupService';
import localidadService from '../../../../../services/localidadService';
import recibosService from '../../../../../services/recibosService';
import useColumnResize from '../../../../../hooks/useColumnResize';
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
    zona_id: 'datos',
    localidad_id: 'datos',
    integrantes: 'afiliados',
  };
  const TAB_ORDER = ['datos', 'afiliados'];

  const [loading, setLoading] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState('');
  const [loadingAddAfiliado, setLoadingAddAfiliado] = useState(false);
  const [savedPlanData, setSavedPlanData] = useState(null);
  const [actualMode, setActualMode] = useState(mode);
  const [lookupData, setLookupData] = useState({
    tiposDeplan: [],
    cobradores: [],
    obrasSociales: [],
    tiposDeGrupo: [],
    zonas: [],
    localidades: [],
  });

  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'afiliados' | 'recibos' | 'historial'
  const [maxAfiliadoNumber, setMaxAfiliadoNumber] = useState(null);
  const [historialCuota, setHistorialCuota] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [recibos, setRecibos] = useState([]);
  const [recibosLoading, setRecibosLoading] = useState(false);
  const [recibosPage, setRecibosPage] = useState(1);
  const recibosPerPage = 10;

  // Column resize hooks for 3 tables
  const { widths: widthsAfiliados, getResizeHandle: getResizeHandleAfiliados } = useColumnResize(
    'plan-v1-afiliados',
    { afiliado: 180, dni: 110, rol: 80, nacimiento: 120, edad: 70, cobertura: 120, servicios: 80, acciones: 100 }
  );
  const { widths: widthsRecibos, getResizeHandle: getResizeHandleRecibos } = useColumnResize(
    'plan-v1-recibos',
    { periodo: 140, integrantes: 150, valor: 120, acciones: 100 }
  );
  const { widths: widthsHistorial, getResizeHandle: getResizeHandleHistorial } = useColumnResize(
    'plan-v1-historial',
    { fecha: 160, valorAnterior: 130, cambio: 140, valorNuevo: 130 }
  );

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
      const [lookups, localidades] = await Promise.all([
        lookupService.loadAllLookupsForPlans(),
        localidadService.getAll(),
      ]);
      setLookupData({
        ...lookups,
        localidades: localidades?.data || [],
      });
    } catch (err) {
      console.error('Error loading lookups:', err);
      setLookupData({
        tiposDeplan: [],
        cobradores: [],
        obrasSociales: [],
        tiposDeGrupo: [],
        zonas: [],
        localidades: [],
      });
    }
  };

  const loadMaxAfiliadoNumber = async () => {
    try {
      const data = await planesV1Service.getMaxAfiliadoNumber();
      if (data && data.suggestedNumber) {
        setMaxAfiliadoNumber(data.suggestedNumber);
        handleFieldChange('numero_afiliado', String(data.suggestedNumber).padStart(5, '0'));
      }
    } catch (err) {
      console.error('Error loading max affiliate number:', err);
    }
  };

  const loadFullPlanData = async () => {
    try {
      const fullPlan = await planesV1Service.obtener(planData.plan_numero);

      // Actualizar el form con los datos completos incluyendo integrantes, zona y localidad
      if (fullPlan) {
        // Actualizar zona_id y localidad_id
        if (fullPlan.zona_id) {
          handleFieldChange('zona_id', String(fullPlan.zona_id));
        }
        if (fullPlan.localidad_id) {
          handleFieldChange('localidad_id', String(fullPlan.localidad_id));
        }

        // Actualizar integrantes (ordenados por campo orden de BD)
        if (fullPlan.PlanIntegrantes) {
          const integrantes = fullPlan.PlanIntegrantes
            .sort((a, b) => a.orden - b.orden) // Ordenar por campo orden
            .map(pi => ({
              id: pi.id,
              persona_id: pi.persona_id,
              persona: pi.Persona,
              rol: pi.rol,
              orden: pi.orden,
              servicios: pi.IntegranteServicios || [],
            }));
          console.log('[PlanV1Modal] Integrantes encontrados (ordenados):', integrantes);
          handleFieldChange('integrantes', integrantes);
        }
      }
    } catch (err) {
      console.error('Error loading full plan data:', err);
    }
  };

  const reloadIntegrantes = async () => {
    try {
      const planNumero = planData?.plan_numero || savedPlanData?.plan_numero;
      if (!planNumero) return;
      const fullPlan = await planesV1Service.obtener(planNumero);
      if (fullPlan?.PlanIntegrantes) {
        const integrantes = fullPlan.PlanIntegrantes
          .sort((a, b) => a.orden - b.orden)
          .map(pi => ({
            id: pi.id,
            persona_id: pi.persona_id,
            persona: pi.Persona,
            rol: pi.rol,
            orden: pi.orden,
            servicios: pi.IntegranteServicios || [],
          }));
        handleFieldChange('integrantes', integrantes);
      }
    } catch (err) {
      console.error('Error reloading integrantes:', err);
    }
  };

  const loadHistorialCuota = async () => {
    try {
      setHistorialLoading(true);
      const data = await planesV1Service.obtenerHistorialCuota(planData.plan_numero);
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
      setRecibos(Array.isArray(data) ? data : []);
      setRecibosPage(1);
    } catch (err) {
      console.error('Error loading recibos:', err);
      setRecibos([]);
    } finally {
      setRecibosLoading(false);
    }
  };

  const handleGuardar = async (closeAfterSave = true) => {
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
        zona_id: form.zona_id || null,
        localidad_id: form.localidad_id || null,
      };

      if (actualMode === 'crear') {
        // Create plan + personas + integrantes in a single transaction via backend
        const integrantesPayload = form.integrantes.map((integ) => ({
          persona_id: integ.persona_id || null,
          persona: integ.persona_id ? null : integ.persona,
        }));

        const response = await planesV1Service.crearCompleto({
          ...payload,
          integrantes: integrantesPayload,
        });

        // Sync form with real IDs from BD
        const integrantesConId = (response.PlanIntegrantes || [])
          .sort((a, b) => a.orden - b.orden)
          .map(pi => ({
            id: pi.id,
            persona_id: pi.persona_id,
            persona: pi.Persona,
            rol: pi.rol,
            servicios: [],
          }));

        handleFieldChange('integrantes', integrantesConId);
        setSavedPlanData(response);
        setActualMode('editar');
      } else {
        // Update plan + sync integrantes + reorder in a single transaction
        const planNumero = (planData || savedPlanData)?.plan_numero;
        if (!planNumero) {
          throw new Error('No plan number available for update');
        }

        const integrantesPayload = form.integrantes.map((integ) => ({
          persona_id: integ.persona_id,
          rol: integ.rol,
        }));

        const response = await planesV1Service.actualizarCompleto(planNumero, {
          ...payload,
          integrantes: integrantesPayload,
        });

        // Sync form with updated data from BD
        const integrantesConId = (response.PlanIntegrantes || [])
          .sort((a, b) => a.orden - b.orden)
          .map(pi => ({
            id: pi.id,
            persona_id: pi.persona_id,
            persona: pi.Persona,
            rol: pi.rol,
            servicios: pi.IntegranteServicios || [],
          }));

        handleFieldChange('integrantes', integrantesConId);
      }

      // Si closeAfterSave es true, cierra el modal llamando a onSave()
      // Si es false, muestra notificación de éxito y mantiene modal abierto
      if (closeAfterSave) {
        onSave();
      } else {
        setShowSuccessNotification('Plan guardado exitosamente');
        setTimeout(() => setShowSuccessNotification(''), 3000);
      }
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

  const handleAfiladoSearch = async (persona) => {
    // Check for duplicates: if persona has id, match by persona_id; else match by numero_documento
    const isDuplicate = form.integrantes.some((i) => {
      if (persona.id) {
        // Persona exists in BD: check by persona_id
        return i.persona_id === persona.id;
      } else {
        // Persona is deferred (no id): check by numero_documento
        return i.persona?.numero_documento === persona.numero_documento;
      }
    });
    if (isDuplicate) {
      alert('Este afiliado ya está asignado al plan');
      return;
    }
    const rol = form.integrantes.length === 0 ? 'titular' : 'adherente';

    if (mode === 'editar' && persona.id) {
      // In edit mode and persona exists in BD: create integrante immediately
      setLoadingAddAfiliado(true);
      try {
        const planNumero = (planData || savedPlanData)?.plan_numero;
        if (!planNumero) {
          throw new Error('No plan number available');
        }
        const created = await planesIntegrantesService.crear({
          plan_numero: planNumero,
          persona_id: persona.id,
          rol,
        });
        const newIntegrante = { id: created.id, persona_id: persona.id, persona, rol };
        const updatedIntegrantes = [...form.integrantes, newIntegrante];
        handleFieldChange('integrantes', updatedIntegrantes);
        const integrantesWithMeta = updatedIntegrantes.map((integ, index) => ({
          id: integ.id,
          orden: index + 1,
        }));
        await planesIntegrantesService.reorder(planData.plan_numero, integrantesWithMeta);
        setShowSuccessNotification('Afiliado agregado al plan');
        setTimeout(() => setShowSuccessNotification(''), 3000);
      } catch (err) {
        console.error('Error adding integrante:', err);
      } finally {
        setLoadingAddAfiliado(false);
      }
    } else {
      // In create mode or persona without id: add to state for later creation on plan save
      const integrante = {
        id: null,
        persona_id: null,
        persona,
        rol,
      };
      const updatedIntegrantes = [...form.integrantes, integrante];
      handleFieldChange('integrantes', updatedIntegrantes);
    }
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
    removeIntegrante(personaId);
    // Actualizar roles después de eliminar un integrante
    setTimeout(() => {
      const updated = form.integrantes
        .filter((i) => i.persona_id !== personaId)
        .map((integrante, index) => ({
          ...integrante,
          rol: index === 0 ? 'titular' : 'integrante', // Recalcular rol
        }));
      handleFieldChange('integrantes', updated);
    }, 0);
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // No change in position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Reorder integrantes array
    const integrantes = Array.from(form.integrantes);
    const [removed] = integrantes.splice(source.index, 1);
    integrantes.splice(destination.index, 0, removed);

    // Update orden y rol basado en posición para cada integrante
    const reorderedIntegrantes = integrantes.map((integrante, index) => ({
      ...integrante,
      orden: index + 1,
      rol: index === 0 ? 'titular' : 'integrante', // Primero = titular, resto = integrante
    }));

    handleFieldChange('integrantes', reorderedIntegrantes);
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

        {showSuccessNotification && (
          <div className="plan-v1-modal__notification plan-v1-modal__notification--success">
            ✓ {showSuccessNotification}
          </div>
        )}

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
                  maxLength={5}
                  placeholder="00001"
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
                  <option value="ELIMINADO">ELIMINADO</option>
                  <option value="PROMOCION">PROMOCION</option>
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

              <div className="plan-v1-modal__field">
                <label>Zona</label>
                <select
                  id="field-zona_id"
                  value={form.zona_id}
                  onChange={(e) => handleFieldChange('zona_id', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {lookupData.zonas.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.codigo} — {z.nombre}
                    </option>
                  ))}
                </select>
                {errors.zona_id && <span className="plan-v1-modal__error">{errors.zona_id}</span>}
              </div>

              <div className="plan-v1-modal__field">
                <label>Localidad</label>
                <select
                  id="field-localidad_id"
                  value={form.localidad_id}
                  onChange={(e) => handleFieldChange('localidad_id', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {lookupData.localidades.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre} ({l.codigo})
                    </option>
                  ))}
                </select>
                {errors.localidad_id && <span className="plan-v1-modal__error">{errors.localidad_id}</span>}
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
                    disabled={loadingAddAfiliado}
                  >
                    {loadingAddAfiliado ? 'Agregando...' : '+ Agregar Afiliado'}
                  </button>
                </div>

                {errors.integrantes && <span className="plan-v1-modal__error">{errors.integrantes}</span>}

                {form.integrantes.length === 0 ? (
                  <p className="plan-v1-modal__empty">Aún no hay afiliados. Agregá al menos uno.</p>
                ) : (
                  <>
                    <DragDropContext onDragEnd={handleDragEnd}>
                    <table className="plan-v1-modal__afiliados-tabla table-standard">
                      <thead>
                        <tr>
                          <th style={{ width: widthsAfiliados.afiliado }}>Afiliado{getResizeHandleAfiliados('afiliado')}</th>
                          <th style={{ width: widthsAfiliados.dni }}>DNI{getResizeHandleAfiliados('dni')}</th>
                          <th style={{ width: widthsAfiliados.rol }}>Rol{getResizeHandleAfiliados('rol')}</th>
                          <th style={{ width: widthsAfiliados.nacimiento }}>Nacimiento{getResizeHandleAfiliados('nacimiento')}</th>
                          <th style={{ width: widthsAfiliados.edad }}>Edad{getResizeHandleAfiliados('edad')}</th>
                          <th style={{ width: widthsAfiliados.cobertura }}>Cobertura{getResizeHandleAfiliados('cobertura')}</th>
                          <th style={{ width: widthsAfiliados.servicios }}>Serv.{getResizeHandleAfiliados('servicios')}</th>
                          <th style={{ width: widthsAfiliados.acciones }}>Acciones{getResizeHandleAfiliados('acciones')}</th>
                        </tr>
                      </thead>
                      <Droppable droppableId="afiliados">
                        {(provided, snapshot) => (
                          <tbody
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={snapshot.isDraggingOver ? 'dragging-over' : ''}
                          >
                            {form.integrantes.map((integrante, index) => {
                              const uniqueKey = integrante.id || integrante.persona?.numero_documento;
                              return (
                              <Draggable key={uniqueKey} draggableId={String(uniqueKey)} index={index}>
                                {(provided, snapshot) => (
                                  <tr
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={snapshot.isDragging ? 'dragging' : ''}
                                  >
                                    <td>{integrante.persona?.apellido}, {integrante.persona?.nombre}</td>
                                    <td>{integrante.persona?.numero_documento}</td>
                                    <td>{integrante.rol === 'titular' ? 'Titular' : 'Integrante'}</td>
                                    <td>{formatDate(integrante.persona?.fecha_nacimiento)}</td>
                                    <td>{calculateAge(integrante.persona?.fecha_nacimiento)}</td>
                                    <td>{formatDate(integrante.persona?.fecha_cobertura)}</td>
                                    <td>
                                      {integrante.servicios?.length > 0
                                        ? integrante.servicios.map(s => s.ServicioAdicional?.servicio_adicional_nombre?.substring(0, 2)).join(', ')
                                        : '-'}
                                    </td>
                                    <td>
                                      <ActionButton
                                        variant="icon"
                                        icon="⚙️"
                                        onClick={() => integrante.id && setServiciosModalOpen(integrante.id)}
                                        disabled={!integrante.id}
                                        title="Servicios"
                                      />
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
                                )}
                              </Draggable>
                            );
                            })}
                          </tbody>
                        )}
                      </Droppable>
                    </table>
                  </DragDropContext>
                  </>
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
                    <table className="plan-v1-modal__recibos-tabla table-standard">
                      <thead>
                        <tr>
                          <th style={{ width: widthsRecibos.periodo }}>Período{getResizeHandleRecibos('periodo')}</th>
                          <th style={{ width: widthsRecibos.integrantes }}>Número de Integrantes{getResizeHandleRecibos('integrantes')}</th>
                          <th style={{ width: widthsRecibos.valor }}>Valor Cuota{getResizeHandleRecibos('valor')}</th>
                          <th style={{ width: widthsRecibos.acciones }}>Acciones{getResizeHandleRecibos('acciones')}</th>
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
                  <table className="plan-v1-modal__historial-tabla table-standard">
                    <thead>
                      <tr>
                        <th style={{ width: widthsHistorial.fecha }}>Fecha de Cambio{getResizeHandleHistorial('fecha')}</th>
                        <th style={{ width: widthsHistorial.valorAnterior }}>Valor Anterior{getResizeHandleHistorial('valorAnterior')}</th>
                        <th style={{ width: widthsHistorial.cambio }}>Cambio{getResizeHandleHistorial('cambio')}</th>
                        <th style={{ width: widthsHistorial.valorNuevo }}>Valor Nuevo{getResizeHandleHistorial('valorNuevo')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialCuota.map((cambio, idx) => {
                        const valorAnterior = parseFloat(cambio.valor_anterior || 0);
                        const valorNuevo = parseFloat(cambio.valor_nuevo || 0);
                        const diferencia = valorNuevo - valorAnterior;
                        const porcentajeChange = valorAnterior > 0 ? ((diferencia / valorAnterior) * 100) : 0;

                        return (
                          <tr key={idx}>
                            <td>{new Date(cambio.fecha_cambio).toLocaleDateString('es-AR')}</td>
                            <td>${valorAnterior.toFixed(2)}</td>
                            <td className="plan-v1-modal__cambio-cell">
                              {`+${porcentajeChange.toFixed(2)}% ($${diferencia.toFixed(2)})`}
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
          <div className="plan-v1-modal__footer-buttons">
            <button
              className="plan-v1-modal__btn plan-v1-modal__btn--primary"
              onClick={() => handleGuardar(false)}
              disabled={loading}
              title="Guarda los cambios y mantiene el modal abierto para continuar editando"
            >
              {loading ? 'Guardando...' : 'Guardar y Seguir Editando'}
            </button>
            <button
              className="plan-v1-modal__btn plan-v1-modal__btn--success"
              onClick={() => handleGuardar(true)}
              disabled={loading}
              title="Guarda los cambios y cierra el modal"
            >
              {loading ? 'Guardando...' : 'Guardar y Cerrar'}
            </button>
          </div>
          <button className="plan-v1-modal__btn plan-v1-modal__btn--secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>

      {/* Secondary modals */}
      {afiladoSearchOpen && <AfiladoSearchModal planMode={mode} onClose={() => setAfiladoSearchOpen(false)} onSelect={handleAfiladoSearch} />}
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
          onClose={async () => {
            setServiciosModalOpen(null);
            await reloadIntegrantes();
          }}
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
