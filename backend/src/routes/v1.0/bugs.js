const express = require('express');
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const bugsController = require('../../controllers/v1.0/bugsController');

const router = express.Router();

router.get('/', verifyToken, bugsController.listar);

router.get('/:id', verifyToken, bugsController.obtener);

router.post('/', verifyToken, bugsController.crear);

router.put('/:id/estado', verifyToken, requireAdmin, bugsController.cambiarEstado);

module.exports = router;
