import { useState, useEffect } from 'react';

/**
 * Hook para manejar ordenamiento dinámico en tablas
 * @param {string} storageKey - Key para localStorage (e.g., 'gestion-planes-sort')
 * @param {string} defaultSortBy - Columna de ordenamiento por defecto
 * @param {string} defaultOrder - 'ASC' o 'DESC' por defecto
 * @returns {Object} { sortBy, order, handleSort, getSortIcon }
 */
function useSortable(storageKey, defaultSortBy = '', defaultOrder = 'ASC') {
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [order, setOrder] = useState(defaultOrder);

  // Load saved sort preference from localStorage on mount
  useEffect(() => {
    const savedSort = localStorage.getItem(storageKey);
    if (savedSort) {
      try {
        const { sortBy: saved, order: savedOrder } = JSON.parse(savedSort);
        setSortBy(saved);
        setOrder(savedOrder);
      } catch (e) {
        console.warn(`Failed to load sort preference for ${storageKey}:`, e);
      }
    }
  }, [storageKey]);

  // Handle column header click
  const handleSort = (column) => {
    let newOrder = 'ASC';
    // If clicking same column, toggle order
    if (sortBy === column) {
      newOrder = order === 'ASC' ? 'DESC' : 'ASC';
    }
    setSortBy(column);
    setOrder(newOrder);

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify({ sortBy: column, order: newOrder }));
  };

  // Get sort icon for a column (↑ for ASC, ↓ for DESC)
  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return order === 'ASC' ? ' ↑' : ' ↓';
  };

  return {
    sortBy,
    order,
    handleSort,
    getSortIcon,
  };
}

export default useSortable;
