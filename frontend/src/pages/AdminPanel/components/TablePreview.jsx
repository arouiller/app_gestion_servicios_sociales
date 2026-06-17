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

const TablePreviewRecibo = ({ tabla, recibo, personData }) => {
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const [resizingFila, setResizingFila] = useState(null);
  const [resizingCelda, setResizingCelda] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!resizingFila && !resizingCelda) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      if (resizingFila) {
        const nuevaAltura = (e.clientY - rect.top) / MM_TO_PX / (resizingFila.index + 1);
        const nuevaTabla = updateFilaAltura(tabla, resizingFila.id, nuevaAltura);
        updateTemplate({ bloques: [nuevaTabla] });
      }

      if (resizingCelda) {
        const nuevoAncho = (e.clientX - rect.left) / MM_TO_PX;
        const nuevaTabla = updateCeldaAncho(tabla, resizingCelda.rowId, resizingCelda.id, nuevoAncho);
        updateTemplate({ bloques: [nuevaTabla] });
      }
    };

    const handleMouseUp = () => {
      setResizingFila(null);
      setResizingCelda(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingFila, resizingCelda, tabla, updateTemplate]);

  const filasHTML = tabla.filas
    .map((fila, filaIdx) => {
      const altura = fila.altura || 15;
      const celdasHTML = fila.celdas
        .map((celda) => {
          let contenido = celda.contenido || '';
          if (personData) {
            contenido = replacePlaceholders(contenido, personData);
          }
          return `<td style="width: ${celda.ancho}%; padding: 4px; border: ${tabla.bordeTabla ? '1px solid #000' : 'none'}; vertical-align: top; font-size: inherit; position: relative;">${contenido}</td>`;
        })
        .join('');
      return `<tr style="height: ${altura}mm;">${celdasHTML}</tr>`;
    })
    .join('');

  const tableHTML = `<table style="width: 100%; border-collapse: collapse; font-size: ${tabla.tamanoFuente || 11}px; font-family: Arial, sans-serif; table-layout: fixed;">
<tbody>
${filasHTML}
</tbody>
</table>`;

  return (
    <div
      key={`tabla-recibo-${recibo.number}`}
      ref={containerRef}
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
        dangerouslySetInnerHTML={{ __html: tableHTML }}
      />
      {recibo.number === 1 && (
        <>
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
                zIndex: 10
              }}
              onMouseDown={() => setResizingFila({ id: fila.id, index: filaIdx })}
              title="Arrastra para cambiar altura de fila"
            />
          ))}
        </>
      )}
    </div>
  );
};

const TablePreview = ({ tabla, reciboPositions, personData }) => {
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
          personData={personData}
        />
      ))}
    </>
  );
};

export default TablePreview;
