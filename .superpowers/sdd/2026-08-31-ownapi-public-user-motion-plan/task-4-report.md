# Task 4 Report — Public Homepage Motion

## Commit

- `7ec99a26 feat: add restrained homepage motion`
- `d8ee4ba1 fix: play homepage hero once per session`

## Scope

- Modified only `frontend/src/views/HomeView.vue` for production behavior.
- Added only `frontend/src/views/__tests__/HomeView.motion.spec.ts` for focused coverage.
- Left configured custom HTML/URL home rendering unchanged and outside the landing-page motion wrapper.
- Did not modify administrator code or `frontend/pnpm-workspace.yaml`.

## Implementation

- Added a one-time hero entrance with deterministic layer delays of `0ms`, `60ms`, `120ms`, and `180ms`.
- Kept the played flag in module memory only: the first default OwnAPI homepage mount plays, route-return remounts render the final state, and a full page session reload resets the flag naturally.
- Configured custom HTML/URL home content does not set the played flag because the flag is marked only after the default homepage is actually mounted.
- Sequenced the four gateway provider tiles through `300ms`; the final `280ms` tile animation completes at `580ms`, below the `600ms` budget.
- Reused `useInViewReveal` and global `reveal-item` behavior on eight meaningful homepage sections.
- Added provider hover lift capped at `-3px`, capability-card lift capped at `-2px`, and logo/icon scaling capped at `1.04`.
- Preserved native `details`/`summary` FAQ semantics while animating disclosure with CSS grid rows; no layout measurement loop was introduced.
- Reduced Motion immediately applies final visible classes and CSS removes animation, transform, scale, and hover displacement.
- A Reduced Motion preference also settles an active hero sequence without permitting a later replay in the same mounted instance.
- Links, CTA buttons, copy controls, and disclosure controls remain immediately interactive; no timer gates navigation or initial visibility.

## TDD Evidence

- Initial focused run failed as expected before implementation: 5 tests collected, 4 failed, 1 passed.
- Final focused run passed: 1 file, 6 tests.
- Tests explicitly verify that `IntersectionObserver.observe` receives the actual capabilities section DOM element.
- Review-fix coverage mounts custom home content first, then mounts the default homepage, routes away through `RouterView`, returns to `/home`, and verifies that the remounted hero is already settled.

## Validation

From `frontend/`:

```text
node node_modules/vitest/vitest.mjs run src/views/__tests__/HomeView.motion.spec.ts
PASS — 1 file, 6 tests

node node_modules/vitest/vitest.mjs run src/views/__tests__/HomeView.motion.spec.ts src/components/public/__tests__/PublicNavigation.spec.ts src/i18n/__tests__/homeLocales.spec.ts
PASS — 3 files, 14 tests

node_modules/.bin/vue-tsc --noEmit
PASS — no output

node_modules/.bin/eslint src/views/HomeView.vue src/views/__tests__/HomeView.motion.spec.ts
PASS — no output
```

From the repository root:

```text
git diff --check aafed565..HEAD
PASS — no output
```

The test runner emitted only the existing stale Browserslist-data advisory.
