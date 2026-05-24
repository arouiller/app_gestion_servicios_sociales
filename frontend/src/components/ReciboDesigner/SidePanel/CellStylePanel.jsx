import React from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Helvetica'];

const ControlGroup = ({ label, children }) => (
  <div style={{ marginBottom: '12px' }}>
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: 600,
      marginBottom: '4px',
      color: '#1f2937',
    }}>
      {label}
    </label>
    {children}
  </div>
);

const SelectControl = ({ value, onChange, options, disabled }) => (
  <select
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '4px 6px',
      fontSize: '11px',
      border: '1px solid #d1d5db',
      borderRadius: '3px',
      backgroundColor: 'white',
      color: '#1f2937',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const NumberInput = ({ value, onChange, min, max, disabled }) => (
  <input
    type="number"
    value={value || ''}
    onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
    min={min}
    max={max}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '4px 6px',
      fontSize: '11px',
      border: '1px solid #d1d5db',
      borderRadius: '3px',
      cursor: disabled ? 'not-allowed' : 'text',
      opacity: disabled ? 0.5 : 1,
    }}
  />
);

const ColorInput = ({ value, onChange, disabled }) => (
  <input
    type="color"
    value={value || '#000000'}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    style={{
      width: '100%',
      height: '32px',
      padding: '2px',
      border: '1px solid #d1d5db',
      borderRadius: '3px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
  />
);

const ToggleButton = ({ label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '4px 8px',
      marginRight: '4px',
      marginBottom: '4px',
      fontSize: '11px',
      fontWeight: 600,
      border: active ? '1px solid #2563eb' : '1px solid #d1d5db',
      borderRadius: '3px',
      backgroundColor: active ? '#dbeafe' : 'white',
      color: active ? '#2563eb' : '#1f2937',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s',
    }}
  >
    {label}
  </button>
);

export const CellStylePanel = () => {
  const { activeCellPos, table, updateCellStyle } = useReciboDesignerStore();

  const currentCell = activeCellPos ? table.rows[activeCellPos.row]?.cells[activeCellPos.col] : null;
  const s = currentCell?.style || {};
  const disabled = !currentCell;

  const handleStyleChange = (updates) => {
    if (!activeCellPos) return;
    updateCellStyle(activeCellPos.row, activeCellPos.col, updates);
  };

  return (
    <div>
      <ControlGroup label="Fuente">
        <SelectControl
          value={s.fontFamily}
          onChange={(v) => handleStyleChange({ fontFamily: v })}
          options={FONTS.map((f) => ({ value: f, label: f }))}
          disabled={disabled}
        />
      </ControlGroup>

      <ControlGroup label="Tamaño (px)">
        <NumberInput
          value={s.fontSize}
          onChange={(v) => handleStyleChange({ fontSize: Math.max(6, Math.min(72, v)) })}
          min={6}
          max={72}
          disabled={disabled}
        />
      </ControlGroup>

      <ControlGroup label="Estilos">
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <ToggleButton
            label="B"
            active={s.fontWeight === 'bold'}
            onClick={() => handleStyleChange({
              fontWeight: s.fontWeight === 'bold' ? 'normal' : 'bold',
            })}
            disabled={disabled}
          />
          <ToggleButton
            label="I"
            active={s.fontStyle === 'italic'}
            onClick={() => handleStyleChange({
              fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic',
            })}
            disabled={disabled}
          />
          <ToggleButton
            label="U"
            active={s.textDecoration?.includes('underline')}
            onClick={() => {
              const dec = s.textDecoration || 'none';
              const hasUnderline = dec.includes('underline');
              const newDec = hasUnderline
                ? dec.replace('underline', '').trim() || 'none'
                : (dec === 'none' ? 'underline' : `${dec} underline`);
              handleStyleChange({ textDecoration: newDec });
            }}
            disabled={disabled}
          />
          <ToggleButton
            label="S"
            active={s.textDecoration?.includes('line-through')}
            onClick={() => {
              const dec = s.textDecoration || 'none';
              const hasStrike = dec.includes('line-through');
              const newDec = hasStrike
                ? dec.replace('line-through', '').trim() || 'none'
                : (dec === 'none' ? 'line-through' : `${dec} line-through`);
              handleStyleChange({ textDecoration: newDec });
            }}
            disabled={disabled}
          />
        </div>
      </ControlGroup>

      <ControlGroup label="Alineación">
        <div style={{ display: 'flex', gap: '4px' }}>
          <ToggleButton
            label="←"
            active={s.textAlign === 'left'}
            onClick={() => handleStyleChange({ textAlign: 'left' })}
            disabled={disabled}
          />
          <ToggleButton
            label="⊕"
            active={s.textAlign === 'center'}
            onClick={() => handleStyleChange({ textAlign: 'center' })}
            disabled={disabled}
          />
          <ToggleButton
            label="→"
            active={s.textAlign === 'right'}
            onClick={() => handleStyleChange({ textAlign: 'right' })}
            disabled={disabled}
          />
        </div>
      </ControlGroup>

      <ControlGroup label="Color de Texto">
        <ColorInput
          value={s.color}
          onChange={(v) => handleStyleChange({ color: v })}
          disabled={disabled}
        />
      </ControlGroup>

      <ControlGroup label="Fondo">
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ flex: 1 }}>
            <ColorInput
              value={s.backgroundColor}
              onChange={(v) => handleStyleChange({ backgroundColor: v })}
              disabled={disabled}
            />
          </div>
          <button
            onClick={() => handleStyleChange({ backgroundColor: '' })}
            disabled={disabled}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              backgroundColor: 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            Limpiar
          </button>
        </div>
      </ControlGroup>

      <ControlGroup label="Padding (px)">
        <NumberInput
          value={s.padding}
          onChange={(v) => handleStyleChange({ padding: Math.max(0, v) })}
          min={0}
          disabled={disabled}
        />
      </ControlGroup>

      <ControlGroup label="Alineación Vertical">
        <SelectControl
          value={s.verticalAlign}
          onChange={(v) => handleStyleChange({ verticalAlign: v })}
          options={[
            { value: 'top', label: 'Superior' },
            { value: 'middle', label: 'Centro' },
            { value: 'bottom', label: 'Inferior' },
          ]}
          disabled={disabled}
        />
      </ControlGroup>
    </div>
  );
};
