-- Create recibo_templates table for storing HTML templates
CREATE TABLE recibo_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  html LONGTEXT NOT NULL,
  version INT DEFAULT 1,
  activo BOOLEAN DEFAULT false,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_activo (activo),
  INDEX idx_usuario_id (usuario_id)
);

-- Insert default template
INSERT INTO recibo_templates (nombre, version, activo, usuario_id, descripcion, html)
VALUES (
  'Recibo Estándar 2026',
  1,
  true,
  1,
  'Template por defecto para generación de recibos en PDF',
  '<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background-color: #34495e;
      color: white;
      padding: 12px;
      text-align: left;
      border: 1px solid #2c3e50;
      font-weight: bold;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #bdc3c7;
    }
    tr:nth-child(even) {
      background-color: #ecf0f1;
    }
  </style>
</head>
<body>
  <h2>Recibos — {{periodo}}</h2>
  <table>
    <thead>
      <tr>
        <th>N° Recibo</th>
        <th>Afiliado</th>
        <th>Titular</th>
        <th>Obra Social</th>
        <th>Valor Cuota</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{numero_recibo}}</td>
        <td>{{numero_afiliado}}</td>
        <td>{{titular_apellido}}, {{titular_nombre}}</td>
        <td>{{obra_social_nombre}}</td>
        <td>${{valor_cuota}}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>'
);
