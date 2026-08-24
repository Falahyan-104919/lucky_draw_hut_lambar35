import asyncio
import csv
import uuid
from pathlib import Path

from sqlalchemy import select

from lucky_draw_api.database import AsyncSessionLocal, engine
from lucky_draw_api.models import Pekon

CSV_PATH = Path(__file__).resolve().parents[3] / "kecamatan-pekon.csv"


async def seed_pekons():
    print(f"Reading CSV from: {CSV_PATH}")
    if not CSV_PATH.exists():
        print(f"CSV not found: {CSV_PATH}")
        return

    try:
        async with AsyncSessionLocal() as session:
            existing_stmt = select(Pekon.kecamatan, Pekon.name)
            result = await session.execute(existing_stmt)
            existing_pekons = set(result.all())

            new_pekons = []
            with open(CSV_PATH, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f, delimiter=";")
                for row in reader:
                    kecamatan = row.get("Kecamatan", "").strip()
                    desa = row.get("Desa/Kelurahan", "").strip()

                    if not kecamatan or not desa:
                        continue

                    if (kecamatan, desa) not in existing_pekons:
                        coupon_index = len(existing_pekons) + len(new_pekons) + 1
                        new_pekons.append(
                            Pekon(
                                id=str(uuid.uuid4()),
                                kecamatan=kecamatan,
                                name=desa,
                                has_won=False,
                                coupon_code=f"PEKON-{coupon_index:04d}",
                            )
                        )

            if new_pekons:
                session.add_all(new_pekons)
                await session.commit()
                print(f"Added {len(new_pekons)} new pekons")
            else:
                print("No new pekons to add")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_pekons())
