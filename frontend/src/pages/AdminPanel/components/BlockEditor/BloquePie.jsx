import React, { useState } from 'react';
import useTemplateStore from '../../../../hooks/useTemplateStore';

const BloquePie = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateBloque = useTemplateStore((state) => state.updateBloque);

  const handleEdit = () => {
    setEditData(currentTemplate.bloque_pie || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    updateBloque('bloque_pie', editData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    updateBloque('bloque_pie', null);
    setIsEditing(false);
  };

  return (
    <div className="bloque-wrapper">
      <div className="bloque-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="bloque-title">
          {isExpanded ? '▼' : '▶'} Bloque 4: Pie de Página
        </span>
        {!isEditing && (
          <div className="bloque-actions">
            <button className="btn-sm" onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}>
              Editar
            </button>
            {currentTemplate.bloque_pie && (
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
          {currentTemplate.bloque_pie ? (
            <div>
              {currentTemplate.bloque_pie.aclaracion && (
                <p><strong>Aclaración:</strong> {currentTemplate.bloque_pie.aclaracion.substring(0, 50)}...</p>
              )}
              {currentTemplate.bloque_pie.mostrar_linea_firma && (
                <p><strong>Línea de firma:</strong> Habilitada</p>
              )}
            </div>
          ) : (
            <p className="text-muted">No configurado</p>
          )}
        </div>
      )}

      {isEditing && (
        <div className="bloque-editor">
          <textarea
            placeholder="Aclaración"
            value={editData.aclaracion || ''}
            onChange={(e) => setEditData({ ...editData, aclaración: e.target.value })}
            className="textarea"
            rows="3"
          />
          <textarea
            placeholder="Texto legal"
            value={editData.texto_legal || ''}
            onChange={(e) => setEditData({ ...editData, texto_legal: e.target.value })}
            className="textarea"
            rows="2"
          />
          <label>
            <input
              type="checkbox"
              checked={editData.mostrar_linea_firma || false}
              onChange={(e) => setEditData({ ...editData, mostrar_linea_firma: e.target.checked })}
            />
            Mostrar línea de firma
          </label>
          <input
            type="text"
            placeholder="Referencia"
            value={editData.referencia || ''}
            onChange={(e) => setEditData({ ...editData, referencia: e.target.value })}
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

export default BloquePie;
