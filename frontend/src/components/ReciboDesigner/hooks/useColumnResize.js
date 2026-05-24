import { useRef } from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';

export const useColumnResize = (tableRef) => {
  const dragState = useRef(null);
  const setColumnWidths = useReciboDesignerStore((s) => s.setColumnWidths);

  const getWidths = () => useReciboDesignerStore.getState().table.columnWidths;

  const onHandleMouseDown = (e, colIndex) => {
    e.preventDefault();
    e.stopPropagation();

    dragState.current = {
      colIndex,
      startX: e.clientX,
      startWidths: [...getWidths()],
      tableWidth: tableRef.current?.getBoundingClientRect().width ?? 800,
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!dragState.current) return;

    const d = dragState.current;
    const delta = ((e.clientX - d.startX) / d.tableWidth) * 100;
    const newWidths = [...d.startWidths];
    const i = d.colIndex;

    if (i + 1 < newWidths.length) {
      newWidths[i] = Math.max(5, d.startWidths[i] + delta);
      newWidths[i + 1] = Math.max(5, d.startWidths[i + 1] - delta);
      setColumnWidths(newWidths);
    }
  };

  const onMouseUp = () => {
    dragState.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return { onHandleMouseDown };
};
