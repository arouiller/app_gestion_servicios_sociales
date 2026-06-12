import React, { useState } from 'react';
import useTemplateStore from '../../../../hooks/useTemplateStore';

const BloqueDetalles = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateBloque = useTemplateStore((state) => state.updateBloque);

  const handleEdit = () => {
    setEditData(currentTemplate.bloque_detalles || { preset: 'simple', filas: [] });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateBloque('bloque_detalles', editData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    updateBloque('bloque_detalles', null);
    setIsEditing(false);
  };

  const addFila = () => {
    const newData = {
      ...editData,
      filas: [...(editData.filas || []), { etiqueta: '', placeholder: '' }]
    };
    setEditData(newData);
  };

  const updateFila = (index, field, value) => {
    const filas = [...(editData.filas || [])];
    filas[index] = { ...filas[index], [field]: value };
    setEditData({ ...editData, filas });
  };

  const removeFila = (index) => {
    const filas = (editData.filas || []).filter((_, i) => i !== index);
    setEditData({ ...editData, filas });
  };

  return (
    <div className="bloque-wrapper">
      <div className="bloque-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="bloque-title">
          {isExpanded ? '▼' : '▶'} Bloque 3: Detalles
        </span>
        {!isEditing && (
          <div className="bloque-actions">
            <button className="btn-sm" onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}>
              Editar
            </button>
            {currentTemplate.bloque_detalles && (
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
          {currentTemplate.bloque_detalles?.filas?.length > 0 ? (
            <p>Tabla con {currentTemplate.bloque_detalles.filas.length} filas</p>
          ) : (
            <p className="text-muted">No configurado</p>
          )}
        </div>
      )}

      {isEditing && (
        <div className="bloque-editor">
          <div>
            <label>Preset:</label>
            <select
              value={editData.preset || 'simple'}
              onChange={(e) => setEditData({ ...editData, preset: e.target.value })}
              className="input"
            >
              <option value="simple">Simple (Cuota, Total)</option>
              <option value="detallado">Detallado (Cuota, Arancel, Total)</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <h4>Filas de Detalles</h4>
          {(editData.filas || []).map((fila, idx) => (
            <div key={idx} className="fila-editor">
              <input
                type="text"
                placeholder="Etiqueta"
                value={fila.etiqueta}
                onChange={(e) => updateFila(idx, 'etiqueta', e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Placeholder"
                value={fila.placeholder}
                onChange={(e) => updateFila(idx, 'placeholder', e.target.value)}
                className="input"
              />
              <button className="btn-sm btn-danger" onClick={() => removeFila(idx)}>
                Eliminar
              </button>
            </div>
          ))}

          <button className="btn btn-secondary btn-sm" onClick={addFila}>
            + Agregar Fila
          </button>

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

export default BloqueDetalles;
