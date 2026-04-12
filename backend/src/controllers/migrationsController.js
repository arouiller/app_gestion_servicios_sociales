const migrationManager = require('../migrations/migrationManager');

/**
 * GET /api/migrations/list
 * Retorna lista de versiones disponibles y estado actual
 */
async function list(req, res) {
  try {
    const versions = await migrationManager.list();
    const stats = await migrationManager.getDbStats();

    res.json({
      success: true,
      data: {
        versions,
        currentVersion: stats.currentVersion,
      },
    });
  } catch (err) {
    console.error('Error listing migrations:', err);
    res.status(500).json({ success: false, message: 'Error al listar migraciones' });
  }
}

/**
 * GET /api/migrations/history
 * Retorna historial completo de migraciones
 */
async function history(req, res) {
  try {
    const records = await migrationManager.getHistory();

    // Convert duracion_ms to seconds for display
    const history = records.map((record) => ({
      ...record,
      duracion: record.duracion_ms ? (record.duracion_ms / 1000).toFixed(2) : null,
    }));

    res.json({
      success: true,
      data: { history },
    });
  } catch (err) {
    console.error('Error fetching migration history:', err);
    res.status(500).json({ success: false, message: 'Error al obtener historial' });
  }
}

/**
 * GET /api/migrations/stats
 * Retorna estadísticas de BD: versión actual + conteo de registros por tabla
 */
async function stats(req, res) {
  try {
    const data = await migrationManager.getDbStats();

    res.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Error fetching DB stats:', err);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
}

/**
 * GET /api/migrations/preview/:version/:direction
 * Retorna el SQL que se ejecutaría para un upgrade/downgrade sin ejecutarlo
 * direction: "upgrade" | "downgrade"
 */
async function preview(req, res) {
  try {
    const { version, direction } = req.params;

    // Validate direction
    if (!['upgrade', 'downgrade'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Dirección inválida. Use "upgrade" o "downgrade"',
      });
    }

    const data = await migrationManager.getPreview(version, direction);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error generating preview:', err);
    res.status(400).json({
      success: false,
      message: err.message || 'Error al generar preview',
    });
  }
}

module.exports = {
  list,
  history,
  stats,
  preview,
};
