import asyncio
import logging
import re
from typing import Literal

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.config import settings
from backend.routers.auth import get_current_student
from backend.services.rag import _retrieval_match_is_strong, _retrieve_context

router = APIRouter()
logger = logging.getLogger(__name__)


class CurriculumRequest(BaseModel):
    class_level: str = Field(min_length=1, max_length=5)
    subject: str = Field(min_length=2, max_length=100)
    duration_weeks: int = Field(default=16, ge=1, le=52)
    periods_per_week: int = Field(default=5, ge=1, le=12)
    chapters: str = Field(default="", max_length=3000)
    learning_goals: str = Field(default="", max_length=2000)
    medium: str = Field(default="Hindi", max_length=30)


class TestPaperRequest(BaseModel):
    class_level: str = Field(min_length=1, max_length=5)
    subject: str = Field(min_length=2, max_length=100)
    syllabus: str = Field(min_length=2, max_length=3000)
    total_marks: int = Field(default=50, ge=5, le=200)
    question_count: int = Field(default=20, ge=1, le=100)
    duration_minutes: int = Field(default=90, ge=10, le=360)
    difficulty: Literal["easy", "balanced", "challenging"] = "balanced"
    paper_type: Literal["unit_test", "term_exam", "practice", "worksheet"] = "unit_test"
    medium: str = Field(default="Hindi", max_length=30)
    instructions: str = Field(default="", max_length=1500)


class LessonGuideRequest(BaseModel):
    class_level: str = Field(min_length=1, max_length=5)
    subject: str = Field(min_length=2, max_length=100)
    chapter_or_topic: str = Field(min_length=2, max_length=500)
    lesson_minutes: int = Field(default=45, ge=15, le=180)
    medium: str = Field(default="Hindi", max_length=30)
    student_level: Literal["mixed", "foundation", "advanced"] = "mixed"
    teacher_notes: str = Field(default="", max_length=1500)


async def require_teacher(current_user=Depends(get_current_student)):
    if getattr(current_user, "role", "student") != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")
    return current_user


def _chapter_hint(value: str) -> str | None:
    match = re.search(r"(?:chapter|अध्याय|पाठ)?\s*(\d{1,2})", value or "", flags=re.IGNORECASE)
    return match.group(1) if match else None


def _grounding_context(
    *,
    class_level: str,
    subject: str,
    query: str,
    document_type_boosts: dict[str, float],
) -> tuple[str, list[str]]:
    try:
        rows = _retrieve_context(
            question=query,
            subject=subject,
            class_level=class_level,
            weak_topics=[],
            chapter_hint=_chapter_hint(query),
            section_hint=None,
            limit=24,
            document_type_boosts=document_type_boosts,
            strict_subject=True,
        )
    except Exception:
        logger.exception("Teacher resource retrieval failed")
        return "", []
    # Preserve evidence diversity: a paper request should see both the official
    # model pattern and curriculum scope instead of eight adjacent chunks from
    # whichever single PDF scored highest.
    selected_rows = []
    selected_ids = set()
    for document_type, boost in sorted(document_type_boosts.items(), key=lambda item: item[1], reverse=True):
        if boost <= 0:
            continue
        label_token = document_type.replace("_", " ").lower()
        match = next(
            (row for row in rows if row[1] not in selected_ids and label_token in (row[3] or "").lower()),
            None,
        )
        if match:
            selected_rows.append(match)
            selected_ids.add(match[1])
    for row in rows:
        if row[1] in selected_ids:
            continue
        selected_rows.append(row)
        selected_ids.add(row[1])
        if len(selected_rows) >= 8:
            break
    rows = selected_rows[:8]

    if not _retrieval_match_is_strong(rows, subject):
        return "", []
    blocks = [f"[Source: {row[3]}]\n{row[0]}" for row in rows]
    sources = list(dict.fromkeys(row[3] for row in rows))
    return "\n\n".join(blocks), sources


def _fallback_content(title: str, sections: list[str]) -> str:
    body = [f"# {title}", "", "> AI generation is temporarily unavailable. Use this structured draft and verify it against the textbook."]
    for section in sections:
        body.extend(["", f"## {section}", "", "- Add textbook-aligned details here.", "- Confirm learning outcomes and examples before classroom use."])
    return "\n".join(body)


def _generate_content(*, task: str, details: str, context: str, fallback: str) -> str:
    if not settings.groq_api_key:
        return fallback
    evidence_rule = (
        "Relevant CGBSE source excerpts are provided below. Use them as the factual basis and do not invent chapter facts."
        if context
        else "No strong textbook excerpt was found. Clearly label any chapter-specific detail that the teacher must verify."
    )
    prompt = f"""Create a practical teacher resource for an Indian school teacher.

TASK
{task}

TEACHER INPUTS
{details}

EVIDENCE POLICY
{evidence_rule}

TEXTBOOK CONTEXT
{context or "No verified excerpt available."}

Return polished Markdown only. Make it classroom-ready, specific, inclusive, and realistic. Use tables where they improve clarity. Do not add meta commentary about being an AI."""
    payload = {
        "model": settings.groq_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are VidyaAI Teacher Copilot, an expert curriculum planner, assessment designer, and pedagogy coach. "
                    "Align outputs to the supplied class, subject, marks, time, and medium. Never claim unverified board rules."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.25,
        "max_tokens": 3500,
    }
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=75,
        )
        if response.status_code == 200:
            content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            if content:
                return content
    except requests.RequestException:
        logger.exception("Teacher content generation failed")
    return fallback


@router.post("/curriculum")
async def create_curriculum(payload: CurriculumRequest, teacher=Depends(require_teacher)):
    query = f"Class {payload.class_level} {payload.subject} curriculum {payload.chapters} {payload.learning_goals}"
    context, sources = _grounding_context(
        class_level=payload.class_level,
        subject=payload.subject,
        query=query,
        document_type_boosts={
            "learning_outcome": 10.0,
            "curriculum": 8.0,
            "academic_calendar": 7.0,
            "textbook": 3.0,
            "model_question_paper": 1.0,
            "previous_year_question": 0.5,
        },
    )
    details = (
        f"Class: {payload.class_level}\nSubject: {payload.subject}\nMedium: {payload.medium}\n"
        f"Duration: {payload.duration_weeks} weeks\nPeriods per week: {payload.periods_per_week}\n"
        f"Chapters/syllabus: {payload.chapters or 'Teacher will map chapters later'}\n"
        f"Learning goals: {payload.learning_goals or 'Build conceptual understanding and exam readiness'}"
    )
    task = (
        "Build a curriculum plan with: overview and assumptions; measurable learning outcomes; week-wise scope and sequence; "
        "period allocation; pedagogy and activities; resources; formative and summative assessment checkpoints; "
        "differentiation/remediation; revision and buffer plan; and a final teacher checklist."
    )
    fallback = _fallback_content(
        f"Class {payload.class_level} {payload.subject} Curriculum Plan",
        ["Learning outcomes", "Week-wise plan", "Teaching strategies", "Assessment plan", "Differentiation", "Teacher checklist"],
    )
    content = await asyncio.to_thread(_generate_content, task=task, details=details, context=context, fallback=fallback)
    return {"content": content, "sources": sources, "type": "curriculum"}


@router.post("/test-paper")
async def create_test_paper(payload: TestPaperRequest, teacher=Depends(require_teacher)):
    query = f"Class {payload.class_level} {payload.subject} {payload.syllabus} important questions"
    context, sources = _grounding_context(
        class_level=payload.class_level,
        subject=payload.subject,
        query=query,
        document_type_boosts={
            "marking_scheme": 11.0,
            "assessment_blueprint": 10.0,
            "model_question_paper": 9.0,
            "answer_key": 8.0,
            "curriculum": 6.0,
            "previous_year_question": 4.0,
            "textbook": 2.0,
        },
    )
    details = (
        f"Class: {payload.class_level}\nSubject: {payload.subject}\nMedium: {payload.medium}\n"
        f"Paper type: {payload.paper_type}\nSyllabus: {payload.syllabus}\nTotal marks: {payload.total_marks}\n"
        f"Number of questions: {payload.question_count}\nTime: {payload.duration_minutes} minutes\n"
        f"Difficulty: {payload.difficulty}\nAdditional instructions: {payload.instructions or 'None'}"
    )
    task = (
        "Create a complete printable question paper. First make a blueprint table whose section marks add exactly to the requested total. "
        "Then write numbered questions matching the exact requested question count, show marks beside every question, include clear instructions "
        "and internal choice only when useful. After a separator, provide a teacher-only answer key and marking scheme. Verify both the mark total "
        "and question count before returning the paper. Use only syllabus-relevant content."
    )
    fallback = _fallback_content(
        f"Class {payload.class_level} {payload.subject} Test Paper",
        ["Paper blueprint", "General instructions", "Question paper", "Answer key", "Marking scheme", "Validation checklist"],
    )
    content = await asyncio.to_thread(_generate_content, task=task, details=details, context=context, fallback=fallback)
    return {"content": content, "sources": sources, "type": "test-paper"}


@router.post("/lesson-guide")
async def create_lesson_guide(payload: LessonGuideRequest, teacher=Depends(require_teacher)):
    query = f"Class {payload.class_level} {payload.subject} {payload.chapter_or_topic} explain concepts examples"
    context, sources = _grounding_context(
        class_level=payload.class_level,
        subject=payload.subject,
        query=query,
        document_type_boosts={
            "teacher_guide": 10.0,
            "textbook": 8.0,
            "learning_outcome": 6.0,
            "curriculum": 4.0,
            "model_question_paper": 1.0,
            "previous_year_question": 0.5,
        },
    )
    details = (
        f"Class: {payload.class_level}\nSubject: {payload.subject}\nTopic/chapter: {payload.chapter_or_topic}\n"
        f"Medium: {payload.medium}\nLesson length: {payload.lesson_minutes} minutes\n"
        f"Student readiness: {payload.student_level}\nTeacher notes: {payload.teacher_notes or 'None'}"
    )
    task = (
        "Prepare the teacher before class. Include: a clear topic explanation for the teacher; prerequisite knowledge; learning objectives; "
        "the most important points and common misconceptions; a minute-by-minute teaching sequence; an engaging hook; board-work plan; "
        "simple examples/analogies; questions to ask at increasing cognitive levels; one classroom activity; differentiation for struggling and "
        "advanced learners; a quick formative check; homework/exit ticket; likely student doubts with suggested answers; and a before-class checklist."
    )
    fallback = _fallback_content(
        f"Teaching Guide: {payload.chapter_or_topic}",
        ["Teacher concept briefing", "Learning objectives", "Important points", "Lesson sequence", "Questions to ask", "Misconceptions", "Assessment", "Before-class checklist"],
    )
    content = await asyncio.to_thread(_generate_content, task=task, details=details, context=context, fallback=fallback)
    return {"content": content, "sources": sources, "type": "lesson-guide"}
