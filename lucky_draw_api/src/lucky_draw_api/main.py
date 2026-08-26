import os
from contextlib import asynccontextmanager

import aio_pika
import aioboto3
import redis.asyncio as redis
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from lucky_draw_api.config import settings
from lucky_draw_api.routes import pekonRouter
from lucky_draw_api.routes import router as participants_router

from sqlalchemy import text
from lucky_draw_api.database import AsyncSessionLocal

# Global boto3 session
boto_session = aioboto3.Session()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Redis Pool & Sync with DB
    app.state.redis = redis.from_url(settings.REDIS_URL)

    try:
        async with AsyncSessionLocal() as db:
            # Sync max sequence counter to avoid sequence collisions
            result = await db.execute(
                text("SELECT COALESCE(MAX(ticket_sequence), 0) FROM participants")
            )
            max_seq = result.scalar() or 0
            current_seq_str = await app.state.redis.get("ticket_sequence_counter")
            current_seq = int(current_seq_str) if current_seq_str else 0
            if max_seq > current_seq:
                await app.state.redis.set("ticket_sequence_counter", max_seq)

            # Sync registered unique IDs to Redis set for instant deduplication
            result = await db.execute(text("SELECT unique_id FROM participants"))
            unique_ids = [r[0] for r in result.fetchall() if r[0]]
            if unique_ids:
                await app.state.redis.sadd("registered_unique_ids", *unique_ids)
    except Exception as e:
        print(f"Warning: Failed to sync Redis with DB on startup: {e}")

    # 2. Ensure MinIO Bucket Exists
    async with boto_session.client(
        "s3",
        endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    ) as s3:
        try:
            await s3.head_bucket(Bucket=settings.MINIO_BUCKET)
        except Exception:
            # Bucket doesn't exist, create it
            await s3.create_bucket(Bucket=settings.MINIO_BUCKET)

            # Set public read policy for the bucket
            policy = (
                '{ "Version": "2012-10-17", "Statement": [ { "Action": [ "s3:GetObject" ], "Effect": "Allow", "Principal": { "AWS": [ "*" ] }, "Resource": [ "arn:aws:s3:::'
                + settings.MINIO_BUCKET
                + '/*" ] } ] }'
            )
            await s3.put_bucket_policy(Bucket=settings.MINIO_BUCKET, Policy=policy)

    # 3. Initialize RabbitMQ Connection with retry
    for attempt in range(1, 31):
        try:
            app.state.rmq_connection = await aio_pika.connect_robust(
                settings.RABBITMQ_URL
            )
            break
        except (
            aio_pika.exceptions.AMQPConnectionError,
            ConnectionError,
            OSError,
        ):
            if attempt == 30:
                raise
            import asyncio
            await asyncio.sleep(2)

    # Ensure queue exists without prematurely closing connection
    channel = await app.state.rmq_connection.channel()
    await channel.declare_queue("registrations_queue", durable=True)
    await channel.close()

    yield

    # Cleanup
    await app.state.redis.close()
    await app.state.rmq_connection.close()


app = FastAPI(
    title="Lucky Draw API",
    description="API for the Lucky Draw application",
    version="0.1.0",
    lifespan=lifespan,
)

app.mount("/uploads", StaticFiles(directory="uploads", check_dir=False), name="uploads")

app.include_router(participants_router)
app.include_router(pekonRouter)


@app.get("/")
def read_root():
    return {"message": "Hello from lucky-draw-api!"}
