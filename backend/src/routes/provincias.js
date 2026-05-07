const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const provinciaController = require('../controllers/provinciaController');

router.use(verifyToken);

router.get('/', provinciaController.list);
router.post('/', provinciaController.create);
router.put('/:id', provinciaController.update);
router.delete('/:id', provinciaController.delete);

module.exports = router;
