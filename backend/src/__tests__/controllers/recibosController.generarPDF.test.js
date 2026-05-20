/**
 * Tests para generarPDF con desglose de cuotas y layout 2-per-page (BACKLOG-080)
 */

const {
  formatCurrency,
  replacePlaceholder,
  detectNegativeArancel,
  getArancelCSSClass,
  getArancelWarningIcon,
  groupRecibosInPairs,
  validateReciboInvariant,
  getDefaultTemplateString,
} = require('../../utils/pdfHelpers');

describe('recibosController.generarPDF - BACKLOG-080', () => {
  // Nota: Tests de integración requerirían mocking de DB y pdfkit
  // Estos tests validan el comportamiento esperado del endpoint

  describe('Placeholder replacement con desglose', () => {
    test('debe reemplazar {{cuota_social}} con valor formateado ($X.XX)', () => {
      const placeholder = '{{cuota_social}}';
      const recibo = { cuota_social: 12.5 };
      const expected = '$12.50';

      const result = replacePlaceholder(placeholder, recibo);
      expect(result).toBe(expected);
    });

    test('debe reemplazar {{arancel_por_servicio}} con valor formateado', () => {
      const placeholder = '{{arancel_por_servicio}}';
      const recibo = { arancel_por_servicio: 5.25 };
      const expected = '$5.25';

      const result = replacePlaceholder(placeholder, recibo);
      expect(result).toBe(expected);
    });

    test('debe reemplazar {{valor_cuota}} (existente) sin cambios', () => {
      const placeholder = '{{valor_cuota}}';
      const recibo = { valor_cuota: 17.75 };
      const expected = '$17.75';

      const result = replacePlaceholder(placeholder, recibo);
      expect(result).toBe(expected);
    });

    test('debe formatear a 2 decimales', () => {
      const recibo = { cuota_social: 12.5 };
      const result = formatCurrency(recibo.cuota_social);
      expect(result).toBe('$12.50');
    });

    test('debe formatear valores con más de 2 decimales', () => {
      const recibo = { cuota_social: 12.555 };
      const result = formatCurrency(recibo.cuota_social);
      expect(result).toBe('$12.56');
    });

    test('debe manejar valores NULL como 0.00', () => {
      const recibo = { cuota_social: null };
      const result = formatCurrency(recibo.cuota_social || 0);
      expect(result).toBe('$0.00');
    });
  });

  describe('Detección de arancel negativo', () => {
    test('debe detectar arancel negativo', () => {
      const recibo = { arancel_por_servicio: -1.5 };
      const isNegative = detectNegativeArancel(recibo.arancel_por_servicio);
      expect(isNegative).toBe(true);
    });

    test('debe NOT detectar arancel positivo como negativo', () => {
      const recibo = { arancel_por_servicio: 5.25 };
      const isNegative = detectNegativeArancel(recibo.arancel_por_servicio);
      expect(isNegative).toBe(false);
    });

    test('debe retornar clase CSS "negativo" si arancel < 0', () => {
      const recibo = { arancel_por_servicio: -1.5 };
      const cssClass = getArancelCSSClass(recibo.arancel_por_servicio);
      expect(cssClass).toBe('negativo');
    });

    test('debe retornar string vacío si arancel >= 0', () => {
      const recibo = { arancel_por_servicio: 5.25 };
      const cssClass = getArancelCSSClass(recibo.arancel_por_servicio);
      expect(cssClass).toBe('');
    });

    test('debe retornar símbolo ⚠️ si arancel < 0', () => {
      const recibo = { arancel_por_servicio: -1.5 };
      const icon = getArancelWarningIcon(recibo.arancel_por_servicio);
      expect(icon).toBe('⚠️');
    });

    test('debe retornar string vacío si arancel >= 0', () => {
      const recibo = { arancel_por_servicio: 5.25 };
      const icon = getArancelWarningIcon(recibo.arancel_por_servicio);
      expect(icon).toBe('');
    });
  });

  describe('Layout 2-per-page', () => {
    test('debe agrupar recibos en pares para layout 2-per-page', () => {
      const recibos = [
        { id: 1, numero_recibo: 101 },
        { id: 2, numero_recibo: 102 },
        { id: 3, numero_recibo: 103 },
        { id: 4, numero_recibo: 104 },
        { id: 5, numero_recibo: 105 },
      ];

      const pairs = groupRecibosInPairs(recibos);

      expect(pairs.length).toBe(3); // 3 pares (2, 2, 1)
      expect(pairs[0].length).toBe(2);
      expect(pairs[1].length).toBe(2);
      expect(pairs[2].length).toBe(1);
    });

    test('debe agrupar 2 recibos correctamente', () => {
      const recibos = [
        { id: 1, numero_recibo: 101 },
        { id: 2, numero_recibo: 102 },
      ];

      const pairs = groupRecibosInPairs(recibos);

      expect(pairs.length).toBe(1);
      expect(pairs[0]).toEqual([
        { id: 1, numero_recibo: 101 },
        { id: 2, numero_recibo: 102 },
      ]);
    });

    test('debe agrupar 1 recibo correctamente', () => {
      const recibos = [{ id: 1, numero_recibo: 101 }];

      const pairs = groupRecibosInPairs(recibos);

      expect(pairs.length).toBe(1);
      expect(pairs[0]).toEqual([{ id: 1, numero_recibo: 101 }]);
    });

    test('debe agrupar lista vacía como resultado vacío', () => {
      const recibos = [];
      const pairs = groupRecibosInPairs(recibos);
      expect(pairs.length).toBe(0);
    });
  });

  describe('Template con desglose', () => {
    test('template debe incluir tabla de desglose', () => {
      // El template en BD debe contener:
      // - Tabla con clase "recibo-desglose"
      // - Filas para cuota_social, arancel_por_servicio, valor_cuota
      // - Placeholders {{cuota_social}}, {{arancel_por_servicio}}, {{valor_cuota}}
      const template = getDefaultTemplateString();
      expect(template).toContain('recibo-desglose');
      expect(template).toContain('{{cuota_social}}');
      expect(template).toContain('{{arancel_por_servicio}}');
      expect(template).toContain('Cuota Social');
      expect(template).toContain('Arancel por Servicio');
    });

    test('template debe tener clase condicional {{arancel_negativo_class}}', () => {
      const template = getDefaultTemplateString();
      expect(template).toContain('{{arancel_negativo_class}}');
    });

    test('template debe tener ícono condicional {{arancel_warning_icon}}', () => {
      const template = getDefaultTemplateString();
      expect(template).toContain('{{arancel_warning_icon}}');
    });

    test('template debe tener CSS para desglose', () => {
      const template = getDefaultTemplateString();
      // Debe incluir estilos para .recibo-desglose
      expect(template).toContain('.recibo-desglose');
      expect(template).toContain('.desglose-label');
      expect(template).toContain('.desglose-value');
    });

    test('template CSS debe incluir estilos para arancel negativo', () => {
      const template = getDefaultTemplateString();
      expect(template).toContain('.negativo');
      expect(template).toContain('#fff3cd'); // Color amarillo para advertencia
    });
  });

  describe('Validación de invariantes', () => {
    test('debe validar que cuota_social + arancel_por_servicio ≈ valor_cuota', () => {
      const recibo = {
        cuota_social: 12.50,
        arancel_por_servicio: 5.25,
        valor_cuota: 17.75,
      };

      const isValid = validateReciboInvariant(recibo);
      expect(isValid).toBe(true);
    });

    test('debe permitir tolerancia de 0.01 en la suma', () => {
      const recibo = {
        cuota_social: 12.50,
        arancel_por_servicio: 5.24, // 0.01 de diferencia
        valor_cuota: 17.75,
      };

      const isValid = validateReciboInvariant(recibo);
      expect(isValid).toBe(true);
    });

    test('debe rechazar suma inconsistente', () => {
      const recibo = {
        cuota_social: 12.50,
        arancel_por_servicio: 5.00, // Falta 0.25
        valor_cuota: 17.75,
      };

      const isValid = validateReciboInvariant(recibo);
      expect(isValid).toBe(false);
    });
  });
});
