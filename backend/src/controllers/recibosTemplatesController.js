const db = require('../models');
const { v4: uuidv4 } = require('uuid');

let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.warn('Puppeteer not available - PDF generation disabled:', err.message);
}

const MAX_TEMPLATES = 5;

/**
 * GET /api/admin/recibos/templates
 * Listar todos los templates con usuario creador
 */
exports.list = async (req, res, next) => {
  try {
    const templates = await db.ReciboTemplate.findAll({
      attributes: ['id', 'nombre', 'descripcion', 'activo', 'created_at', 'updated_at', 'usuario_id'],
      include: [
        {
          model: db.Usuario,
          as: 'creador',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/recibos/templates/:id
 * Obtener template específico con estructura JSON completa
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await db.ReciboTemplate.findByPk(id, {
      include: [
        {
          model: db.Usuario,
          as: 'creador',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    // Inicializar bloque_positions con valores por defecto si no existen
    if (!template.bloque_positions) {
      template.bloque_positions = {
        encabezado: { x: 10, y: 10, width: 190, height: 50 },
        afiliado: { x: 10, y: 65, width: 190, height: 40 },
        detalles: { x: 10, y: 110, width: 190, height: 60 },
        pie: { x: 10, y: 175, width: 190, height: 30 }
      };
    }

    return res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/recibos/templates
 * Crear nuevo template
 * Body: { nombre, descripcion?, bloque_encabezado?, bloque_afiliado?, bloque_detalles?, bloque_pie?, bloque_pageconfig }
 */
exports.create = async (req, res, next) => {
  try {
    const { nombre, descripcion, bloque_encabezado, bloque_afiliado, bloque_detalles, bloque_pie, bloque_pageconfig } = req.body;
    const usuario_id = req.user?.id;

    // Validación: nombre obligatorio
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del template es obligatorio'
      });
    }

    // Validación: Bloque 5 obligatorio
    if (!bloque_pageconfig) {
      return res.status(400).json({
        success: false,
        message: 'Bloque 5 (Configuración de Página) es obligatorio'
      });
    }

    // Validación: máximo 5 templates por instancia
    const count = await db.ReciboTemplate.count();
    if (count >= MAX_TEMPLATES) {
      return res.status(400).json({
        success: false,
        message: `Límite de ${MAX_TEMPLATES} templates alcanzado`
      });
    }

    // Advertencia si hay 4+ templates
    const warning = count >= 4 ? `Advertencia: Tienes ${count} templates. Máximo permitido: ${MAX_TEMPLATES}` : null;

    const template = await db.ReciboTemplate.create({
      id: uuidv4(),
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      bloque_encabezado: bloque_encabezado || null,
      bloque_afiliado: bloque_afiliado || null,
      bloque_detalles: bloque_detalles || null,
      bloque_pie: bloque_pie || null,
      bloque_pageconfig: bloque_pageconfig,
      usuario_id
    });

    return res.status(201).json({
      success: true,
      templateId: template.id,
      message: 'Template creado exitosamente',
      warning
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/recibos/templates/:id
 * Actualizar template existente
 * Body: { nombre?, descripcion?, bloque_encabezado?, bloque_afiliado?, bloque_detalles?, bloque_pie?, bloque_pageconfig? }
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, bloque_encabezado, bloque_afiliado, bloque_detalles, bloque_pie, bloque_pageconfig } = req.body;

    const template = await db.ReciboTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    // Validación: Bloque 5 completo si se proporciona
    if (bloque_pageconfig) {
      if (!bloque_pageconfig.tamaño || !bloque_pageconfig.orientacion) {
        return res.status(400).json({
          success: false,
          message: 'Bloque 5 incompleto: falta tamaño u orientación'
        });
      }
    }

    // Actualizar campos (usuario_id NO cambia)
    if (nombre) template.nombre = nombre.trim();
    if (descripcion !== undefined) template.descripcion = descripcion?.trim() || null;
    if (bloque_encabezado !== undefined) template.bloque_encabezado = bloque_encabezado;
    if (bloque_afiliado !== undefined) template.bloque_afiliado = bloque_afiliado;
    if (bloque_detalles !== undefined) template.bloque_detalles = bloque_detalles;
    if (bloque_pie !== undefined) template.bloque_pie = bloque_pie;
    if (bloque_pageconfig !== undefined) template.bloque_pageconfig = bloque_pageconfig;
    if (req.body.bloques !== undefined) template.bloques = req.body.bloques;

    await template.save();

    return res.status(200).json({
      success: true,
      message: 'Template actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/recibos/templates/:id/activar
 * Activar template (desactivar anterior)
 */
exports.activate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await db.ReciboTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    // Validación: no está eliminado (en este caso, simplemente que exista)
    // Desactivar template anterior si existe
    const previousActive = await db.ReciboTemplate.findOne({ where: { activo: true } });
    if (previousActive && previousActive.id !== id) {
      previousActive.activo = false;
      await previousActive.save();
    }

    // Activar template actual
    template.activo = true;
    await template.save();

    return res.status(200).json({
      success: true,
      message: 'Template activado exitosamente',
      activo: true
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/recibos/templates/:id
 * Eliminar template (no puede ser activo)
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await db.ReciboTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    // Validación: no puede estar activo
    if (template.activo) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un template activo. Desactívalo primero.'
      });
    }

    await template.destroy();

    return res.status(200).json({
      success: true,
      message: 'Template eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/recibos/templates/:id/duplicar
 * Duplicar template con nuevo nombre
 * Body: { nombre_copia?: 'nombre custom' }
 */
exports.duplicate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_copia } = req.body;
    const usuario_id = req.user?.id;

    const template = await db.ReciboTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const newName = nombre_copia ? nombre_copia.trim() : `Copia - ${template.nombre}`;

    const newTemplate = await db.ReciboTemplate.create({
      id: uuidv4(),
      nombre: newName,
      descripcion: template.descripcion,
      bloque_encabezado: template.bloque_encabezado,
      bloque_afiliado: template.bloque_afiliado,
      bloque_detalles: template.bloque_detalles,
      bloque_pie: template.bloque_pie,
      bloque_pageconfig: template.bloque_pageconfig,
      activo: false,
      usuario_id
    });

    return res.status(201).json({
      success: true,
      templateId: newTemplate.id,
      nombre: newTemplate.nombre
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/recibos/placeholders
 * Listar placeholders disponibles categorizados
 */
exports.getPlaceholders = async (req, res, next) => {
  try {
    const placeholders = {
      afiliado: [
        '{{numero_afiliado}}',
        '{{tipo_documento}}',
        '{{numero_documento}}',
        '{{titular_apellido}}',
        '{{titular_nombre}}',
        '{{fecha_nacimiento}}',
        '{{obra_social_nombre}}',
        '{{tipo_plan_nombre}}',
        '{{tipo_de_grupo_nombre}}',
        '{{domicilio}}',
        '{{localidad_nombre}}',
        '{{fecha_cobertura}}',
        '{{zona_codigo}}'
      ],
      monetarios: [
        '{{valor_cuota}}',
        '{{cuota_social}}',
        '{{arancel_por_servicio}}'
      ],
      metadata: [
        '{{numero_recibo}}',
        '{{periodo}}',
        '{{fecha_generacion}}'
      ],
      empresa: [
        '{{empresa_nombre}}',
        '{{empresa_direccion}}',
        '{{empresa_telefono}}',
        '{{empresa_email}}',
        '{{empresa_sitio}}'
      ]
    };

    return res.status(200).json({
      success: true,
      placeholders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/recibos/templates/:templateId/generar-pdf
 * Generar PDF con datos de persona o ficticios
 * Body: { persona_id?: 123 } | { usar_datos_ficticios?: true }
 */
exports.generatePdf = async (req, res, next) => {
  try {
    // Verificar que Puppeteer está disponible
    if (!puppeteer) {
      return res.status(503).json({
        success: false,
        message: 'Funcionalidad de generación de PDF no disponible en este servidor'
      });
    }

    const { templateId } = req.params;
    const { persona_id, usar_datos_ficticios } = req.body;

    const template = await db.ReciboTemplate.findByPk(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    // Validación: Bloque 5 obligatorio
    if (!template.bloque_pageconfig) {
      return res.status(400).json({
        success: false,
        message: 'Template incompleto: falta Bloque 5 (Configuración de Página)'
      });
    }

    // Obtener datos de persona o usar ficticios
    let personaData = getDummyPersonaData();

    if (persona_id && !usar_datos_ficticios) {
      try {
        const persona = await db.Persona.findByPk(persona_id);
        if (persona) {
          personaData = { ...personaData, ...persona.toJSON() };
        }
      } catch (err) {
        // Fallback a ficticios si error
        console.warn('Error loading persona, using dummy data:', err.message);
      }
    }

    // Renderizar HTML desde template
    const html = serializeTemplate(template, personaData);

    // Usar Puppeteer para generar PDF
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Timeout 30 segundos para generación de PDF
    await page.goto(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();

    // Responder con binario
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibo_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Función auxiliar: Serializar template JSON a HTML
 */
function serializeTemplate(template, personaData) {
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>';

  // CSS base para márgenes y layout
  const pageConfig = template.bloque_pageconfig || {};
  const margenTop = pageConfig.margen_superior_mm || 10;
  const margenRight = pageConfig.margen_derecho_mm || 10;
  const margenBottom = pageConfig.margen_inferior_mm || 10;
  const margenLeft = pageConfig.margen_izquierdo_mm || 10;

  html += `
    body {
      margin: ${margenTop}mm ${margenRight}mm ${margenBottom}mm ${margenLeft}mm;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
    .bloque { margin-bottom: 10px; }
    .recibos-container { display: flex; flex-wrap: wrap; }
    .recibo { border: 1px solid #ddd; padding: 10px; margin: 5px; }
  </style></head><body>`;

  // Insertar Bloque 1: Encabezado
  if (template.bloque_encabezado) {
    html += '<div class="bloque encabezado">';
    const encabezado = template.bloque_encabezado;
    if (encabezado.empresa_nombre) html += `<h2>${encabezado.empresa_nombre}</h2>`;
    if (encabezado.empresa_direccion) html += `<p>${encabezado.empresa_direccion}</p>`;
    html += '</div>';
  }

  // Contenedor para recibos múltiples
  html += '<div class="recibos-container">';

  // Cantidad de recibos por página
  const recibosPerPage = pageConfig.recibos_por_pagina || 1;

  for (let i = 0; i < recibosPerPage; i++) {
    html += '<div class="recibo">';

    // Bloque 2: Afiliado
    if (template.bloque_afiliado) {
      html += '<div class="bloque afiliado"><h3>Datos del Afiliado</h3><table border="1" cellpadding="5">';
      const afiliado = template.bloque_afiliado;
      if (Array.isArray(afiliado.filas)) {
        afiliado.filas.forEach(fila => {
          if (fila.visible !== false) {
            const value = replacePlaceholders(fila.placeholder, personaData);
            html += `<tr><td>${fila.etiqueta}</td><td>${value}</td></tr>`;
          }
        });
      }
      html += '</table></div>';
    }

    // Bloque 3: Detalles
    if (template.bloque_detalles) {
      html += '<div class="bloque detalles"><table border="1" cellpadding="5">';
      const detalles = template.bloque_detalles;
      if (Array.isArray(detalles.filas)) {
        detalles.filas.forEach(fila => {
          const value = replacePlaceholders(fila.placeholder, personaData);
          html += `<tr><td>${fila.etiqueta}</td><td>${value}</td></tr>`;
        });
      }
      html += '</table></div>';
    }

    // Bloque 4: Pie
    if (template.bloque_pie) {
      html += '<div class="bloque pie">';
      const pie = template.bloque_pie;
      if (pie.aclaracion) html += `<p><em>${pie.aclaracion}</em></p>`;
      if (pie.texto_legal) html += `<p><small>${pie.texto_legal}</small></p>`;
      if (pie.mostrar_linea_firma) html += '<div style="margin-top: 20px; border-top: 1px solid #000; width: 200px;"></div>';
      html += '</div>';
    }

    html += '</div>';
  }

  html += '</div></body></html>';

  return html;
}

/**
 * Función auxiliar: Reemplazar placeholders con datos
 */
function replacePlaceholders(text, personaData) {
  if (!text) return '';

  return text.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
    const value = personaData[placeholder];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Función auxiliar: Datos ficticios predefinidos
 */
function getDummyPersonaData() {
  return {
    persona_id: null,
    numero_afiliado: '0001',
    tipo_documento: 'DNI',
    numero_documento: '12345678',
    titular_apellido: 'Pérez',
    titular_nombre: 'Juan',
    fecha_nacimiento: '1985-05-15',
    obra_social_nombre: 'OSDE',
    tipo_plan_nombre: 'Plan Superior',
    tipo_de_grupo_nombre: 'Familia',
    domicilio: 'Calle 123, Piso 4',
    localidad_nombre: 'Buenos Aires',
    fecha_cobertura: '2024-01-01',
    zona_codigo: '001',
    valor_cuota: '250.50',
    cuota_social: '150.00',
    arancel_por_servicio: '100.50',
    numero_recibo: 'REC-20260612-001',
    periodo: '2026-06',
    fecha_generacion: new Date().toISOString(),
    empresa_nombre: 'Mi Empresa',
    empresa_direccion: 'Av. Principal 999',
    empresa_telefono: '011-1234-5678',
    empresa_email: 'info@miempresa.com',
    empresa_sitio: 'www.miempresa.com'
  };
}

module.exports = exports;
