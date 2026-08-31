# Task 3 Report — Layout-Scoped Route And Mobile Navigation Motion

## Implementation summary

- Added `UserRouteTransition.vue` as the single `/admin` transition gate. Every route whose path starts with `/admin` renders its page slot directly; other shared-layout routes use `motion-fade` with `mode="out-in"`.
- Changed `LayoutView.vue` to use the router-view slot API and the stable `route.path` key around ordinary authenticated user pages. Query-only and hash-only changes therefore preserve the mounted page instance and its recovery state.
- Wrapped public page content in an appearing `motion-fade` transition keyed by `route.path`, while leaving the existing public header, footer, authentication check, and public-settings loading intact.
- Wrapped the existing public mobile panel in `motion-scale-fade`. The toggle keeps `aria-expanded`, open links remain keyboard-focusable, and link clicks still close the panel synchronously.
- Did not edit administrator views/components, motion tokens, dependencies, or the untracked `frontend/pnpm-workspace.yaml`.

## TDD evidence

### RED

The focused test was created before `UserRouteTransition.vue` existed:

```bash
node node_modules/vitest/vitest.mjs run src/components/layout/__tests__/UserRouteTransition.spec.ts
```

Result: failed as expected because `../UserRouteTransition.vue` could not be resolved.

### GREEN

```bash
node node_modules/vitest/vitest.mjs run src/components/layout/__tests__/UserRouteTransition.spec.ts
```

Result: passed — 1 test file, 8 tests.

Coverage includes the keyed router-view slot, a real-router query-only navigation that proves the user page is not remounted, ordinary-user transition name/mode, direct rendering for `/admin`, `/admin/dashboard`, and `/administrator-preview`, public-route fade configuration, and a real Vue Transition/router mobile-menu path. The mobile test verifies native-button focus and modeled Enter activation, real transition enter/leave classes, a focusable real router link, immediate `router.push`, immediate `aria-expanded=false`, and final route completion.

## Validation

Passed from `frontend/` using installed local binaries:

```bash
node node_modules/vitest/vitest.mjs run src/components/layout/__tests__/UserRouteTransition.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/components/public/PublicSiteLayout.vue src/components/public/PublicSiteHeader.vue src/components/layout/LayoutView.vue src/components/layout/UserRouteTransition.vue src/components/layout/__tests__/UserRouteTransition.spec.ts
```

Relevant route/navigation regression suite also passed:

```bash
node node_modules/vitest/vitest.mjs run src/components/layout/__tests__/UserRouteTransition.spec.ts src/components/public/__tests__/PublicNavigation.spec.ts src/router/__tests__/guards.spec.ts src/router/__tests__/title.spec.ts
```

Result: 4 files, 55 tests passed.

Passed from the worktree root:

```bash
git diff --check ebda251f..HEAD
```

Vitest emitted only the pre-existing stale Browserslist-data notice; no test, type, lint, or whitespace error occurred.

## Changed files

- `frontend/src/components/public/PublicSiteLayout.vue`
- `frontend/src/components/public/PublicSiteHeader.vue`
- `frontend/src/components/layout/LayoutView.vue`
- `frontend/src/components/layout/UserRouteTransition.vue`
- `frontend/src/components/layout/__tests__/UserRouteTransition.spec.ts`

## Commit

- `741d9f59 feat: scope route motion to public and user pages`
- `a6d658e2 fix: preserve user pages across query navigation`

## Scope notes and limitations

- Public views continue to own `PublicSiteLayout`; `appear` ensures their route content fades in whenever a public path mounts. Query/hash-only changes do not replace that content wrapper.
- Administrator pages still use the existing shared shell, but their routed page content is not wrapped by Vue Transition and receives no transition name.
- No known Task 3 functional limitation remains.

## Review fix round 1

- Important resolved: replaced `route.fullPath` keys with `route.path` so Payment and other ordinary-user pages retain component state during query/hash-only recovery navigation. A memory-router regression test changes `/payment?resume=confirm` to `/payment?resume=complete` and proves one mount and zero unmounts.
- Minor resolved: removed the router-link and Transition stubs from the mobile behavior path. The regression now uses a memory router, real RouterLink, and real Vue Transition; it verifies native-button focus/Enter semantics, synchronous navigation initiation and menu-close state, completed navigation, and the actual leave phase.
