-- Migración 2.0.31: Crear tabla recibo_templates con soporte para versionado
CREATE TABLE IF NOT EXISTS recibo_templates (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  html LONGTEXT NOT NULL,
  page_size ENUM('A4', 'A5', 'Carta', 'Personalizado') DEFAULT 'A4',
  orientation ENUM('portrait', 'landscape') DEFAULT 'portrait',
  margins INT DEFAULT 8,
  activo BOOLEAN DEFAULT FALSE,
  template_group_id INT,
  version_number INT DEFAULT 1,
  created_by INT,
  updated_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo),
  INDEX idx_template_group_id (template_group_id),
  UNIQUE INDEX uk_template_group_version (template_group_id, version_number),
  FOREIGN KEY (template_group_id) REFERENCES recibo_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES usuarios(id),
  FOREIGN KEY (updated_by) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
