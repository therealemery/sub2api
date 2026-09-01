# OwnAPI 50%-Or-Better Model Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand OwnAPI's verified public catalog to the exact 46 PackyAPI models marked 50% off or better, with original-vendor pricing × 70%, provider-grouped rendering, and high-quality local search.

**Architecture:** Move the large verified seed matrix into a data-only module, extend the catalog domain with eligibility and explicit paid/free/unpublished pricing states plus generic context tiers, then group the filtered result by a stable provider order. Keep Packy eligibility separate from original-vendor pricing and backend availability; the list and detail views consume the same normalized entries.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Vue I18n, Vitest, Vue Test Utils, existing CSS and static brand/model assets.

**Spec:** `docs/superpowers/specs/2026-08-31-ownapi-50-percent-model-expansion-design.md`

## Global Constraints

- Scope is exactly the 46 PackyAPI models marked 50% off or better on 2026-08-31.
- PackyAPI determines eligibility only; never use or reverse-calculate its channel prices.
- OwnAPI paid pricing is original-vendor standard list price multiplied by exactly `0.7`.
- Explicitly free vendor services render “Free” / “免费”; missing authoritative prices render “Not published” / “暂未公布”.
- Static catalog availability remains `null`; only a real backend signal may set it.
- Provider grouping is always the primary order; name/price/relevance sorts apply inside each provider.
- Real existing vendor assets must be used; do not draw replacement SVGs or use emoji placeholders.
- Search is local, separator-insensitive, multi-token AND matching and composes with every filter.
- Public/user motion may be consumed, but no administrator UI or monitoring motion may be added.

---

### Task 1: Eligibility And Pricing-State Domain

**Files:**
- Create: `frontend/src/data/verifiedModelSeeds.ts`
- Modify: `frontend/src/data/modelCatalog.ts`
- Modify: `frontend/src/data/__tests__/modelCatalog.spec.ts`

**Interfaces:**
- Produces: `CatalogEligibilitySource`, `ModelPricingStatus`, `OfficialPricingTier`, `RawVerifiedModelSeed`, `activeOfficialTier(pricing, tierId?)`, and a data-only `verifiedModelSeedData` array.
- Consumes: existing `OfficialTokenPricing`, `calculateOwnApiPricing`, backend display-pricing merge, and list/detail pricing consumers.

- [ ] **Step 1: Write failing pricing-state tests**

Add assertions that paid, free, and unpublished states are distinguishable and that a generic tier can be selected:

```ts
expect(activeOfficialTier({
  status: 'paid',
  official: { input: 2, cachedInput: 0.2, output: 12 },
  tiers: [{ id: 'long', minInputTokens: 200_000, minInclusive: false, maxInputTokens: null, maxInclusive: true, official: { input: 4, cachedInput: 0.4, output: 18 } }],
  multiplier: 0.7,
  sourceUrl: 'https://vendor.example/pricing',
  checkedAt: '2026-08-31',
  noteKey: null,
}, 'long')).toEqual({ input: 4, cachedInput: 0.4, output: 18 })
expect(calculateOwnApiPricing({ input: 0, cachedInput: 0, output: 0 })).toEqual({ input: 0, cachedInput: 0, output: 0 })
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/data/__tests__/modelCatalog.spec.ts`

Expected: FAIL because the pricing-state types and tier selector do not exist.

- [ ] **Step 3: Add the domain shapes**

Implement these exact contracts:

```ts
export type ModelPricingStatus = 'paid' | 'free' | 'unpublished'

export interface CatalogEligibilitySource {
  source: 'packyapi'
  discountPercent: number
  checkedAt: '2026-08-31'
  sourceUrl: 'https://www.packyapi.com/pricing'
}

export interface OfficialPricingTier {
  id: string
  minInputTokens: number
  minInclusive: boolean
  maxInputTokens: number | null
  maxInclusive: boolean
  official: OfficialTokenPricing
}

export interface ModelPricingSource {
  status: ModelPricingStatus
  official: OfficialTokenPricing
  tiers: OfficialPricingTier[]
  multiplier: 0.7
  sourceUrl: string
  checkedAt: '2026-08-31'
  noteKey: string | null
}
```

Extend `ModelCatalogEntry` with `eligibilitySource` and `searchAliases`. Tier boundaries are explicit: `minInclusive` controls the lower boundary and `maxInclusive` controls a non-null upper boundary, so both xAI's `>=200K` and Google's `>200K` semantics remain exact. Migrate the existing Grok `longContext` data to a `long` tier while preserving current card/detail behavior. `activeOfficialTier` returns the selected tier or the base official price. Backend display-pricing merges must not replace eligibility or official pricing metadata.

- [ ] **Step 4: Create the data-only seed boundary**

Define `RawVerifiedModelSeed` in `verifiedModelSeeds.ts`, move the current 16 raw entries into `verifiedModelSeedData`, and let `modelCatalog.ts` convert them through one mapper. The raw module must not import Vue, i18n, router, or API code.

- [ ] **Step 5: Run tests, typecheck, and commit**

Run:

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/data/__tests__/modelCatalog.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/data/modelCatalog.ts src/data/verifiedModelSeeds.ts src/data/__tests__/modelCatalog.spec.ts
```

```bash
git add frontend/src/data/modelCatalog.ts frontend/src/data/verifiedModelSeeds.ts frontend/src/data/__tests__/modelCatalog.spec.ts
git commit -m "refactor: support traceable catalog pricing states"
```

### Task 2: Complete OpenAI, Anthropic, And xAI Eligibility

**Files:**
- Modify: `frontend/src/data/verifiedModelSeeds.ts`
- Modify: `frontend/src/data/__tests__/modelCatalog.spec.ts`

**Interfaces:**
- Consumes: raw seed and pricing-state contracts from Task 1.
- Produces: 20 verified western-provider seeds: OpenAI 9, Anthropic 9, xAI 2.

- [ ] **Step 1: Replace the 16-ID assertion with exact provider arrays**

```ts
const westernIds = {
  OpenAI: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-daybreak-blue-latest', 'codex-auto-review', 'omni-moderation-latest'],
  Anthropic: ['claude-fable-5', 'claude-haiku-4-5-20251001', 'claude-opus-4-6', 'claude-opus-4-7', 'claude-opus-4-8', 'claude-opus-5', 'claude-sonnet-4-5-20250929', 'claude-sonnet-4-6', 'claude-sonnet-5'],
  xAI: ['grok-4.5', 'grok-4.6'],
}
expect(Object.fromEntries(Object.entries(westernIds).map(([provider, ids]) => [provider, catalog.filter((model) => ids.includes(model.modelId)).length]))).toEqual({ OpenAI: 9, Anthropic: 9, xAI: 2 })
```

Also assert every entry has Packy eligibility `>= 50`, the fixed source URL, date, and `available === null`.

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/data/__tests__/modelCatalog.spec.ts`

Expected: FAIL with four missing IDs.

- [ ] **Step 3: Add the four new entries with exact pricing decisions**

Use this matrix; retain the previous 16 official prices unchanged:

| Model | Packy discount | Pricing state | Official input / cache / output | Official source |
| --- | ---: | --- | --- | --- |
| `gpt-daybreak-blue-latest` | 91 | unpublished | null / null / null | `https://developers.openai.com/api/docs/models/all` |
| `omni-moderation-latest` | 86 | free | 0 / 0 / 0 | `https://developers.openai.com/api/docs/models/omni-moderation-latest` |
| `claude-fable-5` | 71 | paid | 10 / 1 / 50 | `https://platform.claude.com/docs/en/about-claude/pricing` |
| `claude-sonnet-4-5-20250929` | 71 | paid | 3 / 0.3 / 15 | `https://platform.claude.com/docs/en/about-claude/pricing` |

`gpt-daybreak-blue-latest` is eligible because Packy lists it, but remains unpublished because OpenAI's official model catalog does not publish that ID or a list price. Do not copy Packy's displayed price. Add a 1M context override for Fable 5 and a 200K override for Sonnet 4.5.

- [ ] **Step 4: Assert free and unpublished rendering inputs**

```ts
expect(byId('omni-moderation-latest')?.pricingSource).toMatchObject({ status: 'free', official: { input: 0, cachedInput: 0, output: 0 } })
expect(byId('gpt-daybreak-blue-latest')?.pricingSource).toMatchObject({ status: 'unpublished', official: { input: null, cachedInput: null, output: null } })
```

- [ ] **Step 5: Run focused checks and commit**

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/data/__tests__/modelCatalog.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/data/verifiedModelSeeds.ts src/data/__tests__/modelCatalog.spec.ts
```

```bash
git add frontend/src/data/verifiedModelSeeds.ts frontend/src/data/__tests__/modelCatalog.spec.ts
git commit -m "feat: complete western provider model eligibility"
```

### Task 3: Add Google And Chinese-Provider Entries

**Files:**
- Modify: `frontend/src/data/modelCatalog.ts`
- Modify: `frontend/src/data/verifiedModelSeeds.ts`
- Modify: `frontend/src/data/__tests__/modelCatalog.spec.ts`
- Verify: `frontend/public/brand/gemini.svg`
- Verify: `frontend/public/brand/glm.svg`
- Verify: `frontend/public/brand/kimi.svg`
- Verify: `frontend/public/brand/minimax.svg`
- Verify: `frontend/public/brand/qwen.svg`
- Verify: matching existing family artwork and neutral fallback artwork

**Interfaces:**
- Consumes: seed/pricing contracts from Tasks 1–2.
- Produces: the exact 46-entry catalog and provider families for Google, Alibaba/Qwen, Zhipu, Moonshot, and MiniMax.

- [ ] **Step 1: Write the exact 46-ID and provider-count test**

Add the 26 remaining IDs:

```ts
const addedProviderIds = {
  Google: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.7-flash'],
  Qwen: ['qwen3-coder-next', 'qwen3-max', 'qwen3-vl-flash', 'qwen3.5-flash', 'qwen3.5-plus', 'qwen3.6-max-preview', 'qwen3.6-plus', 'qwen3.7-max', 'qwen3.7-plus', 'qwen3.8-flash', 'qwen3.8-max'],
  'Z.AI': ['glm-5', 'glm-5.2', 'glm-5.3-flash'],
  Moonshot: ['kimi-k2.5', 'kimi-k3'],
  MiniMax: ['minimax-m2.5', 'MiniMax-M2.7', 'MiniMax-M3'],
}
expect(verifiedModelSeedData).toHaveLength(46)
expect(new Set(verifiedModelSeedData.map((seed) => seed.modelId)).size).toBe(46)
```

The final provider counts in UI order must be `OpenAI 9`, `Anthropic 9`, `xAI 2`, `Google 7`, `Qwen 11`, `Z.AI 3`, `Moonshot 2`, `MiniMax 3`.

- [ ] **Step 2: Run and verify failure**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/data/__tests__/modelCatalog.spec.ts`

Expected: FAIL because the five provider families and 26 seeds are incomplete.

- [ ] **Step 3: Add provider families and deterministic pricing data**

Use original-vendor standard pricing, USD per 1M tokens. Every tier's OwnAPI value is derived in code, never stored manually.

Google source: `https://ai.google.dev/gemini-api/docs/pricing`.

| Model | Base official input / cache / output | Additional tiers or decision |
| --- | --- | --- |
| `gemini-2.5-flash` | 0.3 / 0.03 / 2.5 | paid |
| `gemini-2.5-pro` | 1.25 / 0.125 / 10 | `over-200k`: 2.5 / 0.25 / 15 |
| `gemini-3-flash-preview` | 0.5 / 0.05 / 3 | paid |
| `gemini-3-pro-preview` | null / null / null | unpublished: current vendor pricing page has no exact-ID row |
| `gemini-3.1-pro-preview` | 2 / 0.2 / 12 | `over-200k`: 4 / 0.4 / 18 |
| `gemini-3.5-flash` | 1.5 / 0.15 / 9 | paid |
| `gemini-3.7-flash` | 1.5 / 0.15 / 7.5 | list price; note current introductory 0.75 / 0.075 / 3.75 through 2026-12-31 |

Z.AI source: `https://docs.z.ai/guides/overview/pricing`.

| Model | Official input / cache / output | Decision |
| --- | --- | --- |
| `glm-5` | 1 / 0.2 / 3.2 | paid |
| `glm-5.2` | null / null / null | unpublished on the original-vendor pricing page |
| `glm-5.3-flash` | null / null / null | unpublished on the original-vendor pricing page |

Kimi source: `https://platform.kimi.com/docs/pricing/chat` and `https://platform.kimi.com/docs/pricing/chat-k3`.

| Model | Official input / cache / output | Decision |
| --- | --- | --- |
| `kimi-k2.5` | null / null / null | unpublished on the current original-vendor pricing index |
| `kimi-k3` | 3 / 0.3 / 15 | paid, 1M context |

MiniMax source: `https://platform.minimax.io/docs/guides/pricing-paygo` and the official Token Plan API pricing page.

| Model | Base official input / cache / output | Additional tiers |
| --- | --- | --- |
| `minimax-m2.5` | 0.3 / 0.03 / 1.2 | none |
| `MiniMax-M2.7` | 0.3 / 0.06 / 1.2 | none |
| `MiniMax-M3` | 0.6 / 0.12 / 2.4 | `over-512k`: 1.2 / 0.24 / 4.8; use crossed list prices, not the provider's permanent 50% promotion |

Alibaba/Qwen source: `https://www.alibabacloud.com/help/en/model-studio/model-pricing`. Use International/Global standard list-price rows and encode every published context tier. Base prices are the first tier:

| Model | Base official input / output | Required tiers |
| --- | --- | --- |
| `qwen3-coder-next` | 0.144 / 0.574 | 32–128K: 0.216/0.861; 128–256K: 0.359/1.434 |
| `qwen3-max` | 1.2 / 6 | 32–128K: 2.4/12; 128–256K: 3/15 |
| `qwen3-vl-flash` | 0.022 / 0.215 | 32–128K: 0.043/0.43; 128–256K: 0.086/0.859 |
| `qwen3.5-flash` | 0.029 / 0.287 | 128–256K: 0.115/1.147; 256K–1M: 0.172/1.72 |
| `qwen3.5-plus` | 0.115 / 0.688 | 128–256K: 0.287/1.72; 256K–1M: 0.573/3.44 |
| `qwen3.6-max-preview` | 1.3 / 7.8 | 128–256K: 2/12 |
| `qwen3.6-plus` | 0.276 / 1.651 | 256K–1M: 1.101/6.602 |
| `qwen3.7-max` | 2.5 / 7.5 | none; retain list price, not limited promotion |
| `qwen3.7-plus` | 0.4 / 1.6 | 256K–1M: 1.2/4.8; retain list price |
| `qwen3.8-flash` | 0.113 / 0.382 | none |
| `qwen3.8-max` | 2 / 6 | none |

Set `cachedInput: null` when the official standard row does not publish a cache-hit value in the selected scope. Each seed carries its exact Packy discount from the spec and source date `2026-08-31`.

- [ ] **Step 4: Verify real assets and family mapping**

Run:

```bash
test -f frontend/public/brand/gemini.svg
test -f frontend/public/brand/glm.svg
test -f frontend/public/brand/kimi.svg
test -f frontend/public/brand/minimax.svg
test -f frontend/public/brand/qwen.svg
test -f frontend/public/model-art/gemini.jpg
test -f frontend/public/model-art/glm.jpg
test -f frontend/public/model-art/kimi.jpg
test -f frontend/public/model-art/qwen.jpg
test -f frontend/public/model-art/ownapi.jpg
```

Use `/model-art/ownapi.jpg` for MiniMax until a real correctly fitted MiniMax family artwork asset is available; use the real existing `/brand/minimax.svg` logo.

- [ ] **Step 5: Run focused checks and commit**

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/data/__tests__/modelCatalog.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/data/modelCatalog.ts src/data/verifiedModelSeeds.ts src/data/__tests__/modelCatalog.spec.ts
```

```bash
git add frontend/src/data/modelCatalog.ts frontend/src/data/verifiedModelSeeds.ts frontend/src/data/__tests__/modelCatalog.spec.ts
git commit -m "feat: expand verified catalog to 46 models"
```

### Task 4: Provider Grouping And Ranked Search Domain

**Files:**
- Modify: `frontend/src/data/modelCatalog.ts`
- Modify: `frontend/src/data/__tests__/modelCatalog.spec.ts`

**Interfaces:**
- Consumes: complete catalog from Task 3 and existing `CatalogFilters`.
- Produces: `CATALOG_PROVIDER_ORDER`, `normalizeCatalogSearch(value)`, `scoreCatalogMatch(entry, query)`, `groupModelCatalog(entries)`, and provider-first filtering/sorting.

- [ ] **Step 1: Write failing search-normalization tests**

```ts
expect(filterModelCatalog(catalog, { ...emptyFilters, query: 'gpt 5.4 mini' }).map((model) => model.modelId)).toContain('gpt-5.4-mini')
expect(filterModelCatalog(catalog, { ...emptyFilters, query: 'google flash' }).every((model) => model.provider === 'Google')).toBe(true)
expect(filterModelCatalog(catalog, { ...emptyFilters, query: 'qwen coder' })[0]?.modelId).toBe('qwen3-coder-next')
```

Add an exact-vs-prefix-vs-substring ranking fixture inside one provider.

- [ ] **Step 2: Write failing provider-order tests**

```ts
expect(groupModelCatalog(filterModelCatalog(catalog, emptyFilters)).map((group) => group.provider)).toEqual([
  'OpenAI', 'Anthropic', 'xAI', 'Google', 'Qwen', 'Z.AI', 'Moonshot', 'MiniMax',
])
for (const sort of ['featured', 'name', 'input-price', 'output-price'] as const) {
  expect(groupModelCatalog(filterModelCatalog(catalog, { ...emptyFilters, sort })).map((group) => group.provider)).toEqual(CATALOG_PROVIDER_ORDER)
}
```

- [ ] **Step 3: Implement normalization and relevance**

`normalizeCatalogSearch` lowercases, trims, converts runs of whitespace/hyphen/underscore/dot/slash to a single space, and folds bilingual provider aliases from `searchAliases`. Query tokens use AND semantics. `scoreCatalogMatch` uses `400` exact, `300` prefix, `200` token-boundary, and `100` metadata substring as the base score; sum per token and use the selected normal sort as the tie-breaker.

- [ ] **Step 4: Implement provider-first order and groups**

```ts
export const CATALOG_PROVIDER_ORDER = ['OpenAI', 'Anthropic', 'xAI', 'Google', 'Qwen', 'Z.AI', 'Moonshot', 'MiniMax'] as const

export interface ModelProviderGroup {
  provider: string
  providerLogo: string
  entries: ModelCatalogEntry[]
}
```

Known providers use the constant order; backend-only unknown providers follow alphabetically. Filter first, then group; empty groups are omitted. Normal and price sorts operate only inside a provider.

- [ ] **Step 5: Run tests and commit**

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/data/__tests__/modelCatalog.spec.ts
node_modules/.bin/vue-tsc --noEmit
```

```bash
git add frontend/src/data/modelCatalog.ts frontend/src/data/__tests__/modelCatalog.spec.ts
git commit -m "feat: group and rank public model search"
```

### Task 5: Provider-Grouped Models Page And Search Controls

**Files:**
- Modify: `frontend/src/views/public/ModelsCatalogView.vue`
- Modify: `frontend/src/views/public/__tests__/ModelsCatalogView.spec.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`

**Interfaces:**
- Consumes: `groupModelCatalog`, ranked `filterModelCatalog`, all pricing states, and existing public motion primitives.
- Produces: accessible provider sections, clear-search control, independent Reset all, result/empty copy, and responsive grouping.

- [ ] **Step 1: Write failing component tests**

Mount the page with the 46-entry catalog and assert eight provider headings in exact order, model counts, and cards contained in their own provider sections. Type `gpt 5.4 mini`, `google flash`, and `qwen coder`; assert normalized/multi-token results and no cross-provider interleaving. Assert Clear search preserves the selected provider/class/endpoint filters while Reset all clears every filter.

- [ ] **Step 2: Run and verify failure**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/views/public/__tests__/ModelsCatalogView.spec.ts`

Expected: FAIL because the page renders one flat grid and has no independent search clear.

- [ ] **Step 3: Render semantic provider sections**

Use one `<section>` per `providerGroups` entry with an `<h2>`, real vendor logo, and localized model count. Render each section's card grid with stable keys `${platform}:${modelId}`. Keep the motion plan's bounded first-six delay across the visible result set, not six per provider. Empty provider groups are absent.

- [ ] **Step 4: Add polished search controls**

Add a visible clear button inside/adjacent to the search field only when the query is nonempty. Give the input an explicit accessible label; Escape clears only the query. Keep filtering synchronous and update the total result count immediately. Reset all restores `{ query: '', provider: '', modelClass: '', endpoint: '', sort: 'featured' }`.

- [ ] **Step 5: Render paid/free/unpublished card states**

Paid entries retain official strike-through and OwnAPI values. Free entries show one stable “Free” / “免费” status instead of three `$0` metrics. Unpublished entries show “Not published” / “暂未公布”; no card can render `$0` as a fallback.

- [ ] **Step 6: Add bilingual copy and responsive styles**

Add provider section count, clear-search, free, no-results, and reset-all copy. Desktop uses the existing 3/2-column card grid inside sections; mobile uses one column with clear dividers and no horizontal overflow.

- [ ] **Step 7: Run checks and commit**

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/views/public/__tests__/ModelsCatalogView.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/views/public/ModelsCatalogView.vue src/views/public/__tests__/ModelsCatalogView.spec.ts src/i18n/locales/en.ts src/i18n/locales/zh.ts
```

```bash
git add frontend/src/views/public/ModelsCatalogView.vue frontend/src/views/public/__tests__/ModelsCatalogView.spec.ts frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts
git commit -m "feat: group public models by provider"
```

### Task 6: Generic Tiered Detail Pricing And Source Notes

**Files:**
- Modify: `frontend/src/views/public/ModelDetailView.vue`
- Modify: `frontend/src/views/public/__tests__/ModelDetailView.spec.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`

**Interfaces:**
- Consumes: pricing state, generic tiers, notes, official sources, and checked dates.
- Produces: reusable tier selector and truthful paid/free/unpublished detail disclosure for all providers.

- [ ] **Step 1: Write failing representative detail tests**

Cover `omni-moderation-latest` (Free), `gpt-daybreak-blue-latest` (Not published), `gemini-2.5-pro` (base and >200K tiers), `MiniMax-M3` (base and >512K tiers), and `qwen3.5-plus` (three tiers). Assert every tier's official and derived 70% values and that tier buttons do not navigate.

- [ ] **Step 2: Run and verify failure**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/views/public/__tests__/ModelDetailView.spec.ts`

- [ ] **Step 3: Replace Grok-only context logic with generic tier state**

Store selected tier IDs by model identity. Render the base tier plus every `pricingSource.tiers` item using localized threshold labels derived from `minInputTokens`, `minInclusive`, `maxInputTokens`, and `maxInclusive`. Keep source anchors `target="_blank" rel="noopener noreferrer"` and display checked date `2026-08-31`.

- [ ] **Step 4: Render notes and states**

Render `noteKey` for Google introductory pricing, MiniMax list-versus-promotion pricing, Alibaba region/tier scope, aliases, and unpublished decisions. Free is a verified state, not a missing price; unpublished never renders a numeric value.

- [ ] **Step 5: Run checks and commit**

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/views/public/__tests__/ModelDetailView.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/views/public/ModelDetailView.vue src/views/public/__tests__/ModelDetailView.spec.ts src/i18n/locales/en.ts src/i18n/locales/zh.ts
```

```bash
git add frontend/src/views/public/ModelDetailView.vue frontend/src/views/public/__tests__/ModelDetailView.spec.ts frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts
git commit -m "feat: disclose expanded model pricing tiers"
```

### Task 7: Synchronize The Homepage Provider Strip

**Files:**
- Modify: `frontend/src/data/modelCatalog.ts`
- Modify: `frontend/src/data/__tests__/modelCatalog.spec.ts`
- Modify: `frontend/src/views/HomeView.vue`
- Modify: `frontend/src/views/__tests__/HomeView.motion.spec.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`

**Interfaces:**
- Consumes: complete 46-model catalog, `CATALOG_PROVIDER_ORDER`, provider logos, and approved homepage motion.
- Produces: `getCatalogProviderSummaries(entries?)` and a homepage strip derived from nonempty catalog providers.

- [ ] **Step 1: Write failing catalog-summary tests**

Assert that `getCatalogProviderSummaries()` returns exactly eight entries in provider order, with counts `9/9/2/7/11/3/2/3`, real logo paths, and homepage labels `ChatGPT`, `Claude`, `Grok`, `Gemini`, `Qwen`, `GLM`, `Kimi`, and `MiniMax`. Pass a catalog subset and assert providers with zero entries are omitted.

- [ ] **Step 2: Write failing homepage tests**

Mount the default homepage and assert the strip contains the eight approved labels and logo assets, contains no `DeepSeek`, `Mistral`, “Soon”, or “即将推出”, and retains the existing reveal/hover hooks. Confirm configured custom HTML/URL home content does not render the strip.

- [ ] **Step 3: Implement one provider-presentation source**

Add formal provider name, homepage family label, and real logo path to the catalog provider metadata. `getCatalogProviderSummaries(entries = modelCatalog)` filters to nonempty providers and returns model counts without importing Vue, i18n, router, or API code. Do not duplicate provider availability in `HomeView.vue`.

- [ ] **Step 4: Replace the hard-coded homepage list**

Render the summary output in `HomeView.vue`. Remove DeepSeek/Mistral and every `upcoming`/Soon branch. Use an eight-column wide-desktop grid, four-by-two tablet grid, and the current overflow-safe horizontal row on mobile. Preserve the approved one-time section reveal, maximum 3px hover lift, maximum 1.04 logo scale, and Reduced Motion behavior.

- [ ] **Step 5: Run checks and commit**

```bash
cd frontend
node node_modules/vitest/vitest.mjs run src/data/__tests__/modelCatalog.spec.ts src/views/__tests__/HomeView.motion.spec.ts src/i18n/__tests__/homeLocales.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/data/modelCatalog.ts src/data/__tests__/modelCatalog.spec.ts src/views/HomeView.vue src/views/__tests__/HomeView.motion.spec.ts src/i18n/locales/en.ts src/i18n/locales/zh.ts
```

```bash
git add frontend/src/data/modelCatalog.ts frontend/src/data/__tests__/modelCatalog.spec.ts frontend/src/views/HomeView.vue frontend/src/views/__tests__/HomeView.motion.spec.ts frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts
git commit -m "feat: sync homepage providers with model catalog"
```

### Task 8: Full Verification And Durable Handoff

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: all prior tasks, the synchronized homepage provider strip, and the approved motion system state.
- Produces: verified 46-model catalog and accurate recovery/integration notes.

- [ ] **Step 1: Run the full frontend gate with reliable local binaries**

```bash
cd frontend
node_modules/.bin/eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts
node_modules/.bin/vue-tsc --noEmit
node node_modules/vitest/vitest.mjs run
node_modules/.bin/vue-tsc -b
node node_modules/vite/bin/vite.js build
```

Expected: every command exits 0. Record nonfatal pre-existing Browserslist/chunk warnings separately.

- [ ] **Step 2: Audit the data matrix**

Verify exactly 46 unique IDs, provider counts `9/9/2/7/11/3/2/3`, every discount `>=50`, eligibility/source dates, paid/free/unpublished states, generic tiers, exact `0.7` derivation, availability null, and official source URLs against the spec and original-vendor pages.

- [ ] **Step 3: Browser QA desktop and mobile**

At 1440×900 and 390×844, verify all eight provider sections, `gpt 5.4 mini`, `google flash`, and `qwen coder` searches, every filter combination, clear versus reset, price sorting inside providers, free/unpublished cards, representative detail tiers, images, overflow, and public motion. Verify the homepage strip shows the same eight nonempty providers, the approved family labels and logos, no DeepSeek/Mistral/Soon state, and correct 8-column/4-by-2/mobile-scroll layouts. Repeat core Home/Models interactions with `prefers-reduced-motion: reduce`.

- [ ] **Step 4: Verify exclusions**

Confirm no `frontend/src/views/admin/**` file changed, `/monitor` remains authenticated, administrator monitoring remains untouched, and the public page still makes no unsupported availability/health claim.

- [ ] **Step 5: Update `AGENTS.md`**

Record the 46-model snapshot and provider counts, data architecture, pricing states/tier rules, official URLs and checked date, provider order, search normalization/ranking, changed assets/files, exact validation results, latest feature/head commits, worktree/branch recovery, untouched `frontend/pnpm-workspace.yaml`, and the existing deployment SSH-key blocker.

- [ ] **Step 6: Commit the checkpoint**

```bash
git add -f AGENTS.md
git commit -m "docs: record expanded model catalog"
git diff --check HEAD^
```
