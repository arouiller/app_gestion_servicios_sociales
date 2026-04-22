import { useState, useMemo } from 'react';

function usePagination(items, defaultItemsPerPage = 15) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Validar que currentPage esté dentro de rango
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  // Calcular índices para slice
  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Ítems paginados
  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const handleChangePage = (newPage) => {
    const page = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(page);
  };

  const handleChangeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    paginatedItems,
    currentPage: validPage,
    totalPages,
    totalItems,
    itemsPerPage,
    handleChangePage,
    handleChangeItemsPerPage,
    resetPage,
    showPagination: totalItems > 10,
  };
}

export default usePagination;
