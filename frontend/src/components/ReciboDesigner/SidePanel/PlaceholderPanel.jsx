import React, { useState } from 'react';
import { useReciboDesignerStore } from '../../../stores/reciboDesigner.store';
import { PLACEHOLDER_CATEGORIES, formatPlaceholder } from '../../../constants/placeholders';

export const PlaceholderPanel = () => {
  const { activeCellPos, updateCellContent } = useReciboDesignerStore();
  const [expandedCategory, setExpandedCategory] = useState('recibo');

  const handleInsertPlaceholder = (placeholderName) => {
    if (!activeCellPos) {
      alert('Selecciona una celda primero');
      return;
    }

    const ref = useReciboDesignerStore.getState().activeCellRef;
    if (!ref?.current) {
      alert('No hay celda activa');
      return;
    }

    ref.current.focus();
    const sel = window.getSelection();
    if (!sel?.rangeCount) {
      return;
    }

    const range = sel.getRangeAt(0);
    const placeholder = formatPlaceholder(placeholderName);
    range.insertNode(document.createTextNode(placeholder));
    range.collapse(false);

    updateCellContent(activeCellPos.row, activeCellPos.col, ref.current.innerText);
  };

  return (
    <div>
      {Object.entries(PLACEHOLDER_CATEGORIES).map(([categoryKey, category]) => (
        <div key={categoryKey} style={{ marginBottom: '12px' }}>
          <button
            onClick={() => setExpandedCategory(
              expandedCategory === categoryKey ? null : categoryKey
            )}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              backgroundColor: expandedCategory === categoryKey ? '#f3f4f6' : 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <span>{category.label}</span>
            <span style={{
              display: 'inline-block',
              transform: expandedCategory === categoryKey ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}>
              ▼
            </span>
          </button>

          {expandedCategory === categoryKey && (
            <div style={{
              marginTop: '6px',
              padding: '8px',
              backgroundColor: '#f9fafb',
              borderRadius: '3px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {category.items.map((item) => (
                <button
                  key={item}
                  onClick={() => handleInsertPlaceholder(item)}
                  disabled={!activeCellPos}
                  style={{
                    padding: '6px 8px',
                    fontSize: '11px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    backgroundColor: 'white',
                    cursor: !activeCellPos ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    opacity: !activeCellPos ? 0.5 : 1,
                    transition: 'all 0.2s',
                    color: '#1f2937',
                  }}
                  onMouseEnter={(e) => {
                    if (activeCellPos) {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                      e.currentTarget.style.borderColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                >
                  {formatPlaceholder(item)}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {!activeCellPos && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef3c7',
          borderRadius: '3px',
          fontSize: '11px',
          color: '#92400e',
          marginTop: '12px',
        }}>
          Selecciona una celda para insertar placeholders
        </div>
      )}
    </div>
  );
};
