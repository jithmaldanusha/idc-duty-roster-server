const express = require('express');
const router = express.Router();
const { getRosterByDate, updateRoster } = require("../controllers/settings");

// Fetch roster by year and month
router.get("/getRoster", getRosterByDate);
router.post('/updateRoster', updateRoster);

module.exports = router;
