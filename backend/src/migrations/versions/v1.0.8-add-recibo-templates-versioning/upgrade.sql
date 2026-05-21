-- Agregar columnas a tabla recibo_templates existente
ALTER TABLE recibo_templates
ADD COLUMN template_group_id INT,
ADD COLUMN version_number INT DEFAULT 1,
ADD COLUMN created_by INT,
ADD COLUMN updated_by INT;

-- Crear índices para consultas de versiones y template activo
CREATE INDEX idx_template_group_id ON recibo_templates(template_group_id);
CREATE INDEX idx_activo ON recibo_templates(activo);
CREATE UNIQUE INDEX uk_template_group_version ON recibo_templates(template_group_id, version_number);

-- Agregar foreign keys
ALTER TABLE recibo_templates
ADD CONSTRAINT fk_template_group FOREIGN KEY (template_group_id)
  REFERENCES recibo_templates(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by)
  REFERENCES usuarios(id),
ADD CONSTRAINT fk_updated_by FOREIGN KEY (updated_by)
  REFERENCES usuarios(id);

-- Opcional: crear tabla de auditoría para historial completo
CREATE TABLE recibo_template_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  html_snapshot LONGTEXT,
  changed_by INT NOT NULL,
  change_description VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES recibo_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES usuarios(id),
  INDEX idx_template_id (template_id)
);
