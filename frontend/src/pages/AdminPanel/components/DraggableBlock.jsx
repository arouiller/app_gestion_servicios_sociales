import React, { useMemo } from 'react';
import { Rnd } from 'react-rnd';
import useTemplateStore from '../../../hooks/useTemplateStore';
import { calculateRecibosPositions } from './PageGuides';

const DraggableBlock = ({ blockName, children, reciboSize }) => {
  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);

  const positions = currentTemplate.bloque_positions || {};
  const blockPos = positions[blockName] || { x: 10, y: 10, width: 190, height: 50 };

  // Calcular límites máximos basado en el tamaño disponible del recibo
  const maxDimensions = useMemo(() => {
    if (!reciboSize) {
      return { maxWidth: Infinity, maxHeight: Infinity };
    }
    return {
      maxWidth: reciboSize.width + (reciboSize.x - blockPos.x),
      maxHeight: reciboSize.height + (reciboSize.y - blockPos.y)
    };
  }, [reciboSize, blockPos]);

  const handleDragStop = (e, d) => {
    const newPositions = {
      ...positions,
      [blockName]: {
        ...blockPos,
        x: d.x,
        y: d.y
      }
    };
    updateTemplate({ bloque_positions: newPositions });
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    const newPositions = {
      ...positions,
      [blockName]: {
        x: position.x,
        y: position.y,
        width: blockPos.width + delta.width,
        height: blockPos.height + delta.height
      }
    };
    updateTemplate({ bloque_positions: newPositions });
  };

  return (
    <Rnd
      default={{
        x: blockPos.x,
        y: blockPos.y,
        width: blockPos.width,
        height: blockPos.height
      }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={30}
      minHeight={20}
      maxWidth={maxDimensions.maxWidth}
      maxHeight={maxDimensions.maxHeight}
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
      dragHandleClassName={`drag-handle-${blockName}`}
      className={`draggable-block ${blockName}`}
      style={{
        position: 'absolute',
        border: '2px solid #007bff',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        padding: '8px',
        zIndex: 10,
        touchAction: 'none'
      }}
    >
      <div className={`drag-handle-${blockName}`} style={{ cursor: 'move', marginBottom: '4px' }}>
        <small style={{ color: '#666', fontWeight: 'bold' }}>
          {blockName.charAt(0).toUpperCase() + blockName.slice(1)}
        </small>
      </div>
      <div style={{ overflow: 'hidden', height: '100%' }}>
        {children}
      </div>
    </Rnd>
  );
};

export default DraggableBlock;
