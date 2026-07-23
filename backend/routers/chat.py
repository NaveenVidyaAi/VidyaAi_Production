import json
import logging
import os
import re
import hashlib
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy import select

from backend.config import settings
from backend.models.qa_cache import QACache
from backend.models.session import ChatSession
from backend.models.student import Student as StudentModel
from backend.models.weak_topic import WeakTopic
from backend.routers.auth import get_db
from backend.services.rag import (
    _is_chapter_style_question,
    format_unit_selection_answer,
    get_unit_options,
    interpret_student_prompt,
    run_rag,
)
from backend.services.learning_loop import apply_feedback, capture_interaction

router = APIRouter()
security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)

in_memory_store = {
    "caches": {},
    "sessions": [],
    "weak_topics": {},
    "pending_chapter_options": {},
    "next_session_id": 1,
}


class AskRequest(BaseModel):
    question: str
    subject: str
    answer_style: str = "exam"


class AskResponse(BaseModel):
    answer: str
    sources: list[str]
    confidence: float
    session_id: int
    chapter_options: list[dict[str, str]] = Field(default_factory=list)


class FeedbackRequest(BaseModel):
    session_id: int
    understood: bool


class SimpleStudent:
    def __init__(
        self,
        student_id: str,
        name: str = "Guest",
        email: str = "guest@vidyaai.local",
        class_level: str = "10",
        medium: str = "Hindi",
    ) -> None:
        self.id = student_id
        self.name = name
        self.email = email
        self.class_level = class_level
        self.medium = medium


def _normalize_question(question: str) -> str:
    normalized = re.sub(r"\s+", " ", (question or "").strip().lower())
    normalized = re.sub(r"[^\w\s\u0900-\u097f?.,!-]", "", normalized)
    return normalized[:550]


def _extract_bare_section(question: str) -> str | None:
    match = re.fullmatch(r"\s*(\d{1,2})\s*[.\-]\s*(\d{1,2})\s*", question or "")
    if match:
        return f"{match.group(1)}.{match.group(2)}"
    return None


def _is_cacheable_answer_source(answer_source: str) -> bool:
    return answer_source in {"groq", "fallback-topic-guard"} or answer_source.startswith("rag")


def _answer_confidence(answer_source: str, sources: list[str], prompt_confidence: float) -> float:
    """Report evidence-aware confidence instead of treating every fluent answer as certain."""
    if answer_source == "safe-mode":
        return 0.35
    if sources and (answer_source.startswith("rag") or answer_source == "fallback-topic-guard"):
        evidence_confidence = 0.94
    elif answer_source in {"math-direct", "fallback-topic-guard"}:
        evidence_confidence = 0.9
    elif answer_source == "groq":
        evidence_confidence = 0.72
    else:
        evidence_confidence = 0.58
    return round(min(evidence_confidence, max(0.0, prompt_confidence)), 2)


def _recent_student_history(student_id: str, limit: int = 2) -> list[dict[str, str]]:
    student_sessions = [
        item
        for item in in_memory_store["sessions"]
        if item.get("student_id") == student_id and item.get("answer")
    ]
    recent_sessions = sorted(student_sessions, key=lambda item: item["id"], reverse=True)[:limit]
    return [
        {
            "question": str(session.get("effective_question") or session.get("question", "")),
            "answer": str(session.get("answer", "")),
            "subject": str(session.get("subject", "")),
        }
        for session in reversed(recent_sessions)
    ]


def _history_for_question(student_id: str, question: str, limit: int = 2) -> list[dict[str, str]]:
    normalized_question = _normalize_question(question)
    return [
        item
        for item in _recent_student_history(student_id, limit=limit + 2)
        if _normalize_question(item.get("question", "")) != normalized_question
    ][-limit:]


def _is_followup_reference(question: str) -> bool:
    normalized = re.sub(r"\s+", " ", (question or "").strip().lower())
    return bool(
        re.search(
            r"\b(this|same|that)\s+(chapter|lesson|poem|story|topic)\b"
            r"|\b(is|iss|us|usi)\s+(chapter|lesson|poem|story|topic|adhyay|path)\b"
            r"|इस\s+(अध्याय|पाठ|कविता|कहानी|विषय)"
            r"|इसी\s+(अध्याय|पाठ|कविता|कहानी|विषय)",
            normalized,
        )
    )


def _contextualize_followup_question(question: str, recent_history: list[dict[str, str]]) -> str:
    if not recent_history or not _is_followup_reference(question):
        return question

    previous = recent_history[-1]
    previous_question = str(previous.get("question", "")).strip()
    previous_subject = str(previous.get("subject", "")).strip()
    if not previous_question:
        return question

    subject_prefix = f"Previous subject: {previous_subject}\n" if previous_subject else ""
    return (
        f"{subject_prefix}"
        f"Previous chapter/topic question: {previous_question}\n"
        f"Follow-up request: {question}"
    )


def _subject_for_contextual_followup(question: str, selected_subject: str, recent_history: list[dict[str, str]]) -> str:
    """Carry subject context only for clearly incomplete follow-up prompts."""
    if (selected_subject or "").strip().lower() not in {"", "general"} or not recent_history:
        return selected_subject
    normalized = re.sub(r"\s+", " ", (question or "").strip().lower())
    contextual = bool(
        _is_followup_reference(question)
        or re.search(r"\b(?:adhyay|chapter|lesson|unit|path)\s+(?:pahla|pehla|pahila|first|one|dusra|doosra|second|two|tisra|teesra|third|three)\b", normalized)
        or re.search(r"(?:अध्याय|पाठ)\s*(?:पहला|प्रथम|दूसरा|द्वितीय|तीसरा|तृतीय)", normalized)
    )
    previous_subject = str(recent_history[-1].get("subject", "")).strip()
    return previous_subject if contextual and previous_subject else selected_subject


def _clarification_for_prompt(question: str, subject: str, recent_history: list[dict[str, str]]) -> str | None:
    """Refuse to guess when LLM/retrieval cannot safely resolve a short prompt."""
    normalized = re.sub(r"\s+", " ", (question or "").strip().lower())
    if re.fullmatch(r"(?:maths?|mathematics|ganit|गणित)\s*(?:ka|ki|ke|का|की|के)?[?.!]*", normalized):
        return "गणित में कौन-सा विषय समझना है? उदाहरण: **बहुपद**, **द्विघात समीकरण**, या अपना पूरा प्रश्न लिखें।"
    if re.search(r"\benglish\b", normalized) and re.search(r"\bpoem\b", normalized) and re.search(r"\b(?:summary|theme)\b", normalized):
        has_identity = bool(re.search(r"\b(?:chapter|lesson|reading)\s*[\d-]|\b(?:title|named|called)\b", normalized))
        if not has_identity:
            return "कृपया English poem का **नाम या chapter/reading number** लिखें। मैं बिना कविता पहचाने गलत summary या theme नहीं दूँगा।"
    vague_chapter = bool(re.fullmatch(r"(?:adhyay|chapter|lesson|unit|path|अध्याय|पाठ)(?:\s+\w+){0,2}[?.!]*", normalized))
    if vague_chapter and (subject or "").strip().lower() in {"", "general"} and not recent_history:
        return "कृपया विषय और अध्याय स्पष्ट करें—जैसे **Class 10 English Chapter 1** या **कक्षा 10 हिंदी अध्याय 1**।"
    return None


def _clarification_from_interpretation(interpretation: dict) -> str | None:
    if not interpretation.get("needs_clarification"):
        return None
    model_question = str(interpretation.get("clarification_question", "")).strip()
    if model_question:
        return model_question
    subject = str(interpretation.get("subject", "General"))
    if subject != "General":
        return f"आप **{subject}** में क्या समझना चाहते हैं? कृपया topic, chapter number/name, या पूरा प्रश्न लिखें।"
    return "मैं आपका प्रश्न ठीक से समझ नहीं पाया। कृपया **विषय और पूरा सवाल** दोबारा लिखें—जैसे: ‘Class 10 Maths में बहुपद समझाइए’।"


def _feedback_log_path(student_id: str, session_id: int) -> str:
    safe_student_id = re.sub(r"[^a-zA-Z0-9_.-]", "_", str(student_id or "guest"))
    feedback_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "feedback_logs"))
    os.makedirs(feedback_dir, exist_ok=True)
    return os.path.join(feedback_dir, f"session_{safe_student_id}_{session_id}.json")


def _record_feedback(session: dict, current_student, understood: bool) -> None:
    feedback_student_id = str(session.get("db_student_id") or session.get("student_id") or current_student.id)
    entry = {
        "feedback_id": f"{feedback_student_id}_{session['id']}",
        "session_id": session["id"],
        "student_id": feedback_student_id,
        "question": session.get("question", ""),
        "answer": session.get("answer", ""),
        "subject": session.get("subject", "General"),
        "class_level": session.get("class_level", "10"),
        "source": session.get("source_type", "unknown"),
        "confidence": session.get("confidence", 0.0),
        "useful": bool(understood),
        "feedback": "thumbs_up" if understood else "thumbs_down",
        "feedback_timestamp": datetime.utcnow().isoformat(),
    }
    with open(_feedback_log_path(current_student.id, session["id"]), "w", encoding="utf-8") as feedback_file:
        json.dump(entry, feedback_file, ensure_ascii=False, indent=2)


def _db_student_id_for(raw_id: str) -> str:
    raw_id = str(raw_id or "guest")
    if len(raw_id) <= 36:
        return raw_id
    return f"u_{hashlib.sha1(raw_id.encode('utf-8')).hexdigest()[:32]}"


async def _lookup_db_student_id(db, current_student) -> str | None:
    if db is None:
        return None

    email = str(getattr(current_student, "email", "") or getattr(current_student, "id", "") or "guest@vidyaai.local")
    raw_id = str(getattr(current_student, "id", "") or email)
    safe_id = _db_student_id_for(raw_id)

    result = await db.execute(select(StudentModel).where(StudentModel.email == email))
    student = result.scalars().first()
    if student:
        return student.id

    result = await db.execute(select(StudentModel).where(StudentModel.id == safe_id))
    student = result.scalars().first()
    return student.id if student else None


async def _ensure_db_student(db, current_student) -> str | None:
    if db is None:
        return None

    email = str(getattr(current_student, "email", "") or getattr(current_student, "id", "") or "guest@vidyaai.local")
    name = str(getattr(current_student, "name", "") or email.split("@", 1)[0] or "Guest")
    raw_id = str(getattr(current_student, "id", "") or email)
    safe_id = _db_student_id_for(raw_id)

    existing_id = await _lookup_db_student_id(db, current_student)
    if existing_id:
        return existing_id

    student = StudentModel(
        id=safe_id,
        name=name,
        email=email,
        password_hash="",
        class_level=str(getattr(current_student, "class_level", "10") or "10"),
        medium=str(getattr(current_student, "medium", "Hindi") or "Hindi"),
    )
    db.add(student)
    await db.flush()
    return student.id


async def _recent_student_history_from_db(db, current_student, question: str, limit: int = 2) -> list[dict[str, str]]:
    if db is None:
        return []

    try:
        db_student_id = await _lookup_db_student_id(db, current_student)
        if not db_student_id:
            return []

        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.student_id == db_student_id)
            .order_by(ChatSession.created_at.desc(), ChatSession.id.desc())
            .limit(limit + 2)
        )
        normalized_question = _normalize_question(question)
        sessions = []
        for session in result.scalars().all():
            if _normalize_question(session.question) == normalized_question:
                continue
            sessions.append(
                {
                    "question": session.question,
                    "answer": session.answer,
                    "subject": session.subject,
                }
            )
        return list(reversed(sessions[:limit]))
    except Exception:
        await db.rollback()
        logger.exception("Failed to load recent chat history from database")
        return []


async def _persist_chat_session(db, current_student, session: dict) -> int | None:
    if db is None:
        return None

    try:
        db_student_id = await _ensure_db_student(db, current_student)
        if not db_student_id:
            return None
        session["db_student_id"] = db_student_id

        db_session = ChatSession(
            student_id=db_student_id,
            question=str(session.get("question", "")),
            answer=str(session.get("answer", "")),
            subject=str(session.get("subject", "General") or "General"),
            topic=str(session.get("topic", "") or ""),
            class_level=str(session.get("class_level", "10") or "10"),
        )
        db.add(db_session)
        await db.flush()
        await db.commit()
        return int(db_session.id)
    except Exception:
        await db.rollback()
        logger.exception("Failed to persist chat session")
        return None


async def _persist_cache_entry(
    db,
    *,
    normalized_question: str,
    original_question: str,
    answer: str,
    subject: str,
    class_level: str,
    answer_source: str,
    sources: list[str],
) -> None:
    if db is None:
        return

    try:
        result = await db.execute(
            select(QACache).where(
                QACache.normalized_question == normalized_question,
                QACache.subject == subject,
                QACache.class_level == class_level,
            )
        )
        cache = result.scalars().first()
        if cache:
            cache.answer = answer
            cache.source_type = answer_source
            cache.sources_json = json.dumps(sources, ensure_ascii=False)
            cache.hit_count = (cache.hit_count or 0) + 1
            cache.last_used_at = datetime.utcnow()
        else:
            db.add(
                QACache(
                    normalized_question=normalized_question,
                    original_question=original_question,
                    answer=answer,
                    subject=subject,
                    class_level=class_level,
                    source_type=answer_source,
                    sources_json=json.dumps(sources, ensure_ascii=False),
                    hit_count=1,
                )
            )
        await db.commit()
    except Exception:
        await db.rollback()
        logger.exception("Failed to persist QA cache entry")


async def _persist_weak_topic(db, current_student, subject: str, topic: str) -> None:
    if db is None:
        return

    try:
        db_student_id = await _ensure_db_student(db, current_student)
        if not db_student_id:
            return

        result = await db.execute(
            select(WeakTopic).where(
                WeakTopic.student_id == db_student_id,
                WeakTopic.subject == subject,
                WeakTopic.topic == topic,
            )
        )
        weak_topic = result.scalars().first()
        if weak_topic:
            weak_topic.wrong_count = (weak_topic.wrong_count or 0) + 1
            weak_topic.last_seen = datetime.utcnow()
        else:
            db.add(WeakTopic(student_id=db_student_id, subject=subject, topic=topic))
        await db.commit()
    except Exception:
        await db.rollback()
        logger.exception("Failed to persist weak topic")


async def _store_session(db, current_student, session: dict) -> int:
    in_memory_store["sessions"].append(session)
    db_session_id = await _persist_chat_session(db, current_student, session)
    if db_session_id:
        session["id"] = db_session_id
        in_memory_store["next_session_id"] = max(in_memory_store["next_session_id"], db_session_id + 1)
    try:
        await capture_interaction(db, current_student, session)
    except Exception:
        if db is not None:
            await db.rollback()
        logger.exception("Failed to capture continuous-learning interaction")
    return int(session["id"])


async def get_current_student_or_guest(
    token: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> SimpleStudent:
    if token and token.credentials:
        try:
            payload = jwt.decode(token.credentials, settings.jwt_secret, algorithms=["HS256"])
            student_id = payload.get("sub")
            if student_id:
                email = payload.get("email") or student_id
                name = payload.get("name") or str(email).split("@", 1)[0]
                class_level = payload.get("class_level") or "10"
                medium = payload.get("medium") or "Hindi"
                return SimpleStudent(
                    student_id=str(student_id),
                    name=str(name),
                    email=str(email),
                    class_level=str(class_level),
                    medium=str(medium),
                )
        except JWTError:
            pass

    return SimpleStudent(student_id="guest")


@router.post("/ask", response_model=AskResponse)
async def ask(
    request: AskRequest,
    current_student=Depends(get_current_student_or_guest),
    db=Depends(get_db),
) -> AskResponse:
    effective_question = request.question
    effective_subject = request.subject
    bare_section = _extract_bare_section(request.question)
    pending_options = in_memory_store["pending_chapter_options"].get(current_student.id, [])
    if bare_section:
        selected_option = next((option for option in pending_options if option.get("section") == bare_section), None)
        if selected_option:
            effective_question = selected_option.get("prompt") or f"class 10 {selected_option.get('subject', request.subject)} chapter {bare_section}"
            effective_subject = selected_option.get("subject") or request.subject
            in_memory_store["pending_chapter_options"].pop(current_student.id, None)

    recent_history = await _recent_student_history_from_db(db, current_student, effective_question)
    if not recent_history:
        recent_history = _history_for_question(current_student.id, effective_question)
    effective_subject = _subject_for_contextual_followup(effective_question, effective_subject, recent_history)

    interpretation = interpret_student_prompt(
        effective_question,
        effective_subject,
        current_student.class_level,
        recent_history,
    )
    logger.info(
        "Prompt interpreted source=%s subject=%s intent=%s confidence=%.2f clarify=%s",
        interpretation.get("source"),
        interpretation.get("subject"),
        interpretation.get("intent"),
        float(interpretation.get("confidence", 0.0)),
        interpretation.get("needs_clarification"),
    )
    effective_subject = str(interpretation.get("subject") or effective_subject)
    if not interpretation.get("needs_clarification"):
        effective_question = str(interpretation.get("normalized_prompt") or effective_question)

    chapter_options = get_unit_options(effective_subject, effective_question, current_student.class_level)
    if chapter_options:
        created_at = datetime.utcnow().isoformat()
        in_memory_store["pending_chapter_options"][current_student.id] = chapter_options
        unit = chapter_options[0]["section"].split(".", 1)[0]
        option_subject = chapter_options[0].get("subject", effective_subject)
        answer = format_unit_selection_answer(option_subject, unit, chapter_options)
        session_id = in_memory_store["next_session_id"]
        in_memory_store["next_session_id"] += 1
        session = {
            "id": session_id,
            "student_id": current_student.id,
            "question": request.question,
            "answer": answer,
            "subject": effective_subject,
            "topic": "",
            "class_level": current_student.class_level,
            "source_type": "chapter_options",
            "sources": [],
            "confidence": 1.0,
            "answer_style": request.answer_style,
            "prompt_interpretation": interpretation,
            "created_at": created_at,
        }
        session_id = await _store_session(db, current_student, session)
        return AskResponse(
            answer=answer,
            sources=[],
            confidence=1.0,
            session_id=session_id,
            chapter_options=chapter_options,
        )

    clarification = _clarification_from_interpretation(interpretation) or _clarification_for_prompt(
        effective_question, effective_subject, recent_history
    )
    if clarification:
        created_at = datetime.utcnow().isoformat()
        session_id = in_memory_store["next_session_id"]
        in_memory_store["next_session_id"] += 1
        session = {
            "id": session_id,
            "student_id": current_student.id,
            "question": request.question,
            "answer": clarification,
            "subject": effective_subject,
            "topic": "",
            "class_level": current_student.class_level,
            "source_type": "clarification",
            "sources": [],
            "confidence": 1.0,
            "answer_style": request.answer_style,
            "prompt_interpretation": interpretation,
            "created_at": created_at,
        }
        session_id = await _store_session(db, current_student, session)
        return AskResponse(answer=clarification, sources=[], confidence=1.0, session_id=session_id)

    effective_question = _contextualize_followup_question(effective_question, recent_history)
    normalized_question = _normalize_question(effective_question)
    history_signature = tuple(
        _normalize_question(item.get("question", "")) for item in recent_history
    )
    cache_key = (
        normalized_question,
        effective_subject,
        current_student.class_level,
        request.answer_style,
        history_signature,
    )
    chapter_request = _is_chapter_style_question(effective_question)
    cached_entry = None if chapter_request else in_memory_store["caches"].get(cache_key)

    if cached_entry:
        created_at = datetime.utcnow().isoformat()
        session_id = in_memory_store["next_session_id"]
        in_memory_store["next_session_id"] += 1
        session = {
            "id": session_id,
            "student_id": current_student.id,
            "question": request.question,
            "effective_question": effective_question,
            "answer": cached_entry["answer"],
            "subject": effective_subject,
            "topic": "",
            "class_level": current_student.class_level,
            "source_type": cached_entry.get("source_type", "cache"),
            "sources": cached_entry.get("sources", []),
            "confidence": 0.97,
            "answer_style": request.answer_style,
            "created_at": created_at,
        }
        session_id = await _store_session(db, current_student, session)
        await _persist_cache_entry(
            db,
            normalized_question=normalized_question,
            original_question=request.question,
            answer=cached_entry["answer"],
            subject=effective_subject,
            class_level=current_student.class_level,
            answer_source=cached_entry.get("source_type", "cache"),
            sources=cached_entry.get("sources", []),
        )
        return AskResponse(answer=cached_entry["answer"], sources=cached_entry.get("sources", []), confidence=0.97, session_id=session_id)

    weak_topics = in_memory_store["weak_topics"].get(current_student.id, [])
    answer, sources, answer_source = await run_rag(
        current_student,
        effective_subject,
        effective_question,
        weak_topics,
        answer_style=request.answer_style,
        recent_history=recent_history,
        prompt_confidence=float(interpretation.get("confidence", 0.0)),
    )

    if not chapter_request and _is_cacheable_answer_source(answer_source) and sources:
        in_memory_store["caches"][cache_key] = {
            "answer": answer,
            "sources": sources,
            "source_type": answer_source,
        }
        await _persist_cache_entry(
            db,
            normalized_question=normalized_question,
            original_question=request.question,
            answer=answer,
            subject=effective_subject,
            class_level=current_student.class_level,
            answer_source=answer_source,
            sources=sources,
        )

    session_id = in_memory_store["next_session_id"]
    in_memory_store["next_session_id"] += 1
    confidence = _answer_confidence(
        answer_source,
        sources,
        float(interpretation.get("confidence", 0.0)),
    )
    created_at = datetime.utcnow().isoformat()
    session = {
        "id": session_id,
        "student_id": current_student.id,
        "question": request.question,
        "effective_question": effective_question,
        "answer": answer,
        "subject": effective_subject,
        "topic": "",
        "class_level": current_student.class_level,
        "source_type": answer_source,
        "sources": sources,
        "confidence": confidence,
        "answer_style": request.answer_style,
        "prompt_interpretation": interpretation,
        "created_at": created_at,
    }
    session_id = await _store_session(db, current_student, session)
    return AskResponse(answer=answer, sources=sources, confidence=confidence, session_id=session_id)


@router.post("/feedback")
async def feedback(
    request: FeedbackRequest,
    current_student=Depends(get_current_student_or_guest),
    db=Depends(get_db),
):
    session = next((item for item in in_memory_store["sessions"] if item["id"] == request.session_id), None)
    if not session:
        db_session = None
        if db is not None:
            result = await db.execute(select(ChatSession).where(ChatSession.id == request.session_id))
            db_session = result.scalars().first()
        if not db_session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        session = {
            "id": db_session.id,
            "student_id": current_student.id,
            "question": db_session.question,
            "answer": db_session.answer,
            "subject": db_session.subject,
            "topic": db_session.topic or "",
            "class_level": db_session.class_level,
            "source_type": "database",
            "confidence": 0.0,
            "created_at": db_session.created_at.isoformat() if db_session.created_at else datetime.utcnow().isoformat(),
        }
    session["understood"] = request.understood
    session["feedback"] = "thumbs_up" if request.understood else "thumbs_down"
    session["feedback_at"] = datetime.utcnow().isoformat()
    _record_feedback(session, current_student, request.understood)
    try:
        await apply_feedback(db, int(request.session_id), current_student, request.understood)
    except Exception:
        if db is not None:
            await db.rollback()
        logger.exception("Failed to update continuous-learning feedback")
    if not request.understood:
        student_topics = in_memory_store["weak_topics"].setdefault(current_student.id, [])
        weak_subject = session.get("subject", "General")
        student_topics.append(weak_subject)
        await _persist_weak_topic(db, current_student, weak_subject, session.get("topic") or weak_subject)
    return {"success": True}


@router.get("/history")
async def history(current_student=Depends(get_current_student_or_guest), db=Depends(get_db)):
    if db is not None:
        try:
            db_student_id = await _lookup_db_student_id(db, current_student)
            if db_student_id:
                result = await db.execute(
                    select(ChatSession)
                    .where(ChatSession.student_id == db_student_id)
                    .order_by(ChatSession.created_at.desc(), ChatSession.id.desc())
                    .limit(20)
                )
                sessions = result.scalars().all()
                if sessions:
                    return [
                        {
                            "id": session.id,
                            "question": session.question,
                            "answer": session.answer,
                            "subject": session.subject,
                            "created_at": session.created_at.isoformat() if session.created_at else "now",
                        }
                        for session in sessions
                    ]
        except Exception:
            await db.rollback()
            logger.exception("Failed to load chat history from database")

    student_sessions = [
        item for item in in_memory_store["sessions"] if item["student_id"] == current_student.id
    ]
    return [
        {
            "id": session["id"],
            "question": session["question"],
            "answer": session["answer"],
            "subject": session["subject"],
            "created_at": session.get("created_at") or "now",
        }
        for session in sorted(student_sessions, key=lambda item: item["id"], reverse=True)[:20]
    ]
