import React from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const EditorToolbar = () => {
  const {
    addRowBefore,
    addRowAfter,
    deleteRow,
    addColumnBefore,
    addColumnAfter,
    deleteColumn,
    mergeCells,
    splitCell,
    updateCellStyle,
    activeCellPos,
    selection,
    table,
    pageConfig,
  } = useReciboDesignerStore((s) => ({
    addRowBefore: s.addRowBefore,
    addRowAfter: s.addRowAfter,
    deleteRow: s.deleteRow,
    addColumnBefore: s.addColumnBefore,
    addColumnAfter: s.addColumnAfter,
    deleteColumn: s.deleteColumn,
    mergeCells: s.mergeCells,
    splitCell: s.splitCell,
    updateCellStyle: s.updateCellStyle,
    activeCellPos: s.activeCellPos,
    selection: s.selection,
    table: s.table,
    pageConfig: s.pageConfig,
  }));

  const canMerge = selection.anchor && selection.focus;
  const canSplit = activeCellPos && (
    (table.rows[activeCellPos.row]?.cells[activeCellPos.col]?.rowspan ?? 1) > 1 ||
    (table.rows[activeCellPos.row]?.cells[activeCellPos.col]?.colspan ?? 1) > 1
  );

  const getCanDeleteRow = () => table.rows.length > 1;
  const getCanDeleteCol = () => (table.rows[0]?.cells.length ?? 0) > 1;

  const handleMerge = () => {
    if (!selection.anchor || !selection.focus) return;
    const r1 = Math.min(selection.anchor.row, selection.focus.row);
    const r2 = Math.max(selection.anchor.row, selection.focus.row);
    const c1 = Math.min(selection.anchor.col, selection.focus.col);
    const c2 = Math.max(selection.anchor.col, selection.focus.col);
    mergeCells(r1, c1, r2, c2);
  };

  const handleToggleBold = () => {
    if (!activeCellPos) return;
    const cell = table.rows[activeCellPos.row]?.cells[activeCellPos.col];
    const newWeight = cell?.style.fontWeight === 'bold' ? 'normal' : 'bold';
    updateCellStyle(activeCellPos.row, activeCellPos.col, { fontWeight: newWeight });
  };

  const handleToggleItalic = () => {
    if (!activeCellPos) return;
    const cell = table.rows[activeCellPos.row]?.cells[activeCellPos.col];
    const newStyle = cell?.style.fontStyle === 'italic' ? 'normal' : 'italic';
    updateCellStyle(activeCellPos.row, activeCellPos.col, { fontStyle: newStyle });
  };

  const handleToggleUnderline = () => {
    if (!activeCellPos) return;
    const cell = table.rows[activeCellPos.row]?.cells[activeCellPos.col];
    const dec = cell?.style.textDecoration || 'none';
    const hasUnderline = dec.includes('underline');
    const newDec = hasUnderline
      ? dec.replace('underline', '').trim() || 'none'
      : (dec === 'none' ? 'underline' : `${dec} underline`);
    updateCellStyle(activeCellPos.row, activeCellPos.col, { textDecoration: newDec });
  };

  const handleToggleStrikethrough = () => {
    if (!activeCellPos) return;
    const cell = table.rows[activeCellPos.row]?.cells[activeCellPos.col];
    const dec = cell?.style.textDecoration || 'none';
    const hasStrike = dec.includes('line-through');
    const newDec = hasStrike
      ? dec.replace('line-through', '').trim() || 'none'
      : (dec === 'none' ? 'line-through' : `${dec} line-through`);
    updateCellStyle(activeCellPos.row, activeCellPos.col, { textDecoration: newDec });
  };

  const handleAlign = (align) => {
    if (!activeCellPos) return;
    updateCellStyle(activeCellPos.row, activeCellPos.col, { textAlign: align });
  };

  const currentCell = activeCellPos ? table.rows[activeCellPos.row]?.cells[activeCellPos.col] : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        minHeight: '40px',
      }}
    >
      {/* Grupo Estructura */}
      <div style={{ display: 'flex', gap: '2px', paddingRight: '6px', borderRight: '1px solid #e2e8f0' }}>
        <ToolButton
          label="↑ Fila"
          onClick={() => activeCellPos && addRowBefore(activeCellPos.row)}
          disabled={!activeCellPos}
          title="Agregar fila arriba"
        />
        <ToolButton
          label="↓ Fila"
          onClick={() => activeCellPos && addRowAfter(activeCellPos.row)}
          disabled={!activeCellPos}
          title="Agregar fila abajo"
        />
        <ToolButton
          label="✕ Fila"
          onClick={() => activeCellPos && deleteRow(activeCellPos.row)}
          disabled={!activeCellPos || !getCanDeleteRow()}
          title="Eliminar fila"
        />
        <ToolButton
          label="← Col"
          onClick={() => activeCellPos && addColumnBefore(activeCellPos.col)}
          disabled={!activeCellPos}
          title="Agregar columna izquierda"
        />
        <ToolButton
          label="→ Col"
          onClick={() => activeCellPos && addColumnAfter(activeCellPos.col)}
          disabled={!activeCellPos}
          title="Agregar columna derecha"
        />
        <ToolButton
          label="✕ Col"
          onClick={() => activeCellPos && deleteColumn(activeCellPos.col)}
          disabled={!activeCellPos || !getCanDeleteCol()}
          title="Eliminar columna"
        />
      </div>

      {/* Grupo Merge/Split */}
      <div style={{ display: 'flex', gap: '2px', paddingRight: '6px', borderRight: '1px solid #e2e8f0' }}>
        <ToolButton
          label="Merge"
          onClick={handleMerge}
          disabled={!canMerge}
          title="Fusionar celdas seleccionadas"
        />
        <ToolButton
          label="Split"
          onClick={() => activeCellPos && splitCell(activeCellPos.row, activeCellPos.col)}
          disabled={!canSplit}
          title="Dividir celda fusionada"
        />
      </div>

      {/* Grupo Formato */}
      <div style={{ display: 'flex', gap: '2px', paddingRight: '6px', borderRight: '1px solid #e2e8f0' }}>
        <ToolButton
          label="B"
          onClick={handleToggleBold}
          disabled={!activeCellPos}
          active={currentCell?.style.fontWeight === 'bold'}
          title="Negrita"
        />
        <ToolButton
          label="I"
          onClick={handleToggleItalic}
          disabled={!activeCellPos}
          active={currentCell?.style.fontStyle === 'italic'}
          title="Cursiva"
        />
        <ToolButton
          label="U"
          onClick={handleToggleUnderline}
          disabled={!activeCellPos}
          active={currentCell?.style.textDecoration?.includes('underline')}
          title="Subrayado"
        />
        <ToolButton
          label="S"
          onClick={handleToggleStrikethrough}
          disabled={!activeCellPos}
          active={currentCell?.style.textDecoration?.includes('line-through')}
          title="Tachado"
        />
      </div>

      {/* Grupo Alineación */}
      <div style={{ display: 'flex', gap: '2px', paddingRight: '6px', borderRight: '1px solid #e2e8f0' }}>
        <ToolButton
          label="≣"
          onClick={() => handleAlign('left')}
          disabled={!activeCellPos}
          active={currentCell?.style.textAlign === 'left'}
          title="Alinear izquierda"
        />
        <ToolButton
          label="⋮"
          onClick={() => handleAlign('center')}
          disabled={!activeCellPos}
          active={currentCell?.style.textAlign === 'center'}
          title="Alinear centro"
        />
        <ToolButton
          label="⋮"
          onClick={() => handleAlign('right')}
          disabled={!activeCellPos}
          active={currentCell?.style.textAlign === 'right'}
          title="Alinear derecha"
        />
      </div>

      {/* Indicador */}
      <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>
        {pageConfig.size} • {pageConfig.orientation === 'portrait' ? 'Vertical' : 'Horizontal'} • {pageConfig.recibosPerPage} recibo{pageConfig.recibosPerPage > 1 ? 's' : ''}
      </div>
    </div>
  );
};

const ToolButton = ({ label, onClick, disabled, active, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      padding: '4px 8px',
      border: active ? '1px solid #2563eb' : '1px solid transparent',
      borderRadius: '3px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '11px',
      fontWeight: '500',
      background: active ? '#dbeafe' : 'transparent',
      color: active ? '#2563eb' : '#1f2937',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.2s',
    }}
  >
    {label}
  </button>
);
