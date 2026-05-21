import React from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const InlineEditor = () => {
  const { grid, updateCell } = useReciboDesignerStore();

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Editor de Celdas</h3>
      <table className="recibo-designer__editor-table">
        <thead>
          <tr>
            <th>Fila</th>
            <th>Columna</th>
            <th>Contenido</th>
            <th>Colspan</th>
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rowIdx) =>
            row.cells.map((cell, cellIdx) => (
              <tr key={`${rowIdx}-${cellIdx}`}>
                <td>{rowIdx + 1}</td>
                <td>{cellIdx + 1}</td>
                <td>
                  <input
                    type="text"
                    value={cell.content}
                    onChange={(e) =>
                      updateCell(rowIdx, cellIdx, e.target.value, cell.colspan)
                    }
                    placeholder="Texto o {{placeholder}}"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={cell.colspan}
                    onChange={(e) =>
                      updateCell(rowIdx, cellIdx, cell.content, e.target.value)
                    }
                    min="1"
                    max="10"
                    style={{ width: '50px' }}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
