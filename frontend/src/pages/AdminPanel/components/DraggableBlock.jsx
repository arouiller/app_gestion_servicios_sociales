import React, { useMemo } from 'react';
import { Rnd } from 'react-rnd';
import useTemplateStore from '../../../hooks/useTemplateStore';
import { calculateRecibosPositions } from './PageGuides';

const DraggableBlock = ({ blockName, children, reciboSize, reciboOffset = { x: 0, y: 0 } }) => {
  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);

  const positions = currentTemplate.bloque_positions || {};
  const blockPos = positions[blockName] || { x: 10, y: 10, width: 190, height: 50 };

  // Convertir posición relativa al recibo a posición absoluta en la página
  const absolutePos = {
    x: blockPos.x + reciboOffset.x,
    y: blockPos.y + reciboOffset.y,
    width: blockPos.width,
    height: blockPos.height
  };

  // Calcular límites máximos basado en el tamaño disponible del recibo
  // y restricciones de drag para que no salga del recibo
  const maxDimensions = useMemo(() => {
    if (!reciboSize) {
      return {
        maxWidth: Infinity,
        maxHeight: Infinity,
        dragBounds: undefined
      };
    }

    // Límites de drag: el bloque no puede salir del recibo
    const dragBounds = {
      left: reciboSize.x,
      top: reciboSize.y,
      right: reciboSize.x + reciboSize.width - blockPos.width,
      bottom: reciboSize.y + reciboSize.height - blockPos.height
    };

    return {
      maxWidth: reciboSize.width + (reciboSize.x - blockPos.x),
      maxHeight: reciboSize.height + (reciboSize.y - blockPos.y),
      dragBounds
    };
  }, [reciboSize, blockPos]);

  const handleDragStop = (e, d) => {
    // Convertir posición absoluta a relativa del recibo
    let x = d.x - reciboOffset.x;
    let y = d.y - reciboOffset.y;

    if (reciboSize) {
      // Restringir dentro de los límites del recibo (en coordenadas relativas)
      x = Math.max(x, 0);
      x = Math.min(x, reciboSize.width - blockPos.width);
      y = Math.max(y, 0);
      y = Math.min(y, reciboSize.height - blockPos.height);
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
    // Convertir posición absoluta a relativa del recibo
    let x = position.x - reciboOffset.x;
    let y = position.y - reciboOffset.y;
    let width = blockPos.width + delta.width;
    let height = blockPos.height + delta.height;

    if (reciboSize) {
      // Asegurar que no sale del recibo (en coordenadas relativas)
      x = Math.max(x, 0);
      y = Math.max(y, 0);

      // Asegurar que el lado derecho no supera el recibo
      if (x + width > reciboSize.width) {
        width = reciboSize.width - x;
      }

      // Asegurar que el lado inferior no supera el recibo
      if (y + height > reciboSize.height) {
        height = reciboSize.height - y;
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
        x: absolutePos.x,
        y: absolutePos.y,
        width: absolutePos.width,
        height: absolutePos.height
      }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={30}
      minHeight={20}
      maxWidth={maxDimensions.maxWidth}
      maxHeight={maxDimensions.maxHeight}
      bounds={maxDimensions.dragBounds}
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
