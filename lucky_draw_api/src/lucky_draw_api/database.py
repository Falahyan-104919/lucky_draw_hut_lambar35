from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from lucky_draw_api.config import settings

# Create the async engine
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# Create a session factory
AsyncSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False
)

# Dependency to get the DB session in FastAPI routes
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
