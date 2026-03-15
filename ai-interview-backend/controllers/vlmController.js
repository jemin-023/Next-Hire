// controllers/vlmController.js
// Handles:
//   - Candidate photo upload for pre-interview identity registration
//   - Retrieving stored reference photo for verification display
//   - Proxying VLM Proctoring API /analyze_base64 for live identity + cheat detection
//   - Logging live proctoring events (look-away, multiple faces, etc.)
//   - Fetching proctoring events for a given interview (HR dashboard)
//   - Proxying VLM Proctoring API health check

const path = require('path');
const proctoringService = require('../services/proctoringService');
const pool = require('../db');

// ── POST /api/vlm/upload-photo ─────────────────────────────────────────────
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const { candidateId } = req.body;
    const photoUrl = `/uploads/${req.file.filename}`;

    if (candidateId) {
      try {
        await pool.query('UPDATE candidates SET photo_url = $1 WHERE id = $2', [photoUrl, candidateId]);
      } catch (dbErr) {
        console.warn('DB update skipped (photo_url column may not exist):', dbErr.message);
      }
    }

    res.json({ success: true, photo_url: photoUrl, candidateId: candidateId || null, message: 'Photo uploaded successfully' });
  } catch (err) {
    console.error('uploadPhoto error:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

// ── GET /api/vlm/verify-face/:candidateId ──────────────────────────────────
const verifyFace = async (req, res) => {
  try {
    const { candidateId } = req.params;

    try {
      const result = await pool.query('SELECT photo_url, name, email FROM candidates WHERE id = $1', [candidateId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });

      const { photo_url, name, email } = result.rows[0];
      return res.json({ success: true, candidateId: parseInt(candidateId), name, email, photo_url, verified: !!photo_url });
    } catch (dbErr) {
      console.warn('DB query skipped:', dbErr.message);
      return res.json({ success: true, candidateId: parseInt(candidateId), name: 'Unknown', email: '', photo_url: null, verified: false, _mock: true });
    }
  } catch (err) {
    console.error('verifyFace error:', err);
    res.status(500).json({ error: 'Failed to retrieve candidate photo' });
  }
};

// ── POST /api/vlm/analyze ──────────────────────────────────────────────────
// Proxies to VLM Proctoring API POST /analyze_base64
// Body: { reference (base64), frame (base64), interviewId? }
// Sends webcam frame + ID photo for identity match + cheat detection.
// Should be called every 30-60s during an active interview.
const analyzeFrame = async (req, res) => {
  try {
    const { reference, frame, interviewId } = req.body;

    if (!reference || !frame) {
      return res.status(400).json({ error: 'Both "reference" (base64 ID photo) and "frame" (base64 webcam frame) are required' });
    }

    if (!process.env.VLM_PROCTORING_API_URL) {
      return res.status(503).json({ error: 'VLM_PROCTORING_API_URL not configured. Set it in .env or POST /api/config.' });
    }

    let result;
    try {
      result = await proctoringService.analyzeBase64(reference, frame);
    } catch (err) {
      const status = err.response?.status || 502;
      const detail = err.response?.data?.detail || err.message;
      console.error('VLM Proctoring API error:', detail);
      return res.status(status).json({ error: `Proctoring API failed: ${detail}` });
    }

    // If an alert was triggered, log it as a proctoring event in the DB
    if (result.alert && interviewId) {
      try {
        // Map alert to event type
        let eventType = 'cheat_flag';
        if (!result.identity?.match) eventType = 'identity_mismatch';
        if (result.cheating?.cheating) eventType = 'cheating_detected';

        await pool.query(
          `INSERT INTO vlm_events (interview_id, event_type, confidence, details) VALUES ($1, $2, $3, $4)`,
          [interviewId, eventType, 0.9, result.alert_reason || JSON.stringify(result)]
        );
      } catch (dbErr) {
        console.warn('DB insert vlm_events skipped:', dbErr.message);
      }
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('analyzeFrame error:', err);
    res.status(500).json({ error: 'Failed to analyze frame' });
  }
};

// ── POST /api/vlm/proctor-event ────────────────────────────────────────────
const logProctoringEvent = async (req, res) => {
  try {
    const { interviewId, eventType, confidence = 0.9, details = '' } = req.body;

    if (!interviewId || !eventType) {
      return res.status(400).json({ error: 'interviewId and eventType are required' });
    }

    let eventId = null;
    try {
      const result = await pool.query(
        `INSERT INTO vlm_events (interview_id, event_type, confidence, details) VALUES ($1, $2, $3, $4) RETURNING id, detected_at`,
        [interviewId, eventType, confidence, details]
      );
      eventId = result.rows[0].id;
    } catch (dbErr) {
      console.warn('DB insert skipped (vlm_events table may not exist):', dbErr.message);
      eventId = Date.now();
    }

    res.json({ success: true, event: { id: eventId, interviewId, eventType, confidence, details, detectedAt: new Date().toISOString() } });
  } catch (err) {
    console.error('logProctoringEvent error:', err);
    res.status(500).json({ error: 'Failed to log proctoring event' });
  }
};

// ── GET /api/vlm/events/:interviewId ──────────────────────────────────────
const getProctoringEvents = async (req, res) => {
  try {
    const { interviewId } = req.params;
    let events = [];

    try {
      const result = await pool.query(
        `SELECT id, event_type, confidence, details, detected_at FROM vlm_events WHERE interview_id = $1 ORDER BY detected_at DESC`,
        [interviewId]
      );
      events = result.rows;
    } catch (dbErr) {
      console.warn('DB query skipped (vlm_events table may not exist):', dbErr.message);
    }

    res.json({ success: true, interviewId: parseInt(interviewId), total: events.length, events });
  } catch (err) {
    console.error('getProctoringEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch proctoring events' });
  }
};

// ── GET /api/vlm/health ───────────────────────────────────────────────────
// Proxies the VLM PROCTORING API health check (separate from Interview API)
const getVlmHealth = async (req, res) => {
  try {
    if (!process.env.VLM_PROCTORING_API_URL) {
      return res.json({ status: 'offline', message: 'VLM_PROCTORING_API_URL not configured. Set it in .env', model: null, vram_used_gb: 0, vram_total_gb: 0 });
    }
    const health = await proctoringService.getHealth();
    res.json({ success: true, ...health });
  } catch (err) {
    console.error('getVlmHealth error:', err.message);
    res.json({ status: 'unreachable', message: 'VLM Proctoring API is not responding. Check that the Kaggle notebook is running.', model: null, vram_used_gb: 0, vram_total_gb: 0 });
  }
};

module.exports = { uploadPhoto, verifyFace, analyzeFrame, logProctoringEvent, getProctoringEvents, getVlmHealth };
