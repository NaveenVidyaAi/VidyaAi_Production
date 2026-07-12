import csv
import io
import json
import os
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from backend.config import is_admin_email
from backend.models.qa_cache import QACache
from backend.models.quiz import Quiz
from backend.models.session import ChatSession
from backend.models.student import Student
from backend.models.weak_topic import WeakTopic
from backend.models.learning_example import LearningExample
from backend.routers.auth import get_current_student, get_db
from backend.routers.chat import in_memory_store

router = APIRouter()

STUDY_SESSION_GAP_MINUTES = 30


class LearningReviewRequest(BaseModel):
    status: str = Field(pattern="^(approved|rejected|pending)$")
    note: str = Field(default="", max_length=1000)


def _estimated_minutes_per_user(timestamps: list[datetime]) -> float:
    if not timestamps:
        return 0.0

    timestamps = sorted(timestamps)
    total_seconds = 45  # base effort for first interaction
    for i in range(1, len(timestamps)):
        gap = (timestamps[i] - timestamps[i - 1]).total_seconds()
        total_seconds += max(20, min(gap, 8 * 60))

    return round(total_seconds / 60.0, 2)


def _parse_datetime(value) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if not value or value == "now":
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _count_study_sessions(timestamps: list[datetime]) -> int:
    if not timestamps:
        return 0
    ordered = sorted(timestamps)
    sessions = 1
    for index in range(1, len(ordered)):
        if ordered[index] - ordered[index - 1] > timedelta(minutes=STUDY_SESSION_GAP_MINUTES):
            sessions += 1
    return sessions


def _feedback_log_dir() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "feedback_logs"))


def _load_feedback_records() -> list[dict]:
    records_by_key: dict[tuple[str, str], dict] = {}
    for session in in_memory_store.get("sessions", []):
        if "understood" not in session:
            continue
        student_id = str(session.get("student_id", "guest"))
        session_id = str(session.get("id", ""))
        records_by_key[(student_id, session_id)] = {
            "student_id": student_id,
            "session_id": session_id,
            "useful": bool(session.get("understood")),
            "feedback": session.get("feedback") or ("thumbs_up" if session.get("understood") else "thumbs_down"),
            "feedback_timestamp": session.get("feedback_at"),
        }

    feedback_dir = _feedback_log_dir()
    if os.path.isdir(feedback_dir):
        for filename in os.listdir(feedback_dir):
            if not filename.endswith(".json"):
                continue
            path = os.path.join(feedback_dir, filename)
            try:
                with open(path, encoding="utf-8") as feedback_file:
                    record = json.load(feedback_file)
            except (OSError, json.JSONDecodeError):
                continue
            student_id = str(record.get("student_id", "guest"))
            session_id = str(record.get("session_id", ""))
            records_by_key[(student_id, session_id)] = {
                "student_id": student_id,
                "session_id": session_id,
                "useful": bool(record.get("useful")),
                "feedback": record.get("feedback") or ("thumbs_up" if record.get("useful") else "thumbs_down"),
                "feedback_timestamp": record.get("feedback_timestamp"),
            }

    return list(records_by_key.values())


def _feedback_summary(records: list[dict]) -> dict:
    positive = sum(1 for record in records if record.get("useful") is True)
    negative = sum(1 for record in records if record.get("useful") is False)
    total = positive + negative
    accuracy_score = round((positive / total) * 100, 1) if total else 0.0
    return {
        "positive": positive,
        "negative": negative,
        "total": total,
        "accuracy_score": accuracy_score,
        "mix": [
            {"label": "Thumbs up", "count": positive},
            {"label": "Thumbs down", "count": negative},
        ],
    }


def _student_activity_metrics(session_events: list[dict], total_users: int, now: datetime | None = None) -> dict:
    now = now or datetime.utcnow()
    today = now.date()
    since_24h = now - timedelta(hours=24)
    since_7d = now - timedelta(days=7)
    timestamps_by_student: dict[str, list[datetime]] = defaultdict(list)
    dau_students: set[str] = set()
    wau_students: set[str] = set()
    active_24h_students: set[str] = set()
    daily: dict[str, dict[str, object]] = {}

    for offset in range(6, -1, -1):
        date_key = (today - timedelta(days=offset)).isoformat()
        daily[date_key] = {"date": date_key, "questions": 0, "active_users": set()}

    for event in session_events:
        student_id = str(event.get("student_id") or "guest")
        created_at = _parse_datetime(event.get("created_at")) or now
        timestamps_by_student[student_id].append(created_at)

        if created_at >= since_24h:
            active_24h_students.add(student_id)
        if created_at.date() == today:
            dau_students.add(student_id)
        if created_at >= since_7d:
            wau_students.add(student_id)
        date_key = created_at.date().isoformat()
        if date_key in daily:
            daily[date_key]["questions"] += 1
            daily[date_key]["active_users"].add(student_id)

    study_session_count = sum(_count_study_sessions(items) for items in timestamps_by_student.values())
    total_questions = len(session_events)
    dau = len(dau_students)
    wau = len(wau_students)
    retained_users = wau
    denominator = total_users or len(timestamps_by_student)

    return {
        "active_users_24h": len(active_24h_students),
        "dau": dau,
        "wau": wau,
        "dau_wau_ratio": round((dau / wau) * 100, 1) if wau else 0.0,
        "retention_rate": round((retained_users / denominator) * 100, 1) if denominator else 0.0,
        "retained_users": retained_users,
        "study_sessions": study_session_count,
        "avg_questions_per_study_session": round(total_questions / study_session_count, 2) if study_session_count else 0,
        "daily_activity": [
            {
                "date": row["date"],
                "questions": int(row["questions"]),
                "active_users": len(row["active_users"]),
            }
            for row in daily.values()
        ],
    }


def _feedback_by_student(records: list[dict]) -> dict[str, dict[str, int | float]]:
    grouped: dict[str, dict[str, int | float]] = defaultdict(lambda: {"positive": 0, "negative": 0, "total": 0, "accuracy_score": 0.0})
    for record in records:
        item = grouped[str(record.get("student_id", "guest"))]
        if record.get("useful") is True:
            item["positive"] += 1
        elif record.get("useful") is False:
            item["negative"] += 1
        item["total"] = item["positive"] + item["negative"]
        item["accuracy_score"] = round((item["positive"] / item["total"]) * 100, 1) if item["total"] else 0.0
    return grouped


def _quiz_metrics_from_rows(rows: list[tuple]) -> dict:
    completed = [row for row in rows if row.status == "completed" and row.total_questions]
    skipped = [row for row in rows if row.status == "skipped" or row.skipped]
    scores = [
        (row.correct_count / row.total_questions) * 100
        for row in completed
        if row.total_questions
    ]
    by_student: dict[str, list] = defaultdict(list)
    by_subject: dict[str, list[float]] = defaultdict(list)
    for row in completed:
        by_student[row.student_id].append(row)
        by_subject[row.subject].append((row.correct_count / row.total_questions) * 100)

    improvements = []
    for student_rows in by_student.values():
        ordered = sorted(student_rows, key=lambda item: item.completed_at or item.created_at or datetime.min)
        if len(ordered) < 2:
            continue
        first = (ordered[0].correct_count / ordered[0].total_questions) * 100 if ordered[0].total_questions else 0
        latest = (ordered[-1].correct_count / ordered[-1].total_questions) * 100 if ordered[-1].total_questions else 0
        improvements.append(latest - first)

    return {
        "quizzes_started": len(rows),
        "quizzes_completed": len(completed),
        "quizzes_skipped": len(skipped),
        "quiz_completion_rate": round((len(completed) / len(rows)) * 100, 1) if rows else 0.0,
        "quiz_skip_rate": round((len(skipped) / len(rows)) * 100, 1) if rows else 0.0,
        "avg_quiz_score": round(sum(scores) / len(scores), 1) if scores else 0.0,
        "avg_improvement": round(sum(improvements) / len(improvements), 1) if improvements else 0.0,
        "improved_students": sum(1 for item in improvements if item > 0),
        "quiz_subject_performance": [
            {
                "subject": subject,
                "avg_score": round(sum(subject_scores) / len(subject_scores), 1),
                "attempts": len(subject_scores),
            }
            for subject, subject_scores in sorted(
                by_subject.items(),
                key=lambda item: (sum(item[1]) / len(item[1])) if item[1] else 0,
                reverse=True,
            )
        ],
    }


def _empty_quiz_metrics() -> dict:
    return _quiz_metrics_from_rows([])


def _quiz_metrics_by_student(rows: list[Quiz]) -> dict[str, dict]:
    grouped: dict[str, list[Quiz]] = defaultdict(list)
    for row in rows:
        grouped[row.student_id].append(row)

    metrics: dict[str, dict] = {}
    for student_id, student_rows in grouped.items():
        completed = [row for row in student_rows if row.status == "completed" and row.total_questions]
        skipped = [row for row in student_rows if row.status == "skipped" or row.skipped]
        ordered = sorted(completed, key=lambda item: item.completed_at or item.created_at or datetime.min)
        scores = [
            (row.correct_count / row.total_questions) * 100
            for row in ordered
            if row.total_questions
        ]
        first_score = scores[0] if scores else 0.0
        latest_score = scores[-1] if scores else 0.0
        metrics[student_id] = {
            "quizzes_started": len(student_rows),
            "quizzes_completed": len(completed),
            "quizzes_skipped": len(skipped),
            "quiz_completion_rate": round((len(completed) / len(student_rows)) * 100, 1) if student_rows else 0.0,
            "avg_quiz_score": round(sum(scores) / len(scores), 1) if scores else 0.0,
            "latest_quiz_score": round(latest_score, 1),
            "improvement": round(latest_score - first_score, 1) if len(scores) > 1 else 0.0,
        }
    return metrics


async def _require_admin(current_student=Depends(get_current_student)):
    if not is_admin_email(current_student.email):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_student


def _build_fallback_dashboard_payload() -> dict:
    sessions = in_memory_store.get("sessions", [])
    caches = in_memory_store.get("caches", {})
    weak_topics = in_memory_store.get("weak_topics", {})
    now = datetime.utcnow()
    feedback = _feedback_summary(_load_feedback_records())
    activity = _student_activity_metrics(sessions, len({session.get("student_id", "guest") for session in sessions}), now)

    grouped_subjects: dict[str, int] = defaultdict(int)
    grouped_users: dict[str, int] = defaultdict(int)
    for session in sessions:
        subject = session.get("subject") or "General"
        grouped_subjects[subject] += 1
        grouped_users[session.get("student_id", "guest")] += 1

    top_subjects = [{"subject": subject, "questions": count} for subject, count in sorted(grouped_subjects.items(), key=lambda item: item[1], reverse=True)[:8]]
    top_users = [{"student_id": student_id, "questions": count} for student_id, count in sorted(grouped_users.items(), key=lambda item: item[1], reverse=True)[:10]]

    source_counts: dict[str, int] = defaultdict(int)
    for entry in caches.values():
        source_counts[entry.get("source_type", "fallback")] += 1
    source_mix = [{"source": source, "count": count} for source, count in source_counts.items()]

    total_users = len(grouped_users) or 1
    total_questions = len(sessions)
    questions_24h = sum(1 for session in sessions if (_parse_datetime(session.get("created_at")) or now) >= now - timedelta(hours=24))
    estimated_minutes_total = round(total_questions * 0.8, 2)

    return {
        "summary": {
            "total_users": total_users,
            "total_questions": total_questions,
            "questions_24h": questions_24h,
            "active_users_24h": activity["active_users_24h"],
            "dau": activity["dau"],
            "wau": activity["wau"],
            "dau_wau_ratio": activity["dau_wau_ratio"],
            "retention_rate": activity["retention_rate"],
            "retained_users": activity["retained_users"],
            "study_sessions": activity["study_sessions"],
            "engagement_rate": activity["avg_questions_per_study_session"],
            "accuracy_score": feedback["accuracy_score"],
            "feedback_total": feedback["total"],
            "thumbs_up": feedback["positive"],
            "thumbs_down": feedback["negative"],
            "avg_questions_per_user": round(total_questions / total_users, 2) if total_users else 0,
            "estimated_minutes_total": estimated_minutes_total,
            "cache_entries": len(caches),
            "cache_hits_total": sum(1 for _ in caches.values()),
            **_empty_quiz_metrics(),
        },
        "top_subjects": top_subjects,
        "top_users": top_users,
        "answer_source_mix": source_mix or [{"source": "fallback", "count": 1}],
        "feedback_mix": feedback["mix"],
        "daily_activity": activity["daily_activity"],
    }


def _build_fallback_users_payload() -> dict:
    sessions = in_memory_store.get("sessions", [])
    weak_topics = in_memory_store.get("weak_topics", {})
    feedback = _feedback_by_student(_load_feedback_records())
    sessions_by_student: dict[str, list[dict]] = defaultdict(list)
    for session in sessions:
        sessions_by_student[session.get("student_id", "guest")].append(session)

    users_data = []
    for student_id, student_sessions in sessions_by_student.items():
        subject_counts: dict[str, int] = defaultdict(int)
        for session in student_sessions:
            subject_counts[session.get("subject") or "General"] += 1
        recent_qs = [item.get("question") for item in student_sessions[-5:]]
        timestamps = [_parse_datetime(item.get("created_at")) for item in student_sessions]
        timestamps = [item for item in timestamps if item]
        users_data.append({
            "id": student_id,
            "name": student_id.split("@", 1)[0].replace(".", " ").title() if "@" in student_id else student_id,
            "email": student_id,
            "class_level": "10",
            "medium": "Hindi",
            "joined": None,
            "total_questions": len(student_sessions),
            "estimated_minutes": round(len(student_sessions) * 0.8, 2),
            "subjects": dict(subject_counts),
            "weak_topics": weak_topics.get(student_id, []),
            "recent_questions": recent_qs,
            "last_active": max(timestamps).isoformat() if timestamps else None,
            "feedback": feedback.get(student_id, {"positive": 0, "negative": 0, "total": 0, "accuracy_score": 0.0}),
            "quiz": {
                "quizzes_started": 0,
                "quizzes_completed": 0,
                "quizzes_skipped": 0,
                "quiz_completion_rate": 0.0,
                "avg_quiz_score": 0.0,
                "latest_quiz_score": 0.0,
                "improvement": 0.0,
            },
        })

    users_data.sort(key=lambda item: item["total_questions"], reverse=True)
    return {"users": users_data, "total": len(users_data)}


@router.get("/dashboard")
async def admin_dashboard(admin=Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    if db is None:
        return _build_fallback_dashboard_payload()
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
    session_events: list[dict] = []
    for student_id, created_at in sessions_for_time.all():
        if created_at:
            grouped[student_id].append(created_at)
        session_events.append({"student_id": student_id, "created_at": created_at})

    estimated_minutes_total = round(sum(_estimated_minutes_per_user(items) for items in grouped.values()), 2)
    activity = _student_activity_metrics(session_events, int(total_users), now)
    feedback = _feedback_summary(_load_feedback_records())
    quiz_result = await db.execute(select(Quiz))
    quiz_rows = quiz_result.scalars().all()
    quiz_metrics = _quiz_metrics_from_rows(quiz_rows)

    return {
        "summary": {
            "total_users": int(total_users),
            "total_questions": int(total_questions),
            "questions_24h": int(questions_24h),
            "active_users_24h": int(active_users_24h),
            "dau": activity["dau"],
            "wau": activity["wau"],
            "dau_wau_ratio": activity["dau_wau_ratio"],
            "retention_rate": activity["retention_rate"],
            "retained_users": activity["retained_users"],
            "study_sessions": activity["study_sessions"],
            "engagement_rate": activity["avg_questions_per_study_session"],
            "accuracy_score": feedback["accuracy_score"],
            "feedback_total": feedback["total"],
            "thumbs_up": feedback["positive"],
            "thumbs_down": feedback["negative"],
            "avg_questions_per_user": round((total_questions / total_users), 2) if total_users else 0,
            "estimated_minutes_total": estimated_minutes_total,
            "cache_entries": int(cache_entries),
            "cache_hits_total": int(cache_hit_sum),
            **quiz_metrics,
        },
        "top_subjects": top_subjects,
        "top_users": top_users,
        "answer_source_mix": source_mix,
        "feedback_mix": feedback["mix"],
        "daily_activity": activity["daily_activity"],
    }


@router.get("/users")
async def admin_users(admin=Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    """Per-user breakdown: name, class, questions, subjects, time, weak topics, last active."""
    if db is None:
        return _build_fallback_users_payload()

    students_result = await db.execute(select(Student).order_by(Student.created_at.desc()))
    students = students_result.scalars().all()

    sessions_result = await db.execute(
        select(ChatSession.student_id, ChatSession.subject, ChatSession.question, ChatSession.created_at)
        .order_by(ChatSession.created_at.asc())
    )
    all_sessions = sessions_result.all()

    weak_topics_result = await db.execute(select(WeakTopic.student_id, WeakTopic.subject, WeakTopic.topic))
    all_weak = weak_topics_result.all()
    feedback = _feedback_by_student(_load_feedback_records())
    quiz_result = await db.execute(select(Quiz))
    quiz_by_student = _quiz_metrics_by_student(quiz_result.scalars().all())

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
            "feedback": feedback.get(sid, {"positive": 0, "negative": 0, "total": 0, "accuracy_score": 0.0}),
            "quiz": quiz_by_student.get(sid, {
                "quizzes_started": 0,
                "quizzes_completed": 0,
                "quizzes_skipped": 0,
                "quiz_completion_rate": 0.0,
                "avg_quiz_score": 0.0,
                "latest_quiz_score": 0.0,
                "improvement": 0.0,
            }),
        })

    # sort by total questions desc
    users_data.sort(key=lambda u: u["total_questions"], reverse=True)
    return {"users": users_data, "total": len(users_data)}


@router.get("/export-student-metrics")
async def export_student_metrics(admin=Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    dashboard = await admin_dashboard(admin, db)
    users_payload = await admin_users(admin, db)
    summary = dashboard.get("summary", {})
    users = users_payload.get("users", [])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["VidyaAI Student Metrics Export", datetime.utcnow().isoformat()])
    writer.writerow([])
    writer.writerow(["Metric", "Value"])
    for label, key in [
        ("Total Users", "total_users"),
        ("Total Questions", "total_questions"),
        ("Questions 24h", "questions_24h"),
        ("DAU", "dau"),
        ("WAU", "wau"),
        ("DAU/WAU %", "dau_wau_ratio"),
        ("Retention Rate %", "retention_rate"),
        ("Study Sessions", "study_sessions"),
        ("Engagement Rate", "engagement_rate"),
        ("Accuracy Score %", "accuracy_score"),
        ("Thumbs Up", "thumbs_up"),
        ("Thumbs Down", "thumbs_down"),
        ("Quizzes Started", "quizzes_started"),
        ("Quizzes Completed", "quizzes_completed"),
        ("Quizzes Skipped", "quizzes_skipped"),
        ("Quiz Completion Rate %", "quiz_completion_rate"),
        ("Average Quiz Score %", "avg_quiz_score"),
        ("Average Quiz Improvement %", "avg_improvement"),
        ("Improved Students", "improved_students"),
    ]:
        writer.writerow([label, summary.get(key, 0)])

    writer.writerow([])
    writer.writerow([
        "Rank",
        "Name",
        "Email",
        "Class",
        "Medium",
        "Questions",
        "Estimated Minutes",
        "Subjects",
        "Weak Topics",
        "Last Active",
        "Thumbs Up",
        "Thumbs Down",
        "Feedback Total",
        "Accuracy Score %",
        "Quizzes Started",
        "Quizzes Completed",
        "Quizzes Skipped",
        "Quiz Completion %",
        "Avg Quiz Score %",
        "Latest Quiz Score %",
        "Quiz Improvement %",
    ])
    for index, user in enumerate(users, start=1):
        feedback = user.get("feedback") or {}
        quiz = user.get("quiz") or {}
        writer.writerow([
            index,
            user.get("name", ""),
            user.get("email", ""),
            user.get("class_level", ""),
            user.get("medium", ""),
            user.get("total_questions", 0),
            user.get("estimated_minutes", 0),
            "; ".join(f"{subject}: {count}" for subject, count in (user.get("subjects") or {}).items()),
            "; ".join(user.get("weak_topics") or []),
            user.get("last_active") or "",
            feedback.get("positive", 0),
            feedback.get("negative", 0),
            feedback.get("total", 0),
            feedback.get("accuracy_score", 0),
            quiz.get("quizzes_started", 0),
            quiz.get("quizzes_completed", 0),
            quiz.get("quizzes_skipped", 0),
            quiz.get("quiz_completion_rate", 0),
            quiz.get("avg_quiz_score", 0),
            quiz.get("latest_quiz_score", 0),
            quiz.get("improvement", 0),
        ])

    output.seek(0)
    filename = f"vidyaai_student_metrics_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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


@router.get("/learning-loop/stats")
async def learning_loop_stats(admin=Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Learning database is unavailable")
    total = await db.scalar(select(func.count()).select_from(LearningExample)) or 0
    pending = await db.scalar(select(func.count()).select_from(LearningExample).where(LearningExample.review_status == "pending")) or 0
    approved = await db.scalar(select(func.count()).select_from(LearningExample).where(LearningExample.review_status == "approved")) or 0
    rejected = await db.scalar(select(func.count()).select_from(LearningExample).where(LearningExample.review_status == "rejected")) or 0
    ready = await db.scalar(select(func.count()).select_from(LearningExample).where(
        LearningExample.review_status == "pending", LearningExample.quality_score >= 0.75,
    )) or 0
    avg_quality = await db.scalar(select(func.avg(LearningExample.quality_score))) or 0.0
    return {
        "captured": int(total), "pending_review": int(pending), "approved": int(approved),
        "rejected": int(rejected), "high_quality_candidates": int(ready),
        "average_quality_score": round(float(avg_quality), 3),
        "automatic_weight_updates": False,
    }


@router.get("/learning-loop/candidates")
async def learning_loop_candidates(
    limit: int = 100,
    status_filter: str = "pending",
    admin=Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Learning database is unavailable")
    limit = max(1, min(limit, 500))
    query = select(LearningExample)
    if status_filter in {"pending", "approved", "rejected"}:
        query = query.where(LearningExample.review_status == status_filter)
    rows = (await db.execute(query.order_by(LearningExample.quality_score.desc(), LearningExample.created_at.desc()).limit(limit))).scalars().all()
    return [{
        "id": row.id, "question": row.question, "answer": row.answer, "subject": row.subject,
        "source_type": row.source_type, "sources": json.loads(row.sources_json or "[]"),
        "positive_feedback": row.positive_feedback, "negative_feedback": row.negative_feedback,
        "quality_score": row.quality_score, "review_status": row.review_status,
        "review_note": row.review_note, "created_at": row.created_at.isoformat() if row.created_at else None,
    } for row in rows]


@router.put("/learning-loop/candidates/{candidate_id}")
async def review_learning_candidate(
    candidate_id: int,
    payload: LearningReviewRequest,
    admin=Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Learning database is unavailable")
    row = await db.get(LearningExample, candidate_id)
    if not row:
        raise HTTPException(status_code=404, detail="Learning candidate not found")
    if payload.status == "approved" and (row.negative_feedback > 0 or row.quality_score < 0.60):
        raise HTTPException(status_code=400, detail="Resolve negative feedback or low quality before approval")
    row.review_status = payload.status
    row.review_note = payload.note.strip() or None
    row.reviewed_by = admin.email
    row.reviewed_at = datetime.utcnow()
    await db.commit()
    return {"id": row.id, "review_status": row.review_status, "quality_score": row.quality_score}


@router.get("/learning-loop/export-approved")
async def export_approved_learning_data(admin=Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    """Export only human-approved records; this endpoint never starts training."""
    if db is None:
        raise HTTPException(status_code=503, detail="Learning database is unavailable")
    rows = (await db.execute(
        select(LearningExample).where(LearningExample.review_status == "approved").order_by(LearningExample.id)
    )).scalars().all()
    lines = []
    for row in rows:
        lines.append(json.dumps({
            "instruction": f"{row.question}\n(Subject: {row.subject}, Class: {row.class_level})",
            "output": row.answer,
            "metadata": {
                "learning_example_id": row.id, "subject": row.subject, "class_level": row.class_level,
                "source": row.source_type, "quality_score": row.quality_score,
                "positive_feedback": row.positive_feedback, "human_approved": True,
            },
        }, ensure_ascii=False) + "\n")
    filename = f"vidyaai_approved_learning_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jsonl"
    return StreamingResponse(iter(lines), media_type="application/x-ndjson", headers={
        "Content-Disposition": f'attachment; filename="{filename}"', "X-Training-Examples": str(len(rows)),
    })
