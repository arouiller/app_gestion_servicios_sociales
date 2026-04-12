const express = require('express');
const router = express.Router();
const personasController = require('../controllers/personasController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // Todas protegidas

router.get('/', personasController.search);

module.exports = router;
