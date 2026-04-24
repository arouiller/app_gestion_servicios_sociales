const { sequelize } = require('../models');

const MAX_RESULTS = 1000;
const ALLOWED_KEYWORDS = ['SELECT'];
const BLOCKED_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE'];

function validateQuery(query) {
  const trimmedQuery = query.trim().toUpperCase();

  // Verificar que comience con SELECT
  if (!ALLOWED_KEYWORDS.some(keyword => trimmedQuery.startsWith(keyword))) {
    throw new Error('Solo se permiten queries SELECT');
  }

  // Verificar que no contenga palabras clave prohibidas
  for (const keyword of BLOCKED_KEYWORDS) {
    if (trimmedQuery.includes(keyword)) {
      throw new Error(`No se permite usar la palabra clave: ${keyword}`);
    }
  }

  return true;
}

exports.executeQuery = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query es requerida',
      });
    }

    // Validar query
    validateQuery(query);

    // Ejecutar query
    const results = await sequelize.query(query, {
      type: 'SELECT',
      raw: true,
    });

    // Limitar resultados
    const limitedResults = results.slice(0, MAX_RESULTS);
    const isTruncated = results.length > MAX_RESULTS;

    // Logging de query ejecutada (auditoría)
    console.log(`[QUERY EXEC] Usuario ${req.userId} ejecutó query. Resultados: ${results.length} registros`);

    res.json({
      success: true,
      data: limitedResults,
      totalRows: results.length,
      returnedRows: limitedResults.length,
      isTruncated,
      message: isTruncated
        ? `Se devuelven ${MAX_RESULTS} de ${results.length} registros`
        : `${results.length} registros encontrados`,
    });
  } catch (error) {
    console.error('[QUERY EXEC ERROR]', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al ejecutar query',
    });
  }
};
