/**
 * Formatting utilities for common display patterns
 */

export const formatNumeroAfiliado = (numero) =>
  String(numero ?? '').padStart(5, '0');

export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const calculateAge = (fechaNacimiento) => {
  if (!fechaNacimiento) return '-';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};
