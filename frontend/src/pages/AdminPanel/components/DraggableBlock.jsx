import React, { useMemo } from 'react';
import { Rnd } from 'react-rnd';
import useTemplateStore from '../../../hooks/useTemplateStore';
import { calculateRecibosPositions } from './PageGuides';

const DraggableBlock = ({ blockName, children, reciboSize }) => {
  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);

  const positions = currentTemplate.bloque_positions || {};
  const blockPos = positions[blockName] || { x: 10, y: 10, width: 190, height: 50 };

  // Calcular límites máximos y de drag basado en el tamaño disponible del recibo
  const limits = useMemo(() => {
    if (!reciboSize) {
      return {
        maxWidth: Infinity,
        maxHeight: Infinity
      };
    }

    // Espacio disponible desde la posición actual hasta los bordes del recibo
    const maxWidth = reciboSize.width - (blockPos.x - reciboSize.x);
    const maxHeight = reciboSize.height - (blockPos.y - reciboSize.y);

    return {
      maxWidth: Math.max(maxWidth, 30),
      maxHeight: Math.max(maxHeight, 20)
    };
  }, [reciboSize, blockPos]);

  const handleDragStop = (e, d) => {
    let x = d.x;
    let y = d.y;

    if (reciboSize) {
      // Restringir dentro de los límites del recibo
      x = Math.max(x, reciboSize.x);
      x = Math.min(x, reciboSize.x + reciboSize.width - blockPos.width);
      y = Math.max(y, reciboSize.y);
      y = Math.min(y, reciboSize.y + reciboSize.height - blockPos.height);
    }

    const newPositions = {
      ...positions,
      [blockName]: {
        ...blockPos,
        x,
        y
      }
    };
    updateTemplate({ bloque_positions: newPositions });
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    let x = position.x;
    let y = position.y;
    let width = blockPos.width + delta.width;
    let height = blockPos.height + delta.height;

    if (reciboSize) {
      // Asegurar que no sale del recibo
      x = Math.max(x, reciboSize.x);
      y = Math.max(y, reciboSize.y);

      // Asegurar que el lado derecho no supera el recibo
      if (x + width > reciboSize.x + reciboSize.width) {
        width = reciboSize.x + reciboSize.width - x;
      }

      // Asegurar que el lado inferior no supera el recibo
      if (y + height > reciboSize.y + reciboSize.height) {
        height = reciboSize.y + reciboSize.height - y;
      }
    }

    const newPositions = {
      ...positions,
      [blockName]: {
        x,
        y,
        width: Math.max(30, width),
        height: Math.max(20, height)
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
