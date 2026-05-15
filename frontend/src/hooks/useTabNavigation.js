import { useCallback } from 'react';

/**
 * Hook para navegación por teclado entre tabs
 * @param {Object} tabsConfig - Configuración de tabs
 *   {
 *     tabName: {
 *       key: 'a',  // Tecla sin ALT
 *       ref: refTab,  // Ref al componente del tab
 *       focusSelector: 'css-selector',  // Selector CSS para elemento a enfocar
 *       name: 'tabName'  // Nombre identificador
 *     }
 *   }
 * @param {Function} onTabChange - Callback cuando cambia tab
 */
function useTabNavigation(tabsConfig, onTabChange) {
  const handleTabKeyDown = useCallback((e) => {
    // Solo si ALT está presionado
    if (!e.altKey) return;

    const key = e.key.toLowerCase();

    // Buscar tab que corresponda a esta tecla
    let targetTab = null;
    for (const [tabName, config] of Object.entries(tabsConfig)) {
      if (config.key === key) {
        targetTab = tabName;
        break;
      }
    }

    if (targetTab) {
      e.preventDefault();
      onTabChange(targetTab);
    }
  }, [tabsConfig, onTabChange]);

  return {
    handleTabKeyDown
  };
}

export default useTabNavigation;
