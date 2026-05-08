/**
 * Validates and constructs Sequelize ORDER BY clause
 * Supports simple columns, single-level relations, and nested relations
 * @param {string} sortBy - Column key from columnMap
 * @param {string} order - 'ASC' or 'DESC' (default: 'ASC')
 * @param {Object} columnMap - Map of allowed sort keys to Sequelize order syntax
 *   Simple: 'plan_numero'
 *   Relation: { model: db.Cobrador, field: 'cobrador_apellido' }
 *   Nested: { models: [db.PlanIntegrante, db.Persona], field: 'apellido' }
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
