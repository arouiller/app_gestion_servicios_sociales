-- Crear tabla recibo_templates para almacenar templates de recibos
CREATE TABLE IF NOT EXISTS recibo_templates (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  html LONGTEXT NOT NULL,
  page_size ENUM('A4', 'A5', 'Carta', 'Personalizado') DEFAULT 'A4',
  orientation ENUM('portrait', 'landscape') DEFAULT 'portrait',
  margins INT DEFAULT 8,
  activo BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
