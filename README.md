# Patent Intelligence Engine

> An agentic AI system that analyzes any patent and surfaces cross-industry commercialization opportunities using a 5-agent sequential pipeline with real-time streaming.

---

## What This Demonstrates

This project showcases end-to-end AI product engineering at a production level: a **LangGraph-orchestrated multi-agent pipeline** where five specialized agents process a patent sequentially — each streaming live progress updates to the browser via WebSocket. It demonstrates **full-stack AI product thinking**: from real-time UX design (streaming agent logs, animated pipeline visualization) through vector-store-backed semantic search (ChromaDB + Gemini embeddings) to structured JSON extraction with Gemini 2.0 Flash. The result is a domain-agnostic commercialization intelligence tool that a Chief IP Officer could use today — built entirely on free-tier infrastructure.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                       │
│  UploadPanel → WebSocket hook → AgentStream (live logs)      │
│  Tabs: Overview | Knowledge Graph | Opportunities | Export   │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket /ws/{job_id}
                           │ HTTP POST /api/analyze
┌──────────────────────────▼──────────────────────────────────┐
│                      BACKEND (FastAPI)                        │
│                                                               │
│  POST /api/analyze ──► asyncio.Queue ──► WebSocket stream    │
│                                                               │
│  ┌─────────────────── LangGraph Pipeline ─────────────────┐  │
│  │                                                          │  │
│  │  Agent 1: Ingestion    → PDF/URL → raw text             │  │
│  │      ↓                                                   │  │
│  │  Agent 2: Decomposition → 4-7 tech modules + ChromaDB   │  │
│  │      ↓                                                   │  │
│  │  Agent 3: Analogy      → cross-industry mappings        │  │
│  │      ↓                                                   │  │
│  │  Agent 4: Knowledge Graph → NetworkX → React Flow JSON  │  │
│  │      ↓                                                   │  │
│  │  Agent 5: Evaluation   → scored opportunities + brief   │  │
│  └──────────────────────────────────────────────────────── ┘  │
│                                                               │
│  ChromaDB (in-memory)   Gemini 2.0 Flash   text-embedding-004│
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend framework | FastAPI | 0.111.0 |
| Agent orchestration | LangGraph | 0.1.19 |
| AI model | Gemini 2.0 Flash | via google-generativeai 0.7.2 |
| Embeddings | text-embedding-004 | via google-generativeai |
| Vector store | ChromaDB | 0.5.3 (in-memory) |
| Graph computation | NetworkX | 3.3 |
| PDF parsing | PyMuPDF | 1.24.5 |
| Frontend framework | React + TypeScript | 18 + 5.4 |
| Build tool | Vite | 5 |
| Styling | Tailwind CSS | 3 |
| Graph visualization | React Flow | 11.11.4 |
| Charts | Recharts | 2.12.7 |
| Real-time | WebSockets | native browser API |

---

## Local Setup (Docker)

**Prerequisites:** Docker Desktop, a free Gemini API key from [aistudio.google.com](https://aistudio.google.com)

```bash
# 1. Clone the repo
git clone https://github.com/your-username/patent-intelligence-engine
cd patent-intelligence-engine

# 2. Add your API key
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Start everything
docker-compose up --build

# 4. Open http://localhost:5173
```

---

## Manual Setup (Without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start server
uvicorn main:app --reload --port 8000

# Verify: curl http://localhost:8000/health
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

---

## How to Use

1. **Input a patent** — Drop a PDF or paste a Google Patents URL (e.g., `https://patents.google.com/patent/US10625776B2`). Click "Load Sample Patent" for an instant demo with Honda's driving assistance patent.

2. **Watch the agents work** — Five AI agents process the patent sequentially. Each agent streams live progress logs to the left panel. The full pipeline takes ~2 minutes on the free Gemini tier.

3. **Explore results** — Switch between tabs:
   - **Overview**: Patent summary, key claims, module breakdown, executive brief
   - **Knowledge Graph**: Interactive React Flow graph — zoom, pan, click nodes for details
   - **Opportunities**: Top 3 cross-industry opportunities with radar charts and action recommendations
   - **Export**: Download a formatted strategy brief as `.txt`

---

## Deployment (Free Tier)

### Backend → Render

1. Create account at [render.com](https://render.com)
2. New Web Service → connect your GitHub repo
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `GEMINI_API_KEY=your_key`
7. Note your service URL: `https://your-app.onrender.com`

### Frontend → Vercel

1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Root directory: `frontend`
4. Framework preset: Vite
5. Add environment variables:
   - `VITE_API_URL=https://your-app.onrender.com`
   - `VITE_WS_URL=wss://your-app.onrender.com`
6. Deploy

**Note:** Render free tier spins down after 15 minutes of inactivity. The app shows a "Server waking up" banner and auto-retries the health check while the container restarts (~30 seconds).

---

## Rate Limiting & Responsible Use

- Default rate limit: 10 analyses per IP per hour (configurable via `RATE_LIMIT_PER_HOUR` env var)
- Maximum PDF size: 20MB (configurable via `MAX_PDF_SIZE_MB`)
- Patent text is capped at 50,000 characters sent to the LLM
- ChromaDB collections are in-memory and scoped per job — no patent data persists between server restarts
- All Gemini API calls use structured JSON output mode to prevent parsing failures

This tool is intended for IP strategy research and portfolio analysis. Always verify AI-generated commercialization insights with domain experts before making business decisions.

---

## Project Structure

```
patent-intelligence-engine/
├── backend/
│   ├── main.py              # FastAPI app, WebSocket endpoint
│   ├── orchestrator.py      # LangGraph pipeline definition
│   ├── models.py            # Pydantic models + TypedDict state
│   ├── vector_store.py      # ChromaDB wrapper with Gemini embeddings
│   ├── agents/
│   │   ├── agent1_ingestion.py      # PDF/URL → raw text + metadata
│   │   ├── agent2_decomposition.py  # Technology module extraction
│   │   ├── agent3_analogy.py        # Cross-domain analogy mapping
│   │   ├── agent4_knowledge_graph.py # NetworkX → React Flow graph
│   │   └── agent5_evaluation.py     # Opportunity scoring + brief
│   ├── sample_patents/
│   │   └── sample_patent.txt        # Honda US10625776B2 excerpt
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.tsx                  # Main layout + tab routing
        ├── components/
        │   ├── UploadPanel.tsx      # Dropzone + URL input
        │   ├── AgentStream.tsx      # Live agent log visualization
        │   ├── KnowledgeGraphView.tsx # React Flow graph
        │   ├── OpportunityCards.tsx # Scored opportunity display
        │   ├── ScoreRadar.tsx       # Recharts radar chart
        │   ├── PatentSummaryCard.tsx # Patent metadata + brief
        │   └── ExportButton.tsx     # .txt download
        └── hooks/
            └── useAgentWebSocket.ts # WebSocket state management
```
