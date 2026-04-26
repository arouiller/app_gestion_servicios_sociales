require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const sequelize = require('./config/database');
const auditMiddleware = require('./middleware/audit');

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Middleware de auditoría ───────────────────────────────────────────────────
app.use(auditMiddleware);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/migrations', require('./routes/migrations'));
app.use('/api/planes', require('./routes/planes'));
app.use('/api/admin', require('./routes/admin'));

// Lookup (compartida por todas las versiones)
app.use('/api/lookup', require('./routes/lookup'));

// 1.0.x routes (refactor completado)
app.use('/api/personas', require('./routes/personas'));
app.use('/api/v1.0/planes', require('./routes/v1.0-planes'));
app.use('/api/v1.0/plan-integrantes', require('./routes/v1.0-plan-integrantes'));
app.use('/api/v1.0', require('./routes/v1.0/integrante-servicios'));
app.use('/api/v1.0/bugs', require('./routes/v1.0/bugs'));
app.use('/api/recibos', require('./routes/recibos'));

// ── Frontend estático ─────────────────────────────────────────────────────────
const frontendBuild = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

// ── Error handler global ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Arranque ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Base de datos conectada');

    app.listen(PORT, () => {
      console.log(`🚀 Backend corriendo en http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    // ── Limpieza diaria de audit_log según retención configurada ────────────
    setInterval(async () => {
      try {
        const { ConfiguracionApp, AuditLog } = require('./models');
        const { Op } = require('sequelize');
        const retConfig = await ConfiguracionApp.findOne({
          where: { tipo_notificacion: 'audit_retention_days' }
        });
        const days = retConfig ? retConfig.duracion_ms : 90;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const deleted = await AuditLog.destroy({ where: { fecha_hora: { [Op.lt]: cutoff } } });
        if (deleted > 0) {
          console.log(`[audit] limpieza: ${deleted} registros eliminados`);
        }
      } catch (err) {
        console.error('[audit] error en limpieza:', err.message);
      }
    }, 24 * 60 * 60 * 1000); // 24 horas
  } catch (err) {
    console.error('❌ Error al iniciar servidor:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

startServer();

module.exports = app;
