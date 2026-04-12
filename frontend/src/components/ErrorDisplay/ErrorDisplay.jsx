import React from 'react';
import './ErrorDisplay.scss';

const ErrorDisplay = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="error-overlay" onClick={onClose}>
      <div className="error-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
