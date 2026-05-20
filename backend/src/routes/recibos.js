const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const recibosController = require('../controllers/recibosController');

// POST /api/recibos/generar
// Generar recibos para un período
router.post('/generar', verifyToken, recibosController.generar);

// GET /api/recibos/periodos
// Listar todos los períodos con recibos generados
router.get('/periodos', verifyToken, recibosController.listPeriodos);

// GET /api/recibos/ultimo-aumento-masivo
// Obtener el último aumento masivo realizado
router.get('/ultimo-aumento-masivo', verifyToken, recibosController.getUltimoAumentoMasivo);

// GET /api/recibos?periodo=YYYY-MM-DD
// Listar recibos de un período
router.get('/', verifyToken, recibosController.list);

// GET /api/recibos/numero-max
// Obtener el número máximo de recibo + 1 como sugerencia
router.get('/numero-max', verifyToken, recibosController.getMaxNumeroRecibo);

// GET /api/recibos/generar-pdf
// Generar PDF con todos los recibos de un período
router.get('/generar-pdf', verifyToken, recibosController.generarPDF);

// DELETE /api/recibos/periodo/:periodo
// Eliminar todos los recibos de un período
router.delete('/periodo/:periodo', verifyToken, recibosController.deletePeriodo);

// GET /api/recibos/:id
// Detalle de un recibo (DEBE estar al final porque es catch-all)
router.get('/:id', verifyToken, recibosController.getById);

module.exports = router;
