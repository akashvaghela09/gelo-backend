const express = require('express');
const { updateUserProfile, getNearbyUsers } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/users - Update user profile
router.post('/', authMiddleware, updateUserProfile);

// GET /api/users - Find nearby users
router.get('/', authMiddleware, getNearbyUsers);

module.exports = router; 