// routes/vlm.js
// VLM-related endpoints:
//   POST  /api/vlm/upload-photo        — candidate face photo registration
//   GET   /api/vlm/verify-face/:id     — retrieve stored reference photo
//   POST  /api/vlm/proctor-event       — log a proctoring event
//   GET   /api/vlm/events/:interviewId — get all proctoring events for interview
//   GET   /api/vlm/health              — proxy VLM API health check

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  uploadPhoto,
  verifyFace,
  analyzeFrame,
  logProctoringEvent,
  getProctoringEvents,
  getVlmHealth,
} = require('../controllers/vlmController');

// ── Multer storage config ──────────────────────────────────────────────────
// Saves uploaded photos to the /uploads directory at the project root.
// Files are named: <candidateId>-<timestamp>.<ext>
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const candidateId = req.body.candidateId || 'unknown';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `candidate-${candidateId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ── Routes ─────────────────────────────────────────────────────────────────
router.post('/upload-photo', upload.single('photo'), uploadPhoto);
router.get('/verify-face/:candidateId', verifyFace);
router.post('/analyze', analyzeFrame);
router.post('/proctor-event', logProctoringEvent);
router.get('/events/:interviewId', getProctoringEvents);
router.get('/health', getVlmHealth);

module.exports = router;
