# 🤖 AI Models Directory
> **Next-Hire AI** — Intelligence Layer

This directory contains all the AI components that power the Next-Hire platform. Each model runs as an **independent service** and handles a specific part of the interview pipeline.

---

## 📁 Directory Structure

```
ai-models/
├── cheat-detector/       # Text-based AI cheat detection
├── interviewer/          # Qwen interview engine  
├── vision-monitor/       # VLM physical cheating detection
└── rag-pipeline/         # CV-aware personalized questioning
```

---

## 🧩 Models

### 1. 🚨 AI Cheat Detector

Every answer a candidate speaks is transcribed and passed through this model in real time. It analyzes responses for patterns characteristic of AI-generated text — robotic sentence structure, unnaturally balanced arguments, suspiciously complete answers, and generic examples that lack any personal context. If a response crosses the suspicion threshold, a flag is raised immediately in the HR dashboard.

**How it works:**
- Takes the raw transcribed answer as input
- Runs a classification prompt against a lightweight fast model
- Returns `{ is_suspicious: bool, confidence: 0–1, reason: string }`
- Runs **async** — never blocks the main interview flow

**Tech:** `Groq API` · `LLaMA / Mixtral`

---

### 2. 🎙️ Qwen — Interview Engine

Qwen acts as the core interviewer. It manages the full conversation, decides what to ask next based on the candidate's previous answers, adapts difficulty progressively, and handles round transitions. Every question it generates is grounded in the company's actual job role and the candidate's own CV via the RAG pipeline.

**How it works:**
- Receives full conversation history + company context + CV summary on every call
- Decides the next most relevant question based on the last answer
- Tracks round progression and question count internally
- Handles transitions: `Intro → Technical → Managerial`
- Returns a single focused question — no filler, no commentary

**Tech:** `Qwen2.5 via Groq`

---

### 3. 👁️ Vision Monitor (VLM)

While the candidate is speaking, the platform uses the device camera to monitor them visually. The Vision Language Model watches for physical signs of cheating — a second screen in the background, someone else in the room, the candidate looking away repeatedly, or a phone being used. It runs silently in the background and sends alerts to the HR dashboard if anything suspicious is detected.

**How it works:**
- Captures periodic frames from the candidate's camera feed
- Sends frames to the VLM with a monitoring prompt
- Model describes what it sees and flags suspicious activity
- Returns `{ flagged: bool, observation: string, severity: "low" | "medium" | "high" }`
- Frames are **never stored** — processed and discarded immediately for privacy

**Tech:** `Qwen-VL / LLaVA` · `OpenCV`

---

### 4. 📄 RAG Pipeline — CV-Aware Personalized Questions

Before the interview starts, the candidate uploads their CV. The RAG pipeline processes it, chunks it, and embeds it into a vector store alongside the company's job description and any past interview data. When Qwen generates questions, it retrieves the most relevant context first — so instead of generic questions, it asks things like:

> *"You mentioned you worked on microservices at your last company — how would you handle service discovery in a high-traffic environment?"*

The result is an interview that feels like the interviewer actually read the CV — because the AI did.

**How it works:**
- CV and JD are chunked and embedded on upload
- On each question generation call, top-k relevant chunks are retrieved
- Retrieved context is injected into the Qwen prompt before generation
- The more data uploaded, the more personalized the interview becomes

**Supported uploads:** PDF CV · Word CV · Job Description · Past Interview Transcripts

**Tech:** `ChromaDB` · `HuggingFace Embeddings`

---

## ⚙️ Running the Models

> ⚠️ **Each model must be run on a separate device or Kaggle notebook** due to compute requirements. Do not run all four on the same machine.

| Model | Recommended Environment |
|-------|------------------------|
| 🚨 Cheat Detector | Local or Kaggle CPU |
| 🎙️ Qwen Interviewer | Kaggle GPU (T4) |
| 👁️ Vision Monitor | Local machine with camera access |
| 📄 RAG Pipeline | Local or Kaggle CPU |

---

## 🔑 Environment Variables

```env
GROQ_API_KEY           = your_groq_key
QWEN_MODEL             = qwen2.5-72b-instruct
VLM_MODEL              = qwen-vl-plus
CHROMA_DB_PATH         = ./vectorstore
EMBEDDING_MODEL        = sentence-transformers/all-MiniLM-L6-v2
```

---

## 🔒 Data Privacy

- CV data is embedded and stored **locally** in ChromaDB — never sent to third parties
- Camera frames from the Vision Monitor are processed **in memory** and immediately discarded
- No candidate data is retained after the interview session ends unless explicitly saved by HR

---

<div align="center">

*Part of the **Next-Hire AI** platform · Built at Hack & Forge, BIT Mesra*

**Team Loss Goes Brrr!** — Amandeep Varma · Jemin Morabiya · Hasan Kabir

</div>
