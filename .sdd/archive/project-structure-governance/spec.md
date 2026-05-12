# Barajitas Angela - Project Structure Governance

## Why

The app is functionally complete, but project knowledge is split between root
files, generated agent guidance, SDD archives, raw album photos, and app code.
Future changes need a stable structure so agents and humans know which files are
canonical, which files are generated, and where project evidence belongs.

## What

Create a docs/assets-only structure governance pass:

1. Add a canonical app display source-of-truth markdown file.
2. Add a project structure map.
3. Move album analysis and raw photos into documented folders.
4. Keep root `AGENTS.md` as the AI routing entry point and link it to the app
   display source of truth.
5. Verify the React app still builds and archive this spec when complete.

## Constraints

### Must

- Keep `src/data/album.ts` as the executable album data source.
- Keep root `AGENTS.md` as agent orchestration guidance.
- Treat `docs/app-display-source-of-truth.md` as the canonical app display
  policy for future UI/data-display decisions.
- Leave `src/` source layout unchanged.
- Keep `.sdd/active/` for active work and `.sdd/archive/` for completed specs.
- Update stale references after moving docs or assets.

### Must Not

- Add npm dependencies.
- Change runtime app behavior.
- Move React source files.
- Replace skilly-hand-managed agent guidance with product documentation.
- Delete album photo evidence.

### Out of Scope

- Redesigning the app UI.
- Changing album/team/sticker data.
- Adding tests beyond validation commands and reference checks.
- Changing CI, release, or deployment workflows.

## Current State

- `AGENTS.md` is skilly-hand-managed root AI routing guidance.
- `src/data/album.ts` contains app data used by React components.
- `ALBUM_ANALYSIS.md` is project evidence at the repository root.
- `barajitas/` contains raw photo evidence at the repository root.
- `.sdd/archive/` contains completed specs; `.sdd/active/` now contains this
  structure-governance spec.

## Tasks

### T1: Create app display source of truth

**What:** Add `docs/app-display-source-of-truth.md` defining current display
rules for album data, sticker IDs, sections, progress, copy/share text, search,
repeated stickers, and ownership.

**Files:** `docs/app-display-source-of-truth.md`

**Verify:** Compare against `src/App.tsx`, `src/components/TeamSection.tsx`,
`src/components/StickerCard.tsx`, `src/utils/share.ts`, and
`src/data/album.ts`.

**Done when:** Future app display decisions have one canonical markdown policy.

### T2: Create project structure map

**What:** Add `docs/project-structure.md` describing folder ownership,
generated/local artifacts, and SDD archive rules.

**Files:** `docs/project-structure.md`

**Verify:** `find . -maxdepth 3 -type f` aligns with the documented structure
after the move.

**Done when:** Repository folders have clear ownership and move rules.

### T3: Move documentation and photo evidence

**What:** Move `ALBUM_ANALYSIS.md` to `docs/album-analysis.md` and move
`barajitas/` to `assets/album-photos/`.

**Files:** `docs/album-analysis.md`, `assets/album-photos/`

**Verify:** Search for stale `ALBUM_ANALYSIS.md` and `barajitas/` references.

**Done when:** Root contains app/config entrypoints, while evidence lives under
documented docs/assets folders.

### T4: Update AGENTS routing

**What:** Preserve `AGENTS.md` as root AI routing guidance and add explicit
routes to `docs/app-display-source-of-truth.md`, `docs/project-structure.md`,
and `docs/album-analysis.md`.

**Files:** `AGENTS.md`

**Verify:** `AGENTS.md` still follows Where/What/When orchestration and clearly
states the app display source of truth.

**Done when:** Agents consult the right docs before changing app display,
structure, or album evidence.

### T5: Validate and archive

**What:** Run validation, perform a final review-rangers pass, then archive this
spec under `.sdd/archive/project-structure-governance/`.

**Verify:**

1. `npx tsc --noEmit`
2. `npx vite build`
3. `rg -n "ALBUM_ANALYSIS|barajitas/" .`
4. `find .sdd -maxdepth 3 -type f | sort`
5. review-rangers confidence is MEDIUM or higher.

**Done when:** The spec is complete and moved from active to archive.

## Validation

1. TypeScript passes.
2. Vite build passes.
3. Stale references are eliminated or intentionally documented.
4. Root `AGENTS.md` remains an AI orchestration file.
5. `docs/app-display-source-of-truth.md` is the canonical app display policy.
6. Completed SDD spec is archived.
