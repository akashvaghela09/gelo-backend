const express = require('express');
const { register, login, checkUsername } = require('../controllers/authController');

const router = express.Router();

// Register endpoint
router.post('/register', register);

// Login endpoint
router.post('/login', login);

// Username availability endpoint
router.get('/check-username', checkUsername);

module.exports = router; 