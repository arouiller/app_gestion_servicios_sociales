import { useRef } from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

export const useTableSelection = () => {
  const isDragging = useRef(false);
  const setSelection = useReciboDesignerStore((s) => s.setSelection);

  const onCellMouseDown = (e, row, col) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    isDragging.current = true;
    setSelection({ anchor: { row, col }, focus: { row, col } });

    document.addEventListener('mouseup', onDocumentMouseUp);
  };

  const onCellMouseEnter = (row, col) => {
    if (!isDragging.current) return;

    const anchor = useReciboDesignerStore.getState().selection?.anchor;
    if (anchor) {
      setSelection({ anchor, focus: { row, col } });
    }
  };

  const onDocumentMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mouseup', onDocumentMouseUp);
  };

  return { onCellMouseDown, onCellMouseEnter };
};
