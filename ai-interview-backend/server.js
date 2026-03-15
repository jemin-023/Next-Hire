// server.js — Entry point for the Express application
// Loads env vars, registers middleware & routes, and starts the HTTP server.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const path = require('path');
const companyRoutes = require('./routes/company');
const interviewRoutes = require('./routes/interview');
const hrRoutes = require('./routes/hr');
const vlmRoutes = require('./routes/vlm');
const aiDetectorRoutes = require('./routes/aiDetector');
const configRoutes = require('./routes/config');
const cvParserRoutes = require('./routes/cvParser');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));  // Allow cross-origin requests from the React frontend
app.use(express.json({ limit: '10mb' }));     // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true }));

// ── Static: serve uploaded candidate photos ────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AI Interview Backend running 🚀' });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/company', companyRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/vlm', vlmRoutes);
app.use('/api/detector', aiDetectorRoutes);  // COMPANY-SIDE ONLY
app.use('/api/config', configRoutes);        // Admin config panel
app.use('/api/cv', cvParserRoutes);          // CV parser proxy

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

// ── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('=== PocketAI Interview Backend ===');
  console.log(`  Server:      http://localhost:${PORT}`);
  console.log(`  Interview:   ${process.env.INTERVIEW_API_URL || 'NOT SET'}`);
  console.log(`  Proctoring:  ${process.env.VLM_PROCTORING_API_URL || 'NOT SET'}`);
  console.log(`  CV Parser:   ${process.env.CV_PARSER_API_URL || 'NOT SET'}`);
  console.log(`  Detector:    ${process.env.AI_DETECTOR_API_URL || 'NOT SET'}`);
  console.log(`  Database:    ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ai_interview'}`);
  console.log('  Hot-swap:    POST /api/config');
  console.log('  Status:      GET  /api/config');
  console.log('==================================');
  console.log('');
});
