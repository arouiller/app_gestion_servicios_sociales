const { ReciboTemplate, Usuario } = require('../../models');
const {
  validateTemplate,
  getAllPlaceholders,
  placeholders,
} = require('../../utils/validators/templateValidator');

// GET /api/admin/recibos/templates/active
exports.getActiveTemplate = async (req, res) => {
  try {
    const template = await ReciboTemplate.findOne({
      where: { activo: true },
    });

    if (!template) {
      return res.status(404).json({
        error: 'No active template found',
      });
    }

    return res.json({
      id: template.id,
      nombre: template.nombre,
      html: template.html,
      pageSize: template.pageSize,
      orientation: template.orientation,
      margins: template.margins,
      activo: template.activo,
      templateGroupId: template.templateGroupId,
      versionNumber: template.versionNumber,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching active template:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// GET /api/admin/recibos/placeholders
exports.getPlaceholders = async (req, res) => {
  try {
    const result = {
      categories: {
        recibo: placeholders.recibo.map((p) => ({
          placeholder: `{{${p}}}`,
          label: p.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        })),
        monetarios: placeholders.monetarios.map((p) => ({
          placeholder: `{{${p}}}`,
          label: p.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        })),
      },
    };
    return res.json(result);
  } catch (error) {
    console.error('Error fetching placeholders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/recibos/templates/save
exports.saveTemplate = async (req, res) => {
  try {
    const { id, html, pageSize, orientation, margins, saveMode } = req.body;
    const userId = req.user.id;

    // Validar entrada
    const validationErrors = validateTemplate({
      html,
      pageSize,
      orientation,
      margins,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
      });
    }

    if (saveMode === 'overwrite') {
      // Sobrescribir template existente
      const template = await ReciboTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      template.html = html;
      template.pageSize = pageSize;
      template.orientation = orientation;
      template.margins = margins;
      template.updatedBy = userId;

      await template.save();

      const updated = await template.reload({
        include: [
          { as: 'creator', attributes: ['id', 'nombre'] },
          { as: 'updater', attributes: ['id', 'nombre'] },
        ],
      });

      return res.json({
        success: true,
        templateId: template.id,
        versionNumber: template.versionNumber,
        message: 'Template actualizado',
        template: {
          id: updated.id,
          nombre: updated.nombre,
          html: updated.html,
          pageSize: updated.pageSize,
          orientation: updated.orientation,
          margins: updated.margins,
          activo: updated.activo,
          templateGroupId: updated.templateGroupId,
          versionNumber: updated.versionNumber,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          createdBy: updated.creator,
          updatedBy: updated.updater,
        },
      });
    } else if (saveMode === 'new_version') {
      // Crear nueva versión y desactivar anteriores
      const currentTemplate = await ReciboTemplate.findByPk(id);
      if (!currentTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const templateGroupId = currentTemplate.templateGroupId || id;
      const nextVersion =
        (await ReciboTemplate.max('versionNumber', {
          where: { templateGroupId },
        })) + 1;

      // Desactivar todas las versiones del grupo
      await ReciboTemplate.update(
        { activo: false },
        { where: { templateGroupId } }
      );

      // Crear nueva versión
      const newTemplate = await ReciboTemplate.create({
        nombre: currentTemplate.nombre,
        html,
        pageSize,
        orientation,
        margins,
        activo: true,
        templateGroupId,
        versionNumber: nextVersion,
        createdBy: userId,
        updatedBy: userId,
      });

      const created = await newTemplate.reload({
        include: [
          { as: 'creator', attributes: ['id', 'nombre'] },
          { as: 'updater', attributes: ['id', 'nombre'] },
        ],
      });

      return res.status(201).json({
        success: true,
        templateId: newTemplate.id,
        versionNumber: newTemplate.versionNumber,
        message: `Nueva versión v${nextVersion} creada y establecida como activa`,
        template: {
          id: created.id,
          nombre: created.nombre,
          html: created.html,
          pageSize: created.pageSize,
          orientation: created.orientation,
          margins: created.margins,
          activo: created.activo,
          templateGroupId: created.templateGroupId,
          versionNumber: created.versionNumber,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          createdBy: created.creator,
          updatedBy: created.updater,
        },
      });
    } else {
      return res.status(400).json({
        error: 'saveMode debe ser "overwrite" o "new_version"',
      });
    }
  } catch (error) {
    console.error('Error saving template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/admin/recibos/templates/versions
exports.getVersions = async (req, res) => {
  try {
    const { templateGroupId } = req.query;

    if (!templateGroupId) {
      return res.status(400).json({ error: 'templateGroupId is required' });
    }

    const versions = await ReciboTemplate.findAll({
      where: { templateGroupId },
      attributes: [
        'id',
        'versionNumber',
        'nombre',
        'activo',
        'createdAt',
        'updatedAt',
      ],
      order: [['versionNumber', 'ASC']],
    });

    return res.json({
      templateGroupId,
      versions,
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
