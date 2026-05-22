# ✈️ SkyAxis — Flight Management PWA

A production-ready Flight Management web application built with Next.js 14, Supabase, Zustand, and Tailwind CSS.

---

## 🚀 Live Demo

> Deploy to Vercel and update this link.

---

## 🔐 Test Account

```
Email:    test@skyaxis.dev
Password: Test@1234!
```

Create this user in your **Supabase → Authentication → Users** dashboard before testing.

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/flight-management-pwa
cd flight-management-pwa
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from **Settings → API**
3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run migrations

In **Supabase → SQL Editor**, run each migration file in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rpc_and_triggers.sql
supabase/migrations/003_seed_data.sql
```

### 4. Enable Realtime

In **Supabase → Database → Replication**, enable Realtime for the `seats` and `bookings` tables (already included in migration 001).

### 5. Create test user

In **Supabase → Authentication → Users → Add User**:
- Email: `test@skyaxis.dev`
- Password: `Test@1234!`

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend & API | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime) |
| State Management | Zustand with persist middleware |
| Styling | Tailwind CSS |
| PWA | next-pwa |
| Language | TypeScript (strict, no `any`) |

---

## 🗄️ Database Schema

```
flights     — flight schedule, routes, pricing, status
seats       — per-flight seat map with class and availability
bookings    — user reservations with PNR code
passengers  — passenger details per booking
reschedules — audit log of rescheduling events
```

**Row Level Security** is enabled on all tables. Users can only access their own bookings, passengers, and reschedules.

---

## 🧠 Zustand Store Design

### `useFlightStore` (persisted, partialised)

```typescript
{
  searchQuery,        // persisted — resumable search after tab close
  selectedFlight,     // persisted — resumable booking flow
  selectedSeat,       // NOT persisted — transient, re-selected each visit
  optimisticSeatId,   // NOT persisted — UI state only
  currentStep,        // persisted — resume booking step
  passengerData,      // NOT persisted — passport_no never touches localStorage
}
```

**`partialize`** explicitly excludes `passengerData` (contains `passport_no`), `selectedSeat`, and `optimisticSeatId` from localStorage.

### `useUserStore` (persisted, partialised)

```typescript
{
  sessionToken,    // persisted — auth token for SSR hydration
  userId,          // persisted
  userEmail,       // persisted
  cachedBookings,  // persisted — enables offline My Bookings page
}
```

**Optimistic seat selection**: when a user taps a seat, `optimisticSeatId` is set immediately in the store, updating the UI before the Supabase write confirms. The seat map shows the selection instantly.

**Store reset**: `resetBookingFlow()` is triggered on booking cancellation and `resetAll()` on logout.

---

## 🔒 Concurrency & Safety

- **Seat reservation**: `reserve_seat` RPC uses `SELECT ... FOR UPDATE` to lock the seat row, preventing double-booking race conditions.
- **Cancellation**: `cancel_booking` RPC atomically updates booking status AND frees the seat in a single transaction.
- **Reschedule**: `reschedule_booking` RPC locks both old and new seats atomically.
- **2-hour rule**: Enforced at both API level (RPC check) and DB level (trigger `enforce_cancellation_window`) — cannot be bypassed.

---

## 📱 PWA Configuration

- **Manifest**: `/public/manifest.json` — name, icons, theme, `display: standalone`
- **Cache strategies**:
  - `StaleWhileRevalidate` for flight search API results
  - `CacheFirst` for `_next/static` and image assets
- **Offline fallback**: `/public/offline.html` — shown when no connectivity
- **My Bookings offline**: booking IDs cached in Zustand persist → localStorage, readable offline
- **Install prompt**: PWA banner shown to first-time mobile visitors

---

## 🛫 Seeded Routes

| Route | Flights |
|---|---|
| BOM → DEL | SA101, SA102 |
| DEL → BLR | SA201, SA202 |
| BLR → HYD | SA301, SA302 |
| MAA → CCU | SA401, SA402 |

Each flight has a full seat map: 8 First, 30 Business, 144 Economy (182 total).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Search / Home
│   ├── search/page.tsx           # Flight results
│   ├── seat-selection/page.tsx   # Seat map
│   ├── booking/page.tsx          # Passenger form
│   ├── confirmation/page.tsx     # PNR + confirmation
│   ├── my-bookings/page.tsx      # Manage bookings
│   ├── reschedule/page.tsx       # Rescheduling
│   ├── auth/page.tsx             # Sign in / Sign up
│   └── api/
│       ├── flights/              # GET flights, GET by ID
│       ├── seats/count/          # GET seat availability count
│       └── bookings/             # GET/POST bookings, PATCH cancel/reschedule
├── components/
│   ├── layout/Navbar.tsx
│   ├── layout/PWAInstallBanner.tsx
│   ├── booking/BookingSteps.tsx
│   ├── flight/FlightCard.tsx
│   ├── seat/SeatMap.tsx          # Realtime seat map
│   └── ui/ConfirmDialog.tsx
├── lib/
│   ├── supabase/client.ts        # Browser client
│   ├── supabase/server.ts        # Server component client
│   ├── supabase/middleware.ts    # Session refresh
│   └── utils.ts
├── store/index.ts                # Zustand stores
└── types/index.ts
```

---

## 🧪 Key Trade-offs & Notes

- **No `any` used** — strict TypeScript throughout.
- **Server Components** are used for all data fetching that requires the service key; anon key is only exposed in client components.
- **RPC functions** are `SECURITY DEFINER` so they run with elevated privileges while keeping RLS intact on direct table access.
- If I had more time, I would add: end-to-end tests with Playwright, email notifications on booking, multi-passenger support UI, and a more detailed Lighthouse PWA audit screenshot.
