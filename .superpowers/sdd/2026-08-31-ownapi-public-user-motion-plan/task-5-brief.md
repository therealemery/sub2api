# Task 5 Brief — Models And Docs Motion

Workspace: `/Users/owen/apizhongzhuan/sub2api/.worktrees/model-pricing-motion`

Base commit: `b80c66f7`

Implement only Task 5 from `docs/superpowers/plans/2026-08-31-ownapi-public-user-motion-plan.md`. Task 4 is approved.

## Required outcome

- Models filtering/sorting uses a bounded `motion-list` TransitionGroup with stable `${platform}:${modelId}` keys.
- Only the first six visible model entries receive stagger delay; every later entry uses `0ms`.
- Model cards lift at most 2px and artwork scales at most 1.02.
- Model-detail pricing-tier values crossfade without animating digits or causing navigation.
- Docs active navigation indication moves with transform/opacity, while anchor positioning remains immediate under Reduced Motion.
- Copy confirmation crossfades, preserves button dimensions, and resets after 1.5 seconds.
- No long prose, code block, or table receives scroll-reveal motion.

## Files

- Modify `frontend/src/views/public/ModelsCatalogView.vue`
- Modify `frontend/src/views/public/ModelDetailView.vue`
- Modify `frontend/src/views/public/DocsView.vue`
- Modify `frontend/src/components/models/ModelCodeExamples.vue`
- Modify `frontend/src/components/docs/DocsCodeExamples.vue`
- Create `frontend/src/views/public/__tests__/PublicMotion.spec.ts`

## Constraints

- Follow TDD and reuse the existing global motion classes/tokens.
- Preserve all current model search/filter/sort/card navigation and Docs navigation/copy behavior.
- Keep pricing tier changes local state only; tier controls must not navigate.
- Reduced Motion must leave content fully visible and remove transforms/delays.
- Do not edit admin files or `frontend/pnpm-workspace.yaml`.
- This task consumes the current 16-model page. The approved 46-model provider-grouping expansion follows afterward and must preserve these motion contracts.

## Verification

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/views/public/__tests__/PublicMotion.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts src/views/public/__tests__/ModelDetailView.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/views/public/ModelsCatalogView.vue src/views/public/ModelDetailView.vue src/views/public/DocsView.vue src/components/models/ModelCodeExamples.vue src/views/public/__tests__/PublicMotion.spec.ts
cd ..
git diff --check b80c66f7..HEAD
```

Commit as `feat: animate public model and docs interactions`, write `task-5-report.md`, and stop after Task 5.
