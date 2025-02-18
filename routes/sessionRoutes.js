const express = require('express');
const router = express.Router();
const { loginUser, logoutUser } = require('../controllers/session');
const { body } = require('express-validator');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Login route
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], loginUser);

// Logout route
router.post('/logout', authenticateJWT, logoutUser);

module.exports = router;
