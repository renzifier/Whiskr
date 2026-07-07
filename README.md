# Whiskr 🐱

A live, community-driven map for reporting, confirming, and rescuing stray, missing, injured, and colony cats. Anyone can browse the map without an account; signed-in users can drop pins, vote on sightings, volunteer for rescues, save reports, and build a profile.

> **Note on this document:** This README was written by inspecting the client-side source code only (no SQL migrations, RPC definitions, or Supabase dashboard config were provided). Every part of the Supabase schema described below — tables, views, RLS policies, RPC functions, storage buckets — is **inferred from how the frontend calls it**. Sections that depend on server-side configuration are marked accordingly so the next person knows what to verify against the actual Supabase project rather than assume.

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [Inferred Backend Schema](#inferred-backend-schema)
7. [Feature Walkthrough](#feature-walkthrough)
8. [Security Report](#security-report)
9. [Known Gaps / Suggested Follow-ups](#known-gaps--suggested-follow-ups)

---

## What This App Does

Whiskr is a Next.js single-page-feeling app (one big client route) built around a full-screen Leaflet map, backed entirely by Supabase (Postgres + Auth + Storage + Realtime). There is no custom backend server — the browser talks directly to Supabase using the anon key, and Postgres Row Level Security (RLS) is expected to be the actual security boundary.

Core loop:

1. Someone spots a cat → drops a pin with a photo, type (`stray` / `missing` / `injured` / `colony`), optional description, and optional contact info.
2. Other users see the pin live on the map (via Supabase Realtime) and can vote **"Still Here"** / **"Gone"** to keep sightings honest.
3. A volunteer taps **"Volunteer to Help"**, which reveals the reporter's private contact info to them only.
4. The volunteer marks the outcome as **Rescued** or **Not Found**, which resolves the report and removes it from the live map.

---

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

---

## Security Report

This section evaluates what's verifiable from the client code. Anything that ultimately depends on RLS policies, RPC function bodies, or storage bucket policies **cannot be fully verified without that server-side code** — those items are flagged as "depends on backend config" rather than pass/fail.

### Things done well

- **Contact info is isolated.** Reporter contact lives in its own `report_contacts` table, is never selected as part of `public_reports`, and is never pushed over the `reports` Realtime channel. This is a deliberate design (see the comment in `page.tsx` and `rescueactions.tsx`) and is the right pattern for keeping PII out of a broadcast channel that literally everyone on the map is subscribed to.
- **State-changing rescue transitions go through RPCs, not raw table writes.** `accept_rescue` / `complete_rescue` / `release_rescue` being RPCs (rather than the client doing `supabase.from("reports").update(...)`) means the authorization and status-transition logic can live server-side, where it can't be bypassed by a modified client. This only holds if those functions actually re-check `auth.uid()` and current status server-side — verify the function bodies, since an RPC that just runs the client-supplied values without checks provides no more protection than a direct table write.
- **`saved_reports` explicitly avoids `select("*")`**, listing exact columns to reduce the blast radius if a sensitive column is ever added to `reports`.
- **No secrets in the client bundle.** Only the Supabase anon key and URL are exposed, which is the intended public-facing credential; the actual security boundary is meant to be RLS.
- **React's default escaping** means user-supplied text (`description`, `display_name`) is never at risk of DOM-based XSS through normal JSX rendering — no `dangerouslySetInnerHTML` is used for user content anywhere in the reviewed files. (`dangerouslySetInnerHTML`-equivalent usage does exist for Leaflet's `L.divIcon({ html: ... })` in `pinlayer.tsx` and `whiskrmap.tsx`, but the interpolated values there are fixed labels/colors from internal maps, not raw user input — so this is safe as written, but should stay that way if anyone edits it.)

### Risks and gaps worth addressing

1. **Vote spam has no server-side dedup.** `VoteButtons` inserts into `votes` with no user identifier and only prevents a second click via local component state (`voted`), which resets on every page reload or new tab. Anyone can vote an unlimited number of times by refreshing. If ballot-stuffing matters for this feature, `votes` needs either a `user_id` unique constraint per report (requiring auth) or an IP/device-based rate limit enforced server-side — client-side "already voted" flags provide no real protection.

2. **Anonymous photo uploads to `report-photos` with a collision-prone filename.** `ReportForm` uploads to `report-photos` using `${Date.now()}.jpg` with no user-id prefix and no auth requirement — `reporter_id` is explicitly allowed to be `null` (`reporter_id: user?.id ?? null`). Two uploads in the same millisecond overwrite each other, and there's nothing here to stop anonymous, unlimited image uploads (potential storage-cost or abuse vector). Consider prefixing with a UUID and/or requiring auth for report creation, and confirm the storage bucket's RLS policy doesn't allow arbitrary overwrite/delete of other users' files.

3. **The `report_contacts` insert is a direct client-side table write, not an RPC.** `ReportForm` inserts `{ report_id, contact }` straight from the browser after creating the report. This is safe **only if** RLS on `report_contacts` restricts inserts to rows where `report_id` belongs to a report the current session just created (or, for anonymous reporters, some other guarantee) — otherwise anything with the anon key could attach arbitrary contact strings to _any_ report_id, including ones they don't own. Worth explicitly testing this policy.

4. **Realtime is subscribed to the raw `reports` table, not `public_reports`.** `whiskrmap.tsx` opens `postgres_changes` on `public.reports` directly for `INSERT`/`UPDATE`. The _initial_ load correctly uses the `public_reports` view, but the ongoing realtime stream bypasses that view entirely. If Supabase Realtime is configured to respect RLS on the base table for your project, this is fine; if not (or if a future column is added to `reports` and forgotten in the view), realtime updates could leak more than the view intends. Recommend either confirming Realtime's RLS enforcement is on for this table, or (more robustly) creating/using a realtime-safe publication that mirrors `public_reports`'s column set.

5. **Nominatim (OpenStreetMap) is called directly from the browser**, both for reverse geocoding (`detailpanel.tsx`) and for place search (`navbar.tsx`). This exposes end-user IPs to a third party on every keystroke-debounced search and every report view, and Nominatim's usage policy asks for a valid `User-Agent`/referer and discourages heavy client-side autocomplete use — high traffic could get the app's IP range rate-limited or blocked. Consider proxying these calls through a server route with caching, both for ToS compliance and to control the debounce/volume server-side.

6. **The `avatarFile`/report photo filename `..` check in `editprofilemodal.tsx` is dead code.** It checks `filename.includes("..")` on a string built entirely from `session.user.id` and `Date.now()` — values the app controls, not user input — so it can never trigger and provides no actual protection. It's harmless but reads as a security control that isn't one; if the intent was to guard against path traversal in filenames, that concern would need to move to wherever user-influenced input (e.g. `display_name`) might ever end up in a storage path, which currently it doesn't.

7. **No visible client-side validation ceiling matches the DB.** `description` is capped at 300 chars client-side (`maxLength={300}`) which is good UX, but that's not a security control — confirm the same limit (or a reasonable one) is enforced by a DB constraint, since `maxLength` can be trivially bypassed by anyone not using the form UI.

8. **Auth rate-limiting is entirely delegated to Supabase.** `AuthModal` has no client-side throttling on login/signup attempts. This is typically fine since Supabase Auth applies its own rate limits, but it's worth confirming those defaults haven't been loosened for this project.

### Not evaluable from this code alone

- Whether RLS is actually enabled and correctly scoped on every table (`reports`, `profiles`, `saved_reports`, `votes`, `report_contacts`) and view.
- Whether the three rescue RPCs are `SECURITY DEFINER` and independently re-verify the caller and report state, or whether they simply trust their arguments.
- Storage bucket policies for `avatars` and `report-photos` (public-read is fine; the write/overwrite/delete policies are what matter).
- Whether `public_reports` and `public_profiles` are actually views with restricted columns, or full-access aliases — the naming and comments in the code strongly imply the former, but this file set contains no SQL to confirm it.

---

## Known Gaps / Suggested Follow-ups

- `lib/supabase/server.ts` exists but isn't used anywhere in the reviewed files — confirm whether it's intentionally unused today (pure client-rendered app) or whether some server-rendered route/middleware was expected to exist and is missing.
- `types.ts` wasn't part of the reviewed file set; the shape of `Report`, `Profile`, `RecentlyViewed`, `CatType`, and `ReportStatus` above was reconstructed from usage and should be checked against the real file.
- No automated tests were found among the reviewed files.
- Styling is 100% inline `style={{...}}` objects with hardcoded hex colors, except `sidebar.tsx`'s mobile drawer, which uses CSS custom properties (`var(--color-surface)`, etc.) that aren't defined anywhere else in the reviewed files — worth confirming those variables are actually declared in `globals.css`, or the mobile drawer will render with browser-default fallback colors.
- Tailwind is a dependency but no Tailwind class names appear in any reviewed component — likely present for future use or a partial migration.
