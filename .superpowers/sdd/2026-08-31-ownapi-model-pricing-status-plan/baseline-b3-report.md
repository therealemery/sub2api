# Baseline B3 Report — Undefined chart-cost rendering

## Implementation

- Diagnosed a shared legacy-payload compatibility gap: `GroupStat.account_cost`, `DashboardStats.today_account_cost`, and `DashboardStats.total_account_cost` are newer fields that older chart/dashboard payloads and existing mocks can omit. Both views passed the absent field to an identical `formatCost`, which then called `toFixed` on `undefined`.
- Added `normalizeFiniteNumber` as the small shared guard used by both affected cost formatters. It preserves finite numeric values exactly and converts absent, non-numeric, `NaN`, and infinite values to `0` before the unchanged cost-precision thresholds run.
- Made the three newer account-cost fields optional in their frontend API types to reflect legacy-response compatibility.
- Added chart assertions for an omitted account cost and explicit non-finite cost inputs; all three displayed cost columns render `$0.0000`. The dashboard test now asserts the omitted account cost renders stably after its async data load.

## Tests and results

### RED

Before the repair:

```text
node node_modules/vitest/vitest.mjs run src/components/charts/__tests__/GroupDistributionChart.spec.ts src/views/admin/__tests__/DashboardView.spec.ts
2 failed | 1 passed (3)
Errors 1 error
```

`GroupDistributionChart` failed both tests with `Cannot read properties of undefined (reading 'toFixed')`. `DashboardView.spec.ts` completed its assertion but emitted an unhandled render rejection from the same `formatCost` pattern.

### GREEN

```text
node node_modules/vitest/vitest.mjs run src/components/charts/__tests__/GroupDistributionChart.spec.ts src/views/admin/__tests__/DashboardView.spec.ts
2 passed | 4 passed (4)

node_modules/.bin/vue-tsc --noEmit
passed

git diff --check
passed

node node_modules/vitest/vitest.mjs run
100 passed | 590 passed (590)
```

The full suite has no remaining failures or unhandled errors. It continues to print existing `router-link` test-stub warnings and intentionally exercised error-path logs; neither is a test failure.

## Files changed

- `frontend/src/utils/format.ts`
- `frontend/src/types/index.ts`
- `frontend/src/components/charts/GroupDistributionChart.vue`
- `frontend/src/components/charts/__tests__/GroupDistributionChart.spec.ts`
- `frontend/src/views/admin/DashboardView.vue`
- `frontend/src/views/admin/__tests__/DashboardView.spec.ts`
- `AGENTS.md`
- `.superpowers/sdd/2026-08-31-ownapi-model-pricing-status-plan/baseline-b3-report.md`

## Self-review

- Valid finite values still use the original `>= 1000`, `>= 1`, and `>= 0.01` branches, so token ordering, actual-cost ordering, and valid cost precision are unchanged.
- The normalizer is deliberately strict: numeric strings are not silently coerced; all non-finite or absent values use the established zero-cost display instead.
- Focused tests verify the legacy omitted-field path, explicit non-finite values, tooltip formatting, and the dashboard's post-load render.

## Concerns

- `frontend/pnpm-workspace.yaml` remains an untracked pre-existing workspace artifact and is intentionally excluded from this commit.
