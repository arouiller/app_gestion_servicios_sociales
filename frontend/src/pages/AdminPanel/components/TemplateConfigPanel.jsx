import React, { useState } from 'react';
import useTemplateStore from '../../../hooks/useTemplateStore';
import { updateFilaAltura, updateCeldaAncho } from './TableEditor';

const TemplateConfigPanel = ({ selectedCell, placeholders = {} }) => {
  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);

  const [expandedBlocks, setExpandedBlocks] = useState({
    cellSize: !!selectedCell,
    pageConfig: true,
    tableConfig: true,
    scalingFactors: false,
    visualization: false
  });

  const toggleBlock = (blockName) => {
    setExpandedBlocks(prev => ({ ...prev, [blockName]: !prev[blockName] }));
  };

  const pageConfig = typeof currentTemplate.bloque_pageconfig === 'string'
    ? JSON.parse(currentTemplate.bloque_pageconfig || '{}')
    : currentTemplate.bloque_pageconfig || {};

  const handlePageConfigChange = (field, value) => {
    const updatedConfig = { ...pageConfig, [field]: value };
    updateTemplate({ bloque_pageconfig: updatedConfig });
  };

  const BlockHeader = ({ name, title }) => (
    <div
      onClick={() => toggleBlock(name)}
      style={{
        padding: '12px',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ddd',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        fontWeight: 'bold',
        userSelect: 'none'
      }}
    >
      <span>{title}</span>
      <span>{expandedBlocks[name] ? '▼' : '▶'}</span>
    </div>
  );

  return (
    <div className="template-config-panel">
      {/* 0. Tamaño de Celda */}
      {selectedCell && (
        <div style={{ marginBottom: '12px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
          <BlockHeader name="cellSize" title="0. Tamaño de Celda" />
          {expandedBlocks.cellSize && (
            <div style={{ padding: '12px', backgroundColor: '#fff' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '6px' }}>
                  0.1 Altura de Fila (mm)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  step="0.5"
                  value={selectedCell.fila.altura || 15}
                  onChange={(e) => {
                    const tabla = currentTemplate.bloques[0];
                    const nuevaTabla = updateFilaAltura(tabla, selectedCell.fila.id, Number(e.target.value));
                    updateTemplate({ bloques: [nuevaTabla] });
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    fontSize: '11px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '6px' }}>
                  0.2 Ancho de Columna (mm)
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  step="0.5"
                  value={selectedCell.celda.ancho_mm || selectedCell.celda.ancho || 85}
                  onChange={(e) => {
                    const tabla = currentTemplate.bloques[0];
                    const nuevaTabla = updateCeldaAncho(tabla, selectedCell.fila.id, selectedCell.celda.id, Number(e.target.value));
                    updateTemplate({ bloques: [nuevaTabla] });
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    fontSize: '11px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Configuración de Página */}
      <div style={{ marginBottom: '12px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <BlockHeader name="pageConfig" title="1. Configuración de Página" />
        {expandedBlocks.pageConfig && (
          <div style={{ padding: '12px', backgroundColor: '#fff' }}>
            {/* 1.1 Tamaño de Página */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '6px' }}>
                1.1 Tamaño de Página
              </label>
              <select
                value={pageConfig.tamaño || 'A4'}
                onChange={(e) => handlePageConfigChange('tamaño', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '11px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="A4">A4 (210×297mm)</option>
                <option value="A5">A5 (148×210mm)</option>
                <option value="Letter">Letter (8.5×11")</option>
              </select>
            </div>

            {/* 1.2 Orientación */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '6px' }}>
                1.2 Orientación
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="portrait"
                    checked={pageConfig.orientacion === 'portrait' || pageConfig.orientacion === undefined}
                    onChange={(e) => handlePageConfigChange('orientacion', e.target.value)}
                  />
                  Vertical
                </label>
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="landscape"
                    checked={pageConfig.orientacion === 'landscape'}
                    onChange={(e) => handlePageConfigChange('orientacion', e.target.value)}
                  />
                  Horizontal
                </label>
              </div>
            </div>

            {/* 1.3 Márgenes */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '8px' }}>
                1.3 Márgenes (mm)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '4px' }}>Superior</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pageConfig.margen_superior_mm || 10}
                    onChange={(e) => handlePageConfigChange('margen_superior_mm', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '11px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '4px' }}>Derecho</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pageConfig.margen_derecho_mm || 10}
                    onChange={(e) => handlePageConfigChange('margen_derecho_mm', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '11px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '4px' }}>Inferior</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pageConfig.margen_inferior_mm || 10}
                    onChange={(e) => handlePageConfigChange('margen_inferior_mm', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '11px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '4px' }}>Izquierdo</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pageConfig.margen_izquierdo_mm || 10}
                    onChange={(e) => handlePageConfigChange('margen_izquierdo_mm', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '11px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Configuración de Tabla */}
      <div style={{ marginBottom: '12px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <BlockHeader name="tableConfig" title="2. Configuración de Tabla" />
        {expandedBlocks.tableConfig && (
          <div style={{ padding: '12px', backgroundColor: '#fff' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '6px' }}>
                2.1 Ancho Total (mm)
              </label>
              <input
                type="number"
                min="50"
                max="300"
                step="0.5"
                value={currentTemplate.bloques?.[0]?.anchoTotal_mm || 170}
                onChange={(e) => {
                  const tabla = currentTemplate.bloques[0];
                  const nuevaTabla = { ...tabla, anchoTotal_mm: Number(e.target.value) };
                  updateTemplate({ bloques: [nuevaTabla] });
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '11px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '6px' }}>
                2.2 Tamaño de Fuente (px)
              </label>
              <input
                type="number"
                min="8"
                max="24"
                value={currentTemplate.bloques?.[0]?.tamanoFuente || 11}
                onChange={(e) => {
                  const tabla = currentTemplate.bloques[0];
                  const nuevaTabla = { ...tabla, tamanoFuente: Number(e.target.value) };
                  updateTemplate({ bloques: [nuevaTabla] });
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '11px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Factores de Escalamiento */}
      <div style={{ marginBottom: '12px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <BlockHeader name="scalingFactors" title="3. Factores de Escalamiento PDF" />
        {expandedBlocks.scalingFactors && (
          <div style={{ padding: '12px', backgroundColor: '#fff' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '6px' }}>
                3.1 Factor X (Horizontal)
              </label>
              <input
                type="number"
                min="0.5"
                max="2"
                step="0.0001"
                value={pageConfig.scale_x || 1}
                onChange={(e) => handlePageConfigChange('scale_x', Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '11px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '6px' }}>
                3.2 Factor Y (Vertical)
              </label>
              <input
                type="number"
                min="0.5"
                max="2"
                step="0.0001"
                value={pageConfig.scale_y || 1}
                onChange={(e) => handlePageConfigChange('scale_y', Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '11px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Visualización */}
      <div style={{ marginBottom: '12px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <BlockHeader name="visualization" title="4. Visualización" />
        {expandedBlocks.visualization && (
          <div style={{ padding: '12px', backgroundColor: '#fff' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pageConfig.show_grid || false}
                  onChange={(e) => handlePageConfigChange('show_grid', e.target.checked)}
                />
                <span style={{ color: '#333' }}>4.1 Grilla de referencia 5x5mm en PDF</span>
              </label>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pageConfig.mostrar_borde_recibo || false}
                  onChange={(e) => handlePageConfigChange('mostrar_borde_recibo', e.target.checked)}
                />
                <span style={{ color: '#333' }}>4.2 Borde de recibo en PDF</span>
              </label>
            </div>

            <div>
              <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pageConfig.mostrar_borde_pagina || false}
                  onChange={(e) => handlePageConfigChange('mostrar_borde_pagina', e.target.checked)}
                />
                <span style={{ color: '#333' }}>4.3 Borde de página en PDF</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateConfigPanel;
