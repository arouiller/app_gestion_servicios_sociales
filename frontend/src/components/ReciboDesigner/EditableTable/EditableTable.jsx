import React, { useRef } from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';
import { useColumnResize } from '../hooks/useColumnResize';
import { useRowResize } from '../hooks/useRowResize';
import { useTableSelection } from '../hooks/useTableSelection';
import { EditableCell } from './EditableCell';
import { ColResizeHandle } from './ColResizeHandle';
import { RowResizeHandle } from './RowResizeHandle';

export const EditableTable = () => {
  const tableRef = useRef(null);
  const table = useReciboDesignerStore((s) => s.table);
  const { onHandleMouseDown: onColResize } = useColumnResize(tableRef);
  const { onHandleMouseDown: onRowResize } = useRowResize();
  const { onCellMouseDown, onCellMouseEnter } = useTableSelection();

  const numCols = table.rows[0]?.cells.length ?? 0;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'auto',
        flex: 1,
      }}
      ref={tableRef}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '100%',
        }}
      >
        <colgroup>
          {table.columnWidths.map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
        </colgroup>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <React.Fragment key={row.id}>
              <tr style={{ height: row.height ? `${row.height}px` : undefined }}>
                {row.cells.map((cell, colIndex) =>
                  cell.hidden ? null : (
                    <EditableCell
                      key={cell.id}
                      cell={cell}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      onCellMouseDown={onCellMouseDown}
                      onCellMouseEnter={onCellMouseEnter}
                    />
                  )
                )}
              </tr>
              <RowResizeHandle
                key={`resize-${row.id}`}
                rowIndex={rowIndex}
                numCols={numCols}
                onMouseDown={onRowResize}
              />
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ColResizeHandles posicionados absolutamente */}
      {table.columnWidths.map((_, i) =>
        i < numCols - 1 ? (
          <ColResizeHandle
            key={`col-resize-${i}`}
            colIndex={i}
            onMouseDown={onColResize}
            tableRef={tableRef}
          />
        ) : null
      )}
    </div>
  );
};
