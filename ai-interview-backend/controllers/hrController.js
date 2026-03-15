// controllers/hrController.js
// Provides the HR dashboard with ranked candidate data.
// Currently returns a hardcoded leaderboard so the frontend works immediately.
// Later: replace with a real JOIN across candidates, interviews, and scores.

const pool = require('../db');

/**
 * GET /api/hr/leaderboard?companyId=1
 *
 * Returns all candidates for a company ranked by overall AI score (desc).
 * Each candidate includes per-pillar scores and a red_flags count.
 */
const getLeaderboard = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId query param is required' });
    }

    // ── Real DB query (uncomment when DB is ready) ────────────────────────
    // const result = await pool.query(
    //   `SELECT
    //     c.id            AS candidate_id,
    //     c.name,
    //     c.email,
    //     i.id            AS interview_id,
    //     i.status,
    //     s.communication,
    //     s.technical,
    //     s.problem_solving,
    //     s.red_flags,
    //     s.was_hired,
    //     ROUND((s.communication + s.technical + s.problem_solving) / 3, 2) AS overall_score
    //   FROM candidates c
    //   JOIN interviews i ON i.candidate_id = c.id
    //   LEFT JOIN scores s ON s.interview_id = i.id
    //   WHERE c.company_id = $1
    //   ORDER BY overall_score DESC`,
    //   [companyId]
    // );
    // return res.json({ success: true, leaderboard: result.rows });

    // ── Mock response ─────────────────────────────────────────────────────
    const leaderboard = [
      {
        rank: 1,
        candidateId: 1,
        name: 'Alice Chen',
        role: 'Senior Frontend Engineer',
        communication: 90,
        technical: 95,
        problemSolving: 88,
        overall: 91,
        status: 'Passed',
        redFlags: [],
        wasHired: true,
      },
      {
        rank: 2,
        candidateId: 2,
        name: 'Marcus Johnson',
        role: 'Backend Developer',
        communication: 82,
        technical: 88,
        problemSolving: 85,
        overall: 85,
        status: 'Passed',
        redFlags: [],
        wasHired: false,
      },
      {
        rank: 3,
        candidateId: 3,
        name: 'David Smith',
        role: 'Full Stack Engineer',
        communication: 74,
        technical: 79,
        problemSolving: 72,
        overall: 75,
        status: 'Review',
        redFlags: ['off-topic response'],
        wasHired: false,
      },
      {
        rank: 4,
        candidateId: 4,
        name: 'Priya Sharma',
        role: 'Junior React Dev',
        communication: 55,
        technical: 60,
        problemSolving: 50,
        overall: 55,
        status: 'Rejected',
        redFlags: ['AI-generated patterns detected', 'evasive answers', 'multiple tab switches'],
        wasHired: false,
      },
    ];

    res.json({
      success: true,
      companyId: parseInt(companyId),
      total: leaderboard.length,
      leaderboard,
    });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

module.exports = { getLeaderboard };
