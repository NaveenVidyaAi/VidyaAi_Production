from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import AsyncSessionLocal
from backend.routers.auth import get_current_student, get_db
from backend.models.weak_topic import WeakTopic
from backend.models.session import ChatSession

router = APIRouter()

class ProfileSummary(BaseModel):
    name: str
    class_level: str
    weak_topics: list[dict]
    questions_asked: int
    exam_date: Optional[str]

class CountdownResponse(BaseModel):
    days_remaining: int
    daily_plan: list[str]

@router.get("/summary", response_model=ProfileSummary)
async def summary(current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)) -> ProfileSummary:
    result = await db.execute(select(WeakTopic).where(WeakTopic.student_id == current_student.id))
    weak_topics = result.scalars().all()
    count = await db.scalar(select(func.count()).select_from(ChatSession).where(ChatSession.student_id == current_student.id))
    return ProfileSummary(
        name=current_student.name,
        class_level=current_student.class_level,
        weak_topics=[{"subject": wt.subject, "topic": wt.topic, "wrong_count": wt.wrong_count} for wt in weak_topics],
        questions_asked=count or 0,
        exam_date=current_student.exam_date.isoformat() if current_student.exam_date else None,
    )

@router.get("/weak-topics")
async def weak_topics(current_student=Depends(get_current_student), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeakTopic).where(WeakTopic.student_id == current_student.id))
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
    result = await db.execute(select(WeakTopic).where(WeakTopic.student_id == current_student.id).order_by(WeakTopic.wrong_count.desc()).limit(5))
    weak_topics = result.scalars().all()
    daily_plan = [f"Revise {wt.subject} - {wt.topic}" for wt in weak_topics[:min(5, max(days_remaining, 1))]]
    return CountdownResponse(days_remaining=days_remaining, daily_plan=daily_plan)
