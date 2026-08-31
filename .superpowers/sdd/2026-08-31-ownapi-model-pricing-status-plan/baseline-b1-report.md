# Baseline B1 Report — AccountUsageCell failures

## Implementation

- Confirmed `adminAPI.accounts.getUsage(id, source?)` intentionally receives its optional `source` argument from `AccountUsageCell`; default OpenAI requests therefore call it as `(accountId, undefined)`. Updated the five stale mock assertions to reflect that contract.
- Fixed the actual regression in the OpenAI row-data refresh watcher: it now deletes the per-account five-minute usage cache before following the existing lazy-load-aware reload path. A changed OpenAI refresh key now obtains fresh usage data even when no Codex snapshot is present.

## Tests and results

### RED

Before the repair:

```text
node node_modules/vitest/vitest.mjs run src/components/account/__tests__/AccountUsageCell.spec.ts
6 failed | 6 passed (12)
```

Failures: five stale `(accountId)` mock-call assertions observed `(accountId, undefined)`; one OpenAI row-data refresh test expected two usage requests but received one.

### GREEN

After the repair:

```text
node node_modules/vitest/vitest.mjs run src/components/account/__tests__/AccountUsageCell.spec.ts
12 passed (12)
```

Full frontend baseline:

```text
node node_modules/vitest/vitest.mjs run
4 failed | 96 passed (100)
5 failed | 583 passed (588)
Errors 1 error
```

The five remaining failures are outside B1:

1. `src/api/__tests__/settings.authSourceDefaults.spec.ts` — `appendAuthSourceDefaultsToUpdateRequest` reads `current.balance` when the source default is undefined.
2. `src/composables/__tests__/usePersistedPageSize.spec.ts` — returns `50`, while the test expects `1000`.
3. `src/components/charts/__tests__/GroupDistributionChart.spec.ts` — two cases call `toFixed` on an undefined value.
4. `src/views/auth/__tests__/EmailVerifyView.spec.ts` — pending-account request payload does not contain expected `aff_code` and includes undefined optional fields.

The run also reports one unrelated unhandled rejection from `src/views/admin/__tests__/DashboardView.spec.ts`: `DashboardView.formatCost` calls `toFixed` on undefined. Existing warnings include unresolved `router-link` stubs and intentionally exercised error-path logs; B1 introduced no warning or error output.

## Files changed

- `frontend/src/components/account/AccountUsageCell.vue`
- `frontend/src/components/account/__tests__/AccountUsageCell.spec.ts`
- `.superpowers/sdd/2026-08-31-ownapi-model-pricing-status-plan/baseline-b1-report.md`

## Self-review

- The watcher remains restricted to OpenAI OAuth accounts and retains the pre-existing lazy-load path.
- Cache invalidation is scoped to the affected account ID and matches the manual-refresh behavior.
- The assertion changes verify the actual optional-parameter API contract without changing runtime behavior.
- `git diff --check` passed.

## Concerns

- The five full-suite failures and one DashboardView unhandled rejection are pre-existing baseline issues assigned to later repair tasks; they were not modified here.
- `frontend/pnpm-workspace.yaml` remains an untracked pre-existing workspace artifact and is intentionally excluded from this commit.
