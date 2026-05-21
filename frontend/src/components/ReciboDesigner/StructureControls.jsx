import React from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const StructureControls = () => {
  const { grid, addRow, deleteRow, addColumn, deleteColumn, clearGrid } =
    useReciboDesignerStore();

  const handleDeleteRow = () => {
    if (window.confirm('¿Eliminar última fila?')) {
      deleteRow();
    }
  };

  const handleDeleteColumn = () => {
    if (window.confirm('¿Eliminar última columna?')) {
      deleteColumn();
    }
  };

  const handleClearGrid = () => {
    if (window.confirm('¿Limpiar tabla? Esta acción no se puede deshacer.')) {
      clearGrid();
    }
  };

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Estructura</h3>
      <div className="recibo-designer__controls">
        <button className="recibo-designer__button" onClick={addRow}>
          + Fila
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--danger"
          onClick={handleDeleteRow}
          disabled={grid.length <= 1}
        >
          - Fila
        </button>
        <button className="recibo-designer__button" onClick={addColumn}>
          + Columna
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--danger"
          onClick={handleDeleteColumn}
          disabled={grid[0]?.cells.length <= 1}
        >
          - Columna
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--danger"
          onClick={handleClearGrid}
        >
          Limpiar
        </button>
      </div>
    </div>
  );
};
