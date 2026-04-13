const express = require('express');
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const integranteServiciosController = require('../../controllers/v1.0/integranteServiciosController');

const router = express.Router();

// GET /api/v1.0/servicios-adicionales - List all available services
router.get('/servicios-adicionales', verifyToken, integranteServiciosController.listarServicios);

// GET /api/v1.0/integrante/:planIntegranteId/servicios - Get services for an integrante
router.get('/integrante/:planIntegranteId/servicios', verifyToken, integranteServiciosController.obtenerServiciosIntegrante);

// POST /api/v1.0/integrante/:planIntegranteId/servicios - Add service to integrante (admin)
router.post('/integrante/:planIntegranteId/servicios', verifyToken, requireAdmin, integranteServiciosController.agregarServicio);

// DELETE /api/v1.0/integrante/:planIntegranteId/servicios/:servicioNumero - Remove service from integrante (admin)
router.delete('/integrante/:planIntegranteId/servicios/:servicioNumero', verifyToken, requireAdmin, integranteServiciosController.eliminarServicio);

module.exports = router;
