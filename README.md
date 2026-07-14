# VidyaAI — CGBSE Class 10 Adaptive Learning Assistant

An AI-powered study assistant built for CGBSE (Chhattisgarh Board of Secondary Education) Class 10 students. Students can ask questions in Hindi or English, get curriculum-aligned answers from ingested textbook PDFs, and track their learning progress. Admins can monitor all platform activity via a real-time analytics dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Local Runtime Versions](#local-runtime-versions)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [PDF Ingestion](#pdf-ingestion)
- [Admin Dashboard](#admin-dashboard)
- [API Reference](#api-reference)
- [Architecture Overview](#architecture-overview)
- [Known Limitations](#known-limitations)

---

## Features

### Student Features
- **AI Chat** — Ask questions in Hindi or English; get textbook-grounded answers via RAG
- **Subject Selection** — Hindi, Math, Science, Social Science, English
- **Session History** — Chat history persisted per user session
- **Multi-language UI** — Toggle between Hindi and English interface
- **Progress Dashboard** — See past questions and topics studied
- **Paper-specific PYQ practice** — Starting practice from a PYQ card creates a five-question quiz from that exact year/set PDF, with exact-source Qdrant retrieval and a local-PDF fallback for older indexes
- **Streaming answer presentation** — Newly generated assistant answers reveal progressively with Markdown support and a typing cursor; reduced-motion preferences and previously displayed answers skip the animation
- **Consistent answer formatting** — Summary, 2-mark, 5-mark, Q&A, and exam-ready modes use distinct layouts; headings and ordinary paragraphs stay unnumbered, while genuine questions and solution steps retain consecutive numbering
- **Rich visual answers** — Chat responses render responsive tables, color-coded Mermaid flows/timelines/hierarchies/charts, and native two-set Venn diagrams using the VidyaAI palette; explicit visual requests are validated, missing blocks are repaired, and numeric pie/bar charts preserve exact prompt values
- **Grounded 5-mark answers** — Long-form exam responses use connected paragraphs, avoid repetitive numbered templates, and prioritize lesson chunks that match the actual titled reading over unrelated end-of-unit exercises

### Admin Features
- **Platform KPIs** — Total users, questions (total + 24h), active users, estimated study time, cache hit count
- **Per-User Analytics Table** — Sortable/searchable table: name, email, class, questions asked, time spent (estimated), subjects covered, weak topics, last active date
- **User Drill-down Drawer** — Click any user to see subject-wise bar chart, weak topics, and last 5 questions
- **Charts** — Bar chart (questions per subject), Donut chart (answer source mix: Groq vs Cache vs RAG)
- **Q&A Cache Stats** — Number of unique questions cached, total cache hits saved

### AI / RAG Features
- **Hybrid RAG** — Retrieves relevant chunks from Qdrant vector DB, sends to Groq LLM with context
- **Cache-first answering** — Identical questions served from DB cache (0 Groq API calls, `confidence: 0.97`)
- **Section-aware retrieval** — Parses "chapter 1.3" → section hint "1-3" for more precise chunk scoring
- **Anti-repetition** — Removes consecutive duplicate lines and repeated phrases from LLM output
- **TOC filtering** — Table-of-contents chunks are downranked so real content is retrieved
- **Prompt-first subject routing** — The student's prompt overrides the selected UI subject, including common Hinglish terms such as `ganit`, `vigyan`, `itihas`, and `bhugol`
- **Safe continuous learning** — Production interactions become privacy-minimized review candidates; only human-approved answers can be exported for training

### Study Planning
- Students choose their exam date, subjects, daily available time, study days per week, and preparation goal
- Plans support balanced preparation, weak-subject improvement, PYQ-heavy practice, and fast revision
- Desktop and mobile account controls both provide login/logout access

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11, FastAPI, SQLAlchemy (async), asyncpg |
| **Database** | PostgreSQL 15 |
| **Vector DB** | Qdrant (port 6333) |
| **LLM** | Groq API (`llama-3.1-8b-instant`) |
| **Embeddings** | sentence-transformers (mock mode in dev: `[0.1]*384`) |
| **Frontend** | React 18.3, Vite 5.4, React Router v6, Tailwind CSS v3.4, Axios |
| **Auth** | JWT (HS256), email-based admin whitelist |
| **Infra** | Docker Compose (qdrant + postgres + backend containers) |
| **PDF Ingestion** | pdfplumber + pytesseract fallback |

---

## Project Structure

```
AI_Assistant_cgbse/
├── README.md                        ← This file
├── docker-compose.yml               ← Orchestrates qdrant, postgres, backend
├── .env                             ← Secrets and config (not committed)
│
├── backend/
│   ├── main.py                      ← FastAPI app entry, router registration
│   ├── config.py                    ← Settings (pydantic-settings) + is_admin_email()
│   ├── database.py                  ← AsyncSession engine setup
│   ├── requirements.txt
│   ├── Dockerfile
│   │
│   ├── models/
│   │   ├── student.py               ← Student (user) table
│   │   ├── session.py               ← ChatSession table (per-question history)
│   │   ├── weak_topic.py            ← WeakTopic table
│   │   └── qa_cache.py              ← QACache table (dedup + cache-first answering)
│   │   └── learning_example.py      ← Privacy-minimized continuous-learning candidates
│   │
│   ├── routers/
│   │   ├── auth.py                  ← /auth/register, /auth/login, /auth/me
│   │   ├── chat.py                  ← /chat/ask (cache-first), /chat/history, /chat/feedback
│   │   ├── profile.py               ← /profile endpoints
│   │   └── admin.py                 ← /admin/dashboard, /admin/users (admin-only)
│   │
│   └── services/
│       ├── rag.py                   ← Core RAG pipeline + Groq generation
│       ├── embeddings.py            ← Embedding service (real or mock)
│       └── hybrid_rag.py            ← Hybrid fine-tuned/Groq routing (future)
│       └── learning_loop.py          ← Redaction, quality scoring, feedback learning loop
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx                  ← React Router config (all routes)
│       ├── main.jsx
│       ├── index.css                ← Tailwind + all custom CSS (including admin styles)
│       │
│       ├── api/
│       │   └── client.js            ← Axios instance with JWT interceptor
│       │
│       ├── components/              ← Shared UI components
│       │
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx        ← Student dashboard + chat UI
│           └── AdminDashboard.jsx   ← Admin analytics page (table + charts + drawer)
│
├── ingestion/
│   ├── ingest.py                    ← PDF → chunks → Qdrant pipeline
│   └── data/
│       └── textbooks/               ← Place PDF files here for ingestion
│
└── training/
    ├── hybrid_adaptive_system.py    ← Hybrid fine-tuned vs Groq router
    ├── fine_tune_qlora.py           ← QLoRA fine-tuning script
    ├── data_prep.py                 ← Training data preparation
    ├── feedback_to_training.py      ← Feedback → training data pipeline
    ├── generate_expanded_data.py
    ├── inference.py
    └── training_data/               ← train.jsonl, test.jsonl
```

---

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 18+ and npm
- Python 3.11 (for ingestion only — backend runs in Docker)
- A Groq API key (free at [console.groq.com](https://console.groq.com))

---

## Local Runtime Versions

Use these exact local runtimes when working from this machine. This avoids Python-version drift and dependency issues.

### Backend Python

Always use the backend Python 3.11 virtual environment:

```bash
/Users/naveenchandrawanshi/Applications/AI_Assistant_cgbse/backend/.venv311/bin/python --version
# Python 3.11.4
```

Recommended backend commands:

```bash
cd /Users/naveenchandrawanshi/Applications/AI_Assistant_cgbse

# Import/smoke-check the FastAPI app
backend/.venv311/bin/python -c "from backend.main import app; print(app.title); print(len(app.routes))"

# Compile-check backend source only
backend/.venv311/bin/python -m compileall \
  backend/main.py backend/config.py backend/database.py \
  backend/routers backend/services backend/models backend/tests
```

Do **not** use these Python interpreters for backend app checks:

```bash
/Users/naveenchandrawanshi/Applications/AI_Assistant_cgbse/.venv/bin/python --version
# Python 3.13.2

python3 --version
# Python 3.14.6
```

Reason: the root `.venv` / system Python versions are newer than the backend stack expects. The root `.venv` hit a SQLAlchemy import compatibility error, and system `python3` does not have the project test tools installed.

### Backend Tests

The backend test command is:

```bash
backend/.venv311/bin/python -m pytest backend/tests
```

At the time of this note, `pytest` is not installed inside `backend/.venv311`, so install the test dependency before expecting this command to run:

```bash
backend/.venv311/bin/python -m pip install pytest
```

Do not install test dependencies into the root `.venv`; keep backend dependencies in `backend/.venv311`.

### Frontend Node

Use the local Node/npm versions that currently build the React app:

```bash
node --version
# v22.14.0

npm --version
# 10.9.2
```

Recommended frontend commands:

```bash
cd /Users/naveenchandrawanshi/Applications/AI_Assistant_cgbse/frontend
npm install
npm run build
npm run dev -- --host 127.0.0.1
```

Vite normally starts on `5173`, but if that port is occupied it can move to `5174`, `5175`, or `5176`. The backend CORS allowlist includes those local development ports for both `localhost` and `127.0.0.1`.

### 1. Clone and configure

```bash
git clone <repo-url>
cd AI_Assistant_cgbse
cp .env.example .env   # then edit .env with your values
```

### 2. Start backend services

```bash
docker compose up -d
```

This starts: **PostgreSQL** (port 5432), **Qdrant** (port 6333), **FastAPI backend** (port 8000).

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Groq LLM
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant

# PostgreSQL (used inside Docker network)
DATABASE_URL=postgresql://vidyaai:password@postgres:5432/vidyaai_db

# Qdrant (used inside Docker network)
QDRANT_HOST=qdrant
QDRANT_PORT=6333

# JWT
JWT_SECRET=your-secret-key-change-this-in-production

# Embeddings — set to false to use real sentence-transformers
USE_MOCK_EMBEDDINGS=true

# Comma-separated list of admin email addresses
ADMIN_EMAILS=admin@vidyaai.in
```

---

## Running the Application

### Backend only (Docker)

```bash
docker compose up -d            # start all 3 services
docker compose logs -f backend  # watch logs
docker compose down             # stop
```

### Rebuild backend after code changes

```bash
docker compose up -d --build backend
```

### Deploy latest changes on VPS

Run these commands on the VPS:

```bash
cd /opt/vidyaai
git pull origin main
bash deploy.sh
```

### Import prepared PYQ Qdrant chunks on VPS

Use this after pulling/deploying when PYQ chunks were already exported locally. This imports vectors directly into Qdrant and does **not** run OCR on the VPS.

```bash
cd /opt/vidyaai
git pull origin main
bash deploy.sh

docker compose -f docker-compose.prod.yml exec backend \
  python -m ingestion.import_qdrant \
  --input ingestion/qdrant_exports/pyq_previous_year_questions_points.jsonl \
  --host qdrant \
  --port 6333
```

To verify the import, check the backend can still reach Qdrant and inspect logs:

```bash
cd /opt/vidyaai
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Do not run `ingestion.ingest --enable-ocr` on the VPS for these PYQ files unless you intentionally want to reprocess PDFs from scratch.

If you deploy manually instead of using `deploy.sh`, rebuild the static frontend before restarting Docker/Nginx:

```bash
cd /opt/vidyaai
git pull origin main

cd frontend
npm install
VITE_API_URL=/api npm run build

cd ..
docker compose -f docker-compose.prod.yml up -d --build
```

To rebuild only the backend on the VPS:

```bash
cd /opt/vidyaai
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build backend
```

To check production containers and backend logs:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

### Frontend dev server

```bash
cd frontend && npm run dev
```

---

## PDF Ingestion

Add PDF files to `ingestion/data/textbooks/`, then run the ingestion script using the Python 3.11 virtual environment inside the project:

```bash
# Ingest a single file
cd /path/to/AI_Assistant_cgbse
backend/.venv311/bin/python -m ingestion.ingest --file "Class_X_Hindi_Chapter_1.pdf"

# The script will:
# 1. Extract text with pdfplumber (OCR fallback via pytesseract)
# 2. Split into overlapping chunks (~500 chars)
# 3. Embed and upsert into Qdrant collection "cgbse_knowledge"
```

**Already ingested:**
- `Class_X_Hindi_Chapter_1.pdf` through `Chapter_12.pdf` (157 chunks each, approx)
- `Class10 - Hindi.pdf` (full book — legacy font encoded, partially garbled)

**Note on Hindi PDFs:** PDFs using Kruti Dev or other legacy font encodings will produce garbled text (not proper Unicode Devanagari). Use chapter-level PDFs with proper Unicode fonts for best quality. Token-overlap scoring still partially works on garbled text.

---

## Admin Dashboard

### Accessing the Admin Panel

1. Register/login with an email listed in `ADMIN_EMAILS` in `.env`
2. In the student Dashboard sidebar, click **"⚙ Admin Panel"** (visible to admins only)
3. Or navigate directly to **http://localhost:5173/admin**

### What the Admin Dashboard Shows

#### Summary KPI Cards
| Card | Description |
|---|---|
| Total Users | All registered students |
| Total Questions | Lifetime questions + 24-hour count |
| Active Users (24h) | Users who asked questions in last 24 hours |
| Study Time (est.) | Sum of estimated study minutes across all users |
| Cache Hits | Total questions served from cache (Groq API calls saved) |

#### Charts
- **Questions by Subject** — Horizontal bar chart of top subjects
- **Answer Source Mix** — Donut chart showing Groq / RAG / Cache breakdown

#### User Table (sortable + searchable)
Columns: Rank, Name, Email, Class, Questions, Time (min), Subjects Covered, Weak Topics, Last Active

Click **"View"** on any row to open the user detail drawer.

#### User Detail Drawer
- 4 stat cards: questions, time spent, last active, joined date
- Subject-wise question bar chart
- Weak topics list (tagged by subject)
- Last 5 questions asked

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account (`name`, `email`, `password`, `class_level`, `medium`) |
| POST | `/auth/login` | Login via form-data (`username`, `password`) → returns JWT |
| GET | `/auth/me` | Current user profile + `is_admin` flag |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| POST | `/chat/ask` | Ask a question; cache-first, then RAG+Groq |
| GET | `/chat/history` | Chat session history for current user |
| POST | `/chat/feedback` | Submit thumbs up/down feedback on an answer |

**POST `/chat/ask` payload:**
```json
{
  "question": "explain chapter 1.3 narmada ka udgam",
  "subject": "Hindi",
  "class_level": "10"
}
```

**Response:**
```json
{
  "answer": "...",
  "sources": ["chapter-1", "section-1-3"],
  "confidence": 0.97,
  "session_id": "..."
}
```
`confidence: 0.97` means the answer was served from cache.

### PYQ Practice

The PYQ page passes the selected paper's subject, year, set, and exact PDF filename to `/quiz/generate` with `quiz_type: "pyq"`. Only the selected paper shows a preparation state, and its quiz remains directly below the paper list instead of navigating to the standalone Quiz tab. The backend retrieves only chunks whose `source_file` matches that PDF. If an older Qdrant export contains only consolidated subject papers, the backend reads the matching PDF from `ingestion/data/Previous_Year_Questions` instead of silently using a different paper. Image-only papers use Hindi+English Tesseract OCR; the backend Docker image includes both OCR language packs.

### Admin (requires admin JWT)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Platform-wide summary, top subjects, source mix |
| GET | `/admin/users` | Per-user breakdown with subjects, time, weak topics, recent questions |
| GET | `/admin/learning-loop/stats` | Continuous-learning capture and review metrics |
| GET | `/admin/learning-loop/candidates` | Ranked pending/approved/rejected learning candidates |
| PUT | `/admin/learning-loop/candidates/{id}` | Approve or reject a candidate with a review note |
| GET | `/admin/learning-loop/export-approved` | Download only human-approved training examples as JSONL |

---

## Architecture Overview

```
Browser (React / Vite :5173)
       │
       │ HTTP (Axios + JWT)
       ▼
FastAPI Backend (:8000)
  ├─ /auth/*          → PostgreSQL (students table)
  ├─ /chat/ask        → QACache (hit?) → Qdrant RAG → Groq LLM
  │                     └─ stores result in QACache
  ├─ /chat/history    → PostgreSQL (chat_sessions table)
  ├─ /chat/feedback   → learning quality score + rejection signal
  ├─ /admin/dashboard → Aggregated queries across all tables
  ├─ /admin/users     → Per-user joins: students + sessions + weak_topics
  └─ /admin/learning-loop/* → teacher review + approved JSONL export
       │
       ├── PostgreSQL (:5432)
       │     tables: students, chat_sessions, weak_topics, qa_cache,
       │             quizzes, quiz_questions, quiz_answers, learning_examples
       │
       └── Qdrant (:6333)
             collection: cgbse_knowledge
             ~1000+ chunks from Hindi textbook PDFs
```

### Q&A Cache Flow

```
User asks question
      │
      ▼
normalize_question()   ← lowercase, strip punctuation, sort words
      │
      ▼
Lookup QACache table   (unique key: normalized_question + subject + class)
      │
   ┌──┴──┐
  HIT   MISS
   │     │
   │     ▼
   │   Qdrant retrieval (top-k chunks, token-overlap scored)
   │     │
   │     ▼
   │   Groq LLM  (llama-3.1-8b-instant)
   │     │
   │     ▼
   │   Store in QACache  (hit_count=0)
   │     │
   └──→ Return answer + confidence
         (confidence=0.97 for cache hits)
```

### RAG Retrieval Scoring

Each chunk from Qdrant is scored by token overlap with the question. Bonuses/penalties applied:

| Signal | Score Δ |
|---|---|
| Chapter number match | +5.0 |
| Section number match (e.g. "1-3") | +7.0 |
| Table-of-contents chunk detected | −4.0 |
| TOC chunk when section hint exists | −8.0 |

### Safe Continuous-Improvement Flow

```text
Student question → RAG/Groq answer → privacy redaction → learning candidate
       → grounding/feedback score → teacher review → approved JSONL
       → offline evaluation → controlled fine-tuning → gradual deployment
```

The application never updates model weights directly from student prompts. Email addresses and Indian phone numbers are redacted, student identifiers are hashed, negative feedback rejects a candidate automatically, and approval remains separate from training. See `training/WORKFLOW.md` for the release process.

### Documentation Rule

Every implementation change must include a corresponding update to this `README.md`, covering the changed behavior, configuration, API, workflow, or limitation.

---

## Known Limitations

- **Mock embeddings in dev** — `USE_MOCK_EMBEDDINGS=true` means all vectors are `[0.1]*384`. Retrieval uses token-overlap scoring only (no semantic similarity). Set to `false` and install `sentence-transformers` for real embeddings.
- **Legacy-encoded Hindi PDFs** — PDFs using Kruti Dev / pre-Unicode fonts produce garbled text after extraction. Use Unicode-encoded PDFs for best results.
- **Estimated study time** — Calculated from session timestamps with a gap-based heuristic (≤8 min per gap). Not a direct time-on-page measurement.
- **Admin email-only access** — Admin status is determined by email address in `ADMIN_EMAILS` env var, not a DB column. To add admins, update `.env` and rebuild the backend container.
- **Single Qdrant collection** — All subjects share `cgbse_knowledge`. Subject filtering is done at scoring time, not at vector DB query time.
