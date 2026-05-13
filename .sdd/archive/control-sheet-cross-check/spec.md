# Control Sheet Cross-Check

## Why

The album has a new whole-table control-sheet image that can supplement the
photo-derived seed data.

## What

- Preserve the control-sheet image under `assets/control-sheets/`.
- Document confident checked IDs, uncertain cells, and discrepancies in
  `docs/album-analysis.md`.
- Seed only confident checked IDs while keeping existing photo-derived IDs.
- Display sticker labels as printed figure codes instead of player names.
- Extend album validation so documented evidence remains aligned with
  `defaultCollected`.

## Constraints

- MUST NOT remove existing photo-derived seeded stickers only because they are
  not visible on the control sheet.
- MUST NOT seed uncertain FWC, Coca-Cola, or low-confidence red-mark cells.
- MUST keep `src/data/album.ts` as the executable data source.
- MUST keep stable lowercase/hyphenated sticker IDs for persistence.

## Validation

- `npm run validate:album-data`
- `npm run build`
