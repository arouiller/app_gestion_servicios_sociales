import React, { useMemo } from 'react';

/**
 * Calcula las posiciones de los recibos basado en bloque_pageconfig
 */
const calculateRecibosPositions = (pageConfig) => {
  if (!pageConfig) return [];

  const A4_WIDTH = 210; // mm
  const A4_HEIGHT = 297; // mm

  const marginTop = pageConfig.margen_superior_mm || 10;
  const marginRight = pageConfig.margen_derecho_mm || 10;
  const marginBottom = pageConfig.margen_inferior_mm || 10;
  const marginLeft = pageConfig.margen_izquierdo_mm || 10;

  const contentWidth = A4_WIDTH - marginLeft - marginRight;
  const contentHeight = A4_HEIGHT - marginTop - marginBottom;

  const recibosPerPage = pageConfig.recibos_por_pagina || 1;
  const layout = pageConfig.layout || 'vertical';
  const gapVertical = pageConfig.gap_vertical_mm || 5;
  const gapHorizontal = pageConfig.gap_horizontal_mm || 5;

  const recibos = [];

  if (layout === 'vertical') {
    // Layout vertical: todos en una columna
    const reciboHeight = (contentHeight - (recibosPerPage - 1) * gapVertical) / recibosPerPage;
    for (let i = 0; i < recibosPerPage; i++) {
      recibos.push({
        number: i + 1,
        x: marginLeft,
        y: marginTop + i * (reciboHeight + gapVertical),
        width: contentWidth,
        height: reciboHeight
      });
    }
  } else if (layout === 'grilla') {
    // Layout grilla
    const columns = pageConfig.columnas_grilla || 1;
    const rows = Math.ceil(recibosPerPage / columns);

    const reciboWidth = (contentWidth - (columns - 1) * gapHorizontal) / columns;
    const reciboHeight = (contentHeight - (rows - 1) * gapVertical) / rows;

    for (let i = 0; i < recibosPerPage; i++) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      recibos.push({
        number: i + 1,
        x: marginLeft + col * (reciboWidth + gapHorizontal),
        y: marginTop + row * (reciboHeight + gapVertical),
        width: reciboWidth,
        height: reciboHeight
      });
    }
  }

  return {
    pageConfig,
    recibos,
    margins: { marginTop, marginRight, marginBottom, marginLeft },
    contentWidth,
    contentHeight
  };
};

const PageGuides = ({ pageConfig }) => {
  const layout = useMemo(() => calculateRecibosPositions(pageConfig), [pageConfig]);

  if (!layout.recibos.length) return null;

  const { margins, recibos } = layout;
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;

  // Escala para SVG (1mm = 1px en el SVG, pero se escala con CSS)
  const svgWidth = A4_WIDTH;
  const svgHeight = A4_HEIGHT;

  return (
    <svg
      className="page-guides"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      {/* Márgenes - líneas punteadas */}
      <rect
        x={margins.marginLeft}
        y={margins.marginTop}
        width={svgWidth - margins.marginLeft - margins.marginRight}
        height={svgHeight - margins.marginTop - margins.marginBottom}
        fill="none"
        stroke="#ff6b6b"
        strokeDasharray="5,5"
        strokeWidth="0.5"
      />

      {/* Límites de recibos - líneas sólidas */}
      {recibos.map((recibo) => (
        <g key={recibo.number}>
          <rect
            x={recibo.x}
            y={recibo.y}
            width={recibo.width}
            height={recibo.height}
            fill="none"
            stroke="#4dabf7"
            strokeWidth="0.5"
          />
          {/* Número del recibo en la esquina superior izquierda */}
          <text
            x={recibo.x + 2}
            y={recibo.y + 4}
            fontSize="3"
            fill="#4dabf7"
            fontFamily="Arial, sans-serif"
            pointerEvents="none"
          >
            {recibo.number}
          </text>
        </g>
      ))}
    </svg>
  );
};

export { calculateRecibosPositions };
export default PageGuides;
