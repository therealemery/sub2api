# SDD ledger — plan: docs/superpowers/plans/2026-08-31-ownapi-public-user-motion-plan.md

Workspace: `/Users/owen/apizhongzhuan/sub2api/.worktrees/model-pricing-motion`
Branch: `codex/model-pricing-motion`
Baseline: `7b2c9cc2`
Spec: `docs/superpowers/specs/2026-08-31-ownapi-public-user-motion-design.md`

## Baseline

- Model pricing and public Status plan completed and final-reviewed clean at `7b2c9cc2`.
- Frontend baseline: 103 files / 608 tests passed; ESLint, typecheck, production build, and browser QA passed.
- Existing untracked `frontend/pnpm-workspace.yaml` remains out of scope and untouched.

## Plan preflight scan

| Tasks / item | Producer → consumer or internal agreement | Finding |
| --- | --- | --- |
| 1 → 2–7 | motion tokens and Reduced Motion ref → every motion primitive/consumer | Clean; Task 1 must land first. |
| 2 → 4–5 | reveal composable → public page reveals | Clean. |
| 1 ↔ 3 | transition CSS → layout-scoped route/mobile transitions | Clean; admin exclusion is explicit. |
| 3 ↔ 6–7 | user layout route transition → ordinary user pages | Clean; component motion remains opt-in. |
| 4 ↔ 5 | Home vs Models/Docs public motion | Clean; separate files except shared primitives. |
| 6 ↔ 7 | dashboard number/chart motion vs user interaction feedback | Clean; no competing ownership. |
| 1–7 → 8 | implementation and tests → full QA and durable handoff | Clean. |
| Task 1 internal | token names/timings align with composable contract | Clean. |
| Task 2 internal | no-JS, missing observer, reduced-motion fallbacks | Clean. |
| Task 3 internal | public/user transitions exclude every `/admin` route | Clean. |
| Task 4 internal | hero sequence is bounded and interactions remain immediate | Clean. |
| Task 5 internal | list delays cap after six; code/prose avoid reveal motion | Clean. |
| Task 6 internal | RAF count-up preserves previous values and reduced motion | Clean. |
| Task 7 internal | motion is one-shot/request-bound; dense rows stay static | Clean. |
| Task 8 internal | normal/reduced-motion QA and admin exclusion are explicit | Clean. |

## Task execution

- Task 1: minor resolved in `4bbcfb1d`: removed trailing whitespace from `frontend/src/composables/__tests__/useReducedMotion.spec.ts:46`; full task-range `git diff --check` passes.
- Task 1: review at `b03f7cde` found reduced-motion list FLIP transforms are not neutralized; fix round 1 dispatched to the original implementer.
- Task 1: fix round 1/5 (1 addressed, 0 open — Reduced Motion now disables `.motion-list-move` transition and transform; commits `b03f7cde..b0ecf130`).
- Task 1: complete (commits `7b2c9cc2..4bbcfb1d`, review clean; no deferred findings).
- Task 2: complete (commit `a6ed6622`; independent review clean; focused tests 2 files / 7 tests, ESLint, `vue-tsc --noEmit`, and range `git diff --check` passed; no deferred findings).
- Task 3: review round 1 found query/hash-only navigation could remount user pages and that mobile-menu interaction coverage used stubs; both findings were fixed in `a6d658e2`.
- Task 3: complete (implementation `741d9f59`, fix `a6d658e2`; independent re-review clean; 4 related files / 55 tests, ESLint, `vue-tsc --noEmit`, and range `git diff --check` passed; no deferred findings).
