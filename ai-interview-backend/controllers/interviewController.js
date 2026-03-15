// controllers/interviewController.js
// Powers the full interview lifecycle aligned with API docs v1.0:
//   - POST /interview/start  → Qwen API /interview/start
//   - POST /interview/next   → Qwen API /interview/answer (loop)
//   - POST /interview/end    → Fetch transcript + AI detection
//   - GET  /interview/resume/:id
//   - GET  /interview/autosave/:id

const pool = require('../db');
const interviewService = require('../services/vlmService');
const detectorService = require('../services/aiDetectorService');

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fire-and-forget: run AI detection on a single answer (company-side only) */
const fireDetection = async (interviewId, question, answer, turn) => {
  if (!process.env.AI_DETECTOR_API_URL) return;
  try {
    const result = await detectorService.detectSingle({ question, answer });
    try {
      await pool.query(
        `INSERT INTO ai_detection_results (interview_id, turn, verdict, ai_confidence, score_multiplier, penalty_reason, signals, breakdown)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [interviewId, turn, result.verdict, result.ai_confidence, result.score_multiplier,
         result.penalty_reason, JSON.stringify(result.signals), JSON.stringify(result.breakdown)]
      );
    } catch (_) {}
  } catch (e) {
    console.warn('AI detection skipped (non-fatal):', e.message);
  }
};

/** Fire-and-forget: run full transcript audit after interview ends */
const fireTranscriptAudit = async (interviewId, transcript, candidateName) => {
  if (!process.env.AI_DETECTOR_API_URL || !transcript) return;
  try {
    const result = await detectorService.detectTranscript(transcript, candidateName);
    if (result.summary) {
      try {
        await pool.query('UPDATE interviews SET ai_audit_summary = $1 WHERE id = $2',
          [JSON.stringify(result), interviewId]);
      } catch (_) {}
    }
    // Persist per-question results
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
  } catch (e) {
    console.warn('Transcript AI audit skipped (non-fatal):', e.message);
  }
};

/** Build cv_profile from request body — pass-through if full profile provided */
const buildProfile = ({ candidateName, candidateEmail, jobRole, profile, cv_profile }) => {
  if (cv_profile && typeof cv_profile === 'object') return cv_profile;
  if (profile && typeof profile === 'object') return profile;
  return {
    personal: {
      name: candidateName || 'Candidate',
      email: candidateEmail || '',
      phone: null, location: null, linkedin: null, github: null, portfolio: null,
    },
    experience: [], education: [],
    skills: { technical: [], tools_and_frameworks: [], soft_skills: [], languages: ['English'] },
    projects: [], certifications: [],
    total_experience_years: 0,
    seniority_level: 'junior',
    summary_one_liner: `${candidateName || 'Candidate'} is applying for ${jobRole || 'a position'}.`,
  };
};

/** Classify axios errors into user-friendly messages */
const classifyApiError = (err) => {
  if (err.response) {
    const { status, data } = err.response;
    if (status === 404) return { code: 404, msg: data?.detail || 'Session not found — it may have expired or the Kaggle kernel restarted.' };
    if (status === 400) return { code: 400, msg: data?.detail || 'Bad request to Interview API.' };
    if (status === 422) return { code: 422, msg: data?.detail || 'Missing required field in request.' };
    return { code: status, msg: data?.detail || 'Interview API error.' };
  }
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return { code: 504, msg: 'Interview API timed out — the model may be under heavy load. Try again in a few seconds.' };
  }
  return { code: 502, msg: 'Cannot reach AI interview server. Check INTERVIEW_API_URL in .env.' };
};

/** Fire-and-forget: autosave transcript to DB by fetching from Interview API */
const autosaveTranscript = async (sessionId, interviewId) => {
  try {
    const data = await interviewService.getTranscript(sessionId);
    await pool.query(
      `UPDATE interviews SET transcript_json = $1 WHERE id = $2`,
      [JSON.stringify(data), interviewId]
    );
  } catch (e) {
    console.warn('Autosave failed (non-fatal):', e.message);
  }
};

// ── POST /api/interview/start ──────────────────────────────────────────────
const startInterview = async (req, res) => {
  try {
    const { candidateName, candidateEmail, companyId, jobRole, profile, cv_profile } = req.body;

    if (!candidateName || !candidateEmail || !companyId) {
      return res.status(400).json({ error: 'candidateName, candidateEmail, and companyId are required' });
    }

    // DB: upsert candidate + create interview row
    let candidateId = null, interviewId = null, sessionId = null;
    try {
      let cr = await pool.query('SELECT id FROM candidates WHERE email = $1 AND company_id = $2', [candidateEmail, companyId]);
      if (cr.rows.length === 0) {
        cr = await pool.query('INSERT INTO candidates (name, email, company_id) VALUES ($1, $2, $3) RETURNING id', [candidateName, candidateEmail, companyId]);
      }
      candidateId = cr.rows[0].id;
      const ir = await pool.query(
        `INSERT INTO interviews (candidate_id, company_id, status, current_round) VALUES ($1, $2, 'in_progress', 1) RETURNING id`,
        [candidateId, companyId]
      );
      interviewId = ir.rows[0].id;
    } catch (dbErr) {
      console.warn('DB insert skipped:', dbErr.message);
      candidateId = 1; interviewId = Date.now();
    }

    // Build cv_profile from whatever was provided
    const builtProfile = buildProfile({ candidateName, candidateEmail, jobRole, profile, cv_profile });

    // Call Interview API: POST /interview/start
    let firstQuestion = 'Tell me about yourself and your background.';
    let apiData = null;
    try {
      apiData = await interviewService.startInterview(builtProfile, candidateName);
      sessionId = apiData.session_id;
      firstQuestion = apiData.question;

      // Persist session_id
      try {
        await pool.query('UPDATE interviews SET vlm_session_id = $1 WHERE id = $2', [sessionId, interviewId]);
      } catch (_) {}
    } catch (apiErr) {
      const classified = classifyApiError(apiErr);
      console.warn(`Interview /start failed [${classified.code}]: ${classified.msg}`);
      // Don't fail — fall back to static questions
    }

    res.status(201).json({
      success: true, message: 'Interview started',
      interview: { id: interviewId, candidateId, candidateName, companyId, status: 'in_progress', sessionId },
      question: {
        text: firstQuestion,
        questionNumber: apiData?.question_number || 1,
        source: apiData ? 'qwen' : 'fallback',
      },
    });
  } catch (err) {
    console.error('startInterview error:', err);
    res.status(500).json({ error: 'Failed to start interview' });
  }
};

// ── POST /api/interview/next ───────────────────────────────────────────────
const nextQuestion = async (req, res) => {
  try {
    const { interviewId, answer, sessionId: reqSessionId } = req.body;
    if (!interviewId) return res.status(400).json({ error: 'interviewId is required' });
    if (!answer || !answer.trim()) return res.status(400).json({ error: 'answer is required' });

    const turnNum = req.body.questionNumber || 1;
    const round = req.body.round || 1;

    // Save answer to DB
    try {
      await pool.query(
        `INSERT INTO responses (interview_id, question, answer, round, question_number) VALUES ($1, $2, $3, $4, $5)`,
        [interviewId, req.body.lastQuestion || `Turn ${turnNum}`, answer, round, turnNum]
      );
    } catch (_) {}

    // Resolve session_id
    let sessionId = reqSessionId;
    if (!sessionId) {
      try {
        const r = await pool.query('SELECT vlm_session_id FROM interviews WHERE id = $1', [interviewId]);
        sessionId = r.rows[0]?.vlm_session_id;
      } catch (_) {}
    }

    // Call Interview API + AI detection IN PARALLEL (detection is fire-and-forget)
    let apiData = null;
    const lastQuestion = req.body.lastQuestion || `Turn ${turnNum}`;
    if (sessionId) {
      try {
        const [apiResult] = await Promise.all([
          interviewService.sendAnswer(sessionId, answer).catch(err => ({ _error: err })),
          fireDetection(interviewId, lastQuestion, answer, turnNum),
        ]);
        if (apiResult._error) throw apiResult._error;
        apiData = apiResult;
      } catch (apiErr) {
        const classified = classifyApiError(apiErr);
        if (classified.code === 404 || classified.code === 400) {
          return res.status(classified.code).json({ error: classified.msg, apiError: true });
        }
        console.warn(`Interview /answer failed [${classified.code}]: ${classified.msg}`);
      }
    }

    // Interview ended (Qwen returns status: "ended" after 10 questions)
    if (apiData?.status === 'ended') {
      // Persist transcript
      const transcript = apiData.transcript || null;
      try {
        await pool.query(
          "UPDATE interviews SET status = 'completed', transcript_json = $2 WHERE id = $1",
          [interviewId, transcript ? JSON.stringify({ raw: transcript }) : null]
        );
      } catch (_) {}

      // Fire transcript AI audit (non-blocking)
      if (transcript) {
        fireTranscriptAudit(interviewId, transcript, req.body.candidateName);
      }

      return res.json({
        success: true, done: true,
        message: apiData.message || 'Interview complete.',
        totalQuestions: apiData.total_questions,
        transcript,
      });
    }

    // Autosave every 3 turns
    const currentTurn = apiData?.question_number || turnNum;
    if (sessionId && currentTurn % 3 === 0) {
      autosaveTranscript(sessionId, interviewId);
    }

    // Fallback bank
    const FALLBACK = [
      'Tell me about yourself.', 'Describe a challenge you faced.', 'Where do you see yourself in 5 years?',
      'Design a scalable REST API.', 'SQL vs NoSQL?', 'How do you debug production issues?',
      'How do you prioritize tasks?', 'Tell me about leading a team.', 'How do you handle disagreements?',
    ];
    const fallbackIdx = (turnNum - 1) % FALLBACK.length;

    if (!apiData && turnNum >= FALLBACK.length) {
      return res.json({ success: true, done: true, message: 'Interview complete. Call POST /api/interview/end.' });
    }

    res.json({
      success: true, done: false,
      question: {
        text: apiData?.question || FALLBACK[fallbackIdx],
        questionNumber: apiData?.question_number || turnNum + 1,
        progress: apiData?.progress || null,
        source: apiData ? 'qwen' : 'fallback',
      },
      sessionId: sessionId,
    });
  } catch (err) {
    console.error('nextQuestion error:', err);
    res.status(500).json({ error: 'Failed to proceed to next question' });
  }
};

// ── POST /api/interview/end ────────────────────────────────────────────────
const endInterview = async (req, res) => {
  try {
    const { interviewId, sessionId: reqSessionId, candidateName } = req.body;
    if (!interviewId) return res.status(400).json({ error: 'interviewId is required' });

    // Resolve session_id
    let sessionId = reqSessionId;
    if (!sessionId) {
      try {
        const r = await pool.query('SELECT vlm_session_id FROM interviews WHERE id = $1', [interviewId]);
        sessionId = r.rows[0]?.vlm_session_id;
      } catch (_) {}
    }

    // Fetch transcript from Interview API
    let transcriptData = null;
    let rawTranscript = null;
    if (sessionId) {
      try {
        transcriptData = await interviewService.getTranscript(sessionId);
        rawTranscript = transcriptData?.transcript || null;
      } catch (apiErr) {
        const classified = classifyApiError(apiErr);
        console.warn(`Interview /transcript failed [${classified.code}]: ${classified.msg}`);
      }
    }

    // Persist to DB
    try {
      await pool.query(
        "UPDATE interviews SET status = 'completed', transcript_json = $2 WHERE id = $1",
        [interviewId, transcriptData ? JSON.stringify(transcriptData) : null]
      );
    } catch (dbErr) {
      console.warn('DB update skipped:', dbErr.message);
    }

    // Default scores (will be overridden by AI detection results later)
    const communication = 75, technical = 75;
    const problemSolving = Math.round((communication + technical) / 2);

    try {
      await pool.query(
        `INSERT INTO scores (interview_id, communication, technical, problem_solving, red_flags, was_hired)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (interview_id) DO UPDATE SET communication=$2, technical=$3, problem_solving=$4, red_flags=$5, was_hired=$6`,
        [interviewId, communication, technical, problemSolving, '[]', false]
      );
    } catch (dbErr) {
      console.warn('DB score persist skipped:', dbErr.message);
    }

    // Fire-and-forget: full transcript AI audit (company-side only)
    if (rawTranscript) {
      fireTranscriptAudit(interviewId, rawTranscript, candidateName);
    }

    res.json({
      success: true, message: 'Interview completed',
      score: {
        interviewId, communication, technical, problemSolving,
        overall: Math.round((communication + technical + problemSolving) / 3),
        generatedAt: new Date().toISOString(),
      },
      transcript: transcriptData || null,
    });
  } catch (err) {
    console.error('endInterview error:', err);
    res.status(500).json({ error: 'Failed to end interview' });
  }
};

// ── GET /api/interview/resume/:interviewId ─────────────────────────────────
const resumeInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    let interview = null;
    try {
      const r = await pool.query(
        `SELECT i.id, i.status, i.vlm_session_id, i.transcript_json, i.company_id,
                c.name AS candidate_name, c.email AS candidate_email
         FROM interviews i
         LEFT JOIN candidates c ON c.id = i.candidate_id
         WHERE i.id = $1`,
        [interviewId]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
      interview = r.rows[0];
    } catch (dbErr) {
      return res.status(500).json({ error: 'Database error: ' + dbErr.message });
    }

    // If session still lives on Interview API, fetch the latest transcript
    let liveTranscript = null;
    if (interview.vlm_session_id && interview.status === 'in_progress') {
      try {
        liveTranscript = await interviewService.getTranscript(interview.vlm_session_id);
      } catch (e) {
        // Session may have expired — that's OK, use saved transcript
      }
    }

    const transcript = liveTranscript || (interview.transcript_json ? JSON.parse(interview.transcript_json) : null);

    res.json({
      success: true,
      interview: {
        id: interview.id,
        status: interview.status,
        sessionId: interview.vlm_session_id,
        candidateName: interview.candidate_name,
        candidateEmail: interview.candidate_email,
        companyId: interview.company_id,
      },
      canResume: interview.status === 'in_progress' && !!liveTranscript,
      transcript,
    });
  } catch (err) {
    console.error('resumeInterview error:', err);
    res.status(500).json({ error: 'Failed to resume interview' });
  }
};

// ── GET /api/interview/autosave/:interviewId ───────────────────────────────
const triggerAutosave = async (req, res) => {
  try {
    const { interviewId } = req.params;

    let interview;
    try {
      const r = await pool.query('SELECT vlm_session_id FROM interviews WHERE id = $1', [interviewId]);
      if (r.rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
      interview = r.rows[0];
    } catch (_) { return res.status(500).json({ error: 'DB error' }); }

    if (!interview.vlm_session_id) return res.status(400).json({ error: 'No active session' });

    try {
      const data = await interviewService.getTranscript(interview.vlm_session_id);
      await pool.query('UPDATE interviews SET transcript_json = $1 WHERE id = $2', [JSON.stringify(data), interviewId]);
      res.json({ success: true, total_turns: data.total_turns, saved_at: new Date().toISOString() });
    } catch (apiErr) {
      const classified = classifyApiError(apiErr);
      res.status(classified.code).json({ error: classified.msg });
    }
  } catch (err) {
    console.error('triggerAutosave error:', err);
    res.status(500).json({ error: 'Autosave failed' });
  }
};

module.exports = { startInterview, nextQuestion, endInterview, resumeInterview, triggerAutosave };
