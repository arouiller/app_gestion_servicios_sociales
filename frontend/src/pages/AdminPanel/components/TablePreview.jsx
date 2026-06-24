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

const TablePreviewRecibo = ({ tabla, recibo, pageConfig, personData, onCellDoubleClick, onCellClick, onContextMenu, selectedCellId }) => {
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const containerRef = useRef(null);

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
        {/* Tabla raíz: 1 celda por fila, cada celda contiene una tabla interna */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: `${tabla.tamanoFuente || 11}px`,
            fontFamily: 'Arial, sans-serif',
            height: '100%'
          }}
        >
          <tbody>
            {tabla.filas.map((fila, filaIdx) => {
              const altura = fila.altura || 15;
              const anchoTotal = tabla.anchoTotal_mm || 170;

              return (
                <tr key={`row-${fila.id}`} style={{ height: `${altura}mm`, padding: 0 }}>
                  <td style={{ padding: 0, border: tabla.bordeTabla ? '1px solid #000' : 'none', width: '100%' }}>
                    {/* Tabla interna: 1 fila, M columnas con anchos independientes */}
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        height: '100%'
                      }}
                    >
                      <tbody>
                        <tr>
                          {fila.celdas.map((celda) => {
                            let contenido = celda.contenido || '';
                            if (personData) {
                              contenido = replacePlaceholders(contenido, personData);
                            }
                            const anchoMM = celda.ancho_mm || celda.ancho;
                            const anchoPorcentaje = (anchoMM / anchoTotal) * 100;
                            const isSelected = selectedCellId === celda.id;
                            console.log(`[TablePreview] Fila ${filaIdx}, Celda: ancho_mm=${celda.ancho_mm}, anchoPorcentaje=${anchoPorcentaje.toFixed(2)}%`);

                            return (
                              <td
                                key={`cell-${celda.id}`}
                                style={{
                                  width: `${anchoPorcentaje}%`,
                                  padding: '4px',
                                  border: isSelected ? '2px solid #4dabf7' : tabla.bordeTabla ? '1px solid #000' : 'none',
                                  verticalAlign: 'top',
                                  fontSize: 'inherit',
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#e8f4f8' : 'transparent',
                                  minWidth: '0'
                                }}
                                onDoubleClick={() => {
                                  if (onCellDoubleClick && recibo.number === 1) {
                                    onCellDoubleClick(fila, celda);
                                  }
                                }}
                                onClick={() => {
                                  if (onCellClick && recibo.number === 1) {
                                    onCellClick(fila, celda);
                                  }
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (onContextMenu && recibo.number === 1) {
                                    onContextMenu(e, fila, celda);
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
                      </tbody>
                    </table>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

const TablePreview = ({ tabla, reciboPositions, pageConfig, personData, onCellDoubleClick, onCellClick, onContextMenu, selectedCellId }) => {
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
          onCellClick={onCellClick}
          onContextMenu={onContextMenu}
          selectedCellId={selectedCellId}
        />
      ))}
    </>
  );
};

export default TablePreview;
