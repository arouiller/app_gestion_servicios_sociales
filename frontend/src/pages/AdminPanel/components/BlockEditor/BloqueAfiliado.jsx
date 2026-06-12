import React, { useState } from 'react';
import useTemplateStore from '../../../../hooks/useTemplateStore';

const BloqueAfiliado = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateBloque = useTemplateStore((state) => state.updateBloque);

  const handleEdit = () => {
    setEditData(currentTemplate.bloque_afiliado || { filas: [] });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateBloque('bloque_afiliado', editData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    updateBloque('bloque_afiliado', null);
    setIsEditing(false);
  };

  const addFila = () => {
    const newData = { ...editData, filas: [...(editData.filas || []), { etiqueta: '', placeholder: '', visible: true }] };
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
          {isExpanded ? '▼' : '▶'} Bloque 2: Datos del Afiliado
        </span>
        {!isEditing && (
          <div className="bloque-actions">
            <button className="btn-sm" onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}>
              Editar
            </button>
            {currentTemplate.bloque_afiliado && (
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
          {currentTemplate.bloque_afiliado?.filas?.length > 0 ? (
            <ul>
              {currentTemplate.bloque_afiliado.filas.slice(0, 3).map((fila, idx) => (
                <li key={idx}>{fila.etiqueta} ({fila.placeholder})</li>
              ))}
              {currentTemplate.bloque_afiliado.filas.length > 3 && (
                <li>... y {currentTemplate.bloque_afiliado.filas.length - 3} más</li>
              )}
            </ul>
          ) : (
            <p className="text-muted">No configurado</p>
          )}
        </div>
      )}

      {isEditing && (
        <div className="bloque-editor">
          <h4>Filas del Afiliado</h4>
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
                placeholder="Placeholder (ej: {{numero_afiliado}})"
                value={fila.placeholder}
                onChange={(e) => updateFila(idx, 'placeholder', e.target.value)}
                className="input"
              />
              <label>
                <input
                  type="checkbox"
                  checked={fila.visible !== false}
                  onChange={(e) => updateFila(idx, 'visible', e.target.checked)}
                />
                Visible
              </label>
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

export default BloqueAfiliado;
