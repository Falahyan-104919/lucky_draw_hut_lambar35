import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

import aioboto3
import redis.asyncio as redis
import aio_pika
from lucky_draw_api.routes import router as participants_router
from lucky_draw_api.config import settings

# Global boto3 session
boto_session = aioboto3.Session()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Redis Pool
    app.state.redis = redis.from_url(settings.REDIS_URL)
    
    # 2. Ensure MinIO Bucket Exists
    async with boto_session.client(
        's3',
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
            policy = '{ "Version": "2012-10-17", "Statement": [ { "Action": [ "s3:GetObject" ], "Effect": "Allow", "Principal": { "AWS": [ "*" ] }, "Resource": [ "arn:aws:s3:::' + settings.MINIO_BUCKET + '/*" ] } ] }'
            await s3.put_bucket_policy(Bucket=settings.MINIO_BUCKET, Policy=policy)

    # 3. Initialize RabbitMQ Connection
    app.state.rmq_connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    
    # Create the channel and queue to ensure they exist
    async with app.state.rmq_connection:
        channel = await app.state.rmq_connection.channel()
        await channel.declare_queue("registrations_queue", durable=True)
    
    # Reopen connection for the app to use
    app.state.rmq_connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    
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


@app.get("/")
def read_root():
    return {"message": "Hello from lucky-draw-api!"}
