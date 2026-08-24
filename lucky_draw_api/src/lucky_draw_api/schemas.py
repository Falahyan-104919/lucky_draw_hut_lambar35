from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class ParticipantCreate(BaseModel):
    full_name: str
    alamat: str
    phone_number: str
    date_of_birth: str
    photo_url: str | None = None


class ParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_sequence: int
    full_name: str
    alamat: str
    phone_number: str
    date_of_birth: str
    unique_id: str
    coupon_code: str | None
    photo_path: str | None
    has_won: bool
    created_at: datetime


class PekonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    kecamatan: str
    name: str
    has_won: bool
    coupon_code: str | None
    created_at: datetime
