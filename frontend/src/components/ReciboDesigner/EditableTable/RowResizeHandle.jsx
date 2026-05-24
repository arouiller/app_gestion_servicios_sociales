import React from 'react';

export const RowResizeHandle = ({ rowIndex, numCols, onMouseDown }) => {
  return (
    <tr style={{ height: 4 }}>
      <td
        colSpan={numCols}
        style={{
          padding: 0,
          height: 4,
          cursor: 'row-resize',
          position: 'relative',
          backgroundColor: 'transparent',
          border: 'none',
        }}
      >
        <div
          className="row-resize-handle"
          onMouseDown={(e) => onMouseDown(e, rowIndex)}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'row-resize',
            userSelect: 'none',
          }}
          title="Arrastra para cambiar alto de fila"
        />
      </td>
    </tr>
  );
};
