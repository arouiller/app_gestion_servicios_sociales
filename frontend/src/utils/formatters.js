/**
 * Formatting utilities for common display patterns
 */

export const formatNumeroAfiliado = (numero) =>
  String(numero ?? '').padStart(5, '0');

