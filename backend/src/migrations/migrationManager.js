/**
 * Migration Manager
 * Gestiona las migraciones de base de datos usando archivos SQL en src/migrations/.
 * Cada versión es una carpeta con upgrade.sql y downgrade.sql.
 * El estado se persiste en la tabla migraciones_bd.
 */

const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'versions');

// ── Utilidades ────────────────────────────────────────────────────────────────

/**
 * Lee las carpetas de migración ordenadas por nombre (orden alfabético = orden de versión).
 */
function getMigrationFolders() {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules')
    .map((e) => e.name)
    .sort();
}

/**
 * Extrae la versión del nombre de la carpeta (ej: "v001_initial_schema" → "v001").
 */
function getVersion(folder) {
  return folder.split('_')[0];
}

/**
 * Extrae la descripción del nombre de la carpeta (ej: "v001_initial_schema" → "initial schema").
 */
function getDescription(folder) {
  return folder.split('_').slice(1).join(' ');
}

/**
 * Lee un archivo SQL y lo divide en sentencias individuales (separadas por ';').
 */
function readSQL(folder, type) {
  const filePath = path.join(MIGRATIONS_DIR, folder, `${type}.sql`);
  const content = fs.readFileSync(filePath, 'utf8');
  return content
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
}

// ── Operaciones sobre migraciones_bd ─────────────────────────────────────────

async function ensureTable() {
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
}

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
    return { version, descripcion };
  } catch (err) {
    await transaction.rollback();
    await recordMigration(version, descripcion, 'upgrade', 'fallida').catch(() => {});
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
    return { version: lastVersion, descripcion };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Ejecuta todas las migraciones pendientes en orden.
 */
async function upgradeAll() {
  const results = [];
  let migrated;
  do {
    migrated = await upgrade();
    if (migrated) results.push(migrated);
  } while (migrated);
  return results;
}

module.exports = { list, upgrade, downgrade, upgradeAll, ensureTable };
