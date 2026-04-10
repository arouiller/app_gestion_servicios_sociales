/**
 * Script de build para despliegue en Hostinger.
 * Copia src/ → dist/src/ y los archivos de configuración necesarios.
 * Uso: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Build frontend y copiar a dist/frontend/build
const frontendDir = path.join(ROOT, '..', 'frontend');
console.log('🔨 Compilando frontend...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
execSync('npm run build', {
  cwd: frontendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    REACT_APP_API_URL: '/api',
    REACT_APP_APP_NAME: 'GestSocial',
    REACT_APP_ENV: 'production',
    CI: 'false',
    NODE_ENV: 'production',
  },
});
copyDir(path.join(frontendDir, 'build'), path.join(DIST, 'frontend', 'build'));
console.log('  ✅ frontend/build copiado');

console.log('✅ Build completado → dist/');
console.log('   Entry point: dist/src/index.js');
