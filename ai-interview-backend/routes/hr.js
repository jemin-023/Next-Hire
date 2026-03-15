// routes/hr.js
// HR-facing read endpoints — leaderboard, candidate details, etc.

const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/hrController');

// GET /api/hr/leaderboard
// Returns all candidates ranked by composite score for a given company.
router.get('/leaderboard', getLeaderboard);

module.exports = router;
