import asyncio
import json
import logging
from datetime import datetime

import aio_pika
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from lucky_draw_api.config import settings
from lucky_draw_api.database import AsyncSessionLocal
from lucky_draw_api.models import Participant

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process(ignore_processed=True):
        payload = json.loads(message.body.decode())
        
        async with AsyncSessionLocal() as session:
            try:
                participant = Participant(
                    id=payload["id"],
                    ticket_sequence=payload["ticket_sequence"],
                    full_name=payload["full_name"],
                    alamat=payload["alamat"],
                    phone_number=payload["phone_number"],
                    date_of_birth=payload["date_of_birth"],
                    unique_id=payload["unique_id"],
                    photo_path=payload["photo_path"],
                    coupon_code=payload["coupon_code"],
                    has_won=payload["has_won"],
                    created_at=datetime.fromisoformat(payload["created_at"])
                )
                session.add(participant)
                await session.commit()
                logger.info(f"Inserted participant {participant.unique_id}")
                await message.ack()
                
            except IntegrityError as e:
                await session.rollback()
                err_str = str(e).lower()
                if "unique_id" in err_str:
                    logger.warning(
                        f"Participant {payload['unique_id']} already exists in DB."
                    )
                    await message.ack()
                elif "ticket_sequence" in err_str or "coupon_code" in err_str:
                    logger.warning(
                        f"Sequence collision for {payload['unique_id']} (seq {payload.get('ticket_sequence')}). Resolving next available sequence..."
                    )
                    result = await session.execute(
                        text("SELECT COALESCE(MAX(ticket_sequence), 0) FROM participants")
                    )
                    new_seq = (result.scalar() or 0) + 1
                    participant.ticket_sequence = new_seq
                    participant.coupon_code = f"LB35-{new_seq:06d}"
                    session.add(participant)
                    await session.commit()
                    logger.info(
                        f"Successfully recovered and inserted participant {participant.unique_id} with seq {new_seq} ({participant.coupon_code})"
                    )
                    await message.ack()
                else:
                    logger.error(
                        f"IntegrityError inserting participant {payload.get('unique_id')}: {e}"
                    )
                    await message.ack()
            except Exception as e:
                logger.error(f"Error inserting participant: {e}")
                await message.nack(requeue=True)


async def get_connection(
    max_retries: int = 30, retry_interval: float = 2.0
) -> aio_pika.abc.AbstractRobustConnection:
    """Connect to RabbitMQ with automatic retries for initial startup."""
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to RabbitMQ (attempt {attempt}/{max_retries})...")
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            logger.info("Successfully connected to RabbitMQ.")
            return connection
        except (aio_pika.exceptions.AMQPConnectionError, ConnectionError, OSError) as e:
            if attempt == max_retries:
                logger.error(
                    f"Could not connect to RabbitMQ after {max_retries} attempts: {e}"
                )
                raise
            logger.warning(
                f"RabbitMQ not ready yet ({e}). Retrying in {retry_interval}s..."
            )
            await asyncio.sleep(retry_interval)


async def main():
    connection = await get_connection()
    
    async with connection:
        channel = await connection.channel()
        # Ensure queue exists
        queue = await channel.declare_queue("registrations_queue", durable=True)
        
        logger.info("Worker started. Listening for registrations...")
        
        # Start consuming (prefetch_count ensures we only take a few at a time to not overload MySQL)
        await channel.set_qos(prefetch_count=50) 
        await queue.consume(process_message)
        
        # Run forever
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
