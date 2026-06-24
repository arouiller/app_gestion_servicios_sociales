import React from 'react';
import '../RecibosTemplatesPage.scss';

const MM_TO_PX = 3.7795;
const RULER_WIDTH = 40; // px

const HorizontalRuler = ({ width }) => {
  const totalMM = width / MM_TO_PX;
  const marks = [];

  // Generar marcas cada 1mm
  for (let mm = 0; mm <= totalMM; mm += 1) {
    const px = mm * MM_TO_PX;
    let markSize = 2; // 1mm mark (pequeño)
    let label = null;

    // Cada 10mm (1cm) - marca principal
    if (mm % 10 === 0) {
      markSize = 20;
      label = mm / 10; // mostrar números en cm
    }
    // Cada 5mm - marca secundaria
    else if (mm % 5 === 0) {
      markSize = 10;
    }

    marks.push(
      <div
        key={`h-${mm}`}
        className="ruler-mark"
        style={{
          left: `${px}px`,
          height: `${markSize}px`,
          borderLeft: '1px solid #333',
          boxSizing: 'border-box'
        }}
        title={`${mm}mm`}
      >
        {label !== null && (
          <span className="ruler-label" style={{ position: 'absolute', top: '2px', left: '3px', fontSize: '9px', lineHeight: '1' }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="ruler ruler-horizontal" style={{ width: `${width}px`, height: `${RULER_WIDTH}px`, margin: 0, padding: 0 }}>
      {marks}
    </div>
  );
};

const VerticalRuler = ({ height }) => {
  const totalMM = height / MM_TO_PX;
  const marks = [];

  // Generar marcas cada 1mm
  for (let mm = 0; mm <= totalMM; mm += 1) {
    const px = mm * MM_TO_PX;
    let markSize = 2; // 1mm mark (pequeño)
    let label = null;

    // Cada 10mm (1cm) - marca principal
    if (mm % 10 === 0) {
      markSize = 20;
      label = mm / 10; // mostrar números en cm
    }
    // Cada 5mm - marca secundaria
    else if (mm % 5 === 0) {
      markSize = 10;
    }

    marks.push(
      <div
        key={`v-${mm}`}
        className="ruler-mark"
        style={{
          top: `${px}px`,
          width: `${markSize}px`,
          borderTop: '1px solid #333',
          boxSizing: 'border-box'
        }}
        title={`${mm}mm`}
      >
        {label !== null && (
          <span className="ruler-label" style={{ position: 'absolute', top: '2px', right: '3px', fontSize: '9px', lineHeight: '1' }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="ruler ruler-vertical" style={{ width: `${RULER_WIDTH}px`, height: `${height}px`, margin: 0, padding: 0 }}>
      {marks}
    </div>
  );
};

export { HorizontalRuler, VerticalRuler, RULER_WIDTH, MM_TO_PX };
