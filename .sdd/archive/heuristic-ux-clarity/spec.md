# Heuristic UX Clarity

## Why

The album UI currently hides important mental models: `Copiar faltantes` does not
say what it copies, and repeated stickers are created in `Todas` but viewed in
`Repetidas`. This violates visibility of system status, match with the real
world, and recognition over recall.

## What

Improve the existing UI so missing-list and repeated-list workflows are visible,
named clearly, and actionable from the view where the user expects them.

## Constraints

- MUST keep React 19, Vite, Tailwind v4, and existing CSS token language.
- MUST NOT add runtime dependencies.
- MUST preserve localStorage data shape for collected and repeated stickers.
- MUST keep `Copiar faltantes` behavior but label it as a missing-list action.
- MUST add a repeated-list copy action when repeated stickers exist.
- MUST update `docs/app-display-source-of-truth.md` if display policy changes.

## Current State

- `src/App.tsx` owns tabs, global copy action, filtered repeated view, and toast.
- `src/components/StickerCard.tsx` owns collected and repeated controls.
- `src/components/TeamSection.tsx` owns per-team missing copy actions.
- `src/utils/share.ts` only formats missing team stickers.

## Tasks

### T1: Share Formatting

Add repeated-list share formatting while preserving missing-list formatting.

Verify: TypeScript build.

### T2: Header and Empty-State Clarity

Rename/structure copy actions so users can distinguish missing stickers from
trade duplicates. Add repeated-copy action in the repeated workflow.

Verify: Desktop and mobile UI inspection.

### T3: Row and Team Control Clarity

Make repeated controls and per-team copy affordances self-explanatory without
overcrowding mobile rows.

Verify: Desktop and mobile UI inspection.

## Validation

- `npm run build`
- Browser check on local Vite app at desktop and mobile widths.
