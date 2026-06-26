import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class Student(Base):
    __tablename__ = "students"

    id: Mapped[sa.String] = mapped_column(sa.String(36), primary_key=True)
    name: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    email: Mapped[str] = mapped_column(sa.String(150), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    class_level: Mapped[str] = mapped_column(sa.String(5), nullable=False)
    medium: Mapped[str] = mapped_column(sa.String(10), nullable=False, default="Hindi")
    exam_date: Mapped[sa.Date] = mapped_column(sa.Date, nullable=True)
    created_at: Mapped[sa.DateTime] = mapped_column(sa.DateTime, server_default=sa.func.now())
