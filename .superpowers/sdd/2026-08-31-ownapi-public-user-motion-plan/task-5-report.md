# Task 5 Report — Models And Docs Motion

## Commit

- `0792a4a8 feat: animate public model and docs interactions`

## Scope

- Modified only the four production files named by the Task 5 brief.
- Added only `frontend/src/views/public/__tests__/PublicMotion.spec.ts` for focused motion coverage.
- Did not modify administrator code, model catalog data, `DocsCodeExamples.vue`, or `frontend/pnpm-workspace.yaml`.

## Implementation

- Replaced the filtered Models result wrapper with `TransitionGroup name="motion-list"` and retained stable `${platform}:${modelId}` keys.
- Applied deterministic `0ms`, `40ms`, `80ms`, `120ms`, `160ms`, and `200ms` delays to the first six visible model entries; all later entries use `0ms`.
- Reused the shared motion duration/easing tokens while capping model-card lift at `-2px` and artwork scale at `1.02`.
- Crossfaded catalog context-tier values as one price group, preserving local button state and preventing navigation.
- Crossfaded model-detail pricing tables as whole value groups keyed by model, tier, and pricing values; individual digits do not animate.
- Added fixed-width, in-place copy feedback to the model-detail and model-code buttons; both reset after exactly 1.5 seconds and clear pending timers on unmount.
- Added active Docs navigation state driven by clicks, URL hash changes, and section intersection. Its indicator uses only transform and opacity.
- Left long prose, code blocks, and tables outside scroll-reveal behavior.
- Reduced Motion removes list delays, card/artwork hover transforms, indicator transitions/transforms, and smooth Docs scrolling while leaving all content visible.

## TDD Evidence

- Initial focused run collected 5 tests and failed all 5 before implementation.
- Final focused and related run passed 3 files / 12 tests.
- Tests cover stable list keys, bounded stagger values, hover limits, grouped price crossfades, navigation-free tier changes, exact copy reset timing, fixed copy-button dimensions, Docs active indication, observer cleanup, and absence of prose/code reveal markers.

## Validation

From `frontend/`:

```text
node node_modules/vitest/vitest.mjs run src/views/public/__tests__/PublicMotion.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts src/views/public/__tests__/ModelDetailView.spec.ts
PASS — 3 files, 12 tests

node_modules/.bin/vue-tsc --noEmit
PASS — no output

node_modules/.bin/eslint src/views/public/ModelsCatalogView.vue src/views/public/ModelDetailView.vue src/views/public/DocsView.vue src/components/models/ModelCodeExamples.vue src/views/public/__tests__/PublicMotion.spec.ts
PASS — no output
```

From the repository root:

```text
git diff --check b80c66f7..HEAD
PASS — no output
```

The test runner emitted only the existing stale Browserslist-data advisory.
