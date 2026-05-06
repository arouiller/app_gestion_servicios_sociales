import React from 'react';

const ProvinciaRow = ({
  provincia,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onNewZona,
  onEditZona,
  onDeleteZona
}) => {
  return (
    <div className="provincia-row">
      <div className="provincia-header">
        <button className="expand-btn" onClick={onToggleExpand}>
          {expanded ? '▼' : '▶'}
        </button>
        <div className="provincia-info">
          <span className="nombre">{provincia.nombre}</span>
          <span className="codigo">({provincia.codigo})</span>
        </div>
        <div className="provincia-actions">
          <button className="btn-icon" onClick={onEdit} title="Editar">
            ✎
          </button>
          <button className="btn-icon btn-danger" onClick={onDelete} title="Eliminar">
            ✕
          </button>
          <button className="btn-icon btn-success" onClick={onNewZona} title="Agregar zona">
            +
          </button>
        </div>
      </div>

      {expanded && provincia.zonas && provincia.zonas.length > 0 && (
        <div className="zonas-list">
          {provincia.zonas.map(zona => (
            <div key={zona.id} className="zona-row">
              <span className="zona-info">
                {zona.nombre} <span className="codigo">({zona.codigo})</span>
              </span>
              <div className="zona-actions">
                <button className="btn-icon" onClick={() => onEditZona(zona)} title="Editar">
                  ✎
                </button>
                <button className="btn-icon btn-danger" onClick={() => onDeleteZona(zona.id)} title="Eliminar">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && (!provincia.zonas || provincia.zonas.length === 0) && (
        <div className="zonas-list">
          <div className="empty-zonas">Sin zonas</div>
        </div>
      )}
    </div>
  );
};

export default ProvinciaRow;
