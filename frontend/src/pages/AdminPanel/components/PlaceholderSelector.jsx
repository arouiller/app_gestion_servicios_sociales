import React, { useState, useEffect, useRef } from 'react';
import templateService from '../../../services/templateService';

const PlaceholderSelector = ({ textRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placeholders, setPlaceholders] = useState({});
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadPlaceholders();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPlaceholders = async () => {
    setLoading(true);
    const result = await templateService.getPlaceholders();
    if (result.success) {
      setPlaceholders(result.placeholders);
    }
    setLoading(false);
  };

  const handleSelectPlaceholder = (placeholder) => {
    if (textRef?.current) {
      const textarea = textRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const text = textarea.value;

      const newText = text.substring(0, start) + placeholder + text.substring(end);
      textarea.value = newText;

      // Trigger change event
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      // Position cursor after inserted text
      setTimeout(() => {
        textarea.selectionStart = start + placeholder.length;
        textarea.selectionEnd = start + placeholder.length;
        textarea.focus();
      }, 0);
    }

    setIsOpen(false);
  };

  if (loading) {
    return <button className="btn-sm btn-icon" disabled>+</button>;
  }

  return (
    <div className="placeholder-selector" ref={dropdownRef}>
      <button
        className="btn-sm btn-icon"
        onClick={() => setIsOpen(!isOpen)}
        title="Insertar placeholder"
      >
        +
      </button>

      {isOpen && (
        <div className="placeholder-dropdown">
          {Object.entries(placeholders).map(([category, items]) => (
            <div key={category} className="placeholder-category">
              <h4>{category}</h4>
              <div className="placeholder-items">
                {items.map((placeholder) => (
                  <button
                    key={placeholder}
                    className="placeholder-item"
                    onClick={() => handleSelectPlaceholder(placeholder)}
                    title={placeholder}
                  >
                    {placeholder}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceholderSelector;
