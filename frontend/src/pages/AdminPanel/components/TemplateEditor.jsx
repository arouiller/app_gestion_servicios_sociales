import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import templateService from '../../../services/templateService';
import useTemplateStore from '../../../hooks/useTemplateStore';
import DraggableBlock from './DraggableBlock';
import PageGuides, { calculateRecibosPositions } from './PageGuides';
import StaticBlockPreview from './StaticBlockPreview';
import BloqueEncabezado from './BlockEditor/BloqueEncabezado';
import BloqueAfiliado from './BlockEditor/BloqueAfiliado';
import BloqueDetalles from './BlockEditor/BloqueDetalles';
import BloquePie from './BlockEditor/BloquePie';
import BloquePageConfig from './BlockEditor/BloquePageConfig';
import '../RecibosTemplatesPage.scss';

const TemplateEditor = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [placeholders, setPlaceholders] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const canvasRef = useRef(null);

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const isDirty = useTemplateStore((state) => state.isDirty);
  const isSaving = useTemplateStore((state) => state.isSaving);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const setIsSaving = useTemplateStore((state) => state.setIsSaving);
  const resetTemplate = useTemplateStore((state) => state.resetTemplate);
  const setCurrentTemplate = useTemplateStore((state) => state.setCurrentTemplate);

  // Cargar template completo del servidor y placeholders
  useEffect(() => {
    const loadData = async () => {
      // Cargar placeholders
      const placeholderResult = await templateService.getPlaceholders();
      if (placeholderResult.success) {
        setPlaceholders(placeholderResult.placeholders);
      }

      // Cargar template completo si no tiene datos
      if (currentTemplate.id && !currentTemplate.bloque_encabezado) {
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
      const options = {
        margin: 10,
        filename: `recibo_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      const pdfGenerator = html2pdf()
        .set(options)
        .from(canvasRef.current);

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

  // Agregar nuevo bloque vacío
  const handleAddBlock = (blockName) => {
    const blockConfigs = {
      encabezado: {
        empresa_nombre: '',
        empresa_direccion: '',
        empresa_telefono: '',
        empresa_email: '',
        empresa_sitio: '',
        logo_url: ''
      },
      afiliado: { filas: [] },
      detalles: {
        preset: 'simple',
        filas: [
          { etiqueta: 'Total', placeholder: '{{valor_total}}' }
        ]
      },
      pie: {
        aclaracion: '',
        texto_legal: '',
        mostrar_linea_firma: false,
        referencia: ''
      }
    };

    updateTemplate({
      [`bloque_${blockName}`]: blockConfigs[blockName],
      isDirty: true
    });
    setSelectedBlock(blockName);
  };

  // Eliminar bloque
  const handleDeleteBlock = (blockName) => {
    if (window.confirm(`¿Eliminar bloque ${blockName.charAt(0).toUpperCase() + blockName.slice(1)}?`)) {
      updateTemplate({
        [`bloque_${blockName}`]: null,
        isDirty: true
      });
      if (selectedBlock === blockName) {
        setSelectedBlock(null);
      }
    }
  };

  const blocks = ['encabezado', 'afiliado', 'detalles', 'pie'];

  // Calcular posiciones de los recibos estáticos
  const reciboPositions = currentTemplate.bloque_pageconfig
    ? calculateRecibosPositions(currentTemplate.bloque_pageconfig)
    : null;

  // Obtener el tamaño del Recibo 1 para límites dinámicos de bloques
  const reciboUnoSize = reciboPositions?.recibos[0] || null;

  const getReciboPosStyle = (reciboNumber) => {
    if (!reciboPositions || !reciboPositions.recibos[reciboNumber - 1]) {
      return {};
    }
    const recibo = reciboPositions.recibos[reciboNumber - 1];
    return {
      left: `${recibo.x}mm`,
      top: `${recibo.y}mm`,
      width: `${recibo.width}mm`,
      height: `${recibo.height}mm`
    };
  };

  const renderBlockContent = (blockName) => {
    switch (blockName) {
      case 'encabezado':
        return currentTemplate.bloque_encabezado ? <BloqueEncabezado /> : null;
      case 'afiliado':
        return currentTemplate.bloque_afiliado ? <BloqueAfiliado /> : null;
      case 'detalles':
        return currentTemplate.bloque_detalles ? <BloqueDetalles /> : null;
      case 'pie':
        return currentTemplate.bloque_pie ? <BloquePie /> : null;
      default:
        return null;
    }
  };

  const getBlockLabel = (blockName) => {
    const labels = {
      encabezado: 'Encabezado',
      afiliado: 'Afiliado',
      detalles: 'Detalles',
      pie: 'Pie de Página'
    };
    return labels[blockName];
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
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="editor-container-new">
        {/* Panel izquierdo: Canvas A4 con bloques draggables */}
        <div className="editor-canvas">
          <div className="a4-page" ref={canvasRef}>
            {/* Guías visuales: márgenes y límites de recibos */}
            {currentTemplate.bloque_pageconfig && (
              <PageGuides pageConfig={currentTemplate.bloque_pageconfig} />
            )}

            {/* Recibo 1: Editable con DraggableBlock */}
            <div className="recibo-container recibo-1">
              {blocks.map((blockName) => (
                currentTemplate[`bloque_${blockName}`] && (
                  <div
                    key={blockName}
                    onClick={() => setSelectedBlock(blockName)}
                    style={{ cursor: 'pointer' }}
                  >
                    <DraggableBlock blockName={blockName} reciboSize={reciboUnoSize}>
                      {renderBlockContent(blockName)}
                    </DraggableBlock>
                  </div>
                )
              ))}
              {blocks.every((b) => !currentTemplate[`bloque_${b}`]) && (
                <div className="a4-empty-state">
                  <p>📋 No hay bloques. Agrega algunos en el panel derecho.</p>
                </div>
              )}
            </div>

            {/* Recibos 2+: Estáticos (read-only) */}
            {currentTemplate.bloque_pageconfig?.recibos_por_pagina > 1 && (
              <div className="recibos-static-container">
                {Array.from({ length: (currentTemplate.bloque_pageconfig?.recibos_por_pagina || 1) - 1 }).map((_, idx) => (
                  <div
                    key={idx + 2}
                    className={`recibo-static recibo-${idx + 2}`}
                    style={getReciboPosStyle(idx + 2)}
                  >
                    {blocks.map((blockName) => (
                      currentTemplate[`bloque_${blockName}`] && (
                        <StaticBlockPreview
                          key={blockName}
                          blockName={blockName}
                          blockData={currentTemplate[`bloque_${blockName}`]}
                        />
                      )
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Editor de propiedades y configuración */}
        <div className="editor-properties">
          <h3>Configuración</h3>
          <div className="blocks-editor">
            {/* Botones para agregar bloques que no existen */}
            <div className="add-blocks-section">
              <h4>Bloques</h4>
              {blocks.map((blockName) => (
                <div key={blockName} className="block-control">
                  {currentTemplate[`bloque_${blockName}`] ? (
                    <>
                      <button
                        className={`btn btn-block-toggle ${selectedBlock === blockName ? 'active' : ''}`}
                        onClick={() => setSelectedBlock(blockName)}
                      >
                        ✓ {getBlockLabel(blockName)}
                      </button>
                      <button
                        className="btn btn-icon btn-delete-block"
                        onClick={() => handleDeleteBlock(blockName)}
                        title="Eliminar bloque"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-block-add"
                      onClick={() => handleAddBlock(blockName)}
                    >
                      + {getBlockLabel(blockName)}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Editor del bloque seleccionado */}
            {selectedBlock && currentTemplate[`bloque_${selectedBlock}`] && (
              <div className="selected-block-editor">
                <hr />
                <h4>Editar {getBlockLabel(selectedBlock)}</h4>
                {renderBlockContent(selectedBlock)}
              </div>
            )}

            {/* Configuración de página (siempre visible) */}
            <div className="pageconfig-section">
              <hr />
              <h4>Configuración de Página</h4>
              <BloquePageConfig />
            </div>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
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

      {/* Panel de placeholders */}
      {showPlaceholders && (
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
      )}

      {/* Modal de confirmación */}
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
