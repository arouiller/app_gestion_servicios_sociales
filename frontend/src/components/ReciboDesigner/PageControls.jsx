import React from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const PageControls = () => {
  const { pageConfig, setPageConfig } = useReciboDesignerStore();

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Configuración de Página</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
            Tamaño:
          </label>
          <select
            value={pageConfig.size}
            onChange={(e) => setPageConfig({ size: e.target.value })}
            style={{ width: '100%', padding: '6px', borderRadius: '3px', border: '1px solid #ddd' }}
          >
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="Carta">Carta</option>
            <option value="Personalizado">Personalizado</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
            Orientación:
          </label>
          <select
            value={pageConfig.orientation}
            onChange={(e) => setPageConfig({ orientation: e.target.value })}
            style={{ width: '100%', padding: '6px', borderRadius: '3px', border: '1px solid #ddd' }}
          >
            <option value="portrait">Vertical</option>
            <option value="landscape">Horizontal</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
            Márgenes (mm):
          </label>
          <input
            type="number"
            value={pageConfig.margins}
            onChange={(e) => setPageConfig({ margins: Math.max(0, Math.min(50, parseInt(e.target.value) || 0)) })}
            min="0"
            max="50"
            style={{ width: '100%', padding: '6px', borderRadius: '3px', border: '1px solid #ddd' }}
          />
        </div>
      </div>
    </div>
  );
};
