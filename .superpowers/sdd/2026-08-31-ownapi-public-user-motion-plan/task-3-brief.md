# Task 3 Brief — Layout-Scoped Route And Mobile Navigation Motion

Workspace: `/Users/owen/apizhongzhuan/sub2api/.worktrees/model-pricing-motion`

Base commit: `ebda251f`

Implement only Task 3 from `docs/superpowers/plans/2026-08-31-ownapi-public-user-motion-plan.md`.

## Required outcome

- Public routes use the existing `motion-fade` transition.
- Ordinary authenticated user routes use the same scoped transition.
- Every path beginning with `/admin` bypasses the transition wrapper/name.
- The public mobile navigation panel uses `motion-scale-fade` without changing its accessibility, focusability, or immediate click behavior.
- No administrator view/component styles or behavior are changed.

## Files

- Modify `frontend/src/components/public/PublicSiteLayout.vue`
- Modify `frontend/src/components/public/PublicSiteHeader.vue`
- Modify `frontend/src/components/layout/LayoutView.vue`
- Create `frontend/src/components/layout/UserRouteTransition.vue`
- Create `frontend/src/components/layout/__tests__/UserRouteTransition.spec.ts`

## Implementation constraints

- Follow test-first development: add the failing focused tests before implementation.
- Use router-view slot APIs and stable route keys.
- Centralize the admin bypass decision in `UserRouteTransition.vue`; do not duplicate fragile route checks.
- Keep the public layout's existing header/footer and auth/settings behavior.
- Preserve the mobile panel's `aria-expanded`, keyboard reachability, route-link click behavior, and responsive layout.
- Reuse existing motion classes/tokens. Do not add an animation dependency or edit admin files.
- Do not touch the untracked `frontend/pnpm-workspace.yaml`.

## Verification

Run with installed local binaries if pnpm wrapper reports the known ignored-build issue:

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/components/layout/__tests__/UserRouteTransition.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/components/public/PublicSiteLayout.vue src/components/public/PublicSiteHeader.vue src/components/layout/LayoutView.vue src/components/layout/UserRouteTransition.vue src/components/layout/__tests__/UserRouteTransition.spec.ts
cd ..
git diff --check ebda251f..HEAD
```

Commit the task as `feat: scope route motion to public and user pages`, then write `task-3-report.md` in this SDD directory with test outputs, changed files, commit hash, scope notes, and any known limitations. Commit the report separately if needed. Stop after Task 3.
