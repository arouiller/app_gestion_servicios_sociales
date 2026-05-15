import { useState, useMemo, useEffect } from 'react';

function usePagination(items, defaultItemsPerPage = 15, configItemsPerPage = null) {
  const [currentPage, setCurrentPage] = useState(1);
  // Usar configItemsPerPage si está disponible (incluyendo 0), sino usar defaultItemsPerPage
  const [itemsPerPage, setItemsPerPage] = useState(configItemsPerPage ?? defaultItemsPerPage);

  // Actualizar itemsPerPage cuando configItemsPerPage cambia
  useEffect(() => {
    if (configItemsPerPage !== null && configItemsPerPage !== undefined) {
      setItemsPerPage(configItemsPerPage);
      setCurrentPage(1); // Reset a página 1 cuando cambia el tamaño
    }
  }, [configItemsPerPage]);

  // Resetear a página 1 cuando los items cambian significativamente
  // (esto maneja filtros, búsquedas, y cambios de datos)
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]); // Depender solo de la longitud para evitar renders excesivos

  const totalItems = Array.isArray(items) ? items.length : 0;

  // Caso especial: items_per_page = 0 significa mostrar todos sin paginar
  const sinPaginado = itemsPerPage === 0;
  const totalPages = sinPaginado ? 1 : (Math.ceil(totalItems / itemsPerPage) || 1);

  // Validar que currentPage esté dentro de rango
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  // Calcular índices para slice
  const startIndex = sinPaginado ? 0 : (validPage - 1) * itemsPerPage;
  const endIndex = sinPaginado ? totalItems : startIndex + itemsPerPage;

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
    showPagination: totalItems > 10 && !sinPaginado,
  };
}

export default usePagination;
