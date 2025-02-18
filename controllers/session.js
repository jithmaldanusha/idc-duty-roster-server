const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require("../models/db")
const { validationResult } = require('express-validator');

// Function to handle login
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user exists
    const [user] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validUser = user[0];

    // Check if password matches
    const isPasswordMatch = await bcrypt.compare(password, validUser.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    // Create JWT token
    const token = jwt.sign({ userid: validUser.userid }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Update user's token and login time
    await pool.query('UPDATE users SET token = ?, logged_in_time = NOW() WHERE userid = ?', [token, validUser.userid]);

    return res.status(200).json({
      message: 'Login successful',
      token: token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Function to handle logout
exports.logoutUser = async (req, res) => {
  try {
    const { userid } = req.user;

    // Invalidate the token by clearing it and updating logged out time
    await db.query('UPDATE users SET token = NULL, logged_out_time = NOW() WHERE userid = ?', [userid]);

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
