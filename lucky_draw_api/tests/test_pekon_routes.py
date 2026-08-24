import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from lucky_draw_api.database import get_db
from lucky_draw_api.main import app
from lucky_draw_api.models import Base, Pekon

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
async def test_list_and_draw_pekon(async_client: AsyncClient):
    # Seed 2 pekons into test DB
    async with TestingSessionLocal() as session:
        session.add_all([
            Pekon(id="pekon-1", kecamatan="Way Tenong", name="Sukaraja", coupon_code="PEKON-0001", has_won=False),
            Pekon(id="pekon-2", kecamatan="Batu Brak", name="Kegeringan", coupon_code="PEKON-0002", has_won=False),
        ])
        await session.commit()

    # List all pekons
    list_res = await async_client.get("/api/pekon")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 2

    # Verify no winners yet
    winners_res = await async_client.get("/api/pekon?winners_only=true")
    assert winners_res.status_code == 200
    assert len(winners_res.json()) == 0

    # Draw 1st pekon via POST
    draw_res = await async_client.post("/api/pekon/draw")
    assert draw_res.status_code == 200
    winner1 = draw_res.json()
    assert winner1["has_won"] is True
    assert winner1["coupon_code"] in ["PEKON-0001", "PEKON-0002"]

    # Winners list should now have 1 winner
    winners_res2 = await async_client.get("/api/pekon?winners_only=true")
    assert winners_res2.status_code == 200
    assert len(winners_res2.json()) == 1
    assert winners_res2.json()[0]["id"] == winner1["id"]

    # Draw 2nd pekon via POST
    draw_res2 = await async_client.post("/api/pekon/draw")
    assert draw_res2.status_code == 200
    winner2 = draw_res2.json()
    assert winner2["id"] != winner1["id"]

    # 3rd draw should fail with 404
    draw_res3 = await async_client.post("/api/pekon/draw")
    assert draw_res3.status_code == 404
    assert draw_res3.json()["detail"] == "No eligible pekons left"
