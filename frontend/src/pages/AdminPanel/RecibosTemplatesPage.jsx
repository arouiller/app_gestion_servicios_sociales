import React, { useState, useEffect } from 'react';
import templateService from '../../services/templateService';
import useTemplateStore from '../../hooks/useTemplateStore';
import TemplatesList from './components/TemplatesList';
import TemplateEditor from './components/TemplateEditor';
import './RecibosTemplatesPage.scss';

const RecibosTemplatesPage = () => {
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const templates = useTemplateStore((state) => state.templates);
  const setTemplates = useTemplateStore((state) => state.setTemplates);
  const setCurrentTemplate = useTemplateStore((state) => state.setCurrentTemplate);
  const resetTemplate = useTemplateStore((state) => state.resetTemplate);

  // Cargar templates al montar
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    const result = await templateService.getTemplates();
    if (result.success) {
      setTemplates(result.data || []);
    } else {
      setError(result.message || 'Error cargando templates');
    }
    setLoading(false);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      setError('El nombre del template es obligatorio');
      return;
    }

    const result = await templateService.createTemplate({
      nombre: newTemplateName,
      descripcion: newTemplateDesc,
      bloque_pageconfig: {
        tamaño: 'A4',
        personalizado_ancho_mm: null,
        personalizado_alto_mm: null,
        orientacion: 'portrait',
        margen_superior_mm: 10,
        margen_derecho_mm: 10,
        margen_inferior_mm: 10,
        margen_izquierdo_mm: 10,
        recibos_por_pagina: 1,
        layout: 'vertical',
        columnas_grilla: 1,
        gap_vertical_mm: 5,
        gap_horizontal_mm: 5
      }
    });

    if (result.success) {
      setSuccessMessage('Template creado exitosamente');
      setShowCreateModal(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      await loadTemplates();
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(result.message || 'Error creando template');
    }
  };

  const handleEditTemplate = (template) => {
    setCurrentTemplate(template);
    setView('edit');
  };

  const handleBackToList = () => {
    resetTemplate();
    setView('list');
    loadTemplates();
  };

  if (loading) {
    return (
      <div className="recibos-templates-page loading">
        <div className="spinner">Cargando templates...</div>
      </div>
    );
  }

  return (
    <div className="recibos-templates-page">
      {view === 'list' && (
        <>
          <div className="page-header">
            <h1>📋 Templates de Recibos</h1>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                + Nuevo Template
              </button>
              <button className="btn btn-secondary" onClick={loadTemplates}>
                🔄 Actualizar
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <TemplatesList
            templates={templates}
            onEdit={handleEditTemplate}
            onRefresh={loadTemplates}
          />

          {showCreateModal && (
            <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Crear Nuevo Template</h2>
                <input
                  type="text"
                  placeholder="Nombre del template *"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="input"
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="textarea"
                  rows="3"
                />
                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateTemplate}
                  >
                    Crear
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'edit' && (
        <TemplateEditor onBack={handleBackToList} />
      )}
    </div>
  );
};

export default RecibosTemplatesPage;
