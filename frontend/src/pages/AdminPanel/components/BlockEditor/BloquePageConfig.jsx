import React, { useState } from 'react';
import useTemplateStore from '../../../../hooks/useTemplateStore';

const BloquePageConfig = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateBloque = useTemplateStore((state) => state.updateBloque);

  // Limpiar claves numéricas corruptas del objeto
  const cleanPageConfig = (config) => {
    if (!config || typeof config !== 'object') return {};
    return Object.keys(config)
      .filter(key => isNaN(key)) // Solo mantener claves NO numéricas
      .reduce((clean, key) => {
        clean[key] = config[key];
        return clean;
      }, {});
  };

  const pageConfig = cleanPageConfig(currentTemplate.bloque_pageconfig || {});

  const handleChange = (field, value) => {
    const updatedConfig = { ...pageConfig, [field]: value };
    updateBloque('bloque_pageconfig', updatedConfig);
  };

  const tamaños = [
    { value: 'A4', label: 'A4 (210×297mm)' },
    { value: 'A5', label: 'A5 (148×210mm)' },
    { value: 'Letter', label: 'Letter (8.5×11")' },
    { value: 'Personalizado', label: 'Personalizado' }
  ];

  const recibosOptions = [1, 2, 3, 4, 6, 8];
  const columnasOptions = Array.from(
    { length: pageConfig.recibos_por_pagina || 1 },
    (_, i) => i + 1
  );

  return (
    <div className="bloque-wrapper">
      <div className="bloque-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="bloque-title">
          {isExpanded ? '▼' : '▶'} Bloque 5: Configuración de Página (OBLIGATORIO)
        </span>
      </div>

      {isExpanded && (
        <div className="bloque-editor bloque-5">
          <div className="config-group">
            <label>Tamaño de Página</label>
            <select
              value={pageConfig.tamaño || 'A4'}
              onChange={(e) => handleChange('tamaño', e.target.value)}
              className="input"
            >
              {tamaños.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {pageConfig.tamaño === 'Personalizado' && (
            <>
              <div className="config-group">
                <label>Ancho (100-300mm)</label>
                <input
                  type="number"
                  min="100"
                  max="300"
                  value={pageConfig.personalizado_ancho_mm || 210}
                  onChange={(e) => handleChange('personalizado_ancho_mm', Number(e.target.value))}
                  className="input"
                />
              </div>
              <div className="config-group">
                <label>Alto (100-400mm)</label>
                <input
                  type="number"
                  min="100"
                  max="400"
                  value={pageConfig.personalizado_alto_mm || 297}
                  onChange={(e) => handleChange('personalizado_alto_mm', Number(e.target.value))}
                  className="input"
                />
              </div>
            </>
          )}

          <div className="config-group">
            <label>Orientación</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="portrait"
                  checked={pageConfig.orientacion === 'portrait'}
                  onChange={(e) => handleChange('orientacion', e.target.value)}
                />
                Vertical (Portrait)
              </label>
              <label>
                <input
                  type="radio"
                  value="landscape"
                  checked={pageConfig.orientacion === 'landscape'}
                  onChange={(e) => handleChange('orientacion', e.target.value)}
                />
                Horizontal (Landscape)
              </label>
            </div>
          </div>

          <div className="margins-group">
            <label>Márgenes (mm)</label>
            <div className="margin-inputs">
              <input
                type="number"
                min="5"
                max="50"
                value={pageConfig.margen_superior_mm || 10}
                onChange={(e) => handleChange('margen_superior_mm', Number(e.target.value))}
                className="input-small"
                title="Superior"
                placeholder="Sup"
              />
              <input
                type="number"
                min="5"
                max="50"
                value={pageConfig.margen_derecho_mm || 10}
                onChange={(e) => handleChange('margen_derecho_mm', Number(e.target.value))}
                className="input-small"
                title="Derecho"
                placeholder="Der"
              />
              <input
                type="number"
                min="5"
                max="50"
                value={pageConfig.margen_inferior_mm || 10}
                onChange={(e) => handleChange('margen_inferior_mm', Number(e.target.value))}
                className="input-small"
                title="Inferior"
                placeholder="Inf"
              />
              <input
                type="number"
                min="5"
                max="50"
                value={pageConfig.margen_izquierdo_mm || 10}
                onChange={(e) => handleChange('margen_izquierdo_mm', Number(e.target.value))}
                className="input-small"
                title="Izquierdo"
                placeholder="Izq"
              />
            </div>
          </div>

          <div className="config-group">
            <label>Recibos por página</label>
            <select
              value={pageConfig.recibos_por_pagina || 1}
              onChange={(e) => handleChange('recibos_por_pagina', Number(e.target.value))}
              className="input"
            >
              {recibosOptions.map((r) => (
                <option key={r} value={r}>
                  {r} recibo{r > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dimensiones de tabla - entrada manual */}
          <div className="config-group" style={{ backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '4px', marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#0066cc' }}>📐 Dimensiones de Tabla</label>
            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Ancho (mm)</label>
                <input
                  type="number"
                  min="50"
                  max="300"
                  step="0.5"
                  value={pageConfig.tabla_ancho_mm || 190}
                  onChange={(e) => handleChange('tabla_ancho_mm', Number(e.target.value))}
                  className="input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Alto (mm)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  step="0.5"
                  value={pageConfig.tabla_alto_mm || 100}
                  onChange={(e) => handleChange('tabla_alto_mm', Number(e.target.value))}
                  className="input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
              Ingresa el ancho y alto que desees para la tabla en el recibo
            </div>
          </div>

          {pageConfig.recibos_por_pagina > 1 && (
            <>
              <div className="config-group">
                <label>Layout</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="vertical"
                      checked={pageConfig.layout === 'vertical'}
                      onChange={(e) => handleChange('layout', e.target.value)}
                    />
                    Vertical (apilados)
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="grilla"
                      checked={pageConfig.layout === 'grilla'}
                      onChange={(e) => handleChange('layout', e.target.value)}
                    />
                    Grilla
                  </label>
                </div>
              </div>

              {pageConfig.layout === 'grilla' && pageConfig.recibos_por_pagina >= 4 && (
                <div className="config-group">
                  <label>Columnas</label>
                  <select
                    value={pageConfig.columnas_grilla || 1}
                    onChange={(e) => handleChange('columnas_grilla', Number(e.target.value))}
                    className="input"
                  >
                    {columnasOptions.map((c) => {
                      const filas = Math.ceil(pageConfig.recibos_por_pagina / c);
                      return (
                        <option key={c} value={c}>
                          {c} columnas × {filas} filas
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="config-group">
                <label>Espaciado (mm)</label>
                <div className="spacing-inputs">
                  <input
                    type="number"
                    min="5"
                    max="20"
                    value={pageConfig.gap_vertical_mm || 5}
                    onChange={(e) => handleChange('gap_vertical_mm', Number(e.target.value))}
                    className="input-small"
                    placeholder="V"
                  />
                  <input
                    type="number"
                    min="5"
                    max="20"
                    value={pageConfig.gap_horizontal_mm || 5}
                    onChange={(e) => handleChange('gap_horizontal_mm', Number(e.target.value))}
                    className="input-small"
                    placeholder="H"
                  />
                </div>
              </div>
            </>
          )}

          {/* Factores de escalamiento para PDF */}
          <div className="config-group" style={{ backgroundColor: '#fff8e1', padding: '10px', borderRadius: '4px', marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#856404' }}>🔍 Factores de Escalamiento PDF</label>
            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Factor X (Horizontal)</label>
                <input
                  type="number"
                  min="0.5"
                  max="2"
                  step="0.001"
                  value={pageConfig.scale_x || 1}
                  onChange={(e) => handleChange('scale_x', Number(e.target.value))}
                  className="input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Factor Y (Vertical)</label>
                <input
                  type="number"
                  min="0.5"
                  max="2"
                  step="0.001"
                  value={pageConfig.scale_y || 1}
                  onChange={(e) => handleChange('scale_y', Number(e.target.value))}
                  className="input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
              Solo afecta PDF (no afecta vista previa). Ej: 1.3 si el PDF se imprime 30% más grande.
            </div>

            {/* Checkbox para grilla */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pageConfig.show_grid || false}
                  onChange={(e) => handleChange('show_grid', e.target.checked)}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>Mostrar grilla de referencia 1cm×1cm en PDF</span>
              </label>
              <div style={{ marginTop: '4px', fontSize: '10px', color: '#999', marginLeft: '24px' }}>
                La grilla se escalará automáticamente con los factores X/Y
              </div>
            </div>

            {/* Checkbox para borde de recibo */}
            <div style={{ marginTop: '12px', paddingTop: '0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pageConfig.mostrar_borde_recibo || false}
                  onChange={(e) => handleChange('mostrar_borde_recibo', e.target.checked)}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>Imprimir borde de recibo en PDF</span>
              </label>
              <div style={{ marginTop: '4px', fontSize: '10px', color: '#999', marginLeft: '24px' }}>
                Muestra un borde negro 1px alrededor de cada recibo (útil para ajuste de posicionamiento)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloquePageConfig;
