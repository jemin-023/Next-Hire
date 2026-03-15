// services/proctoringService.js
// HTTP client for the VLM Proctoring API (LLaVA-NeXT 7B on GPU).
// Endpoints per API docs v1.0:
//   GET  /health
//   POST /analyze          (multipart/form-data: reference + frame)
//   POST /analyze_base64   (JSON: reference + frame as base64 strings)

const axios = require('axios');
const FormData = require('form-data');

const BASE = () => process.env.VLM_PROCTORING_API_URL || '';

/**
 * GET /health — check server status + VRAM usage
 */
const getHealth = async () => {
  const res = await axios.get(`${BASE()}/health`, { timeout: 10_000 });
  return res.data;
};

/**
 * POST /analyze_base64 — identity + cheat detection using base64-encoded images
 * @param {string} referenceBase64 - Candidate's registered ID photo (base64)
 * @param {string} frameBase64    - Current live webcam frame (base64)
 * @returns {{ identity: { match, raw, elapsed_s }, cheating: { cheating, description, raw, elapsed_s }, alert, alert_reason, total_elapsed_s }}
 */
const analyzeBase64 = async (referenceBase64, frameBase64) => {
  const res = await axios.post(
    `${BASE()}/analyze_base64`,
    { reference: referenceBase64, frame: frameBase64 },
    { timeout: 30_000 }
  );
  return res.data;
};

/**
 * POST /analyze — identity + cheat detection using multipart image files
 * @param {Buffer} referenceBuffer - Reference ID photo buffer
 * @param {string} referenceName   - Filename for reference (e.g. "id.jpg")
 * @param {Buffer} frameBuffer     - Live webcam frame buffer
 * @param {string} frameName       - Filename for frame (e.g. "frame.jpg")
 * @returns Same shape as analyzeBase64
 */
const analyzeMultipart = async (referenceBuffer, referenceName, frameBuffer, frameName) => {
  const form = new FormData();
  form.append('reference', referenceBuffer, { filename: referenceName });
  form.append('frame', frameBuffer, { filename: frameName });

  const res = await axios.post(`${BASE()}/analyze`, form, {
    headers: form.getHeaders(),
    timeout: 30_000,
  });
  return res.data;
};

module.exports = { getHealth, analyzeBase64, analyzeMultipart };
