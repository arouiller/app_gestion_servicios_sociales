const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // Todas protegidas

router.get('/:entidad', lookupController.list);
router.post('/:entidad', lookupController.create);
router.put('/:entidad/:numero', lookupController.update);
router.delete('/:entidad/:numero', lookupController.delete);

module.exports = router;
