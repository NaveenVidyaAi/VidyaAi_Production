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
- [Public Company and Legal Pages](#public-company-and-legal-pages)
- [PDF Ingestion](#pdf-ingestion)
- [Teacher Dashboard](#teacher-dashboard)
- [Admin Dashboard](#admin-dashboard)
- [API Reference](#api-reference)
- [Architecture Overview](#architecture-overview)
- [Known Limitations](#known-limitations)

---

## Features

### Student Features
- **AI Chat** — Ask questions in Hindi or English; get textbook-grounded answers via RAG
- **Intent-aware answer routing** — Calculator-style prompts return direct deterministic results, general and writing questions bypass irrelevant retrieval, curriculum questions use RAG, and weak Hinglish/ambiguous searches receive a guarded AI query rewrite before falling back to a model answer; standard Science/SST concepts can use that direct fallback while source-dependent language and literature chapters remain textbook-grounded
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

### Teacher Features
- **Role-aware entry** — Login and registration ask whether the user is a student or teacher and open the matching workspace
- **Curriculum Creator** — Builds a week-wise curriculum with outcomes, period allocation, activities, assessments, differentiation, revision, and a teacher checklist
- **Test & Paper Creator** — Accepts class, subject, syllabus, marks, question count, duration, difficulty, medium, and paper type; returns a printable paper, answer key, and marking scheme
- **How to Teach** — Prepares the teacher with a topic explanation, prerequisites, important points, misconceptions, minute-by-minute lesson flow, board work, examples, classroom questions, activities, differentiation, assessment, and likely student doubts
- **Shared AI Chat and PYQ** — Teachers use the same curriculum-grounded chat and exact-paper PYQ library as students
- **Reusable outputs** — Generated teacher resources can be copied, printed/saved as PDF, and reopened from browser-local recent history

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

### Company and Legal Site
- **Gyanix identity** — Public pages identify VidyaAI as a product of Gyanix AI Solutions and publish the official contact address `GyanixAiSolutions@gmail.com`
- **About page** — Introduces Gyanix AI Solutions, VidyaAI, product principles, and Founder & CEO Naveen Chandrawanshi using the supplied official logo and founder portrait
- **Contact page** — Provides a responsive, labelled contact form with inline validation and a direct official-email link
- **Versioned legal pages** — Terms & Conditions, Privacy Policy, and Responsible AI Use Policy are published as version `1.0.0`, effective 18 July 2026
- **Responsible disclosure** — The policies describe current Groq processing, stored learning activity, browser local storage, administrator review, improvement candidates, AI limitations, and the absence of advertising trackers
- **Accessible public shell** — Shared company navigation and footer include keyboard focus handling, a skip link, active-route state, 44px touch targets, responsive navigation, declared image dimensions, and reduced-motion support

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
│   │   ├── quiz.py                  ← Quiz, QuizQuestion, and QuizAnswer tables
│   │   └── learning_example.py      ← Privacy-minimized continuous-learning candidates
│   │
│   ├── routers/
│   │   ├── auth.py                  ← /auth/register, /auth/login, /auth/me
│   │   ├── chat.py                  ← /chat/ask (cache-first), /chat/history, /chat/feedback
│   │   ├── profile.py               ← /profile endpoints
│   │   ├── quiz.py                  ← Adaptive activity and exact-paper PYQ quizzes
│   │   ├── teacher.py               ← Curriculum, paper, and teaching-guide generation
│   │   └── admin.py                 ← Analytics, exports, and learning review (admin-only)
│   │
│   └── services/
│       ├── rag.py                   ← Core RAG pipeline + Groq generation
│       ├── embeddings.py            ← Embedding service (real or mock)
│       ├── hybrid_rag.py            ← Experimental fine-tuned/Groq router (not mounted)
│       └── learning_loop.py          ← Redaction, quality scoring, feedback learning loop
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── public/
│   │   └── brand/
│   │       ├── gyanix-ai-solutions-logo.png       ← Supplied official company logo
│   │       └── naveen-chandrawanshi-founder.jpeg  ← Supplied Founder & CEO portrait
│   └── src/
│       ├── App.jsx                  ← React Router config (all routes)
│       ├── main.jsx
│       ├── index.css                ← Tailwind + all custom CSS (including admin styles)
│       │
│       ├── api/
│       │   └── client.js            ← Axios instance with JWT interceptor
│       │
│       ├── components/              ← Shared UI components
│       │   ├── BrandMark.jsx         ← VidyaAI lockup with configurable semantic tagline
│       │   ├── Icon.jsx              ← Shared SVG icon set
│       │   ├── LegalDocument.jsx     ← Versioned legal-page structure and section navigation
│       │   ├── CompanyLegalFooter.jsx ← Shared company/legal links for auth and role workspaces
│       │   ├── PublicLayout.jsx      ← Company header, navigation, footer, SEO and focus handling
│       │   └── RichMarkdown.jsx      ← Markdown, Mermaid, tables, and Venn rendering
│       │
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── About.jsx            ← Gyanix, VidyaAI and founder story
│           ├── Contact.jsx          ← Validated official-email composer
│           ├── Terms.jsx            ← Terms & Conditions v1.0.0
│           ├── Privacy.jsx          ← Privacy Policy v1.0.0
│           ├── AIUse.jsx            ← Responsible AI Use Policy v1.0.0
│           ├── Dashboard.jsx        ← Student dashboard + chat UI
│           ├── TeacherDashboard.jsx ← Teacher planning and preparation workspace
│           └── AdminDashboard.jsx   ← Admin analytics page (table + charts + drawer)
│
├── ingestion/
│   ├── document_catalog.py          ← Immutable document/version/checksum governance
│   ├── document_catalog.json        ← Versioned source-of-truth for documents
│   ├── ingest.py                    ← Catalog-aware PDF → chunks → Qdrant pipeline
│   ├── qdrant_exports/              ← Versioned vector datasets + manifests
│   └── data/
│       ├── documents/               ← Active curricula and model-paper sources
│       ├── Previous_Year_Questions/ ← Exact student download/practice papers
│       ├── textbooks/               ← Legacy textbook sources
│       └── archive/                 ← Preserved sources excluded from retrieval
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

Import the versioned teacher-resource dataset after the same deployment. Its
sidecar manifest locks the JSONL checksum and records 173 real-embedding points
from 12 curriculum/model-paper documents:

```bash
docker compose -f docker-compose.prod.yml exec backend \
  python -m ingestion.ingest --prune-archived

docker compose -f docker-compose.prod.yml exec backend \
  python -m ingestion.import_qdrant \
  --input ingestion/qdrant_exports/teacher_resources_catalog-v1.0.1.jsonl \
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

## Public Company and Legal Pages

VidyaAI includes a public-facing company and legal section for Gyanix AI
Solutions. These routes do not require a login and share the responsive header,
footer, SEO metadata, route-focus behavior, and visual system implemented in
`frontend/src/components/PublicLayout.jsx`.

### Company identity

| Item | Published value |
|---|---|
| Company | Gyanix AI Solutions |
| Product | VidyaAI |
| Founder & CEO | Naveen Chandrawanshi |
| Founder role | Senior Software Engineer and applied-AI builder |
| Official email | `GyanixAiSolutions@gmail.com` |
| AI quote | “AI should not replace human potential; it should remove the barriers that keep people from reaching it.” |

The About page uses the official assets supplied by the company:

- `frontend/public/brand/gyanix-ai-solutions-logo.png`
- `frontend/public/brand/naveen-chandrawanshi-founder.jpeg`

The founder description deliberately avoids invented employment dates, awards,
client names, certifications, or years of experience. It describes the product's
demonstrable applied-AI focus: generative AI, retrieval-augmented systems,
multilingual interfaces, and production software.

### Public routes

| Route | Page | Purpose |
|---|---|---|
| `/about` | About | Gyanix AI Solutions, VidyaAI, founder story, principles, official logo and portrait |
| `/contact` | Contact | Official email, enquiry categories, privacy notice, and validated email-composer form |
| `/terms` | Terms & Conditions | Eligibility, accounts, acceptable use, AI limitations, content rights, termination and governing law |
| `/privacy` | Privacy Policy | Data collection, Groq processing, admin access, browser storage, children, retention, security and user requests |
| `/ai-use` | Responsible AI Use Policy | AI capabilities, provider processing, human review, assessment limits, academic integrity and reporting |

Compatibility aliases redirect `/terms-and-conditions` to `/terms`,
`/privacy-policy` to `/privacy`, and `/ai-policy` to `/ai-use`. Login and
registration display persistent links to all five pages. The same compact footer
is available at the end of the Student Quiz, PYQ, and Study Plan sections and
below the active Teacher mode workspace, using the shared
`frontend/src/components/CompanyLegalFooter.jsx` component. It is intentionally
excluded from the fixed Student AI Chat transcript so company links never sit
between the conversation and its prompt composer. Teacher mode places it inside
the main document flow. Registration also links the consent text directly to
Terms, Privacy, and AI Use.

### Contact form behavior

The Contact form is a controlled React form with visible labels, required-field
semantics, validation on blur, inline error messages, first-invalid-field focus,
and a screen-reader status message. It collects a sender name, reply email,
enquiry topic, and message.

Submitting the form constructs a URL-encoded `mailto:` message addressed to
`GyanixAiSolutions@gmail.com` and opens the visitor's configured email
application. It does **not** claim that the website sent or stored the message.
The user must review the prepared email and press **Send** in their email client.

Direct background delivery from the website is intentionally not implemented
without credentials. To add it later, configure a transactional email provider
or Gmail SMTP/App Password on the backend, keep credentials only in `.env`, add
rate limiting and abuse protection, and update the Privacy Policy before routing
the form through the server. Do not commit an email password or API key.

### Legal document versioning

The shared constants in `frontend/src/components/LegalDocument.jsx` currently
publish:

```text
Policy version: 1.0.0
Effective date: 18 July 2026
```

Use semantic versions for future legal revisions:

- **Patch** (`1.0.1`) — spelling, formatting, or clarification that does not
  change meaning.
- **Minor** (`1.1.0`) — a new disclosure, provider, feature, or user-control
  section that does not fundamentally replace the agreement.
- **Major** (`2.0.0`) — a material change to user rights, data use, eligibility,
  payment terms, dispute terms, or the service relationship.

Before publishing an updated policy, preserve the previous text and its
effective date, update the shared version constants, ensure registration points
to the current routes, and record the accepted policy version once persisted
consent records are implemented. The current text is an engineering-aligned
draft and should receive review by qualified Indian legal counsel before being
treated as legal sign-off.

### Privacy and AI disclosures represented in the pages

The policies intentionally match current code behavior:

- Profile/access inputs can include name, email, selected role, class, medium,
  and the access form fields.
- VidyaAI stores raw questions, generated answers, sources, quiz answers and
  scores, weak-topic signals, feedback, timestamps, and related learning
  records in its operational data flows.
- Relevant prompts, recent conversation context, selected class/subject,
  retrieved source excerpts, teacher instructions, and some learning signals
  may be sent to Groq-hosted AI models. Account names and email addresses are
  not deliberately appended, but anything typed into free text may be sent.
- Authorised administrators can view operational, profile, learning, quiz, and
  feedback information for support, analytics, moderation, and review.
- Conversations can become candidates for authorised human review and
  controlled product-improvement exports. Common email/mobile patterns and
  internal identifiers are minimised in the candidate workflow, but arbitrary
  free text is not guaranteed to be anonymous.
- A conversation does not automatically retrain model weights.
- Browser local storage contains the access token, role, language and study
  preferences; the teacher workspace can also retain a limited recent-resource
  history. Logging out removes the token and role but may leave preferences or
  locally saved resources until site data is cleared.
- No application code currently implements advertising cookies, targeted ads,
  payment collection, precise location, camera/microphone access, or answer-sheet
  uploads.

### Current compliance and product gaps

Publishing a policy does not itself implement the described user controls. The
following engineering work remains required:

- `/auth/register` does not persist credentials and `/auth/login` does not
  verify the submitted password; see
  [Authentication, Authorization, and Privacy Boundaries](#authentication-authorization-and-privacy-boundaries).
- There is no in-product age gate, verified parental-consent flow, or persisted
  policy-acceptance record.
- There is no self-service access, correction, export, consent-withdrawal, or
  account-deletion dashboard. Requests currently go to the official email.
- There is no automated record-retention scheduler, so the policy does not
  promise unsupported deletion intervals.
- A server-side contact endpoint requires an email provider, secret management,
  rate limiting, spam protection, and delivery/error monitoring.

### Validation

The public pages are route-level lazy-loaded React components. The completed
implementation was checked with:

```bash
cd frontend
npm run build

cd ..
backend/.venv311/bin/python -m unittest discover -s backend/tests -p 'test_*.py'
git diff --check
```

The initial implementation passed the Vite production build, all 69 backend
tests, route/asset HTTP checks, desktop and responsive visual review, and the
repository whitespace check.

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

### Versioned document governance

All curriculum, assessment, PYQ, and textbook sources are checksum locked in
`ingestion/document_catalog.json`. New managed files use canonical names such as
`cgbse-class-10-science-curriculum-2026-27-v1.0.0.pdf`. Never edit a managed PDF
in place: add a new semantic version, supersede the old catalog record, and bump
the catalog version. Validation fails if a PDF or its student-facing delivery
copy changes without an explicit version update.

```bash
# Validate all cataloged documents and delivery copies
backend/.venv311/bin/python -m ingestion.document_catalog validate

# Inspect extraction/chunking without writing vectors
backend/.venv311/bin/python -m ingestion.ingest \
  --all-active \
  --document-type curriculum \
  --document-type model_question_paper \
  --dry-run

# Ingest only the active teacher-resource versions
backend/.venv311/bin/python -m ingestion.ingest \
  --all-active \
  --document-type curriculum \
  --document-type model_question_paper
```

Each Qdrant point records its document ID/version, catalog version, academic
year, authority, document type, source checksum, and active-version status.
Imports delete older active vectors for the same logical document before
upserting the new version. See `ingestion/data/README.md` for naming and semantic
version rules.

---

## Teacher Dashboard

At login or registration, select **Teacher** to receive a JWT with `role: "teacher"`. After login, VidyaAI opens `/teacher`. Teacher-only generation endpoints reject student-role tokens. The role is currently selected during login rather than loaded from a persisted account record; see the authentication limitation below.

### Teacher Workspaces

| Workspace | Teacher inputs | Generated output |
|---|---|---|
| Curriculum Creator | Class, subject, duration, weekly periods, medium, chapters, learning goals | Outcomes, week-wise sequence, period allocation, pedagogy, resources, assessments, differentiation, revision, and checklist |
| Test & Paper Creator | Class, subject, syllabus, total marks, question count, duration, difficulty, paper type, medium, instructions | Blueprint, printable numbered paper, answer key, marking scheme, and validation checklist |
| How to Teach | Class, subject, chapter/topic, lesson duration, medium, student readiness, teacher notes | Teacher concept briefing, lesson objectives, important points, misconceptions, timed lesson flow, board plan, examples, questions, activity, differentiation, checks, homework, and likely doubts |

Teacher generators search the same Qdrant curriculum collection used by student chat. Strongly matched chunks are supplied to Groq as factual context and returned as source labels. When no strong source is found, the generated resource explicitly tells the teacher to verify chapter-specific details. If Groq is unavailable, the API returns a structured draft instead of failing with an empty screen.

Generated resources are kept in browser-local recent history, not in PostgreSQL. Teachers can copy the Markdown or use the print action to save it as PDF. **AI-generated curricula, assessments, answer keys, and teaching explanations remain drafts and should be checked against the current board syllabus and textbook before classroom use.**

The **AI Chat** and **PYQ Library** are native sections of the teacher dashboard. Teachers can ask curriculum-grounded questions and browse, open, or download previous papers without leaving `/teacher`. The teacher header also keeps the active-day streak visible and includes a Hindi/English interface switch.

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

### Profile (requires JWT)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile/summary` | Student activity, subject progress, weak topics, and exam information |
| GET | `/profile/weak-topics` | Weak-topic list for the current student |
| PUT | `/profile/exam-date` | Save or update the student's exam date |
| GET | `/profile/countdown` | Days remaining until the saved exam date |

### Quiz (requires JWT)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/quiz/generate` | Generate 2–10 adaptive or exact-paper PYQ MCQs |
| POST | `/quiz/{quiz_id}/submit` | Grade answers, reveal explanations, and update weak topics |
| POST | `/quiz/{quiz_id}/skip` | Mark a quiz as skipped |
| GET | `/quiz/summary` | Return quiz count, completed count, and average score |

### Teacher (requires a teacher-role JWT)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/teacher/curriculum` | Generate a curriculum plan from class, subject, weeks, periods, chapters, and goals |
| POST | `/teacher/test-paper` | Generate a constrained question paper, answer key, and marking scheme |
| POST | `/teacher/lesson-guide` | Generate a topic briefing and classroom teaching plan |

### PYQ Practice

The PYQ page passes the selected paper's subject, year, set, and exact PDF filename to `/quiz/generate` with `quiz_type: "pyq"`. Only the selected paper shows a preparation state, and its quiz remains directly below the paper list instead of navigating to the standalone Quiz tab. The backend retrieves only chunks whose `source_file` matches that PDF. If an older Qdrant export contains only consolidated subject papers, the backend reads the matching PDF from `ingestion/data/Previous_Year_Questions` instead of silently using a different paper. Image-only papers use Hindi+English Tesseract OCR; the backend Docker image includes both OCR language packs.

### Admin (requires admin JWT)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Platform-wide summary, top subjects, source mix |
| GET | `/admin/users` | Per-user breakdown with subjects, time, weak topics, recent questions |
| GET | `/admin/export-student-metrics` | Download platform and per-student metrics as CSV |
| POST | `/admin/export-training-data` | Append eligible cache records to offline train/test JSONL files |
| GET | `/admin/learning-loop/stats` | Continuous-learning capture and review metrics |
| GET | `/admin/learning-loop/candidates` | Ranked pending/approved/rejected learning candidates |
| PUT | `/admin/learning-loop/candidates/{id}` | Approve or reject a candidate with a review note |
| GET | `/admin/learning-loop/export-approved` | Download only human-approved training examples as JSONL |

---

## Architecture Overview

VidyaAI is a modular web application with two offline pipelines. The online path serves the React application, answers questions, creates quizzes, and records learning activity. The ingestion path turns textbooks and previous-year papers into searchable Qdrant points. The improvement path converts privacy-minimized interactions into human-reviewed training data; it never retrains a model automatically.

### Architecture Flowchart

```mermaid
flowchart TD
    User([User]) --> Role{Login role}
    Role -->|Student| Student[Student Dashboard]
    Role -->|Teacher| Teacher[Teacher Dashboard]
    Role -->|Allowlisted admin| AdminUI[Admin Analytics]
    Student --> UI[Shared React Chat, Quiz and PYQ]
    Teacher --> UI
    Teacher --> TeacherTools[Curriculum, Paper and Lesson Tools]
    AdminUI --> UI
    UI -->|Axios requests + JWT| Gateway{Runtime gateway}
    Gateway -->|Development| API[FastAPI Backend]
    Gateway -->|Production: Nginx /api proxy| API

    API --> Route{Request type}

    Route -->|Login and identity| Auth[Auth Service]
    Route -->|Question| Chat[Chat Orchestrator]
    Route -->|Practice| Quiz[Quiz and PYQ Engine]
    Route -->|Progress| Profile[Student Profile]
    Route -->|Analytics and review| Admin[Admin Dashboard API]
    Route -->|Teacher planning| TeacherAPI[Teacher API]

    Chat --> Cache{Answer in process cache?}
    Cache -->|Yes| Cached[Return Cached Answer]
    Cache -->|No| Intent{Classify Intent}

    Intent -->|Simple calculation| Direct[Deterministic Answer]
    Intent -->|General or writing| Groq[Groq LLM]
    Intent -->|Curriculum question| Retrieve[Retrieve Textbook Context]
    Retrieve --> Qdrant[(Qdrant Vector Database)]
    Qdrant --> Ground{Strong Evidence?}
    Ground -->|Yes| Groq
    Ground -->|No, strict textbook request| Safe[Insufficient-Context Safe Mode]
    Ground -->|No, general fallback allowed| Groq

    Groq --> Format[Validate and Format Answer]
    Direct --> Format
    Safe --> Format
    Cached --> Response[Return Answer to Frontend]
    Format --> Save[Save Session, Cache and Learning Candidate]
    Save --> Postgres[(PostgreSQL)]
    Save --> Response
    Response --> UI

    Quiz -->|Generate adaptive MCQs| Groq
    Quiz -->|Retrieve exact selected paper| Qdrant
    Quiz -->|Exact-PDF fallback| PDFs[(Local PYQ PDFs + OCR)]
    Quiz --> Postgres
    Profile --> Postgres
    Admin --> Postgres
    TeacherAPI -->|Strong curriculum context| Qdrant
    TeacherAPI -->|Structured generation| Groq

    SourcePDF[Textbook and PYQ PDFs] --> Ingest[Extract, OCR, Chunk and Embed]
    Ingest --> Qdrant

    Postgres --> Review[Human Review of Learning Candidates]
    Review --> Approved[Approved JSONL Dataset]
    Approved --> Training[Offline Evaluation and Optional QLoRA Training]
```

The central online flow is **frontend → FastAPI → cache/intent routing → Qdrant and/or Groq → formatted answer → PostgreSQL → frontend**. PDF ingestion feeds the knowledge base independently, while reviewed interactions feed an offline improvement pipeline.

### Complete System Diagram

```mermaid
flowchart TB
    subgraph Client[Client layer]
        Browser[Student or admin browser]
        React[React 18 single-page app<br/>Dashboard, chat, quiz, profile, admin]
        Render[RichMarkdown renderer<br/>GFM tables, Mermaid and Venn diagrams]
        React --> Render
    end

    subgraph Edge[Development / production edge]
        Vite[Vite development server<br/>:5173]
        Nginx[Nginx production gateway<br/>:80 / :443]
        Static[Built frontend files<br/>frontend/dist]
        Nginx --> Static --> React
    end

    Browser -->|Development assets| Vite
    Vite --> React
    React -->|Development Axios + optional Bearer JWT| API
    Browser -->|Production assets and API| Nginx
    React -->|Production Axios to /api/*| Nginx
    Nginx -->|Remove /api prefix and proxy| API

    subgraph Backend[FastAPI application :8000]
        API[backend/main.py]
        Auth[Auth router<br/>JWT identity]
        Chat[Chat router<br/>history, cache and feedback]
        Profile[Profile router<br/>progress and exam countdown]
        Quiz[Quiz router<br/>adaptive and PYQ MCQs]
        TeacherRoute[Teacher router<br/>curriculum, papers and lesson guides]
        Admin[Admin router<br/>analytics, review and exports]
        RAG[RAG service<br/>intent, retrieval and answer formatting]
        Learn[Learning-loop service<br/>redaction and quality scoring]
        Embed[Embedding service<br/>mock or multilingual model]
        API --> Auth
        API --> Chat
        API --> Profile
        API --> Quiz
        API --> TeacherRoute
        API --> Admin
        Chat --> RAG
        Chat --> Learn
        Quiz --> RAG
        RAG --> Embed
    end

    subgraph Data[Persistent and fallback data]
        Postgres[(PostgreSQL 15<br/>application and learning records)]
        Qdrant[(Qdrant<br/>cgbse_knowledge collection)]
        LocalQ[(Local Qdrant fallback<br/>development only)]
        Memory[(Process memory fallback<br/>sessions, cache and weak topics)]
        Logs[(feedback_logs/*.json)]
        PDFs[(Textbook and PYQ PDFs)]
    end

    Chat --> Postgres
    Profile --> Postgres
    Quiz --> Postgres
    Admin --> Postgres
    Chat --> Memory
    Chat --> Logs
    RAG --> Qdrant
    RAG -. development fallback .-> LocalQ
    Quiz -->|Exact-paper OCR fallback| PDFs

    subgraph External[External inference]
        Groq[Groq chat-completions API<br/>configured Llama model]
        HF[Local Hugging Face model cache<br/>optional embedding download]
    end
    RAG --> Groq
    Quiz --> Groq
    TeacherRoute --> Groq
    TeacherRoute --> Qdrant
    Embed --> HF

    subgraph Offline[Offline data and improvement pipelines]
        Ingest[ingestion/ingest.py<br/>extract, OCR, chunk and tag]
        Review[Teacher/admin review<br/>approve or reject candidates]
        JSONL[Approved JSONL<br/>train/test datasets]
        Train[Offline QLoRA scripts<br/>evaluation and controlled deployment]
        PDFs --> Ingest
        Ingest --> Embed
        Ingest --> Qdrant
        Learn --> Postgres
        Postgres --> Review --> JSONL --> Train
    end
```

### Component Responsibilities

| Component | Responsibility | Main files |
|---|---|---|
| React client | Routes between login, registration, student dashboard/chat, quiz experiences, progress, study planning, PYQ practice, and the admin dashboard. Axios adds the JWT from local storage. | `frontend/src/App.jsx`, `frontend/src/pages/`, `frontend/src/api/client.js` |
| Answer renderer | Displays Markdown, tables, Mermaid diagrams, and native Venn diagrams, including progressive answer reveal. | `frontend/src/components/RichMarkdown.jsx` |
| FastAPI composition root | Configures CORS, initializes SQLAlchemy tables, and mounts the auth, chat, profile, quiz, and admin routers. | `backend/main.py` |
| Chat orchestration | Resolves chapter choices and follow-ups, checks the in-process cache, calls RAG, persists the answer, and records feedback and weak topics. Guest questions are allowed. | `backend/routers/chat.py` |
| RAG and answer policy | Infers prompt intent and subject, retrieves and ranks evidence, optionally rewrites weak searches, applies textbook-grounding guards, calls Groq, and enforces answer/visual formats. | `backend/services/rag.py` |
| Quiz engine | Produces 2–10 MCQs from a chat answer or one exact PYQ paper, records submissions/skips, and turns wrong answers into weak-topic signals. | `backend/routers/quiz.py` |
| Student profile | Aggregates questions, subjects, weak topics, exam date, and countdown information. | `backend/routers/profile.py` |
| Admin analytics | Aggregates engagement, feedback, cache, quiz, subject, and user metrics; exports CSV/training data and controls the learning-candidate review queue. | `backend/routers/admin.py` |
| Persistence | Uses async SQLAlchemy with PostgreSQL. Table creation runs at startup; the application can continue with reduced persistence if the database is unavailable. | `backend/database.py`, `backend/models/` |
| Knowledge store | Holds 384-dimensional textbook and PYQ chunks with class, subject, chapter, topic, content type, and source-file metadata. | Qdrant collection `cgbse_knowledge` |
| Ingestion | Extracts PDF text, optionally runs Hindi/English OCR, normalizes and chunks content, creates embeddings, removes old points for the same source, and upserts stable point IDs. | `ingestion/ingest.py` |
| Safe improvement loop | Redacts email addresses and Indian phone numbers, hashes student identity/questions, scores candidates, requires human approval, and exports approved JSONL. | `backend/services/learning_loop.py`, `training/` |

### Chat Answer Request Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as Student browser
    participant C as Chat router
    participant DB as PostgreSQL / memory
    participant R as RAG service
    participant Q as Qdrant
    participant G as Groq API

    U->>C: POST /chat/ask<br/>question, selected subject, answer style
    C->>C: Resolve chapter selection and contextualize follow-up
    C->>DB: Load recent history and weak topics
    C->>C: Normalize question and check process cache
    alt Cache hit
        C->>DB: Increment persistent cache hit and save session
        C-->>U: Cached answer, confidence 0.97
    else Cache miss
        C->>R: run_rag(...)
        R->>R: Infer subject and classify prompt intent
        alt Simple arithmetic
            R->>R: Safely evaluate deterministic expression
        else General, writing, or non-curriculum request
            R->>G: Generate without irrelevant textbook context
        else Curriculum request
            R->>Q: Retrieve and score candidate chunks
            opt Retrieval is weak
                R->>G: Rewrite query as guarded JSON (not evidence)
                R->>Q: Retry retrieval with rewritten query
            end
            alt Strict language/literature request has no strong evidence
                R->>R: Return insufficient-context safe mode
            else Strong evidence or permitted general fallback
                R->>G: Generate with strong context, or without weak context
            end
        end
        R->>R: Apply answer-style, repetition, topic and visual guards
        R-->>C: Answer, source labels, source type
        C->>DB: Save cacheable answer, chat session and learning candidate
        C-->>U: Answer, sources, confidence and session ID
    end
```

The selected UI subject is only a hint. Explicit terms in the question—such as `ganit`, `vigyan`, `history`, or `English`—take priority. Recent history is added only for likely follow-up questions. Chapter-summary requests deliberately bypass the cache so a stale or over-general summary is not reused.

The intent router has five practical outcomes:

| Intent | Processing path |
|---|---|
| Simple arithmetic | Local, restricted arithmetic evaluator; no retrieval or LLM call. |
| Math problem | Groq problem solving; weak textbook chunks are not injected. |
| General knowledge / writing | Direct Groq generation in the detected prompt language. |
| Standalone visual-data request | Groq generation with strict Mermaid/Venn/chart output requirements. |
| Curriculum question | Qdrant retrieval, guarded rewrite on a weak match, then grounded generation or safe fallback. |

### Retrieval and Grounding

For real embeddings, the service searches Qdrant semantically and also scrolls stored points so lexical and metadata scoring can be applied. In mock mode, semantic search is skipped and ranking is lexical/metadata based. Only the top four ranked chunks are normally sent to the model.

Important ranking signals include:

| Signal | Effect |
|---|---|
| Token/phrase overlap and semantic similarity | Establish the base relevance score. |
| Matching prompt topic, subject, and class | Boost the expected curriculum material. |
| Matching chapter metadata | Adds a strong chapter bonus. |
| Matching section metadata, such as `1-3` | Adds the strongest structural bonus. |
| Weak-topic match | Slightly favors content the student needs to revisit. |
| Subject/class mismatch | Penalizes unrelated material. |
| TOC, exercise, or unrelated inherited-section content | Downranks navigational or misleading chunks. |

A result must pass the strong-match threshold before it is used as evidence. A Groq-generated query rewrite may improve search terms, but the rewrite is never treated as source material. Language and literature questions that require exact chapter facts enter safe mode when strong textbook evidence is absent. Standard Science/Social Science concepts may still receive a clearly separated model fallback.

### Q&A Cache Flow

```mermaid
flowchart TD
    Ask[Question + subject + class + style] --> Normalize[Lowercase, trim and normalize whitespace]
    Normalize --> Key[Add recent-history signature]
    Key --> Local{Process cache hit?}
    Local -->|Yes| Hit[Return confidence 0.97]
    Hit --> Count[Upsert PostgreSQL qa_cache<br/>and increment hit_count]
    Local -->|No| Generate[RAG / Groq answer path]
    Generate --> Eligible{Cacheable source<br/>with source labels?}
    Eligible -->|Yes| Mem[Store in process cache]
    Mem --> Persist[Upsert PostgreSQL qa_cache]
    Eligible -->|No| Return[Return without caching]
    Persist --> Return
    Count --> Return
```

There are two cache layers. The process-local cache includes normalized question, subject, class, answer style, and recent-history signature. PostgreSQL `qa_cache` persists reusable answers and cache statistics. Only eligible generated answers with source labels are cached; chapter-style requests and safe/direct paths are excluded. The current read path checks the process cache, while PostgreSQL is used for persistence and hit accounting.

### Quiz and PYQ Practice Flow

```mermaid
flowchart LR
    Start[Student starts practice] --> Kind{Source type}
    Kind -->|Chat activity| Session[Question + answer or chat session]
    Kind -->|Selected PYQ card| Exact[Subject + year + set + exact PDF filename]
    Exact --> QR[Qdrant filter by source_file<br/>and previous_year_question]
    QR --> Found{Exact chunks found?}
    Found -->|No| OCR[Read the same local PDF<br/>with Hindi + English OCR]
    Found -->|Yes| Source[Paper text]
    OCR --> Source
    Session --> Context[Add weak topics and recent quiz performance]
    Source --> Context
    Context --> LLM[Groq creates structured MCQs]
    LLM --> Valid{Valid MCQ JSON?}
    Valid -->|No| Fallback[Deterministic MCQ fallback]
    Valid -->|Yes| Save[Save quiz and questions]
    Fallback --> Save
    Save --> Submit[Submit or skip]
    Submit --> Results[Save answers, score and status]
    Results -->|Incorrect answers| Weak[Increment weak topic]
    Results --> Profile2[Profile and admin analytics]
```

Exact-paper isolation prevents a student who selects one year/set from silently receiving questions from another paper. Quiz endpoints require a JWT and a working database. Correct options are hidden until submission; after submission the response includes correctness and explanations.

### Data Model

```mermaid
erDiagram
    STUDENTS ||--o{ CHAT_SESSIONS : asks
    STUDENTS ||--o{ WEAK_TOPICS : develops
    STUDENTS ||--o{ QUIZZES : attempts
    QUIZZES ||--|{ QUIZ_QUESTIONS : contains
    QUIZZES ||--o{ QUIZ_ANSWERS : receives
    QUIZ_QUESTIONS ||--o{ QUIZ_ANSWERS : answered_by
    CHAT_SESSIONS ||--o| LEARNING_EXAMPLES : produces

    STUDENTS {
        string id PK
        string email UK
        string class_level
        string medium
        date exam_date
    }
    CHAT_SESSIONS {
        int id PK
        string student_id FK
        text question
        text answer
        string subject
        datetime created_at
    }
    WEAK_TOPICS {
        int id PK
        string student_id FK
        string subject
        string topic
        int wrong_count
    }
    QA_CACHE {
        int id PK
        string normalized_question
        text answer
        string subject
        string class_level
        int hit_count
    }
    QUIZZES {
        int id PK
        string student_id FK
        string quiz_type
        string status
        int correct_count
    }
    QUIZ_QUESTIONS {
        int id PK
        int quiz_id FK
        text prompt
        text options_json
        int correct_option
    }
    QUIZ_ANSWERS {
        int id PK
        int quiz_id FK
        int question_id FK
        int selected_option
        boolean is_correct
    }
    LEARNING_EXAMPLES {
        int id PK
        int chat_session_id UK
        string student_key
        string question_hash
        float quality_score
        string review_status
    }
```

`qa_cache` is intentionally independent of a student: its unique key is normalized question + subject + class level. `learning_examples` references a chat session logically through a unique ID but stores a hashed student key and redacted text for the review workflow.

### PDF Ingestion Pipeline

```mermaid
flowchart LR
    PDF[Textbook or PYQ PDF] --> Extract[pdfplumber text extraction]
    Extract --> Check{Missing or garbled<br/>and OCR enabled?}
    Check -->|Yes| Tess[Tesseract hin+eng OCR]
    Check -->|No| Normalize[Unicode/text normalization]
    Tess --> Normalize
    Normalize --> Meta[Infer class, subject, chapter,<br/>topic, set/year and content type]
    Meta --> Catalog[Resolve document ID, version,<br/>authority and checksum]
    Catalog --> Chunk[Lesson-aware overlapping chunks]
    Chunk --> Vector[384-dimensional embedding]
    Vector --> Replace[Delete the older active version<br/>for the same document ID]
    Replace --> Upsert[Stable-ID upsert to<br/>cgbse_knowledge]
```

The ingestion script is idempotent per logical document version. A checksum mismatch is rejected, and ingesting a newer active version deletes older vectors for that document ID before inserting stable versioned point IDs. Source-file history remains on disk and in the catalog. In production, Qdrant unavailability stops ingestion to avoid writing to an accidental local store. In development, both ingestion and retrieval can use `qdrant_storage_local` as a fallback.

### Safe Continuous-Improvement Flow

```mermaid
flowchart LR
    Interaction[Saved chat interaction] --> Privacy[Redact email/phone<br/>hash student and question]
    Privacy --> Score[Quality score from source,<br/>grounding, length and feedback]
    Score --> Pending[(learning_examples<br/>pending)]
    Pending --> Feedback{Student feedback}
    Feedback -->|Thumbs down| Reject[Automatic rejection]
    Feedback -->|Thumbs up / none| Review[Admin/teacher review]
    Review -->|Reject| Reject
    Review -->|Approve if quality is sufficient| Export[Approved JSONL export]
    Export --> Eval[Offline dataset checks<br/>and evaluation]
    Eval --> QLoRA[Optional QLoRA fine-tuning]
    QLoRA --> Deploy[Controlled model deployment]
```

The application never updates model weights directly from student prompts. A thumbs-down rejects the corresponding candidate automatically. Admin approval only makes a record exportable; it does not start training. The experimental fine-tuned/Groq router in `backend/services/hybrid_rag.py` is not mounted in `backend/main.py`, so it is not part of the live request path. See `training/WORKFLOW.md` for the controlled release process.

### Authentication, Authorization, and Privacy Boundaries

- The frontend stores a HS256 bearer JWT in browser local storage and Axios attaches it to API requests.
- Login includes a `student` or `teacher` role in the signed JWT. The frontend uses it for the initial workspace, and `/teacher/*` verifies it server-side.
- Chat asking, history, and feedback accept a guest identity when a valid token is absent. Profile, quiz, and admin routes require a token.
- Admin access is derived from `ADMIN_EMAILS`; the admin dependency verifies the current email against that allowlist.
- The current `/auth/register` endpoint returns a profile response without writing credentials, and `/auth/login` issues a JWT from the submitted email and selected role without checking the submitted password. Roles are therefore not yet tied to a persisted, administrator-verified account. This is development scaffolding and must be replaced with persisted user lookup, bcrypt verification, and controlled teacher-role assignment before treating the system as secure authentication.
- Learning candidates redact email addresses and Indian mobile numbers, and replace student/question identity with SHA-256 hashes. Raw operational chat sessions remain in the application database.

### Runtime and Deployment Topology

| Environment | Request path | Services and storage |
|---|---|---|
| Local frontend development | Browser → Vite `:5173` → FastAPI `:8000` | Docker Compose runs FastAPI, PostgreSQL `:5432`, and Qdrant `:6333`; CORS permits the documented local Vite ports. |
| Production | Browser → Nginx `:80/:443` → static React files or `/api/*` → FastAPI `:8000` | `docker-compose.prod.yml` runs Nginx, FastAPI, PostgreSQL, and Qdrant. Database, vector, ingestion, and training-data directories are mounted as volumes. |

Production PostgreSQL, Qdrant, and FastAPI ports bind to loopback; Nginx is the public entry point. Nginx handles React Router fallback, gzip, and `/api` prefix removal. The frontend is built with `VITE_API_URL=/api`. Docker Compose starts dependencies in order, but application-level readiness is handled defensively: database initialization logs failures and the backend stays alive, while production Qdrant failures do not silently switch to local storage.

### Failure and Fallback Behavior

| Failure | Behavior |
|---|---|
| PostgreSQL unavailable at startup | FastAPI continues; DB-dependent profile, quiz, admin, and durable history features are reduced or unavailable. Chat can use process memory for the current backend process. |
| Qdrant unavailable in development | Retrieval uses the local embedded Qdrant store under `qdrant_storage_local`. |
| Qdrant unavailable in production | Retrieval is caught by the RAG path and proceeds without retrieved evidence; strict textbook questions return safe mode. Ingestion fails explicitly. |
| Embedding model missing | The service uses fixed mock vectors and relies on lexical/metadata scoring unless downloads are explicitly allowed. |
| Weak or irrelevant retrieval | Context is withheld from Groq; strict chapter-dependent language/literature requests are not guessed. |
| Groq unavailable or returns unusable quiz JSON | RAG uses its local fallback answer behavior; quiz generation uses deterministic fallback MCQs when source text exists. |
| Backend restart | Process-local cache, guest history, and pending chapter choices are lost; PostgreSQL and Qdrant data remain. |

### Documentation Rule

Every implementation change must include a corresponding update to this `README.md`, covering the changed behavior, configuration, API, workflow, or limitation.

---

## Known Limitations

- **Mock embeddings in dev** — `USE_MOCK_EMBEDDINGS=true` means all vectors are `[0.1]*384`. Retrieval uses token-overlap scoring only (no semantic similarity). Set to `false` and install `sentence-transformers` for real embeddings.
- **Legacy-encoded Hindi PDFs** — PDFs using Kruti Dev / pre-Unicode fonts produce garbled text after extraction. Use Unicode-encoded PDFs for best results.
- **Estimated study time** — Calculated from session timestamps with a gap-based heuristic (≤8 min per gap). Not a direct time-on-page measurement.
- **Admin email-only access** — Admin status is determined by email address in `ADMIN_EMAILS` env var, not a DB column. To add admins, update `.env` and rebuild the backend container.
- **Development-only role selection** — Student/teacher role is selected during login and signed into the JWT, but it is not yet verified against a persisted user record. Production must require administrator approval or an institution invite for teacher accounts.
- **No child-consent workflow yet** — The policy discloses supervised use for people under 18, but registration does not yet implement age verification, verifiable parental consent, or a persisted consent record.
- **No self-service privacy controls yet** — Access, correction, export, consent withdrawal, and deletion requests currently rely on `GyanixAiSolutions@gmail.com`; automated retention and account-deletion workflows are not implemented.
- **Contact uses the visitor's email client** — The public Contact form prepares a `mailto:` message. Server-side delivery requires SMTP or a transactional email service plus abuse protection and secret configuration.
- **Legal drafts require counsel review** — Terms, Privacy, and AI Use are versioned engineering-aligned drafts, not a substitute for review by qualified legal counsel.
- **Teacher outputs are drafts** — Generated curricula, papers, answer keys, and teaching guides require teacher review against the latest CGBSE syllabus and textbook. Recent teacher resources currently live only in browser local storage.
- **Single Qdrant collection** — All subjects share `cgbse_knowledge`. Subject filtering is done at scoring time, not at vector DB query time.
