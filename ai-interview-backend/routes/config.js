// routes/config.js
// Admin endpoint for hot-swapping service URLs at runtime.
// No server restart needed — just POST the new tunnel URLs.
//
// GET  /api/config          → see current config + connection status of all 4 services
// POST /api/config          → update URLs at runtime

const express = require('express');
const router = express.Router();
const axios = require('axios');

// ── GET /api/config ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const config = {
    server: { port: process.env.PORT || 5000, uptime: process.uptime() },
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      name: process.env.DB_NAME || 'ai_interview',
      user: process.env.DB_USER || 'postgres',
      password_set: !!process.env.DB_PASSWORD,
    },
    interview_api: {
      url: process.env.INTERVIEW_API_URL || '(not set)',
      status: 'unknown',
      description: 'Qwen 2.5 14B — port 8003',
    },
    vlm_proctoring_api: {
      url: process.env.VLM_PROCTORING_API_URL || '(not set)',
      status: 'unknown',
      description: 'LLaVA-NeXT 7B — port 8000',
    },
    cv_parser_api: {
      url: process.env.CV_PARSER_API_URL || '(not set)',
      status: 'unknown',
      description: 'LLaMA 3.3 70B via Groq — port 8001',
    },
    ai_detector_api: {
      url: process.env.AI_DETECTOR_API_URL || '(not set)',
      status: 'unknown',
      description: 'LLaMA 3.3 70B via Groq — port 8002',
    },
    groq_api_key_set: !!process.env.GROQ_API_KEY,
  };

  // Quick health checks (non-blocking, 5s timeout)
  const check = async (url) => {
    if (!url || url === '(not set)') return 'not_configured';
    try {
      const r = await axios.get(`${url}/health`, { timeout: 5000 });
      return r.data?.status === 'ok' ? 'online' : 'responding';
    } catch {
      return 'offline';
    }
  };

  const [intStatus, vlmStatus, cvStatus, detStatus] = await Promise.all([
    check(process.env.INTERVIEW_API_URL),
    check(process.env.VLM_PROCTORING_API_URL),
    check(process.env.CV_PARSER_API_URL),
    check(process.env.AI_DETECTOR_API_URL),
  ]);
  config.interview_api.status = intStatus;
  config.vlm_proctoring_api.status = vlmStatus;
  config.cv_parser_api.status = cvStatus;
  config.ai_detector_api.status = detStatus;

  res.json(config);
});

// ── POST /api/config ───────────────────────────────────────────────────────
// Hot-swap environment variables at runtime. No server restart needed.
// Body (all optional):
//   interview_api_url, vlm_proctoring_api_url, cv_parser_api_url,
//   ai_detector_api_url, groq_api_key, db_password
router.post('/', (req, res) => {
  const {
    interview_api_url,
    vlm_proctoring_api_url,
    cv_parser_api_url,
    ai_detector_api_url,
    groq_api_key,
    db_password,
  } = req.body;
  const updated = [];

  if (interview_api_url !== undefined) {
    process.env.INTERVIEW_API_URL = interview_api_url.replace(/\/+$/, '');
    updated.push('INTERVIEW_API_URL');
  }
  if (vlm_proctoring_api_url !== undefined) {
    process.env.VLM_PROCTORING_API_URL = vlm_proctoring_api_url.replace(/\/+$/, '');
    updated.push('VLM_PROCTORING_API_URL');
  }
  if (cv_parser_api_url !== undefined) {
    process.env.CV_PARSER_API_URL = cv_parser_api_url.replace(/\/+$/, '');
    updated.push('CV_PARSER_API_URL');
  }
  if (ai_detector_api_url !== undefined) {
    process.env.AI_DETECTOR_API_URL = ai_detector_api_url.replace(/\/+$/, '');
    updated.push('AI_DETECTOR_API_URL');
  }
  if (groq_api_key !== undefined) {
    process.env.GROQ_API_KEY = groq_api_key;
    updated.push('GROQ_API_KEY');
  }
  if (db_password !== undefined) {
    process.env.DB_PASSWORD = db_password;
    updated.push('DB_PASSWORD');
  }

  if (updated.length === 0) {
    return res.status(400).json({
      error: 'No config values provided.',
      accepted_keys: ['interview_api_url', 'vlm_proctoring_api_url', 'cv_parser_api_url', 'ai_detector_api_url', 'groq_api_key', 'db_password'],
    });
  }

  console.log(`Config updated at runtime: ${updated.join(', ')}`);

  res.json({
    success: true,
    message: `Updated: ${updated.join(', ')}`,
    current: {
      INTERVIEW_API_URL: process.env.INTERVIEW_API_URL || '(not set)',
      VLM_PROCTORING_API_URL: process.env.VLM_PROCTORING_API_URL || '(not set)',
      CV_PARSER_API_URL: process.env.CV_PARSER_API_URL || '(not set)',
      AI_DETECTOR_API_URL: process.env.AI_DETECTOR_API_URL || '(not set)',
      GROQ_API_KEY_SET: !!process.env.GROQ_API_KEY,
    },
  });
});

module.exports = router;
