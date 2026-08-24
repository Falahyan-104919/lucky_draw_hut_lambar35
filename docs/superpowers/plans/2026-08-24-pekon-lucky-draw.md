# Pekon (Village) Lucky Draw Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the stage Lucky Draw view (`Draw.tsx`) and backend API to support randomized draws for Pekon (villages) alongside Participants, complete with mode switching, dynamic slot machine rolling, tailored winner announcements, and a dual-tab winner history drawer.

**Architecture:** A unified stage view in `Draw.tsx` governed by a `DrawMode` state (`"participant" | "pekon"`), providing smooth segmented navigation, dynamic slot character sizing (11 vs 10 chars), separate React Query mutations for drawing, and a dual-tabbed `WinnerHistoryDrawer`. The backend FastAPI app is extended with `POST /api/pekon/draw` and `GET /api/pekon?winners_only=true`.

**Tech Stack:** React 19, Vite, TanStack Query, Framer Motion, Phosphor Icons (`@phosphor-icons/react`), Tailwind CSS v4, canvas-confetti, FastAPI, SQLAlchemy (Async), aiosqlite / SQLite (tests), uv, pytest.

---

### Task 1: Backend Pekon Endpoints (`GET /api/pekon` & `POST /api/pekon/draw`)

**Files:**
- Modify: `lucky_draw_api/src/lucky_draw_api/routes.py`
- Test: `lucky_draw_api/tests/test_pekon_routes.py`

- [ ] **Step 1: Write failing tests for Pekon endpoints**

Create `lucky_draw_api/tests/test_pekon_routes.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd lucky_draw_api && uv run pytest tests/test_pekon_routes.py`  
Expected: FAIL (405 Method Not Allowed on POST or 404 on GET /api/pekon)

- [ ] **Step 3: Implement Pekon API routes in `lucky_draw_api/src/lucky_draw_api/routes.py`**

Modify `lucky_draw_api/src/lucky_draw_api/routes.py`:
```python
@pekonRouter.get("", response_model=list[PekonResponse])
async def list_pekons(
    winners_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    query = select(Pekon)
    if winners_only:
        query = query.where(Pekon.has_won == True)
    query = query.order_by(Pekon.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@pekonRouter.api_route("/draw", methods=["GET", "POST"], response_model=PekonResponse)
async def draw_pekon(
    db: AsyncSession = Depends(get_db),
):
    query = select(Pekon.id).where(Pekon.has_won == False)
    result = await db.execute(query)
    eligible_ids = result.scalars().all()

    if not eligible_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No eligible pekons left",
        )

    winner_id = random.choice(eligible_ids)
    winner = await db.get(Pekon, winner_id)
    if not winner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No eligible pekons left",
        )

    winner.has_won = True
    await db.commit()
    await db.refresh(winner)
    return winner
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd lucky_draw_api && uv run pytest tests/test_pekon_routes.py`  
Expected: 1 passed in 0.xx s

- [ ] **Step 5: Commit backend changes**

```bash
git add lucky_draw_api/src/lucky_draw_api/routes.py lucky_draw_api/tests/test_pekon_routes.py
git commit -m "feat(api): add pekon listing and post draw endpoint"
```

---

### Task 2: Client Types & State Structure for Draw Modes

**Files:**
- Create: `lucky_draw_client/src/types/draw.ts`

- [ ] **Step 1: Create draw and pekon type definitions**

Create `lucky_draw_client/src/types/draw.ts`:

```typescript
export type DrawMode = "participant" | "pekon";

export interface ParticipantWinner {
  id: string;
  ticket_sequence: number;
  full_name: string;
  alamat: string;
  phone_number: string;
  unique_id: string;
  date_of_birth?: string | null;
  coupon_code: string | null;
  photo_path: string | null;
  has_won: boolean;
  created_at: string;
}

export interface PekonWinner {
  id: string;
  kecamatan: string;
  name: string;
  has_won: boolean;
  coupon_code: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Verify type check passes**

Run: `cd lucky_draw_client && pnpm run build`  
Expected: Build passes without type errors.

- [ ] **Step 3: Commit types**

```bash
git add lucky_draw_client/src/types/draw.ts
git commit -m "feat(client): add draw mode and winner type definitions"
```

---

### Task 3: Dual-Tab Winner History Drawer

**Files:**
- Modify: `lucky_draw_client/src/pages/Draw.tsx`

- [ ] **Step 1: Refactor `WinnerHistoryDrawer` to support Participant & Pekon tabs**

Update `WinnerHistoryDrawer` in `lucky_draw_client/src/pages/Draw.tsx` to:
1. Import `BuildingsIcon` from `@phosphor-icons/react`.
2. Accept prop `activeMode: DrawMode`.
3. Manage internal tab state `const [tab, setTab] = useState<DrawMode>(activeMode)`.
4. Sync internal tab state with `activeMode` when drawer opens or mode changes:
   ```typescript
   useEffect(() => {
     setTab(activeMode);
   }, [activeMode]);
   ```
5. Query participant winners: `useQuery({ queryKey: ["winners", "participants"], queryFn: ... })`.
6. Query pekon winners: `useQuery({ queryKey: ["winners", "pekon"], queryFn: async () => (await axios.get("/api/pekon?winners_only=true")).data })`.
7. Render segmented tabs in `SheetHeader`:
   ```tsx
   <div className="flex bg-black/40 p-1 rounded-xl border border-primary/20 mt-3 gap-1">
     <button
       onClick={() => setTab("participant")}
       className={cn(
         "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
         tab === "participant"
           ? "bg-primary text-black shadow-md"
           : "text-primary/70 hover:text-primary hover:bg-white/5"
       )}
     >
       <UserIcon weight="bold" className="w-4 h-4" />
       Peserta ({participants?.length || 0})
     </button>
     <button
       onClick={() => setTab("pekon")}
       className={cn(
         "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
         tab === "pekon"
           ? "bg-primary text-black shadow-md"
           : "text-primary/70 hover:text-primary hover:bg-white/5"
       )}
     >
       <BuildingsIcon weight="bold" className="w-4 h-4" />
       Pekon ({pekons?.length || 0})
     </button>
   </div>
   ```
8. Render Pekon list item cards with `<BuildingsIcon weight="duotone" />`, `#index + 1`, `coupon_code`, `Pekon ${winner.name}`, and `Kec. ${winner.kecamatan}`.
9. Render Pekon detail dialog containing `<MedalIcon />`, coupon code, Pekon name, Kecamatan, and details.

- [ ] **Step 2: Verify client build passes**

Run: `cd lucky_draw_client && pnpm run build`  
Expected: PASS

- [ ] **Step 3: Commit history drawer changes**

```bash
git add lucky_draw_client/src/pages/Draw.tsx
git commit -m "feat(client): add dual-tab winner history drawer for participants and pekon"
```

---

### Task 4: Draw Mode Switcher, Dynamic Rolling & Winner Reveal

**Files:**
- Modify: `lucky_draw_client/src/pages/Draw.tsx`

- [ ] **Step 1: Integrate mode switcher and dynamic draw engine**

In `lucky_draw_client/src/pages/Draw.tsx`:
1. Add state:
   ```typescript
   const [drawMode, setDrawMode] = useState<DrawMode>("participant");
   const [pekonWinnerData, setPekonWinnerData] = useState<PekonWinner | null>(null);
   const [participantWinnerData, setParticipantWinnerData] = useState<ParticipantWinner | null>(null);
   ```
2. Mode switcher in top bar with safety lock (`disabled={isSpinning}`):
   ```tsx
   <div className="flex bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-primary/30 shadow-xl gap-2 z-30">
     <button
       disabled={isSpinning}
       onClick={() => handleModeChange("participant")}
       className={cn(
         "flex items-center gap-2 px-5 py-2 rounded-xl text-xs md:text-sm font-heading font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed",
         drawMode === "participant"
           ? "bg-gradient-to-b from-[#D4AF37] to-[#B08D28] text-black shadow-lg"
           : "text-[#C09A5B] hover:bg-white/5"
       )}
     >
       <UserIcon weight="bold" className="w-4 h-4" />
       Undian Peserta
     </button>
     <button
       disabled={isSpinning}
       onClick={() => handleModeChange("pekon")}
       className={cn(
         "flex items-center gap-2 px-5 py-2 rounded-xl text-xs md:text-sm font-heading font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed",
         drawMode === "pekon"
           ? "bg-gradient-to-b from-[#D4AF37] to-[#B08D28] text-black shadow-lg"
           : "text-[#C09A5B] hover:bg-white/5"
       )}
     >
       <BuildingsIcon weight="bold" className="w-4 h-4" />
       Undian Pekon
     </button>
   </div>
   ```
3. Implement `handleModeChange(mode: DrawMode)`:
   - Sets `drawMode(mode)`
   - Resets `hasStarted(false)`, `isRevealed(false)`, `errorMsg(null)`, `winnerName(null)`, `pekonWinnerData(null)`, `participantWinnerData(null)`
   - Sets placeholder slot codes: `"???????????"` (11 chars) for participant, `"??????????"` (10 chars) for pekon.
4. Setup mutations:
   - `participantMutation`: calls `POST /api/participants/draw`, on success sets `participantWinnerData`, sets `winnerCode`, triggers confetti, invalidates `["winners", "participants"]`.
   - `pekonMutation`: calls `POST /api/pekon/draw`, on success sets `pekonWinnerData`, sets `winnerCode` (padded to 10 chars), triggers confetti, invalidates `["winners", "pekon"]`.
   - Error handling: if 404, set code to `"--SELESAI--"`, errorMsg to `"Semua peserta sudah mendapatkan hadiah."` or `"Semua pekon sudah mendapatkan hadiah."`.
5. Dynamic Titles:
   - Peserta: `PENGUNDIAN DOORPRIZE PESERTA` & `Nomor undian peserta akan diundi secara acak oleh sistem`
   - Pekon: `PENGUNDIAN DOORPRIZE PEKON` & `Kupon pekon se-Kabupaten Lampung Barat akan diundi secara acak`
6. Dynamic Winner Announcement:
   - For participant: shows `"Selamat Kepada Pemenang"` and `winnerName`.
   - For pekon: shows `"Selamat Kepada Pekon Pemenang"`, `Pekon ${pekonWinnerData.name}`, and `<MapPinIcon weight="duotone" className="w-5 h-5 text-primary inline mr-1.5" /> Kecamatan ${pekonWinnerData.kecamatan}` badge.

- [ ] **Step 2: Verify client build passes**

Run: `cd lucky_draw_client && pnpm run build`  
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Draw view integration**

```bash
git add lucky_draw_client/src/pages/Draw.tsx
git commit -m "feat(client): implement pekon lucky draw view, dynamic rolling and winner reveal"
```

---

### Task 5: End-to-End Build and Test Verification

**Files:**
- Test all components across frontend and backend.

- [ ] **Step 1: Run backend tests**

Run: `cd lucky_draw_api && uv run pytest tests/test_pekon_routes.py`  
Expected: PASS

- [ ] **Step 2: Run frontend build and linter**

Run: `cd lucky_draw_client && pnpm run build`  
Expected: PASS (no compile errors, clean bundle output)

- [ ] **Step 3: Final verification commit if needed**

```bash
git status
```
