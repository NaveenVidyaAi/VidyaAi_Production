import logging
import sys
from pathlib import Path

# Ensure the repository root is on sys.path so the backend package can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, chat, profile, admin, quiz
from backend.config import settings
from backend.database import init_db
import asyncio

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="VidyaAI")

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
origins.extend(["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"])
origins = list(dict.fromkeys(origins))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "message": "VidyaAI API running"}

# Initialize DB in background task to avoid blocking startup
@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI startup event triggered")
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # Continue anyway - database may already exist

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
