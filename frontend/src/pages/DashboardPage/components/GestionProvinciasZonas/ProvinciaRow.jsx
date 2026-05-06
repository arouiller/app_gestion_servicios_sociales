import React from 'react';

const ProvinciaRow = ({
  provincia,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddZona,
  onEditZona,
  onDeleteZona
}) => {
  const zonas = provincia.zonas || [];

  return (
    <>
      <div className="provincia-row">
        <div className="provincia-content">
          <button
            className="expand-button"
            onClick={onToggleExpand}
            title={isExpanded ? 'Contraer' : 'Expandir'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <div className="provincia-info">
            <h3>{provincia.nombre}</h3>
            <span className="codigo">{provincia.codigo}</span>
            {!provincia.activo && <span className="badge inactive">Inactivo</span>}
          </div>
        </div>
        <div className="provincia-actions">
          <button className="btn-icon edit" onClick={onEdit} title="Editar">✎</button>
          <button className="btn-icon delete" onClick={onDelete} title="Eliminar">🗑</button>
          <button className="btn-icon add-zona" onClick={onAddZona} title="Agregar zona">+</button>
        </div>
      </div>

      {isExpanded && (
        <div className="zonas-list">
          {zonas.length === 0 ? (
            <p className="empty-zonas">Sin zonas registradas</p>
          ) : (
            zonas.map(zona => (
              <div key={zona.id} className="zona-row">
                <div className="zona-content">
                  <div className="zona-info">
                    <span className="nombre">{zona.nombre}</span>
                    <span className="codigo">{zona.codigo}</span>
                    {!zona.activo && <span className="badge inactive">Inactivo</span>}
                  </div>
                </div>
                <div className="zona-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => onEditZona(zona)}
                    title="Editar"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => onDeleteZona(zona)}
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default ProvinciaRow;
