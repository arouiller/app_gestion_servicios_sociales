import React, { useState } from 'react';
import { PLACEHOLDER_CATEGORIES, formatPlaceholder } from '../../constants/placeholders';

export const PlaceholderSelector = ({ onCopy }) => {
  const [expandedCategory, setExpandedCategory] = useState('recibo');

  const handleCopy = (placeholder) => {
    const formatted = formatPlaceholder(placeholder);
    navigator.clipboard.writeText(formatted);
    if (onCopy) onCopy(formatted);
  };

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Placeholders</h3>
      {Object.entries(PLACEHOLDER_CATEGORIES).map(([key, category]) => (
        <div key={key} style={{ marginBottom: '10px' }}>
          <button
            className="recibo-designer__button recibo-designer__button--secondary"
            onClick={() =>
              setExpandedCategory(expandedCategory === key ? null : key)
            }
            style={{ width: '100%', textAlign: 'left' }}
          >
            {category.label}{' '}
            {expandedCategory === key ? '▼' : '▶'}
          </button>
          {expandedCategory === key && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {category.items.map((item) => (
                <button
                  key={item}
                  onClick={() => handleCopy(item)}
                  style={{
                    padding: '6px',
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '11px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#e0e0e0')}
                  onMouseLeave={(e) => (e.target.style.background = '#f0f0f0')}
                >
                  {formatPlaceholder(item)} (copiar)
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
