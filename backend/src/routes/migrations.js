const express = require('express');
const router = express.Router();
const migrationsController = require('../controllers/migrationsController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication AND admin role
router.use(verifyToken);
router.use(requireAdmin);

// GET routes (read-only)
router.get('/list', migrationsController.list);
router.get('/history', migrationsController.history);
router.get('/stats', migrationsController.stats);
router.get('/preview/:version/:direction', migrationsController.preview);

module.exports = router;
