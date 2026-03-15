// routes/company.js
// Maps HTTP verbs + paths to company controller functions.

const express = require('express');
const router = express.Router();
const { setupCompany } = require('../controllers/companyController');

// POST /api/company/setup
// Called by the HR portal when they configure a new job role + criteria.
router.post('/setup', setupCompany);

module.exports = router;
