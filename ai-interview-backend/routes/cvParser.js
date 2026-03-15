// routes/cvParser.js
// CV Parser endpoints:
//   POST /api/cv/parse   — upload resume → get structured cv_profile
//   GET  /api/cv/health   — proxy health check

const express = require('express');
const router = express.Router();
const multer = require('multer');

const { parseResume, getHealth } = require('../controllers/cvParserController');

// ── Multer config — store in memory buffer (forwarded to CV Parser API) ────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are accepted'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// POST /api/cv/parse
router.post('/parse', upload.single('file'), parseResume);

// GET /api/cv/health
router.get('/health', getHealth);

module.exports = router;
