import React, { useState } from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';
import { reciboDesignerService } from '../../services/reciboDesignerService';

export const SaveActions = () => {
  const {
    grid,
    pageConfig,
    currentTemplate,
    generateHTML,
    setSaving,
    isSaving,
    error,
    setError,
    loadTemplate,
  } = useReciboDesignerStore();

  const [showVersionModal, setShowVersionModal] = useState(false);

  const handleSave = async (saveMode) => {
    if (!currentTemplate) {
      setError('No hay template cargado');
      return;
    }

    if (grid.length === 0 || !grid.some((row) => row.cells.some((cell) => cell.content))) {
      setError('La tabla no puede estar vacía');
      return;
    }

    setSaving(true);
    try {
      const html = generateHTML();
      const response = await reciboDesignerService.saveTemplate({
        id: currentTemplate.id,
        html,
        pageSize: pageConfig.size,
        orientation: pageConfig.orientation,
        margins: pageConfig.margins,
        saveMode,
      });

      if (response.success) {
        loadTemplate(response.template);
        setError(null);
        alert(response.message);
      } else {
        setError('Error al guardar template');
      }
    } catch (err) {
      setError(
        err.response?.data?.details?.[0] || 'Error al guardar template'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const html = generateHTML();
    const element = document.createElement('a');
    const file = new Blob([html], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `recibo_template_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = async () => {
    const html = generateHTML();
    try {
      await navigator.clipboard.writeText(html);
      alert('HTML copiado al portapapeles');
    } catch {
      alert('Error al copiar');
    }
  };

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Acciones</h3>
      {error && <div className="recibo-designer__error">{error}</div>}
      <div className="recibo-designer__controls" style={{ flexDirection: 'column' }}>
        <button
          className="recibo-designer__button"
          onClick={() => handleSave('overwrite')}
          disabled={isSaving}
          style={{ width: '100%' }}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--secondary"
          onClick={() => setShowVersionModal(true)}
          style={{ width: '100%' }}
        >
          Guardar como nueva versión
        </button>
        <button
          className="recibo-designer__button"
          onClick={handleExport}
          style={{ width: '100%' }}
        >
          Exportar HTML
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--secondary"
          onClick={handleCopyToClipboard}
          style={{ width: '100%' }}
        >
          Copiar al portapapeles
        </button>
      </div>

      {showVersionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <h3>Guardar como nueva versión</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              Se creará una nueva versión de este template y se establecerá como activa.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="recibo-designer__button recibo-designer__button--secondary"
                onClick={() => setShowVersionModal(false)}
              >
                Cancelar
              </button>
              <button
                className="recibo-designer__button"
                onClick={() => {
                  handleSave('new_version');
                  setShowVersionModal(false);
                }}
              >
                Crear versión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
