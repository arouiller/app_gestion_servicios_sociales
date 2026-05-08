import { useState } from 'react';

/**
 * Hook para manejar ordenamiento dinámico en tablas
 * @param {string} storageKey - Key para localStorage (e.g., 'gestion-planes-sort')
 * @param {string} defaultSortBy - Columna de ordenamiento por defecto
 * @param {string} defaultOrder - 'ASC' o 'DESC' por defecto
 * @returns {Object} { sortBy, order, handleSort, getSortIcon }
 */
function useSortable(storageKey, defaultSortBy = '', defaultOrder = 'ASC') {
  // Leer localStorage sincronizadamente en la inicialización (evita doble render)
  const getInitialSort = () => {
    const savedSort = localStorage.getItem(storageKey);
    if (savedSort) {
      try {
        const { sortBy: saved, order: savedOrder } = JSON.parse(savedSort);
        return { sortBy: saved, order: savedOrder };
      } catch (e) {
        console.warn(`Failed to load sort preference for ${storageKey}:`, e);
        return { sortBy: defaultSortBy, order: defaultOrder };
      }
    }
    return { sortBy: defaultSortBy, order: defaultOrder };
  };

  const { sortBy: initialSortBy, order: initialOrder } = getInitialSort();
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [order, setOrder] = useState(initialOrder);

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
