"""Safe continuous-learning capture and candidate scoring."""

from __future__ import annotations

import hashlib
import json
import re

from sqlalchemy import select

from backend.models.learning_example import LearningExample


def private_student_key(student_id: str) -> str:
    return hashlib.sha256(str(student_id or "guest").encode("utf-8")).hexdigest()


def normalized_question_hash(question: str) -> str:
    normalized = re.sub(r"\s+", " ", str(question or "").strip().lower())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def redact_personal_data(text: str) -> str:
    value = str(text or "")
    value = re.sub(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", "[EMAIL]", value, flags=re.IGNORECASE)
    value = re.sub(r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)", "[PHONE]", value)
    return value


def quality_score(*, answer: str, source_type: str, sources: list[str], positive: int = 0, negative: int = 0) -> float:
    score = 0.15
    if sources:
        score += 0.30
    if source_type.startswith("rag"):
        score += 0.20
    elif source_type == "groq":
        score += 0.08
    if 80 <= len(answer.strip()) <= 5000:
        score += 0.12
    score += min(positive, 3) * 0.12
    score -= min(negative, 3) * 0.35
    return round(max(0.0, min(score, 1.0)), 3)


async def capture_interaction(db, current_student, session: dict, sources: list[str] | None = None) -> None:
    if db is None or not session.get("id"):
        return
    existing = await db.scalar(select(LearningExample).where(LearningExample.chat_session_id == int(session["id"])))
    if existing:
        return
    source_list = list(sources or session.get("sources") or [])
    answer = redact_personal_data(str(session.get("answer") or ""))
    question = redact_personal_data(str(session.get("question") or ""))
    source_type = str(session.get("source_type") or "unknown")
    db.add(LearningExample(
        chat_session_id=int(session["id"]),
        student_key=private_student_key(getattr(current_student, "id", "guest")),
        question_hash=normalized_question_hash(str(session.get("effective_question") or session.get("question") or "")),
        question=question,
        answer=answer,
        subject=str(session.get("subject") or "General"),
        class_level=str(session.get("class_level") or "10"),
        source_type=source_type,
        sources_json=json.dumps(source_list, ensure_ascii=False),
        quality_score=quality_score(answer=answer, source_type=source_type, sources=source_list),
    ))
    await db.commit()


async def apply_feedback(db, session_id: int, current_student, understood: bool) -> None:
    if db is None:
        return
    item = await db.scalar(select(LearningExample).where(
        LearningExample.chat_session_id == session_id,
        LearningExample.student_key == private_student_key(getattr(current_student, "id", "guest")),
    ))
    if not item:
        return
    if understood:
        item.positive_feedback += 1
    else:
        item.negative_feedback += 1
        item.review_status = "rejected"
        item.review_note = "Rejected automatically after negative student feedback"
    item.quality_score = quality_score(
        answer=item.answer,
        source_type=item.source_type,
        sources=json.loads(item.sources_json or "[]"),
        positive=item.positive_feedback,
        negative=item.negative_feedback,
    )
    await db.commit()
