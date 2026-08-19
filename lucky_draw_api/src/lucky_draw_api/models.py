from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import Boolean, DateTime, String, false, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


import uuid

class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_sequence: Mapped[int] = mapped_column(autoincrement=True, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    alamat: Mapped[str] = mapped_column(String(255))
    phone_number: Mapped[str] = mapped_column(String(20))
    date_of_birth: Mapped[str] = mapped_column(String(20))
    unique_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    coupon_code: Mapped[str | None] = mapped_column(
        String(20), unique=True, index=True, nullable=True
    )
    photo_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    has_won: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(ZoneInfo("Asia/Jakarta")),
        server_default=func.now(),
    )
