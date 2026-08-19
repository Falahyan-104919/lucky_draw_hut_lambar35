from datetime import datetime, timezone
from lucky_draw_api.models import Participant
from lucky_draw_api.schemas import ParticipantResponse


def test_participant_response_schema():
    schema = ParticipantResponse( # pyright: ignore[reportCallIssue]
        id="some-uuid",
        ticket_sequence=1,
        full_name="Jane Doe",
        alamat="Jl. Kemerdekaan No 1",
        phone_number="0987654321",
        unique_id="NID456",
        coupon_code=None,
        photo_path=None,
        has_won=False,
        created_at=datetime.now(timezone.utc),
    )
    assert schema.alamat == "Jl. Kemerdekaan No 1"


def test_participant_response_from_attributes():
    now = datetime.now(timezone.utc)
    participant = Participant(
        id="some-uuid",
        ticket_sequence=1,
        full_name="Jane Doe",
        alamat="Jl. Kemerdekaan No 1",
        phone_number="0987654321",
        unique_id="NID456",
        coupon_code=None,
        photo_path=None,
        has_won=False,
        created_at=now,
    )
    schema = ParticipantResponse.model_validate(participant)
    assert schema.id == "some-uuid"
    assert schema.ticket_sequence == 1
    assert schema.full_name == "Jane Doe"
    assert schema.alamat == "Jl. Kemerdekaan No 1"
    assert schema.phone_number == "0987654321"
    assert schema.unique_id == "NID456"
    assert schema.photo_path is None
    assert schema.has_won is False
    assert schema.created_at == now
