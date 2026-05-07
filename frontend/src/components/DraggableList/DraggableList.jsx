import React, { useState, useRef } from 'react';
import './DraggableList.scss';

/**
 * Componente reutilizable para listas reordenables con drag & drop
 * Soporta mouse y touch events
 *
 * Props:
 * - items: Array de items a renderizar
 * - onReorder: Callback(newItems) cuando el usuario suelta un item
 * - renderItem: Function(item, index) → JSX para cada item
 * - itemKey: String (nombre de propiedad única para key) o Function(item) → string
 */
const DraggableList = ({ items, onReorder, renderItem, itemKey = 'id' }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const containerRef = useRef(null);

  const getItemKey = (item) => {
    if (typeof itemKey === 'function') return itemKey(item);
    return item[itemKey];
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === index) return;

    // Crear array nuevo reordenado
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(null);
    onReorder(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch support (simple: drag en mobile)
  const handleTouchStart = (e, index) => {
    setDraggedIndex(index);
  };

  const handleTouchMove = (e, index) => {
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  };

  const handleTouchEnd = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);
    onReorder(newItems);
  };

  return (
    <div ref={containerRef} className="draggable-list">
      {items.map((item, index) => (
        <div
          key={getItemKey(item)}
          className={`draggable-list__item ${
            draggedIndex === index ? 'is-dragging' : ''
          } ${dragOverIndex === index ? 'is-drag-over' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          onTouchStart={(e) => handleTouchStart(e, index)}
          onTouchMove={(e) => handleTouchMove(e, index)}
          onTouchEnd={(e) => handleTouchEnd(e, index)}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

export default DraggableList;
