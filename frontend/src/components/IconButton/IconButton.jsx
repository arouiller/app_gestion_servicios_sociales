import React from 'react';
import './IconButton.scss';

/**
 * Componente IconButton
 * Botón reutilizable para acciones en tablas con iconos estándar
 *
 * Iconos soportados:
 * - edit: ✎ (editar)
 * - delete: 🗑 (eliminar)
 * - view: 👁 (ver detalle)
 * - config: ⚙ (configurar)
 * - add: ➕ (agregar)
 * - print: 🖨 (imprimir)
 *
 * @param {string} icon - Tipo de icono (edit, delete, view, config, add) o emoji personalizado
 * @param {string} title - Texto del tooltip
 * @param {function} onClick - Función a ejecutar al hacer clic
 * @param {boolean} disabled - Si el botón está deshabilitado
 * @param {string} className - Clases CSS adicionales
 * @param {object} props - Props adicionales del botón
 */
function IconButton({
  icon,
  title = '',
  onClick,
  disabled = false,
  className = '',
  ...props
}) {
  // Mapa de iconos estándar
  const iconMap = {
    edit: '✎',
    delete: '🗑',
    view: '👁',
    config: '⚙',
    add: '➕',
    print: '🖨',
  };

  // Usar icono del mapa o el pasado directamente
  const displayIcon = iconMap[icon] || icon;

  return (
    <button
      className={`icon-button ${className} ${disabled ? 'icon-button--disabled' : ''}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {displayIcon}
    </button>
  );
}

export default IconButton;
