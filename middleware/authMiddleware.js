const jwt = require('jsonwebtoken');
const pool = require('../models/db');

// Middleware to authenticate the JWT token
exports.authenticateJWT = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check if token exists in the database
    const [user] = await pool.query('SELECT * FROM users WHERE userid = ? AND token = ?', [decoded.userid, token]);
    if (!user.length) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};
