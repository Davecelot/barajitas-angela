# Barajitas Angela - Project Structure

This document defines repository ownership for app code, documentation,
evidence, generated files, and SDD work.

## Folder Map

| Path | Owner / Purpose |
| --- | --- |
| `src/` | Runtime React app code. Keep current subfolders unless a future SDD spec approves a source reorganization. |
| `src/data/` | Executable album data and TypeScript data contracts. |
| `src/components/` | React presentation components. |
| `src/hooks/` | React hooks and browser persistence behavior. |
| `src/utils/` | Small shared utilities such as share-text formatting. |
| `docs/` | Human-readable project documentation and product/display policy. |
| `docs/app-display-source-of-truth.md` | Canonical app display policy. |
| `docs/album-analysis.md` | Photo-review evidence and seeded-collection analysis. |
| `assets/album-photos/` | Raw local album photo evidence. |
| `.sdd/active/` | Specs currently being planned or implemented. |
| `.sdd/archive/` | Completed specs. |
| `.ai/` | Durable AI review decisions. |
| `.skilly-hand/`, `.codex/`, `.claude/` | Agent tooling and generated guidance. |
| `dist/`, `.playwright-cli/`, `node_modules/` | Generated or local runtime artifacts; do not treat as source. |

## Root Files

- `AGENTS.md` is the root AI routing guide.
- `package.json`, TypeScript configs, Vite config, and `index.html` stay at the
  root as build/runtime entrypoints.
- Product and evidence documentation should live in `docs/`, not at the root.

## SDD Rules

- Start non-trivial work in `.sdd/active/<feature-name>/spec.md`.
- Keep tasks small, with a concrete verify step.
- End completed specs with validation and a review-rangers pass.
- Archive completed work by moving the active spec folder to `.sdd/archive/`.

## Move Rules

- Do not move `src/` files without a dedicated SDD spec.
- Do not delete raw album photos; move them only with path references updated.
- Keep generated artifacts ignored and out of documentation ownership.
- When moving docs or assets, search for stale path references and update them
  in the same change.
