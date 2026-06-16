import React, { useState, useMemo, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { replacePlaceholders } from '../../../utils/placeholderReplacer';
import useTemplateStore from '../../../hooks/useTemplateStore';

const MM_TO_PX = 3.7795; // Conversión: 1mm = 96/25.4 px a 96 DPI

/**
 * Calcula los límites (en mm) dentro de los cuales un bloque puede moverse/redimensionarse
 * @param {Object} block - {x, y, width, height} en mm
 * @param {Object} reciboSize - {x, y, width, height} en mm
 * @returns {Object} - {minX, minY, maxX, maxY, maxWidth, maxHeight} en mm
 */
const calculateBlockLimits = (block, reciboSize) => {
  if (!reciboSize) {
    return {
      minX: -Infinity,
      minY: -Infinity,
      maxX: Infinity,
      maxY: Infinity,
      maxWidth: Infinity,
      maxHeight: Infinity
    };
  }

  return {
    minX: reciboSize.x,
    minY: reciboSize.y,
    maxX: reciboSize.x + reciboSize.width - block.width,
    maxY: reciboSize.y + reciboSize.height - block.height,
    maxWidth: reciboSize.width,
    maxHeight: reciboSize.height
  };
};

const GenericBlock = ({
  block,
  reciboSize,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isEditing,
  onDoubleClick,
  onClickOutside,
  personData
}) => {
  const [isEditingContent, setIsEditingContent] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e) => {
      const blockElement = document.querySelector(`[data-block-id="${block.id}"]`);
      const toolbarContainerElement = document.querySelector('.editor-toolbar-container');

      // No desactivar si se clickeó en el bloque o en la barra de edición/botón guardar
      if (blockElement && blockElement.contains(e.target)) return;
      if (toolbarContainerElement && toolbarContainerElement.contains(e.target)) return;

      onClickOutside();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, block.id, onClickOutside]);

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

    const limits = calculateBlockLimits(block, reciboSize);

    // Aplicar límites: el bloque nunca sale del recibo
    x = Math.max(x, limits.minX);
    x = Math.min(x, limits.maxX);
    y = Math.max(y, limits.minY);
    y = Math.min(y, limits.maxY);

    onUpdate({ ...block, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    // Convertir píxeles a mm
    let x = position.x / MM_TO_PX;
    let y = position.y / MM_TO_PX;
    let width = block.width + (delta.width / MM_TO_PX);
    let height = block.height + (delta.height / MM_TO_PX);

    const limits = calculateBlockLimits(block, reciboSize);

    // Aplicar límites: el bloque nunca sale del recibo
    x = Math.max(x, limits.minX);
    y = Math.max(y, limits.minY);

    // Asegurar que el bloque no crece más allá del borde derecho/inferior
    width = Math.min(width, limits.maxWidth);
    height = Math.min(height, limits.maxHeight);

    // Si se acerca al borde, reducir ancho/alto
    if (x + width > limits.minX + limits.maxWidth) {
      width = limits.minX + limits.maxWidth - x;
    }
    if (y + height > limits.minY + limits.maxHeight) {
      height = limits.minY + limits.maxHeight - y;
    }

    onUpdate({
      ...block,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      width: Math.max(5, Math.round(width * 100) / 100),
      height: Math.max(5, Math.round(height * 100) / 100)
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
        minWidth={5 * MM_TO_PX}
        minHeight={5 * MM_TO_PX}
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
        data-block-id={block.id}
        className={`generic-block ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
        style={{
          position: 'absolute',
          border: isEditing ? '3px solid #28a745' : '2px solid #4dabf7',
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '8px',
          zIndex: isSelected ? 100 : 10,
          touchAction: 'none',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: isEditing ? '0 0 0 2px rgba(40, 167, 69, 0.1)' : 'none'
        }}
        onClick={(e) => {
          onSelect();
          if (e.detail === 2) {
            onDoubleClick(block.id, block.contenido || '');
          }
        }}
      >
        {isEditing ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '12px'
            }}
          >
            👆 Editando en la barra superior
          </div>
        ) : (
          <div
            style={{ height: '100%', fontSize: '12px', overflow: 'hidden' }}
            dangerouslySetInnerHTML={{
              __html: replacePlaceholders(block.contenido || '<p style="color: #999;">Haz doble click para editar</p>', personData)
            }}
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
