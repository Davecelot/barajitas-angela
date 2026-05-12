# Album Data Alignment

## Why

The app seed data did not fully match the photo evidence in `docs/album-analysis.md`.
Confirmed placed stickers were missing from `defaultCollected`, and some photographed
teams were absent from the runtime album data.

## What

Aligned `src/data/album.ts` with confirmed photo-analysis evidence:

- Added missing photographed Group A and Group L teams.
- Seeded every confirmed team sticker listed under `Already Placed`.
- Corrected slot/name mappings for teams called out in the audit.
- Kept FWC and blocked slots unseeded until rechecked.

## Constraints

- MUST keep the 20-slot team structure used by `makeTeam`.
- MUST NOT seed FWC IDs from uncertain evidence.
- MUST NOT guess blocked Colombia slots `COL 3` and `COL 12`.
- MAY use `Jugador <slot>` placeholders for unreadable or undocumented player names.

## Tasks

1. Update executable album data and seeded collection. Done.
2. Add an album-data validation command. Done.
3. Run the validation command and production build. Done.

## Validation

- `npm run validate:album-data` passed.
- `npm run build` passed.
