# OwnAPI PackyAPI 50%-Or-Better Model Expansion Design

**Date:** 2026-08-31  
**Status:** Awaiting user review  
**Related implementation:** `frontend/src/data/modelCatalog.ts`, public Models list/detail views  
**Reference snapshot:** [PackyAPI pricing](https://www.packyapi.com/pricing), checked 2026-08-31

## Goal

Expand the public OwnAPI model catalog from the previously verified 16 models to every model that PackyAPI currently labels **50% off or better**. The resulting catalog contains exactly 46 model IDs. PackyAPI determines eligibility only; every public OwnAPI price remains the latest verified original-vendor list price multiplied by exactly `0.7`.

The Models page must keep models from the same provider together and provide fast, predictable local search without making unsupported availability claims.

## Non-Goals

- Do not use or reverse-calculate PackyAPI channel prices.
- Do not claim that a catalog model is currently available unless the backend supplies a real availability signal.
- Do not mix administrator monitoring or administrator UI motion into this work.
- Do not add models below the confirmed 50%-off eligibility threshold.
- Do not invent vendor logos, model artwork, official prices, context windows, aliases, or endpoint support.

## Eligibility Snapshot

The 46-model set is frozen from the PackyAPI pricing page on 2026-08-31. Packy discount percentages are traceability metadata and are not presented as OwnAPI prices.

### OpenAI — 9

- `gpt-5.4` — 93%
- `gpt-5.4-mini` — 93%
- `gpt-5.5` — 93%
- `gpt-5.6-luna` — 93%
- `gpt-5.6-sol` — 93%
- `gpt-5.6-terra` — 93%
- `gpt-daybreak-blue-latest` — 91%
- `codex-auto-review` — 93%
- `omni-moderation-latest` — 86%

### Anthropic — 9

- `claude-fable-5` — 71%
- `claude-haiku-4-5-20251001` — 96%
- `claude-opus-4-6` — 96%
- `claude-opus-4-7` — 96%
- `claude-opus-4-8` — 96%
- `claude-opus-5` — 96%
- `claude-sonnet-4-5-20250929` — 71%
- `claude-sonnet-4-6` — 96%
- `claude-sonnet-5` — 96%

### xAI — 2

- `grok-4.5` — 99%
- `grok-4.6` — 99%

### Google — 7

- `gemini-2.5-flash` — 57%
- `gemini-2.5-pro` — 57%
- `gemini-3-flash-preview` — 57%
- `gemini-3-pro-preview` — 57%
- `gemini-3.1-pro-preview` — 57%
- `gemini-3.5-flash` — 57%
- `gemini-3.7-flash` — 57%

### Zhipu AI — 3

- `glm-5` — 50%
- `glm-5.2` — 50%
- `glm-5.3-flash` — 50%

### Moonshot AI — 2

- `kimi-k2.5` — 50%
- `kimi-k3` — 65%

### MiniMax — 3

- `minimax-m2.5` — 50%
- `MiniMax-M2.7` — 50%
- `MiniMax-M3` — 50%

### Alibaba Cloud / Qwen — 11

- `qwen3-coder-next` — 50%
- `qwen3-max` — 50%
- `qwen3-vl-flash` — 50%
- `qwen3.5-flash` — 50%
- `qwen3.5-plus` — 50%
- `qwen3.6-max-preview` — 50%
- `qwen3.6-plus` — 50%
- `qwen3.7-max` — 50%
- `qwen3.7-plus` — 50%
- `qwen3.8-flash` — 50%
- `qwen3.8-max` — 50%

## Data And Pricing Contract

Each seed must preserve the exact Packy-facing model ID while also carrying a stable slug, provider, original-vendor logo, family artwork, model classes, supported endpoints, context metadata, and traceable pricing state.

Add eligibility metadata:

```ts
interface CatalogEligibilitySource {
  source: 'packyapi'
  discountPercent: number
  checkedAt: '2026-08-31'
  sourceUrl: 'https://www.packyapi.com/pricing'
}
```

Official pricing must distinguish three states:

- `paid`: the vendor publishes a positive standard list price; OwnAPI displays the verified value multiplied by `0.7`.
- `free`: the vendor explicitly documents a zero-cost service; OwnAPI displays “Free” / “免费”, not a numeric `$0` fallback.
- `unpublished`: no authoritative original-vendor price was found; OwnAPI displays “Not published” / “暂未公布”.

Packy prices, inferred prices, reseller prices, search snippets, and third-party price tables are not acceptable official pricing sources. Pricing sources must be original-vendor documentation and carry the checked date. Tiered context, cache-write, regional processing, batch, data residency, image, per-request, or other nonstandard billing must be represented explicitly rather than flattened into an inaccurate token price.

`available` remains `boolean | null`. All static seeds remain `null`; only an existing backend availability signal may set it to `true` or `false`.

## Provider Assets

Use real vendor marks for OpenAI, Anthropic, xAI, Google, Zhipu AI, Moonshot AI, MiniMax, and Alibaba/Qwen. Prefer existing repository assets; otherwise obtain a real official press-kit or established brand asset and record its source. Do not draw approximate SVG logos or use emoji/text placeholders.

Family artwork follows the existing OwnAPI black/white photographic system. A provider may share one suitable family image across its models. Missing artwork must use an existing neutral repository fallback until a real, correctly fitted asset is available.

## Provider-Grouped Catalog Layout

The default catalog is rendered as provider sections, not one interleaved card grid. Each nonempty section contains:

- original-vendor logo;
- provider display name;
- visible model count;
- the provider's responsive model-card grid.

Stable provider order is:

1. OpenAI
2. Anthropic
3. xAI
4. Google
5. Alibaba Cloud / Qwen
6. Zhipu AI
7. Moonshot AI
8. MiniMax

The selected sort is a secondary sort inside each provider. Input/output price sorting therefore never interleaves providers. Filtering and search remove empty provider sections. Desktop retains the existing multi-column card rhythm; mobile uses a single-column list with clear provider dividers.

## Search And Filter Behavior

Search is synchronous and local for 46 entries; it does not wait on an API and needs no debounce. A normalized search document is built from:

- exact model ID;
- display name and documented aliases;
- provider name and bilingual provider aliases;
- model-class labels;
- supported endpoint labels.

Normalization lowercases text, trims whitespace, and treats spaces, hyphens, underscores, and repeated separators as equivalent. `gpt 5.4 mini` must match `gpt-5.4-mini`. Multiple tokens use AND semantics, so `google flash` matches Google Flash models while excluding unrelated Flash names.

Within each provider, relevance ranks:

1. exact normalized model ID or display-name match;
2. model ID/display-name prefix match;
3. token-boundary match;
4. general substring/metadata match.

When no query is present, the selected normal sort applies. When a query is present, relevance is the first secondary key and the selected normal sort breaks ties. Provider grouping always remains the primary key.

Search composes with provider, model-class, and endpoint filters. The UI includes a visible result count, clear-search control, Reset all action, and bilingual empty state. Clearing search does not silently clear the user's other filters; Reset all clears every filter and restores the default provider-grouped order.

## Detail Pages

Every new seed receives a stable detail route. The detail page reuses the verified pricing/source table and must show:

- provider and model identity;
- context window only when verified;
- official versus OwnAPI 70% pricing by supported billing dimension;
- source URL and checked date;
- alias, preview, tier, cache, regional, or unpublished caveats where applicable.

Unknown metadata is omitted or labeled unpublished; it is never guessed from the model name.

## Motion Interaction

This expansion consumes the separately approved public/user motion system. Provider sections may use the one-time reveal primitive, and model cards may use the bounded list transition and restrained hover already defined in that plan. Search, filters, clear, reset, tier switches, and navigation remain immediately interactive. Reduced Motion displays final content without displacement or stagger.

No new motion is added to administrator pages.

## Testing And Acceptance

Automated coverage must prove:

- exactly 46 required unique model IDs exist;
- provider counts are `9/9/2/7/11/3/2/3` in the stable provider order;
- every entry has eligibility metadata with discount `>= 50` and checked date `2026-08-31`;
- paid prices use exact official values and exact `0.7` derivation;
- free and unpublished pricing are distinct and never become an accidental `$0`;
- backend merges do not overwrite official pricing/eligibility metadata;
- availability remains unknown without a backend signal;
- provider grouping remains intact for featured, name, input-price, and output-price sorts;
- normalized separator-insensitive and multi-token search works;
- exact/prefix results rank above weaker matches inside a provider;
- search composes with every existing filter and handles empty/reset states;
- vendor logos and family-art paths resolve to real files;
- desktop and mobile layouts have no broken images or horizontal overflow.

Run full frontend lint, typecheck, tests, and production build. Browser QA covers the 46-model catalog, every provider section, representative paid/free/unpublished detail pages, search/filter composition, mobile layout, normal motion, and Reduced Motion.

## Durable Handoff

After implementation, update `AGENTS.md` with the 46-model snapshot, provider counts, official source URLs and checked dates, free/unpublished decisions, search normalization/ranking, provider order, changed assets/files, validation results, latest safe commit, and the existing deployment blocker. Do not paste full source files.
