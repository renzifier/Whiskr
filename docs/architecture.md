## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                        │
│                                                                   │
│  app/page.tsx  (root client component, owns top-level state)    │
│   ├─ Navbar            (search, filters, report/locate actions) │
│   ├─ Sidebar            (Saved / Recently Viewed drawers)       │
│   ├─ MapContainer → WhiskrMap  (Leaflet, dynamic-imported,      │
│   │     ssr:false because Leaflet needs `window`)                │
│   │     └─ PinLayer  (renders markers, applies filters)         │
│   ├─ DetailPanel        (per-report side panel / bottom sheet)  │
│   │     ├─ VoteButtons                                          │
│   │     └─ RescueActions                                        │
│   ├─ AuthModal          (login / signup)                        │
│   └─ ReportForm          (new sighting submission)               │
│                                                                   │
│           all data access goes through lib/supabase/client.ts   │
│                        (anon key, browser SDK)                   │
└───────────────────────────────┬───────────────────────────────┘
                                 │ HTTPS (PostgREST + Realtime WS)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Supabase Project                          │
│  Postgres tables:  reports, profiles, saved_reports, votes,     │
│                     report_contacts                             │
│  Public views:      public_reports, public_profiles             │
│  RPC functions:     accept_rescue, complete_rescue,              │
│                      release_rescue   (assumed SECURITY DEFINER) │
│  Storage buckets:   avatars, report-photos                      │
│  Realtime:          postgres_changes on `reports` (INSERT/UPDATE)│
│  Row Level Security: assumed to gate every table/view above     │
└─────────────────────────────────────────────────────────────────┘
```

**Two Supabase clients exist and matter:**

- `lib/supabase/client.ts` — a browser client (`createBrowserClient`), used everywhere in this codebase since every component here is `"use client"`.
- `lib/supabase/server.ts` — a server client (`createServerClient`) that reads/writes auth cookies via `next/headers`. It isn't called anywhere in the files reviewed, but it's the piece you'd use for Server Components, Route Handlers, or middleware (e.g. protecting server-rendered routes or doing SSR data fetches). If the rest of the app is entirely client-rendered today, this file is set up for future use rather than currently wired in.

**Rendering strategy:** the map (`MapContainer` → `WhiskrMap`) is loaded with `next/dynamic(..., { ssr: false })` because Leaflet touches `window`/`document` at import time and will crash during server rendering.

**Realtime data flow:** on mount, `WhiskrMap` does one bulk fetch of `public_reports` filtered to `active | stale | rescue_accepted`, then opens a Supabase Realtime channel subscribed to raw Postgres `INSERT`/`UPDATE` events on the `reports` table. Terminal statuses (`rescued`, `not_found`, `resolved`) cause the pin to be removed from local state rather than updated. A `rescue-completed` browser `CustomEvent` is used to synchronize the map and the detail panel/sidebar when a rescue is completed elsewhere in the tree — this is a deliberate lightweight pub/sub inside the client instead of prop-drilling a callback through several layers.

**State ownership:** `app/page.tsx` is the single source of truth for session, selected report, filters, search query, sidebar collapse state, saved reports, and recently-viewed history (the last one persisted to `localStorage`, capped at 10 entries). Everything else is presentational or owns only its own local UI state (drag position, modal open/close, form fields).

---

## Tech Stack

| Layer                    | Choice                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Framework                | Next.js 16 (App Router, client components)                                                                           |
| UI                       | React 19, inline styles (no CSS framework component library in use, though Tailwind is present in `devDependencies`) |
| Map                      | Leaflet 1.9 + react-leaflet 5, CARTO dark basemap tiles                                                              |
| Backend                  | Supabase (Postgres, Auth, Storage, Realtime) via `@supabase/ssr` + `@supabase/supabase-js`                           |
| Image cropping           | react-easy-crop                                                                                                      |
| Geocoding / place search | OpenStreetMap Nominatim (public API, called directly from the browser)                                               |
| Language                 | TypeScript                                                                                                           |

---

## Project Structure

Based on the import paths used throughout the components (e.g. `../../../lib/supabase/client`, `./components/layout/navbar`), the app follows this layout:

```
app/
├── layout.tsx                     # root layout, metadata, viewport
├── page.tsx                       # main app shell / state owner
├── globals.css
├── components/
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── iconrail.tsx           # FAB + FilterPanel (shared with navbar)
│   ├── panel/
│   │   └── detailpanel.tsx
│   ├── auth/
│   │   ├── authmodal.tsx
│   │   ├── landing.tsx
│   │   ├── cropmodal.tsx
│   │   └── editprofilemodal.tsx
│   ├── report/
│   │   ├── reportform.tsx
│   │   ├── votebuttons.tsx
│   │   └── rescueactions.tsx
│   └── map/
│       ├── mapcontainer.tsx       # thin wrapper, dynamic-imports the real map
│       ├── whiskrmap.tsx          # Leaflet map, realtime subscription, geolocation
│       └── pinlayer.tsx           # marker rendering + filtering logic
lib/
└── supabase/
    ├── client.ts                  # browser Supabase client
    └── server.ts                  # server Supabase client (cookie-aware)
types.ts (or types/index.ts)       # Report, Profile, RecentlyViewed, CatType, ReportStatus
public/
└── icons/                         # whiskr-icon.png, cat-1.png, cat-2.png, add.png,
                                    # pin-button.png, filter.png, my-reports.png,
                                    # save-button.png, recents-clock.png,
                                    # zoom-in.png, zoom-out.png, still-here.png,
                                    # not-here.png, magnifying-glass.png
```

> The `types.ts` file itself wasn't part of the reviewed files, but its shape can be reconstructed from usage — see [Inferred Backend Schema](#inferred-backend-schema).

---

## Setup Instructions

### 1. Prerequisites

- Node.js 20+ (matches `@types/node: ^20`)
- A Supabase project (free tier is fine to start)
- npm (a `package-lock.json`-style workflow is implied by the plain `npm` scripts; yarn/pnpm would also work but aren't what's configured)

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Both are read via `process.env.NEXT_PUBLIC_...!` in `lib/supabase/client.ts` and `lib/supabase/server.ts` with a non-null assertion — **the app will throw at runtime, not build time, if either is missing**, so double-check them before deploying.

These are the anon/public key and project URL — safe to expose to the browser by design, since Supabase's actual security boundary is RLS, not key secrecy. Do not put the `service_role` key here or anywhere client-reachable.

### 4. Set up the Supabase project

This part isn't in the reviewed source (no SQL files were provided), so you'll need to create it yourself. At minimum, based on everything the client code calls, you need the tables, views, RPCs, and buckets described in [Inferred Backend Schema](#inferred-backend-schema) below, each with RLS policies that match the access patterns documented there. Enable Realtime replication on the `reports` table (Database → Replication in the Supabase dashboard) so `whiskrmap.tsx`'s `postgres_changes` subscription receives events.

### 5. Add icon assets

The app references a fixed set of PNGs under `/public/icons/` (see [Project Structure](#project-structure) for the full list). None were part of the reviewed files — you'll need to supply these or swap the `<img src="/icons/...">` calls for something else before the UI will look right (broken images won't crash anything, but buttons will look empty).

### 6. Run it

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

---
