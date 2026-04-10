/**
 * Script de build para despliegue en Hostinger.
 * Copia src/ → dist/src/ y los archivos de configuración necesarios.
 * Uso: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// ── Utilidades ────────────────────────────────────────────────────────────────

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// ── Build ─────────────────────────────────────────────────────────────────────

console.log('🔨 Iniciando build...');

// Limpiar dist anterior
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

// Copiar src/
copyDir(path.join(ROOT, 'src'), path.join(DIST, 'src'));
console.log('  ✅ src/ copiado');

// Copiar package.json (sin devDependencies — Hostinger hace npm install --production)
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
delete pkg.devDependencies;
fs.writeFileSync(path.join(DIST, 'package.json'), JSON.stringify(pkg, null, 2));
console.log('  ✅ package.json copiado');

// Copiar .env si existe (para deploy manual; en producción usar variables de entorno)
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  copyFile(envPath, path.join(DIST, '.env'));
  console.log('  ✅ .env copiado');
}

console.log('✅ Build completado → dist/');
console.log('   Entry point: dist/src/index.js');
