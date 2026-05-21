import React, { useMemo } from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const ReciboPreview = () => {
  const { grid, generateHTML, pageConfig } = useReciboDesignerStore();

  const html = useMemo(() => generateHTML(), [grid]);

  const getPageSize = () => {
    const sizes = {
      A4: '210mm x 297mm',
      A5: '148mm x 210mm',
      Carta: '216mm x 279mm',
      Personalizado: 'Personalizado',
    };
    return sizes[pageConfig.size] || sizes.A4;
  };

  return (
    <div className="recibo-designer__preview-container">
      <h3 className="recibo-designer__section-title">Vista Previa</h3>
      <div
        style={{
          background: pageConfig.orientation === 'landscape' ? '#eee' : '#fff',
          padding: `${pageConfig.margins}mm`,
          margin: '10px auto',
          maxWidth: pageConfig.orientation === 'landscape' ? '297mm' : '210mm',
          minHeight: pageConfig.orientation === 'landscape' ? '210mm' : '297mm',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #ddd',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
        {getPageSize()} - {pageConfig.orientation === 'landscape' ? 'Horizontal' : 'Vertical'} - Márgenes: {pageConfig.margins}mm
      </div>
    </div>
  );
};
