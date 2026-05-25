import React, { useState } from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

const ActionButton = ({ label, onClick, variant = 'primary', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '10px 12px',
      marginBottom: '8px',
      fontSize: '12px',
      fontWeight: 600,
      border: variant === 'primary' ? 'none' : '1px solid #d1d5db',
      borderRadius: '3px',
      backgroundColor: variant === 'primary' ? '#2563eb' : 'white',
      color: variant === 'primary' ? 'white' : '#1f2937',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.opacity = '0.9';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.opacity = '1';
      }
    }}
  >
    {label}
  </button>
);

export const SavePanel = () => {
  const {
    currentTemplate,
    table,
    pageConfig,
    generateHTML,
    isSaving,
    error,
    setSaving,
    setError,
    clearError,
  } = useReciboDesignerStore();

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionName, setVersionName] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      clearError();

      const html = generateHTML();
      const saveMode = currentTemplate?.id ? 'overwrite' : 'create';

      const response = await fetch('/api/admin/recibos/templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          id: currentTemplate?.id,
          html,
          pageSize: pageConfig.size,
          orientation: pageConfig.orientation,
          margins: JSON.stringify(pageConfig),
          saveMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el template');
      }

      const data = await response.json();
      setSaving(false);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleSaveAsVersion = async () => {
    if (!versionName.trim()) {
      setError('Ingresa un nombre para la versión');
      return;
    }

    try {
      setSaving(true);
      clearError();

      const html = generateHTML();

      const response = await fetch('/api/admin/recibos/templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          id: currentTemplate?.id,
          html,
          pageSize: pageConfig.size,
          orientation: pageConfig.orientation,
          margins: JSON.stringify(pageConfig),
          saveMode: 'new_version',
          versionName,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear nueva versión');
      }

      setShowVersionModal(false);
      setVersionName('');
      setSaving(false);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleExportHTML = () => {
    try {
      const html = generateHTML();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `recibo-${Date.now()}.html`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Error al exportar HTML');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <ActionButton
          label={isSaving ? 'Guardando...' : 'Guardar'}
          onClick={handleSave}
          variant="primary"
          disabled={isSaving}
        />

        {currentTemplate?.id && (
          <ActionButton
            label="Nueva Versión"
            onClick={() => setShowVersionModal(true)}
            variant="secondary"
            disabled={isSaving}
          />
        )}

        <ActionButton
          label="Exportar HTML"
          onClick={handleExportHTML}
          variant="secondary"
          disabled={isSaving}
        />
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#fee2e2',
          borderRadius: '3px',
          fontSize: '11px',
          color: '#991b1b',
          marginBottom: '12px',
        }}>
          {error}
        </div>
      )}

      {currentTemplate?.id && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f0fdf4',
          borderRadius: '3px',
          fontSize: '11px',
          color: '#166534',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {currentTemplate.nombre}
          </div>
          <div style={{ fontSize: '10px', color: '#4b5563' }}>
            ID: {currentTemplate.id}
          </div>
        </div>
      )}

      {showVersionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '6px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#1f2937',
            }}>
              Crear Nueva Versión
            </h3>

            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Nombre de la versión (ej: v1.1)"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowVersionModal(false);
                  setVersionName('');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  color: '#1f2937',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsVersion}
                disabled={isSaving || !versionName.trim()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  cursor: isSaving || !versionName.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSaving || !versionName.trim() ? 0.5 : 1,
                }}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
