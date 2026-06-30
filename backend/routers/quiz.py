import json
import logging
import re
from datetime import datetime
from typing import Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.models.quiz import Quiz, QuizAnswer, QuizQuestion
from backend.models.session import ChatSession
from backend.models.weak_topic import WeakTopic
from backend.routers.auth import get_current_student, get_db
from backend.routers.chat import _ensure_db_student

router = APIRouter()
logger = logging.getLogger(__name__)


class QuizGenerateRequest(BaseModel):
    subject: str
    chapter: Optional[str] = None
    topic: Optional[str] = None
    source_session_id: Optional[int] = None
    source_question: Optional[str] = None
    source_answer: Optional[str] = None
    quiz_type: str = "activity"
    count: int = Field(default=2, ge=2, le=10)


class QuizSubmitRequest(BaseModel):
    answers: dict[int, int | None] = Field(default_factory=dict)


def _strip_markdown(text: str) -> str:
    cleaned = re.sub(r"`{1,3}.*?`{1,3}", " ", text or "", flags=re.DOTALL)
    cleaned = re.sub(r"[*_#>\-•]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def _sentence_candidates(text: str) -> list[str]:
    cleaned = _strip_markdown(text)
    pieces = re.split(r"(?<=[।.!?])\s+|\n+", cleaned)
    candidates = []
    for piece in pieces:
        piece = piece.strip(" -:;।")
        if 28 <= len(piece) <= 220 and len(piece.split()) >= 5:
            candidates.append(piece)
    if not candidates and cleaned:
        candidates.append(cleaned[:220].strip())
    return candidates


def _infer_topic_from_text(subject: str, question: str, answer: str = "") -> str:
    text = f"{question} {answer}".strip()
    patterns = [
        r"(?:chapter|अध्याय|पाठ)\s*[-:]?\s*([0-9०-९]+(?:\s*[-:]\s*[\w\u0900-\u097F ]{2,50})?)",
        r"(?:poem|कविता)\s*[-:]?\s*([\w\u0900-\u097F ]{2,60})",
        r"(?:topic|विषय)\s*[-:]?\s*([\w\u0900-\u097F ]{2,60})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip(" .।:-")
    words = [word.strip(".,?।:;()[]") for word in re.split(r"\s+", question) if len(word.strip(".,?।:;()[]")) > 3]
    return " ".join(words[:8]) or subject or "General"


def _clean_json_payload(text: str) -> str:
    cleaned = (text or "").strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _normalize_mcqs(items: list[dict], count: int) -> list[dict]:
    normalized = []
    for item in items:
        prompt = str(item.get("question") or item.get("prompt") or "").strip()
        options = item.get("options") or []
        if not prompt or not isinstance(options, list) or len(options) < 4:
            continue
        answer_index = item.get("answer_index", item.get("correct_option", 0))
        try:
            answer_index = int(answer_index)
        except (TypeError, ValueError):
            answer_index = 0
        answer_index = min(max(answer_index, 0), 3)
        normalized.append(
            {
                "prompt": prompt,
                "options": [str(option).strip() for option in options[:4]],
                "correct_option": answer_index,
                "explanation": str(item.get("explanation") or "उत्तर इसी अवधारणा पर आधारित है।").strip(),
                "difficulty": str(item.get("difficulty") or "medium").strip()[:20] or "medium",
            }
        )
        if len(normalized) >= count:
            break
    return normalized


def _fallback_mcqs(subject: str, topic: str, source_question: str, source_answer: str, count: int) -> list[dict]:
    topic_label = topic or subject or "इस topic"
    use_english = not re.search(r"[\u0900-\u097f]", f"{source_question} {source_answer}")
    statements = _sentence_candidates(source_answer)
    question_hint = _strip_markdown(source_question)[:160]
    mcqs = []
    for index, statement in enumerate(statements[:count]):
        if use_english:
            options = [
                statement,
                f"This is not related to {topic_label}.",
                "The answer only mentions the exam date.",
                "The answer says the opposite of this point.",
            ]
        else:
            options = [
                statement,
                f"{topic_label} का इस उत्तर से कोई संबंध नहीं है।",
                "उत्तर में केवल परीक्षा की तारीख बताई गई है।",
                "दिए गए उत्तर में इस बात का उल्टा कहा गया है।",
            ]
        rotation = index % 4
        rotated = options[rotation:] + options[:rotation]
        mcqs.append(
            {
                "prompt": (
                    f"Choose the correct statement based on the answer: {question_hint or topic_label}"
                    if use_english
                    else f"दिए गए उत्तर के आधार पर सही कथन चुनिए: {question_hint or topic_label}"
                ),
                "options": rotated,
                "correct_option": rotated.index(statement),
                "explanation": (
                    f"This point was explained in the answer for {topic_label}."
                    if use_english
                    else f"यह बात इसी उत्तर में {topic_label} के संदर्भ में समझाई गई है।"
                ),
                "difficulty": "medium",
            }
        )
    while len(mcqs) < count:
        if use_english:
            mcqs.append(
                {
                    "prompt": f"What was the main basis of the answer about {topic_label}?",
                    "options": [
                        "The main concept explained in the answer",
                        "Information from another subject",
                        "Only the page number",
                        "Unrelated general advice",
                    ],
                    "correct_option": 0,
                    "explanation": "This MCQ checks understanding of the answer just given.",
                    "difficulty": "easy",
                }
            )
        else:
            mcqs.append(
                {
                    "prompt": f"{topic_label} पर आपके पूछे गए प्रश्न के उत्तर का मुख्य आधार क्या था?",
                    "options": [
                        "ऊपर दिए गए उत्तर की मुख्य अवधारणा",
                        "अलग विषय की जानकारी",
                        "केवल पृष्ठ संख्या",
                        "असंबंधित सामान्य सलाह",
                    ],
                    "correct_option": 0,
                    "explanation": "यह MCQ उसी उत्तर की समझ जांचता है जो अभी दिया गया था।",
                    "difficulty": "easy",
                }
            )
    return mcqs[:count]


def _generate_mcqs_with_llm(
    subject: str,
    topic: str,
    source_question: str,
    source_answer: str,
    student_context: str,
    count: int,
) -> list[dict]:
    if not settings.groq_api_key:
        return []

    prompt = (
        "Create only MCQ quiz questions for one specific Class 10 student's latest learning activity. "
        "Return strict JSON array, no markdown. Each item must have: "
        "question, options as 4 strings, answer_index as 0-3, explanation, difficulty. "
        "Every MCQ must be based directly on the student's question and the answer just given. "
        "Do not create generic study habit questions. Do not ask short-answer questions. "
        "Personalize difficulty using the student's weak topics and recent quiz performance. "
        "Use English if the student's question is in English. Use Hindi/Hinglish if the source is Hindi. Keep questions exam-friendly.\n\n"
        f"Subject: {subject}\n"
        f"Topic/Chapter: {topic}\n"
        f"Number of MCQs: {count}\n"
        f"Student learning context:\n{student_context[:1200]}\n\n"
        f"Student question:\n{source_question[:1200]}\n\n"
        f"Answer just given:\n{source_answer[:3000]}"
    )
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.groq_model,
                "messages": [
                    {"role": "system", "content": "You create accurate school MCQs and return only valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 1200,
            },
            timeout=35,
        )
        if response.status_code != 200:
            return []
        content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        parsed = json.loads(_clean_json_payload(content))
        if not isinstance(parsed, list):
            return []
        return _normalize_mcqs(parsed, count)
    except Exception:
        logger.exception("Quiz MCQ generation failed")
        return []


def _question_payload(question: QuizQuestion, reveal: bool = False) -> dict:
    payload = {
        "id": question.id,
        "prompt": question.prompt,
        "options": json.loads(question.options_json),
        "topic": question.topic,
        "difficulty": question.difficulty,
    }
    if reveal:
        payload["correct_option"] = question.correct_option
        payload["explanation"] = question.explanation
    return payload


async def _load_source_text(db: AsyncSession | None, payload: QuizGenerateRequest) -> tuple[str, str, str, str]:
    source_question = payload.source_question or ""
    source_answer = payload.source_answer or ""
    topic = payload.topic or payload.chapter or payload.subject
    if db is not None and payload.source_session_id:
        result = await db.execute(select(ChatSession).where(ChatSession.id == payload.source_session_id))
        session = result.scalars().first()
        if session:
            source_question = source_question or session.question
            source_answer = source_answer or session.answer
            topic = payload.topic or session.topic or payload.chapter or _infer_topic_from_text(session.subject, session.question, session.answer)
    if not topic or topic == payload.subject:
        topic = _infer_topic_from_text(payload.subject, source_question, source_answer)
    source_text = "\n\n".join(part for part in [source_question, source_answer] if part).strip()
    return source_text, topic, source_question, source_answer


async def _student_learning_context(db: AsyncSession | None, student_id: str, subject: str) -> str:
    if db is None:
        return "No prior learning data available."
    weak_result = await db.execute(
        select(WeakTopic.subject, WeakTopic.topic, WeakTopic.wrong_count)
        .where(WeakTopic.student_id == student_id)
        .order_by(WeakTopic.wrong_count.desc())
        .limit(5)
    )
    weak_topics = [
        f"{subject_name}: {topic} ({wrong_count} wrong)"
        for subject_name, topic, wrong_count in weak_result.all()
    ]
    quiz_result = await db.execute(
        select(Quiz.subject, Quiz.topic, Quiz.correct_count, Quiz.total_questions, Quiz.status)
        .where(Quiz.student_id == student_id)
        .order_by(Quiz.created_at.desc())
        .limit(5)
    )
    quiz_rows = quiz_result.all()
    recent = [
        f"{row.subject}/{row.topic or subject}: {row.correct_count}/{row.total_questions} {row.status}"
        for row in quiz_rows
    ]
    parts = [
        f"Current subject: {subject}",
        "Weak topics: " + ("; ".join(weak_topics) if weak_topics else "none yet"),
        "Recent quizzes: " + ("; ".join(recent) if recent else "none yet"),
    ]
    return "\n".join(parts)


async def _mark_weak_topic(db: AsyncSession | None, student_id: str, subject: str, topic: str) -> None:
    if db is None:
        return
    result = await db.execute(
        select(WeakTopic).where(
            WeakTopic.student_id == student_id,
            WeakTopic.subject == subject,
            WeakTopic.topic == topic,
        )
    )
    weak_topic = result.scalars().first()
    if weak_topic:
        weak_topic.wrong_count = (weak_topic.wrong_count or 0) + 1
        weak_topic.last_seen = datetime.utcnow()
    else:
        db.add(WeakTopic(student_id=student_id, subject=subject, topic=topic))


@router.post("/generate")
async def generate_quiz(
    payload: QuizGenerateRequest,
    current_student=Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Quiz database is unavailable")

    student_id = await _ensure_db_student(db, current_student)
    source_text, topic, source_question, source_answer = await _load_source_text(db, payload)
    if len(source_text) < 40:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz needs the student's question and answer context")
    student_context = await _student_learning_context(db, student_id, payload.subject)
    mcqs = _generate_mcqs_with_llm(payload.subject, topic, source_question, source_answer, student_context, payload.count)
    if not mcqs:
        mcqs = _fallback_mcqs(payload.subject, topic, source_question, source_answer, payload.count)

    quiz = Quiz(
        student_id=student_id,
        subject=payload.subject or "General",
        chapter=payload.chapter,
        topic=topic,
        quiz_type=payload.quiz_type or "activity",
        source_session_id=payload.source_session_id,
        status="started",
        total_questions=len(mcqs),
    )
    db.add(quiz)
    await db.flush()

    questions = []
    for item in mcqs:
        question = QuizQuestion(
            quiz_id=quiz.id,
            prompt=item["prompt"],
            options_json=json.dumps(item["options"], ensure_ascii=False),
            correct_option=item["correct_option"],
            explanation=item["explanation"],
            topic=topic,
            difficulty=item["difficulty"],
        )
        db.add(question)
        await db.flush()
        questions.append(_question_payload(question))

    await db.commit()
    return {
        "quiz_id": quiz.id,
        "subject": quiz.subject,
        "chapter": quiz.chapter,
        "topic": quiz.topic,
        "quiz_type": quiz.quiz_type,
        "questions": questions,
        "can_skip": True,
    }


@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    current_student=Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Quiz database is unavailable")

    student_id = await _ensure_db_student(db, current_student)
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id, Quiz.student_id == student_id))
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    questions_result = await db.execute(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.id.asc()))
    questions = questions_result.scalars().all()
    correct_count = 0
    details = []
    for question in questions:
        selected = payload.answers.get(question.id)
        if selected is None:
            selected = payload.answers.get(str(question.id))
        is_correct = selected == question.correct_option
        if is_correct:
            correct_count += 1
        else:
            await _mark_weak_topic(db, student_id, quiz.subject, question.topic or quiz.topic or quiz.subject)
        db.add(
            QuizAnswer(
                quiz_id=quiz.id,
                question_id=question.id,
                selected_option=selected,
                is_correct=is_correct,
            )
        )
        item = _question_payload(question, reveal=True)
        item["selected_option"] = selected
        item["is_correct"] = is_correct
        details.append(item)

    quiz.correct_count = correct_count
    quiz.total_questions = len(questions)
    quiz.status = "completed"
    quiz.completed_at = datetime.utcnow()
    quiz.skipped = False
    await db.commit()

    score_percent = round((correct_count / len(questions)) * 100, 1) if questions else 0.0
    return {
        "quiz_id": quiz.id,
        "status": quiz.status,
        "correct": correct_count,
        "total": len(questions),
        "score_percent": score_percent,
        "details": details,
    }


@router.post("/{quiz_id}/skip")
async def skip_quiz(
    quiz_id: int,
    current_student=Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Quiz database is unavailable")

    student_id = await _ensure_db_student(db, current_student)
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id, Quiz.student_id == student_id))
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    quiz.status = "skipped"
    quiz.skipped = True
    quiz.completed_at = datetime.utcnow()
    await db.commit()
    return {"quiz_id": quiz.id, "status": "skipped"}


@router.get("/summary")
async def quiz_summary(current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)):
    if db is None:
        return {"total": 0, "completed": 0, "avg_score": 0.0}
    student_id = await _ensure_db_student(db, current_student)
    total = await db.scalar(select(func.count()).select_from(Quiz).where(Quiz.student_id == student_id)) or 0
    completed = await db.scalar(select(func.count()).select_from(Quiz).where(Quiz.student_id == student_id, Quiz.status == "completed")) or 0
    avg_score = await db.scalar(
        select(func.avg((Quiz.correct_count * 100.0) / func.nullif(Quiz.total_questions, 0))).where(
            Quiz.student_id == student_id,
            Quiz.status == "completed",
        )
    ) or 0.0
    return {"total": int(total), "completed": int(completed), "avg_score": round(float(avg_score), 1)}
