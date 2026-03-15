// db/index.js — PostgreSQL connection pool
// Creates a single shared Pool that all controllers import.
// Using a pool (not a single client) allows concurrent queries safely.

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'ai_interview',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Test connection on startup — fail loudly if the DB is misconfigured.
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  PostgreSQL connection error:', err.message);
    return;
  }
  release();
  console.log('✅  Connected to PostgreSQL');
});

// Convenience helper: pool.query(text, params) — returns a promise.
module.exports = pool;
