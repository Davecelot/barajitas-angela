<!-- Managed by skilly-hand native setup. Re-run `npx skilly-hand native setup` to regenerate. -->
# skilly-hand Native Bootstrap (codex)

This file is managed by skilly-hand to keep native rule file rules/hooks consistent.

## Always-On Defaults
- Apply AGENTS guidance from the repository root before task routing.
- Enforce optimizer gate order: `token-optimizer` then `output-optimizer`.
- Keep output concise by default (`step-brief`) unless user asks otherwise.

## Skill Hooks / Rules
- [required] roaster/plan-challenge
  - Trigger: When the user proposes, requests, or evaluates a plan of any kind
  - Rule: Invoke roaster to critique assumptions, scope, sequencing, risks, and verification before agreeing with the plan.

## Token-Safe Review Stage
- Run token-optimizer before review-rangers when doing risk-heavy review passes.
- Keep review verdicts concise unless a blocker requires expanded rationale.

## Sync
- Regenerate this file via `npx skilly-hand native setup` after workflow updates.
