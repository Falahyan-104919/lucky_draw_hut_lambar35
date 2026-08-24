# Pekon (Village) Lucky Draw View Design Specification

**Date:** 2026-08-24  
**Status:** Approved  
**Target:** `lucky_draw_client` & `lucky_draw_api`

---

## 1. Overview & Goals

The Lucky Draw application for HUT Lampung Barat 35 is currently configured to conduct randomized lucky draws for individual **Participants** (`Participant`). 

This specification defines the extension of the draw system to support a secondary category: **Pekon (Villages)** (`Pekon`). An operator on stage can seamlessly toggle between Participant and Pekon draw modes without page reloads, trigger randomized draws, display tailored celebratory announcements, and view dedicated winner histories.

---

## 2. Architecture & Draw Mode State Management

### 2.1 Draw Mode State Model
A unified mode selector state drives the UI and API interaction on the stage view (`lucky_draw_client/src/pages/Draw.tsx`):

```typescript
type DrawMode = "participant" | "pekon";
```

* **Default Mode:** `"participant"`
* **Mode State Persistence:** Stored in component local state.
* **Safety Lock:** Mode switching is disabled whenever an active draw roll is in progress (`isSpinning === true`).
* **State Reset on Switch:**
  * `isRevealed` -> `false`
  * `hasStarted` -> `false`
  * `errorMsg` -> `null`
  * `winnerData` -> `null`
  * Slot character strip placeholder:
    * Participant: 11 characters (`"???????????"`)
    * Pekon: 10 characters (`"??????????"`)

---

## 3. Backend API Specifications (`lucky_draw_api`)

### 3.1 Pekon Winner Draw
* **Endpoint:** `POST /api/pekon/draw` (with `GET /api/pekon/draw` preserved for backwards compatibility)
* **Description:** Randomly selects one eligible Pekon (`has_won == False`), sets `has_won = True`, persists the change, and returns the winner.
* **Response Model:** `PekonResponse`
  ```json
  {
    "id": "uuid-string",
    "kecamatan": "Way Tenong",
    "name": "Sukaraja",
    "has_won": true,
    "coupon_code": "PEKON-0001",
    "created_at": "2026-08-24T09:24:09.389813+07:00"
  }
  ```
* **Error Response (404):**
  ```json
  {
    "detail": "No eligible pekons left"
  }
  ```

### 3.2 Pekon Listing & Winners History
* **Endpoint:** `GET /api/pekon`
* **Query Parameters:** `winners_only: bool = False`
* **Description:** Returns all Pekons or only winners (`has_won == True`), ordered by creation date descending.
* **Response Model:** `list[PekonResponse]`

---

## 4. Frontend Component Specifications (`lucky_draw_client`)

### 4.1 Header Navigation & Mode Switcher
* **Position:** Centered or placed in the top bar alongside event branding.
* **Appearance:** Segmented pill control with gold borders (`border-primary/40`), dark semi-transparent background (`bg-black/40`), and active gold indicator.
* **Icons (Phosphor Icons):**
  * Peserta Tab: `<UserIcon weight="bold" className="w-4 h-4 mr-2" />`
  * Pekon Tab: `<BuildingsIcon weight="bold" className="w-4 h-4 mr-2" />`
* **Dynamic Stage Titles:**
  * **Peserta Mode:**
    * Title: `PENGUNDIAN DOORPRIZE PESERTA`
    * Subtitle: `Nomor kupon peserta akan diundi secara acak oleh sistem`
  * **Pekon Mode:**
    * Title: `PENGUNDIAN DOORPRIZE PEKON`
    * Subtitle: `Kupon pekon se-Kabupaten Lampung Barat akan diundi secara acak`

### 4.2 Dynamic Slot Machine (`RollingChar`)
* Slot length automatically adapts to the drawn item:
  * Participant Coupon: 11 characters (e.g. `LAMBAR-00001`)
  * Pekon Coupon: 10 characters (e.g. `PEKON-0001`)
* Responsive box sizing and character spinning transitions are retained.
* Stop delays are calculated dynamically based on slot index (`index * 1000ms`).

### 4.3 Winner Announcement Layout
After all slot characters lock into place:
* **Participant Winner Announcement:**
  * Header: `SELAMAT KEPADA PEMENANG`
  * Main Headline: `{winner.full_name}` (e.g. **AHMAD FAUZI**)
* **Pekon Winner Announcement:**
  * Header: `SELAMAT KEPADA PEKON PEMENANG`
  * Main Headline: `Pekon {winner.name}` (e.g. **PEKON SUKARAJA**)
  * Location Subtitle with `<MapPinIcon weight="duotone" />`: `Kecamatan {winner.kecamatan}`
* **Celebration:** Triggers canvas-confetti bursts with multi-angle fountain effect for 3 seconds.

### 4.4 Winner History Drawer (`WinnerHistoryDrawer`)
* **Trigger:** Floating bottom-right action button `<ListIcon /> Riwayat`.
* **Drawer Navigation:** Contains internal segmented tabs in the sheet header:
  * Tab 1: `<UserIcon /> Peserta` -> Queries `["winners", "participants"]` (`/api/participants?winners_only=true`)
  * Tab 2: `<BuildingsIcon /> Pekon` -> Queries `["winners", "pekon"]` (`/api/pekon?winners_only=true`)
* **Default Active Tab:** Synchronized with the current stage `drawMode` when the drawer is opened.
* **Pekon Winner List Item:**
  * Icon badge: `<BuildingsIcon weight="duotone" className="w-6 h-6 text-primary" />` inside rounded gold-bordered avatar container.
  * Details: Rank `#index + 1`, Coupon Code `PEKON-XXXX`, Pekon Name (`Pekon [name]`), Kecamatan (`Kec. [kecamatan]`).
* **Pekon Winner Detail Dialog:**
  * Shows on click of any list item.
  * Displays `<MedalIcon weight="fill" />`, Coupon Code card, Pekon name, Kecamatan name, and timestamp.

---

## 5. Error Handling & Edge Cases

| Scenario | Handled Behavior |
| :--- | :--- |
| **All Pekons Drawn (404)** | Display `--SELESAI--` in slots and error toast/banner *"Semua pekon sudah mendapatkan hadiah."* |
| **Network / Server Error** | Display `---ERROR---` in slots and show backend detail error message. |
| **Mid-spin Tab Switching** | Mode switcher buttons are disabled while `isSpinning === true`. |
| **Short/Long Coupon Codes** | Dynamically padded or trimmed to maintain consistent slot array rendering. |

---

## 6. Testing & Verification

1. **Backend Verification:**
   * Test `POST /api/pekon/draw` with FastAPI test client or curl.
   * Test `GET /api/pekon?winners_only=true` verifying empty initially, populated after draw.
2. **Frontend UI Verification:**
   * Verify tab switching between Participant and Pekon modes.
   * Verify slot character counts (11 vs 10) and rolling animations.
   * Verify winner reveal cards (Name for Participant vs Pekon Name + Kecamatan for Pekon).
   * Verify Winner History Drawer tab switching and detail modals for both modes.
