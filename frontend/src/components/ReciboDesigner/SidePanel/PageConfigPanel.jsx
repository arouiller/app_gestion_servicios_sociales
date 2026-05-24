import React from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

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

const SelectControl = ({ value, onChange, options }) => (
  <select
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '4px 6px',
      fontSize: '11px',
      border: '1px solid #d1d5db',
      borderRadius: '3px',
      backgroundColor: 'white',
      color: '#1f2937',
      cursor: 'pointer',
    }}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const NumberInput = ({ value, onChange, min, max, label }) => (
  <div style={{ marginBottom: '6px' }}>
    {label && (
      <label style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', display: 'block' }}>
        {label}
      </label>
    )}
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(Math.max(min || 0, Math.min(max || 100, parseInt(e.target.value, 10) || 0)))}
      min={min}
      max={max}
      style={{
        width: '100%',
        padding: '4px 6px',
        fontSize: '11px',
        border: '1px solid #d1d5db',
        borderRadius: '3px',
      }}
    />
  </div>
);

export const PageConfigPanel = () => {
  const { pageConfig, setPageConfig } = useReciboDesignerStore();

  const handlePageConfigChange = (updates) => {
    setPageConfig(updates);
  };

  const handleMarginChange = (marginType, side, value) => {
    const currentMargins = pageConfig[marginType];
    handlePageConfigChange({
      [marginType]: {
        ...currentMargins,
        [side]: Math.max(0, value),
      },
    });
  };

  return (
    <div>
      <ControlGroup label="Tamaño de Página">
        <SelectControl
          value={pageConfig.size}
          onChange={(v) => handlePageConfigChange({ size: v })}
          options={[
            { value: 'A4', label: 'A4' },
            { value: 'A5', label: 'A5' },
            { value: 'Carta', label: 'Carta' },
            { value: 'Personalizado', label: 'Personalizado' },
          ]}
        />
      </ControlGroup>

      <ControlGroup label="Orientación">
        <SelectControl
          value={pageConfig.orientation}
          onChange={(v) => handlePageConfigChange({ orientation: v })}
          options={[
            { value: 'portrait', label: 'Vertical' },
            { value: 'landscape', label: 'Horizontal' },
          ]}
        />
      </ControlGroup>

      <ControlGroup label="Márgenes de Página (mm)">
        <NumberInput
          value={pageConfig.pageMargins.top}
          onChange={(v) => handleMarginChange('pageMargins', 'top', v)}
          min={0}
          max={50}
          label="Superior"
        />
        <NumberInput
          value={pageConfig.pageMargins.right}
          onChange={(v) => handleMarginChange('pageMargins', 'right', v)}
          min={0}
          max={50}
          label="Derecho"
        />
        <NumberInput
          value={pageConfig.pageMargins.bottom}
          onChange={(v) => handleMarginChange('pageMargins', 'bottom', v)}
          min={0}
          max={50}
          label="Inferior"
        />
        <NumberInput
          value={pageConfig.pageMargins.left}
          onChange={(v) => handleMarginChange('pageMargins', 'left', v)}
          min={0}
          max={50}
          label="Izquierdo"
        />
      </ControlGroup>

      <ControlGroup label="Márgenes del Recibo (mm)">
        <NumberInput
          value={pageConfig.reciboMargins.top}
          onChange={(v) => handleMarginChange('reciboMargins', 'top', v)}
          min={0}
          max={50}
          label="Superior"
        />
        <NumberInput
          value={pageConfig.reciboMargins.right}
          onChange={(v) => handleMarginChange('reciboMargins', 'right', v)}
          min={0}
          max={50}
          label="Derecho"
        />
        <NumberInput
          value={pageConfig.reciboMargins.bottom}
          onChange={(v) => handleMarginChange('reciboMargins', 'bottom', v)}
          min={0}
          max={50}
          label="Inferior"
        />
        <NumberInput
          value={pageConfig.reciboMargins.left}
          onChange={(v) => handleMarginChange('reciboMargins', 'left', v)}
          min={0}
          max={50}
          label="Izquierdo"
        />
      </ControlGroup>

      <ControlGroup label="Recibos por Página">
        <NumberInput
          value={pageConfig.recibosPerPage}
          onChange={(v) => handlePageConfigChange({ recibosPerPage: Math.max(1, Math.min(10, v)) })}
          min={1}
          max={10}
        />
      </ControlGroup>
    </div>
  );
};
