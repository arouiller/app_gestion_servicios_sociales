import { useState, useEffect, useRef, useCallback } from 'react';

const useColumnResize = (storageKey, defaultWidths) => {
  const [widths, setWidths] = useState(() => {
    try {
      const stored = localStorage.getItem(`columnWidths_${storageKey}`);
      return stored ? { ...defaultWidths, ...JSON.parse(stored) } : defaultWidths;
    } catch {
      return defaultWidths;
    }
  });

  const widthsRef = useRef(widths);
  useEffect(() => { widthsRef.current = widths; }, [widths]);

  const handleMouseDown = useCallback((colKey, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = widthsRef.current[colKey] ?? defaultWidths[colKey] ?? 120;

    const onMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(30, startWidth + delta);
      setWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };

    const onMouseUp = () => {
      try {
        localStorage.setItem(`columnWidths_${storageKey}`, JSON.stringify(widthsRef.current));
      } catch { /* localStorage no disponible */ }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [storageKey, defaultWidths]);

  const getResizeHandle = useCallback((colKey) => (
    <span
      className="resize-handle"
      onMouseDown={(e) => handleMouseDown(colKey, e)}
    />
  ), [handleMouseDown]);

  return { widths, getResizeHandle };
};

export default useColumnResize;
