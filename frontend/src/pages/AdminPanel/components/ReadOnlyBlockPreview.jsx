import React from 'react';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';

const MM_TO_PX = 3.7795;

/**
 * ReadOnlyBlockPreview
 * Renderiza un bloque de forma read-only en los recibos de vista previa (recibos 2+)
 *
 * @param {Object} block - {id, x, y, width, height, contenido} en mm
 * @param {Object} reciboSize - {x, y, width, height} en mm (posición del recibo)
 */
const ReadOnlyBlockPreview = ({ block, reciboSize, personData }) => {
  if (!block || !reciboSize) {
    return null;
  }

  // Convertir posición y tamaño de mm a píxeles
  const posX = block.x * MM_TO_PX;
  const posY = block.y * MM_TO_PX;
  const width = block.width * MM_TO_PX;
  const height = block.height * MM_TO_PX;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '2px solid #ccc',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        padding: '8px',
        overflow: 'hidden',
        fontSize: '12px',
        lineHeight: '1.4'
      }}
      className="read-only-block-preview"
    >
      <div
        style={{ height: '100%', overflow: 'hidden' }}
        dangerouslySetInnerHTML={{
          __html: replacePlaceholders(block.contenido || '<p style="color: #999;">Sin contenido</p>', personData)
        }}
      />
    </div>
  );
};

export default ReadOnlyBlockPreview;
