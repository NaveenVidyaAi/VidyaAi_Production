import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class LearningExample(Base):
    """A privacy-minimized candidate for retrieval or future fine-tuning."""

    __tablename__ = "learning_examples"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    chat_session_id: Mapped[int] = mapped_column(sa.Integer, nullable=False, unique=True, index=True)
    student_key: Mapped[str] = mapped_column(sa.String(64), nullable=False, index=True)
    question_hash: Mapped[str] = mapped_column(sa.String(64), nullable=False, index=True)
    question: Mapped[str] = mapped_column(sa.Text, nullable=False)
    answer: Mapped[str] = mapped_column(sa.Text, nullable=False)
    subject: Mapped[str] = mapped_column(sa.String(100), nullable=False, index=True)
    class_level: Mapped[str] = mapped_column(sa.String(5), nullable=False, default="10")
    source_type: Mapped[str] = mapped_column(sa.String(40), nullable=False, default="unknown")
    sources_json: Mapped[str] = mapped_column(sa.Text, nullable=False, default="[]")
    positive_feedback: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    negative_feedback: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    quality_score: Mapped[float] = mapped_column(sa.Float, nullable=False, default=0.0, index=True)
    review_status: Mapped[str] = mapped_column(sa.String(20), nullable=False, default="pending", index=True)
    review_note: Mapped[str] = mapped_column(sa.Text, nullable=True)
    reviewed_by: Mapped[str] = mapped_column(sa.String(150), nullable=True)
    created_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, server_default=sa.func.now(), index=True)
    reviewed_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, nullable=True)

