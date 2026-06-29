import json
import os
import re
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field

from backend.config import settings
from backend.services.rag import _is_chapter_style_question, format_unit_selection_answer, get_unit_options, run_rag

router = APIRouter()
security = HTTPBearer(auto_error=False)

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
    def __init__(self, student_id: str, class_level: str = "10", medium: str = "Hindi") -> None:
        self.id = student_id
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


def _feedback_log_path(student_id: str, session_id: int) -> str:
    safe_student_id = re.sub(r"[^a-zA-Z0-9_.-]", "_", str(student_id or "guest"))
    feedback_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "feedback_logs"))
    os.makedirs(feedback_dir, exist_ok=True)
    return os.path.join(feedback_dir, f"session_{safe_student_id}_{session_id}.json")


def _record_feedback(session: dict, current_student, understood: bool) -> None:
    entry = {
        "feedback_id": f"{current_student.id}_{session['id']}",
        "session_id": session["id"],
        "student_id": current_student.id,
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


async def get_current_student_or_guest(
    token: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> SimpleStudent:
    if token and token.credentials:
        try:
            payload = jwt.decode(token.credentials, settings.jwt_secret, algorithms=["HS256"])
            student_id = payload.get("sub")
            if student_id:
                return SimpleStudent(student_id=student_id)
        except JWTError:
            pass

    return SimpleStudent(student_id="guest")


@router.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, current_student=Depends(get_current_student_or_guest)) -> AskResponse:
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

    normalized_question = _normalize_question(effective_question)
    chapter_options = get_unit_options(effective_subject, effective_question, current_student.class_level)
    if chapter_options:
        created_at = datetime.utcnow().isoformat()
        in_memory_store["pending_chapter_options"][current_student.id] = chapter_options
        unit = chapter_options[0]["section"].split(".", 1)[0]
        option_subject = chapter_options[0].get("subject", effective_subject)
        answer = format_unit_selection_answer(option_subject, unit, chapter_options)
        session_id = in_memory_store["next_session_id"]
        in_memory_store["next_session_id"] += 1
        in_memory_store["sessions"].append(
            {
                "id": session_id,
                "student_id": current_student.id,
                "question": request.question,
                "answer": answer,
                "subject": effective_subject,
                "topic": "",
                "class_level": current_student.class_level,
                "source_type": "chapter_options",
                "confidence": 1.0,
                "answer_style": request.answer_style,
                "created_at": created_at,
            }
        )
        return AskResponse(
            answer=answer,
            sources=[],
            confidence=1.0,
            session_id=session_id,
            chapter_options=chapter_options,
        )

    cache_key = (normalized_question, effective_subject, current_student.class_level, request.answer_style)
    chapter_request = _is_chapter_style_question(effective_question)
    cached_entry = None if chapter_request else in_memory_store["caches"].get(cache_key)

    if cached_entry:
        created_at = datetime.utcnow().isoformat()
        session_id = in_memory_store["next_session_id"]
        in_memory_store["next_session_id"] += 1
        in_memory_store["sessions"].append(
            {
                "id": session_id,
                "student_id": current_student.id,
                "question": request.question,
                "answer": cached_entry["answer"],
                "subject": effective_subject,
                "topic": "",
                "class_level": current_student.class_level,
                "source_type": cached_entry.get("source_type", "cache"),
                "confidence": 0.97,
                "answer_style": request.answer_style,
                "created_at": created_at,
            }
        )
        return AskResponse(answer=cached_entry["answer"], sources=cached_entry.get("sources", []), confidence=0.97, session_id=session_id)

    weak_topics = in_memory_store["weak_topics"].get(current_student.id, [])
    answer, sources, answer_source = await run_rag(
        current_student,
        effective_subject,
        effective_question,
        weak_topics,
        answer_style=request.answer_style,
    )

    if not chapter_request and _is_cacheable_answer_source(answer_source) and sources:
        in_memory_store["caches"][cache_key] = {
            "answer": answer,
            "sources": sources,
            "source_type": answer_source,
        }

    session_id = in_memory_store["next_session_id"]
    in_memory_store["next_session_id"] += 1
    confidence = 0.95 if answer_source == "groq" else 0.9
    created_at = datetime.utcnow().isoformat()
    in_memory_store["sessions"].append(
        {
            "id": session_id,
            "student_id": current_student.id,
            "question": request.question,
            "answer": answer,
            "subject": effective_subject,
            "topic": "",
            "class_level": current_student.class_level,
            "source_type": answer_source,
            "confidence": confidence,
            "answer_style": request.answer_style,
            "created_at": created_at,
        }
    )
    return AskResponse(answer=answer, sources=sources, confidence=confidence, session_id=session_id)


@router.post("/feedback")
async def feedback(request: FeedbackRequest, current_student=Depends(get_current_student_or_guest)):
    session = next((item for item in in_memory_store["sessions"] if item["id"] == request.session_id), None)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session["understood"] = request.understood
    session["feedback"] = "thumbs_up" if request.understood else "thumbs_down"
    session["feedback_at"] = datetime.utcnow().isoformat()
    _record_feedback(session, current_student, request.understood)
    if not request.understood:
        student_topics = in_memory_store["weak_topics"].setdefault(current_student.id, [])
        student_topics.append(session.get("subject", "General"))
    return {"success": True}


@router.get("/history")
async def history(current_student=Depends(get_current_student_or_guest)):
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
