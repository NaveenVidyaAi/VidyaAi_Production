from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import is_admin_email
from backend.models.qa_cache import QACache
from backend.models.session import ChatSession
from backend.models.student import Student
from backend.models.weak_topic import WeakTopic
from backend.routers.auth import get_current_student, get_db

router = APIRouter()


def _estimated_minutes_per_user(timestamps: list[datetime]) -> float:
    if not timestamps:
        return 0.0

    timestamps = sorted(timestamps)
    total_seconds = 45  # base effort for first interaction
    for i in range(1, len(timestamps)):
        gap = (timestamps[i] - timestamps[i - 1]).total_seconds()
        total_seconds += max(20, min(gap, 8 * 60))

    return round(total_seconds / 60.0, 2)


async def _require_admin(current_student=Depends(get_current_student)):
    if not is_admin_email(current_student.email):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_student


@router.get("/dashboard")
async def admin_dashboard(admin=Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    since_24h = now - timedelta(hours=24)

    total_users = await db.scalar(select(func.count()).select_from(Student)) or 0
    total_questions = await db.scalar(select(func.count()).select_from(ChatSession)) or 0
    questions_24h = (
        await db.scalar(select(func.count()).select_from(ChatSession).where(ChatSession.created_at >= since_24h)) or 0
    )

    active_users_24h_query = await db.execute(
        select(ChatSession.student_id).where(ChatSession.created_at >= since_24h).distinct()
    )
    active_users_24h = len(active_users_24h_query.all())

    subject_rows = await db.execute(
        select(ChatSession.subject, func.count(ChatSession.id))
        .group_by(ChatSession.subject)
        .order_by(func.count(ChatSession.id).desc())
        .limit(8)
    )
    top_subjects = [{"subject": row[0], "questions": int(row[1])} for row in subject_rows.all()]

    user_rows = await db.execute(
        select(ChatSession.student_id, func.count(ChatSession.id))
        .group_by(ChatSession.student_id)
        .order_by(func.count(ChatSession.id).desc())
        .limit(10)
    )
    top_users = [{"student_id": row[0], "questions": int(row[1])} for row in user_rows.all()]

    cache_entries = await db.scalar(select(func.count()).select_from(QACache)) or 0
    cache_hit_sum = await db.scalar(select(func.sum(QACache.hit_count - 1)).select_from(QACache)) or 0

    source_rows = await db.execute(
        select(QACache.source_type, func.count(QACache.id))
        .group_by(QACache.source_type)
        .order_by(func.count(QACache.id).desc())
    )
    source_mix = [{"source": row[0], "count": int(row[1])} for row in source_rows.all()]

    sessions_for_time = await db.execute(select(ChatSession.student_id, ChatSession.created_at).order_by(ChatSession.created_at.asc()))
    grouped: dict[str, list[datetime]] = defaultdict(list)
    for student_id, created_at in sessions_for_time.all():
        if created_at:
            grouped[student_id].append(created_at)

    estimated_minutes_total = round(sum(_estimated_minutes_per_user(items) for items in grouped.values()), 2)

    return {
        "summary": {
            "total_users": int(total_users),
            "total_questions": int(total_questions),
            "questions_24h": int(questions_24h),
            "active_users_24h": int(active_users_24h),
            "avg_questions_per_user": round((total_questions / total_users), 2) if total_users else 0,
            "estimated_minutes_total": estimated_minutes_total,
            "cache_entries": int(cache_entries),
            "cache_hits_total": int(cache_hit_sum),
        },
        "top_subjects": top_subjects,
        "top_users": top_users,
        "answer_source_mix": source_mix,
    }


@router.get("/users")
async def admin_users(admin=Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    """Per-user breakdown: name, class, questions, subjects, time, weak topics, last active."""
    students_result = await db.execute(select(Student).order_by(Student.created_at.desc()))
    students = students_result.scalars().all()

    sessions_result = await db.execute(
        select(ChatSession.student_id, ChatSession.subject, ChatSession.question, ChatSession.created_at)
        .order_by(ChatSession.created_at.asc())
    )
    all_sessions = sessions_result.all()

    weak_topics_result = await db.execute(select(WeakTopic.student_id, WeakTopic.subject, WeakTopic.topic))
    all_weak = weak_topics_result.all()

    # Group sessions by student
    sessions_by_student: dict[str, list] = defaultdict(list)
    for sid, subject, question, created_at in all_sessions:
        sessions_by_student[sid].append((subject, question, created_at))

    weak_by_student: dict[str, list[str]] = defaultdict(list)
    for sid, subject, topic in all_weak:
        weak_by_student[sid].append(f"{subject}: {topic}")

    users_data = []
    for student in students:
        sid = student.id
        s_sessions = sessions_by_student.get(sid, [])
        timestamps = [s[2] for s in s_sessions if s[2]]
        est_minutes = _estimated_minutes_per_user(timestamps)

        subject_counts: dict[str, int] = defaultdict(int)
        for subject, _, _ in s_sessions:
            subject_counts[subject] += 1

        recent_qs = [q for _, q, _ in s_sessions[-5:]]

        last_active = max(timestamps).isoformat() if timestamps else None

        users_data.append({
            "id": sid,
            "name": student.name,
            "email": student.email,
            "class_level": student.class_level,
            "medium": student.medium,
            "joined": student.created_at.isoformat() if student.created_at else None,
            "total_questions": len(s_sessions),
            "estimated_minutes": est_minutes,
            "subjects": dict(subject_counts),
            "weak_topics": weak_by_student.get(sid, []),
            "recent_questions": recent_qs,
            "last_active": last_active,
        })

    # sort by total questions desc
    users_data.sort(key=lambda u: u["total_questions"], reverse=True)
    return {"users": users_data, "total": len(users_data)}


@router.post("/export-training-data")
async def export_training_data(
    min_hits: int = 1,
    exclude_weak: bool = False,
    admin=Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Export qa_cache rows to training JSONL files (train + test split).
    Returns a summary of what was written; does NOT overwrite existing records.
    """
    import json as _json
    import random
    from pathlib import Path

    TRAIN_PATH = Path("/app/training/training_data/train.jsonl")
    TEST_PATH  = Path("/app/training/training_data/test.jsonl")
    TEST_SPLIT = 0.1

    # load weak subjects for optional exclusion
    weak_subjects: set[str] = set()
    if exclude_weak:
        weak_result = await db.execute(select(QACache.subject).distinct())
        # Use actual weak_topics table
        from backend.models.weak_topic import WeakTopic as _WT
        wt_result = await db.execute(select(_WT.subject).distinct())
        weak_subjects = {row[0] for row in wt_result.all() if row[0]}

    # fetch qualifying cache rows
    cache_query = (
        select(QACache)
        .where(
            QACache.source_type.in_(["groq", "rag"]),
            QACache.hit_count >= min_hits,
        )
        .order_by(QACache.hit_count.desc(), QACache.created_at.desc())
    )
    cache_result = await db.execute(cache_query)
    all_rows = cache_result.scalars().all()

    def _difficulty(answer: str) -> str:
        n = len(answer)
        if n < 200:   return "easy"
        if n < 600:   return "medium"
        return "hard"

    def _to_record(row: QACache) -> dict | None:
        q = (row.original_question or "").strip()
        a = (row.answer or "").strip()
        if len(q) < 8 or len(a) < 80:
            return None
        if exclude_weak and row.subject in weak_subjects and row.hit_count == 1:
            return None
        return {
            "instruction": f"{q}\n(Subject: {row.subject}, Class: {row.class_level})",
            "output": a,
            "metadata": {
                "subject": row.subject,
                "class_level": row.class_level,
                "source": f"qa_cache:{row.source_type}",
                "hit_count": row.hit_count,
                "cache_id": row.id,
                "difficulty": _difficulty(a),
                "exported_at": datetime.utcnow().isoformat(),
            },
        }

    def _existing_ids(path: Path) -> set[int]:
        ids: set[int] = set()
        if not path.exists():
            return ids
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = _json.loads(line)
                    cid = obj.get("metadata", {}).get("cache_id")
                    if cid is not None:
                        ids.add(int(cid))
                except Exception:
                    pass
        return ids

    records = [r for row in all_rows if (r := _to_record(row)) is not None]

    # deduplicate against what's already on disk
    existing_ids = _existing_ids(TRAIN_PATH) | _existing_ids(TEST_PATH)
    new_records = [r for r in records if r["metadata"]["cache_id"] not in existing_ids]

    if not new_records:
        return {
            "status": "nothing_new",
            "total_in_cache": len(all_rows),
            "already_exported": len(records) - len(new_records),
            "new_records": 0,
            "train_added": 0,
            "test_added": 0,
        }

    random.shuffle(new_records)
    split_at   = max(1, int(len(new_records) * (1 - TEST_SPLIT)))
    train_new  = new_records[:split_at]
    test_new   = new_records[split_at:]

    TRAIN_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(TRAIN_PATH, "a", encoding="utf-8") as f:
        for rec in train_new:
            f.write(_json.dumps(rec, ensure_ascii=False) + "\n")
    with open(TEST_PATH, "a", encoding="utf-8") as f:
        for rec in test_new:
            f.write(_json.dumps(rec, ensure_ascii=False) + "\n")

    return {
        "status": "ok",
        "total_in_cache": len(all_rows),
        "already_exported": len(existing_ids),
        "new_records": len(new_records),
        "train_added": len(train_new),
        "test_added": len(test_new),
        "train_path": str(TRAIN_PATH),
        "test_path": str(TEST_PATH),
    }
