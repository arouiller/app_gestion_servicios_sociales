-- Upgrade 2.0.26: Crear tabla aumentos_masivos para registrar cada operación de aumento masivo

CREATE TABLE `aumentos_masivos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `porcentaje` DECIMAL(10,2) NOT NULL,
  `usuario_id` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_aumentos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_aumentos_fecha` ON `aumentos_masivos` (`fecha` DESC);
CREATE INDEX `idx_aumentos_usuario` ON `aumentos_masivos` (`usuario_id`);
