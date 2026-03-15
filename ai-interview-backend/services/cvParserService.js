// services/cvParserService.js
// HTTP client for the CV Parser API (LLaMA 3.3 70B via Groq).
// Endpoints per API docs v1.0:
//   GET  /health
//   POST /parse  (multipart/form-data, field: "file")

const axios = require('axios');
const FormData = require('form-data');

const BASE = () => process.env.CV_PARSER_API_URL || '';

/**
 * GET /health — check server status
 */
const getHealth = async () => {
  const res = await axios.get(`${BASE()}/health`, { timeout: 10_000 });
  return res.data;
};

/**
 * POST /parse — upload resume (PDF/DOCX) → get structured cv_profile JSON
 * @param {Buffer} fileBuffer - File contents as a buffer
 * @param {string} originalName - Original filename (e.g. "resume.pdf")
 * @returns {object} cv_profile JSON (personal, education, experience, skills, projects, etc.)
 */
const parseResume = async (fileBuffer, originalName) => {
  const form = new FormData();
  form.append('file', fileBuffer, { filename: originalName });

  const res = await axios.post(`${BASE()}/parse`, form, {
    headers: form.getHeaders(),
    timeout: 120_000,  // parsing can be slow — chunked Groq calls
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return res.data;
};

module.exports = { getHealth, parseResume };
