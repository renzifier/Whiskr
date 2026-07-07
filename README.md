# Whiskr 🐱

A live, community-driven map for reporting, confirming, and rescuing stray, missing, injured, and colony cats. Anyone can browse the map without an account; signed-in users can drop pins, vote on sightings, volunteer for rescues, save reports, and build a profile.

> **Note on this document:** This README was written by inspecting the client-side source code only (no SQL migrations, RPC definitions, or Supabase dashboard config were provided). Every part of the Supabase schema described below — tables, views, RLS policies, RPC functions, storage buckets — is **inferred from how the frontend calls it**. Sections that depend on server-side configuration are marked accordingly so the next person knows what to verify against the actual Supabase project rather than assume.

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup Instructions](#setup-instructions)
5. [Inferred Backend Schema](#inferred-backend-schema)
6. [Feature Walkthrough](#feature-walkthrough)
7. [Security Report](#security-report)
8. [Known Gaps / Suggested Follow-ups](#known-gaps--suggested-follow-ups)

---

## What This App Does

Whiskr is a Next.js single-page-feeling app (one big client route) built around a full-screen Leaflet map, backed entirely by Supabase (Postgres + Auth + Storage + Realtime). There is no custom backend server — the browser talks directly to Supabase using the anon key, and Postgres Row Level Security (RLS) is expected to be the actual security boundary.

Core loop:

1. Someone spots a cat → drops a pin with a photo, type (`stray` / `missing` / `injured` / `colony`), optional description, and optional contact info.
2. Other users see the pin live on the map (via Supabase Realtime) and can vote **"Still Here"** / **"Gone"** to keep sightings honest.
3. A volunteer taps **"Volunteer to Help"**, which reveals the reporter's private contact info to them only.
4. The volunteer marks the outcome as **Rescued** or **Not Found**, which resolves the report and removes it from the live map.

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

## Inferred Backend Schema

This is a reconstruction of what Supabase must contain, derived purely from client calls. Treat it as a checklist to validate against the real project, not as ground truth.

### Tables & views

**`reports`** (base table) — read indirectly via `public_reports`, written directly for insert (`ReportForm`):

- `id`, `lat`, `lng`, `cat_type` (`stray | missing | injured | colony`), `description`, `photo_url`, `status` (`active | stale | rescue_accepted | rescued | not_found | resolved`), `reporter_id`, `rescuer_id`, `rescue_accepted_at`, `rescue_outcome_at`, `last_confirmed_at`, `created_at`, `updated_at`.

**`public_reports`** (view) — used for the initial map load and for the "helped with N rescues" count. Expected to expose the same columns as `reports` **minus anything sensitive** (there is no contact column on `reports` itself in this design — contact lives separately, see below).

**`profiles`** — `id` (matches `auth.users.id`), `email`, `display_name`, `avatar_url`. Upserted directly by `EditProfileModal`.

**`public_profiles`** (view) — a safe subset (`display_name`, `avatar_url`, `created_at`) used to show reporter/volunteer info to other users without exposing `email`.

**`saved_reports`** — `user_id`, `report_id`. A join table for bookmarking; `page.tsx` explicitly queries through `reports` (not `public_reports`) with an explicit column list rather than `select("*")`, specifically to avoid a `select("*")`-style leak if a sensitive column is ever added to `reports` later.

**`votes`** — `report_id`, `vote` (`still_here | not_here`), plus whatever PK/timestamp columns you add. **No user identifier is sent from the client** — see [Security Report](#security-report) for why that matters.

**`report_contacts`** — `report_id`, `contact` (free text — email or phone). Deliberately isolated from `reports`/`public_reports` and from Realtime broadcasts so contact info is never sent to everyone watching the map; only readable by the reporter and, once a rescue is accepted, the assigned rescuer.

### RPC functions (Postgres functions, called via `supabase.rpc(...)`)

These three are the only writes to rescue state, and are exactly the kind of operation that should **not** be a plain client-side `update()` — they need to atomically check "is this report still open," assign `rescuer_id`, timestamp the transition, and (for `accept_rescue`) hand back the contact info in the same call:

- `accept_rescue(p_report_id) → { success: boolean, error?: string, contact?: string }`
- `complete_rescue(p_report_id, p_outcome: "rescued" | "not_found") → void/error`
- `release_rescue(p_report_id) → void`

These should be `SECURITY DEFINER` functions that internally re-check the caller's identity (`auth.uid()`) and the report's current status server-side, rather than trusting the client's belief about who's assigned.

### Storage buckets

- **`avatars`** — profile photos, uploaded as `{user_id}-{timestamp}.jpg`, public read, `upsert: true`.
- **`report-photos`** — sighting photos, uploaded as `{timestamp}.jpg`, public read.

---

## Feature Walkthrough

**Browsing without an account.** `Landing` is shown whenever `session` is `null`. It doesn't currently block map access for anonymous users — auth is required before dropping a pin or interacting, but the codebase's own marketing copy on the landing page ("Browse and confirm sightings without an account") implies anonymous map viewing should be a first-class flow. Worth double-checking with product whether logged-out users should ever reach the map itself in the current build.

**Reporting a cat.** Click the map → `ReportForm` opens at that lat/lng. A photo is required; description and contact are optional except contact becomes "required" by copy (not enforced in code) when the type is `missing`. Photo is cropped to 16:9 client-side via `CropModal`/`react-easy-crop` before upload, uploaded to `report-photos`, then the report row is inserted, then (if given) contact is inserted separately into `report_contacts`. If the contact insert fails, the report still succeeds — the failure is only logged to the console, not surfaced to the user.

**Voting.** `VoteButtons` shows live "Still Here" / "Gone" counts pulled from `votes` and lets a user vote once per component lifetime (tracked in local React state, not persisted anywhere per-user).

**Volunteering & completing a rescue.** `RescueActions` renders differently depending on `report.status` and whether the current user is `report.rescuer_id`: an "unclaimed" view with a Volunteer button, an "I'm the rescuer" view with Rescued/Not Found/Release, an "someone else is on it" view showing the volunteer's profile and rescue count, and a terminal view once resolved. Accepting a rescue reveals the reporter's contact via the `accept_rescue` RPC response; reopening the panel later re-fetches it from `report_contacts` rather than relying on it staying in memory.

**Search.** The navbar's search box does double duty: it filters currently-loaded pins by description text (client-side, in `PinLayer`) _and_, after a 400ms debounce, queries Nominatim for place names so the user can jump the map to a location.

**Filters.** `IconRail`'s `FilterPanel` (shared between mobile FAB and desktop navbar) lets users multi-select by cat type and by status; both filters are applied client-side in `PinLayer`.

**Saved & Recently Viewed.** Saved reports are a real server-backed join (`saved_reports`); Recently Viewed is a client-only `localStorage` list of lightweight snapshots, capped at 10, deduped by id, updated every time `selectedReport` changes.

**Profile editing.** `EditProfileModal` lets a user set a display name and crop/upload a new avatar, then upserts `profiles`.

**Responsive behavior.** Below 768px width, the map UI switches from a docked sidebar + side detail panel to a swipe-out drawer (`MobileSidebar`) and a draggable bottom sheet (`DetailPanel`'s mobile branch, with manual touch-drag physics and snap points at 45%/88% of viewport height).
