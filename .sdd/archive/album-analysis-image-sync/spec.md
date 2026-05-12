# Album Analysis Image Sync

## Why

`docs/album-analysis.md` says all 55 JPG files in `assets/album-photos/` were
reviewed, but only 20 image IDs are explicitly referenced. The remaining images
are covered only by broad ranges and many team sections still use
`prior/photo set`, which makes the audit hard to verify or continue.

## What

Make the album analysis traceable to every current image asset:

1. Add a per-photo inventory for all 55 JPG files.
2. Replace `prior/photo set` provenance labels with explicit photo ranges.
3. Document the remaining unresolved sync work as photo-level recheck items
   instead of hiding it behind broad ranges.
4. Validate that every image appears in the analysis and no vague provenance
   labels remain.

## Constraints

### Must

- Keep image assets in `assets/album-photos/`.
- Keep `docs/album-analysis.md` as the analysis source of truth.
- Preserve uncertainty when a slot cannot be safely read.
- Avoid changing app runtime data unless a separate implementation task is
  explicitly opened.

### Must Not

- Guess blocked, cropped, glared, or unreadable sticker slots.
- Delete or rename photo assets.
- Add dependencies.

## Current State

- Asset folder contains 55 JPG files.
- `docs/album-analysis.md` explicitly names only 20 image IDs.
- 35 image IDs are currently only represented by broad ranges.
- 22 team sections use `prior/photo set`.

## Tasks

### T1: Add photo inventory

**What:** Add a `Photo Inventory` section listing every image ID, visible page
content, and audit status.

**Verify:** Every filename in `assets/album-photos/` appears in
`docs/album-analysis.md`.

**Done when:** `node` filename coverage check reports zero missing image IDs.

### T2: Replace vague team provenance

**What:** Replace all `prior/photo set` labels with explicit photo IDs or ranges
derived from the image sequence and visible page coverage.

**Verify:** `rg -n "prior/photo set" docs/album-analysis.md` returns no matches.

**Done when:** All team sections name their supporting image evidence.

### T3: Expand unresolved recheck notes

**What:** Document remaining gaps as explicit photo-level recheck items,
especially FWC pages and any multi-photo pages with blocked/glared slots.

**Verify:** Unresolved items name photo IDs and reasons.

**Done when:** No unresolved item depends on vague wording like "older analysis"
or "current baseline".

### T4: Validate and archive

**Verify:**

1. `npx tsc --noEmit`
2. `npx vite build`
3. image coverage script reports zero missing explicit mentions.
4. `rg -n "prior/photo set|older analysis|current baseline" docs/album-analysis.md`
   returns no matches.
5. review-rangers confidence is MEDIUM or higher.

**Done when:** The spec is moved to `.sdd/archive/album-analysis-image-sync/`.

## Validation

The sync is complete when every current photo has explicit traceability in
`docs/album-analysis.md`, no vague provenance labels remain, and unresolved
photo evidence is named in the uncertainty section.
