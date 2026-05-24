import React from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

const StructureButton = ({ label, description, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '10px 12px',
      marginBottom: '8px',
      textAlign: 'left',
      fontSize: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '3px',
      backgroundColor: 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = '#f3f4f6';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = 'white';
      }
    }}
  >
    <div style={{
      fontWeight: 600,
      color: '#1f2937',
      marginBottom: '2px',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '11px',
      color: '#64748b',
    }}>
      {description}
    </div>
  </button>
);

const ControlGroup = ({ label, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{
      fontSize: '11px',
      fontWeight: 600,
      marginBottom: '8px',
      color: '#1f2937',
      paddingBottom: '6px',
      borderBottom: '1px solid #e5e7eb',
    }}>
      {label}
    </div>
    {children}
  </div>
);

export const TableStructurePanel = () => {
  const {
    activeCellPos,
    selection,
    table,
    addRowBefore,
    addRowAfter,
    deleteRow,
    addColumnBefore,
    addColumnAfter,
    deleteColumn,
    mergeCells,
    splitCell,
  } = useReciboDesignerStore();

  const getCanDeleteRow = () => table.rows.length > 1;
  const getCanDeleteCol = () => (table.rows[0]?.cells.length ?? 0) > 1;

  const canMerge = selection.anchor && selection.focus;
  const canSplit = activeCellPos &&
    (table.rows[activeCellPos.row]?.cells[activeCellPos.col]?.rowspan > 1 ||
    table.rows[activeCellPos.row]?.cells[activeCellPos.col]?.colspan > 1);

  const handleMerge = () => {
    if (!selection.anchor || !selection.focus) return;
    const r1 = Math.min(selection.anchor.row, selection.focus.row);
    const r2 = Math.max(selection.anchor.row, selection.focus.row);
    const c1 = Math.min(selection.anchor.col, selection.focus.col);
    const c2 = Math.max(selection.anchor.col, selection.focus.col);
    mergeCells(r1, c1, r2, c2);
  };

  return (
    <div>
      <ControlGroup label="Filas">
        <StructureButton
          label="Agregar fila arriba"
          description="Inserta una nueva fila antes de la actual"
          onClick={() => activeCellPos && addRowBefore(activeCellPos.row)}
          disabled={!activeCellPos}
        />
        <StructureButton
          label="Agregar fila abajo"
          description="Inserta una nueva fila después de la actual"
          onClick={() => activeCellPos && addRowAfter(activeCellPos.row)}
          disabled={!activeCellPos}
        />
        <StructureButton
          label="Eliminar fila"
          description="Elimina la fila actual"
          onClick={() => activeCellPos && deleteRow(activeCellPos.row)}
          disabled={!activeCellPos || !getCanDeleteRow()}
        />
      </ControlGroup>

      <ControlGroup label="Columnas">
        <StructureButton
          label="Agregar columna izquierda"
          description="Inserta una nueva columna a la izquierda"
          onClick={() => activeCellPos && addColumnBefore(activeCellPos.col)}
          disabled={!activeCellPos}
        />
        <StructureButton
          label="Agregar columna derecha"
          description="Inserta una nueva columna a la derecha"
          onClick={() => activeCellPos && addColumnAfter(activeCellPos.col)}
          disabled={!activeCellPos}
        />
        <StructureButton
          label="Eliminar columna"
          description="Elimina la columna actual"
          onClick={() => activeCellPos && deleteColumn(activeCellPos.col)}
          disabled={!activeCellPos || !getCanDeleteCol()}
        />
      </ControlGroup>

      <ControlGroup label="Fusionar y Dividir">
        <StructureButton
          label="Fusionar celdas"
          description="Combina las celdas seleccionadas"
          onClick={handleMerge}
          disabled={!canMerge}
        />
        <StructureButton
          label="Dividir celda"
          description="Revierte la fusión de celdas"
          onClick={() => activeCellPos && splitCell(activeCellPos.row, activeCellPos.col)}
          disabled={!canSplit}
        />
      </ControlGroup>
    </div>
  );
};
