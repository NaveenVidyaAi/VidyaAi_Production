import logging
import sys
from pathlib import Path

# Ensure the repository root is on sys.path so the backend package can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, chat, profile, admin, quiz, teacher
from backend.config import settings
from backend.database import init_db
import asyncio

logging.basicConfig(level=logging.INFO)
# PDF text extraction is intentionally verbose at DEBUG and can bury the
# actionable paper-generation error in thousands of glyph-level log lines.
logging.getLogger("pdfminer").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

app = FastAPI(title="VidyaAI")

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
origins.extend([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
])
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


def _public_origin(request: Request) -> str:
    if settings.public_site_url.strip():
        return settings.public_site_url.strip().rstrip("/")
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    scheme = forwarded_proto if forwarded_proto in {"http", "https"} else "https"
    host = request.headers.get("host", "localhost").split(",")[0].strip()
    if not host or any(character in host for character in "\r\n/\\"):
        host = "localhost"
    return f"{scheme}://{host}"


@app.get("/robots.txt", include_in_schema=False, response_class=PlainTextResponse)
async def robots_txt(request: Request):
    origin = _public_origin(request)
    return "\n".join([
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/",
        "Disallow: /admin",
        "Disallow: /chat",
        "Disallow: /dashboard",
        "Disallow: /login",
        "Disallow: /register",
        "Disallow: /teacher",
        f"Sitemap: {origin}/sitemap.xml",
        "",
    ])


@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml(request: Request):
    origin = _public_origin(request)
    routes = ["/", "/cgbse-class-10-model-papers", "/cgbse-teacher-tools", "/about", "/contact", "/ai-use"]
    urls = "".join(f"<url><loc>{origin}{route}</loc></url>" for route in routes)
    body = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    return Response(content=body, media_type="application/xml")


@app.get("/llms.txt", include_in_schema=False, response_class=PlainTextResponse)
async def llms_txt(request: Request):
    origin = _public_origin(request)
    return f"""# VidyaAI

> VidyaAI is a bilingual, curriculum-aware learning and teaching workspace for CGBSE Class 10, built by Gyanix AI Solutions.

## Main pages
- Product overview: {origin}/
- Class 10 model papers and PYQs: {origin}/cgbse-class-10-model-papers
- Teacher planning tools: {origin}/cgbse-teacher-tools
- Company and founder: {origin}/about
- Responsible AI use: {origin}/ai-use
- Contact: {origin}/contact

VidyaAI provides AI-assisted explanations, practice resources, curriculum planning, lesson planning and editable question-paper drafts. Generated educational content requires teacher or learner verification against official CGBSE sources.
"""

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
app.include_router(teacher.router, prefix="/teacher", tags=["teacher"])
