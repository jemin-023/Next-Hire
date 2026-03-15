// controllers/aiDetectorController.js
// COMPANY-SIDE ONLY — all endpoints are for HR/admin use.
// Never expose these routes to the candidate portal.
//
// Handles:
//   - Real-time per-answer detection (called by interviewController in parallel)
//   - Full transcript audit after interview ends
//   - Fetching detection results for an interview (HR dashboard)
//   - AI detector health check

const pool = require('../db');
const detectorService = require('../services/aiDetectorService');

// ── GET /api/detector/health ───────────────────────────────────────────────
const getHealth = async (req, res) => {
  try {
    if (!process.env.AI_DETECTOR_API_URL) {
      return res.json({ status: 'offline', message: 'AI_DETECTOR_API_URL not configured in .env', model: null });
    }
    const health = await detectorService.getDetectorHealth();
    res.json({ success: true, ...health });
  } catch (err) {
    res.json({ status: 'unreachable', message: 'AI Detector API not responding. Check Kaggle notebook.', model: null });
  }
};

// ── POST /api/detector/detect ──────────────────────────────────────────────
// Analyze a single Q&A pair via POST /detect/single
// Body: { interviewId?, question, answer }
const detectAnswer = async (req, res) => {
  try {
    const { interviewId, question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'question and answer are required' });
    }

    let result;
    try {
      result = await detectorService.detectSingle({ question, answer });
    } catch (err) {
      console.warn('AI detector failed (non-fatal):', err.message);
      result = { verdict: 'uncertain', ai_confidence: 0, score_multiplier: 1.0, penalty_reason: null, signals: [], breakdown: {}, elapsed_s: 0 };
    }

    // Persist to DB
    if (interviewId) {
      try {
        const turn = req.body.turn || 0;
        await pool.query(
          `INSERT INTO ai_detection_results (interview_id, turn, verdict, ai_confidence, score_multiplier, penalty_reason, signals, breakdown)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [interviewId, turn, result.verdict, result.ai_confidence, result.score_multiplier, result.penalty_reason, JSON.stringify(result.signals), JSON.stringify(result.breakdown)]
        );
      } catch (dbErr) {
        console.warn('DB insert ai_detection_results skipped:', dbErr.message);
      }
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('detectAnswer error:', err);
    res.status(500).json({ error: 'Detection failed' });
  }
};

// ── POST /api/detector/transcript ──────────────────────────────────────────
// Run full transcript audit via POST /detect/transcript
// Body: { interviewId?, transcript, candidate_name? }
const detectTranscript = async (req, res) => {
  try {
    const { interviewId, transcript, candidate_name } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'transcript is required (Q:/A: format string)' });
    }

    let result;
    try {
      result = await detectorService.detectTranscript(transcript, candidate_name);
    } catch (err) {
      console.warn('AI detector transcript failed:', err.message);
      return res.status(502).json({ error: 'AI detector API unreachable' });
    }

    // Persist per-question results and summary to DB
    if (interviewId) {
      if (result.per_question) {
        for (const pq of result.per_question) {
          try {
            await pool.query(
              `INSERT INTO ai_detection_results (interview_id, turn, verdict, ai_confidence, score_multiplier, penalty_reason, signals, breakdown)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT DO NOTHING`,
              [interviewId, pq.index, pq.detection.verdict, pq.detection.ai_confidence,
               pq.detection.score_multiplier, pq.detection.penalty_reason,
               JSON.stringify(pq.detection.signals), JSON.stringify(pq.detection.breakdown)]
            );
          } catch (_) {}
        }
      }
      if (result.summary) {
        try {
          await pool.query('UPDATE interviews SET ai_audit_summary = $1 WHERE id = $2', [JSON.stringify(result), interviewId]);
        } catch (_) {}
      }
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('detectTranscript error:', err);
    res.status(500).json({ error: 'Transcript detection failed' });
  }
};

// ── GET /api/detector/results/:interviewId ─────────────────────────────────
const getResults = async (req, res) => {
  try {
    const { interviewId } = req.params;

    let results = [];
    let summary = null;

    try {
      const r = await pool.query(
        `SELECT turn, verdict, ai_confidence, score_multiplier, penalty_reason, signals, breakdown, detected_at
         FROM ai_detection_results WHERE interview_id = $1 ORDER BY turn ASC`,
        [interviewId]
      );
      results = r.rows.map(row => ({
        ...row,
        signals: typeof row.signals === 'string' ? JSON.parse(row.signals) : row.signals,
        breakdown: typeof row.breakdown === 'string' ? JSON.parse(row.breakdown) : row.breakdown,
      }));
    } catch (dbErr) {
      console.warn('DB query ai_detection_results skipped:', dbErr.message);
    }

    // Fetch summary from interviews table
    try {
      const s = await pool.query('SELECT ai_audit_summary FROM interviews WHERE id = $1', [interviewId]);
      if (s.rows[0]?.ai_audit_summary) {
        summary = typeof s.rows[0].ai_audit_summary === 'string' ? JSON.parse(s.rows[0].ai_audit_summary) : s.rows[0].ai_audit_summary;
      }
    } catch (_) {}

    // Compute summary if not stored
    if (!summary && results.length > 0) {
      const aiCount = results.filter(r => r.verdict === 'ai').length;
      const uncertainCount = results.filter(r => r.verdict === 'uncertain').length;
      const humanCount = results.filter(r => r.verdict === 'human').length;
      const total = results.length;
      const aiPercent = aiCount / total;
      summary = {
        total_questions: total, ai_answers: aiCount, uncertain_answers: uncertainCount, human_answers: humanCount,
        overall_verdict: aiPercent >= 0.5 ? 'ai' : (aiPercent + uncertainCount / total) >= 0.25 ? 'uncertain' : 'human',
        risk_level: aiPercent >= 0.5 ? 'HIGH' : (aiPercent + uncertainCount / total) >= 0.25 ? 'MEDIUM' : 'LOW',
        flagged_turns: results.filter(r => r.verdict === 'ai').map(r => r.turn),
      };
    }

    res.json({ success: true, interviewId: parseInt(interviewId), results, summary });
  } catch (err) {
    console.error('getResults error:', err);
    res.status(500).json({ error: 'Failed to fetch detection results' });
  }
};

module.exports = { getHealth, detectAnswer, detectTranscript, getResults };
