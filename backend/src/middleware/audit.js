const { ConfiguracionApp, AuditLog } = require('../models');

// Caché en memoria con TTL 30s
let configCache = null;
let cacheExpiry = 0;

async function getAuditConfig() {
  if (Date.now() < cacheExpiry && configCache !== null) return configCache;
  try {
    const rows = await ConfiguracionApp.findAll({
      where: { tipo_notificacion: ['audit_enabled', 'audit_retention_days'] }
    });
    const map = {};
    rows.forEach(r => { map[r.tipo_notificacion] = r.duracion_ms; });
    configCache = {
      enabled: map.audit_enabled ?? 1,
      retentionDays: map.audit_retention_days ?? 90
    };
    cacheExpiry = Date.now() + 30_000;
  } catch (err) {
    console.error('[audit] error al leer configuración:', err.message);
    configCache = { enabled: 1, retentionDays: 90 }; // defaults
    cacheExpiry = Date.now() + 30_000;
  }
  return configCache;
}

const SENSITIVE_KEYS = new Set(['password', 'token', 'jwt', 'secret', 'authorization', 'cookie']);

function sanitize(obj, depth = 0) {
  if (depth > 3 || obj === null || typeof obj !== 'object') return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      result[k] = '[REDACTED]';
    } else if (typeof v === 'string') {
      result[k] = v.length > 500 ? v.substring(0, 500) + '...' : v;
    } else if (typeof v === 'object') {
      result[k] = sanitize(v, depth + 1);
    } else {
      result[k] = v;
    }
  }
  return result;
}

module.exports = function auditMiddleware(req, res, next) {
  // Excluir rutas públicas
  if (req.path === '/api/health' || req.path.startsWith('/api/auth')) return next();

  const startTime = Date.now();

  res.on('finish', () => {
    if (!req.userId) return; // Solo requests autenticados

    getAuditConfig()
      .then(config => {
        if (!config.enabled) return; // Auditoría deshabilitada

        const params = {};
        if (req.query && Object.keys(req.query).length > 0) {
          params.query = sanitize(req.query);
        }
        if (req.body && Object.keys(req.body).length > 0) {
          params.body = sanitize(req.body);
        }

        const parametros_json = Object.keys(params).length > 0
          ? JSON.stringify(params).substring(0, 2000)
          : null;

        setImmediate(() => {
          AuditLog.create({
            usuario_id: req.userId,
            metodo: req.method,
            endpoint: req.originalUrl.substring(0, 500),
            parametros_json,
            status_response: res.statusCode,
            duracion_ms: Date.now() - startTime,
          }).catch(() => {}); // Silenciar errores para no afectar requests
        });
      })
      .catch(() => {}); // Silenciar errores en config fetch
  });

  next();
};
