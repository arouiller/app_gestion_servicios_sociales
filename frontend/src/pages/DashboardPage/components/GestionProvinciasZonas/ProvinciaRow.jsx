import React from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import IconButton from '../../../../components/IconButton/IconButton';

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
          <ActionButton
            variant="icon"
            icon="✎"
            title="Editar"
            onClick={onEdit}
          />
          <IconButton
            icon="delete"
            title="Eliminar"
            onClick={onDelete}
            className="icon-button--danger"
          />
          <ActionButton
            variant="icon"
            icon="+"
            title="Agregar localidad"
            onClick={onNewLocalidad}
          />
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
                <ActionButton
                  variant="icon"
                  icon="✎"
                  title="Editar"
                  onClick={() => onEditLocalidad(localidad)}
                />
                <IconButton
                  icon="delete"
                  title="Eliminar"
                  onClick={() => onDeleteLocalidad(localidad.id)}
                  className="icon-button--danger"
                />
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
