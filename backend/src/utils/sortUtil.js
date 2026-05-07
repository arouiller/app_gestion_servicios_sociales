/**
 * Validates and constructs Sequelize ORDER BY clause
 * @param {string} sortBy - Column name (e.g., 'plan_numero', 'fecha', 'apellido')
 * @param {string} order - 'ASC' or 'DESC' (default: 'ASC')
 * @param {string[]} allowedColumns - List of valid column names for this model
 * @returns {Array} Sequelize ORDER BY format: [['column', 'ASC']] or empty array if no sortBy
 * @throws Error if sortBy not in allowedColumns or invalid order direction
 */
function buildOrderByClause(sortBy, order = 'ASC', allowedColumns = []) {
  // Validate order direction
  const normalizedOrder = (order || 'ASC').toUpperCase();
  if (!['ASC', 'DESC'].includes(normalizedOrder)) {
    throw new Error(`Invalid order direction: ${order}`);
  }

  // If no sortBy provided, return empty array (use model defaults)
  if (!sortBy) {
    return [];
  }

  // Validate column is allowed
  if (!allowedColumns.includes(sortBy)) {
    throw new Error(`Invalid sort column: ${sortBy}. Allowed: ${allowedColumns.join(', ')}`);
  }

  return [[sortBy, normalizedOrder]];
}

module.exports = {
  buildOrderByClause,
};
