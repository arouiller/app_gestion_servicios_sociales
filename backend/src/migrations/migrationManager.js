/**
 * Migration Manager
 * Gestiona las migraciones de base de datos usando archivos SQL en src/migrations/.
 * Cada versión es una carpeta con upgrade.sql y downgrade.sql.
 * El estado actual se persiste en `migraciones_bd` (un registro por versión).
 * El historial completo se persiste en `historial_migraciones` (append-only).
 */

const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'versions');

// ── Utilidades ────────────────────────────────────────────────────────────────

function getMigrationFolders() {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules')
    .map((e) => e.name)
    .sort();
}

function getVersion(folder) {
  return folder.split('_')[0];
}

function getDescription(folder) {
  return folder.split('_').slice(1).join(' ');
}

/**
 * Lee un archivo SQL y lo divide en sentencias individuales.
 * Primero elimina líneas de comentario (--) para que no contaminen
 * la sentencia siguiente al hacer split por ';'.
 */
function readSQL(folder, type) {
  const filePath = path.join(MIGRATIONS_DIR, folder, `${type}.sql`);
  const content = fs.readFileSync(filePath, 'utf8');

  const withoutComments = content
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  return withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ── Tablas de control ─────────────────────────────────────────────────────────

async function ensureTable() {
  // Estado actual por versión (un registro por versión, se actualiza in-place)
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS migraciones_bd (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      descripcion VARCHAR(255) NOT NULL,
      tipo ENUM('upgrade','downgrade') NOT NULL,
      fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado ENUM('exitosa','fallida','revertida') NOT NULL DEFAULT 'exitosa'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Historial completo (append-only, una fila por evento)
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS historial_migraciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(50) NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      tipo ENUM('upgrade','downgrade') NOT NULL,
      estado ENUM('exitosa','fallida') NOT NULL,
      duracion_ms INT DEFAULT NULL,
      fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

// ── Operaciones sobre migraciones_bd ─────────────────────────────────────────

async function getAppliedMigrations() {
  const [rows] = await sequelize.query(
    `SELECT version FROM migraciones_bd WHERE estado = 'exitosa' ORDER BY version ASC`
  );
  return rows.map((r) => r.version);
}

async function recordMigration(version, descripcion, tipo, estado = 'exitosa') {
  await sequelize.query(
    `INSERT INTO migraciones_bd (version, descripcion, tipo, estado)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE tipo = VALUES(tipo), estado = VALUES(estado), fecha_ejecucion = CURRENT_TIMESTAMP`,
    { replacements: [version, descripcion, tipo, estado] }
  );
}

async function appendHistory(version, descripcion, tipo, estado, durationMs = null) {
  await sequelize.query(
    `INSERT INTO historial_migraciones (version, descripcion, tipo, estado, duracion_ms) VALUES (?, ?, ?, ?, ?)`,
    { replacements: [version, descripcion, tipo, estado, durationMs] }
  );
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Retorna el estado de todas las migraciones disponibles.
 */
async function list() {
  await ensureTable();
  const applied = await getAppliedMigrations();
  const folders = getMigrationFolders();

  return folders.map((folder) => {
    const version = getVersion(folder);
    return {
      version,
      folder,
      descripcion: getDescription(folder),
      estado: applied.includes(version) ? 'aplicada' : 'pendiente',
    };
  });
}

/**
 * Ejecuta la siguiente migración pendiente.
 * Retorna la migración ejecutada o null si no hay pendientes.
 */
async function upgrade() {
  await ensureTable();
  const applied = await getAppliedMigrations();
  const folders = getMigrationFolders();

  const pending = folders.find((f) => !applied.includes(getVersion(f)));
  if (!pending) return null;

  const version = getVersion(pending);
  const descripcion = getDescription(pending);
  const statements = readSQL(pending, 'upgrade');

  const transaction = await sequelize.transaction();
  try {
    for (const sql of statements) {
      await sequelize.query(sql, { transaction });
    }
    await recordMigration(version, descripcion, 'upgrade', 'exitosa');
    await transaction.commit();
    await appendHistory(version, descripcion, 'upgrade', 'exitosa');
    return { version, descripcion };
  } catch (err) {
    await transaction.rollback();
    await recordMigration(version, descripcion, 'upgrade', 'fallida').catch(() => {});
    await appendHistory(version, descripcion, 'upgrade', 'fallida').catch(() => {});
    throw err;
  }
}

/**
 * Revierte la última migración aplicada.
 * Retorna la migración revertida o null si no hay aplicadas.
 */
async function downgrade() {
  await ensureTable();
  const applied = await getAppliedMigrations();
  if (applied.length === 0) return null;

  const lastVersion = applied[applied.length - 1];
  const folders = getMigrationFolders();
  const folder = folders.find((f) => getVersion(f) === lastVersion);
  if (!folder) throw new Error(`Carpeta para versión ${lastVersion} no encontrada`);

  const descripcion = getDescription(folder);
  const statements = readSQL(folder, 'downgrade');

  const transaction = await sequelize.transaction();
  try {
    for (const sql of statements) {
      await sequelize.query(sql, { transaction });
    }
    await sequelize.query(
      `UPDATE migraciones_bd SET estado = 'revertida', tipo = 'downgrade', fecha_ejecucion = CURRENT_TIMESTAMP WHERE version = ?`,
      { replacements: [lastVersion], transaction }
    );
    await transaction.commit();
    await appendHistory(lastVersion, descripcion, 'downgrade', 'exitosa');
    return { version: lastVersion, descripcion };
  } catch (err) {
    await transaction.rollback();
    await appendHistory(lastVersion, descripcion, 'downgrade', 'fallida').catch(() => {});
    throw err;
  }
}

/**
 * Retorna el historial completo de eventos de migración (más reciente primero).
 */
async function getHistory() {
  await ensureTable();
  const [rows] = await sequelize.query(
    `SELECT id, version, descripcion, tipo, estado, fecha_ejecucion
     FROM historial_migraciones
     ORDER BY fecha_ejecucion DESC`
  );
  return rows;
}

/**
 * Retorna la versión actual y el conteo de registros por tabla.
 */
async function getDbStats() {
  await ensureTable();

  const [tableRows] = await sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
     ORDER BY TABLE_NAME`
  );

  const tables = await Promise.all(
    tableRows.map(async ({ TABLE_NAME }) => {
      const [[{ total }]] = await sequelize.query(
        `SELECT COUNT(*) AS total FROM \`${TABLE_NAME}\``
      );
      return { tabla: TABLE_NAME, registros: parseInt(total, 10) };
    })
  );

  const applied = await getAppliedMigrations();
  const currentVersion = applied.length > 0 ? applied[applied.length - 1] : null;

  return { currentVersion, tables };
}

/**
 * Re-ejecuta la migración de la versión actual:
 * corre el downgrade y luego el upgrade de la misma versión en una sola transacción.
 * Retorna la versión reaplicada o null si no hay ninguna aplicada.
 */
async function reapply() {
  await ensureTable();
  const applied = await getAppliedMigrations();
  if (applied.length === 0) return null;

  const currentVersion = applied[applied.length - 1];
  const folders = getMigrationFolders();
  const folder = folders.find((f) => getVersion(f) === currentVersion);
  if (!folder) throw new Error(`Carpeta para versión ${currentVersion} no encontrada`);

  const descripcion = getDescription(folder);
  const downStatements = readSQL(folder, 'downgrade');
  const upStatements = readSQL(folder, 'upgrade');

  const transaction = await sequelize.transaction();
  try {
    for (const sql of downStatements) {
      await sequelize.query(sql, { transaction });
    }
    for (const sql of upStatements) {
      await sequelize.query(sql, { transaction });
    }
    await sequelize.query(
      `UPDATE migraciones_bd SET fecha_ejecucion = CURRENT_TIMESTAMP WHERE version = ?`,
      { replacements: [currentVersion], transaction }
    );
    await transaction.commit();
    await appendHistory(currentVersion, descripcion, 'upgrade', 'exitosa');
    return { version: currentVersion, descripcion };
  } catch (err) {
    await transaction.rollback();
    await appendHistory(currentVersion, descripcion, 'upgrade', 'fallida').catch(() => {});
    throw err;
  }
}

/**
 * Retorna una vista previa del SQL que se ejecutaría sin ejecutarla.
 */
async function getPreview(version, direction) {
  const folders = getMigrationFolders();
  const folder = folders.find((f) => getVersion(f) === version);

  if (!folder) {
    throw new Error(`Versión ${version} no encontrada`);
  }

  const description = getDescription(folder);
  const statements = readSQL(folder, direction);
  const sql = statements.join(';\n') + ';';

  const folderIndex = folders.indexOf(folder);
  const nextFolder = direction === 'upgrade' ? folders[folderIndex + 1] : folders[folderIndex - 1];
  const nextVersion = nextFolder ? getVersion(nextFolder) : null;

  return {
    version,
    direction,
    sql,
    description,
    nextVersion,
  };
}

/**
 * Ejecuta una migración específica en la dirección indicada.
 * direction: "upgrade" | "downgrade"
 */
async function execute(version, direction) {
  await ensureTable();

  if (!['upgrade', 'downgrade'].includes(direction)) {
    throw new Error('Dirección inválida. Use "upgrade" o "downgrade"');
  }

  const applied = await getAppliedMigrations();
  const folders = getMigrationFolders();
  const folder = folders.find((f) => getVersion(f) === version);

  if (!folder) {
    throw new Error(`Versión ${version} no encontrada`);
  }

  // Validation
  if (direction === 'upgrade' && applied.includes(version)) {
    throw new Error(`Versión ${version} ya está aplicada`);
  }
  if (direction === 'downgrade' && !applied.includes(version)) {
    throw new Error(`Versión ${version} no está aplicada`);
  }

  const description = getDescription(folder);
  const statements = readSQL(folder, direction);

  const transaction = await sequelize.transaction();
  const startTime = Date.now();

  try {
    for (const sql of statements) {
      await sequelize.query(sql, { transaction });
    }

    if (direction === 'upgrade') {
      await recordMigration(version, description, 'upgrade', 'exitosa');
    } else {
      await sequelize.query(
        `UPDATE migraciones_bd SET estado = 'revertida', tipo = 'downgrade', fecha_ejecucion = CURRENT_TIMESTAMP WHERE version = ?`,
        { replacements: [version], transaction }
      );
    }

    await transaction.commit();

    const durationMs = Date.now() - startTime;
    await appendHistory(version, description, direction, 'exitosa', durationMs);

    return { version, description, direction, durationMs };
  } catch (err) {
    await transaction.rollback();
    const durationMs = Date.now() - startTime;
    await appendHistory(version, description, direction, 'fallida', durationMs).catch(() => {});
    throw err;
  }
}

module.exports = { list, upgrade, downgrade, reapply, ensureTable, getDbStats, getHistory, getPreview, execute };
