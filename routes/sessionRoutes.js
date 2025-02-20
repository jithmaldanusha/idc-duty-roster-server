const express = require('express');
const router = express.Router();
const { loginUser, logoutUser, checkUsers, createSuper } = require('../controllers/session');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/logout', authenticateJWT, logoutUser);
router.get('/checkUsers', checkUsers);
router.post('/createSuper', createSuper);

module.exports = router;
