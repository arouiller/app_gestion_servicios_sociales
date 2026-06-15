import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { v4 as uuidv4 } from 'uuid';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import personasService from '../../../services/personasService';
import templateService from '../../../services/templateService';
import useTemplateStore from '../../../hooks/useTemplateStore';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';
import GenericBlock from './GenericBlock';
import ReadOnlyBlockPreview from './ReadOnlyBlockPreview';
import PageGuides, { calculateRecibosPositions } from './PageGuides';
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
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [pendingBlocks, setPendingBlocks] = useState({});
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [planSearchResults, setPlanSearchResults] = useState([]);
  const [planSearchInput, setPlanSearchInput] = useState('');
  const [planSearchOpen, setPlanSearchOpen] = useState(false);
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
  const reciboPositions = currentTemplate.bloque_pageconfig
    ? calculateRecibosPositions(currentTemplate.bloque_pageconfig)
    : null;
  const reciboUnoSize = reciboPositions?.recibos[0] || null;

  const handleSave = async () => {
    if (!currentTemplate.bloque_pageconfig) {
      setError('Bloque 5 (Configuración de Página) es obligatorio');
      return;
    }

    // Sincronizar pendingBlocks con bloques actuales
    const syncedBloques = (currentTemplate.bloques || []).map(b =>
      pendingBlocks[b.id] !== undefined
        ? { ...b, contenido: pendingBlocks[b.id] }
        : b
    );

    setLoading(true);
    setIsSaving(true);

    const result = await templateService.updateTemplate(currentTemplate.id, {
      ...currentTemplate,
      bloques: syncedBloques
    });

    if (result.success) {
      setSuccessMessage('Template guardado exitosamente');
      setPendingBlocks({});
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
      // Crear copia del canvas con placeholders reemplazados
      const canvasCopy = canvasRef.current.cloneNode(true);

      // Reemplazar placeholders en todos los bloques
      if (selectedPersonData) {
        canvasCopy.querySelectorAll('[class*="generic-block"]').forEach(blockEl => {
          const originalHTML = blockEl.innerHTML;
          const replacedHTML = replacePlaceholders(originalHTML, selectedPersonData);
          blockEl.innerHTML = replacedHTML;
        });
        canvasCopy.querySelectorAll('[class*="read-only-block"]').forEach(blockEl => {
          const originalHTML = blockEl.innerHTML;
          const replacedHTML = replacePlaceholders(originalHTML, selectedPersonData);
          blockEl.innerHTML = replacedHTML;
        });
      }

      const options = {
        margin: 10,
        filename: `recibo_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
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

  // Agregar nuevo bloque
  const handleAddBlock = () => {
    const newBlock = {
      id: uuidv4(),
      x: (reciboUnoSize?.x || 10) + 10,
      y: (reciboUnoSize?.y || 10) + 10,
      width: 100,
      height: 50,
      contenido: '<p>Nuevo bloque</p>'
    };

    const bloques = [...(currentTemplate.bloques || []), newBlock];
    updateTemplate({ bloques, isDirty: true });
    setSelectedBlockId(newBlock.id);
  };

  // Actualizar bloque
  const handleUpdateBlock = (updatedBlock) => {
    const bloques = (currentTemplate.bloques || []).map(b =>
      b.id === updatedBlock.id ? updatedBlock : b
    );
    updateTemplate({ bloques, isDirty: true });
  };

  // Eliminar bloque
  const handleDeleteBlock = (blockId) => {
    const bloques = (currentTemplate.bloques || []).filter(b => b.id !== blockId);
    updateTemplate({ bloques, isDirty: true });
    setSelectedBlockId(null);
  };

  // Activar edición de bloque
  const handleBlockDoubleClick = (blockId, content) => {
    if (editingBlockId && editingBlockId !== blockId) {
      setPendingBlocks(prev => ({
        ...prev,
        [editingBlockId]: editingContent
      }));
    }

    setEditingBlockId(blockId);
    setEditingContent(content);
  };

  // Desactivar edición de bloque
  const handleBlockClickOutside = () => {
    if (editingBlockId) {
      setPendingBlocks(prev => ({
        ...prev,
        [editingBlockId]: editingContent
      }));
    }

    setEditingBlockId(null);
    setEditingContent('');
  };

  // Actualizar contenido desde barra Quill
  const handleToolbarChange = (content) => {
    setEditingContent(content);
  };

  // Buscar Planes
  const handleSearchPlanes = async (searchTerm) => {
    setPlanSearchInput(searchTerm);

    if (searchTerm.trim().length < 2) {
      setPlanSearchResults([]);
      return;
    }

    const results = await planesService.searchPlanes(searchTerm, 10);
    setPlanSearchResults(results);
    if (results.length > 0) {
      setPlanSearchOpen(true);
    }
  };

  // Seleccionar Plan
  const handleSelectPlan = async (planId) => {
    setSelectedPlanId(planId);
    setPlanSearchOpen(false);

    const planDetail = await planesService.getPlanDetail(planId);
    if (planDetail) {
      setSelectedPlanData(planDetail);
    }
  };

  // Guardar bloque actual
  const handleSaveBlock = () => {
    if (editingBlockId) {
      // Actualizar el bloque en tiempo real
      const updatedBloque = (currentTemplate.bloques || []).find(b => b.id === editingBlockId);
      if (updatedBloque) {
        handleUpdateBlock({ ...updatedBloque, contenido: editingContent });
      }

      // Guardar en pendingBlocks
      setPendingBlocks(prev => ({
        ...prev,
        [editingBlockId]: editingContent
      }));

      // Desactivar edición
      setEditingBlockId(null);
      setEditingContent('');
    }
  };

  /**
   * Renderiza bloques read-only para todos los recibos excepto el primero
   */
  const renderBlockPreviews = () => {
    if (!reciboPositions || !reciboPositions.recibos || reciboPositions.recibos.length <= 1) {
      return null;
    }

    const bloques = currentTemplate.bloques || [];
    const recibos = reciboPositions.recibos;

    return recibos.slice(1).map((recibo, index) => (
      <div
        key={`recibo-${recibo.number}`}
        style={{
          position: 'absolute',
          left: `${recibo.x * 3.7795}px`,
          top: `${recibo.y * 3.7795}px`,
          width: `${recibo.width * 3.7795}px`,
          height: `${recibo.height * 3.7795}px`,
          border: '2px solid #4dabf7',
          borderRadius: '2px',
          overflow: 'visible',
          backgroundColor: 'white'
        }}
        className="preview-recibo"
      >
        {/* Número del recibo */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            fontSize: '10px',
            color: '#4dabf7',
            fontWeight: 'bold',
            zIndex: 5
          }}
        >
          {recibo.number}
        </div>

        {/* Bloques read-only */}
        {bloques.map(block => (
          <ReadOnlyBlockPreview
            key={block.id}
            block={block}
            reciboSize={recibo}
            reciboUnoSize={reciboUnoSize}
            personData={selectedPersonData}
          />
        ))}
      </div>
    ));
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

        {/* Dropdown Búsqueda de Personas */}
        <div className="person-selector" style={{ position: 'relative', minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Buscar Persona..."
            value={personSearchInput}
            onChange={(e) => handleSearchPersonas(e.target.value)}
            onFocus={() => personSearchInput && setPersonSearchOpen(true)}
            className="person-search-input"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          {selectedPersonData && (
            <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
              ✓ {selectedPersonData.nombre} {selectedPersonData.apellido}
            </small>
          )}
          {personSearchOpen && personSearchResults.length > 0 && (
            <div
              className="person-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '200px',
                overflowY: 'auto',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                zIndex: 1000,
                marginTop: '4px'
              }}
            >
              {personSearchResults.map(person => (
                <div
                  key={person.id}
                  onClick={() => handleSelectPersona(person.id)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  {person.nombre} {person.apellido} ({person.numero_documento})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Barra de edición Quill - PARTE SUPERIOR */}
      {currentTemplate.bloque_pageconfig && (
        <div className="editor-toolbar-container">
          <div className="editor-toolbar">
            <ReactQuill
              value={editingContent}
              onChange={handleToolbarChange}
              readOnly={editingBlockId === null}
              theme="snow"
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'size': ['small', false, 'large', 'huge'] }],
                  ['link', 'image']
                ]
              }}
              style={{
                opacity: editingBlockId === null ? 0.5 : 1,
                pointerEvents: editingBlockId === null ? 'none' : 'auto'
              }}
            />
          </div>
          {editingBlockId && (
            <button
              className="btn btn-save-block"
              onClick={handleSaveBlock}
              title="Guardar cambios del bloque"
            >
              💾 Guardar Bloque
            </button>
          )}
        </div>
      )}

      <div className="editor-container-new">
        {/* Canvas A4 */}
        <div className="editor-canvas">
          <div className="a4-page" ref={canvasRef}>
            {/* Guías visuales */}
            {currentTemplate.bloque_pageconfig && (
              <PageGuides pageConfig={currentTemplate.bloque_pageconfig} />
            )}

            {/* Bloques genéricos - Recibo 1 (editable) */}
            {(currentTemplate.bloques || []).map(block => (
              <GenericBlock
                key={block.id}
                block={block}
                reciboSize={reciboUnoSize}
                isSelected={selectedBlockId === block.id}
                isEditing={editingBlockId === block.id}
                onSelect={() => setSelectedBlockId(block.id)}
                onDoubleClick={handleBlockDoubleClick}
                onClickOutside={handleBlockClickOutside}
                onUpdate={handleUpdateBlock}
                onDelete={() => handleDeleteBlock(block.id)}
                personData={selectedPersonData}
              />
            ))}

            {/* Previsualizaciones de bloques en otros recibos */}
            {renderBlockPreviews()}

            {(!currentTemplate.bloques || currentTemplate.bloques.length === 0) && (
              <div className="a4-empty-state">
                <p>📋 No hay bloques. Usa el botón "+ Agregar Bloque" para comenzar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="editor-properties">
          <h3>Configuración</h3>
          <div className="blocks-editor">
            <div className="add-blocks-section">
              <button className="btn btn-block-add" onClick={handleAddBlock}>
                + Agregar Bloque
              </button>
              <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                {(currentTemplate.bloques || []).length} bloque(s) creado(s)
              </small>
            </div>

            <div className="pageconfig-section">
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

      {/* Placeholders panel */}
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
