import json
import os
import random
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

import aio_pika
import aioboto3
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lucky_draw_api.config import settings
from lucky_draw_api.database import get_db
from lucky_draw_api.models import Participant
from lucky_draw_api.schemas import ParticipantCreate, ParticipantResponse

router = APIRouter(prefix="/api/participants", tags=["participants"])


class UploadURLResponse(BaseModel):
    url: str
    object_name: str


@router.get("/upload-url", response_model=UploadURLResponse)
async def get_upload_url(content_type: str = Query("image/jpeg")):
    """Generate a pre-signed URL for direct MinIO uploads"""
    boto_session = aioboto3.Session()

    # Extract extension from content type if possible
    ext = "jpg"
    if content_type == "image/png":
        ext = "png"
    elif content_type == "image/webp":
        ext = "webp"

    object_name = f"{uuid.uuid4()}.{ext}"

    async with boto_session.client(
        "s3",
        endpoint_url=settings.MINIO_PUBLIC_ENDPOINT,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    ) as s3:
        url = await s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.MINIO_BUCKET,
                "Key": object_name,
                "ContentType": content_type,
            },
            ExpiresIn=300,  # 5 minutes
        )

    return UploadURLResponse(url=url, object_name=object_name)


@router.post(
    "", response_model=ParticipantResponse, status_code=status.HTTP_202_ACCEPTED
)
async def register_participant(
    participant: ParticipantCreate,
    request: Request,
):
    redis = request.app.state.redis
    rmq_conn = request.app.state.rmq_connection

    # Generate composite unique_id from full_name and date_of_birth
    normalized_name = participant.full_name.strip().lower().replace(" ", "")
    unique_id = f"{normalized_name}_{participant.date_of_birth}"

    # 1. Quick deduplication check in Redis (O(1))
    is_new = await redis.sadd("registered_unique_ids", unique_id)
    if not is_new:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Participant already registered",
        )

    # 2. Get sequence number from Redis (O(1))
    seq = await redis.incr("ticket_sequence_counter")
    coupon_code = f"LB35-{seq:06d}"

    # 3. Build payload for Message Queue
    participant_id = str(uuid.uuid4())
    # Note: participant.photo_url here is expected to just be the object_name returned from /upload-url
    photo_path = (
        f"{settings.MINIO_PUBLIC_ENDPOINT}/{settings.MINIO_BUCKET}/{participant.photo_url}"
        if participant.photo_url
        else None
    )

    payload = {
        "id": participant_id,
        "ticket_sequence": seq,
        "full_name": participant.full_name,
        "alamat": participant.alamat,
        "phone_number": participant.phone_number,
        "date_of_birth": participant.date_of_birth,
        "unique_id": unique_id,
        "photo_path": photo_path,
        "coupon_code": coupon_code,
        "has_won": False,
        "created_at": datetime.now(ZoneInfo("Asia/Jakarta")).isoformat(),
    }

    # 4. Push to RabbitMQ
    async with rmq_conn.channel() as channel:
        message = aio_pika.Message(body=json.dumps(payload).encode())
        await channel.default_exchange.publish(
            message,
            routing_key="registrations_queue",
        )

    # 5. Return success instantly (Status 202 Accepted)
    return payload


@router.get("", response_model=list[ParticipantResponse])
async def list_participants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    winners_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    query = select(Participant)
    if winners_only:
        query = query.where(Participant.has_won == True)

    query = query.order_by(Participant.id.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    participants = result.scalars().all()
    return participants


@router.get("/{participant_id}", response_model=ParticipantResponse)
async def get_participant(
    participant_id: str,
    db: AsyncSession = Depends(get_db),
):
    participant = await db.get(Participant, participant_id)
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )
    return participant


@router.post("/draw", response_model=ParticipantResponse)
async def draw_winner(
    db: AsyncSession = Depends(get_db),
):
    query = select(Participant.id).where(Participant.has_won == False)
    result = await db.execute(query)
    eligible_ids = result.scalars().all()

    if not eligible_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No eligible participants left",
        )

    winner_id = random.choice(eligible_ids)
    winner = await db.get(Participant, winner_id)
    if not winner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No eligible participants left",
        )

    winner.has_won = True
    await db.commit()
    await db.refresh(winner)
    return winner
