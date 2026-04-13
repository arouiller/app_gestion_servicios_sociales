const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// All lookup routes require authentication AND admin role
router.use(verifyToken);
router.use(requireAdmin);

// Lookup CRUD routes
router.get('/:entidad', lookupController.list);
router.post('/:entidad', lookupController.create);
router.put('/:entidad/:id', lookupController.update);
router.delete('/:entidad/:id', lookupController.delete);

module.exports = router;
