import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Rnd } from 'react-rnd';
import personasService from '../../../services/personasService';
import planesService from '../../../services/planesService';
import templateService from '../../../services/templateService';
import useTemplateStore from '../../../hooks/useTemplateStore';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';
import PageGuides, { calculateRecibosPositions } from './PageGuides';
import TemplateConfigPanel from './TemplateConfigPanel';
import TableEditor, { updateCelda, addFila, deleteFila, updateFilaAltura, updateCeldaAncho } from './TableEditor';
import TablePreview from './TablePreview';
import CellEditorModal from './CellEditorModal';
import { HorizontalRuler, VerticalRuler, RULER_WIDTH, MM_TO_PX } from './Ruler';
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
  const [editingCell, setEditingCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);

  const handleRulerOffsetChange = (axis, newOffset) => {
    if (!pageConfigObj) return;

    const field = axis === 'horizontal' ? 'ruler_offset_horizontal_mm' : 'ruler_offset_vertical_mm';
    const updatedConfig = {
      ...pageConfigObj,
      [field]: Math.round(newOffset * 100) / 100 // Redondear a 2 decimales
    };

    updateTemplate({ bloque_pageconfig: updatedConfig });
  };

  const handleCanvasCellDoubleClick = (fila, celda) => {
    setEditingCell({ fila, celda });
  };

  const handleCanvasCellClick = (fila, celda) => {
    console.log('[handleCanvasCellClick] fila:', fila);
    console.log('[handleCanvasCellClick] fila.id:', fila.id);
    console.log('[handleCanvasCellClick] celda:', celda);
    setSelectedCell({ fila, celda });
  };

  const handleCanvasCellContextMenu = (e, fila, celda) => {
    const tabla = currentTemplate.bloques?.[0];
    const filaIndex = tabla.filas.findIndex(f => f.id === fila.id);
    const celdaIndex = fila.celdas.findIndex(c => c.id === celda.id);

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      filaIndex,
      celdaIndex,
      fila,
      celda
    });
  };

  // Cerrar context menu al hacer click afuera
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
          className="btn btn-info"
          onClick={() => setShowHtmlEditor(!showHtmlEditor)}
          title="Ver/editar HTML crudo"
        >
          &lt;/&gt; HTML
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
        {/* Layout de Rulers + Canvas */}
        <div className="rulers-container">
          {/* Fila 1: Esquina + Ruler Horizontal */}
          <div style={{ display: 'flex', width: '100%', flex: 'none' }}>
            {/* Esquina superior izquierda (intersección de reglas) */}
            <div className="ruler-corner" style={{ width: RULER_WIDTH, height: RULER_WIDTH, flexShrink: 0 }} />

            {/* Ruler Horizontal - sticky */}
            <div className="ruler-horizontal-container" style={{ flex: 1 }}>
              <HorizontalRuler
                width={pageDimensions.width * MM_TO_PX}
                offsetMM={pageConfigObj?.ruler_offset_horizontal_mm || 0}
                onOffsetChange={(newOffset) => handleRulerOffsetChange('horizontal', newOffset)}
              />
            </div>
          </div>

          {/* Fila 2: Ruler Vertical + Canvas */}
          <div style={{ display: 'flex', flex: 1, width: '100%' }}>
            {/* Ruler Vertical - sticky */}
            <div className="ruler-vertical-container" style={{ flexShrink: 0 }}>
              <VerticalRuler
                height={pageDimensions.height * MM_TO_PX}
                offsetMM={pageConfigObj?.ruler_offset_vertical_mm || 0}
                onOffsetChange={(newOffset) => handleRulerOffsetChange('vertical', newOffset)}
              />
            </div>

            {/* Canvas Wrapper */}
            <div className="canvas-wrapper">
              <div className="editor-canvas" ref={canvasRef}>
                <div
                  className="a4-page"
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
                    onCellDoubleClick={handleCanvasCellDoubleClick}
                    onCellClick={handleCanvasCellClick}
                    onContextMenu={handleCanvasCellContextMenu}
                    selectedCellId={selectedCell?.celda?.id}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="editor-properties">
          <h3>Configuración</h3>
          <div className="blocks-editor">
            <TemplateConfigPanel selectedCell={selectedCell} placeholders={placeholders} />
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1001,
            minWidth: '200px'
          }}
        >
          <button
            onClick={() => {
              const tabla = currentTemplate.bloques[0];
              const nuevaTabla = addFila(tabla, contextMenu.filaIndex);
              updateTemplate({ bloques: [nuevaTabla] });
              setContextMenu(null);
            }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '12px', color: '#333' }}
          >
            Agregar fila arriba
          </button>
          <button
            onClick={() => {
              const tabla = currentTemplate.bloques[0];
              const nuevaTabla = addFila(tabla, contextMenu.filaIndex + 1);
              updateTemplate({ bloques: [nuevaTabla] });
              setContextMenu(null);
            }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '12px', color: '#333' }}
          >
            Agregar fila abajo
          </button>
          <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }} />
          <button
            onClick={() => {
              const tabla = currentTemplate.bloques[0];
              const nuevaTabla = deleteFila(tabla, contextMenu.fila.id);
              updateTemplate({ bloques: [nuevaTabla] });
              setContextMenu(null);
            }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '12px', color: '#d32f2f' }}
          >
            Eliminar fila
          </button>
        </div>
      )}

      {/* Modal HTML Editor */}
      {showHtmlEditor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowHtmlEditor(false)}
        >
          <div
            style={{
              width: '80%',
              height: '80vh',
              backgroundColor: 'white',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              padding: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>HTML Crudo</h3>
              <button
                onClick={() => setShowHtmlEditor(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>

            <textarea
              defaultValue={JSON.stringify(currentTemplate.bloques[0], null, 2)}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                marginBottom: '12px',
                boxSizing: 'border-box',
                resize: 'none'
              }}
              id="html-editor-textarea"
            />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowHtmlEditor(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  try {
                    const textarea = document.getElementById('html-editor-textarea');
                    const nuevaTabla = JSON.parse(textarea.value);
                    updateTemplate({ bloques: [nuevaTabla] });
                    setShowHtmlEditor(false);
                  } catch (e) {
                    alert('JSON inválido: ' + e.message);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición desde canvas */}
      {editingCell && (
        <CellEditorModal
          celda={editingCell.celda}
          placeholders={placeholders}
          onSave={(nuevoContenido) => {
            const nuevaTabla = updateCelda(
              currentTemplate.bloques[0],
              editingCell.fila.id,
              editingCell.celda.id,
              'contenido',
              nuevoContenido
            );
            updateTemplate({ bloques: [nuevaTabla] });
            setEditingCell(null);
          }}
          onClose={() => setEditingCell(null)}
        />
      )}

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
