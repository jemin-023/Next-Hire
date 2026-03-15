// routes/aiDetector.js
// COMPANY-SIDE ONLY routes for AI answer detection.
// These must NEVER be called from the candidate portal.
// Mount under /api/detector/ — accessible only to HR/company frontend.

const express = require('express');
const router = express.Router();
const {
  getHealth,
  detectAnswer,
  detectTranscript,
  getResults,
} = require('../controllers/aiDetectorController');

// GET  /api/detector/health             — check if detector API is online
router.get('/health', getHealth);

// POST /api/detector/detect             — analyze a single Q&A pair
router.post('/detect', detectAnswer);

// POST /api/detector/transcript         — full transcript audit
router.post('/transcript', detectTranscript);

// GET  /api/detector/results/:interviewId — fetch all detection results (HR dashboard)
router.get('/results/:interviewId', getResults);

module.exports = router;
