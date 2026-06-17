import React from 'react';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';

const MM_TO_PX = 3.7795;

const TablePreview = ({ tabla, reciboPositions, personData }) => {
  if (!tabla || tabla.type !== 'tabla' || !reciboPositions) {
    return null;
  }

  const renderTabla = (tabla, personData) => {
    return (
      <table
        style={{
          width: '100%',
          height: '100%',
          borderCollapse: 'collapse',
          fontSize: `${tabla.tamanoFuente || 11}px`,
          fontFamily: 'Arial, sans-serif',
          tableLayout: 'fixed'
        }}
      >
        <tbody>
          {tabla.filas.map((fila) => (
            <tr key={fila.id}>
              {fila.celdas.map((celda) => {
                let contenido = celda.contenido || '';
                if (personData) {
                  contenido = replacePlaceholders(contenido, personData);
                }
                return (
                  <td
                    key={celda.id}
                    style={{
                      width: `${celda.ancho}%`,
                      padding: '4px',
                      verticalAlign: 'top',
                      wordBreak: 'break-word',
                      border: tabla.bordeTabla ? '1px solid #000' : '1px solid #ccc',
                      fontSize: 'inherit'
                    }}
                  >
                    <div
                      style={{ fontSize: 'inherit' }}
                      dangerouslySetInnerHTML={{ __html: contenido }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

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
            border: `1px solid ${recibo.number === 1 ? '#333' : '#ccc'}`,
            boxSizing: 'border-box'
          }}
          className={`tabla-preview recibo-${recibo.number}`}
        >
          {renderTabla(tabla, personData)}
        </div>
      ))}
    </>
  );
};

export default TablePreview;
