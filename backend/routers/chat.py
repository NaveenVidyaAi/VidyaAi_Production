import json
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.routers.auth import get_current_student, get_db
from backend.models.qa_cache import QACache
from backend.models.session import ChatSession
from backend.models.weak_topic import WeakTopic
from backend.services.rag import run_rag

router = APIRouter()

class AskRequest(BaseModel):
    question: str
    subject: str

class AskResponse(BaseModel):
    answer: str
    sources: list[str]
    confidence: float
    session_id: int

class FeedbackRequest(BaseModel):
    session_id: int
    understood: bool


def _normalize_question(question: str) -> str:
    normalized = re.sub(r"\s+", " ", (question or "").strip().lower())
    normalized = re.sub(r"[^\w\s\u0900-\u097f?.,!-]", "", normalized)
    return normalized[:550]

@router.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)) -> AskResponse:
    normalized_question = _normalize_question(request.question)
    cached_result = await db.execute(
        select(QACache).where(
            QACache.normalized_question == normalized_question,
            QACache.subject == request.subject,
            QACache.class_level == current_student.class_level,
        )
    )
    cache_entry = cached_result.scalar_one_or_none()

    if cache_entry:
        cache_entry.hit_count += 1
        db.add(cache_entry)

        chat_session = ChatSession(
            student_id=current_student.id,
            question=request.question,
            answer=cache_entry.answer,
            subject=request.subject,
            topic="",
            class_level=current_student.class_level,
        )
        db.add(chat_session)
        await db.commit()
        await db.refresh(chat_session)

        try:
            cached_sources = json.loads(cache_entry.sources_json or "[]")
        except json.JSONDecodeError:
            cached_sources = []

        if not cached_sources:
            cached_sources = [f"cached:{cache_entry.source_type}"]

        return AskResponse(answer=cache_entry.answer, sources=cached_sources, confidence=0.97, session_id=chat_session.id)

    weak_result = await db.execute(select(WeakTopic.topic).where(WeakTopic.student_id == current_student.id))
    weak_topics = [row[0] for row in weak_result.all()]
    answer, sources, answer_source = await run_rag(current_student, request.subject, request.question, weak_topics)

    existing_cache_result = await db.execute(
        select(QACache).where(
            QACache.normalized_question == normalized_question,
            QACache.subject == request.subject,
            QACache.class_level == current_student.class_level,
        )
    )
    existing_cache = existing_cache_result.scalar_one_or_none()

    if existing_cache:
        existing_cache.answer = answer
        existing_cache.source_type = answer_source
        existing_cache.sources_json = json.dumps(sources, ensure_ascii=False)
        existing_cache.hit_count += 1
        db.add(existing_cache)
    else:
        db.add(
            QACache(
                normalized_question=normalized_question,
                original_question=request.question,
                answer=answer,
                subject=request.subject,
                class_level=current_student.class_level,
                source_type=answer_source,
                sources_json=json.dumps(sources, ensure_ascii=False),
                hit_count=1,
            )
        )

    chat_session = ChatSession(
        student_id=current_student.id,
        question=request.question,
        answer=answer,
        subject=request.subject,
        topic="",
        class_level=current_student.class_level,
    )
    db.add(chat_session)
    await db.commit()
    await db.refresh(chat_session)
    confidence = 0.95 if answer_source == "groq" else 0.9
    return AskResponse(answer=answer, sources=sources, confidence=confidence, session_id=chat_session.id)

@router.post("/feedback")
async def feedback(request: FeedbackRequest, current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).where(ChatSession.id == request.session_id, ChatSession.student_id == current_student.id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if not request.understood:
        weak_topic = WeakTopic(
            student_id=current_student.id,
            subject=session.subject,
            topic=session.topic or "General",
        )
        db.add(weak_topic)
        await db.commit()
    return {"success": True}

@router.get("/history")
async def history(current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).where(ChatSession.student_id == current_student.id).order_by(ChatSession.created_at.desc()).limit(20))
    sessions = result.scalars().all()
    return [
        {
            "id": session.id,
            "question": session.question,
            "answer": session.answer,
            "subject": session.subject,
            "created_at": session.created_at.isoformat(),
        }
        for session in sessions
    ]
