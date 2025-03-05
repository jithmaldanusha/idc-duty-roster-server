const express = require('express');
const router = express.Router();
const { loginUser, logoutUser, checkUsers, createSuper, validateToken } = require('../controllers/session');
const authenticate = require("../middleware/authMiddleware")

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/checkUsers', checkUsers);
router.post('/createSuper', createSuper);
router.get('/validate-token', authenticate, validateToken);

module.exports = router;
