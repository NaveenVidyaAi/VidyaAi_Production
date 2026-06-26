import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class WeakTopic(Base):
    __tablename__ = "weak_topics"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(sa.String(36), sa.ForeignKey("students.id"), nullable=False)
    subject: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    topic: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    wrong_count: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=1)
    last_seen: Mapped[sa.DateTime] = mapped_column(sa.DateTime, server_default=sa.func.now())
