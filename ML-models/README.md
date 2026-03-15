AI Models Directory 🤖
Next-Hire AI — Intelligence Layer
This directory contains all the AI components that power the Next-Hire platform. Each model runs as an independent service and handles a specific part of the interview pipeline.

Models Overview
ai-models/
├── cheat-detector/          # Text-based AI cheat detection
├── interviewer/             # Qwen interview engine
├── vision-monitor/          # VLM physical cheating detection
└── rag-pipeline/            # CV-aware personalized questioning

1. AI Cheat Detector
What it does:
Every answer a candidate speaks is transcribed and passed through this model in real time. It analyzes the response for patterns that are characteristic of AI-generated text — robotic sentence structure, unnaturally balanced arguments, suspiciously complete answers, and generic examples that lack any personal context. If the response crosses a suspicion threshold, a flag is raised immediately in the HR dashboard with a confidence score and a human-readable reason.
How it works:

Takes the raw transcribed answer as input
Runs a classification prompt against a lightweight fast model
Returns { is_suspicious: bool, confidence: 0–1, reason: string }
Runs async — never blocks the main interview flow

Tech: Groq API (fast inference) · LLaMA / Mixtral

2. Qwen — Interview Engine
What it does:
Qwen acts as the core interviewer. It manages the full conversation, decides what to ask next based on the candidate's previous answers, adapts the difficulty progressively, and handles round transitions (Intro → Technical → Managerial). Every question it generates is grounded in the company's job role and the candidate's own CV via the RAG pipeline.
How it works:

Receives full conversation history + company context + CV summary on every call
Decides the next most relevant question
Tracks round progression and question count internally
Returns a single question — no extra commentary, no filler

Tech: Qwen2.5 via Groq · LangChain for context injection

3. Vision Monitor (VLM)
What it does:
While the candidate is speaking, the platform uses the device camera to monitor them visually. The Vision Language Model watches for physical signs of cheating — a second screen in the background, someone else in the room, the candidate looking away repeatedly, a phone being used, or any suspicious movement patterns. It runs silently in the background and sends alerts to the HR dashboard if anything is detected.
How it works:

Captures periodic frames from the candidate's camera feed
Sends frames to the VLM with a monitoring prompt
Model describes what it sees and flags suspicious activity
Returns { flagged: bool, observation: string, severity: low | medium | high }
Frames are never stored — processed and discarded immediately for privacy

Tech: Qwen-VL / LLaVA · OpenCV for frame capture

4. RAG Pipeline — CV-Aware Personalized Questions
What it does:
Before the interview starts, the candidate uploads their CV. The RAG pipeline processes it, chunks it, and embeds it into a vector store alongside the company's job description and any past interview data. When Qwen generates questions, it retrieves the most relevant context from this store first — so instead of asking generic questions, it asks things like "You mentioned you worked on microservices at your last company — how would you handle service discovery in a high-traffic environment?"
The result is an interview that feels like the interviewer actually read the CV, because the AI did.
How it works:

CV and JD are chunked and embedded on upload
On each question generation call, top-k relevant chunks are retrieved
Retrieved context is injected into the Qwen prompt before generation
The more data uploaded, the more personalized the interview becomes

Supported uploads: PDF CV, Word CV, Job Description, Past Interview Transcripts
Tech: LangChain · ChromaDB (vector store) · HuggingFace Embeddings

Running the Models

⚠️ Each model should be run on a separate device or Kaggle notebook due to compute requirements. Do not run all four on the same machine.

ModelRecommended EnvironmentCheat DetectorLocal or Kaggle CPUQwen InterviewerKaggle GPU (T4)Vision MonitorLocal machine with camera accessRAG PipelineLocal or Kaggle CPU

Environment Variables
GROQ_API_KEY=your_groq_key
QWEN_MODEL=qwen2.5-72b-instruct
VLM_MODEL=qwen-vl-plus
CHROMA_DB_PATH=./vectorstore
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

Data Privacy

CV data is embedded and stored locally in ChromaDB — never sent to third parties
Camera frames from the Vision Monitor are processed in memory and immediately discarded
No candidate data is retained after the interview session ends unless explicitly saved by HR


Part of the Next-Hire AI platform · Team Loss Goes Brrr!
