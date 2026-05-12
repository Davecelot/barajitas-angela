# Barajitas Angela — App Completion

## Why

The album data layer is complete and seeded. Four areas of work remain before
the app is fully useful for Angela: a data-integrity safeguard from review-rangers,
a share/export feature for trading stickers, UI polish for mobile use, and filling
in the 14 placeholder teams with real player names.

## What

Four phases, each independently shippable:
1. Enforce the 18-element contract on `makeTeam`.
2. Add a "copy missing stickers" share feature (WhatsApp-friendly).
3. Polish UI and mobile UX.
4. Research and fill player names for all 14 placeholder teams.

## Constraints

### Must

- Pass `npx tsc --noEmit` after every task.
- Pass `npx vite build` after every phase.
- Keep all sticker IDs in `{teamCode}-{position}` format.
- Use existing Tailwind classes — no new CSS libraries.
- Keep `src/data/album.ts` as the single source of truth for team/player data.

### Must Not

- Change the `Sticker`, `Team` type shapes (downstream components depend on them).
- Add new npm dependencies without explicit approval.
- Modify `SEEDED_KEY` or `COLLECTED_KEY` constants.

### Out of Scope

- Backend / cloud sync.
- Authentication.
- FWC sticker name research (marked pending in ALBUM_ANALYSIS.md).
- Repeated-sticker trading UI (track + share in a future spec).

## Current State

- `src/data/album.ts` — 36 teams × 20 stickers, `defaultCollected` (215 IDs), 14 placeholder teams.
- `src/hooks/useAlbum.ts` — seed logic, toggle/increment/decrement.
- `src/components/TeamSection.tsx` — collapsible team card, sticker list.
- `src/components/StickerCard.tsx` — per-sticker row with +/− buttons.
- `src/App.tsx` — header with progress bar, Todas/Repetidas tabs, search.
- `.ai/DECISIONS.md` — makeTeam 18-element contract documented as known risk.

---

## Phase 1 — Enforce makeTeam Contract

**Goal:** Catch wrong-length player arrays at TypeScript compile time.

### T1: Add tuple type for the players parameter

**What:** Change `players: string[]` to a fixed-length tuple
`[string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string]`
(18 elements). Add a descriptive type alias `PlayerNames` so the intent is clear.

**Files:** `src/data/album.ts`

**Verify:** `npx tsc --noEmit` — must produce zero errors.

**Done when:** TypeScript rejects any `makeTeam` call whose array literal is not
exactly 18 strings.

---

## Phase 2 — Share / Export Missing Stickers

**Goal:** Let Angela copy a formatted list of missing stickers for a team (or all
teams) to send via WhatsApp or messaging apps.

### T2: Share utility function

**What:** Create `src/utils/share.ts` with a `formatMissing(teams, collected)`
function that returns a plain-text string grouped by team, listing only missing
sticker numbers and names. Format example:

```
*Barajitas que me faltan* ⚽

🇧🇦 Bosnia-Herzegovina
  #1 Escudo, #3 Amar Dedić, #8 Amir Hadžiahmetović

🇧🇷 Brasil
  #2 Jugador 2, #4 Marquinhos ...
```

**Files:** `src/utils/share.ts` (new)

**Verify:** Manual unit test — call `formatMissing` with a known collected set
and confirm only missing stickers appear in the output.

**Done when:** Function returns correct plain-text for at least BRA and QAT
with a sample `collected` set.

---

### T3: "Copiar faltantes" button on TeamSection

**What:** Add a small copy icon button to each `TeamSection` header (only visible
when at least one sticker is missing). Clicking it calls
`navigator.clipboard.writeText(formatMissing([team], collected))`. Show a brief
"¡Copiado!" toast for 2 seconds.

**Files:** `src/components/TeamSection.tsx`, `src/App.tsx` (pass `collected` down
if not already available)

**Verify:** Open app → expand a team → click copy → paste in a text editor →
confirm only missing stickers appear, formatted correctly.

**Done when:** Copy button works for at least two different teams and the toast
appears and disappears.

---

### T4: Global "Copiar todo" action

**What:** Add a "Copiar todo lo que me falta" button in the App header area
(below the progress bar, above tabs). Calls
`navigator.clipboard.writeText(formatMissing(teams, collected))` for all teams
with at least one missing sticker. Reuse the same toast pattern.

**Files:** `src/App.tsx`

**Verify:** Click → paste confirms all incomplete teams listed, complete teams
omitted.

**Done when:** Button copies the full missing list and the toast fires.

---

## Phase 3 — UI Polish & Mobile UX

**Goal:** Make the app feel finished and comfortable to use one-handed on a phone.

### T5: Per-team progress bar in TeamSection header

**What:** Replace the `{collected}/{total}` badge in the team header with a thin
progress bar (same green/gray style as the global bar) that fills proportionally.
Keep the numeric badge alongside it.

**Files:** `src/components/TeamSection.tsx`

**Verify:** Open app → each team card shows a filled progress bar proportional
to its collected count. Fully complete teams show fully green bar.

**Done when:** Visual progress bar visible on all team cards in the "Todas" tab.

---

### T6: Shiny sticker visual treatment

**What:** Give shiny stickers (`isShiny: true`) a distinct visual in
`StickerCard`: gold left border + subtle gold background tint when collected,
silver tint when missing. Remove the plain `★` text suffix — replace with a
CSS sparkle treatment (e.g. gold text + slight italic for the name).

**Files:** `src/components/StickerCard.tsx`

**Verify:** Open app → Escudo and "We Are X" stickers look visually distinct
from regular player stickers. FWC and CC stickers also styled.

**Done when:** Shiny stickers are visually distinguishable at a glance.

---

### T7: Mobile header refinement

**What:** Tighten the sticky header to reduce height on small screens. Move
"Barajitas Angela ⚽" + subtitle to a single compact line. Make the tab bar and
search bar feel tap-friendly (min 44 px touch targets).

**Files:** `src/App.tsx`, `src/index.css` (if needed)

**Verify:** Open on a 390px-wide viewport (iPhone 14 size in DevTools). Header
occupies ≤ 140px. Tab buttons and search bar are easily tappable.

**Done when:** Header fits comfortably on a 390px screen without feeling cramped.

---

## Phase 4 — Fill Placeholder Team Rosters

**Goal:** Replace all 14 `placeholderTeam` calls with real player names from the
"Road to FIFA World Cup 2026" Panini album.

### Teams to fill (14 total)

| Group | Teams |
|-------|-------|
| B | CAN |
| C | MAR, HAI |
| E | ECU |
| F | NED |
| H | CPV, SAU, URU |
| J | ARG, ALG, AUT |
| K | COD, UZB, COL |

### T8: Research and populate Group B, C, E placeholder teams (CAN, MAR, HAI, ECU)

**What:** Use web research to find the official Panini "Road to FIFA World Cup
2026" sticker list for CAN, MAR, HAI, ECU. Replace their `placeholderTeam`
calls with `makeTeam` calls using exact player name ordering from the album.
Mark uncertain names as `'Jugador N'` rather than guessing.

**Files:** `src/data/album.ts`

**Verify:** `npx tsc --noEmit` passes. Each team has exactly 20 stickers (enforced
by Phase 1 tuple type).

**Done when:** CAN, MAR, HAI, ECU use `makeTeam` with real player arrays.

---

### T9: Research and populate Group F, H placeholder teams (NED, CPV, SAU, URU)

**What:** Same as T8 for NED, CPV, SAU, URU.

**Files:** `src/data/album.ts`

**Verify:** `npx tsc --noEmit` passes.

**Done when:** NED, CPV, SAU, URU use `makeTeam` with real player arrays.

---

### T10: Research and populate Group J, K placeholder teams (ARG, ALG, AUT, COD, UZB, COL)

**What:** Same as T8 for ARG, ALG, AUT, COD, UZB, COL.

**Files:** `src/data/album.ts`

**Verify:** `npx tsc --noEmit` passes.

**Done when:** All 14 placeholder teams converted to `makeTeam`. No `placeholderTeam`
calls remain in the file.

---

## Validation (full feature, all phases complete)

1. `npx tsc --noEmit` — zero errors.
2. `npx vite build` — clean build, no warnings.
3. Open app in browser at 390px width — header compact, all teams visible,
   progress bars correct.
4. Toggle 3 stickers on BRA → click "Copiar faltantes" → paste confirms correct
   missing list.
5. Click "Copiar todo" → paste confirms all incomplete teams, no complete teams.
6. Shiny stickers (Escudo, We Are X, CC stickers) visually distinct.
7. Zero `placeholderTeam` calls in `src/data/album.ts`.
8. Run `review-rangers` — confidence must be MEDIUM or higher.
