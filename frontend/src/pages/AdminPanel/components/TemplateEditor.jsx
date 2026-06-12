import React, { useState, useEffect } from 'react';
import templateService from '../../../services/templateService';
import useTemplateStore from '../../../hooks/useTemplateStore';
import TemplatePreview from './TemplatePreview';
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

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const isDirty = useTemplateStore((state) => state.isDirty);
  const isSaving = useTemplateStore((state) => state.isSaving);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const setIsSaving = useTemplateStore((state) => state.setIsSaving);
  const resetTemplate = useTemplateStore((state) => state.resetTemplate);

  // Cargar placeholders disponibles
  useEffect(() => {
    const loadPlaceholders = async () => {
      const result = await templateService.getPlaceholders();
      if (result.success) {
        setPlaceholders(result.placeholders);
      }
    };
    loadPlaceholders();
  }, []);

  const handleSave = async () => {
    // Validación: Bloque 5 obligatorio
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

  const handleGeneratePdf = async () => {
    if (!currentTemplate.bloque_pageconfig) {
      setError('Bloque 5 es obligatorio para generar PDF');
      return;
    }

    if (isDirty) {
      // Modal: Guardar, Generar solo, Cancelar
      setPendingAction('pdf');
      setShowConfirmModal(true);
      return;
    }

    await generatePdf();
  };

  const generatePdf = async () => {
    setLoading(true);
    const result = await templateService.generatePdf(currentTemplate.id, null, true);

    if (result.success) {
      const url = window.URL.createObjectURL(new Blob([result.blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recibo_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } else {
      setError(result.message || 'Error generando PDF');
    }

    setLoading(false);
  };

  const handleConfirmAction = async () => {
    if (pendingAction === 'cancel') {
      resetTemplate();
      onBack();
    } else if (pendingAction === 'pdf') {
      // Opción: Guardar primero
      await handleSave();
      await generatePdf();
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  return (
    <div className="template-editor">
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

      <div className="editor-container">
        {/* Panel izquierdo: Bloques */}
        <div className="editor-left">
          <div className="blocks-panel">
            <BloqueEncabezado />
            <BloqueAfiliado />
            <BloqueDetalles />
            <BloquePie />
            <BloquePageConfig />
          </div>
        </div>

        {/* Panel derecho: Preview */}
        <div className="editor-right">
          <TemplatePreview />
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
          onClick={handleGeneratePdf}
          disabled={loading}
        >
          📄 Ver PDF
        </button>
        <button
          className="btn btn-download"
          onClick={handleGeneratePdf}
          disabled={loading}
        >
          ⬇️ Descargar PDF
        </button>
      </div>

      {/* Panel de placeholders disponibles */}
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
              {pendingAction === 'pdf' && (
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
                      generatePdf();
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
