import React, { useState } from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

const BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double'];

const BorderSection = ({ label, side, border, onChange, disabled }) => (
  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: 600,
      marginBottom: '6px',
      color: '#1f2937',
    }}>
      {label}
    </label>

    <div style={{ marginBottom: '6px' }}>
      <label style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', display: 'block' }}>
        Estilo
      </label>
      <select
        value={border.style}
        onChange={(e) => onChange({ ...border, style: e.target.value })}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: '11px',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {BORDER_STYLES.map((s) => (
          <option key={s} value={s}>
            {s === 'none' ? 'Ninguno' : s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    </div>

    <div style={{ marginBottom: '6px' }}>
      <label style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', display: 'block' }}>
        Grosor (px)
      </label>
      <input
        type="number"
        value={border.width}
        onChange={(e) => onChange({ ...border, width: Math.max(0, parseInt(e.target.value, 10) || 0) })}
        min={0}
        max={10}
        disabled={disabled || border.style === 'none'}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: '11px',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          cursor: disabled || border.style === 'none' ? 'not-allowed' : 'text',
          opacity: disabled || border.style === 'none' ? 0.5 : 1,
        }}
      />
    </div>

    <div>
      <label style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', display: 'block' }}>
        Color
      </label>
      <input
        type="color"
        value={border.color}
        onChange={(e) => onChange({ ...border, color: e.target.value })}
        disabled={disabled || border.style === 'none'}
        style={{
          width: '100%',
          height: '32px',
          padding: '2px',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          cursor: disabled || border.style === 'none' ? 'not-allowed' : 'pointer',
          opacity: disabled || border.style === 'none' ? 0.5 : 1,
        }}
      />
    </div>
  </div>
);

export const BorderStylePanel = () => {
  const { activeCellPos, selection, table, updateCellStyle } = useReciboDesignerStore();
  const [applyToAll, setApplyToAll] = useState(false);

  const currentCell = activeCellPos ? table.rows[activeCellPos.row]?.cells[activeCellPos.col] : null;
  const s = currentCell?.style || {};
  const disabled = !currentCell;

  const getSelectedRange = () => {
    if (!selection.anchor || !selection.focus) return null;
    return {
      r1: Math.min(selection.anchor.row, selection.focus.row),
      r2: Math.max(selection.anchor.row, selection.focus.row),
      c1: Math.min(selection.anchor.col, selection.focus.col),
      c2: Math.max(selection.anchor.col, selection.focus.col),
    };
  };

  const handleBorderChange = (side, newBorder) => {
    if (!activeCellPos) return;

    const range = getSelectedRange();
    const borderKey = `border${side.charAt(0).toUpperCase() + side.slice(1)}`;

    if (range && applyToAll) {
      for (let r = range.r1; r <= range.r2; r++) {
        for (let c = range.c1; c <= range.c2; c++) {
          const cell = table.rows[r]?.cells[c];
          if (cell && !cell.hidden) {
            updateCellStyle(r, c, { [borderKey]: newBorder });
          }
        }
      }
    } else {
      updateCellStyle(activeCellPos.row, activeCellPos.col, { [borderKey]: newBorder });
    }
  };

  const range = getSelectedRange();
  const hasSelection = range && (range.r1 !== range.r2 || range.c1 !== range.c2);

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          cursor: hasSelection && !disabled ? 'pointer' : 'not-allowed',
          opacity: hasSelection && !disabled ? 1 : 0.5,
        }}>
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            disabled={!hasSelection || disabled}
            style={{ cursor: hasSelection && !disabled ? 'pointer' : 'not-allowed' }}
          />
          Aplicar a todas las celdas seleccionadas
        </label>
      </div>

      <BorderSection
        label="Borde Superior"
        side="Top"
        border={s.borderTop}
        onChange={(b) => handleBorderChange('Top', b)}
        disabled={disabled}
      />

      <BorderSection
        label="Borde Derecho"
        side="Right"
        border={s.borderRight}
        onChange={(b) => handleBorderChange('Right', b)}
        disabled={disabled}
      />

      <BorderSection
        label="Borde Inferior"
        side="Bottom"
        border={s.borderBottom}
        onChange={(b) => handleBorderChange('Bottom', b)}
        disabled={disabled}
      />

      <BorderSection
        label="Borde Izquierdo"
        side="Left"
        border={s.borderLeft}
        onChange={(b) => handleBorderChange('Left', b)}
        disabled={disabled}
      />
    </div>
  );
};
