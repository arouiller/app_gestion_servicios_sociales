import { useRef } from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

export const useRowResize = () => {
  const dragState = useRef(null);
  const setRowHeight = useReciboDesignerStore((s) => s.setRowHeight);

  const onHandleMouseDown = (e, rowIndex) => {
    e.preventDefault();
    e.stopPropagation();

    const trEl = e.target.closest('tr');
    const currentHeight = trEl?.getBoundingClientRect().height ?? 32;

    dragState.current = {
      rowIndex,
      startY: e.clientY,
      startHeight: currentHeight,
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!dragState.current) return;

    const d = dragState.current;
    const delta = e.clientY - d.startY;
    const newHeight = Math.max(16, d.startHeight + delta);

    setRowHeight(d.rowIndex, newHeight);
  };

  const onMouseUp = () => {
    dragState.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return { onHandleMouseDown };
};
