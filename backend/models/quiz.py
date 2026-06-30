import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(sa.String(36), sa.ForeignKey("students.id"), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(sa.String(100), nullable=False, index=True)
    chapter: Mapped[str] = mapped_column(sa.String(120), nullable=True, index=True)
    topic: Mapped[str] = mapped_column(sa.String(200), nullable=True, index=True)
    quiz_type: Mapped[str] = mapped_column(sa.String(40), nullable=False, default="activity")
    source_session_id: Mapped[int] = mapped_column(sa.Integer, nullable=True, index=True)
    status: Mapped[str] = mapped_column(sa.String(20), nullable=False, default="started", index=True)
    total_questions: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    correct_count: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    skipped: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    created_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, server_default=sa.func.now(), index=True)
    completed_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, nullable=True)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(sa.Integer, sa.ForeignKey("quizzes.id"), nullable=False, index=True)
    prompt: Mapped[str] = mapped_column(sa.Text, nullable=False)
    options_json: Mapped[str] = mapped_column(sa.Text, nullable=False)
    correct_option: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    explanation: Mapped[str] = mapped_column(sa.Text, nullable=True)
    topic: Mapped[str] = mapped_column(sa.String(200), nullable=True)
    difficulty: Mapped[str] = mapped_column(sa.String(20), nullable=False, default="medium")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(sa.Integer, sa.ForeignKey("quizzes.id"), nullable=False, index=True)
    question_id: Mapped[int] = mapped_column(sa.Integer, sa.ForeignKey("quiz_questions.id"), nullable=False, index=True)
    selected_option: Mapped[int] = mapped_column(sa.Integer, nullable=True)
    is_correct: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    created_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, server_default=sa.func.now())
