# OwnAPI DeepSeek Sale and GPT-6 Pricing Implementation Plan

## Goal

Publish `deepseek-v4.1-flash` and `deepseek-v4-pro` through a dedicated, fail-closed Packy
`deepseek-sale` account while correcting GPT-6 Astra public pricing and customer billing. Keep
customer authentication and model IDs entirely within OwnAPI, and keep Packy credentials, account
names, endpoints, and the private `deepseek-v4-flash` alias out of customer responses.

## Task 1: Lock the public catalog contract with tests

Files:

- Modify `frontend/src/data/__tests__/modelCatalog.spec.ts`.
- Modify `frontend/src/views/public/__tests__/ModelDetailView.spec.ts` if the tier presentation needs explicit coverage.

Steps:

1. Add failing assertions for both DeepSeek model IDs, their official prices, their exact 75-percent customer prices, and the resulting catalog count.
2. Replace the stale GPT-6 short-context expectations with `$10/$1/$50` official pricing and assert the 70-percent customer values.
3. Assert the existing GPT-6 long tier remains `$20/$2/$75` official and `$14/$1.4/$52.5` customer.
4. Run the focused tests and confirm the new assertions fail for the intended missing data only.

## Task 2: Implement the catalog pricing changes

Files:

- Modify `frontend/src/data/verifiedModelSeeds.ts`.
- Modify `frontend/src/data/modelCatalog.ts`.
- Modify localized copy only if the existing generic family copy cannot represent the 75-percent label.

Steps:

1. Extend the explicit catalog multiplier type to include `0.75` without changing the automatic 70/80-percent profitability bands used by other models.
2. Add both DeepSeek models with the approved official and 75-percent prices.
3. Correct GPT-6 Astra short official prices and preserve its 200,000-token long-tier boundary.
4. Ensure cards and detail views derive the visible discount label and prices from the explicit multiplier.
5. Run focused frontend tests, Vue type checking, and focused lint.

## Task 3: Lock and implement exact Packy routing

Files:

- Modify `backend/internal/pkg/openai_compat/upstream_capability.go` and its tests.
- Modify `backend/internal/service/openai_model_mapping_test.go` or the closest request-rewrite test.

Steps:

1. Prove both customer model IDs use OpenAI Chat Completions and unknown DeepSeek variants remain fail-closed.
2. Prove `deepseek-v4.1-flash` rewrites to private upstream `deepseek-v4-flash`, while `deepseek-v4-pro` remains exact.
3. Assert the managed request uses the server-side credential and does not expose customer or private account metadata.
4. Add only the two approved model IDs to the exact protocol table and reuse existing `credentials.model_mapping` behavior.
5. Keep both models absent from Core, Expansion, ZAI, and GPT-5.4 scopes.

## Task 4: Lock and implement migration 141

Files:

- Add `backend/migrations/141_add_deepseek_sale_and_fix_gpt6_pricing.sql`.
- Add `backend/migrations/deepseek_sale_gpt6_pricing_migration_test.go`.
- Add or modify a PostgreSQL migration integration test under `backend/internal/repository/`.

Steps:

1. Assert exact channel/account/model mappings, DeepSeek 75-percent customer prices, and all GPT-6 short/long billing values.
2. Upsert both DeepSeek customer prices into `OwnAPI LLM` and replace GPT-6 default and interval prices, including cache write/read.
3. When and only when `Packy / DeepSeek Sale` exists, scope a dedicated account-cost rule to that account, seed normalized Packy costs, and merge the exact two-entry mapping whitelist.
4. Never create an account, token, or secret credential in the migration; preserve all unrelated accounts and data.
5. Execute the migration twice in integration tests and verify idempotence and safe behavior when the account is absent.

## Task 5: Integrated verification and handoff

Files:

- Modify `AGENTS.md`.

Steps:

1. Run focused and full frontend tests, Vue type checking, focused ESLint, and production build.
2. Run focused Go protocol, mapping, migration, repository, service, and handler tests.
3. Run the PostgreSQL migration double-execution integration test when its environment is available.
4. Run `git diff --check`, inspect the complete diff, and leave protected untracked files untouched.
5. Commit and push the verified source, deploy through the existing workflow, then verify health, catalog routes, migration 141, GPT-6 prices, and fail-closed DeepSeek behavior before the account exists.
6. After a valid `deepseek-sale` token is entered, configure only `Packy / DeepSeek Sale`. Do not run paid requests without separate explicit approval.
