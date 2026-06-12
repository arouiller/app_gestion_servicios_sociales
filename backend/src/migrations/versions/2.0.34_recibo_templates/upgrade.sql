-- Migración 2.0.34: Crear tabla recibo_templates para almacenar templates de recibos editables
-- Tabla con estructura modular para 5 bloques: encabezado, afiliado, detalles, pie, pageconfig

CREATE TABLE recibo_templates (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID del template',
  nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del template (ej: "Recibo Estándar")',
  descripcion TEXT COMMENT 'Descripción opcional del template',
  bloque_encabezado JSON COMMENT 'Bloque 1: Logo, empresa, contacto',
  bloque_afiliado JSON COMMENT 'Bloque 2: Datos del afiliado',
  bloque_detalles JSON COMMENT 'Bloque 3: Tabla de detalles (cuota, arancel, total)',
  bloque_pie JSON COMMENT 'Bloque 4: Pie de página, firma, aclaraciones',
  bloque_pageconfig JSON NOT NULL COMMENT 'Bloque 5 (OBLIGATORIO): Configuración de página (tamaño, márgenes, orientación, etc)',
  activo BOOLEAN DEFAULT FALSE COMMENT 'Template activo globalmente (solo uno activo a la vez)',
  usuario_id INT NOT NULL COMMENT 'FK: Usuario que creó el template (creador inmutable)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp de creación',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp de última actualización',

  UNIQUE KEY uk_activo_true (activo) COMMENT 'UNIQUE constraint: solo un template puede estar activo (mysql CASE workaround)',
  FOREIGN KEY fk_usuario_id (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_activo (activo),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Almacena templates de recibos personalizables por administrador';

-- Insert template por defecto con estructura básica completa
INSERT INTO recibo_templates (id, nombre, descripcion, bloque_pageconfig, usuario_id, created_at, updated_at)
VALUES (
  UUID(),
  'Template Predeterminado',
  'Template por defecto con estructura básica',
  '{
    "tamaño": "A4",
    "personalizado_ancho_mm": null,
    "personalizado_alto_mm": null,
    "orientacion": "portrait",
    "margen_superior_mm": 10,
    "margen_derecho_mm": 10,
    "margen_inferior_mm": 10,
    "margen_izquierdo_mm": 10,
    "recibos_por_pagina": 1,
    "layout": "vertical",
    "columnas_grilla": 1,
    "gap_vertical_mm": 5,
    "gap_horizontal_mm": 5
  }',
  1,
  NOW(),
  NOW()
);
