# AI Decisions

Durable project memory for `review-rangers`. Use this file to record breaking changes, mid/high-interest solutions, and important review insights that future agents should reuse.

## Entry Criteria

- Add entries only for breaking changes, mid/high-interest solutions, architectural decisions, repeated issue patterns, or project-specific conventions with future value.
- Do not add minimal, obvious, one-off, or insignificant changes.
- Do not paste full review transcripts.
- Every change to this file must update the changelog at the end.

## Entry Template

```md
## YYYY-MM-DD - Short Decision Title

- Interest level: Mid | High | Breaking
- Context:
- Decision / Insight:
- Rationale:
- Avoid repeating:
- Source:
```

## 2026-05-10 - Seed-on-first-load Pattern for localStorage Album Data

- Interest level: Mid
- Context: useAlbum.ts pre-seeds `barajitas-collected` from a static `defaultCollected` set derived from photo analysis. A `SEEDED_KEY` flag gates the seed so it runs only once.
- Decision / Insight: If `COLLECTED_KEY` already exists but `SEEDED_KEY` is absent (e.g. returning users from an older build), preserve existing data and just stamp the flag — do not overwrite. Only seed on a genuinely fresh install (neither key present).
- Rationale: Prevents silent data loss for users migrating from older builds with differently-formatted IDs. Reviewed and fixed by review-rangers.
- Avoid repeating: Do not write `SEEDED_KEY` before `COLLECTED_KEY` (flag-before-data inversion leaves corrupt state if write is interrupted). Do not overwrite `COLLECTED_KEY` when it already exists without explicit user confirmation.
- Source: review-rangers run 2026-05-10; safety-guard blockers #1 and #2.

## 2026-05-10 - makeTeam 18-element Contract Enforced

- Interest level: Mid
- Context: `makeTeam` in album.ts accepts a `players: string[]` that must be exactly 18 elements. `slice()` silently truncates shorter arrays producing malformed 20-sticker teams.
- Decision / Insight: The contract is now enforced with a fixed-length `PlayerNames` tuple containing exactly 18 strings. TypeScript rejects new `makeTeam` calls whose player array literals are too short or too long.
- Rationale: Silent truncation produces wrong sticker counts and misaligned IDs with no error; first discovered during review-rangers run.
- Avoid repeating: Do not loosen `PlayerNames` back to `string[]`; keep the compile-time tuple guard as the source of truth for roster length.
- Source: review-rangers run 2026-05-10; resolved during app-completion spec implementation on 2026-05-11.

## 2026-05-11 - App Display and Structure Docs Are Canonical

- Interest level: Mid
- Context: Project guidance was split across root docs, generated agent routing, SDD archives, raw album photos, and runtime code.
- Decision / Insight: Keep `AGENTS.md` as AI routing guidance. Use `docs/app-display-source-of-truth.md` for app display policy, `docs/project-structure.md` for folder ownership, `docs/album-analysis.md` for photo-review evidence, and `assets/album-photos/` for raw photo evidence.
- Rationale: Separating executable data, display policy, structure policy, and evidence prevents future agents from treating generated routing files or raw assets as product specs.
- Avoid repeating: Do not replace root `AGENTS.md` with product documentation. Do not put new product/evidence docs at the repository root unless a future SDD spec changes the structure policy.
- Source: project-structure-governance SDD implementation and review-rangers pass 2026-05-11.

## 2026-05-12 - Album Photo Evidence Validation Gate

- Interest level: Mid
- Context: `docs/album-analysis.md` lists confirmed placed stickers from photo review, while `src/data/album.ts` seeds the executable collected state.
- Decision / Insight: Keep `npm run validate:album-data` as the regression gate whenever album evidence or seeded collection data changes.
- Rationale: The validator catches missing teams, missing seeded placed IDs, invalid seeded IDs, accidental FWC seeding from uncertain evidence, and blocked Colombia slot seeding.
- Avoid repeating: Do not update `defaultCollected` by hand without running the validator against the evidence doc.
- Source: album-data-alignment SDD implementation and review-rangers pass 2026-05-12.

## Changelog

- 2026-05-10: Created entry "Seed-on-first-load Pattern for localStorage Album Data" because review-rangers identified two blockers in useAlbum.ts seed logic.
- 2026-05-10: Created entry "makeTeam 18-element Contract Unenforced" because review-rangers flagged silent truncation risk in the player array contract.
- 2026-05-11: Updated entry "makeTeam 18-element Contract Enforced" because the app-completion spec replaced the convention with a fixed-length tuple type.
- 2026-05-11: Created entry "App Display and Structure Docs Are Canonical" because project-structure-governance established durable ownership for display policy, structure policy, and evidence assets.
- 2026-05-12: Created entry "Album Photo Evidence Validation Gate" because seeded collection alignment now has a reusable verifier.
