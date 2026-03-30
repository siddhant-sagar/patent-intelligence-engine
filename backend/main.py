import os
import uuid
import asyncio
import tempfile
from fastapi import FastAPI, WebSocket, UploadFile, File, Form, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
from models import PatentState
from orchestrator import run_pipeline
from collections import defaultdict
import time

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

app = FastAPI(title="Patent Intelligence Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store
jobs: dict[str, dict] = {}

# Rate limiting: track requests per IP
rate_limits: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_HOUR", "10"))


def check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    hour_ago = now - 3600
    rate_limits[client_ip] = [t for t in rate_limits[client_ip] if t > hour_ago]
    if len(rate_limits[client_ip]) >= RATE_LIMIT:
        return False
    rate_limits[client_ip].append(now)
    return True


@app.get("/health")
async def health():
    gemini_configured = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "version": "1.0.0",
        "gemini_configured": gemini_configured
    }


@app.post("/api/analyze")
async def analyze_patent(
    file: UploadFile = File(None),
    patent_url: str = Form(None)
):
    if not file and not patent_url:
        raise HTTPException(
            status_code=400,
            detail="Provide either a PDF file or a patent URL"
        )

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not configured. Please add it to your .env file."
        )

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {"status": "queued", "results": None}

    if file:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        # Save uploaded PDF to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            max_size = int(os.getenv("MAX_PDF_SIZE_MB", "20")) * 1024 * 1024
            if len(content) > max_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Maximum size: {os.getenv('MAX_PDF_SIZE_MB', '20')}MB"
                )
            tmp.write(content)
            tmp_path = tmp.name

        initial_state: PatentState = {
            "job_id": job_id,
            "input_type": "pdf",
            "raw_input": tmp_path,
            "raw_text": "",
            "patent_metadata": {},
            "modules": [],
            "analogies": [],
            "graph_data": {},
            "opportunities": [],
            "scores": {},
            "summary_brief": "",
            "error": None,
            "streaming_callback": None
        }
    else:
        if not patent_url.startswith("http"):
            raise HTTPException(status_code=400, detail="Invalid URL format")

        initial_state = {
            "job_id": job_id,
            "input_type": "url",
            "raw_input": patent_url,
            "raw_text": "",
            "patent_metadata": {},
            "modules": [],
            "analogies": [],
            "graph_data": {},
            "opportunities": [],
            "scores": {},
            "summary_brief": "",
            "error": None,
            "streaming_callback": None
        }

    jobs[job_id] = {"status": "running", "state": initial_state, "results": None}
    return {"job_id": job_id}


@app.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await websocket.accept()

    if job_id not in jobs:
        await websocket.send_json({
            "agent": "system",
            "status": "error",
            "message": "Job not found",
            "data": None
        })
        await websocket.close()
        return

    queue: asyncio.Queue = asyncio.Queue()
    initial_state = jobs[job_id]["state"]

    # Run pipeline in background
    pipeline_task = asyncio.create_task(run_pipeline(initial_state, queue))

    try:
        while True:
            event = await queue.get()
            if event is None:
                break
            await websocket.send_json(event)
            if event.get("status") == "complete":
                jobs[job_id]["results"] = event.get("data")
                jobs[job_id]["status"] = "complete"
            elif event.get("status") == "error":
                jobs[job_id]["status"] = "error"

    except WebSocketDisconnect:
        pipeline_task.cancel()
    except Exception as e:
        try:
            await websocket.send_json({
                "agent": "system",
                "status": "error",
                "message": str(e),
                "data": None
            })
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@app.get("/api/results/{job_id}")
async def get_results(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "results": job.get("results")
    }


@app.get("/api/sample")
async def get_sample_patent():
    """Return the sample patent info for quick demo."""
    sample_path = os.path.join(
        os.path.dirname(__file__), "sample_patents", "sample_patent.txt"
    )
    sample_url = "https://patents.google.com/patent/US10625776B2"
    if os.path.exists(sample_path):
        with open(sample_path) as f:
            preview = f.read()[:500]
        return {"text": preview, "url": sample_url}
    return {"url": sample_url}
