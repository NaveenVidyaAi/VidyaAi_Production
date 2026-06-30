from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import AsyncSessionLocal
from backend.routers.auth import get_current_student, get_db
from backend.routers.chat import _ensure_db_student
from backend.models.quiz import Quiz
from backend.models.weak_topic import WeakTopic
from backend.models.session import ChatSession

router = APIRouter()

class ProfileSummary(BaseModel):
    name: str
    class_level: str
    weak_topics: list[dict]
    questions_asked: int
    exam_date: Optional[str]
    quiz: dict
    recent_quizzes: list[dict]
    subject_activity: list[dict]

class CountdownResponse(BaseModel):
    days_remaining: int
    daily_plan: list[str]

@router.get("/summary", response_model=ProfileSummary)
async def summary(current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)) -> ProfileSummary:
    student_id = await _ensure_db_student(db, current_student)
    result = await db.execute(select(WeakTopic).where(WeakTopic.student_id == student_id))
    weak_topics = result.scalars().all()
    count = await db.scalar(select(func.count()).select_from(ChatSession).where(ChatSession.student_id == student_id))
    subject_result = await db.execute(
        select(
            ChatSession.subject,
            func.count(ChatSession.id),
            func.max(ChatSession.created_at),
        )
        .where(ChatSession.student_id == student_id)
        .group_by(ChatSession.subject)
        .order_by(func.count(ChatSession.id).desc())
    )
    subject_rows = subject_result.all()
    quiz_result = await db.execute(
        select(Quiz)
        .where(Quiz.student_id == student_id)
        .order_by(Quiz.created_at.asc())
    )
    quizzes = quiz_result.scalars().all()
    completed = [quiz for quiz in quizzes if quiz.status == "completed" and quiz.total_questions]
    skipped = [quiz for quiz in quizzes if quiz.status == "skipped" or quiz.skipped]
    scores = [
        (quiz.correct_count / quiz.total_questions) * 100
        for quiz in completed
        if quiz.total_questions
    ]
    first_score = scores[0] if scores else 0.0
    latest_score = scores[-1] if scores else 0.0
    subject_scores: dict[str, list[float]] = {}
    for quiz in completed:
        subject_scores.setdefault(quiz.subject, []).append((quiz.correct_count / quiz.total_questions) * 100)
    subject_performance = [
        {
            "subject": subject,
            "avg_score": round(sum(items) / len(items), 1),
            "attempts": len(items),
        }
        for subject, items in subject_scores.items()
    ]
    weak_by_subject: dict[str, int] = {}
    for topic in weak_topics:
        weak_by_subject[topic.subject] = weak_by_subject.get(topic.subject, 0) + 1
    quiz_by_subject = {item["subject"]: item for item in subject_performance}
    return ProfileSummary(
        name=current_student.name,
        class_level=current_student.class_level,
        weak_topics=[{"subject": wt.subject, "topic": wt.topic, "wrong_count": wt.wrong_count} for wt in weak_topics],
        questions_asked=count or 0,
        exam_date=current_student.exam_date.isoformat() if current_student.exam_date else None,
        quiz={
            "started": len(quizzes),
            "completed": len(completed),
            "skipped": len(skipped),
            "completion_rate": round((len(completed) / len(quizzes)) * 100, 1) if quizzes else 0.0,
            "avg_score": round(sum(scores) / len(scores), 1) if scores else 0.0,
            "latest_score": round(latest_score, 1),
            "improvement": round(latest_score - first_score, 1) if len(scores) > 1 else 0.0,
            "subject_performance": subject_performance,
        },
        recent_quizzes=[
            {
                "id": quiz.id,
                "subject": quiz.subject,
                "topic": quiz.topic,
                "status": quiz.status,
                "score_percent": round((quiz.correct_count / quiz.total_questions) * 100, 1) if quiz.total_questions else 0.0,
                "created_at": quiz.created_at.isoformat() if quiz.created_at else None,
            }
            for quiz in list(reversed(quizzes))[:5]
        ],
        subject_activity=[
            {
                "subject": subject or "General",
                "questions": int(question_count or 0),
                "last_studied": last_studied.isoformat() if last_studied else None,
                "avg_quiz_score": quiz_by_subject.get(subject or "General", {}).get("avg_score", 0.0),
                "quiz_attempts": quiz_by_subject.get(subject or "General", {}).get("attempts", 0),
                "weak_topics": weak_by_subject.get(subject or "General", 0),
            }
            for subject, question_count, last_studied in subject_rows
        ],
    )

@router.get("/weak-topics")
async def weak_topics(current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)):
    student_id = await _ensure_db_student(db, current_student)
    result = await db.execute(select(WeakTopic).where(WeakTopic.student_id == student_id))
    weak_topics = result.scalars().all()
    return [{"subject": wt.subject, "topic": wt.topic, "wrong_count": wt.wrong_count} for wt in weak_topics]

@router.put("/exam-date")
async def set_exam_date(payload: dict, current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)):
    exam_date = payload.get("exam_date")
    if exam_date:
        current_student.exam_date = date.fromisoformat(exam_date)
        db.add(current_student)
        await db.commit()
    return {"success": True}

@router.get("/countdown", response_model=CountdownResponse)
async def countdown(current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)) -> CountdownResponse:
    today = date.today()
    if not current_student.exam_date:
        return CountdownResponse(days_remaining=0, daily_plan=[])
    days_remaining = max((current_student.exam_date - today).days, 0)
    student_id = await _ensure_db_student(db, current_student)
    result = await db.execute(select(WeakTopic).where(WeakTopic.student_id == student_id).order_by(WeakTopic.wrong_count.desc()).limit(5))
    weak_topics = result.scalars().all()
    daily_plan = [f"Revise {wt.subject} - {wt.topic}" for wt in weak_topics[:min(5, max(days_remaining, 1))]]
    return CountdownResponse(days_remaining=days_remaining, daily_plan=daily_plan)
