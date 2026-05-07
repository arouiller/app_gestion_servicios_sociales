import React from 'react';

const ProvinciaRow = ({
  provincia,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onNewLocalidad,
  onEditLocalidad,
  onDeleteLocalidad
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
          <button className="btn-icon btn-success" onClick={onNewLocalidad} title="Agregar localidad">
            +
          </button>
        </div>
      </div>

      {expanded && provincia.localidades && provincia.localidades.length > 0 && (
        <div className="localidades-list">
          {provincia.localidades.map(localidad => (
            <div key={localidad.id} className="localidad-row">
              <span className="localidad-info">
                {localidad.nombre} <span className="codigo">({localidad.codigo})</span>
              </span>
              <div className="localidad-actions">
                <button className="btn-icon" onClick={() => onEditLocalidad(localidad)} title="Editar">
                  ✎
                </button>
                <button className="btn-icon btn-danger" onClick={() => onDeleteLocalidad(localidad.id)} title="Eliminar">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && (!provincia.localidades || provincia.localidades.length === 0) && (
        <div className="localidades-list">
          <div className="empty-localidades">Sin localidades</div>
        </div>
      )}
    </div>
  );
};

export default ProvinciaRow;
