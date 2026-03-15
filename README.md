> ⚠️ **IMPORTANT — Before You Run This**
>
> This platform runs multiple AI services in parallel, so you will need **2 to 3 devices** to run it properly. You can use physical PCs, or run the heavier components on **Kaggle** (free GPU/CPU notebooks) if you don't have the hardware locally. Each AI service — Groq, the Claude API, the RAG pipeline, and the speech transcription — should be run on a **separate device or environment** to avoid resource conflicts and ensure everything runs smoothly at the same time.

---

# Next-Hire AI 🧠
### Web-Based Intelligent Selector–Applicant Simulation Platform

> Built at **Hack & Forge** by Team **Loss Goes Brrr!**  
> Amandeep Varma · Jemin Morabiya · Hasan Kabir

---

## What is this?

Hiring is broken. Companies waste hours on interviews where candidates just Google the answers, interviewers ask the same scripted questions every time, and nobody actually knows if the person in front of them can do the job.

Next-Hire fixes that.

It's a fully autonomous AI-powered interview platform where companies set up their hiring criteria once, and the AI handles everything from there — asking smart, role-specific questions, detecting if a candidate is using ChatGPT to cheat, adapting difficulty in real time based on how well the candidate is doing, and handing HR a clean ranked report at the end.

No scripted flows. No bias. No wasted time.

---

## How it works

A company logs in, sets up the job role and what they're looking for, and the platform is ready to interview hundreds of candidates simultaneously. Each candidate gets their own independent AI interview session — Intro round, then Technical, then Managerial — with questions that get harder as they go deeper.

Every answer the candidate speaks is transcribed and run through two things at once: the main interviewer AI that decides the next question, and a separate authenticity detector that flags anything that sounds AI-generated. If something seems off, HR sees it immediately with a suspicion score and the exact reason it was flagged.

When the interview ends, the AI scores everything, and HR gets a leaderboard — ranked candidates, ready to decide.

---

## Features

- **AI Interview Engine** — Claude-powered interviewer that asks contextually relevant questions based on the job role and the candidate's previous answers
- **Cheating Detection** — Real-time analysis of voice responses to flag AI-generated or rehearsed answers
- **RAG Pipeline** — Company uploads job descriptions and past interview data; every question is grounded in actual company context, not generic templates
- **Progressive Difficulty** — Questions get harder as the candidate performs better
- **Structured Rounds** — Every interview follows: Intro → Technical → Managerial
- **Parallel Interviews** — Hundreds of candidates can be interviewed simultaneously with completely isolated sessions
- **Ranked HR Dashboard** — Clean leaderboard with scores, flags, and insights per candidate
- **Multilingual Support** — Questions asked in the candidate's preferred language
- **Reinforcement Learning** — The system improves its scoring model after every hiring decision the company makes

---

## Tech Stack

**Frontend**
- React
- Framer Motion, React Spring, React Reveal (animations)
- CSS with dark theme + pink accent design system

**Backend**
- Node.js + Express
- PostgreSQL (companies, candidates, interviews, responses, scores)
- Redis (live session state for concurrent interviews)

**AI Layer**
- Claude API (interview questioning + answer evaluation + cheat detection)
- LangChain + ChromaDB (RAG pipeline for company-specific context)
- Whisper / Deepgram (speech-to-text transcription)

---

## Project Structure

```
next-hire/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PortalSelection.jsx      # Landing page
│   │   │   ├── CandidatePortal.jsx      # Interview flow
│   │   │   └── HRPortal.jsx             # Company dashboard
│   │   └── styles/
│   │       └── globals.css
│   └── public/
│
├── backend/
│   ├── routes/
│   │   ├── interview.js                 # /start, /next, /end
│   │   ├── company.js                   # /setup
│   │   └── hr.js                        # /leaderboard
│   ├── services/
│   │   ├── claudeService.js             # Claude API calls
│   │   ├── cheatDetection.js            # Authenticity analysis
│   │   └── ragService.js                # Vector store + retrieval
│   ├── db/
│   │   └── schema.sql                   # All 5 tables
│   └── server.js
│
└── README.md
```

---

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/api/company/setup` | Upload job role and criteria |
| POST | `/api/interview/start` | Create session, return first question |
| POST | `/api/interview/next` | Submit answer, get next question |
| POST | `/api/interview/end` | Trigger final scoring |
| POST | `/api/speech/transcribe` | Audio blob to text |
| GET | `/api/hr/leaderboard` | Ranked candidates for HR |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-repo/next-hire

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Run database migrations
psql -U postgres -f db/schema.sql

# Start the backend
npm run dev

# In another terminal, start the frontend
cd ../frontend
npm install
npm start
```

---

## Environment Variables

```
ANTHROPIC_API_KEY=your_key_here
DATABASE_URL=postgresql://localhost:5432/nexthire
REDIS_URL=redis://localhost:6379
PORT=5000
```

---

## Why this doesn't exist yet

Most interview platforms score candidates. We tell you who is actually worth hiring.

We expose interviewer bias, not just candidate gaps. The system gets smarter with every hire your company makes. And because every question is grounded in your company's actual context, candidates can't Google it, can't ChatGPT it — they have to actually know it.

---

## Team

Built in 24 hours at **Hack & Forge**, BIT Mesra.

| Name |
|------|
| Amandeep Varma |
| Jemin Morabiya |
| Hasan Kabir |

---

*Next-Hire AI · v2.0 Beta · System Online ●*
