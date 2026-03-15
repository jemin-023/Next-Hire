// controllers/companyController.js
// Handles company/HR setup.
// Later: replace mock with real INSERT INTO companies + INSERT INTO candidates.

const pool = require('../db');

/**
 * POST /api/company/setup
 * Body: { name, jobRole, criteria }
 *
 * Creates a company record and returns a company_id the frontend
 * should cache and send with every subsequent interview request.
 */
const setupCompany = async (req, res) => {
  try {
    const { name, jobRole, criteria } = req.body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!name || !jobRole) {
      return res.status(400).json({ error: 'name and jobRole are required' });
    }

    // ── Real DB insert (uncomment when DB is ready) ───────────────────────
    // const result = await pool.query(
    //   'INSERT INTO companies (name, job_role, criteria) VALUES ($1, $2, $3) RETURNING *',
    //   [name, jobRole, criteria || null]
    // );
    // const company = result.rows[0];

    // ── Mock response ─────────────────────────────────────────────────────
    const company = {
      id: 1,
      name,
      job_role: jobRole,
      criteria: criteria || null,
      created_at: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      message: 'Company setup complete',
      company,
    });
  } catch (err) {
    console.error('setupCompany error:', err);
    res.status(500).json({ error: 'Failed to set up company' });
  }
};

module.exports = { setupCompany };
