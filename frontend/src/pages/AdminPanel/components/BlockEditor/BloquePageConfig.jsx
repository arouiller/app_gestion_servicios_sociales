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

  // Calcular altura automática del recibo
  const calcularAlturaRecibo = () => {
    const tamaños = {
      'A4': { width: 210, height: 297 },
      'A5': { width: 148, height: 210 },
      'Letter': { width: 215.9, height: 279.4 }
    };

    const pageSize = pageConfig.tamaño || 'A4';
    const dimensions = tamaños[pageSize] || tamaños['A4'];
    const margenTop = pageConfig.margen_superior_mm || 10;
    const margenBottom = pageConfig.margen_inferior_mm || 10;
    const recibosPerPage = pageConfig.recibos_por_pagina || 1;
    const gapVertical = pageConfig.gap_vertical_mm || 0;

    // Fórmula: (altura_página - margen_top - margen_bottom - (recibos - 1) * gap) / recibos
    const alturaDisponible = dimensions.height - margenTop - margenBottom;
    const alturaRecibo = (alturaDisponible - (recibosPerPage - 1) * gapVertical) / recibosPerPage;

    return {
      alturaDisponible: alturaDisponible.toFixed(2),
      alturaRecibo: alturaRecibo.toFixed(2)
    };
  };

  const alturaCalculada = calcularAlturaRecibo();

  const handleChange = (field, value) => {
    const updatedConfig = { ...pageConfig, [field]: value };

    // Calcular y guardar altura_recibo_mm automáticamente
    const tamaños = {
      'A4': { width: 210, height: 297 },
      'A5': { width: 148, height: 210 },
      'Letter': { width: 215.9, height: 279.4 }
    };

    const pageSize = updatedConfig.tamaño || 'A4';
    const dimensions = tamaños[pageSize] || tamaños['A4'];
    const margenTop = updatedConfig.margen_superior_mm || 10;
    const margenBottom = updatedConfig.margen_inferior_mm || 10;
    const recibosPerPage = updatedConfig.recibos_por_pagina || 1;
    const gapVertical = updatedConfig.gap_vertical_mm || 0;

    const alturaDisponible = dimensions.height - margenTop - margenBottom;
    const alturaRecibo = (alturaDisponible - (recibosPerPage - 1) * gapVertical) / recibosPerPage;

    updatedConfig.altura_recibo_mm = Math.round(alturaRecibo * 100) / 100; // Redondear a 2 decimales

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

          {/* Mostrar altura calculada automáticamente */}
          <div className="config-group" style={{ backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '4px', marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#0066cc' }}>📐 Altura Automática del Recibo</label>
            <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: '1.6' }}>
              <div>Altura disponible: <strong>{alturaCalculada.alturaDisponible} mm</strong></div>
              <div style={{ marginTop: '5px' }}>
                Altura por recibo: <strong style={{ fontSize: '14px', color: '#d9534f' }}>{alturaCalculada.alturaRecibo} mm</strong>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                Fórmula: ({alturaCalculada.alturaDisponible} - {(pageConfig.recibos_por_pagina - 1) * (pageConfig.gap_vertical_mm || 0)}mm gap) ÷ {pageConfig.recibos_por_pagina}
              </div>
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
        </div>
      )}
    </div>
  );
};

export default BloquePageConfig;
