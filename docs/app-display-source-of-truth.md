# Barajitas Angela - App Display Source of Truth

This file is the canonical policy for how album data is displayed in the app.
`src/data/album.ts` remains the executable source for team, sticker, and seeded
collection data. This document governs display behavior built from that data.

## Data Ownership

- `src/data/album.ts` owns `Sticker`, `Team`, `teams`, `specialStickers`,
  `defaultCollected`, and `totalStickers`.
- Sticker IDs must remain `{teamCode}-{position}` for teams and section-prefixed
  IDs for special stickers such as `fwc-1` and `cc-1`.
- Team stickers use the 20-slot album structure: slot 1 is the team badge,
  slots 2-12 are player slots, slot 13 is the `We Are`/team-photo slot, and
  slots 14-20 are player slots.
- Sticker display names must use the printed figure code from the checklist
  table, such as `MEX1`, `KSA1`, `FWC1`, or `CC1`, instead of player names.
- `makeTeam` must keep the fixed 18-player tuple contract.
- `src/hooks/useAlbum.ts` owns browser persistence for collected and repeated
  sticker state.
- On load, collected sticker state must merge the current `defaultCollected`
  seed into any existing browser state when the seed content changes, preserving
  user-added stickers while marking all evidence-backed stickers Angela has.

## App Sections

- The app header shows app title, album subtitle when space allows, total
  collected count, total sticker count, percentage, and global progress bar.
- The app header includes a login control aligned with the title area. Logged-out
  visitors and normal users can browse, search, and copy lists but cannot edit
  collected or repeated sticker state.
- Authentication is performed against the Cloudflare Worker at `VITE_API_URL`
  (POST /api/login), which validates the username/password against PBKDF2 hashes
  stored in D1 and returns a signed JWT. The JWT is persisted in localStorage
  and sent on subsequent requests via the `Authorization: Bearer` header.
  Logged-out visitors and normal users can browse but cannot edit; only the
  admin role passes the server-side `role === 'admin'` check on
  `PUT /api/album`. There is no client-side trust boundary.
- The global missing-list copy action copies missing team stickers for every
  incomplete team.
- The repeated-list copy action appears when at least one sticker has a repeated
  count greater than zero and copies stickers available for exchange.
- The tab bar has two views: `Mi album` for the full album and `Para cambiar`
  for stickers with repeated count greater than zero.
- Search filters by sticker figure code, sticker number, or team name.
- Special stickers render before team sections in the full album view.
- Teams render in album order from `teams`.

## Team Display

- Each team appears as a collapsible section with flag, localized team name,
  group label, progress bar, numeric collected/total badge, and open/closed
  indicator.
- A team copy button appears only when at least one sticker in that team is
  missing and copies that team's missing stickers.
- Team progress is based on collected stickers from that team only.
- Filtered views force matching team sections open.

## Sticker Display

- Each sticker row shows sticker number, figure code, collected state, and
  repeated controls.
- Collected stickers use green styling.
- Missing regular stickers use gray styling.
- Shiny stickers use a distinct treatment: gold when collected and silver/gray
  when missing. Shiny stickers include team badges, `We Are` stickers, and
  Coca-Cola stickers marked with `isShiny`.
- Repeated controls must not remove the collected-state behavior: adding a
  repeated sticker also marks it collected.
- Sticker collected toggles and repeated plus/minus controls appear only for
  admin users.

## Share Text

- `src/utils/share.ts` owns missing-sticker and repeated-sticker formatting.
- Share text starts with `*Barajitas que me faltan* ⚽`.
- Teams are grouped by flag and localized team name.
- Only missing stickers are listed.
- Completed teams are omitted from global share text.
- Sticker entries use `#<number> <figure-code>` and are comma-separated.
- Repeated share text starts with `*Barajitas repetidas para cambiar* 🔁`.
- Repeated sticker entries include the extra-copy count as `(+<count>)`.

## Mobile Rules

- Header controls must remain touch-friendly with at least 44 px height.
- On a 390 px-wide viewport, the sticky header should remain compact and avoid
  covering excessive content.
- Text should truncate rather than overlap controls.

## Change Rules

- Any UI or data-display change must update this file when it changes the rules
  above.
- Any source-data correction must update `src/data/album.ts`; this file should
  only describe display policy, not duplicate full roster data.
- Raw photo evidence and album analysis live outside app code under `assets/`
  and `docs/`.
