# Task 3 report: catalog filters, sorting, and price cards

Status: complete

Commit:
- `12e6def5` — `feat: expand public model pricing filters`

Implemented:
- Replaced public catalog capability filtering with provider, model class, and endpoint filters.
- Replaced the generic price sort with `input-price` and `output-price`, using derived OwnAPI discounted prices with missing values sorted last.
- Replaced one-line model-card pricing with traceable Input, Cached input, and Output rows that show official list prices struck through and OwnAPI prices as primary.
- Added the visible `Official price × 70%` / `官方价 7 折` badge, checked-at text, unpublished fallback copy, and alias copy.
- Added card-scoped Grok short/long context pricing buttons with `@click.prevent.stop`.

Tests:
- Red baseline: `pnpm vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts` did not reach Vitest because the pnpm wrapper stopped on `ERR_PNPM_IGNORED_BUILDS`.
- Red baseline fallback: `node_modules/.bin/vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts` failed on the new filter/sort/pricing expectations before implementation.
- Final: `node_modules/.bin/vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts` passed, 12 tests.
- Final: `node_modules/.bin/vue-tsc --noEmit` passed.
- Final: `node_modules/.bin/eslint src/data/modelCatalog.ts src/data/__tests__/modelCatalog.spec.ts src/views/public/ModelsCatalogView.vue src/views/public/__tests__/ModelsCatalogView.spec.ts` passed.
- Final: `git diff --check` passed.

Testing ruling:
- I used focused domain and component tests instead of mounting the full app route. The component test mounts the real catalog view with a mocked resolved model-display config, stubs the layout/router link, and verifies rendered pricing plus Grok context switching. This avoids brittle router/auth/network setup while still exercising the production catalog view structure.

Concerns:
- The pnpm wrapper remains blocked by ignored dependency build scripts before test execution. Local binaries are reliable in this worktree and were used for final verification.
- Existing untracked `frontend/pnpm-workspace.yaml` was present before this task and was left untouched.
- Browserlist data still emits the pre-existing stale-data warning during Vitest.

## Review fix round 1/5

Status: complete

Commit:
- `fix: make model pricing cards valid markup`

Fixed:
- Replaced whole-card `router-link` markup with `article.model-card` shells and scoped links for artwork, title/model ID, and the final detail affordance.
- Kept Grok short/long context buttons outside anchors and added `aria-pressed` to the selected tier state.
- Added visible localized `/ 1M tokens` units beside each primary card price.
- Added output-price ascending coverage across the full catalog and tightened the Grok tier test to assert no nested `a button` structure.

Tests:
- Red baseline: `node_modules/.bin/vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts` failed on missing visible units and nested buttons inside anchors before the fix.
- Final: `node_modules/.bin/vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts` passed, 12 tests.
- Final: `node_modules/.bin/vue-tsc --noEmit` passed.
- Final: `node_modules/.bin/eslint src/data/modelCatalog.ts src/data/__tests__/modelCatalog.spec.ts src/views/public/ModelsCatalogView.vue src/views/public/__tests__/ModelsCatalogView.spec.ts` passed.
- Final: `git diff --check` passed.

Concerns:
- `pnpm vitest ...` remains blocked by the pnpm wrapper's ignored-builds preflight, unchanged from the original Task 3 report.
- Existing untracked `frontend/pnpm-workspace.yaml` remains untouched.
