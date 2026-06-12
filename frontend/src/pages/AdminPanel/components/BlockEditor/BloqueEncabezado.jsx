import React, { useState } from 'react';
import useTemplateStore from '../../../../hooks/useTemplateStore';

const BloqueEncabezado = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateBloque = useTemplateStore((state) => state.updateBloque);

  const handleEdit = () => {
    setEditData(currentTemplate.bloque_encabezado || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    updateBloque('bloque_encabezado', editData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    updateBloque('bloque_encabezado', null);
    setIsEditing(false);
  };

  return (
    <div className="bloque-wrapper">
      <div className="bloque-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="bloque-title">
          {isExpanded ? '▼' : '▶'} Bloque 1: Encabezado
        </span>
        {!isEditing && (
          <div className="bloque-actions">
            <button className="btn-sm" onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}>
              Editar
            </button>
            {currentTemplate.bloque_encabezado && (
              <button className="btn-sm btn-danger" onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}>
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      {isExpanded && !isEditing && (
        <div className="bloque-preview">
          {currentTemplate.bloque_encabezado ? (
            <div>
              <p><strong>Empresa:</strong> {currentTemplate.bloque_encabezado.empresa_nombre || '(no configurado)'}</p>
              <p><strong>Dirección:</strong> {currentTemplate.bloque_encabezado.empresa_direccion || '(no configurado)'}</p>
            </div>
          ) : (
            <p className="text-muted">No configurado</p>
          )}
        </div>
      )}

      {isEditing && (
        <div className="bloque-editor">
          <input
            type="text"
            placeholder="Nombre de la empresa"
            value={editData.empresa_nombre || ''}
            onChange={(e) => setEditData({ ...editData, empresa_nombre: e.target.value })}
            className="input"
          />
          <input
            type="text"
            placeholder="Dirección"
            value={editData.empresa_direccion || ''}
            onChange={(e) => setEditData({ ...editData, empresa_direccion: e.target.value })}
            className="input"
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={editData.empresa_telefono || ''}
            onChange={(e) => setEditData({ ...editData, empresa_telefono: e.target.value })}
            className="input"
          />
          <input
            type="email"
            placeholder="Email"
            value={editData.empresa_email || ''}
            onChange={(e) => setEditData({ ...editData, empresa_email: e.target.value })}
            className="input"
          />
          <input
            type="text"
            placeholder="Sitio web"
            value={editData.empresa_sitio || ''}
            onChange={(e) => setEditData({ ...editData, empresa_sitio: e.target.value })}
            className="input"
          />
          <input
            type="text"
            placeholder="URL del logo"
            value={editData.logo_url || ''}
            onChange={(e) => setEditData({ ...editData, logo_url: e.target.value })}
            className="input"
          />
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloqueEncabezado;
