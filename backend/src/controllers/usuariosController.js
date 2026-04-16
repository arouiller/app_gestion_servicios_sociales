const db = require('../models');

/**
 * PUT /api/usuarios/:id
 * Actualizar datos del usuario (tema preferido)
 */
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tema_preferido } = req.body;

    // Validar que el usuario existe
    const usuario = await db.Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Validar tema si se proporciona
    const temasValidos = ['claro', 'oscuro', 'azul', 'verde'];
    if (tema_preferido && !temasValidos.includes(tema_preferido)) {
      return res.status(400).json({
        success: false,
        message: 'Tema inválido. Temas válidos: claro, oscuro, azul, verde',
      });
    }

    // Actualizar solo los campos permitidos
    const camposPermitidos = ['tema_preferido'];
    const actualizaciones = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        actualizaciones[campo] = req.body[campo];
      }
    });

    if (Object.keys(actualizaciones).length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    await usuario.update(actualizaciones);

    return res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: usuario.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/usuarios/:id
 * Obtener datos del usuario actual
 */
exports.obtener = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await db.Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({
      success: true,
      data: usuario.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
