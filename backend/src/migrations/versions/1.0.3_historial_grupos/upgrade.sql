-- Migración 1.0.3: Historial de membresía de grupos familiares

CREATE TABLE IF NOT EXISTS historial_grupo_familiar (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id      INT NOT NULL,
  afiliado_id   INT NOT NULL,
  accion        ENUM('ingreso','baja') NOT NULL,
  usuario_id    INT NOT NULL,
  notas         VARCHAR(255) NULL,
  fecha         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hgf_grupo    FOREIGN KEY (grupo_id)    REFERENCES grupos_familiares(id) ON DELETE CASCADE,
  CONSTRAINT fk_hgf_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id)         ON DELETE CASCADE,
  CONSTRAINT fk_hgf_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)           ON DELETE CASCADE,
  INDEX idx_hgf_grupo    (grupo_id),
  INDEX idx_hgf_afiliado (afiliado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
