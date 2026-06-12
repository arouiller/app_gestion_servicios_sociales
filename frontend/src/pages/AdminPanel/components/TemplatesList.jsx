import React, { useState } from 'react';
import templateService from '../../../services/templateService';
import '../RecibosTemplatesPage.scss';

const TemplatesList = ({ templates, onEdit, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleActivate = async (templateId) => {
    if (window.confirm('¿Activar este template? El anterior será desactivado.')) {
      setLoading(true);
      const result = await templateService.activateTemplate(templateId);
      if (result.success) {
        setSuccessMsg('Template activado');
        setTimeout(() => setSuccessMsg(null), 2000);
        onRefresh();
      } else {
        setError(result.message);
      }
      setLoading(false);
    }
  };

  const handleDuplicate = async (templateId) => {
    setLoading(true);
    const result = await templateService.duplicateTemplate(templateId);
    if (result.success) {
      setSuccessMsg(`Template duplicado: "${result.nombre}"`);
      setTimeout(() => setSuccessMsg(null), 2000);
      onRefresh();
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('¿Eliminar este template? Esta acción no se puede deshacer.')) {
      setLoading(true);
      const result = await templateService.deleteTemplate(templateId);
      if (result.success) {
        setSuccessMsg('Template eliminado');
        setTimeout(() => setSuccessMsg(null), 2000);
        onRefresh();
      } else {
        setError(result.message);
      }
      setLoading(false);
    }
  };

  if (!templates || templates.length === 0) {
    return (
      <div className="templates-list empty">
        <p>No hay templates aún. Crea uno para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="templates-list">
      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <table className="templates-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Creado</th>
            <th>Última Edición</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.id}>
              <td className="template-name">{template.nombre}</td>
              <td className="template-status">
                {template.activo ? (
                  <span className="badge badge-active">✓ ACTIVO</span>
                ) : (
                  <span className="badge badge-inactive">○ Inactivo</span>
                )}
              </td>
              <td className="template-date">
                <small>
                  {new Date(template.created_at).toLocaleDateString()}
                  <br />
                  {template.creador?.nombre || 'Sistema'}
                </small>
              </td>
              <td className="template-date">
                <small>{new Date(template.updated_at).toLocaleDateString()}</small>
              </td>
              <td className="template-actions">
                <button
                  className="btn-icon btn-edit"
                  onClick={() => onEdit(template)}
                  title="Editar"
                  disabled={loading}
                >
                  ✏️
                </button>
                {!template.activo && (
                  <button
                    className="btn-icon btn-activate"
                    onClick={() => handleActivate(template.id)}
                    title="Activar"
                    disabled={loading}
                  >
                    ⚡
                  </button>
                )}
                <button
                  className="btn-icon btn-duplicate"
                  onClick={() => handleDuplicate(template.id)}
                  title="Duplicar"
                  disabled={loading}
                >
                  📋
                </button>
                {!template.activo && (
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(template.id)}
                    title="Eliminar"
                    disabled={loading}
                  >
                    🗑️
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TemplatesList;
