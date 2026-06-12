import React, { useState, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useTemplateStore from '../../../hooks/useTemplateStore';

const MM_TO_PX = 3.7795; // Conversión: 1mm = 96/25.4 px a 96 DPI

const GenericBlock = ({ block, reciboSize, isSelected, onSelect, onUpdate, onDelete }) => {
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Límites máximos basados en el tamaño del recibo (en píxeles)
  const limits = useMemo(() => {
    if (!reciboSize) {
      return {
        maxWidth: Infinity,
        maxHeight: Infinity
      };
    }

    return {
      maxWidth: reciboSize.width * MM_TO_PX,
      maxHeight: reciboSize.height * MM_TO_PX
    };
  }, [reciboSize]);

  const handleDragStop = (e, d) => {
    // Convertir píxeles a mm
    let x = d.x / MM_TO_PX;
    let y = d.y / MM_TO_PX;

    if (reciboSize) {
      x = Math.max(x, reciboSize.x);
      x = Math.min(x, reciboSize.x + reciboSize.width - block.width);
      y = Math.max(y, reciboSize.y);
      y = Math.min(y, reciboSize.y + reciboSize.height - block.height);
    }

    onUpdate({ ...block, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    // Convertir píxeles a mm
    let x = position.x / MM_TO_PX;
    let y = position.y / MM_TO_PX;
    let width = block.width + (delta.width / MM_TO_PX);
    let height = block.height + (delta.height / MM_TO_PX);

    if (reciboSize) {
      x = Math.max(x, reciboSize.x);
      y = Math.max(y, reciboSize.y);

      if (x + width > reciboSize.x + reciboSize.width) {
        width = reciboSize.x + reciboSize.width - x;
      }

      if (y + height > reciboSize.y + reciboSize.height) {
        height = reciboSize.y + reciboSize.height - y;
      }
    }

    onUpdate({
      ...block,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      width: Math.max(30, Math.round(width * 100) / 100),
      height: Math.max(20, Math.round(height * 100) / 100)
    });
  };

  const handleContentChange = (content) => {
    onUpdate({ ...block, contenido: content });
  };

  return (
    <div>
      <Rnd
        default={{
          x: block.x * MM_TO_PX,
          y: block.y * MM_TO_PX,
          width: block.width * MM_TO_PX,
          height: block.height * MM_TO_PX
        }}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        minWidth={30 * MM_TO_PX}
        minHeight={20 * MM_TO_PX}
        maxWidth={limits.maxWidth}
        maxHeight={limits.maxHeight}
        disableDragging={false}
        enableResizing={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
          topLeft: true
        }}
        className={`generic-block ${isSelected ? 'selected' : ''}`}
        style={{
          position: 'absolute',
          border: isSelected ? '2px solid #0066cc' : '2px solid #007bff',
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '8px',
          zIndex: isSelected ? 100 : 10,
          touchAction: 'none',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={onSelect}
      >
        {isEditingContent ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ReactQuill
              value={block.contenido || ''}
              onChange={handleContentChange}
              theme="snow"
              style={{ flex: 1, height: '100%' }}
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'size': ['small', false, 'large', 'huge'] }],
                  ['link', 'image']
                ]
              }}
            />
          </div>
        ) : (
          <div
            style={{ height: '100%', fontSize: '12px', overflow: 'hidden' }}
            onClick={() => setIsEditingContent(true)}
            dangerouslySetInnerHTML={{ __html: block.contenido || '<p style="color: #999;">Click para editar</p>' }}
          />
        )}
      </Rnd>

      {isSelected && (
        <button
          onClick={onDelete}
          style={{
            position: 'absolute',
            top: block.y - 25,
            left: block.x,
            padding: '4px 8px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px',
            zIndex: 200
          }}
        >
          🗑️ Eliminar
        </button>
      )}
    </div>
  );
};

export default GenericBlock;
