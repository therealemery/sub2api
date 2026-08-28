# OwnAPI Public Models and Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build public Vercel-inspired Models, model detail, and Docs experiences for OwnAPI while preserving live pricing, bilingual content, and future catalog growth.

**Architecture:** Add a reusable public-site shell, a tested catalog-merging module, two model views, and a structured documentation view. Public routes consume the existing model-display endpoint where possible and fall back to curated family data and project-owned generated artwork.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia, vue-i18n, Vitest, existing CSS tokens and icon components.

**Spec:** `docs/superpowers/specs/2026-08-28-ownapi-public-models-docs-design.md`

## Global Constraints

- Preserve all existing uncommitted homepage and localization work.
- Keep `/home`, `/models`, `/models/:modelId`, and `/docs` public.
- Keep account, billing, key, usage, dashboard, and admin routes protected.
- Default to English and preserve Chinese switching.
- Do not copy CometAPI branding, prose, logos, artwork, or proprietary assets.
- Use original generated raster artwork for model families and a neutral fallback.
- Preserve a useful curated catalog when the model-display endpoint is unavailable.
- Final browser QA must cover desktop and `390 × 844` mobile layouts.

---

### Task 1: Public catalog domain model

**Files:**
- Create: `frontend/src/data/modelCatalog.ts`
- Create: `frontend/src/data/__tests__/modelCatalog.spec.ts`
- Read: `frontend/src/api/modelDisplay.ts`
- Read: `frontend/src/utils/modelPricingReference.ts`

**Interfaces:**
- Produces: `ModelCatalogEntry`, `ModelCatalogPrice`, `CatalogFilters`, `buildModelCatalog(config)`, `filterModelCatalog(entries, filters)`, `findCatalogModel(entries, slug)`, and `relatedCatalogModels(entries, entry)`.
- Consumes: `ModelDisplayConfig` and `ModelDisplayPricingConfig` from the existing API client.

- [ ] **Step 1: Write failing catalog tests**

```ts
import { describe, expect, it } from 'vitest'
import { buildModelCatalog, filterModelCatalog, findCatalogModel } from '../modelCatalog'

describe('modelCatalog', () => {
  it('uses curated entries when the API config is empty', () => {
    expect(buildModelCatalog({ featured_models: [], pricing_models: [], reference_discount: null }).length).toBeGreaterThanOrEqual(8)
  })

  it('merges configured pricing into matching family metadata', () => {
    const result = buildModelCatalog({ featured_models: [], pricing_models: [{ model: 'gpt-5.4', platform: 'openai', input_price: 1, output_price: 4 }], reference_discount: null })
    expect(result.find((item) => item.modelId === 'gpt-5.4')?.price?.input).toBe(1)
  })

  it('filters by query, provider, and capability', () => {
    const result = filterModelCatalog(buildModelCatalog(), { query: 'claude', provider: 'Anthropic', capability: 'Reasoning', sort: 'featured' })
    expect(result.every((item) => item.provider === 'Anthropic')).toBe(true)
  })

  it('resolves a model by a URL-safe slug', () => {
    expect(findCatalogModel(buildModelCatalog(), 'gpt-5-4')?.modelId).toBe('gpt-5.4')
  })
})
```

- [ ] **Step 2: Run the new test and confirm it fails because the module does not exist**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts`

- [ ] **Step 3: Implement family metadata and pure catalog helpers**

Implement explicit metadata for GPT, Claude, Gemini, DeepSeek, Grok, Qwen, GLM, and Kimi. Normalize platform aliases, generate stable slugs, retain configured prices, and map unknown configured models to provider or OwnAPI fallback metadata.

- [ ] **Step 4: Run the catalog test until it passes**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts`

- [ ] **Step 5: Commit the isolated catalog module**

```bash
git add frontend/src/data/modelCatalog.ts frontend/src/data/__tests__/modelCatalog.spec.ts
git commit -m "feat: add public model catalog domain"
```

---

### Task 2: Original model-family artwork

**Files:**
- Create: `frontend/public/model-art/gpt.webp`
- Create: `frontend/public/model-art/claude.webp`
- Create: `frontend/public/model-art/gemini.webp`
- Create: `frontend/public/model-art/deepseek.webp`
- Create: `frontend/public/model-art/grok.webp`
- Create: `frontend/public/model-art/qwen.webp`
- Create: `frontend/public/model-art/glm.webp`
- Create: `frontend/public/model-art/kimi.webp`
- Create: `frontend/public/model-art/ownapi.webp`
- Modify: `frontend/src/data/modelCatalog.ts`

**Interfaces:**
- Produces: stable public paths under `/model-art/` consumed by `ModelCatalogEntry.artwork`.

- [ ] **Step 1: Generate one landscape raster asset per family with built-in ImageGen**

Use the shared art direction from the spec: neutral editorial technical composition, one restrained accent, centered subject, no text, no logo, no watermark, and no copied reference composition.

- [ ] **Step 2: Inspect every asset for subject, crop safety, text artifacts, and visual consistency**

Reject or regenerate any asset containing provider marks, legible text, watermarks, or an unusable crop.

- [ ] **Step 3: Copy selected outputs into `frontend/public/model-art/` and map family metadata to those paths**

- [ ] **Step 4: Verify every referenced path resolves locally**

Run: `for file in frontend/public/model-art/*.webp; do test -s "$file" || exit 1; done`

- [ ] **Step 5: Commit artwork and mappings**

```bash
git add frontend/public/model-art frontend/src/data/modelCatalog.ts
git commit -m "feat: add model family artwork"
```

---

### Task 3: Shared public-site shell

**Files:**
- Create: `frontend/src/components/public/PublicSiteHeader.vue`
- Create: `frontend/src/components/public/PublicSiteFooter.vue`
- Create: `frontend/src/components/public/PublicSiteLayout.vue`
- Modify: `frontend/src/views/HomeView.vue`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`

**Interfaces:**
- Produces: `<PublicSiteLayout>` with default slot and optional `flush` prop; `<PublicSiteHeader>` with public nav and authentication-aware actions; `<PublicSiteFooter>` with product and resource links.
- Consumes: `useAuthStore`, `useAppStore`, `useI18n`, and existing `Icon` component.

- [ ] **Step 1: Add locale-parity assertions for shared public navigation labels**

Extend `frontend/src/i18n/__tests__/homeLocales.spec.ts` to assert both locales contain `home`, `models`, `docs`, `login`, language names, and footer groups.

- [ ] **Step 2: Run locale tests and verify new assertions fail**

Run: `cd frontend && pnpm vitest run src/i18n/__tests__/homeLocales.spec.ts`

- [ ] **Step 3: Extract the approved homepage header and footer into focused public components**

Preserve the desktop navigation, mobile menu, locale switcher, OwnAPI naming, login/dashboard action behavior, keyboard focus, and existing custom-home override.

- [ ] **Step 4: Wrap the standard homepage content with the public layout without changing the approved hero and story sections**

- [ ] **Step 5: Add English and Chinese strings and run the locale tests**

Run: `cd frontend && pnpm vitest run src/i18n/__tests__/homeLocales.spec.ts`

- [ ] **Step 6: Commit the shell refactor**

```bash
git add frontend/src/components/public frontend/src/views/HomeView.vue frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts frontend/src/i18n/__tests__/homeLocales.spec.ts
git commit -m "refactor: share public site shell"
```

---

### Task 4: Public Models catalog and detail routes

**Files:**
- Create: `frontend/src/views/public/ModelsCatalogView.vue`
- Create: `frontend/src/views/public/ModelDetailView.vue`
- Create: `frontend/src/components/models/ModelCodeExamples.vue`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/router/__tests__/guards.spec.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`

**Interfaces:**
- Consumes: catalog helpers from Task 1, artwork from Task 2, `modelDisplayAPI.getModelDisplayConfig()`, `PublicSiteLayout`, existing `PlatformIcon`, router params, auth store, and i18n.
- Produces: public `/models` and `/models/:modelId` pages with search, filters, sorting, model details, code tabs, and clipboard feedback.

- [ ] **Step 1: Add router guard tests for public model routes**

```ts
it.each(['/models', '/models/gpt-5-4'])('allows unauthenticated access to %s', (path) => {
  expect(simulateGuard(path, { requiresAuth: false }, unauthenticatedState)).toBeNull()
})
```

- [ ] **Step 2: Run router tests and verify the model detail route is missing or protected**

Run: `cd frontend && pnpm vitest run src/router/__tests__/guards.spec.ts`

- [ ] **Step 3: Implement the public catalog view**

Build the Vercel-inspired header, search field, desktop filter rail, mobile filter disclosure, result count, sorting control, spacious card grid, loading state, curated-fallback notice, no-results state, and reserved growth card.

- [ ] **Step 4: Implement the detail page and code-example component**

Support Python, TypeScript, and cURL tabs, model-ID copy, responsive artwork, live pricing, auth-aware primary action, related models, and a recoverable unknown-model state.

- [ ] **Step 5: Make both routes public and add localized copy**

Point `/models` to `ModelsCatalogView.vue`, add `/models/:modelId`, and set `requiresAuth: false` on both.

- [ ] **Step 6: Run router, locale, and catalog tests**

Run: `cd frontend && pnpm vitest run src/router/__tests__/guards.spec.ts src/i18n/__tests__/homeLocales.spec.ts src/data/__tests__/modelCatalog.spec.ts`

- [ ] **Step 7: Commit Models pages**

```bash
git add frontend/src/views/public/ModelsCatalogView.vue frontend/src/views/public/ModelDetailView.vue frontend/src/components/models/ModelCodeExamples.vue frontend/src/router/index.ts frontend/src/router/__tests__/guards.spec.ts frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts
git commit -m "feat: build public model catalog"
```

---

### Task 5: Functional public Docs page

**Files:**
- Create: `frontend/src/data/docsContent.ts`
- Create: `frontend/src/components/docs/DocsCodeExamples.vue`
- Create: `frontend/src/views/public/DocsView.vue`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/router/__tests__/guards.spec.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`

**Interfaces:**
- Produces: `docsNavigation`, `docsOnThisPage`, code examples, and a public `/docs` page.
- Consumes: `PublicSiteLayout`, auth store, i18n, router links, and clipboard API.

- [ ] **Step 1: Add a router test proving unauthenticated visitors can open `/docs`**

```ts
it('allows unauthenticated access to public docs', () => {
  expect(simulateGuard('/docs', { requiresAuth: false }, unauthenticatedState)).toBeNull()
})
```

- [ ] **Step 2: Run the router test and verify it fails against the protected route**

Run: `cd frontend && pnpm vitest run src/router/__tests__/guards.spec.ts`

- [ ] **Step 3: Implement structured Docs content and code examples**

Define grouped navigation and stable section IDs. Provide Python, TypeScript, and cURL examples using `https://ownapi.dev/v1`, environment-based API keys, and a known curated model ID.

- [ ] **Step 4: Implement the responsive three-column documentation layout**

Include sticky desktop navigation, mobile navigation disclosure, page intro, entry cards, model-type cards, Quick Start, copyable code tabs, troubleshooting/resources, and `On this page` anchors.

- [ ] **Step 5: Replace the protected route with the public Docs view and add bilingual copy**

- [ ] **Step 6: Run router and locale tests**

Run: `cd frontend && pnpm vitest run src/router/__tests__/guards.spec.ts src/i18n/__tests__/homeLocales.spec.ts`

- [ ] **Step 7: Commit Docs page**

```bash
git add frontend/src/data/docsContent.ts frontend/src/components/docs/DocsCodeExamples.vue frontend/src/views/public/DocsView.vue frontend/src/router/index.ts frontend/src/router/__tests__/guards.spec.ts frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts
git commit -m "feat: build public documentation experience"
```

---

### Task 6: Automated integration checks

**Files:**
- Modify as required by failures only: files created or modified in Tasks 1–5.

**Interfaces:**
- Validates all outputs from Tasks 1–5.

- [ ] **Step 1: Run targeted tests**

Run: `cd frontend && pnpm vitest run src/data/__tests__/modelCatalog.spec.ts src/router/__tests__/guards.spec.ts src/router/__tests__/title.spec.ts src/i18n/__tests__/defaultLocale.spec.ts src/i18n/__tests__/homeLocales.spec.ts src/utils/__tests__/homeCodeExample.spec.ts`

- [ ] **Step 2: Run Vue type checking**

Run: `cd frontend && pnpm vue-tsc --noEmit`

- [ ] **Step 3: Run ESLint on all changed TypeScript and Vue files**

Run: `cd frontend && pnpm eslint src/components/public src/components/models src/components/docs src/data/modelCatalog.ts src/data/docsContent.ts src/views/HomeView.vue src/views/public/ModelsCatalogView.vue src/views/public/ModelDetailView.vue src/views/public/DocsView.vue src/router/index.ts`

- [ ] **Step 4: Run the production build**

Run: `cd frontend && pnpm build`

- [ ] **Step 5: Check patch integrity**

Run: `git diff --check`

---

### Task 7: Browser and visual QA

**Files:**
- Modify: `design-qa.md`
- Create: `.codex-qa/models-reference-desktop.png`
- Create: `.codex-qa/models-ownapi-desktop.png`
- Create: `.codex-qa/models-comparison-desktop.png`
- Create: `.codex-qa/models-ownapi-mobile.png`
- Create: `.codex-qa/docs-reference-desktop.png`
- Create: `.codex-qa/docs-ownapi-desktop.png`
- Create: `.codex-qa/docs-comparison-desktop.png`
- Create: `.codex-qa/docs-ownapi-mobile.png`

**Interfaces:**
- Validates the user-visible result from Tasks 1–6.

- [ ] **Step 1: Start or reuse the local development server and open `/models` publicly**

Verify search, provider filter, capability filter, sorting, clear filters, model-card navigation, model-ID copy, code-language tabs, related-model navigation, login/dashboard CTA behavior, and fallback/unknown-model states.

- [ ] **Step 2: Open `/docs` publicly**

Verify desktop navigation, mobile disclosure, anchor links, entry links, code tabs, copy button, and authentication-aware actions.

- [ ] **Step 3: Capture reference and OwnAPI screenshots at matching desktop viewports and combine each pair for comparison**

- [ ] **Step 4: Capture OwnAPI screenshots at `390 × 844` and fix P0/P1/P2 responsive issues**

- [ ] **Step 5: Inspect browser console and terminal**

Confirm there are no 404, dynamic-import, Vue compile, syntax, or router errors. Record unrelated backend-offline messages separately.

- [ ] **Step 6: Update `design-qa.md` with evidence and final result**

The report must end with `final result: passed` before handoff.

- [ ] **Step 7: Keep `/models` open as the deliverable preview**

