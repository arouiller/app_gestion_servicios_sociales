-- Upgrade 2.0.23: Eliminar tablas legacy no utilizadas

DROP TABLE IF EXISTS historial_grupo_familiar;
DROP TABLE IF EXISTS grupos_familiares;
DROP TABLE IF EXISTS afiliados;
DROP TABLE IF EXISTS planes_v2_backup;
