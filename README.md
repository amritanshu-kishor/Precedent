# PRECEDENT — AI-Powered Pharmaceutical Manufacturing Quality Intelligence System

> **Advisory Quality Intelligence Prototype**  
> *All records and metrics are synthetic. System outputs are advisory under Good Manufacturing Practice (GMP) guidelines and require qualified human review.*

PRECEDENT is an enterprise AI-assisted quality intelligence platform designed for pharmaceutical manufacturing operations. It integrates root-cause deviation intake, a 4-agent consensus investigation workflow (`INVESTIGATOR` → `SKEPTIC` → `AUDITOR` → `SYNTHESIZER`), institutional memory recall, CAPA lifecycle management, and empirical effectiveness tracking.

---

## 🏛️ System Architecture

```
Precedent/
├── backend/                # FastAPI backend & AI agent orchestration
│   ├── app/
│   │   ├── agents/         # Investigator, Skeptic, Auditor, Synthesizer agents
│   │   ├── api/            # REST API endpoints (deviations, capas, analytics, memory)
│   │   ├── core/           # Configuration, logging, database sessions
│   │   ├── memory/         # Institutional memory interface & mock/Hindsight adapters
│   │   ├── models/         # SQLAlchemy 2.x relational data models
│   │   ├── orchestration/  # Agent workflow orchestrator
│   │   ├── repositories/   # CRUD data persistence layer
│   │   ├── schemas/        # Pydantic request & response schemas
│   │   └── services/       # LLM (Groq) & business logic services
│   ├── scripts/            # Synthetic data seeding scripts
│   ├── tests/              # Pytest automated API test suite
│   ├── Dockerfile          # Backend containerization
│   └── requirements.txt    # Python dependencies
├── frontend/               # React 18 + TypeScript + Vite dashboard
│   ├── src/
│   │   ├── components/     # UI components & agent workflow visualizer
│   │   ├── context/        # Theme & application state
│   │   ├── pages/          # 10 specialized quality intelligence views
│   │   ├── services/       # Centralized API client & offline synthetic fallbacks
│   │   └── types/          # TypeScript domain definitions
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration & backend proxying
└── .gitignore              # Repository ignore rules (secrets, venv, node_modules)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env to supply your GROQ_API_KEY (optional, deterministic fallback provided)

# Launch FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8004 --reload
```
Interactive API documentation: `http://127.0.0.1:8004/docs`

To seed the initial synthetic demonstration deviations:
```bash
python -m scripts.seed_demo
```

To run test suites:
```bash
pytest -q
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start Vite development server
npm run dev
```
The application will launch at `http://localhost:3000`.

---

## 🔍 Core Features & Workflows

1. **Deviation Registry:** Real-time intake, severity categorization, and deviation tracking.
2. **4-Agent Investigation Pipeline:**
   - **Investigator:** Identifies root causes using telemetry, deviation context, and LLM reasoning.
   - **Skeptic:** Challenges assumptions, probes confounding variables, and surfaces unvalidated premises.
   - **Auditor:** Verifies procedural compliance, SOP boundaries, and regulatory alignments.
   - **Synthesizer:** Harmonizes agent outputs into consensus findings and prioritized recommendations.
3. **Institutional Precedent Memory:** Surface historical deviation parallels and intervention efficacy.
4. **Governance & Review Gateway:** Human-in-the-loop review with mandatory rationale logging and one-click CAPA generation.
5. **CAPA Management:** Track corrective actions through Proposed, Implemented, and Assessed lifecycle stages.
6. **Effectiveness Monitoring:** Longitudinal verification queues and empirical assessment records.
7. **Quality Analytics:** Self-calibration engine metrics, equipment failure trends, and intervention efficacy ratings.

---

## 🔒 Security & Compliance

- **Zero Secret Exposure:** `.env` files and local database files are excluded from version control.
- **Advisory AI System:** All AI recommendations require qualified human review before CAPA execution.
