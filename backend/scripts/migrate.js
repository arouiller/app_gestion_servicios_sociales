/**
 * CLI de migraciones.
 * Uso:
 *   node scripts/migrate.js list       Lista migraciones y su estado
 *   node scripts/migrate.js up         Aplica la siguiente migración pendiente
 *   node scripts/migrate.js up:all     Aplica todas las migraciones pendientes
 *   node scripts/migrate.js down       Revierte la última migración aplicada
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const manager = require('../src/migrations/migrationManager');

const command = process.argv[2];

async function run() {
  switch (command) {
    case 'list': {
      const migrations = await manager.list();
      if (migrations.length === 0) {
        console.log('No hay migraciones disponibles.');
        break;
      }
      console.log('\nMigraciones:');
      migrations.forEach((m) => {
        const icon = m.estado === 'aplicada' ? '✅' : '⏳';
        console.log(`  ${icon} ${m.version}  ${m.descripcion}  [${m.estado}]`);
      });
      console.log();
      break;
    }

    case 'up': {
      const result = await manager.upgrade();
      if (!result) {
        console.log('No hay migraciones pendientes.');
      } else {
        console.log(`✅ Migración aplicada: ${result.version} — ${result.descripcion}`);
      }
      break;
    }

    case 'up:all': {
      const results = await manager.upgradeAll();
      if (results.length === 0) {
        console.log('No hay migraciones pendientes.');
      } else {
        results.forEach((r) => console.log(`✅ ${r.version} — ${r.descripcion}`));
        console.log(`\n${results.length} migración(es) aplicada(s).`);
      }
      break;
    }

    case 'down': {
      const result = await manager.downgrade();
      if (!result) {
        console.log('No hay migraciones aplicadas para revertir.');
      } else {
        console.log(`↩️  Migración revertida: ${result.version} — ${result.descripcion}`);
      }
      break;
    }

    default:
      console.error(`Comando desconocido: "${command}"`);
      console.error('Comandos disponibles: list | up | up:all | down');
      process.exit(1);
  }
}

run()
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  })
  .finally(() => process.exit(0));
