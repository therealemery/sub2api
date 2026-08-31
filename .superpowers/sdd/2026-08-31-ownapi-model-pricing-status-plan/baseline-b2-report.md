# Baseline B2 Report — Authentication, settings defaults, and page size

## Implementation

- `EmailVerifyView` now restores the OAuth-session affiliate code when `register_data` does not include an explicit affiliate code. Pending OAuth account-creation requests include `invitation_code`, adoption decisions, and `aff_code` only when each value exists. This preserves a separately stored `oauth_aff_code` without serializing undefined optional fields.
- `appendAuthSourceDefaultsToUpdateRequest` now uses the module-declared balance, concurrency, subscription, and grant defaults when a source is absent from its input map.
- `getPersistedPageSize` now resolves from the current configured system page-size default, so a stale local `table-page-size` value cannot override that setting. The existing setter continues to write the local preference for compatibility with current callers.
- Updated the EmailVerifyView fixture to store `oauth_aff_code`, the separate persistence location that the assertion requires. The prior fixture expected `AFF123` without providing it through either registration data or OAuth affiliate storage.

## Tests and results

### RED

Before the repair:

```text
node node_modules/vitest/vitest.mjs run src/views/auth/__tests__/EmailVerifyView.spec.ts src/api/__tests__/settings.authSourceDefaults.spec.ts src/composables/__tests__/usePersistedPageSize.spec.ts
3 failed | 8 passed (11)
```

Failures:

1. `EmailVerifyView.spec.ts` omitted `aff_code` and serialized `invitation_code`, `adopt_display_name`, and `adopt_avatar` as undefined.
2. `settings.authSourceDefaults.spec.ts` threw while reading `balance` on an absent source entry.
3. `usePersistedPageSize.spec.ts` returned stale local value `50` instead of configured default `1000`.

### GREEN

```text
node node_modules/vitest/vitest.mjs run src/views/auth/__tests__/EmailVerifyView.spec.ts src/api/__tests__/settings.authSourceDefaults.spec.ts src/composables/__tests__/usePersistedPageSize.spec.ts
3 passed (11)

node_modules/.bin/vue-tsc --noEmit
passed

git diff --check
passed
```

Full frontend baseline:

```text
node node_modules/vitest/vitest.mjs run
1 failed | 99 passed (100)
2 failed | 586 passed (588)
Errors 1 error
```

The remaining failures are outside B2:

1. `src/components/charts/__tests__/GroupDistributionChart.spec.ts` — both cases fail because `GroupDistributionChart.formatCost` calls `toFixed` on an undefined value.
2. `src/views/admin/__tests__/DashboardView.spec.ts` — the test passes but emits one unhandled rejection because `DashboardView.formatCost` calls `toFixed` on an undefined value.

The run also emits pre-existing `router-link` resolution warnings and intentionally exercised error-path logs.

## Files changed

- `frontend/src/views/auth/EmailVerifyView.vue`
- `frontend/src/views/auth/__tests__/EmailVerifyView.spec.ts`
- `frontend/src/api/admin/settings.ts`
- `frontend/src/composables/usePersistedPageSize.ts`
- `AGENTS.md`
- `.superpowers/sdd/2026-08-31-ownapi-model-pricing-status-plan/baseline-b2-report.md`

## Self-review

- OAuth affiliate resolution preserves explicit registration data first, then the OAuth session value, then the longer-lived referral value.
- Pending OAuth request spreading omits absent optional values while preserving explicit `false` adoption choices.
- Missing auth-source entries serialize exactly the existing declared module defaults and do not change supplied source values.
- Page-size reads now agree with the current settings contract, while the setter remains API-compatible for existing callers.
- Type checking and `git diff --check` passed.

## Concerns

- The full suite still has the two unrelated GroupDistributionChart test failures and one unrelated DashboardView unhandled rejection listed above.
- `frontend/pnpm-workspace.yaml` remains an untracked pre-existing workspace artifact and is intentionally excluded from this commit.

## Fix round 1 — Partial adoption decisions

### Implementation

- Preserved each persisted adoption decision only when its raw value is a boolean. A partial decision such as `{ adopt_display_name: true }` now retains `adoptAvatar` as `undefined`, so pending OAuth account creation omits `adopt_avatar` instead of serializing `false`.
- Added a regression test that asserts a partial adoption decision submits only `adopt_display_name: true`.

### RED

```text
node node_modules/vitest/vitest.mjs run src/views/auth/__tests__/EmailVerifyView.spec.ts
1 failed | 7 passed (8)
```

The new regression test observed the erroneous `adopt_avatar: false` request property.

### GREEN

```text
node node_modules/vitest/vitest.mjs run src/views/auth/__tests__/EmailVerifyView.spec.ts
1 passed (8)

node node_modules/vitest/vitest.mjs run src/views/auth/__tests__/EmailVerifyView.spec.ts src/api/__tests__/settings.authSourceDefaults.spec.ts src/composables/__tests__/usePersistedPageSize.spec.ts
3 passed (12)
```

### Self-review

- Explicit `false` values remain serialized because they pass the boolean check.
- Missing or non-boolean values remain `undefined` and are omitted by the existing conditional request spreading.
- The change is restricted to the pending OAuth adoption-decision parser and its covering test.
