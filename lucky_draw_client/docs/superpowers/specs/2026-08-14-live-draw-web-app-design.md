# Live Doorprize Web App Design Specification

## Overview
Web application for community event registration and live doorprize draw for HUT Kabupaten Lampung Barat ke-35. Designed as a React 19 + Vite + Tailwind 4 Single Page Application.

## Architecture
- **Approach**: The tablet used by the Bupati acts as the primary presentation screen. 
- **Core Loop**:
  1. Bupati presses "Mulai Undi" on tablet.
  2. Tablet plays Slot Machine animation.
  3. App calls API to get a random winner.
  4. Animation resolves and stops at the winner's ticket number.
  5. Tablet screen is cast/mirrored to the main event screen and livestream.

## Pages & Routing
1. **`/register` (Public Registration)**
   - Fields: Full Name, NIK, Phone Number, Address/Kecamatan, bukti foto mengikuti kegiatan (optional).
   - Validation: Handled by React Hook Form + Zod.
   - Flow: Upon success, redirects to `/ticket/:id`.
2. **`/ticket/:id` (Success & Ticket Page)**
   - Displays: Unique Ticket Number (e.g., LB35-0821).
   - Features: Digital ticket card designed for mobile screenshots.
3. **`/draw` (Admin/Live Draw Presentation)**
   - Display: Landscape layout, full-screen.
   - UI Elements: Current prize selection (subtle dropdown), large Slot Machine animation component, giant "MULAI UNDI" button.

## Components
- `SlotMachine`: Built with Framer Motion. Handles rapid vertical spinning digits and sequential slow-down from left to right.
- `RegistrationForm`: Real-time validation, prevents empty submissions and invalid formats.
- `TicketCard`: Digital ticket UI optimized for mobile screenshots.

## Error Handling & Edge Cases
- **Network Failure During Draw**: If the API request fails or takes longer than 5 seconds, the animation resolves to `? ? ? ?` and displays a graceful "Coba Lagi" button.
- **Duplicate Registration**: Handled via API. Frontend displays "Nomor HP/NIK ini sudah terdaftar" if the API rejects the request.
- **Out of Participants**: If the API returns no available participants, the UI displays "SELESAI".

## Testing Strategy
- Validation testing for forms (empty inputs, invalid numbers).
- Simulation of network failure during the draw animation to ensure the fallback UI triggers correctly.
