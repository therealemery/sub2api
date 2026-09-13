# OwnAPI Text Pricing and Conditional Multiplier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make OwnAPI text-model sale prices, customer-specific discounts, DeepSeek weekday peak charges, Packy account costs, account routing, and usage-history evidence use one fail-closed and auditable pricing decision.

**Architecture:** Add a backend-owned request-condition registry and lock one immutable `RequestPricingContext` immediately before each upstream attempt. Only the final billable successful attempt carries that context into settlement; customer billing and account-cost accounting consume the same object, while model display receives a sanitized public projection of the same registry. Additive usage-log fields preserve the effective timestamp and both multipliers, and new checksum-safe migrations correct current price/account snapshots without changing migration 141 or storing credentials.

**Tech Stack:** Go 1.26.3, Gin, Ent, PostgreSQL migrations, Redis-backed scheduling, Vue 3, TypeScript, Pinia, vue-i18n, Vitest, Testify, sqlmock, Docker Compose, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-13-ownapi-text-pricing-conditional-multiplier-design.md`

## Global Constraints

- Keep customer authentication on OwnAPI API keys and never expose Packy hostnames, credentials, account names, token-group names, private model aliases, raw request IDs, or raw upstream errors.
- Treat manufacturer USD list prices and Packy CNY cost cards as independent reviewed facts; normalize Packy reporting at exactly `6.7 CNY = 1 USD`.
- Sell verified Packy costs at or below 60 percent of manufacturer list at 70 percent of list; sell costs above 60 percent through 80 percent at 80 percent; remove costs above 80 percent or unverifiable exact prices from both public discovery and customer API availability.
- Keep the standard OwnAPI customer group at `1.0`; resolve exactly one negotiated multiplier in this order: customer-and-model, customer-and-group, group, default `1.0`.
- Route `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-6-astra` only through an existing exact-name `Packy / Codex` account with exact mappings; never create, move, copy, rotate, or expose a credential in code or SQL.
- Route `deepseek-v4.1-flash` only through `Packy / DeepSeek Sale` and privately map it to `deepseek-v4-flash`; keep `deepseek-v4-pro` unavailable until its exact manufacturer-authoritative USD price is reviewed.
- Evaluate the DeepSeek rule in `Asia/Shanghai`: Monday-Friday `[09:00,12:00)` and `[14:00,18:00)` are `2.0`; equivalent UTC windows are `[01:00,04:00)` and `[06:00,10:00)`; weekends and all other times are `1.0`.
- Lock the factor from the final billable successful attempt's send timestamp. Failed attempts create no charge; response completion across a boundary never changes the locked value.
- Apply the same condition factor to input, output, cache-read, and cache-write customer components and Packy-cost components. Store it separately from the negotiated customer multiplier.
- Use GPT-6 Astra's long tier only above 272,000 total input tokens; exactly 272,000 remains in the short tier.
- Do not edit deployed migration `141_add_deepseek_sale_and_fix_gpt6_pricing.sql`; all corrections use new idempotent migrations.
- Preserve `.codex-qa/`, `.vite/`, `LightsailDefaultKey-ap-northeast-1.pem`, and `frontend/pnpm-workspace.yaml`; do not stage or modify them.
- Do not deploy or create a paid upstream request until local/CI verification is complete and the user gives a separate explicit approval for the minimum paid smoke test.

---

### Task 1: Implement and validate the request-condition rule registry

**Files:**

- Create: `backend/internal/service/request_pricing_condition.go`
- Test: `backend/internal/service/request_pricing_condition_test.go`

**Interfaces:**

- Consumes: canonical customer model ID and an upstream-attempt `time.Time`.
- Produces:

```go
type RequestPricingConditionRule struct {
	ID                     string
	Models                 []string
	Timezone               string
	Weekdays               []time.Weekday
	Windows                []RequestPricingTimeWindow
	CustomerMultiplier     float64
	UpstreamCostMultiplier float64
	NameEN                 string
	NameZH                 string
	Source                 string
	VerifiedAt             string
}

type RequestPricingTimeWindow struct {
	StartMinute int
	EndMinute   int
}

type RequestPricingContext struct {
	CanonicalModel         string
	AccountingModel        string
	EffectiveAt            time.Time
	RuleID                  string
	CustomerMultiplier     float64
	UpstreamCostMultiplier float64
}

type PricingClock func() time.Time

func ValidateRequestPricingConditionRules(rules []RequestPricingConditionRule) error
func ResolveRequestPricingContext(model string, sentAt time.Time) (RequestPricingContext, error)
func PublicRequestPricingConditionRules() []PublicRequestPricingConditionRule
```

- `PublicRequestPricingConditionRule` contains only `ID`, canonical `Models`, `Timezone`, `Weekdays`, `Windows`, `CustomerMultiplier`, `NameEN`, and `NameZH`; it contains no source label, Packy cost multiplier, account, route, or private alias.
- `ResolveRequestPricingContext` canonicalizes known OwnAPI spelling, records `EffectiveAt` in UTC, defaults both factors to `1.0`, and returns an error for a model whose applicable registry is invalid rather than silently guessing.

- [ ] **Step 1: Write the failing evaluator tests**

Add table-driven tests with explicit fixed instants for Monday standard time, both Monday openings, both closings, Friday peak time, Saturday time, and the equivalent UTC instants. Assert the half-open boundary contract and exact rule ID:

```go
tests := []struct {
	name string
	at   string
	want float64
}{
	{"morning before", "2026-09-14T00:59:59Z", 1},
	{"morning opens", "2026-09-14T01:00:00Z", 2},
	{"morning closes", "2026-09-14T04:00:00Z", 1},
	{"afternoon opens", "2026-09-14T06:00:00Z", 2},
	{"afternoon closes", "2026-09-14T10:00:00Z", 1},
	{"weekend", "2026-09-19T02:00:00Z", 1},
}
```

Also assert that `deepseek-v4.1-flash` matches the provider-neutral ID `deepseek-weekday-peak-2026-09-13`, an unrelated model returns neutral factors with no rule ID, and public projection contains no upstream/account/cost fields.

- [ ] **Step 2: Write the failing registry-validation tests**

Assert errors for duplicate IDs, duplicate/overlapping model ownership, an invalid IANA zone, a window with `StartMinute >= EndMinute`, overlapping windows, a weekday outside the `time.Sunday...time.Saturday` range, and non-positive customer or cost multipliers. Assert the production registry validates.

- [ ] **Step 3: Run the tests and confirm the intended failures**

Run:

```bash
cd backend
go test ./internal/service -run 'Test(RequestPricingCondition|ValidateRequestPricingCondition)' -count=1
```

Expected: FAIL because the new rule types and resolver do not exist.

- [ ] **Step 4: Implement the minimal immutable registry and pure evaluator**

Define one package-private production slice containing the approved DeepSeek rule. Build a validated index once with `sync.Once`; use `time.LoadLocation("Asia/Shanghai")`, local weekday, and minute-of-day comparisons. Return defensive copies from the public projection so callers cannot mutate runtime billing state.

- [ ] **Step 5: Run focused service tests**

Run the command from Step 3. Expected: PASS with every boundary, UTC conversion, neutral model, invalid registry, and sanitized projection assertion passing.

- [ ] **Step 6: Commit the rule registry**

```bash
git add backend/internal/service/request_pricing_condition.go backend/internal/service/request_pricing_condition_test.go
git commit -m "feat: add conditional pricing registry"
```

---

### Task 2: Lock pricing to the final successful upstream attempt

**Files:**

- Modify: `backend/internal/service/openai_gateway_service.go`
- Modify: `backend/internal/service/openai_gateway_chat_completions_raw.go`
- Modify: `backend/internal/service/openai_gateway_chat_completions.go`
- Modify: `backend/internal/service/openai_gateway_messages.go`
- Modify: `backend/internal/service/openai_ws_forwarder.go`
- Modify: `backend/internal/service/gateway_service.go`
- Modify: `backend/internal/service/gateway_forward_as_chat_completions.go`
- Modify: `backend/internal/handler/openai_chat_completions.go`
- Test: `backend/internal/service/openai_gateway_chat_completions_raw_test.go`
- Test: `backend/internal/service/openai_gateway_chat_completions_test.go`
- Test: `backend/internal/service/openai_compat_model_test.go`
- Test: `backend/internal/service/gateway_forward_as_chat_completions_test.go`
- Test: `backend/internal/service/openai_ws_protocol_forward_test.go`
- Test: `backend/internal/handler/openai_gateway_handler_test.go`

**Interfaces:**

- Consumes: `ResolveRequestPricingContext(model string, sentAt time.Time)` from Task 1 and the final `upstreamModel` after private mapping.
- Produces:

```go
type OpenAIForwardResult struct {
	// existing fields remain unchanged
	PricingContext RequestPricingContext
}

type ForwardResult struct {
	// existing fields remain unchanged
	PricingContext RequestPricingContext
}
```

- Add `pricingClock PricingClock` to `OpenAIGatewayService` and `GatewayService`, initialize both to `time.Now` in their constructors, and use one package-private `pricingAttemptNow(clock PricingClock) time.Time` helper for deterministic tests and safe nil fallback.
- Each Packy attempt resolves `RequestPricingContext` after final model mapping and immediately before `httpUpstream.Do`. Set `AccountingModel` to the final private upstream model, but retain the canonical customer model separately.
- A transport error or HTTP failover discards the local context because it never returns a successful `OpenAIForwardResult`. The handler continues to retry normally; only the returned result is settled.

- [ ] **Step 1: Add failing raw-Chat timestamp and mapping tests**

Use a clock sequence and HTTP upstream stub to assert that a `deepseek-v4.1-flash` request sent at `2026-09-14T01:00:00Z` returns:

```go
RequestPricingContext{
	CanonicalModel: "deepseek-v4.1-flash",
	AccountingModel: "deepseek-v4-flash",
	EffectiveAt: time.Date(2026, 9, 14, 1, 0, 0, 0, time.UTC),
	RuleID: "deepseek-weekday-peak-2026-09-13",
	CustomerMultiplier: 2,
	UpstreamCostMultiplier: 2,
}
```

Assert the resolver failure returns before `Do` is called. Assert a non-Packy/unruled request receives a neutral context without changing existing forwarding.

- [ ] **Step 2: Add failing retry/failover tests across a boundary**

Configure the first attempt at `2026-09-14T00:59:59Z` to return a retryable failure and the second at `2026-09-14T01:00:00Z` to succeed. Assert exactly one returned context, at `01:00:00Z` with `2.0`. Add the inverse case where the request begins during peak time but the successful attempt is sent exactly at `04:00:00Z`; assert `1.0`. A streamed response finishing after the boundary must retain its original send context.

- [ ] **Step 3: Run focused forwarding and handler tests to verify failure**

```bash
cd backend
go test -tags unit ./internal/service ./internal/handler -run 'Test.*(PricingContext|SuccessfulAttempt|Retry.*Boundary)' -count=1
```

Expected: FAIL because forwarding results do not carry a pricing context and the service has no injectable clock.

- [ ] **Step 4: Implement attempt locking in every OpenAI result path**

Resolve the context directly before `Do` in raw Chat, Responses, OpenAI-Messages, and Packy Anthropic compatibility paths; pass it through every buffered and streaming result constructor; and copy `ForwardResult.PricingContext` when `forwardPackyAwareChatCompletions` builds `OpenAIForwardResult`. Keep DeepSeek on raw Chat, but record a real send timestamp for all text protocols so neutral `1.0` usage rows remain auditable.

- [ ] **Step 5: Keep failed attempts out of settlement**

Do not store attempt context in Gin context, account state, or handler variables. Return it only inside the successful `OpenAIForwardResult`; existing failover `continue` branches then discard failed values automatically. Reject a successful Packy result with a zero `EffectiveAt` for a ruled model before `RecordUsage` can bill it.

- [ ] **Step 6: Run the focused and existing forwarding tests**

```bash
cd backend
go test -tags unit ./internal/service ./internal/handler -run 'Test.*(ChatCompletions|PricingContext|SuccessfulAttempt|Retry.*Boundary|Packy)' -count=1
```

Expected: PASS, including existing Packy protocol, upstream-error sanitization, streaming, and account-switch tests.

- [ ] **Step 7: Commit attempt-time locking**

```bash
git add backend/internal/service/openai_gateway_service.go backend/internal/service/openai_gateway_chat_completions_raw.go backend/internal/service/openai_gateway_chat_completions.go backend/internal/service/openai_gateway_messages.go backend/internal/service/openai_ws_forwarder.go backend/internal/service/gateway_service.go backend/internal/service/gateway_forward_as_chat_completions.go backend/internal/handler/openai_chat_completions.go backend/internal/service/openai_gateway_chat_completions_raw_test.go backend/internal/service/openai_gateway_chat_completions_test.go backend/internal/service/openai_compat_model_test.go backend/internal/service/openai_ws_protocol_forward_test.go backend/internal/service/gateway_forward_as_chat_completions_test.go backend/internal/handler/openai_gateway_handler_test.go
git commit -m "feat: lock pricing to successful upstream attempt"
```

---

### Task 3: Apply one condition context to customer billing and Packy cost

**Files:**

- Modify: `backend/internal/service/openai_gateway_service.go`
- Modify: `backend/internal/service/billing_service.go`
- Modify: `backend/internal/service/account_stats_pricing.go`
- Modify: `backend/internal/service/usage_billing.go`
- Test: `backend/internal/service/billing_service_unified_test.go`
- Test: `backend/internal/service/account_stats_pricing_test.go`
- Test: `backend/internal/service/user_model_rate_resolver_test.go`
- Test: `backend/internal/service/openai_gateway_record_usage_test.go`

**Interfaces:**

- Consumes: `OpenAIForwardResult.PricingContext` from Task 2 and `UserGroupRateRepository`, which already implements `UserModelRateLookup`.
- Produces:

```go
type CostInput struct {
	// existing fields remain unchanged
	ConditionMultiplier float64
}

func resolveAccountStatsCost(
	ctx context.Context,
	channelService *ChannelService,
	billingService *BillingService,
	accountID int64,
	groupID int64,
	upstreamModel string,
	tokens UsageTokens,
	requestCount int,
	totalCost float64,
	conditionMultiplier float64,
) *float64
```

- Add `userModelRateResolver *userModelRateResolver` to `OpenAIGatewayService` and initialize it with the existing `userGroupRateRepo`.
- `CostBreakdown.TotalCost` becomes base channel cost multiplied by the condition factor but before the negotiated multiplier; `ActualCost` remains `TotalCost * effectiveCustomerMultiplier`. This preserves the existing settlement meaning while preventing the condition factor from being hidden inside `rate_multiplier`.
- The account custom-rule/model-file cost path multiplies its component sum by `PricingContext.UpstreamCostMultiplier`. It must not derive time or aliases again. The `ApplyPricingToAccountStats` fallback uses the already condition-adjusted `TotalCost` and must not multiply twice.
- `UsageBillingCommand.AccountQuotaCost` uses `COALESCE(usageLog.AccountStatsCost, cost.TotalCost) * accountRateMultiplier`, so persisted account cost, account quota consumption, and profit reporting share the same condition-adjusted upstream basis.

- [ ] **Step 1: Add failing component-cost tests**

For a fixed pricing row and token usage, assert `ConditionMultiplier: 2` doubles `InputCost`, `OutputCost`, `CacheReadCost`, `CacheCreationCost`, and `TotalCost`; then assert `RateMultiplier: 0.9` changes only `ActualCost` to `TotalCost * 0.9`. For backward compatibility, `ConditionMultiplier: 0` in generic non-context callers normalizes to neutral `1.0`; negative, NaN, or infinite values return an error. A ruled request with a zero timestamp/factor is rejected by `RecordUsage` before cost calculation, so it cannot use the generic neutral fallback.

- [ ] **Step 2: Add failing multiplier-precedence tests to OpenAI settlement**

Build four cases for the same model/group:

```text
customer-model 0.80 -> effective customer multiplier 0.80
no model override, customer-group 0.85 -> 0.85
no customer overrides, group 1.00 -> 1.00
no group/default configured -> configured default or 1.00
```

Assert only one negotiated multiplier is applied, `usageLog.RateMultiplier` stores it, the condition remains separate, and changing a model override does not affect a second model. Use `deepseek-v4.1-flash` with `2.0` to prove final charge equals base sale cost × `2.0` × the effective negotiated value.

- [ ] **Step 3: Add failing Packy cost and alias tests**

Use the reviewed Flash standard costs (`0.50`, `2.00`, `0.010` CNY/MTok divided by `6.7`) and assert a `2.0` condition doubles all upstream components. Pass `AccountingModel: "deepseek-v4-flash"` and assert the cost rule never looks up `deepseek-v4.1-flash`. Add a rule with `ApplyPricingToAccountStats=true` and assert it does not apply `2.0` twice. Assert `AccountQuotaCost` uses the resulting `AccountStatsCost` times the account rate, not the customer-list `TotalCost`.

- [ ] **Step 4: Add a failing idempotency-fingerprint test**

Extend `UsageBillingCommand` with `PricingEffectiveAt time.Time`, `ConditionMultiplier float64`, and `PricingRuleID string`. Assert `buildUsageBillingFingerprint` changes when any of those fields changes, remains stable for identical contexts, and never includes account/token-group prose.

- [ ] **Step 5: Add a failing missing-usage settlement test**

Return a successful token response with zero input, output, cache-read, and cache-write usage. Assert `RecordUsage` returns a typed reconciliation error, creates no usage row, deducts no customer balance/quota, and applies no account cost. This enforces “response without billable usage” without inventing a charge.

- [ ] **Step 6: Run focused tests to verify the intended failures**

```bash
cd backend
go test -tags unit ./internal/service -run 'Test.*(ConditionMultiplier|UserModelRate|AccountStatsCost|BillingFingerprint|RecordUsage)' -count=1
```

Expected: FAIL because OpenAI settlement ignores the model override, `CostInput` has no condition factor, and account cost/fingerprint do not receive the locked context.

- [ ] **Step 7: Implement separate condition and negotiated multipliers**

Apply `ConditionMultiplier` inside each token/per-request component calculation before summing `TotalCost`. Resolve the group/customer-group multiplier first, then call:

```go
effectiveCustomerMultiplier := s.userModelRateResolver.Resolve(
	ctx,
	user.ID,
	*apiKey.GroupID,
	requestedModel,
	groupOrUserGroupMultiplier,
)
```

Use the canonical requested OwnAPI model for the model override key, not the private Packy alias. Pass both factors and audit values through `CostInput`, `UsageLog`, and `UsageBillingCommand` without multiplying either twice.

- [ ] **Step 8: Implement account cost from the same immutable context**

Pass `result.PricingContext.AccountingModel` and `UpstreamCostMultiplier` to `applyAccountStatsCost`. Multiply custom-rule and model-file component costs once; if the channel fallback returns the already adjusted customer `TotalCost`, keep it unchanged. In `buildUsageBillingCommand`, apply the independent account rate to `usageLog.AccountStatsCost` when present and otherwise to `cost.TotalCost`; this keeps atomic account quota use aligned with the usage-log cost column.

- [ ] **Step 9: Reject unusable successful usage and run all affected service tests**

Before any cost, usage write, or settlement call, require at least one positive billable token component for token billing (or a positive request/image count for those modes). Return a typed operational reconciliation error on a successful response without usable usage, then run:

```bash
cd backend
go test -tags unit ./internal/service -run 'Test.*(Billing|Pricing|Rate|RecordUsage|AccountStats|Usage)' -count=1
```

Expected: PASS with non-Packy, image, subscription, streaming, zero-cost, and legacy billing tests unchanged.

- [ ] **Step 10: Commit unified pricing settlement**

```bash
git add backend/internal/service/openai_gateway_service.go backend/internal/service/billing_service.go backend/internal/service/account_stats_pricing.go backend/internal/service/usage_billing.go backend/internal/service/billing_service_unified_test.go backend/internal/service/account_stats_pricing_test.go backend/internal/service/user_model_rate_resolver_test.go backend/internal/service/openai_gateway_record_usage_test.go
git commit -m "feat: unify conditional customer and account billing"
```

---

### Task 4: Persist and expose immutable pricing audit fields

**Files:**

- Create: `backend/migrations/142_add_usage_pricing_audit.sql`
- Create: `backend/migrations/usage_pricing_audit_migration_test.go`
- Modify: `backend/ent/schema/usage_log.go`
- Regenerate: `backend/ent/usagelog.go`
- Regenerate: `backend/ent/usagelog/usagelog.go`
- Regenerate: `backend/ent/usagelog/where.go`
- Regenerate: `backend/ent/usagelog_create.go`
- Regenerate: `backend/ent/usagelog_query.go`
- Regenerate: `backend/ent/usagelog_update.go`
- Regenerate: `backend/ent/mutation.go`
- Regenerate: `backend/ent/migrate/schema.go`
- Regenerate: `backend/ent/runtime/runtime.go`
- Modify: `backend/internal/service/usage_log.go`
- Modify: `backend/internal/service/usage_service.go`
- Modify: `backend/internal/repository/usage_log_repo.go`
- Modify: `backend/internal/repository/usage_log_repo_request_type_test.go`
- Modify: `backend/internal/repository/usage_log_repo_integration_test.go`
- Modify: `backend/internal/handler/dto/types.go`
- Modify: `backend/internal/handler/dto/mappers.go`
- Test: `backend/internal/handler/dto/mappers_usage_test.go`

**Interfaces:**

- Consumes: the context and negotiated multiplier resolved during Task 3.
- Produces these additive `UsageLog`/DTO/JSON fields while continuing to use the existing `rate_multiplier` as the effective negotiated customer multiplier:

```go
PricingEffectiveAt      *time.Time `json:"pricing_effective_at,omitempty"`
ConditionMultiplier    float64    `json:"condition_multiplier"`
PricingRuleID          *string    `json:"pricing_rule_id,omitempty"`
```

- `rate_multiplier` already persists the effective negotiated customer factor and remains unchanged. UI/reconciliation labels it “customer rate” and keeps it distinct from `condition_multiplier`; no duplicate rate column is added.
- Migration 142 adds `pricing_effective_at TIMESTAMPTZ NULL`, `condition_multiplier NUMERIC(10,4) NOT NULL DEFAULT 1 CHECK (condition_multiplier > 0)`, and `pricing_rule_id VARCHAR(128) NULL`.

- [ ] **Step 1: Write the migration contract test**

Read migration 142 from the embedded FS and assert the exact three column names/types/defaults, positive condition constraint, `IF NOT EXISTS`, no update of historical balances/costs, and no `accounts`, `api_key`, `credentials`, or secret-bearing statement.

- [ ] **Step 2: Add failing repository round-trip tests**

Extend the SQL select/insert-order tests and integration fixture with one `2.0` DeepSeek row. Assert `prepareUsageLogInsert`, batch insert, best-effort insert, `scanUsageLog`, `GetByID`, and list paths preserve the UTC instant, rule ID, condition factor, and existing `rate_multiplier`. Add a historical/default row and assert a neutral `1.0` condition, nil timestamp/rule, and its existing rate without re-rating its cost.

- [ ] **Step 3: Add failing DTO privacy tests**

Assert user DTOs expose the pricing timestamp, `1x/2x`, localized-rule identifier, and effective customer rate but still omit `upstream_model`, account name, and account cost. Assert admin DTOs expose the same fields plus existing admin-only accounting fields.

- [ ] **Step 4: Run focused tests to verify failure**

```bash
cd backend
go test -tags unit ./migrations ./internal/repository ./internal/handler/dto -run 'Test.*(PricingAudit|UsageLog|UsageDTO)' -count=1
```

Expected: FAIL because migration 142 and the new model/repository/DTO fields do not exist.

- [ ] **Step 5: Add migration 142 and Ent schema fields**

Use additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements and named `DO $$ ... IF NOT EXISTS ... ADD CONSTRAINT ... END IF; $$` checks. Do not update historical `total_cost`, `actual_cost`, or balances. Add matching optional/default fields to `backend/ent/schema/usage_log.go`.

- [ ] **Step 6: Regenerate Ent code**

```bash
cd backend
go generate ./ent
```

Inspect the generated diff. Expected: only the UsageLog field, builder, predicate, mutation, runtime, and migration-schema surfaces needed for the three additive columns change.

- [ ] **Step 7: Wire every raw SQL insert and scan position**

Update `usageLogSelectColumns`, `usageLogInsertArgTypes`, every insert/CTE column list and placeholder range, `prepareUsageLogInsert`, and `scanUsageLog` in one edit. Preserve existing request-type and account-cost column order tests so a positional mismatch cannot reach production.

- [ ] **Step 8: Wire service, settlement fingerprint, and DTO mapping**

Populate the three new fields from the locked result before `applyUsageBilling`; include them in `UsageBillingCommand` and its fingerprint; return sanitized user/admin DTOs. Preserve the already resolved negotiated value in `rate_multiplier`. For historical condition values, normalize zero to `1.0` at the service/DTO boundary without changing stored costs or the historical negotiated rate.

- [ ] **Step 9: Run migration, repository, service, and DTO tests**

```bash
cd backend
go test -tags unit ./migrations ./internal/repository ./internal/service ./internal/handler/dto -run 'Test.*(PricingAudit|UsageLog|UsageDTO|BillingFingerprint|RecordUsage)' -count=1
go test -tags integration ./internal/repository -run 'TestUsageLogRepository.*PricingAudit' -count=1
```

Expected: PASS. If the integration database is unavailable, record the exact environment error and require CI integration coverage before deployment.

- [ ] **Step 10: Commit pricing audit persistence**

```bash
git add backend/migrations/142_add_usage_pricing_audit.sql backend/migrations/usage_pricing_audit_migration_test.go backend/ent backend/internal/service/usage_log.go backend/internal/service/usage_service.go backend/internal/repository/usage_log_repo.go backend/internal/repository/usage_log_repo_request_type_test.go backend/internal/repository/usage_log_repo_integration_test.go backend/internal/handler/dto/types.go backend/internal/handler/dto/mappers.go backend/internal/handler/dto/mappers_usage_test.go backend/internal/service/usage_billing.go backend/internal/service/openai_gateway_service.go
git commit -m "feat: persist pricing decision audit fields"
```

---

### Task 5: Correct the reviewed customer-price and account-routing snapshot

**Files:**

- Create: `backend/migrations/143_correct_text_pricing_and_packy_scopes.sql`
- Create: `backend/migrations/text_pricing_packy_scopes_migration_test.go`
- Modify: `backend/internal/repository/packy_text_pricing_migration_integration_test.go`
- Modify: `backend/internal/service/channel.go`
- Modify: `backend/internal/service/channel_service.go`
- Modify: `backend/internal/service/gateway_service.go`
- Modify: `backend/internal/pkg/openai_compat/upstream_capability.go`
- Test: `backend/internal/pkg/openai_compat/upstream_capability_test.go`
- Test: `backend/internal/service/openai_model_mapping_test.go`
- Test: `backend/internal/service/openai_account_scheduler_test.go`
- Test: `backend/internal/handler/gateway_helper_hotpath_test.go`

**Interfaces:**

- Consumes: the approved price/cost/account rules in the specification and the existing `(min,max]` interval semantics.
- Produces: an idempotent migration 143 with no credential values and these exact outcomes:

```text
deepseek-v4.1-flash customer USD/MTok: input 0.105, output 0.42, cache read 0.0021
deepseek-v4-pro: absent from OwnAPI LLM channel pricing and customer /v1/models
DeepSeek standard Packy CNY/MTok used for active account cost: flash 0.50/2.00/0.010
DeepSeek Pro card 2.25/6.75/0.075: retained only in version-controlled review evidence, not inserted into active account-cost tables while Pro is uncallable
gpt-6-astra short interval: (0,272000]
gpt-6-astra long interval: (272000,infinity)
Codex customer mappings: only Packy / Codex
gpt-5.4 customer sale factor: 0.8
gpt-5.4-mini customer USD/MTok at 0.8: input 0.60, output 3.60, cache read 0.06
gpt-5.5 customer USD/MTok at 0.8: input 4.00, output 24.00, cache read 0.40
codex-auto-review customer USD/MTok at 0.8: input 2.00, output 12.00, cache read 0.20
```

- The Codex account-cost snapshot must use the exact Packy `codex` 12-percent card values verified during execution. If any component for any of the four models cannot be read from that exact signed-in group, migration 143 must leave the whole `Packy cost / Codex` rule absent and the four routes unschedulable; execution must not copy the stale Core cost values or infer them from the discount label.

- [ ] **Step 1: Write failing SQL contract and integration assertions**

Assert migration 143 never modifies migration 137/141, never inserts an account, and scopes every account update by exact name plus `extra->>'upstream_provider' = 'packyapi'`. Apply migrations 137, 139, 141, 142, then 143 twice to a transaction with mock Core, Codex, and DeepSeek Sale accounts. Assert:

- Flash has the exact 70-percent customer prices and reviewed normalized costs;
- Pro has no channel price and is absent from the customer model list;
- Pro has no active account-cost pricing row;
- GPT-6 selects short pricing at 271,999 and 272,000, long at 272,001;
- GPT-5.4, GPT-5.4 Mini, GPT-5.5, and Codex Auto Review use exact 80-percent customer rows, while the four mandatory Codex models use 70-percent rows;
- all four Codex keys are removed from Core's `credentials.model_mapping` and Core cost rows;
- when `Packy / Codex` is absent, the migration creates neither account nor cost rule;
- when it exists, its mapping is exactly the four canonical IDs and no unrelated Packy account gains them;
- rerunning the migration produces the same rows and mappings.

- [ ] **Step 2: Write failing scheduler and `/v1/models` tests**

Create schedulable Core and Codex test accounts. Assert each mandatory Codex model selects only Codex, never Core; if Codex is absent/paused, selection returns model unavailable. Assert `deepseek-v4-pro` is filtered from `/v1/models` even if a stale schedulable account mapping remains, while Flash remains listed only when its exact channel price and account route exist.

- [ ] **Step 3: Write the cost-band policy test for every current text seed**

Add a reviewed fixture listing canonical model ID, manufacturer price status, Packy cost band, expected sale factor, and expected availability. Assert boundary values `0.60 -> 0.70`, `0.600001 -> 0.80`, `0.80 -> 0.80`, `0.800001 -> unavailable`, and unverifiable -> unavailable. Explicitly assert Qwen, GLM, approved DeepSeek Flash, the four Codex models, other approved OpenAI 72-percent routes, and every model removed by the snapshot.

- [ ] **Step 4: Run migration/routing tests to verify failure**

```bash
cd backend
go test -tags unit ./migrations ./internal/pkg/openai_compat ./internal/service ./internal/handler -run 'Test.*(Migration143|CostBand|Codex|DeepSeek|AvailableModels|GPT6)' -count=1
go test -tags integration ./internal/repository -run 'TestPackyTextPricingMigrationIsIdempotentAndFailClosed' -count=1
```

Expected: FAIL on the 75-percent Flash price, callable Pro row, 200K GPT-6 boundary, Core Codex mappings/costs, and missing explicit availability guard.

- [ ] **Step 5: Read and record every affected exact Packy cost card before writing SQL values**

Using the signed-in Packy pricing/token-group UI, record the date, exact token group, and exact input/output/cache-read/cache-write CNY per MTok for all four mandatory models under `codex`; for GPT-5.4, GPT-5.4 Mini, GPT-5.5, and Codex Auto Review under their exact 72-percent-cost routes; and for every Qwen/GLM row whose 50-percent classification changes or confirms published availability. Reconfirm the supplied DeepSeek Sale cards. Put the reviewed numeric fixture in tests and the source/date only in non-secret handoff metadata. Do not write migration values, publish a model, or enable a route if any component/group is ambiguous. This is a read-only evidence gate, not a paid API request.

- [ ] **Step 6: Implement idempotent migration 143**

Remove affected model IDs from existing JSONB arrays, delete empty pricing rows and orphan intervals, then insert exact one-model rows. For GPT-6, delete and recreate only its intervals at `0..272000` and `272000..NULL`. For mappings, remove the four Codex keys from every exact `Packy / Core` row; set exactly four mappings on an existing `Packy / Codex`; never copy its `api_key` or `base_url`. Remove and recreate exact-name cost rules only when the matching managed account exists and every reviewed component is present.

- [ ] **Step 7: Add fail-closed customer model-list filtering**

Filter `GatewayService.GetAvailableModels` through the group's channel pricing when `restrict_models=true`, rather than trusting account mappings alone. This makes a stale account mapping insufficient to publish or call Pro. Preserve the independent explicit MiniMax H3 append in the handler and existing fallback behavior for groups without a restrictive channel.

- [ ] **Step 8: Keep exact Packy protocol and private alias behavior**

Retain OpenAI Chat for both recognized DeepSeek IDs but rely on pricing restriction to reject Pro before dispatch. Preserve only `deepseek-v4.1-flash -> deepseek-v4-flash`; unknown DeepSeek variants remain absent from the Packy protocol table. Assert customer errors and model lists never include the alias or account name.

- [ ] **Step 9: Run focused and integration tests**

Run the commands from Step 4. Expected: PASS, including double-execution, exact account scoping, model-list consistency, alias privacy, and all three GPT-6 boundary cases.

- [ ] **Step 10: Commit the corrected snapshot**

```bash
git add backend/migrations/143_correct_text_pricing_and_packy_scopes.sql backend/migrations/text_pricing_packy_scopes_migration_test.go backend/internal/repository/packy_text_pricing_migration_integration_test.go backend/internal/pkg/openai_compat/upstream_capability.go backend/internal/pkg/openai_compat/upstream_capability_test.go backend/internal/service/openai_model_mapping_test.go backend/internal/service/openai_account_scheduler_test.go backend/internal/handler/gateway_helper_hotpath_test.go backend/internal/service/channel_service.go backend/internal/service/gateway_service.go
git commit -m "fix: correct text pricing and Packy account scopes"
```

---

### Task 6: Publish the sanitized pricing rule and correct the public catalog

**Files:**

- Modify: `backend/internal/service/model_display_config.go`
- Modify: `backend/internal/handler/setting_handler.go`
- Test: `backend/internal/service/model_display_config_test.go`
- Test: `backend/internal/handler/setting_handler_public_test.go`
- Modify: `frontend/src/api/modelDisplay.ts`
- Create: `frontend/src/data/requestPricingConditions.ts`
- Modify: `frontend/src/data/verifiedModelSeeds.ts`
- Modify: `frontend/src/data/modelCatalog.ts`
- Modify: `frontend/src/views/public/ModelDetailView.vue`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`
- Test: `frontend/src/data/__tests__/modelCatalog.spec.ts`
- Test: `frontend/src/views/public/__tests__/ModelDetailView.spec.ts`
- Test: `frontend/src/i18n/__tests__/usageServiceTierLocales.spec.ts`

**Interfaces:**

- Consumes: `PublicRequestPricingConditionRules()` from Task 1 and public `GET /api/v1/settings/model-display`.
- Produces:

```go
type ModelDisplayConfig struct {
	// existing fields remain unchanged
	RequestPricingConditions []PublicRequestPricingConditionRule `json:"request_pricing_conditions"`
}
```

```ts
export interface PublicRequestPricingConditionRule {
  id: string
  models: string[]
  timezone: string
  weekdays: number[]
  windows: Array<{ start_minute: number; end_minute: number }>
  customer_multiplier: number
  name_en: string
  name_zh: string
}

export function requestPricingConditionForModel(
  rules: PublicRequestPricingConditionRule[],
  modelId: string,
): PublicRequestPricingConditionRule | null
```

- The backend overwrites `RequestPricingConditions` from its validated registry on public/admin reads and ignores any attempted admin write for that field. Runtime billing conditions cannot be edited through model-display settings.

- [ ] **Step 1: Add failing public-settings privacy tests**

Assert `GET /api/v1/settings/model-display` returns the two half-open Beijing windows, UTC-equivalent copy inputs, canonical Flash model ID, `2.0`, and bilingual public names. Assert JSON contains none of `upstream_cost_multiplier`, `source`, `packy`, `account`, `deepseek-v4-flash`, `base_url`, or credentials. Assert an admin PUT cannot alter the backend-owned condition list.

- [ ] **Step 2: Add failing catalog tests**

Assert Flash official prices remain `$0.15/$0.60/$0.003`, customer prices become `$0.105/$0.42/$0.0021`, and its multiplier label is `7 折`/`30% off`. Assert Pro is absent from `verifiedCatalogSeeds` and from a catalog built with a stale live display row. Assert GPT-6's tier begins only above `272_000` and all other reviewed models match the 70/80/removal fixture from Task 5.

- [ ] **Step 3: Add failing model-detail localization tests**

Render Flash in English and Chinese with the API-provided rule. Assert the page says base price applies outside peak hours, Monday-Friday, Beijing `09:00-12:00` and `14:00-18:00`, UTC `01:00-04:00` and `06:00-10:00`, opening included/closing excluded, and usage history reports `1x/2x`. Render GPT-6 and assert the tier label says `>272K`; render another model and assert no DeepSeek condition panel.

- [ ] **Step 4: Run focused backend/frontend tests to verify failure**

```bash
cd backend
go test -tags unit ./internal/service ./internal/handler -run 'Test.*ModelDisplay.*(Condition|Public|Privacy)' -count=1
cd ../frontend
node_modules/.bin/vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelDetailView.spec.ts src/i18n/__tests__/usageServiceTierLocales.spec.ts
```

Expected: FAIL because the public condition projection is absent, Flash is still 75 percent, Pro is still published, and GPT-6 still shows 200K.

- [ ] **Step 5: Add the backend-owned sanitized display projection**

Populate condition rules after stored model-display JSON normalization. Strip the field before persistence on update, then reattach a fresh server-owned copy to the response. If the registry is invalid, return an error instead of serving potentially stale condition prose.

- [ ] **Step 6: Implement catalog eligibility and corrected prices**

Update seed review-date types to include `2026-09-13`; set Flash to explicit `0.7`; remove Pro from verified seed data and block it in `restrictedThirdPartyModelIds` so stale server display config cannot re-add it. Change GPT-6 to `minInputTokens: 272_000` and its Packy discount metadata from the stale 93-percent-off value to the reviewed 88-percent-off/12-percent-cost value. Mark Luna, Sol, and Terra the same way. Set GPT-5.4, GPT-5.4 Mini, GPT-5.5, and Codex Auto Review to the reviewed 28-percent-off/72-percent-cost metadata and explicit `0.8` sale price. Change the generic availability floor from 28 percent off to 20 percent off (80 percent cost), retain 40 percent off as the 70-percent-sale boundary, and require a verified exact price/source so a 20-percent placeholder cannot publish by number alone.

- [ ] **Step 7: Render the shared condition data on the model page**

Store the returned rules alongside the catalog in `loadCatalog`; look up by canonical `modelId`; render the localized name and formatted minute windows in a restrained bordered section near pricing. Derive both Beijing and UTC strings from the structured minutes and fixed zone offset in `requestPricingConditions.ts`; do not duplicate window literals in locale files.

- [ ] **Step 8: Run focused frontend checks**

```bash
cd frontend
node_modules/.bin/vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelDetailView.spec.ts src/i18n/__tests__/usageServiceTierLocales.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/api/modelDisplay.ts src/data/requestPricingConditions.ts src/data/verifiedModelSeeds.ts src/data/modelCatalog.ts src/views/public/ModelDetailView.vue src/i18n/locales/en.ts src/i18n/locales/zh.ts
```

Expected: PASS with bilingual copy derived from one backend rule and no private Packy data in the public payload or page.

- [ ] **Step 9: Commit public pricing conditions**

```bash
git add backend/internal/service/model_display_config.go backend/internal/handler/setting_handler.go backend/internal/service/model_display_config_test.go backend/internal/handler/setting_handler_public_test.go frontend/src/api/modelDisplay.ts frontend/src/data/requestPricingConditions.ts frontend/src/data/verifiedModelSeeds.ts frontend/src/data/modelCatalog.ts frontend/src/views/public/ModelDetailView.vue frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts frontend/src/data/__tests__/modelCatalog.spec.ts frontend/src/views/public/__tests__/ModelDetailView.spec.ts frontend/src/i18n/__tests__/usageServiceTierLocales.spec.ts
git commit -m "feat: publish conditional pricing disclosures"
```

---

### Task 7: Show and export pricing evidence in usage history

**Files:**

- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/utils/usagePricing.ts`
- Modify: `frontend/src/views/user/UsageView.vue`
- Modify: `frontend/src/views/admin/UsageView.vue`
- Modify: `frontend/src/components/admin/usage/UsageTable.vue`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`
- Test: `frontend/src/views/user/__tests__/UsageView.spec.ts`
- Test: `frontend/src/views/admin/__tests__/UsageView.spec.ts`
- Test: `frontend/src/components/admin/usage/__tests__/UsageTable.spec.ts`
- Create: `frontend/src/utils/__tests__/usagePricingCondition.spec.ts`

**Interfaces:**

- Consumes: Task 4's user/admin usage JSON fields and existing `rate_multiplier` customer-rate field.
- Produces:

```ts
export function normalizeConditionMultiplier(value: unknown): number
export function formatPricingConditionMultiplier(value: unknown): '1x' | '2x' | string
export function pricingRuleLabel(ruleId: string | null | undefined, locale: string): string
```

- Customer UI may display the sanitized stable rule ID through a localized known-rule label, but it must not display account, Packy, upstream host, or private accounting model. Admin UI retains its existing protected accounting fields and adds the raw rule ID/timestamp for reconciliation.

- [ ] **Step 1: Write failing formatter and user-view tests**

Assert missing/historical values normalize to `1x`, `1` renders `1x`, `2` renders `2x`, and unknown positive future factors render without throwing. Render user rows for historical, standard, and peak usage; assert the cost tooltip separates “customer rate” from “time condition”, shows the localized peak label only for the rule match, and never renders `Packy`, `deepseek-v4-flash`, account name, or upstream cost.

- [ ] **Step 2: Write failing admin-table and export tests**

Assert the admin table/detail exposes condition factor, rule ID, UTC pricing-effective timestamp, existing `rate_multiplier` as the negotiated customer rate, and existing account cost. Trigger `exportToExcel` and assert its column headings and row values include `pricing_effective_at`, `condition_multiplier`, and `pricing_rule_id` while retaining and clearly labeling the existing `rate_multiplier` column.

- [ ] **Step 3: Run focused tests to verify failure**

```bash
cd frontend
node_modules/.bin/vitest run src/utils/__tests__/usagePricingCondition.spec.ts src/views/user/__tests__/UsageView.spec.ts src/views/admin/__tests__/UsageView.spec.ts src/components/admin/usage/__tests__/UsageTable.spec.ts
```

Expected: FAIL because types, formatters, columns, tooltips, and export cells do not exist.

- [ ] **Step 4: Extend frontend types and shared formatters**

Add the three new audit fields to `UsageLog`; reuse them in `AdminUsageLog` and retain existing `rate_multiplier` as customer rate. Implement finite-positive normalization and a known-rule localization map keyed only by the provider-neutral `deepseek-weekday-peak-2026-09-13`. Unknown rule IDs render a neutral generic condition label to customers and the raw ID to admins.

- [ ] **Step 5: Update customer usage history**

Add a compact `1x/2x` condition badge in the cost cell and separate tooltip rows for base `total_cost`, time condition, customer negotiated multiplier, and billed `actual_cost`. Keep nullable video durations and costs safe. Do not add any upstream/account detail to the customer page.

- [ ] **Step 6: Update admin table and XLSX export**

Add hideable audit columns to `UsageTable.vue`, include the same values in its tooltip, and append exact audit columns to the `XLSX.utils.aoa_to_sheet` header/rows in `UsageView.vue`. Format `pricing_effective_at` as ISO UTC in export so spreadsheet locale cannot shift reconciliation windows.

- [ ] **Step 7: Run focused frontend tests and static checks**

```bash
cd frontend
node_modules/.bin/vitest run src/utils/__tests__/usagePricingCondition.spec.ts src/views/user/__tests__/UsageView.spec.ts src/views/admin/__tests__/UsageView.spec.ts src/components/admin/usage/__tests__/UsageTable.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/types/index.ts src/utils/usagePricing.ts src/views/user/UsageView.vue src/views/admin/UsageView.vue src/components/admin/usage/UsageTable.vue src/i18n/locales/en.ts src/i18n/locales/zh.ts
```

Expected: PASS, including historical `1x`, peak `2x`, export, privacy, and nullable-field regressions.

- [ ] **Step 8: Commit usage-history evidence**

```bash
git add frontend/src/types/index.ts frontend/src/utils/usagePricing.ts frontend/src/views/user/UsageView.vue frontend/src/views/admin/UsageView.vue frontend/src/components/admin/usage/UsageTable.vue frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts frontend/src/views/user/__tests__/UsageView.spec.ts frontend/src/views/admin/__tests__/UsageView.spec.ts frontend/src/components/admin/usage/__tests__/UsageTable.spec.ts frontend/src/utils/__tests__/usagePricingCondition.spec.ts
git commit -m "feat: show pricing conditions in usage history"
```

---

### Task 8: Complete regression, security, rollout, and handoff verification

**Files:**

- Modify: `AGENTS.md`
- Modify: `design-qa.md`
- Review only: `.github/workflows/deploy.yml`
- Review only: `deploy/docker-compose.yml`

**Interfaces:**

- Consumes: all prior task commits.
- Produces: a verified deployable commit, a read-only production preflight snapshot, a recorded rollback target, and a deployment/paying-test gate that requires explicit user approval.

- [ ] **Step 1: Run the complete backend verification matrix**

```bash
cd backend
go test ./internal/service ./internal/handler ./internal/server ./internal/pkg/openai_compat ./migrations -count=1
go test -tags unit ./internal/service ./internal/handler ./internal/repository ./internal/server ./internal/pkg/openai_compat ./migrations -count=1
go test -tags integration ./internal/repository -run 'Test(PackyTextPricingMigrationIsIdempotentAndFailClosed|UsageLogRepository.*PricingAudit)' -count=1
go vet ./internal/service ./internal/handler ./internal/repository ./internal/server ./internal/pkg/openai_compat ./migrations
```

Expected: PASS. Any known environment-only failure must be reproduced on `origin/main` before it can be documented as unrelated; no pricing, migration, routing, usage, or privacy failure may be waived.

- [ ] **Step 2: Run the complete frontend verification matrix**

```bash
cd frontend
node_modules/.bin/vitest run
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts
node_modules/.bin/vue-tsc -b
node_modules/.bin/vite build
cd ..
git diff --check
```

Expected: all tests, type checks, lint, build, and whitespace checks pass. Existing warning-only output may be recorded but not treated as a substitute for a passing exit status.

- [ ] **Step 3: Run static privacy and credential scans**

```bash
git diff --cached --check
git grep -nE 'sk-[A-Za-z0-9_-]{16,}' -- ':!backend/internal/**/*_test.go' ':!docs/**'
git grep -nE "api[_-]?key[[:space:]]*[:=][[:space:]]*['\"][^'\"]+" -- ':!backend/internal/**/*_test.go' ':!docs/**'
git grep -niE 'cf\.api\.fan|packy /|deepseek-v4-flash' -- frontend/src backend/internal/handler/dto
```

Expected: no committed credential pattern; no Packy hostname/account/private alias in customer-facing frontend or user DTO. Approved admin/backend-only mapping and migration references must be reviewed manually.

- [ ] **Step 4: Browser-QA the public and authenticated flows locally**

At `http://127.0.0.1:3000`, verify English and Chinese `/models`, `/models/deepseek-v4-1-flash`, `/models/gpt-6-astra`, and authenticated `/usage`; verify admin usage and export with existing non-paid fixture rows representing both `1x` and `2x` (insert only into an isolated local/test database, never production). Confirm Pro is absent from search, stale live config cannot re-add it, GPT-6 shows `>272K`, condition copy is responsive at 1440×900 and 390×844, route switching does not blank, and no private upstream string appears in page source/network JSON.

- [ ] **Step 5: Capture the production preflight snapshot without mutation**

Using the existing SSH target and `/opt/ownapi/deploy`, record only counts/IDs/non-secret metadata for:

```text
current image and health
latest applied migration/checksum
OwnAPI LLM group binding and restrict_models state
DeepSeek/GPT-6 channel price rows and intervals
Packy / Core, Packy / Codex, Packy / DeepSeek Sale status and exact mapping keys
Packy cost-rule names, account IDs, model IDs, and numeric component rates
usage_logs schema columns/defaults/constraints
```

Do not print `credentials`, API keys, full `.env`, or task tokens. Save the database export/backup using the existing deployment backup mechanism and record its server path plus the currently running image as rollback inputs.

- [ ] **Step 6: Verify the fail-closed gates before deployment**

Require all of the following: migration 143 has exact Codex card values; a valid existing `Packy / Codex` token/account is independently configured; Core no longer owns the four mappings after migration; DeepSeek Pro remains unpriced/unlisted; no paid request is authorized. If the Codex account or evidence is missing, deploy may proceed only with the four models unschedulable—never by restoring Core fallback.

- [ ] **Step 7: Update the durable records and create the final source commit**

Record exact tests, catalog count, migration numbers, account-scope results, current image, rollback image, and remaining paid-test approval in `AGENTS.md`. Record responsive/local browser evidence in `design-qa.md`. Then run:

```bash
git add AGENTS.md design-qa.md
git commit -m "docs: record conditional pricing verification"
git status --short
```

Expected: only the four protected pre-existing untracked paths remain; no implementation file is dirty.

- [ ] **Step 8: Push and wait for CI before any deployment**

Push the reviewed branch, inspect GitHub Actions, and require frontend, Go lint, unit, integration, and build jobs to pass. Do not merge/push `main` or dispatch deployment until the user confirms the reviewed diff and CI result.

- [ ] **Step 9: Deploy through the existing traceable workflow after approval**

Fast-forward/cherry-pick the approved commits to `main` without rewriting history, dispatch `.github/workflows/deploy.yml`, and wait for the commit-tagged image to become healthy. Confirm migrations 142 and 143 applied exactly once by checksum, the previous image remains available, and no unrelated container/database was replaced.

- [ ] **Step 10: Perform read-only production QA before paid traffic**

Verify `/health`, `/home`, `/models`, `/models/deepseek-v4-1-flash`, `/models/gpt-6-astra`, `/docs`, authenticated `/v1/models`, customer `/usage`, and admin usage/export. Confirm Pro is absent, the four Codex IDs appear only when the exact Codex account is schedulable, condition fields default safely on historical rows, and public/customer payloads contain no upstream identity.

- [ ] **Step 11: Stop for a separate paid-smoke approval**

Report deployed image, migration checksums, route/account scopes, UI evidence, and synthetic arithmetic. Ask for explicit authorization before issuing the cheapest DeepSeek standard/peak or Codex paid request. When authorized, use minimum tokens and reconcile: successful-attempt timestamp, condition factor, customer base cost, negotiated multiplier, final deduction, Packy balance deduction, `/6.7` normalized account cost, and profit. Do not repeat a successful paid test.

- [ ] **Step 12: Execute rollback only if a deployment invariant fails**

First disable affected model availability, restore the preflight price/mapping snapshot, and redeploy the retained prior image. Additive usage-audit columns may remain because old binaries ignore them. Never recalculate historical usage/balances, restore Pro, or return Codex mappings to Core unless the Core token is independently verified for that exact group.

---

## Plan Self-Review

- [ ] **Spec coverage:** Confirm every specification section maps to Tasks 1-8: price bands, exact account scopes, DeepSeek aliases/costs, shared successful-attempt context, multiplier precedence, GPT-6 threshold, audit persistence, bilingual display, fail-closed behavior, migration, rollout, and rollback.
- [ ] **Placeholder scan:** Run `rg -n 'TB[D]|TO[D]|implement la[t]er|fill i[n]|similar to tas[k]|appropriate error handlin[g]' docs/superpowers/plans/2026-09-13-ownapi-text-pricing-conditional-multiplier-plan.md`; expected: no matches.
- [ ] **Type/signature consistency:** Confirm `RequestPricingContext`, `ConditionMultiplier`, three new usage audit fields, existing `rate_multiplier`, model-display projection, account-cost signature, and frontend JSON names are spelled identically in every task.
- [ ] **Safety check:** Confirm migrations never contain credentials or account creation, migration 141 remains byte-for-byte unchanged, protected untracked files are untouched, and paid tests remain behind a separate approval.
