import React from 'react';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';

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

const TablePreview = ({ tabla, reciboPositions, personData }) => {
  if (!tabla || tabla.type !== 'tabla' || !reciboPositions || !reciboPositions.recibos) {
    return null;
  }

  return (
    <>
      {reciboPositions.recibos.map((recibo) => (
        <div
          key={`tabla-recibo-${recibo.number}`}
          style={{
            position: 'absolute',
            left: `${recibo.x * MM_TO_PX}px`,
            top: `${recibo.y * MM_TO_PX}px`,
            width: `${recibo.width * MM_TO_PX}px`,
            height: `${recibo.height * MM_TO_PX}px`,
            overflow: 'hidden',
            backgroundColor: 'white',
            border: `2px solid ${recibo.number === 1 ? '#333' : '#999'}`,
            boxSizing: 'border-box'
          }}
          className={`tabla-preview recibo-${recibo.number}`}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              fontSize: '11px',
              lineHeight: '1.2'
            }}
            dangerouslySetInnerHTML={{ __html: renderTablaHTML(tabla, personData) }}
          />
        </div>
      ))}
    </>
  );
};

export default TablePreview;
