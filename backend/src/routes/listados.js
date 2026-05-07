const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/listadosController');

const router = express.Router();

// GET /api/listados?search=texto&page=1&limit=10
router.get('/', verifyToken, controller.getAll);

module.exports = router;
