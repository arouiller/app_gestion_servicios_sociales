import React, { useState, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useTemplateStore from '../../../hooks/useTemplateStore';

const GenericBlock = ({ block, reciboSize, isSelected, onSelect, onUpdate, onDelete }) => {
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Calcular límites máximos basado en el tamaño disponible del recibo
  const limits = useMemo(() => {
    if (!reciboSize) {
      return {
        maxWidth: Infinity,
        maxHeight: Infinity
      };
    }

    const maxWidth = reciboSize.width - (block.x - reciboSize.x);
    const maxHeight = reciboSize.height - (block.y - reciboSize.y);

    return {
      maxWidth: Math.max(maxWidth, 30),
      maxHeight: Math.max(maxHeight, 20)
    };
  }, [reciboSize, block]);

  const handleDragStop = (e, d) => {
    let x = d.x;
    let y = d.y;

    if (reciboSize) {
      x = Math.max(x, reciboSize.x);
      x = Math.min(x, reciboSize.x + reciboSize.width - block.width);
      y = Math.max(y, reciboSize.y);
      y = Math.min(y, reciboSize.y + reciboSize.height - block.height);
    }

    onUpdate({ ...block, x, y });
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    let x = position.x;
    let y = position.y;
    let width = block.width + delta.width;
    let height = block.height + delta.height;

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
      x,
      y,
      width: Math.max(30, width),
      height: Math.max(20, height)
    });
  };

  const handleContentChange = (content) => {
    onUpdate({ ...block, contenido: content });
  };

  return (
    <div>
      <Rnd
        default={{
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height
        }}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        minWidth={30}
        minHeight={20}
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
