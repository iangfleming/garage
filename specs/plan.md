# Garage — Implementation Plan

A public gallery of personal bicycles. Anonymous visitors browse; the owner (a single
allowed email) signs in via Supabase magic link to add / edit / delete bikes inline.

## Decisions (locked)

- **Backend:** Supabase, **local CLI only** for now (`supabase start` / `db reset`). A cloud
  project is wired up later at deploy time.
- **Repo:** **Single SvelteKit app at root** (no workspaces).
- **Deploy target:** **Netlify** (`adapter-netlify` + `netlify.toml`). Local dev runs against
  local Supabase; cloud project + env swap is a deploy-time follow-up.
- **Images:** **Supabase Storage** bucket `bike-images` (public read, owner-only write);
  `bikes.image_path` stores the object path.
- **Bike URL:** **UUID** — `/[id]`.
- **Owner email:** `fyedka2@gmail.com` (the only email that can edit).
- **Aesthetic:** clean, dark, image-forward (to be refined).

## Repository layout

```
Garage/
  specs/                    # intial-spec.md, plan.md
  package.json             # single app; scripts: dev/build/preview/check
  svelte.config.js         # adapter-netlify
  vite.config.ts           # sveltekit plugin, runes mode forced
  tsconfig.json            # strict, extends .svelte-kit/tsconfig.json
  .nvmrc                   # 22
  .editorconfig            # tabs
  .gitignore
  .env.example             # PUBLIC_SUPABASE_URL/ANON_KEY + SUPABASE_SERVICE_ROLE_KEY
  netlify.toml             # base=/, publish=build
  src/
    app.html  app.d.ts     # Locals: { supabase, user }
    hooks.server.ts        # SSR supabase client + locals.user
    routes/
      +layout.svelte       # global styles
      +layout.server.ts    # exposes { user, isOwner }
      +page.svelte         # gallery grid (+ Add-bike tile when owner)
      +page.server.ts      # load bikes
      [id]/+page.svelte    # detail: image + inline-editable fields
      [id]/+page.server.ts
      login/+page.svelte   # magic-link email form
      login/+page.server.ts   # signInWithOtp action
      auth/callback/+server.ts  # exchangeCodeForSession -> redirect /
      styles.css
    lib/
      supabase.ts  supabaseAuth.ts  supabaseAdmin.ts  env.ts  envServer.ts
      database.types.ts    # generated via `supabase gen types`
      components/          # BikeCard, InlineText, ImageUpload, etc.
  supabase/
    config.toml
    migrations/            # numbered SQL
    seed.sql               # owner email + sample bikes
```

## Backend — data model & migrations

Numbered-migration + RLS + grants style (mirrors the splitline reference project).

- **`001_extensions.sql`** — `pgcrypto`.
- **`002_tables.sql`** —
  ```sql
  bikes (
    id uuid pk default gen_random_uuid(),
    maker text not null,
    model text not null,
    year smallint,
    image_path text,          -- object path in bike-images bucket
    description text,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )
  ```
  + `set_updated_at()` trigger (search_path pinned).
- **`003_owner.sql`** — owner allowlist + helper:
  ```sql
  owner_emails (email text pk, created_at ...)
  is_owner() -> boolean  -- SECURITY DEFINER: auth.email() IN owner_emails
  ```
- **`004_storage.sql`** — create `bike-images` bucket (public); Storage policies: public read;
  insert/update/delete only when `is_owner()`.
- **`005_rls.sql`** — enable RLS on `bikes`; public `select`; `insert/update/delete` only when
  `is_owner()`. Owner-only `owner_emails` access.
- **`006_grants.sql`** — `select` to `anon`; `all` to `authenticated`/`service_role`; default
  privileges.
- **`seed.sql`** — insert the owner email into `owner_emails` + a few sample bikes.

**Security model:** RLS enforces ownership at the DB layer — even if someone else obtains a
magic link, they cannot write. The app additionally hides edit UI unless the signed-in email
is on the allowlist.

## Auth flow (magic link, owner email only)

1. `/login` posts email → server action calls
   `signInWithOtp({ emailRedirectTo: <origin>/auth/callback })`.
2. `/auth/callback/+server.ts` exchanges the `code` (SSR client, sets cookies) → redirect `/`.
3. `hooks.server.ts` populates `locals.user`; `+layout.server.ts` derives `isOwner` (email in
   allowlist, checked server-side) and passes it to pages.
4. Local dev: magic-link URL is printed in the Supabase CLI logs / Inbucket
   (`localhost:54323`).

## Frontend — routes & UI (minimal, dark, grid)

- **`/` Gallery:** responsive CSS grid of bike images. Each tile links to `/[id]`. Public +
  login link when signed out. **When owner:** an **"+ Add bike"** tile inserts a blank row
  (server action) and navigates to `/[id]` — adding stays inline, no separate view.
- **`/[id]` Detail:** large image on top, fields below.
  - **Notes** section: open and editable by default when owner (textarea, autosave on
    blur/debounce).
  - **Other fields** (maker/model/year/description): click-to-edit inline — click → input →
    save on blur/Enter.
  - **Image:** upload → `supabase.storage.from('bike-images').upload(...)`, then update
    `image_path`.
  - **Delete** button (owner) → deletes row + storage object → back to `/`.
  - Mutations via the authenticated **browser** supabase client; RLS enforces ownership.

## Milestones (each demonstrable end-to-end)

- **M0 — Foundations:** scaffold app + configs; `supabase init`; local stack up; `.env`;
  generated `database.types.ts`; `npm run check` green.
- **M1 — Backend:** all migrations + seed; RLS verified (anon read, owner-only write);
  `bike-images` bucket; local magic-link login works and `isOwner` resolves.
- **M2 — Gallery (read):** `/` grid renders seeded bikes; `/[id]` renders read-only; login +
  callback wired.
- **M3 — Inline editing (write):** Add tile, click-to-edit fields, notes autosave, image
  upload, delete — persisting through RLS.
- **M4 — Polish:** empty/loading/error states, responsive/mobile, image sizing/lazy-load,
  favicon/manifest/title.
- **M5 — Deploy prep (follow-up):** create cloud Supabase project, swap `.env`,
  `supabase db push`, Netlify deploy. *(Deferred per "local only for now".)*

## Tooling & conventions

- Node **22** (`.nvmrc`), npm, `engine-strict`. Tabs (`.editorconfig`). TS strict.
- Svelte 5 runes forced via vite plugin; `svelte-check` in the `check` script.
- Supabase agent skills available for schema/RLS best practices.
