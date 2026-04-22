import React from 'react';
import './Pagination.scss';

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, currentPage + 3);

    if (endPage - startPage < maxVisible) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisible - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="pagination">
      <div className="pagination__info">
        <span className="pagination__text">
          Mostrando {startItem}-{endItem} de {totalItems} registros
        </span>
        <div className="pagination__items-per-page">
          <label htmlFor="items-select">Por página:</label>
          <select
            id="items-select"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            className="pagination__select"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="pagination__controls">
        <button
          className="pagination__button pagination__button--prev"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          title="Página anterior"
        >
          ← Anterior
        </button>

        <div className="pagination__numbers">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`dots-${index}`} className="pagination__dots">
                ...
              </span>
            ) : (
              <button
                key={page}
                className={`pagination__number ${
                  page === currentPage ? 'pagination__number--active' : ''
                }`}
                onClick={() => onPageChange(page)}
                disabled={page === currentPage}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          className="pagination__button pagination__button--next"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          title="Próxima página"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

export default Pagination;
