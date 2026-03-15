-- db/schema.sql
-- Run this file once against your PostgreSQL database to create all tables.
-- Usage: psql -U postgres -d ai_interview -f db/schema.sql

-- ── companies ──────────────────────────────────────────────────────────────
-- Stores the HR/company account plus the role they are hiring for.
CREATE TABLE IF NOT EXISTS companies (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  job_role   VARCHAR(255) NOT NULL,
  criteria   TEXT,                          -- JSON string or plain text rubric
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── candidates ─────────────────────────────────────────────────────────────
-- A candidate who has applied to a specific company.
CREATE TABLE IF NOT EXISTS candidates (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  photo_url  VARCHAR(500),               -- path to registration/verification photo
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety: add photo_url if table already exists without it
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- ── interviews ─────────────────────────────────────────────────────────────
-- Tracks the lifecycle of a single interview session.
-- status: 'pending' | 'in_progress' | 'completed'
-- current_round: 1 (Behavioral) | 2 (Technical) | 3 (Managerial)
CREATE TABLE IF NOT EXISTS interviews (
  id             SERIAL PRIMARY KEY,
  candidate_id   INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  company_id     INTEGER REFERENCES companies(id)  ON DELETE CASCADE,
  status         VARCHAR(50)   DEFAULT 'pending',
  current_round  INTEGER       DEFAULT 1,
  vlm_session_id VARCHAR(255),             -- UUID returned by VLM /start
  transcript_json TEXT,                    -- Full VLM transcript JSON (autosaved)
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- Migration safety
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS vlm_session_id VARCHAR(255);
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS transcript_json TEXT;

-- ── responses ──────────────────────────────────────────────────────────────
-- Each row is one Q&A exchange captured during an interview.
CREATE TABLE IF NOT EXISTS responses (
  id              SERIAL PRIMARY KEY,
  interview_id    INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  answer          TEXT,
  round           INTEGER NOT NULL,           -- which round this Q belongs to
  question_number INTEGER NOT NULL,           -- position within the round
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── scores ─────────────────────────────────────────────────────────────────
-- Final AI-generated evaluation for a completed interview.
-- red_flags: JSON array of flagged behaviours (AI cheat detection, etc.)
CREATE TABLE IF NOT EXISTS scores (
  id               SERIAL PRIMARY KEY,
  interview_id     INTEGER REFERENCES interviews(id) ON DELETE CASCADE UNIQUE,
  communication    NUMERIC(5,2) DEFAULT 0,
  technical        NUMERIC(5,2) DEFAULT 0,
  problem_solving  NUMERIC(5,2) DEFAULT 0,
  red_flags        TEXT,                      -- JSON array, e.g. ["off-topic","AI-generated"]
  was_hired        BOOLEAN      DEFAULT FALSE,
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- ── vlm_events ──────────────────────────────────────────────────────────────
-- Each row is one proctoring signal captured by the VLM during a live interview.
-- event_type: 'look_away' | 'multiple_faces' | 'off_screen' | 'cheat_flag' | 'tab_switch'
CREATE TABLE IF NOT EXISTS vlm_events (
  id           SERIAL PRIMARY KEY,
  interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
  event_type   VARCHAR(100) NOT NULL,
  confidence   NUMERIC(5,4) DEFAULT 0.9,        -- detection confidence 0–1
  details      TEXT,                            -- optional extra context
  detected_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── ai_detection_results ───────────────────────────────────────────────────
-- COMPANY-SIDE ONLY — per-turn AI answer detection verdicts.
-- Never exposed to candidates.
CREATE TABLE IF NOT EXISTS ai_detection_results (
  id               SERIAL PRIMARY KEY,
  interview_id     INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
  turn             INTEGER NOT NULL,
  verdict          VARCHAR(20) NOT NULL,            -- 'human' | 'ai' | 'uncertain'
  ai_confidence    NUMERIC(5,4) DEFAULT 0,          -- 0.0–1.0
  score_multiplier NUMERIC(3,2) DEFAULT 1.0,        -- 1.0 (clean) | 0.5 (suspicious) | 0.0 (flagged)
  penalty_reason   TEXT,                            -- human-readable reason
  signals          TEXT,                            -- JSON array of detected patterns
  breakdown        TEXT,                            -- JSON { burstiness, pattern_score, llm_confidence }
  detected_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS ai_audit_summary TEXT;

