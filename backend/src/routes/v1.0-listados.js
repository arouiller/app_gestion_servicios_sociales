const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/listadosController');

const router = express.Router();

// GET /api/v1.0/listados/por-zona/:zona_id?search=texto&page=1&limit=10
router.get('/por-zona/:zona_id', verifyToken, controller.porZona);

module.exports = router;
