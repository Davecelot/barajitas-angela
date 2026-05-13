# General UI Refresh

## Why

The current album UI works, but it reads like a default mobile list: gray shell, generic rounded cards, emoji controls, and weak visual ownership. The Refero Duolingo reference gives a useful direction for a playful, tactile, light interface that fits a sticker-collection app.

## What

Refresh the main React UI so the album feels more intentional, playful, and task-friendly while preserving all current collection, repeated, search, copy, and filtering behavior.

## Constraints

### Must

- Keep React 19 + Vite + Tailwind v4 with no new runtime dependencies.
- Preserve the display policy in `docs/app-display-source-of-truth.md`.
- Borrow concrete reference ingredients: light canvas, rounded/tactile controls, saturated primary green, blue secondary actions, flat panels, and strong progress visibility.
- Keep mobile controls touch-friendly at 44 px or larger.
- Keep text truncation where long names could collide with controls.

### Must Not

- Do not copy Duolingo branding wholesale or add unrelated mascot/illustration clutter.
- Do not add gradients, glassmorphism, nested page-section cards, or generic marketing-page layout.
- Do not change album data, persistence, share text, or sticker counting behavior.

### Out of Scope

- New album features, roster corrections, image assets, authentication, or backend work.

## Current State

- `src/App.tsx` owns the page shell, header, tabs, specials section, filtered states, and toast.
- `src/components/SearchBar.tsx`, `TeamSection.tsx`, and `StickerCard.tsx` own the main repeated row patterns.
- `src/index.css` only imports Tailwind and disables tap highlight; no project tokens exist.

## Tasks

### T1: Taste Tokens and Base Styling

**What:** Add CSS variables, body styling, and reusable utility classes for the playful album surface.

**Files:** `src/index.css`

**Verify:** `npm run build`

---

### T2: App Shell and Controls

**What:** Redesign the shell/header/tabs/search/toast/empty states with stronger hierarchy and tactile actions.

**Files:** `src/App.tsx`, `src/components/SearchBar.tsx`

**Verify:** Browser check at mobile and desktop widths.

---

### T3: Album Sections and Sticker Rows

**What:** Refine team sections, special section, sticker rows, state badges, and repeated controls.

**Files:** `src/components/TeamSection.tsx`, `src/components/StickerCard.tsx`

**Verify:** Browser check for all tabs, search, expansion, collected, shiny, and repeated states.

## Validation

- `npm run build`
- Browser render check on the local Vite app at desktop and mobile viewport widths.
- Frontend critique pass against reference translation and anti-slop rules.
