import React from 'react';
import './ActionButton.scss';

function ActionButton({
  variant = 'primary',
  size = 'medium',
  icon = null,
  children,
  disabled = false,
  title = '',
  onClick,
  className = ''
}) {
  const baseClass = 'action-button';
  const variantClass = `${baseClass}--${variant}`;
  const sizeClass = `${baseClass}--${size}`;
  const classes = variant === 'icon'
    ? `${baseClass} ${variantClass} ${className}`.trim()
    : `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {icon && <span className="action-button__icon">{icon}</span>}
      {children && <span className="action-button__text">{children}</span>}
    </button>
  );
}

export default ActionButton;
