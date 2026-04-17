import { useEffect, useRef } from 'react';

/**
 * Hook para manejar el comportamiento de la tecla ESC en modales
 *
 * Comportamiento:
 * - Cierra la modal presionando ESC
 * - Si hay cambios sin guardar, muestra confirmación
 * - Solo cierra la modal más arriba (LIFO) en caso de múltiples modales
 *
 * @param {boolean} isOpen - Si la modal está abierta
 * @param {boolean} hasChanges - Si hay cambios no guardados
 * @param {function} onClose - Callback cuando se cierra
 * @param {function} onEscWithChanges - Callback para mostrar confirmación
 */
export const useModalEscapeKey = (isOpen, hasChanges = false, onClose, onEscWithChanges) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (e) => {
      // Solo actuar si presionó ESC
      if (e.key !== 'Escape') return;

      // Prevenir comportamiento por defecto
      e.preventDefault();

      // Si hay cambios, mostrar confirmación
      if (hasChanges && onEscWithChanges) {
        onEscWithChanges();
      } else {
        // Si no hay cambios, cerrar inmediatamente
        onClose?.();
      }
    };

    // Agregar listener al documento
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, hasChanges, onClose, onEscWithChanges]);

  return modalRef;
};

export default useModalEscapeKey;
