# OwnAPI Public Models and Docs Redesign

## Goal

Turn `/models` and `/docs` into public, functional product pages that share the Vercel-inspired visual language established by the new OwnAPI homepage. Use CometAPI's model catalog and documentation site as functional references without copying their branding, prose, or visual assets.

## Success Criteria

- Visitors can browse `/models`, open model details, and read `/docs` without signing in.
- The pages visually belong to the same product as `/home`: black-and-white palette, restrained borders, strong typography, generous whitespace, and minimal motion.
- Model pricing continues to come from the existing model-display API when available.
- The catalog remains useful when the backend is unavailable by falling back to a curated initial model set.
- New models can be added through data rather than layout changes.
- English remains the default locale and Chinese remains available.
- Desktop and mobile layouts are usable and free of router, dynamic-import, Vue compile, and 404 errors.

## Route and Layout Architecture

Add a public product shell shared by the marketing-facing pages. It provides the OwnAPI wordmark, primary navigation, language switcher, authentication-aware actions, mobile navigation, and footer.

Public routes:

- `/home` — existing public homepage.
- `/models` — searchable model catalog.
- `/models/:modelId` — model detail page.
- `/docs` — documentation landing and quick-start page.

The model and documentation routes use `requiresAuth: false`. Actions that expose account data or mutate account state, including API-key creation, usage history, purchases, and dashboards, continue to require authentication and route unauthenticated visitors to login.

The existing authenticated workspace remains unchanged for dashboard and administration routes.

## Model Data

Create a small catalog layer that combines two sources:

1. Existing model-display API data supplies configured model IDs, platforms, featured status, and live pricing.
2. Curated family metadata supplies human-readable descriptions, capabilities, modality, family artwork, documentation hints, and related-model logic.

The merge key is the normalized model ID and platform. Unknown backend models inherit provider-level metadata and a neutral OwnAPI fallback image. If the model-display request fails or returns no models, the page displays a curated initial catalog so the public route never collapses into an empty or error-only screen.

Initial family coverage:

- GPT / OpenAI
- Claude / Anthropic
- Gemini / Google
- DeepSeek
- Grok / xAI
- Qwen
- GLM / Z.AI
- Kimi / Moonshot

The data model should include stable slug, model ID, display name, provider, family, modality, capabilities, summary, long description, image path, badges, context information when known, price information, and related model IDs.

## Generated Model Artwork

Generate one original raster artwork for each supported model family plus one OwnAPI fallback. The artwork should feel compatible with the restrained Vercel-inspired UI while giving each family a distinct abstract technical metaphor.

Shared art direction:

- Editorial abstract 3D or photographic-tech composition.
- Predominantly neutral background with one restrained family-specific accent.
- No provider logo, trademark, model name, text, watermark, UI screenshot, or copied source composition.
- Landscape crop suitable for catalog cards and a larger detail-page hero.
- Important subject matter remains centered enough to tolerate responsive cropping.

Family artwork is reused by model versions within that family. This prevents newly configured versions from requiring a new asset while keeping the image semantically related.

## Models Catalog

### Header

Use a spacious centered introduction with a compact eyebrow, large title, supporting copy, prominent search input, and small proof chips. It should echo the homepage's typography and whitespace rather than CometAPI's color treatment.

### Controls

Provide:

- Search by model ID, display name, provider, or capability.
- Provider filter.
- Capability or modality filter.
- Sorting by featured, name, and lowest available input price.
- A result count and a clear-filters action.

On desktop, filters sit in a narrow left rail and catalog results use the remaining width. On mobile, filters collapse into an accessible drawer or disclosure above the results.

### Cards

Use a responsive three-column grid with intentionally generous gaps and a final empty-state/additional-capacity treatment so future growth feels planned. Each card includes family image, provider mark from existing local assets, category, display name, model ID, two or three capability tags, short description, starting price, and a `View model` affordance.

Cards link to the detail route and remain keyboard accessible. Loading, empty, and API-error states preserve the overall layout.

## Model Detail Page

The detail page includes:

- Breadcrumb back to the catalog.
- Large family artwork and model identity block.
- Provider, capability, modality, and availability metadata.
- Description and best-use-case content.
- Current configured pricing, with official comparison only when reliable data exists.
- Copyable model ID.
- OpenAI-compatible examples in Python, TypeScript, and cURL tabs.
- Authentication-aware primary action: create a key when signed in, otherwise get started.
- Related models from the same provider or family.

Unknown but configured model IDs should still resolve through provider/fallback metadata rather than return a broken page. Truly unknown URLs display a useful not-found state with a route back to `/models`.

## Documentation Page

### Information Architecture

Desktop uses three columns:

- Left: sticky grouped documentation navigation.
- Center: readable documentation content.
- Right: sticky `On this page` anchors.

Mobile uses a compact header and collapsible documentation navigation; the right-side anchor list becomes an inline disclosure.

### Content

The first implementation contains:

- Documentation introduction.
- Quick Start, Model List, and API Dashboard entry cards.
- Model-type overview.
- `Start in minutes` OpenAI-compatible example.
- Python, TypeScript, and cURL tabs with copy buttons.
- Base URL and API-key configuration guidance.
- Error handling, retries, rate limits, and common troubleshooting entry points.
- Integration and resource cards.

Documentation content is represented by structured local data rather than a collection of unrelated promotional cards. Navigation and headings share stable IDs to support anchors and future expansion.

## Internationalization

All visible Models and Docs interface text is added to the existing English and Chinese locale files. English remains the default. Model IDs, API fields, and code stay untranslated; descriptive content receives English and Chinese variants.

## Accessibility and Interaction

- Use semantic navigation, headings, forms, labels, buttons, and links.
- Preserve visible focus states.
- Announce search result counts and copy success where practical.
- Drawers, disclosures, and tabs expose correct expanded/selected state.
- Respect reduced-motion preferences.
- Do not use animation as the only indication of state.

## Error Handling

- Model API failure: show curated catalog and a quiet freshness notice instead of a blocking error.
- Missing price: label as unavailable rather than invent a number.
- Unknown model detail: show a local not-found state with search/catalog recovery.
- Clipboard failure: keep code selectable and show an inline failure message.

## Testing and Verification

- Unit tests for model normalization, family matching, filtering, sorting, and fallback catalog behavior.
- Router tests proving `/models`, `/models/:modelId`, and `/docs` are public while account actions remain protected.
- Locale parity tests for new English and Chinese keys.
- Vue type checking, ESLint, targeted Vitest tests, production build, and `git diff --check`.
- Browser verification at desktop and `390 × 844` for catalog, filter states, model detail, docs navigation, code tabs, copy actions, and language switching.
- Inspect browser console and terminal for 404, dynamic-import, Vue compile, syntax, and router errors.
- Capture reference and local screenshots at matching viewports, create comparison images, and record the final result in `design-qa.md`.

## Out of Scope

- A full Markdown/MDX documentation engine or documentation CMS.
- Editing model catalog content through the admin UI.
- Generating unique artwork for every individual model version.
- Replacing the authenticated dashboard or admin layouts.
- Copying CometAPI text, logos, artwork, or proprietary page assets.

