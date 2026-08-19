import asyncio
import json
import logging
from datetime import datetime

import aio_pika
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
                
            except IntegrityError:
                await session.rollback()
                logger.warning(f"Participant {payload['unique_id']} already exists in DB.")
                await message.ack() # Ack it anyway since we already rejected it via Redis in the API
            except Exception as e:
                logger.error(f"Error inserting participant: {e}")
                await message.nack(requeue=True)


async def main():
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    
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
