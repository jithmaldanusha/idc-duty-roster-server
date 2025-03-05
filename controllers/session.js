const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require("../models/db")
const { validationResult } = require('express-validator');

exports.checkUsers = async (req, res) => {
  try {
    // Step 1: Check if the 'users' table exists in the database
    const tableCheckQuery = `SHOW TABLES LIKE 'user'`;
    const [tableCheckResult] = await db.query(tableCheckQuery);

    // Step 2: If the 'users' table doesn't exist, create it and return false
    if (tableCheckResult.length === 0) {
      const createTableQuery = `
        CREATE TABLE user (
          userid INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          email VARCHAR(255),
          fname VARCHAR(255),
          lname VARCHAR(255),
          lastlogin DATETIME,
          lastlogout DATETIME,
          sessiontoken VARCHAR(255)
        )
      `;
      await db.query(createTableQuery);
      return res.status(200).json({ exists: false }); // Table created, no users yet
    }

    // Step 3: Check if any user with role == 'super' exists
    const [result] = await db.query('SELECT COUNT(*) AS count FROM user WHERE role = ?', ['super']);
    const superUserCount = result[0].count;

    // If no 'super' user exists, return false
    if (superUserCount === 0) {
      return res.status(200).json({ exists: false });
    }

    // Step 4: Otherwise, return true (table exists and super user exists)
    return res.status(200).json({ exists: true });

  } catch (error) {
    console.error('Error checking users:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.createSuper = async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Step 1: Check if the username already exists
    const [existingUser] = await db.query('SELECT * FROM user WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Step 2: Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: Insert the new super user into the database
    const insertUserQuery = `
      INSERT INTO user (username, password, role) 
      VALUES (?, ?, 'super')
    `;
    await db.query(insertUserQuery, [username, hashedPassword]);

    return res.status(201).json({
      message: 'Super user created successfully',
    });
  } catch (error) {
    console.error('Error creating super user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

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
    const [user] = await db.query('SELECT * FROM user WHERE username = ?', [username]);
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
    await db.query('UPDATE user SET sessiontoken = ?, lastlogin = NOW() WHERE userid = ?', [token, validUser.userid]);

    // Return user details along with the token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        userid: validUser.userid,
        username: validUser.username,
        firstName: validUser.firstName,
        lastName: validUser.lastName,
        email: validUser.email,
        role: validUser.role,
        lastlogin: validUser.lastlogin, // Assuming it's available in the user object
        sessiontoken: token, // You can choose to include the session token
      }
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
    await db.query('UPDATE user SET token = NULL, logged_out_time = NOW() WHERE userid = ?', [userid]);

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.validateToken = (req, res) => {
  res.json({ valid: true, user: req.user });
};