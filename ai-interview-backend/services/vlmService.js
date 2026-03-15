// services/vlmService.js
// HTTP client wrapping the Interview API (Qwen 2.5 14B on Kaggle).
// Endpoints per API docs v1.0:
//   GET  /health
//   POST /interview/start
//   POST /interview/answer
//   GET  /interview/transcript/{session_id}
//   GET  /interview/sessions

const axios = require('axios');

// Reads at call time so it can be hot-swapped via POST /api/config
const BASE = () => process.env.INTERVIEW_API_URL || '';

/**
 * GET /health — check server status + VRAM across both GPUs
 */
const getHealth = async () => {
  const res = await axios.get(`${BASE()}/health`, { timeout: 15_000 });
  return res.data;
};

/**
 * POST /interview/start — start a new interview session
 * @param {object} cvProfile  - Full cv_profile JSON from CV Parser /parse
 * @param {string} candidateName - Candidate's name
 * @returns {{ session_id, question_number, question, elapsed_s, status }}
 */
const startInterview = async (cvProfile, candidateName) => {
  const res = await axios.post(
    `${BASE()}/interview/start`,
    { cv_profile: cvProfile, candidate_name: candidateName || 'Candidate' },
    { timeout: 60_000 }
  );
  return res.data;
};

/**
 * POST /interview/answer — submit candidate answer, get next question
 * @param {string} sessionId - Session UUID from /interview/start
 * @param {string} answer    - Candidate's text answer
 * @returns {{ session_id, question_number, question, elapsed_s, status, progress }}
 *          OR { session_id, status:"ended", message, total_questions, transcript }
 */
const sendAnswer = async (sessionId, answer) => {
  const res = await axios.post(
    `${BASE()}/interview/answer`,
    { session_id: sessionId, answer },
    { timeout: 60_000 }
  );
  return res.data;
};

/**
 * GET /interview/transcript/{session_id} — retrieve formatted transcript
 * @param {string} sessionId
 * @returns {{ session_id, candidate_name, total_turns, transcript }}
 */
const getTranscript = async (sessionId) => {
  const res = await axios.get(`${BASE()}/interview/transcript/${sessionId}`, { timeout: 30_000 });
  return res.data;
};

/**
 * GET /interview/sessions — list all sessions (active + ended)
 * @returns {{ sessions: [{ session_id, candidate_name, status, question_count, created_at }] }}
 */
const getSessions = async () => {
  const res = await axios.get(`${BASE()}/interview/sessions`, { timeout: 15_000 });
  return res.data;
};

module.exports = { getHealth, startInterview, sendAnswer, getTranscript, getSessions };
