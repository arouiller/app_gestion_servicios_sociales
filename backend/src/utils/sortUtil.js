/**
 * Validates and constructs Sequelize ORDER BY clause
 * Supports:
 * - Array format (backwards compatibility): ['plan_numero', 'numero_afiliado', ...]
 * - Object map format: { 'plan_numero': 'plan_numero', 'Cobrador.apellido': { model: db.Cobrador, field: 'apellido' } }
 *
 * @param {string} sortBy - Column name or key
 * @param {string} order - 'ASC' or 'DESC' (default: 'ASC')
 * @param {Array|Object} allowedColumnsOrMap - Array of allowed columns OR object map
 * @returns {Array} Sequelize ORDER BY format
 * @throws Error if sortBy not allowed or invalid order direction
 */
function buildOrderByClause(sortBy, order = 'ASC', allowedColumnsOrMap = {}) {
  // Validate order direction
  const normalizedOrder = (order || 'ASC').toUpperCase();
  if (!['ASC', 'DESC'].includes(normalizedOrder)) {
    throw new Error(`Invalid order direction: ${order}`);
  }

  // If no sortBy provided, return empty array (use model defaults)
  if (!sortBy) {
    return [];
  }

  // Check if input is array (backwards compatibility)
  if (Array.isArray(allowedColumnsOrMap)) {
    // Old format: simple column list
    if (!allowedColumnsOrMap.includes(sortBy)) {
      throw new Error(`Invalid sort column: ${sortBy}. Allowed: ${allowedColumnsOrMap.join(', ')}`);
    }
    return [[sortBy, normalizedOrder]];
  }

  // Object map format
  const columnMap = allowedColumnsOrMap;
  if (!columnMap[sortBy]) {
    throw new Error(`Invalid sort column: ${sortBy}. Allowed: ${Object.keys(columnMap).join(', ')}`);
  }

  const config = columnMap[sortBy];

  // If config is a string, it's a simple column
  if (typeof config === 'string') {
    return [[config, normalizedOrder]];
  }

  // If config has nested models (array), build nested order clause
  if (config.models && Array.isArray(config.models) && config.field) {
    return [[...config.models, config.field, normalizedOrder]];
  }

  // If config is an object with single model
  if (config.model && config.field) {
    return [[config.model, config.field, normalizedOrder]];
  }

  // Fallback
  return [[sortBy, normalizedOrder]];
}

module.exports = {
  buildOrderByClause,
};
