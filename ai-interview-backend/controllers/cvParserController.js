// controllers/cvParserController.js
// Handles resume upload and parsing via the CV Parser API.
// Endpoints:
//   POST /api/cv/parse   — upload resume → get structured cv_profile JSON
//   GET  /api/cv/health  — proxy health check

const cvParserService = require('../services/cvParserService');
const pool = require('../db');

// ── POST /api/cv/parse ─────────────────────────────────────────────────────
// Accepts multipart resume (field: "file", PDF/DOCX).
// Forwards to CV Parser microservice, returns the cv_profile JSON.
// Optionally stores the parsed profile for the candidate in the DB.
const parseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file provided. Upload a PDF or DOCX as field "file".' });
    }

    if (!process.env.CV_PARSER_API_URL) {
      return res.status(503).json({ error: 'CV_PARSER_API_URL not configured. Set it in .env or POST /api/config.' });
    }

    // Forward the file to the CV Parser API
    let cvProfile;
    try {
      cvProfile = await cvParserService.parseResume(req.file.buffer, req.file.originalname);
    } catch (err) {
      const status = err.response?.status || 502;
      const detail = err.response?.data?.detail || err.message;
      console.error('CV Parser API error:', detail);
      return res.status(status).json({ error: `CV Parser failed: ${detail}` });
    }

    // Optionally persist cv_profile to candidates table
    const { candidateId } = req.body;
    if (candidateId) {
      try {
        await pool.query(
          'UPDATE candidates SET cv_profile = $1 WHERE id = $2',
          [JSON.stringify(cvProfile), candidateId]
        );
      } catch (dbErr) {
        console.warn('DB update cv_profile skipped (column may not exist):', dbErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Resume parsed successfully',
      cv_profile: cvProfile,
    });
  } catch (err) {
    console.error('parseResume error:', err);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
};

// ── GET /api/cv/health ─────────────────────────────────────────────────────
const getHealth = async (req, res) => {
  try {
    if (!process.env.CV_PARSER_API_URL) {
      return res.json({ status: 'offline', message: 'CV_PARSER_API_URL not configured in .env', model: null });
    }
    const health = await cvParserService.getHealth();
    res.json({ success: true, ...health });
  } catch (err) {
    res.json({ status: 'unreachable', message: 'CV Parser API not responding. Check Kaggle notebook.', model: null });
  }
};

module.exports = { parseResume, getHealth };
