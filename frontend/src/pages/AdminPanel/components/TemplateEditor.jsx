import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Rnd } from 'react-rnd';
import personasService from '../../../services/personasService';
import planesService from '../../../services/planesService';
import templateService from '../../../services/templateService';
import useTemplateStore from '../../../hooks/useTemplateStore';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';
import PageGuides, { calculateRecibosPositions } from './PageGuides';
import BloquePageConfig from './BlockEditor/BloquePageConfig';
import TableEditor from './TableEditor';
import TablePreview from './TablePreview';
import '../RecibosTemplatesPage.scss';

const TemplateEditor = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [placeholders, setPlaceholders] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [plansList, setPlansList] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [placeholdersPosition, setPlaceholdersPosition] = useState({ x: 20, y: 20 });
  const canvasRef = useRef(null);

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const isDirty = useTemplateStore((state) => state.isDirty);
  const isSaving = useTemplateStore((state) => state.isSaving);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const setIsSaving = useTemplateStore((state) => state.setIsSaving);
  const resetTemplate = useTemplateStore((state) => state.resetTemplate);
  const setCurrentTemplate = useTemplateStore((state) => state.setCurrentTemplate);

  // Cargar template y placeholders
  useEffect(() => {
    const loadData = async () => {
      const placeholderResult = await templateService.getPlaceholders();
      if (placeholderResult.success) {
        setPlaceholders(placeholderResult.placeholders);
      }

      if (currentTemplate.id && !currentTemplate.bloque_pageconfig) {
        setLoading(true);
        const templateResult = await templateService.getTemplate(currentTemplate.id);
        if (templateResult.success) {
          setCurrentTemplate(templateResult.data);
        } else {
          setError('Error cargando template');
        }
        setLoading(false);
      }
    };
    loadData();
  }, [currentTemplate.id, setCurrentTemplate]);

  // Calcular posiciones del recibo
  const parsePageConfig = (config) => {
    if (!config) return null;
    if (typeof config === 'string') {
      try {
        return JSON.parse(config);
      } catch (e) {
        console.error('Error parseando bloque_pageconfig:', e);
        return null;
      }
    }
    return config;
  };

  const getPageDimensions = (pageSize) => {
    const sizes = {
      'A4': { width: 210, height: 297 },
      'A5': { width: 148, height: 210 },
      'Letter': { width: 215.9, height: 279.4 },
      'Personalizado': { width: 210, height: 297 }
    };
    return sizes[pageSize] || sizes['A4'];
  };

  const pageConfigObj = parsePageConfig(currentTemplate.bloque_pageconfig);
  const reciboPositions = pageConfigObj
    ? calculateRecibosPositions(pageConfigObj)
    : null;
  const reciboUnoSize = reciboPositions?.recibos[0] || null;
  const pageDimensions = pageConfigObj ? getPageDimensions(pageConfigObj.tamaño || 'A4') : { width: 210, height: 297 };

  const handleSave = async () => {
    if (!currentTemplate.bloque_pageconfig) {
      setError('Bloque 5 (Configuración de Página) es obligatorio');
      return;
    }

    setLoading(true);
    setIsSaving(true);

    const result = await templateService.updateTemplate(currentTemplate.id, currentTemplate);

    if (result.success) {
      setSuccessMessage('Template guardado exitosamente');
      setTimeout(() => setSuccessMessage(null), 2000);
      updateTemplate({ isDirty: false });
    } else {
      setError(result.message || 'Error guardando template');
    }

    setLoading(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowConfirmModal(true);
      setPendingAction('cancel');
    } else {
      onBack();
    }
  };

  const handleViewPdf = async () => {
    if (!currentTemplate.bloque_pageconfig) {
      setError('Bloque 5 es obligatorio para generar PDF');
      return;
    }

    if (isDirty) {
      setPendingAction('pdf-view');
      setShowConfirmModal(true);
      return;
    }

    await generatePdf(false);
  };

  const handleDownloadPdf = async () => {
    if (!currentTemplate.bloque_pageconfig) {
      setError('Bloque 5 es obligatorio para generar PDF');
      return;
    }

    if (isDirty) {
      setPendingAction('pdf-download');
      setShowConfirmModal(true);
      return;
    }

    await generatePdf(true);
  };

  const generatePdf = async (shouldDownload = true) => {
    if (!canvasRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const canvasCopy = canvasRef.current.cloneNode(true);
      const pageConfig = currentTemplate.bloque_pageconfig || {};

      const options = {
        margin: [
          pageConfig.margen_superior_mm || 10,
          pageConfig.margen_derecho_mm || 10,
          pageConfig.margen_inferior_mm || 10,
          pageConfig.margen_izquierdo_mm || 10
        ],
        filename: `recibo_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
          orientation: pageConfig.orientacion || 'portrait',
          unit: 'mm',
          format: pageConfig.tamaño?.toLowerCase() || 'a4'
        }
      };

      const pdfGenerator = html2pdf()
        .set(options)
        .from(canvasCopy);

      if (shouldDownload) {
        await pdfGenerator.save();
      } else {
        const pdfDataUrl = await pdfGenerator.outputPdf('dataurlstring');
        window.open(pdfDataUrl, '_blank');
      }

      setLoading(false);
    } catch (err) {
      setError('Error generando PDF: ' + err.message);
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (pendingAction === 'cancel') {
      resetTemplate();
      onBack();
    } else if (pendingAction === 'pdf-view') {
      await handleSave();
      await generatePdf(false);
    } else if (pendingAction === 'pdf-download') {
      await handleSave();
      await generatePdf(true);
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  };


  // Cargar primeros 10 planes con persona asignada al abrir el editor
  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      // Obtener más planes para poder filtrar los que tengan persona
      const results = await planesService.searchPlanes('', 50);
      // Filtrar solo planes que tengan persona asignada
      const plansWithPerson = results.filter(plan => plan.persona && plan.persona.nombre);
      // Tomar solo los primeros 10
      setPlansList(plansWithPerson.slice(0, 10));
      setPlansLoading(false);
    };
    loadPlans();
  }, []);

  // Seleccionar Plan del combo
  const handleSelectPlan = async (e) => {
    const planId = parseInt(e.target.value);
    if (!planId) {
      setSelectedPlanId(null);
      setSelectedPlanData(null);
      return;
    }

    setSelectedPlanId(planId);
    const planDetail = await planesService.getPlanDetail(planId);
    if (planDetail) {
      console.log('Plan detail received:', planDetail);
      console.log('Mapped data:', mapPlanToPersonData(planDetail));
      setSelectedPlanData(planDetail);
    }
  };

  /**
   * Mapea datos del plan + titular a una estructura compatible con placeholderReplacer
   * Combina datos del plan (cuota, obra social, zona) con datos del titular (nombre, documento)
   */
  const mapPlanToPersonData = (planData) => {
    if (!planData) return null;

    const persona = planData.persona || planData.Persona || {};

    return {
      // Datos del titular (persona)
      nombre: persona.nombre || '',
      apellido: persona.apellido || '',
      numero_documento: persona.numero_documento || '',
      tipo_documento: persona.tipo_documento || '',
      fecha_nacimiento: persona.fecha_nacimiento || '',
      domicilio: planData.domicilio || persona.domicilio || '',
      localidad_nombre: persona.localidad_nombre || '',

      // Datos del plan
      numero_afiliado: planData.numero_afiliado || '',
      valor_cuota: planData.valor_cuota || 0,
      cuota_social: planData.cuota_social || 0,
      arancel_por_servicio: planData.arancel_por_servicio || 0,
      fecha_cobertura: planData.fecha_cobertura || '',
      zona_codigo: planData.zona_codigo || '',
      numero_recibo: '',
      periodo: '',

      // Datos de lookups
      obra_social_nombre: planData.obra_social_nombre || '',
      tipo_plan_nombre: planData.tipo_plan_nombre || '',
      tipo_de_grupo_nombre: planData.tipo_de_grupo_nombre || '',

      // Datos de empresa (si existen)
      empresa_nombre: planData.empresa_nombre || '',
      empresa_direccion: planData.empresa_direccion || ''
    };
  };



  return (
    <div className="template-editor-new">
      <div className="editor-header">
        <button className="btn btn-back" onClick={handleCancel}>
          ← Atrás
        </button>
        <h2>{currentTemplate.nombre}</h2>
        {currentTemplate.activo && (
          <span className="badge badge-active">✓ ACTIVO</span>
        )}
        <button
          className="btn btn-info btn-help"
          onClick={() => setShowPlaceholders(!showPlaceholders)}
          title="Ver placeholders disponibles"
        >
          ? Placeholders
        </button>

        {/* Combo de Planes Pre-cargado */}
        <div className="plan-selector" style={{ minWidth: '300px' }}>
          <select
            value={selectedPlanId || ''}
            onChange={handleSelectPlan}
            className="plan-select"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontFamily: 'monospace'
            }}
            disabled={plansLoading || plansList.length === 0}
          >
            <option value="">
              {plansLoading ? 'Cargando planes...' : 'Seleccionar un plan...'}
            </option>
            {plansList.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.id} - {plan.numero_afiliado} - {plan.persona?.nombre} {plan.persona?.apellido}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="editor-container-new">
        {/* Canvas A4 */}
        <div className="editor-canvas">
          <div
            className="a4-page"
            ref={canvasRef}
            style={{
              width: `${pageDimensions.width}mm`,
              height: `${pageDimensions.height}mm`
            }}
          >
            {/* Guías visuales */}
            {currentTemplate.bloque_pageconfig && (
              <PageGuides pageConfig={currentTemplate.bloque_pageconfig} />
            )}

            {/* Tabla en canvas */}
            <TablePreview
              tabla={currentTemplate.bloques?.[0]}
              reciboPositions={reciboPositions}
              pageConfig={pageConfigObj}
              personData={mapPlanToPersonData(selectedPlanData)}
            />
          </div>
        </div>

        {/* Panel derecho */}
        <div className="editor-properties">
          <h3>Configuración</h3>
          <div className="blocks-editor">
            <TableEditor placeholders={placeholders} />

            <div className="pageconfig-section" style={{ marginTop: '20px' }}>
              <hr />
              <h4>Configuración de Página</h4>
              <BloquePageConfig />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="editor-footer">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!isDirty || loading}
        >
          💾 Guardar
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleCancel}
          disabled={loading}
        >
          ✕ Cancelar
        </button>
        <button
          className="btn btn-info"
          onClick={handleViewPdf}
          disabled={loading}
        >
          📄 Ver PDF
        </button>
        <button
          className="btn btn-download"
          onClick={handleDownloadPdf}
          disabled={loading}
        >
          ⬇️ Descargar PDF
        </button>
      </div>

      {/* Placeholders panel - draggable */}
      {showPlaceholders && (
        <Rnd
          default={{
            x: placeholdersPosition.x,
            y: placeholdersPosition.y,
            width: 350,
            height: 'auto'
          }}
          onDragStop={(e, d) => setPlaceholdersPosition({ x: d.x, y: d.y })}
          disableResizing
          dragHandleClassName="placeholders-header"
          style={{
            position: 'fixed',
            zIndex: 1000,
            touchAction: 'none'
          }}
        >
          <div className="placeholders-panel">
            <div className="placeholders-header">
              <h3>Placeholders Disponibles</h3>
              <button
                className="btn-close"
                onClick={() => setShowPlaceholders(false)}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="placeholders-content">
              {Object.entries(placeholders).map(([category, items]) => (
                <div key={category} className="placeholder-category">
                  <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                  <div className="placeholder-list">
                    {items.map((placeholder) => (
                      <div key={placeholder} className="placeholder-item" title={placeholder}>
                        <code>{placeholder}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Rnd>
      )}

      {/* Confirm modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {pendingAction === 'cancel'
                ? '¿Tienes cambios sin guardar'
                : '¿Generar PDF?'}
            </h3>
            <p>
              {pendingAction === 'cancel'
                ? 'Hay cambios sin guardar. ¿Descartar?'
                : 'Hay cambios sin guardar. ¿Guardar primero?'}
            </p>
            <div className="modal-actions">
              {pendingAction === 'cancel' && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmAction}
                  >
                    Descartar
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancelar
                  </button>
                </>
              )}
              {(pendingAction === 'pdf-view' || pendingAction === 'pdf-download') && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmAction}
                  >
                    Guardar y Generar
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (pendingAction === 'pdf-view') {
                        generatePdf(false);
                      } else {
                        generatePdf(true);
                      }
                      setShowConfirmModal(false);
                    }}
                  >
                    Solo Generar
                  </button>
                  <button
                    className="btn btn-tertiary"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
