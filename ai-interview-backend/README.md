# Selector-Applicant Simulation Platform — Backend

Minimal Node.js + Express + PostgreSQL backend for the AI Interview hackathon project.

## Project Structure

```
ai-interview-backend/
├── server.js                 # Entry point: Express app + middleware + routes
├── package.json
├── .env.example              # Copy to .env and fill in your DB credentials
├── db/
│   ├── index.js              # PostgreSQL connection pool (pg)
│   └── schema.sql            # CREATE TABLE statements — run once to init DB
├── routes/
│   ├── company.js            # POST /api/company/setup
│   ├── interview.js          # POST /api/interview/start|next|end
│   └── hr.js                 # GET  /api/hr/leaderboard
└── controllers/
    ├── companyController.js
    ├── interviewController.js
    └── hrController.js
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create the database
createdb ai_interview

# 4. Run the schema
psql -U postgres -d ai_interview -f db/schema.sql

# 5. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

## API Endpoints

| Method | Path                        | Description                              |
|--------|-----------------------------|------------------------------------------|
| GET    | `/`                         | Health check                             |
| POST   | `/api/company/setup`        | Create company + job role config         |
| POST   | `/api/interview/start`      | Create a new interview session           |
| POST   | `/api/interview/next`       | Save answer, get next question           |
| POST   | `/api/interview/end`        | Finalise interview + return AI score     |
| GET    | `/api/hr/leaderboard`       | Ranked candidate list for HR dashboard   |

## Activating Real Database Logic

Every controller has the real `pool.query(...)` block commented out directly above the mock.
Once PostgreSQL is ready, simply:
1. Uncomment the DB block
2. Remove the mock response below it
