# October 2026 security remediation

## Why

The October security audit reports vulnerable build dependencies and mutable CI action refs. Review also confirms plaintext account passwords ship in the browser bundle, and a forged localStorage user id grants editing controls.

## What

Remove vulnerable dependencies, pin the patched Node runtime and verified action commits, and remove client-side credentials/session authorization. Keep album data and display unchanged; when no authenticated HTTPS API is configured, fail closed to browsing/export only.

## Constraints

- MUST preserve album IDs, seed data, sticker display, import/export structure, and browser collection state.
- MUST NOT put credentials or secret values in source, bundles, logs, or evidence.
- MUST reject forged stored sessions and require backend validation before editing.
- MUST keep audits and source checks enforced, including development dependencies.
- MUST use existing checkout and the authorized security branch.

## Current State

HEAD and origin/main: 34973ad878b48b3ef1cadcd16b9b9c095c3e9fe6. Five high, one moderate, one low dependency findings at baseline. Existing tests: 9 passing. Actual auth is static despite docs describing a Worker; backend is absent.

## Approval Policy

User explicitly authorized all necessary security fixes and gave full permissions. Self-review satisfies routine approval; parent informed of the fail-closed auth change. Independent repository task in the workspace remediation plan.

## Tasks

### T1: Dependency/runtime/CI hardening

- What: dependency audit returns no high/critical findings; Node 24.22.1 is pinned; action commits are immutable.
- Required capabilities: dependency review and build validation.
- Files: package manifests/lock, .nvmrc, deploy workflow, dependency gate.
- Scenario: given a clean install, tests and production build succeed on the patched runtime.
- Verify: npm ci; npm audit --json; npm test; npm run build.
- Done: audit and functional checks pass.
- State: DONE.
- Evidence: npm ci PASS; full npm audit zero findings; npm test 26/26 PASS; TypeScript + Vite production build PASS; official full action SHAs resolved through GitHub.

### T2: Fail-closed authentication

- What: credentials no longer ship; stored data cannot forge authenticated editing; absent/untrusted API fails closed.
- Required capabilities: React/TypeScript security analysis and regression testing.
- Files: auth hook/client, auth UI, credential file, tests, app display policy.
- Scenario: given forged legacy storage or no authenticated backend, opening the app or submitting credentials never grants editing.
- Verify: regression tests first fail on the baseline, then pass after implementation; build output excludes legacy credential strings without printing them.
- Done: meaningful regressions, tests and build pass.
- State: DONE.
- Evidence: credential bundle constraint RED then GREEN; credential diagnostics RED then GREEN; 8 auth contract/forgery/race regressions PASS; production browser check rejects forged legacy identity, preserves album storage, allows export and disables import; no legacy passwords found in bundle.

### T3: Review and handoff

- What: final review-rangers verification and local commit; parent handles push and PR.
- Required capabilities: independent code review and Git.
- Files: final diff and evidence report.
- Verify: security checks, full suite, album validator, clean diff check, review gate.
- Done: reviewed commit and exact evidence handed to parent.
- State: DONE.

## Validation

Run the repo's test, album-data validation, source security, dependency audit and build gates. Inspect generated bundle for legacy credentials without logging values. Review backend-dependent runtime behavior separately; unavailable backend cannot be claimed as validated.

## Progress

Implementation, validation and independent review complete. Album data/seed code unchanged.

React preflight: current installed safe 19.2.6, registry latest 19.3.1. No framework migration needed; implementation uses supported existing APIs. Official react.dev version page was network-blocked; source/security verification is recorded independently.

## Final verification — 2026-10-22

26 tests, full dependency audit (zero), source gate, album validation and production build passed. Independent five-member committee and expert guard: HIGH, approve with caveats. A cross-tab invalid-token cleanup race can force login again; album data and authorization remain protected. Real external authentication and shared album writes were not deployed. Source/seed album files unchanged. Remote publication is tracked by the workspace remediation report.
