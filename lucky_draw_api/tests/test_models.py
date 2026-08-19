from datetime import datetime
from zoneinfo import ZoneInfo
from lucky_draw_api.models import Participant


def test_participant_model_fields():
    now = datetime.now(ZoneInfo("Asia/Jakarta"))
    participant = Participant(
        id="some-uuid-1234",
        ticket_sequence=1,
        full_name="John Doe",
        alamat="Jl. Kemerdekaan",
        phone_number="1234567890",
        unique_id="JD123456789",
        coupon_code="LB35-00001",
        photo_path="/uploads/photo.jpg",
        has_won=False,
        created_at=now,
    )
    assert participant.id == "some-uuid-1234"
    assert participant.ticket_sequence == 1
    assert participant.full_name == "John Doe"
    assert participant.alamat == "Jl. Kemerdekaan"
    assert participant.phone_number == "1234567890"
    assert participant.unique_id == "JD123456789"
    assert participant.coupon_code == "LB35-00001"
    assert participant.photo_path == "/uploads/photo.jpg"
    assert participant.has_won is False
    assert participant.created_at == now
