import React from 'react';

export const ColResizeHandle = ({ colIndex, onMouseDown, tableRef }) => {
  return (
    <div
      className="col-resize-handle"
      onMouseDown={(e) => onMouseDown(e, colIndex)}
      style={{
        position: 'absolute',
        top: 0,
        right: -2,
        width: 4,
        height: '100%',
        cursor: 'col-resize',
        zIndex: 10,
        userSelect: 'none',
      }}
      title="Arrastra para cambiar ancho de columna"
    />
  );
};
