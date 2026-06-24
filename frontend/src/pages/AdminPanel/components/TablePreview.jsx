import React, { useState, useRef, useEffect } from 'react';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';
import useTemplateStore from '../../../hooks/useTemplateStore';
import { updateFilaAltura, updateCeldaAncho } from './TableEditor';

const MM_TO_PX = 3.7795;

const renderTablaHTML = (tabla, personData) => {
  const borderStyle = tabla.bordeTabla ? '1px solid #000' : 'none';

  const filasHTML = tabla.filas
    .map((fila) => {
      const celdasHTML = fila.celdas
        .map((celda) => {
          let contenido = celda.contenido || '';
          if (personData) {
            contenido = replacePlaceholders(contenido, personData);
          }
          return `<td style="width: ${celda.ancho}%; padding: 4px; border: ${borderStyle}; vertical-align: top; font-size: inherit;">${contenido}</td>`;
        })
        .join('');
      return `<tr>${celdasHTML}</tr>`;
    })
    .join('');

  return `<table style="width: 100%; border-collapse: collapse; font-size: ${tabla.tamanoFuente || 11}px; font-family: Arial, sans-serif; table-layout: fixed;">
<tbody>
${filasHTML}
</tbody>
</table>`;
};

const TablePreviewRecibo = ({ tabla, recibo, pageConfig, personData, onCellDoubleClick }) => {
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const [resizingFila, setResizingFila] = useState(null);
  const [resizingCelda, setResizingCelda] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!resizingFila && !resizingCelda) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current || !startPos) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - startPos.x;
      const deltaY = currentY - startPos.y;

      if (resizingFila) {
        const nuevaAltura = startPos.originalAltura + deltaY / MM_TO_PX;
        const nuevaTabla = updateFilaAltura(tabla, resizingFila.id, nuevaAltura);
        updateTemplate({ bloques: [nuevaTabla] });
      }

      if (resizingCelda) {
        const containerWidth = recibo.width * MM_TO_PX - 7.5;
        const nuevoAncho = startPos.originalAncho + (deltaX / containerWidth) * 100;
        const nuevaTabla = updateCeldaAncho(tabla, resizingCelda.rowId, resizingCelda.id, nuevoAncho);
        updateTemplate({ bloques: [nuevaTabla] });
      }
    };

    const handleMouseUp = () => {
      setResizingFila(null);
      setResizingCelda(null);
      setStartPos(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingFila, resizingCelda, startPos, tabla, updateTemplate, recibo.width]);

  // Usar tabla_ancho_mm y tabla_alto_mm del pageConfig si están disponibles
  const tablaAncho = pageConfig?.tabla_ancho_mm;
  const tablaAlto = pageConfig?.tabla_alto_mm;

  // Convertir de mm a píxeles
  const containerWidth = tablaAncho ? tablaAncho * MM_TO_PX : recibo.width * MM_TO_PX - 7.5;
  const containerHeight = tablaAlto ? tablaAlto * MM_TO_PX : recibo.height * MM_TO_PX;

  return (
    <div
      key={`tabla-recibo-${recibo.number}`}
      style={{
        position: 'absolute',
        left: `${recibo.x * MM_TO_PX}px`,
        top: `${recibo.y * MM_TO_PX}px`,
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        backgroundColor: 'white',
        border: `2px solid ${recibo.number === 1 ? '#333' : '#999'}`,
        boxSizing: 'border-box',
        overflow: 'visible'
      }}
      className={`tabla-preview recibo-${recibo.number}`}
    >
      {/* Contenedor interno con overflow hidden solo para la tabla */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: `${tabla.tamanoFuente || 11}px`,
            fontFamily: 'Arial, sans-serif',
            tableLayout: 'fixed',
            height: '100%'
          }}
        >
          <tbody>
            {tabla.filas.map((fila, filaIdx) => {
              const altura = fila.altura || 15;
              return (
                <tr key={`row-${fila.id}`} style={{ height: `${altura}mm` }}>
                  {fila.celdas.map((celda) => {
                    let contenido = celda.contenido || '';
                    if (personData) {
                      contenido = replacePlaceholders(contenido, personData);
                    }
                    return (
                      <td
                        key={`cell-${celda.id}`}
                        style={{
                          width: `${celda.ancho}%`,
                          padding: '4px',
                          border: tabla.bordeTabla ? '1px solid #000' : 'none',
                          verticalAlign: 'top',
                          fontSize: 'inherit',
                          position: 'relative',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer'
                        }}
                        onDoubleClick={() => {
                          if (onCellDoubleClick && recibo.number === 1) {
                            onCellDoubleClick(fila, celda);
                          }
                        }}
                      >
                        {contenido ? (
                          <div dangerouslySetInnerHTML={{ __html: contenido }} />
                        ) : (
                          <em style={{ color: '#ccc' }}>vacío</em>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Handles de resize FUERA del overflow: hidden */}
      {recibo.number === 1 && (
        <>
          {/* Handles de resize para FILAS */}
          {tabla.filas.map((fila, filaIdx) => (
            <div
              key={`resize-fila-${fila.id}`}
              style={{
                position: 'absolute',
                left: '0',
                top: `${tabla.filas.slice(0, filaIdx + 1).reduce((sum, f) => sum + (f.altura || 15), 0) * MM_TO_PX - 4}px`,
                width: '100%',
                height: '8px',
                cursor: 'row-resize',
                backgroundColor: resizingFila?.id === fila.id ? '#4dabf7' : 'transparent',
                zIndex: 10,
                pointerEvents: 'auto'
              }}
              onMouseDown={(e) => {
                setResizingFila({ id: fila.id, index: filaIdx });
                setStartPos({
                  x: e.clientX - containerRef.current.getBoundingClientRect().left,
                  y: e.clientY - containerRef.current.getBoundingClientRect().top,
                  originalAltura: fila.altura || 15
                });
              }}
              title="Arrastra para cambiar altura de fila"
            />
          ))}

          {/* Handles de resize para COLUMNAS */}
          {tabla.filas[0]?.celdas.map((celda, celdaIdx) => {
            // Calcular posición X del borde derecho de esta celda
            const anchoAcumulado = tabla.filas[0].celdas
              .slice(0, celdaIdx + 1)
              .reduce((sum, c) => sum + (c.ancho || 50), 0);
            const posX = (anchoAcumulado / 100) * containerWidth;

            return (
              <div
                key={`resize-celda-${celda.id}`}
                style={{
                  position: 'absolute',
                  left: `${posX - 4}px`,
                  top: '0',
                  width: '8px',
                  height: '100%',
                  cursor: 'col-resize',
                  backgroundColor: resizingCelda?.id === celda.id ? '#4dabf7' : 'transparent',
                  zIndex: 10,
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => {
                  setResizingCelda({ id: celda.id, rowId: tabla.filas[0].id, celdaIdx });
                  setStartPos({
                    x: e.clientX - containerRef.current.getBoundingClientRect().left,
                    y: e.clientY - containerRef.current.getBoundingClientRect().top,
                    originalAncho: celda.ancho || 50
                  });
                }}
                title="Arrastra para cambiar ancho de columna"
              />
            );
          })}
        </>
      )}
    </div>
  );
};

const TablePreview = ({ tabla, reciboPositions, pageConfig, personData, onCellDoubleClick }) => {
  if (!tabla || tabla.type !== 'tabla' || !reciboPositions || !reciboPositions.recibos) {
    return null;
  }

  return (
    <>
      {reciboPositions.recibos.map((recibo) => (
        <TablePreviewRecibo
          key={`tabla-recibo-${recibo.number}`}
          tabla={tabla}
          recibo={recibo}
          pageConfig={pageConfig}
          personData={personData}
          onCellDoubleClick={onCellDoubleClick}
        />
      ))}
    </>
  );
};

export default TablePreview;
