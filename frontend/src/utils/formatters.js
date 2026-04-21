/**
 * Formatting utilities for common display patterns
 */

export const formatNumeroAfiliado = (numero) =>
  String(numero ?? '').padStart(5, '0');

export const formatZona = (zona) =>
  String(zona ?? 0).padStart(2, '0');
