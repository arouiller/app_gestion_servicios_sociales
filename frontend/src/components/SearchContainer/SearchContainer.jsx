import React from 'react';
import './SearchContainer.scss';

function SearchContainer({
  placeholder = 'Buscar...',
  value,
  onChange,
  count = 0,
  maxItems = 20
}) {
  return (
    <div className="search-container">
      <div className="search-container__input-wrapper">
        <input
          type="text"
          className="search-container__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search"
        />
        <span className="search-container__icon">🔍</span>
      </div>
      {count > 0 && (
        <div className="search-container__info">
          {count} de {maxItems} resultados
        </div>
      )}
    </div>
  );
}

export default SearchContainer;
