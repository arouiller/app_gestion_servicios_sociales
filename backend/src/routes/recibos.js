const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const recibosController = require('../controllers/v1.0/recibosController');

// POST /api/recibos/generar
// Generar recibos para un período
router.post('/generar', verifyToken, recibosController.generar);

// GET /api/recibos?periodo=YYYY-MM-DD
// Listar recibos de un período
router.get('/', verifyToken, recibosController.list);

// GET /api/recibos/:id
// Detalle de un recibo
router.get('/:id', verifyToken, recibosController.getById);

module.exports = router;
