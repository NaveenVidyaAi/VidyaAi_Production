import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class QACache(Base):
    __tablename__ = "qa_cache"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    normalized_question: Mapped[str] = mapped_column(sa.String(600), nullable=False, index=True)
    original_question: Mapped[str] = mapped_column(sa.Text, nullable=False)
    answer: Mapped[str] = mapped_column(sa.Text, nullable=False)
    subject: Mapped[str] = mapped_column(sa.String(100), nullable=False, index=True)
    class_level: Mapped[str] = mapped_column(sa.String(5), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(sa.String(40), nullable=False, default="groq")
    sources_json: Mapped[str] = mapped_column(sa.Text, nullable=True, default="[]")
    hit_count: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=1)
    created_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, server_default=sa.func.now())
    last_used_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())

    __table_args__ = (
        sa.UniqueConstraint("normalized_question", "subject", "class_level", name="uq_cache_q_subject_class"),
    )
