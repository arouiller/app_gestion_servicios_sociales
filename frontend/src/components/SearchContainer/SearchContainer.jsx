import React from 'react';
import './SearchContainer.scss';

function SearchContainer({
  placeholder = 'Buscar...',
  value,
  onChange
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
    </div>
  );
}

export default SearchContainer;
