// services/aiDetectorService.js
// HTTP client for the AI Cheat Detector API (LLaMA 3.3 70B via Groq).
// COMPANY-SIDE ONLY — never call from candidate-facing code.
// Endpoints per API docs v1.0:
//   GET  /health
//   POST /detect/single       — analyze a single Q&A pair
//   POST /detect/transcript   — analyze full interview transcript

const axios = require('axios');

const BASE = () => process.env.AI_DETECTOR_API_URL || '';

/** GET /health */
const getDetectorHealth = async () => {
  const res = await axios.get(`${BASE()}/health`, { timeout: 10_000 });
  return res.data;
};

/**
 * POST /detect/single — analyze a single Q&A pair
 * @param {{ question: string, answer: string }}
 * @returns {{ verdict, ai_confidence, score_multiplier, penalty_reason, signals, breakdown: { burstiness, pattern_score, llm_confidence }, elapsed_s }}
 */
const detectSingle = async ({ question, answer }) => {
  const res = await axios.post(
    `${BASE()}/detect/single`,
    { question, answer },
    { timeout: 30_000 }
  );
  return res.data;
};

/**
 * POST /detect/transcript — analyze full interview transcript (Q:/A: format)
 * @param {string} transcript    - The raw transcript string from GET /interview/transcript
 * @param {string} candidateName - Candidate name for labeling
 * @returns {{ candidate_name, overall_verdict, risk_level, avg_ai_confidence, summary: { total_questions, ai_answers, uncertain_answers, human_answers }, per_question: [...], elapsed_s }}
 */
const detectTranscript = async (transcript, candidateName) => {
  const res = await axios.post(
    `${BASE()}/detect/transcript`,
    { transcript, candidate_name: candidateName || 'Unknown' },
    { timeout: 120_000 }
  );
  return res.data;
};

module.exports = { getDetectorHealth, detectSingle, detectTranscript };
