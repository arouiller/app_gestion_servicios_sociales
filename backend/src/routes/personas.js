const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const personasController = require('../controllers/v1.0/personasController');

// GET /api/personas?search=texto
// Búsqueda de personas
router.get('/', verifyToken, personasController.search);

module.exports = router;
