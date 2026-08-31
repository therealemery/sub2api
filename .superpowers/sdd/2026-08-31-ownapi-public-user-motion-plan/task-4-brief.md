# Task 4 Brief — Public Homepage Motion

Workspace: `/Users/owen/apizhongzhuan/sub2api/.worktrees/model-pricing-motion`

Base commit: `aafed565`

Implement only Task 4 from `docs/superpowers/plans/2026-08-31-ownapi-public-user-motion-plan.md`. Task 3 is approved.

## Required outcome

- The default public homepage visibly gains a restrained one-time hero entrance, provider/gateway visual sequencing, in-view section reveals, subtle provider/capability hover feedback, and an animated FAQ disclosure.
- The full hero sequence remains below 600ms and never delays or blocks links/buttons.
- Reduced Motion immediately exposes final content and removes transforms.
- Configured custom HTML/URL home content keeps its current behavior and is not wrapped in the OwnAPI landing motion.

## Files

- Modify `frontend/src/views/HomeView.vue`
- Create `frontend/src/views/__tests__/HomeView.motion.spec.ts`

## Implementation constraints

- Follow TDD: write focused failing tests before implementation.
- Reuse `useInViewReveal`, existing `reveal-item` styles, and global motion tokens; do not add a dependency.
- Hero eyebrow/title/actions/gateway layers use deterministic bounded delays `0ms`, `60ms`, `120ms`, and `180ms`; provider visual tiles may continue only within the sub-600ms budget.
- Apply in-view reveal to meaningful section containers, not every paragraph/list row.
- Provider tiles may lift at most `translateY(-3px)`; capability cards at most `translateY(-2px)`; icon/logo scaling at most `1.04`.
- FAQ animation must use CSS grid rows or a Vue transition and must not measure layout on every frame. Native semantics and keyboard activation must remain intact.
- Copy buttons, navigation links, CTAs, and details/summary must respond immediately.
- Do not edit admin files or the untracked `frontend/pnpm-workspace.yaml`.

## Verification

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/views/__tests__/HomeView.motion.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/views/HomeView.vue src/views/__tests__/HomeView.motion.spec.ts
cd ..
git diff --check aafed565..HEAD
```

Commit the implementation as `feat: add restrained homepage motion`, write `task-4-report.md` with exact validation results and scope notes, and stop after Task 4.
