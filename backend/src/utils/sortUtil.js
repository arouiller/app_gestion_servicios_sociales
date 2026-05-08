/**
 * Validates and constructs Sequelize ORDER BY clause
 * Supports both simple columns and related model fields
 * @param {string} sortBy - Column or relation.field (e.g., 'plan_numero', 'Cobrador.cobrador_apellido')
 * @param {string} order - 'ASC' or 'DESC' (default: 'ASC')
 * @param {Object} columnMap - Map of allowed sort keys to Sequelize order syntax
 *   e.g., { 'plan_numero': 'plan_numero', 'Cobrador.cobrador_apellido': { model: db.Cobrador, field: 'cobrador_apellido' } }
 * @returns {Array} Sequelize ORDER BY format
 * @throws Error if sortBy not allowed or invalid order direction
 */
function buildOrderByClause(sortBy, order = 'ASC', columnMap = {}) {
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
  if (!columnMap[sortBy]) {
    throw new Error(`Invalid sort column: ${sortBy}. Allowed: ${Object.keys(columnMap).join(', ')}`);
  }

  const config = columnMap[sortBy];

  // If config is a string, it's a simple column
  if (typeof config === 'string') {
    return [[config, normalizedOrder]];
  }

  // If config is an object with model, it's a relation sort
  if (config.model && config.field) {
    return [[config.model, config.field, normalizedOrder]];
  }

  // Fallback
  return [[sortBy, normalizedOrder]];
}

module.exports = {
  buildOrderByClause,
};
