const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');
const { verifyToken } = require('../middleware/auth');

// All lookup routes require authentication (admin-only operations are handled per-route)
router.use(verifyToken);

// Lookup CRUD routes
router.get('/:entidad', lookupController.list);
router.post('/:entidad', lookupController.create);
router.put('/:entidad/:id', lookupController.update);
router.delete('/:entidad/:id', lookupController.delete);

module.exports = router;
