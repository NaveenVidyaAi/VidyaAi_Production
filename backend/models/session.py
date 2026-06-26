import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(sa.String(36), sa.ForeignKey("students.id"), nullable=False)
    question: Mapped[str] = mapped_column(sa.Text, nullable=False)
    answer: Mapped[str] = mapped_column(sa.Text, nullable=False)
    subject: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    topic: Mapped[str] = mapped_column(sa.String(200), nullable=True)
    class_level: Mapped[str] = mapped_column(sa.String(5), nullable=False)
    created_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, server_default=sa.func.now())
