# OwnAPI Model Pricing And Status Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the 16 verified PackyAPI 93%-or-better models with traceable official list prices and OwnAPI 70% prices, while removing the misleading public Status links and preserving the authenticated `/monitor` dashboard.

**Architecture:** Extend the existing catalog domain with typed official-pricing metadata and a single pure price calculator. Keep backend-provided availability separate from marketing price data, render the same catalog in list/detail views, and remove only public Status navigation without changing the authenticated monitor route or administrator monitoring.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Vue I18n, Vitest, Vue Test Utils, existing CSS and static brand/model assets.

**Spec:** `docs/superpowers/specs/2026-08-31-ownapi-model-pricing-status-design.md`

## Global Constraints

- Scope is exactly the 16 PackyAPI models marked 93%, 96%, or 99% off on 2026-08-31.
- OwnAPI price equals official standard API list price multiplied by exactly `0.7`.
- Prices are USD per 1M tokens; no PackyAPI sale price may be used as a fallback.
- Missing official prices render “暂未公布”/“Not published”; they never render `$0`.
- `codex-auto-review` is a GPT-5.4-backed service alias, not an independent base model.
- xAI prices expose both short-context and `>=200K` long-context tiers.
- Actual availability remains controlled by the existing backend model/channel configuration.
- Public Status links are removed; authenticated `/monitor` and all administrator monitoring remain unchanged.
- Preserve the existing OwnAPI black/white visual system and use real OpenAI, Anthropic, and xAI brand assets.

---

### Task 1: Official Pricing Domain And Price Calculation

**Files:**
- Modify: `frontend/src/data/modelCatalog.ts`
- Modify: `frontend/src/data/__tests__/modelCatalog.spec.ts`

**Interfaces:**
- Produces: `OfficialTokenPricing`, `ModelPricingSource`, `calculateOwnApiPricing(pricing, multiplier?)`, `formatCatalogPrice(value)`.
- Consumes: existing `ModelCatalogEntry`, `buildModelCatalog`, and backend `ModelDisplayConfig`.

- [ ] **Step 1: Write failing price-domain tests**

Add tests asserting exact multiplication and formatting:

```ts
expect(calculateOwnApiPricing({ input: 2.5, cachedInput: 0.25, output: 15 })).toEqual({
  input: 1.75,
  cachedInput: 0.175,
  output: 10.5,
})
expect(formatCatalogPrice(0.0525)).toBe('0.0525')
expect(formatCatalogPrice(null)).toBeNull()
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts`

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Add typed pricing metadata and pure functions**

Add these domain shapes and functions:

```ts
export interface OfficialTokenPricing {
  input: number | null
  cachedInput: number | null
  output: number | null
}

export interface LongContextPricing extends OfficialTokenPricing {
  thresholdTokens: number
}

export interface ModelPricingSource {
  official: OfficialTokenPricing
  longContext?: LongContextPricing
  multiplier: 0.7
  sourceUrl: string
  checkedAt: '2026-08-31'
}

export function calculateOwnApiPricing(
  pricing: OfficialTokenPricing,
  multiplier = 0.7,
): OfficialTokenPricing {
  const multiply = (value: number | null) => value == null ? null : value * multiplier
  return { input: multiply(pricing.input), cachedInput: multiply(pricing.cachedInput), output: multiply(pricing.output) }
}

export function formatCatalogPrice(value: number | null): string | null {
  return value == null ? null : value.toLocaleString('en-US', { maximumFractionDigits: 4, useGrouping: false })
}
```

Extend `ModelCatalogEntry` with `pricingSource`, `modelClass`, `endpoints`, `isAlias`, `aliasNoteKey`, and an explicit backend-derived `available` field without replacing the existing `price` field until the views migrate.

- [ ] **Step 4: Run focused tests**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit the domain layer**

```bash
git add frontend/src/data/modelCatalog.ts frontend/src/data/__tests__/modelCatalog.spec.ts
git commit -m "feat: add traceable official model pricing"
```

### Task 2: Build The Verified 16-Model Catalog

**Files:**
- Modify: `frontend/src/data/modelCatalog.ts`
- Modify: `frontend/src/data/__tests__/modelCatalog.spec.ts`
- Verify: `frontend/public/brand/openai.svg`
- Verify: `frontend/public/brand/claude.svg`
- Verify: `frontend/public/brand/grok.svg`
- Verify: `frontend/public/model-art/gpt.jpg`
- Verify: `frontend/public/model-art/claude.jpg`
- Verify: `frontend/public/model-art/grok.jpg`

**Interfaces:**
- Consumes: pricing types from Task 1.
- Produces: `verifiedCatalogSeeds` with exactly 16 unique model IDs and stable slugs.

- [ ] **Step 1: Add a failing catalog-completeness test**

```ts
const requiredIds = [
  'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'codex-auto-review',
  'claude-haiku-4-5-20251001', 'claude-opus-4-6', 'claude-opus-4-7', 'claude-opus-4-8', 'claude-opus-5',
  'claude-sonnet-4-6', 'claude-sonnet-5', 'grok-4.5', 'grok-4.6',
]
const catalog = buildModelCatalog(emptyConfig)
expect(requiredIds.every((id) => catalog.some((model) => model.modelId === id))).toBe(true)
expect(new Set(requiredIds).size).toBe(16)
```

Also assert every required entry has `sourceUrl`, `checkedAt`, original vendor logo, `multiplier === 0.7`, and nonzero derived prices.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts`

Expected: FAIL because only the old eight curated seeds exist.

- [ ] **Step 3: Replace curated seeds with the verified entries**

Encode the exact official numbers from the spec. Example seed:

```ts
verifiedSeed({
  modelId: 'gpt-5.6-sol',
  displayName: 'GPT-5.6 Sol',
  family: 'gpt',
  modelClass: ['flagship', 'coding', 'reasoning'],
  endpoints: ['openai'],
  official: { input: 4, cachedInput: 0.4, output: 20 },
  sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
  checkedAt: '2026-08-31',
})
```

Set Grok long-context tiers to threshold `200_000`; set `codex-auto-review.isAlias = true` with the GPT-5.4 prices and alias explanation key. Keep configured backend prices and availability mergeable, but never overwrite `pricingSource.official` with PackyAPI or unknown data.

- [ ] **Step 4: Verify required assets exist**

Run: `test -f frontend/public/brand/openai.svg && test -f frontend/public/brand/claude.svg && test -f frontend/public/brand/grok.svg && test -f frontend/public/model-art/gpt.jpg && test -f frontend/public/model-art/claude.jpg && test -f frontend/public/model-art/grok.jpg`

Expected: exit code 0. If xAI’s existing file is named differently, update the data entry to the real existing path; do not create a hand-drawn substitute.

- [ ] **Step 5: Run tests and commit**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts`

```bash
git add frontend/src/data/modelCatalog.ts frontend/src/data/__tests__/modelCatalog.spec.ts
git commit -m "feat: add verified discounted model catalog"
```

### Task 3: Catalog Filters, Sorting, And Price Cards

**Files:**
- Modify: `frontend/src/data/modelCatalog.ts`
- Modify: `frontend/src/data/__tests__/modelCatalog.spec.ts`
- Modify: `frontend/src/views/public/ModelsCatalogView.vue`
- Create: `frontend/src/views/public/__tests__/ModelsCatalogView.spec.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`

**Interfaces:**
- Consumes: `ModelCatalogEntry.pricingSource`, `calculateOwnApiPricing`, `formatCatalogPrice`.
- Produces: provider/class/endpoint filtering and input/output sorting; accessible three-price model cards.

- [ ] **Step 1: Write failing filter and component tests**

Add domain assertions for `modelClass`, `endpoint`, `input-price`, and `output-price`. Mount the catalog with a mocked resolved config and assert that a GPT-5.6 Sol card renders:

```ts
expect(wrapper.text()).toContain('Official list price')
expect(wrapper.text()).toContain('Official price × 70%')
expect(wrapper.text()).toContain('$2.8')
expect(wrapper.text()).toContain('$14')
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts`

- [ ] **Step 3: Extend filters and sort types**

Use exact discriminated values:

```ts
export type ModelCatalogSort = 'featured' | 'name' | 'input-price' | 'output-price'
export interface CatalogFilters {
  query: string
  provider: string
  modelClass: string
  endpoint: string
  sort: ModelCatalogSort
}
```

Update `filterModelCatalog` so each filter is optional and price sorts use derived OwnAPI prices with nulls last.

- [ ] **Step 4: Render traceable pricing cards**

Replace the single `priceLabel()` footer with a price block containing Input, Cached input, and Output. Show official values with muted strike-through styling and derived OwnAPI values as primary. Add a visible `官方价 7 折` / `Official price × 70%` badge and `aria-label`s that include units.

For Grok, add a short/long context selector scoped to the card. Do not let clicking the selector navigate the router link; use a button with `@click.prevent.stop`.

- [ ] **Step 5: Add bilingual copy**

Add exact keys under `publicModels`: `officialListPrice`, `ownApiPrice`, `officialSeventyPercent`, `cachedInput`, `modelClass`, `endpoint`, `allClasses`, `allEndpoints`, `sortInputPrice`, `sortOutputPrice`, `shortContext`, `longContext`, `longContextThreshold`, `pricingCheckedAt`, `notPublished`, and alias copy.

- [ ] **Step 6: Run tests, typecheck, and commit**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts src/views/public/__tests__/ModelsCatalogView.spec.ts && pnpm typecheck`

```bash
git add frontend/src/data/modelCatalog.ts frontend/src/data/__tests__/modelCatalog.spec.ts frontend/src/views/public/ModelsCatalogView.vue frontend/src/views/public/__tests__/ModelsCatalogView.spec.ts frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts
git commit -m "feat: expand public model pricing filters"
```

### Task 4: Model Detail Pricing And Source Disclosure

**Files:**
- Modify: `frontend/src/views/public/ModelDetailView.vue`
- Create: `frontend/src/views/public/__tests__/ModelDetailView.spec.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`

**Interfaces:**
- Consumes: catalog pricing metadata from Tasks 1–2.
- Produces: complete official/OwnAPI price table, source link, checked date, alias and long-context notes.

- [ ] **Step 1: Write failing detail tests**

Mount `grok-4-6` and assert both price tiers and the 200K threshold. Mount `codex-auto-review` and assert the alias note and GPT-5.4 source. Assert the source anchor uses `target="_blank"` and `rel="noopener noreferrer"`.

- [ ] **Step 2: Run the component test and verify failure**

Run: `cd frontend && pnpm vitest run src/views/public/__tests__/ModelDetailView.spec.ts`

- [ ] **Step 3: Implement the detailed table**

Render rows for official and OwnAPI Input/Cached input/Output. Render the optional long-context table only when present. Add checked date and a localized “View official pricing” link. Preserve existing backend availability semantics and never label a model available solely because it is in the static catalog.

- [ ] **Step 4: Run tests, typecheck, and commit**

Run: `cd frontend && pnpm vitest run src/views/public/__tests__/ModelDetailView.spec.ts && pnpm typecheck`

```bash
git add frontend/src/views/public/ModelDetailView.vue frontend/src/views/public/__tests__/ModelDetailView.spec.ts frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts
git commit -m "feat: disclose model price sources"
```

### Task 5: Remove Public Status Navigation Without Touching Monitor

**Files:**
- Modify: `frontend/src/components/public/PublicSiteHeader.vue`
- Modify: `frontend/src/components/public/PublicSiteFooter.vue`
- Modify: `frontend/src/views/HomeView.vue`
- Modify: `frontend/src/views/public/DocsView.vue`
- Create: `frontend/src/components/public/__tests__/PublicNavigation.spec.ts`
- Modify: `frontend/src/router/__tests__/guards.spec.ts`

**Interfaces:**
- Consumes: existing public links and authenticated `/monitor` route.
- Produces: public navigation with no Status links while preserving monitor authentication behavior.

- [ ] **Step 1: Write failing navigation and route tests**

Assert Header, Footer, Home, and Docs contain no anchors whose `href` is `/monitor`. Add or preserve a router guard test showing an unauthenticated `/monitor` navigation resolves to `/login` and an authenticated ordinary user can reach `/monitor`.

- [ ] **Step 2: Run tests and verify the public-link assertions fail**

Run: `cd frontend && pnpm vitest run src/components/public/__tests__/PublicNavigation.spec.ts src/router/__tests__/guards.spec.ts`

- [ ] **Step 3: Remove only public Status entries**

Delete the `/monitor` links from desktop/mobile Header, Footer Product column, Home trust/capability links, and Docs resource card. Rebalance affected grids without inserting a fake replacement link. Do not delete the route, user sidebar item, `ChannelStatusView.vue`, channel monitor API, or translations used by authenticated pages.

- [ ] **Step 4: Run tests and commit**

Run: `cd frontend && pnpm vitest run src/components/public/__tests__/PublicNavigation.spec.ts src/router/__tests__/guards.spec.ts`

```bash
git add frontend/src/components/public/PublicSiteHeader.vue frontend/src/components/public/PublicSiteFooter.vue frontend/src/views/HomeView.vue frontend/src/views/public/DocsView.vue frontend/src/components/public/__tests__/PublicNavigation.spec.ts frontend/src/router/__tests__/guards.spec.ts
git commit -m "fix: separate public navigation from user monitor"
```

### Task 6: Full Verification And Handoff Record

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: all earlier tasks.
- Produces: verified build and durable recovery notes for future agents/models.

- [ ] **Step 1: Run all frontend checks**

Run: `cd frontend && pnpm lint:check && pnpm typecheck && pnpm test:run && pnpm build`

Expected: all commands exit 0.

- [ ] **Step 2: Run pricing integrity checks**

Run the catalog test alone and inspect its 16-ID assertion. Manually compare every official price, 70% price, source URL, and checked date against the approved spec.

- [ ] **Step 3: Browser QA**

Verify `/models`, one OpenAI detail, one Claude detail, one Grok detail, `/docs`, `/home`, and unauthenticated `/monitor` at desktop and mobile widths. Confirm filter controls, Grok tier switch, external pricing source links, no public Status link, no broken image, no horizontal overflow, and no `$0` fallback.

- [ ] **Step 4: Update durable handoff documentation**

Append to `AGENTS.md`: completed behavior, exact files changed, official source URLs and checked date, tests/build commands and results, remaining deployment blocker, and the latest safe commit. Do not paste full source files; record architecture and recovery instructions so another model can continue safely.

- [ ] **Step 5: Commit the verification checkpoint**

```bash
git add AGENTS.md
git commit -m "docs: record model pricing implementation"
```
