import io
from unittest.mock import patch
from datetime import datetime, timezone
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from lucky_draw_api.database import get_db
from lucky_draw_api.main import app
from lucky_draw_api.models import Base

DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest_asyncio.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(autouse=True)
def override_db():
    async def _get_test_db():
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_participant(async_client: AsyncClient):
    response = await async_client.post(
        "/api/participants",
        data={
            "full_name": "Test User",
            "alamat": "test@example.com",
            "phone_number": "1234567890",
            "unique_id": "TEST1234",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["alamat"] == "test@example.com"
    assert data["has_won"] is False


@pytest.mark.asyncio
@patch("lucky_draw_api.routes.aiofiles.open")
async def test_register_participant_with_photo(mock_open, async_client: AsyncClient):
    # Setup mock for async with aiofiles.open
    mock_file = mock_open.return_value.__aenter__.return_value
    mock_file.write.return_value = None

    file_data = io.BytesIO(b"fake image data")
    response = await async_client.post(
        "/api/participants",
        data={
            "full_name": "Photo User",
            "alamat": "photo@example.com",
            "phone_number": "0987654321",
            "unique_id": "PHOTO123",
        },
        files={"photo": ("avatar.jpg", file_data, "image/jpeg")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Photo User"
    assert data["photo_path"] is not None
    assert "/uploads/photos" in data["photo_path"]


@pytest.mark.asyncio
async def test_register_duplicate_unique_id(async_client: AsyncClient):
    # First registration
    await async_client.post(
        "/api/participants",
        data={
            "full_name": "User One",
            "alamat": "user1@example.com",
            "phone_number": "1111111111",
            "unique_id": "DUPID",
        },
    )
    # Duplicate unique_id
    response = await async_client.post(
        "/api/participants",
        data={
            "full_name": "User Two",
            "alamat": "user2@example.com",
            "phone_number": "2222222222",
            "unique_id": "DUPID",
        },
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Unique ID already exists"


@pytest.mark.asyncio
async def test_list_participants(async_client: AsyncClient):
    # Register 2 participants
    await async_client.post(
        "/api/participants",
        data={
            "full_name": "Alice",
            "alamat": "alice@example.com",
            "phone_number": "111",
            "unique_id": "A1",
        },
    )
    await async_client.post(
        "/api/participants",
        data={
            "full_name": "Bob",
            "alamat": "bob@example.com",
            "phone_number": "222",
            "unique_id": "B1",
        },
    )

    response = await async_client.get("/api/participants")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["full_name"] == "Alice"
    assert data[1]["full_name"] == "Bob"


@pytest.mark.asyncio
async def test_register_participant_photo_size_exceeded(async_client: AsyncClient):
    file_data = io.BytesIO(b"1" * (5 * 1024 * 1024 + 1))  # 5MB + 1 byte
    response = await async_client.post(
        "/api/participants",
        data={
            "full_name": "Large Photo User",
            "alamat": "largephoto@example.com",
            "phone_number": "1234567890",
            "unique_id": "LARGEPHOTO123",
        },
        files={"photo": ("large.jpg", file_data, "image/jpeg")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "File size exceeds the 2MB limit"


@pytest.mark.asyncio
async def test_register_participant_invalid_mime_type(async_client: AsyncClient):
    file_data = io.BytesIO(b"fake pdf data")
    response = await async_client.post(
        "/api/participants",
        data={
            "full_name": "Invalid Mime User",
            "alamat": "invalidmime@example.com",
            "phone_number": "0987654321",
            "unique_id": "INVALIDMIME123",
        },
        files={"photo": ("document.pdf", file_data, "application/pdf")},
    )
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_draw_winner_success_and_depletion(async_client: AsyncClient):
    # Register 3 participants
    participants_data = [
        {"full_name": "User 1", "alamat": "u1@example.com", "phone_number": "111", "unique_id": "U1"},
        {"full_name": "User 2", "alamat": "u2@example.com", "phone_number": "222", "unique_id": "U2"},
        {"full_name": "User 3", "alamat": "u3@example.com", "phone_number": "333", "unique_id": "U3"},
    ]
    for data in participants_data:
        res = await async_client.post("/api/participants", data=data)
        assert res.status_code == 201

    drawn_ids = set()
    for _ in range(3):
        res = await async_client.post("/api/participants/draw")
        assert res.status_code == 200
        winner = res.json()
        assert winner["has_won"] is True
        assert winner["id"] not in drawn_ids
        drawn_ids.add(winner["id"])

    assert len(drawn_ids) == 3

    # 4th draw should return 404 because no eligible participants are left
    res = await async_client.post("/api/participants/draw")
    assert res.status_code == 404
    assert res.json()["detail"] == "No eligible participants left"


@pytest.mark.asyncio
async def test_draw_no_participants(async_client: AsyncClient):
    res = await async_client.post("/api/participants/draw")
    assert res.status_code == 404
    assert res.json()["detail"] == "No eligible participants left"

