const { sequelize } = require('../models');

const MAX_RESULTS = 1000;
const ALLOWED_KEYWORDS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
const BLOCKED_KEYWORDS = ['DROP', 'ALTER', 'CREATE', 'TRUNCATE'];

function validateQuery(query) {
  const trimmedQuery = query.trim().toUpperCase();

  // Verificar que comience con una palabra clave permitida
  if (!ALLOWED_KEYWORDS.some(keyword => trimmedQuery.startsWith(keyword))) {
    throw new Error(`Se permiten solo: ${ALLOWED_KEYWORDS.join(', ')}`);
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

    // Determinar tipo de query
    const trimmedQuery = query.trim().toUpperCase();
    const queryType = trimmedQuery.startsWith('SELECT') ? 'SELECT' : 'RAW';

    // Ejecutar query
    const results = await sequelize.query(query, {
      type: queryType,
      raw: true,
    });

    // Determinar si hay resultados
    const isSelectQuery = trimmedQuery.startsWith('SELECT');
    const limitedResults = isSelectQuery ? results.slice(0, MAX_RESULTS) : [];
    const isTruncated = isSelectQuery && results.length > MAX_RESULTS;
    const affectedRows = !isSelectQuery && typeof results === 'object' ? results[1] || 0 : 0;

    // Logging de query ejecutada (auditoría)
    if (isSelectQuery) {
      console.log(`[QUERY EXEC] Usuario ${req.userId} ejecutó SELECT. Resultados: ${results.length} registros`);
    } else {
      console.log(`[QUERY EXEC] Usuario ${req.userId} ejecutó ${trimmedQuery.split(' ')[0]}. Filas afectadas: ${affectedRows}`);
    }

    if (isSelectQuery) {
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
    } else {
      res.json({
        success: true,
        affectedRows,
        message: `${affectedRows} fila(s) afectada(s)`,
      });
    }
  } catch (error) {
    console.error('[QUERY EXEC ERROR]', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al ejecutar query',
    });
  }
};
