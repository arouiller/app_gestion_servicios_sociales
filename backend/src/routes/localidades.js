const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const localidadController = require('../controllers/localidadController');

router.use(verifyToken);

router.get('/', localidadController.list);
router.get('/by-provincia/:id', localidadController.byProvincia);
router.post('/', localidadController.create);
router.put('/:id', localidadController.update);
router.delete('/:id', localidadController.delete);

module.exports = router;
