import React, { useRef } from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

export const EditableCell = ({
  cell,
  rowIndex,
  colIndex,
  onCellMouseDown,
  onCellMouseEnter,
}) => {
  const editableRef = useRef(null);
  const { activeCellPos, setActiveCell, updateCellContent } = useReciboDesignerStore();
  const selection = useReciboDesignerStore((s) => s.selection);

  if (cell.hidden) {
    return null;
  }

  const isActive = activeCellPos?.row === rowIndex && activeCellPos?.col === colIndex;

  // Determinar si está en el rango seleccionado
  const isSelected = (() => {
    if (!selection.anchor || !selection.focus) return false;
    const r1 = Math.min(selection.anchor.row, selection.focus.row);
    const r2 = Math.max(selection.anchor.row, selection.focus.row);
    const c1 = Math.min(selection.anchor.col, selection.focus.col);
    const c2 = Math.max(selection.anchor.col, selection.focus.col);
    return rowIndex >= r1 && rowIndex <= r2 && colIndex >= c1 && colIndex <= c2;
  })();

  // Construir estilos de la celda
  const s = cell.style;
  const border = (b) => `${b.width}px ${b.style} ${b.color}`;

  const tdStyle = {
    borderTop: border(s.borderTop),
    borderRight: border(s.borderRight),
    borderBottom: border(s.borderBottom),
    borderLeft: border(s.borderLeft),
    fontFamily: s.fontFamily,
    fontWeight: s.fontWeight,
    fontStyle: s.fontStyle,
    textDecoration: s.textDecoration,
    textAlign: s.textAlign,
    fontSize: `${s.fontSize}px`,
    padding: `${s.padding}px`,
    verticalAlign: s.verticalAlign,
    color: s.color,
    backgroundColor: isSelected && !isActive
      ? 'rgba(37, 99, 235, 0.15)'
      : s.backgroundColor || 'transparent',
    position: 'relative',
    outline: isActive ? '2px solid #2563eb' : 'none',
    outlineOffset: isActive ? '-1px' : 'none',
    cursor: 'text',
  };

  return (
    <td
      colSpan={cell.colspan}
      rowSpan={cell.rowspan}
      style={tdStyle}
      onMouseDown={(e) => {
        e.stopPropagation();
        onCellMouseDown(e, rowIndex, colIndex);
      }}
      onMouseEnter={() => onCellMouseEnter(rowIndex, colIndex)}
    >
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setActiveCell({ row: rowIndex, col: colIndex }, editableRef)}
        onBlur={(e) => updateCellContent(rowIndex, colIndex, e.currentTarget.innerText)}
        style={{
          minHeight: '16px',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      >
        {cell.content}
      </div>
    </td>
  );
};
