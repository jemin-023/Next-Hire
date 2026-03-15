// routes/interview.js
// Interview lifecycle endpoints:
//   start     → create a new interview session
//   next      → receive an answer, return the next question
//   end       → finalise the interview and trigger scoring
//   resume    → restore session state after page refresh
//   autosave  → manually trigger transcript autosave

const express = require('express');
const router = express.Router();
const {
  startInterview,
  nextQuestion,
  endInterview,
  resumeInterview,
  triggerAutosave,
} = require('../controllers/interviewController');

// POST /api/interview/start
router.post('/start', startInterview);

// POST /api/interview/next
router.post('/next', nextQuestion);

// POST /api/interview/end
router.post('/end', endInterview);

// GET /api/interview/resume/:interviewId
router.get('/resume/:interviewId', resumeInterview);

// GET /api/interview/autosave/:interviewId
router.get('/autosave/:interviewId', triggerAutosave);

module.exports = router;
