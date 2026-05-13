# Supabase Sync (Free Tier)

## Why

Angela uses desktop, tablet, and phone interchangeably. `localStorage` is
per-device, so progress marked on one device never reaches the others. Manual
export/import via [src/components/BackupButton.tsx](../../../src/components/BackupButton.tsx)
exists as a fallback, but is too tedious for daily use. A free-tier Supabase
project gives cross-device sync without operational cost.

## What

Replace the device-local source of truth with a single Supabase row owned by
Angela's account. Public visitors still see her progress (read-only). All edits
require login as Angela. Keep `localStorage` as an offline write-through cache so
the UI stays instant and works briefly offline.

Single user, single album. No multi-tenant schema.

## Constraints

- MUST stay within Supabase free tier limits (1 project, 500 MB DB, 2 GB egress,
  50k MAU, 7-day pause-on-inactivity). One row of state is far below any limit.
- MUST keep the app deployable to GitHub Pages with no server. Supabase is the
  only backend; the bundle remains static.
- MUST use Supabase Auth (email + password) for Angela's identity. Plaintext
  credentials in [src/data/users.json](../../../src/data/users.json) MUST be
  deleted from the repo and superseded.
- MUST enforce write access via Row-Level Security policies tied to `auth.uid()`.
  The anon key in the bundle is public by design; RLS is the actual gate.
- MUST allow anonymous (logged-out) read of the album state row so visitors keep
  read-only browsing.
- MUST keep `localStorage` as an offline cache: writes go to cache immediately
  and to Supabase opportunistically; reads prefer cache for first paint, then
  reconcile with Supabase.
- MUST use last-write-wins at row level (single user, low conflict risk).
- MUST inject `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build time via
  GitHub Actions secrets; MUST NOT commit them.
- MUST NOT ship the Supabase `service_role` key in any client code or workflow.
- MUST update CSP `connect-src` in [index.html](../../../index.html) to allow
  the Supabase project domain (currently `https:` permits it broadly; tighten to
  the project subdomain).
- MUST handle the free-tier "project paused" cold start gracefully (loading
  state, retry once, then fall back to cache).
- MUST remove `defaultCollected` seed-merge logic from
  [src/hooks/useAlbum.ts](../../../src/hooks/useAlbum.ts); seeding becomes a
  one-time SQL insert in Supabase.

## How To Use This Spec (Beginner Notes)

This spec assumes no prior Supabase experience. Every task that touches the
Supabase dashboard or runs SQL includes:

- **Where to click** in the Supabase dashboard (sidebar item → page → button).
- **Exact SQL to paste** into the SQL Editor (no placeholders to invent).
- **What to check** after running it (a query that confirms the step worked).

Vocabulary you'll see:

- **Project**: a single Supabase environment (DB + Auth + Storage). Free tier
  allows 2 active projects per org.
- **SQL Editor**: a web page at `dashboard.supabase.com → your project → SQL
  Editor` where you paste and run SQL. Treat it like a notepad with a Run
  button.
- **RLS (Row-Level Security)**: a Postgres feature that filters which rows each
  user can read/write. With RLS **on** and **no policies**, nothing is
  accessible. Policies grant access back. This is the actual security boundary
  for this app.
- **`auth.uid()`**: a function Supabase provides inside SQL that returns the
  logged-in user's UUID. Used in policies to mean "only the owner".
- **anon key**: a public API key safe to ship in the frontend. It's only
  powerful when combined with policies that allow anonymous access.
- **service_role key**: a private API key that bypasses RLS. **Never** paste it
  in client code, GitHub, or this repo.

Save your project URL and anon key in a password manager before you start.

## Current State

- Hosting: GitHub Pages, Vite build, base `/barajitas-angela/`
  ([vite.config.ts](../../../vite.config.ts)).
- Persistence: `localStorage` keys `barajitas-collected`, `barajitas-repeated`,
  `barajitas-seeded-v1` ([src/hooks/useAlbum.ts](../../../src/hooks/useAlbum.ts)).
- Auth: static JSON list with plaintext passwords
  ([src/data/users.json](../../../src/data/users.json)), session in
  `localStorage` ([src/hooks/useAuth.ts](../../../src/hooks/useAuth.ts)).
- Roles: `admin` / `normal`; `canEdit` gates UI mutations only — not
  cryptographically enforced.
- Backup: manual export/import dropdown
  ([src/components/BackupButton.tsx](../../../src/components/BackupButton.tsx))
  with `replaceAll` on the album hook.
- CSP: `connect-src 'self' https:` ([index.html](../../../index.html)).

## Tasks

> **Intermediate validation protocol:** after every task below, once its
> `Verify` checks pass, run the `review-rangers` skill on the resulting diff
> (or artifact, for non-code tasks like SQL migrations and dashboard changes).
> Address any blocker-level findings before starting the next task. Record
> material verdicts in `DECISIONS.md` if the skill produces durable insights.

1. **Create Supabase project (free tier) and schema.**

   **1a. Create the project**
   - Go to `https://supabase.com` → sign in → **New project**.
   - Name: `barajitas-angela`. Region: pick the one closest to Angela
     (e.g. `South America (São Paulo)` for Uruguay). Plan: **Free**.
   - Set a strong database password (you won't need it for this app, but
     Supabase requires one). Save it in your password manager.
   - Wait ~2 minutes for provisioning.

   **1b. Save project credentials**
   - In the dashboard, go to **Project Settings → API**.
   - Copy and save (password manager):
     - **Project URL** → this becomes `VITE_SUPABASE_URL`.
     - **anon public key** → this becomes `VITE_SUPABASE_ANON_KEY`.
   - Do **not** copy the `service_role` key — leave it in the dashboard.

   **1c. Create the schema (paste SQL)**
   - Sidebar: **SQL Editor → + New query**.
   - Paste the entire block below and click **Run**:

     ```sql
     -- 1. Table to hold Angela's album progress (one row, one owner).
     create table if not exists public.album_state (
       id uuid primary key default gen_random_uuid(),
       owner uuid not null references auth.users(id) on delete cascade,
       collected text[] not null default '{}',
       repeated jsonb not null default '{}'::jsonb,
       updated_at timestamptz not null default now(),
       constraint album_state_owner_unique unique (owner)
     );

     -- 2. Keep updated_at fresh on every write.
     create or replace function public.set_updated_at()
     returns trigger
     language plpgsql
     as $$
     begin
       new.updated_at = now();
       return new;
     end;
     $$;

     drop trigger if exists trg_album_state_updated_at on public.album_state;
     create trigger trg_album_state_updated_at
       before update on public.album_state
       for each row execute function public.set_updated_at();

     -- 3. Turn on Row-Level Security. Without policies below, nothing is allowed.
     alter table public.album_state enable row level security;

     -- 4. Policies.
     --    a) Anyone (including logged-out visitors) can read the row.
     drop policy if exists select_album_state_public on public.album_state;
     create policy select_album_state_public
       on public.album_state
       for select
       using (true);

     --    b) Only the owner can insert their row.
     drop policy if exists insert_album_state_owner on public.album_state;
     create policy insert_album_state_owner
       on public.album_state
       for insert
       with check (auth.uid() = owner);

     --    c) Only the owner can update their row.
     drop policy if exists update_album_state_owner on public.album_state;
     create policy update_album_state_owner
       on public.album_state
       for update
       using (auth.uid() = owner)
       with check (auth.uid() = owner);
     ```

   - Expected result message: "Success. No rows returned." Schema is in place;
     no data yet (the seed happens in Task 2 after Angela's user exists).

   **1d. Verify the schema**
   - In the SQL Editor run:

     ```sql
     select table_name, row_security
     from information_schema.tables
     where table_schema = 'public' and table_name = 'album_state';
     ```

     `row_security` should be `YES`.

   - Then list the policies:

     ```sql
     select policyname, cmd, qual, with_check
     from pg_policies
     where schemaname = 'public' and tablename = 'album_state';
     ```

     You should see three rows: `select_album_state_public`,
     `insert_album_state_owner`, `update_album_state_owner`.

   - Review: run `review-rangers` on the SQL migration and RLS policies; focus
     the committee on data-model and security-policy perspectives.

2. **Provision Angela's auth user and seed her album row.**

   **2a. Disable email confirmation (single-user simplification)**
   - Sidebar: **Authentication → Providers → Email**.
   - Turn **off** "Confirm email" (Angela won't get confirmation emails she
     has to click). Save.
   - Optional: under **Authentication → URL Configuration**, set Site URL to
     `https://davecelot.github.io/barajitas-angela/` so password-reset links
     point home.

   **2b. Create Angela's account**
   - Sidebar: **Authentication → Users → Add user → Create new user**.
   - Email: Angela's real email. Password: strong, save in her password
     manager. Click **Create user**.
   - Copy her **User UID** from the user list — you'll need it next.

   **2c. Seed Angela's `album_state` row (paste SQL)**
   - Sidebar: **SQL Editor → + New query**. Paste, replacing
     `<ANGELA_UID>` with the UID from step 2b:

     ```sql
     insert into public.album_state (owner, collected, repeated)
     values (
       '<ANGELA_UID>'::uuid,
       array[]::text[],
       '{}'::jsonb
     )
     on conflict (owner) do nothing;
     ```

   - If Angela has existing progress in localStorage that she wants to
     preserve, export it via the Backup button in the live app, then replace
     the `array[]` and `'{}'` literals with her exported `collected` and
     `repeated` values. Example shape:

     ```sql
     -- Example only — paste real IDs from your exported backup JSON.
     insert into public.album_state (owner, collected, repeated)
     values (
       '<ANGELA_UID>'::uuid,
       array['ARG-1','ARG-2','SPECIAL-MASCOT']::text[],
       '{"ARG-1": 2, "ESP-7": 1}'::jsonb
     )
     on conflict (owner) do update
       set collected = excluded.collected,
           repeated  = excluded.repeated;
     ```

   - Verify: run `select owner, array_length(collected, 1) as n_collected from public.album_state;`
     and confirm one row whose `owner` matches Angela's UID.

   **2d. Smoke-test RLS from the SQL Editor**
   - The SQL Editor runs as the service role (bypasses RLS), so it can't
     directly prove the policies work. Use the **Table Editor → album_state
     → ⋯ → "Test policies"** UI, or run from the app in Task 4.
   - Quick API check from a terminal (replace `<URL>` and `<ANON_KEY>`):

     ```bash
     # Anonymous SELECT should succeed.
     curl "<URL>/rest/v1/album_state?select=*" \
       -H "apikey: <ANON_KEY>"

     # Anonymous UPDATE should fail with a permission error.
     curl -X PATCH "<URL>/rest/v1/album_state?owner=eq.<ANGELA_UID>" \
       -H "apikey: <ANON_KEY>" \
       -H "Content-Type: application/json" \
       -d '{"collected":["HACK"]}'
     ```

   - Review: run `review-rangers` on the auth-provisioning decisions
     (password policy, email confirmation flow, visitor read access).

3. **Add Supabase client and env wiring.**

   **3a. Install the client**

   ```bash
   npm i @supabase/supabase-js
   ```

   **3b. Create the local env file**
   - Create `.env.local` at the repo root (this filename is already covered
     by Vite's gitignore conventions — double-check `.gitignore`):

     ```bash
     VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
     VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
     ```

   - Confirm `.env.local` is **not** tracked: `git status` should not list it.

   **3c. Add the client singleton**
   - Create `src/lib/supabase.ts`:

     ```ts
     import { createClient } from '@supabase/supabase-js'

     const url = import.meta.env.VITE_SUPABASE_URL
     const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

     if (!url || !anonKey) {
       throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
     }

     export const supabase = createClient(url, anonKey, {
       auth: { persistSession: true, autoRefreshToken: true },
     })
     ```

   **3d. Tighten CSP**
   - In [index.html](../../../index.html), change `connect-src 'self' https:`
     to `connect-src 'self' https://<your-project-ref>.supabase.co
     wss://<your-project-ref>.supabase.co`.
   - Verify: `npm run build` succeeds; loading the app in the browser DevTools
     Network tab shows requests to the Supabase domain and no CSP violations
     in the Console.
   - Review: run `review-rangers` on the client wiring and CSP delta; focus on
     secret-handling and supply-chain perspectives.
   - Review: run `review-rangers` on the client wiring and CSP delta; focus on
     secret-handling and supply-chain perspectives.

4. **Replace auth with Supabase Auth.**
   - Rewrite [src/hooks/useAuth.ts](../../../src/hooks/useAuth.ts) to use
     `supabase.auth.signInWithPassword`, `signOut`, and `onAuthStateChange`.
   - Drop the `role` concept: `canEdit` becomes `!!session?.user`.
     Logged-out = read-only; Angela logged in = edit.
   - Update [src/components/AuthButton.tsx](../../../src/components/AuthButton.tsx)
     form to accept email + password (label change), keep visual style.
   - Delete [src/data/users.json](../../../src/data/users.json) and its import.
   - Delete `barajitas-auth-user` localStorage key (Supabase manages session).
   - Verify: visitor sees read-only UI; Angela's login unlocks edits; logout
     returns to read-only; reload preserves session.
   - Review: run `review-rangers` on the auth refactor; focus on session
     handling, error states, and the removal of `users.json`.

5. **Rewrite `useAlbum` to sync via Supabase with localStorage cache.**
   - On mount: hydrate from `localStorage` (instant first paint), then issue a
     `select * from album_state limit 1` and reconcile (server wins on
     `updated_at` newer; otherwise local persisted writes flush up).
   - `toggle`, `incrementRepeated`, `decrementRepeated`:
     - Update React state and localStorage immediately (optimistic).
     - Queue a debounced (~500 ms) `update album_state set collected=..., repeated=... where owner=auth.uid()` call.
     - On error, keep local change and surface a toast; retry on next focus.
   - `replaceAll` (used by Import): same path — write cache, then debounced sync.
   - On `window` `focus` event: re-fetch the row and reconcile.
   - Remove `defaultCollected` seed-merge block (rows are server-seeded once).
   - Verify: edits on device A appear on device B after focus refresh; offline
     edits queue and flush on reconnect; no duplicate rows ever created.
   - Review: run `review-rangers` on the sync hook; focus on race conditions,
     reconcile semantics, and offline-queue correctness.

6. **GitHub Actions: inject env at build.**

   **6a. Add repo secrets**
   - In GitHub: **Settings → Secrets and variables → Actions → New
     repository secret**.
   - Add two secrets with the **exact** names:
     - `VITE_SUPABASE_URL` → the project URL.
     - `VITE_SUPABASE_ANON_KEY` → the anon public key.
   - Both are safe to live in GitHub Actions (anon key is public-by-design;
     RLS is the gate).

   **6b. Update the Pages workflow**
   - Edit `.github/workflows/<pages-workflow>.yml`. In the build step that
     runs `npm run build`, add an `env:` block:

     ```yaml
     - name: Build
       env:
         VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
         VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
       run: |
         if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
           echo "Missing Supabase env vars — secrets not configured."
           exit 1
         fi
         npm run build
     ```

   - Verify: push to a branch, watch the Action run, confirm the build step
     succeeds and the deployed Pages site can read the album from Supabase
     (no `undefined` URL in DevTools).
   - Review: run `review-rangers` on the workflow change; focus on
     secret-leak vectors (log redaction, PR builds, fork PRs).
   - Review: run `review-rangers` on the workflow change; focus on
     secret-leak vectors (log redaction, PR builds, fork PRs).

7. **Free-tier robustness.**
   - Detect cold-start: if the first `select` takes >2 s or fails with a network
     error, show a "Conectando con la nube…" toast and retry once after 1.5 s.
   - If still failing, fall back to local cache and surface a "Sin conexión"
     banner; edits continue to work locally.
   - Add a periodic "wake-up" ping (a no-op `select` once per page load) — does
     not prevent the 7-day pause, but ensures Angela's first action of the
     session triggers the resume.
   - Verify: simulating offline still allows toggling; reconnecting drains the
     queue; pausing the project (or simulating via blocked domain) shows the
     banner without breaking the UI.
   - Review: run `review-rangers` on the resilience layer; focus on UX during
     cold-start, retry storms, and silent-failure detection.

8. **Update security and validation scripts.**
   - Add the Supabase anon-key pattern to the allowlist in
     [scripts/security-check.mjs](../../../scripts/security-check.mjs) so the
     hook does not flag it as a leaked secret.
   - Update [AGENTS.md](../../../AGENTS.md) with: env-var names, how to run
     locally, how to rotate the anon key, and a note that RLS is the security
     boundary (anon key is intentionally public).
   - Verify: `npm run security:check` passes; docs reflect the new model.
   - Review: run `review-rangers` on the updated security script and AGENTS.md
     guidance; focus on accuracy of the threat model and operator clarity.

9. **Documentation and decommission.**
   - Update [docs/](../../../docs/) (or root README if applicable) with the new
     architecture diagram in one paragraph.
   - Remove obsolete references to `users.json` and `barajitas-seeded-v1`.
   - Verify: no dead imports, `npm run build` and `npm test` both pass.
   - Review: run `review-rangers` on the final repo state; treat this as the
     pre-archive review before moving the spec from `.sdd/active/` to
     `.sdd/archive/`.

## Validation

- Logged-out visit on a fresh browser shows Angela's current progress
  (read-only) within ~1 s on warm project, or with a "Conectando…" toast on
  cold start.
- Logged-out user cannot toggle, increment, or decrement anything — controls
  are hidden or disabled.
- Angela signs in on phone, marks a sticker, switches to tablet, focuses the
  tab → the new mark appears.
- Angela goes offline on the phone, toggles three stickers, comes back online,
  reloads the tablet → all three marks appear.
- Direct attempt to `update album_state` via the anon key from an unauthorized
  session is rejected by RLS (verify via `curl` or Supabase SQL editor).
- `npm run build`, `npm test`, and `npm run security:check` all pass.
- Bundle size delta is ≤ 50 KB gzipped vs. the pre-migration build.
- No occurrence of plaintext passwords in the repo (`git grep -i barajitas2026`
  returns nothing in tracked files).

## Out of Scope

- Multi-user accounts beyond Angela.
- Realtime subscriptions (deferred; focus-based reconcile is enough).
- Migrating historical localStorage data on existing devices automatically —
  on first login post-migration, the cloud row is authoritative and overwrites
  the device cache. Angela can pre-import via the existing Backup → Import
  flow before the cutover if she wants to preserve device-local progress.
