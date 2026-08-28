# OwnAPI Vercel-Inspired Home Page Design

Date: 2026-08-28

## Objective

Rebuild `frontend/src/views/HomeView.vue` so the public OwnAPI home page follows the current Vercel home page's layout rhythm and visual language as closely as practical, while keeping OwnAPI's identity, product claims, working routes, localization, and existing application behavior.

This is a visual recreation and content replacement, not a byte-for-byte clone. Vercel trademarks, customer logos, screenshots, illustrations, copy, and proprietary product demonstrations will not be reused.

## Source Evidence

Reference page: `https://vercel.com/?utm_source=chatgpt.com`

The reference was inspected at 1440 × 900 and 390 × 844. Its relevant visible characteristics are:

- Geist Sans on an off-white page (`#fafafa`) with near-black text.
- A compact sticky header with a minimal brand mark, restrained navigation, outlined secondary actions, and a black primary action.
- A very spacious hero with asymmetrical desktop composition and centered mobile composition.
- Large, tightly tracked display headings and short supporting copy.
- Thin gray borders, mostly square or subtly rounded containers, and low-decoration surfaces.
- Full-width feature stories that alternate between oversized headings, product demonstrations, short proof statements, and compact feature lists.
- A bordered product/card grid near the bottom, followed by a centered final CTA and a dense directory footer.
- A full-screen mobile navigation opened by a menu button.

No public repository containing the current Vercel marketing home page implementation was identified. The `vercel/vercel` public repository contains platform and CLI code, not the marketing page. Runtime DOM, computed styles, responsive screenshots, and interaction states are therefore the source of truth.

## Complexity and Mode

- Complexity: L3, content-oriented Vue marketing page with responsive interaction.
- Mode: high-fidelity visual recreation with complete OwnAPI content replacement.
- Expected fidelity: high for layout, spacing, typography hierarchy, borders, navigation behavior, responsive stacking, and page rhythm.
- Explicit exclusions: Vercel Canvas effects, proprietary demos, customer case-study images, Vercel logos, copied customer logos, and unrelated Vercel routes.

## Design DNA

### Design system

- Page background: `#fafafa`.
- Primary surface: `#ffffff`.
- Primary text: approximately `#171717`.
- Secondary text: neutral gray in the `#666` range.
- Borders: approximately `#e5e5e5`, one CSS pixel.
- Primary button: near-black background with white text.
- Secondary button: white or transparent surface with a gray border.
- Radius: restrained; pills only for CTA buttons and small status labels.
- Typography: use the project's available sans-serif stack, preferring Geist when locally available and falling back to Inter/system sans-serif without hotlinking Vercel font assets.
- Motion: brief opacity, border, and transform transitions only; respect `prefers-reduced-motion`.

### Design style

- Editorial SaaS layout with unusually generous whitespace.
- Strong left/right asymmetry on desktop, centered composition on mobile.
- Borders and grid lines provide structure instead of shadows or colored panels.
- Color is used sparingly for OwnAPI model/provider marks and status accents.
- OwnAPI branding remains visible in the header, hero, final CTA, and footer.

### Visual effects

- Lightweight CSS only.
- Hero network visual may use existing icon assets, borders, gradients, and simple transforms.
- No Canvas, WebGL, copied illustrations, handmade SVG substitutes, or hotlinked assets.

## Information Architecture

### 1. Header

- OwnAPI logo and wordmark link to `/home`.
- Desktop navigation: Models, Docs, Status, and language switcher.
- Authentication actions: Login or Dashboard as currently supported.
- Mobile: OwnAPI mark plus menu toggle. The menu opens as a full-width panel containing navigation, language selection, and account action.
- Existing routes remain unchanged.

### 2. Announcement strip

- A short OwnAPI-specific statement about unified model access.
- One inline link to the usage guide or model catalog.
- Hidden only when space is too constrained; no carousel or remote data.

### 3. Hero

Desktop composition mirrors the reference's three-part balance:

- Left: large two-line OwnAPI proposition.
- Center: a restrained visual representation of one gateway connecting to supported model providers, built from existing provider assets and CSS layout.
- Right: three short product outcomes: compatible access, transparent billing, and visible routing/model behavior.

The primary actions remain Get API Key/Dashboard and View Pricing. On mobile, the hero becomes centered, the outcomes reduce to one concise supporting line, and the actions become full-width.

### 4. Provider proof strip

- Replace Vercel's customer-logo strip with supported model/provider marks already present in the project.
- Display ChatGPT and Claude as available primary models.
- Display additional provider names only as upcoming when that matches existing copy.
- Do not imply customer endorsement or unsupported availability.

### 5. Three feature stories

Each story uses an oversized heading, a bordered demonstration panel, a short proof statement, and a compact feature list.

1. **One API for leading models**
   - Demonstration: the existing Python/OpenAI SDK example.
   - Proof: familiar SDK usage with a deployment-aware base URL.
   - Features: OpenAI-compatible requests, one API key, visible model selection, transparent usage.

2. **Scale from first request to production traffic**
   - Demonstration: a neutral usage/route dashboard composition made from existing UI primitives and factual labels.
   - Proof: routing and quota capabilities already described by the product.
   - Features: account pools, quota controls, usage records, channel status.

3. **Operate for individuals, teams, and API tools**
   - Demonstration: three audience columns using existing icons.
   - Proof: centralized credentials, usage visibility, and business-volume support.
   - Features: developer workflows, team automation, API tool providers, enterprise contact.

### 6. Product grid

- Replace “Recently shipped” with an OwnAPI capability grid.
- Cards: ChatGPT, Claude, API Gateway, Usage Visibility, Channel Status, and Business Volume Plans.
- Cards link only to existing meaningful routes or actions.
- Use existing provider images and icon library; no Vercel assets.

### 7. FAQ

- Keep the existing factual FAQ content.
- Present it within the reference site's thin-border grid rhythm.
- Use native `details`/`summary` for accessibility and keyboard behavior.

### 8. Agent program

- Keep the existing agent-program content after the primary product narrative.
- Render it as a restrained bordered feature row rather than a visually dominant campaign panel.
- Preserve the `/agent-recruitment` route and existing commission wording.

### 9. Final CTA and footer

- Large centered final heading with Get API Key/Dashboard, View Pricing, and Contact Sales.
- Footer uses compact multi-column directory styling similar to the reference.
- Include only existing OwnAPI routes and contact links.

## Component and Code Boundaries

The task remains inside the existing Vue application.

- `HomeView.vue` owns page composition and page-specific responsive styles.
- Locale files own all visible English and Chinese content.
- `LocaleSwitcher.vue`, the existing icon component, provider assets, auth store, app store, and `homeCodeExample.ts` are reused.
- If `HomeView.vue` becomes materially harder to maintain, extract only page-local presentational components with clear props; do not introduce a new design system or application-wide refactor.
- No new API calls, dependencies, routes, authentication flows, or backend changes.

## Data and Interaction Behavior

- Site name resolves to OwnAPI when a legacy `Sub2API` setting is returned.
- Existing custom `home_content` iframe/HTML override behavior remains intact.
- Primary authenticated/unauthenticated routing remains unchanged.
- Code copy and contact-email copy retain their existing fallback behavior.
- Locale defaults to English and persists the user's English/Chinese selection.
- Mobile menu supports opening, closing, keyboard focus, and route selection.
- All navigation and CTA targets must resolve to existing application routes or valid external/contact URLs.

## Responsive Behavior

### Desktop, 1200 px and above

- Header uses a single horizontal row.
- Hero uses a three-part asymmetric grid.
- Feature demonstrations use wide split layouts.
- Capability and footer directories use multiple columns.

### Tablet, 768–1199 px

- Hero reduces to two columns or a centered stack according to available width.
- Feature story copy and demonstrations stack without losing borders or visual hierarchy.
- Navigation may hide lower-priority links before switching to the mobile menu.

### Mobile, up to 767 px

- Header shows brand and menu button.
- Menu becomes a full-width panel.
- Hero is centered with full-width CTA buttons.
- Provider strip may horizontally scroll without page-level overflow.
- All feature stories and grids become one column.
- Footer columns wrap into a readable two-column or single-column directory.
- Target viewport 390 × 844 must have no horizontal page overflow.

## Accessibility

- Preserve semantic header, nav, main, section, heading, list, article, and footer elements.
- Mobile menu button exposes an accessible label and expanded state.
- Decorative provider/network elements are hidden from assistive technology where appropriate.
- Visible focus states remain present.
- Text and control contrast should meet WCAG AA.
- Motion is disabled or reduced for users who request reduced motion.

## Verification

### Automated

- Locale contract tests continue to pass.
- Default-locale tests continue to pass.
- Code-example tests continue to pass.
- Vue TypeScript check passes.
- ESLint passes for modified files.
- `git diff --check` passes.

### Browser

- Verify desktop at 1440 × 900 and mobile at 390 × 844.
- Verify English default, Chinese switching, and language persistence after reload.
- Verify mobile menu open/close and key navigation links.
- Verify code copy, FAQ expansion, authentication CTA routing, and contact action.
- Confirm no visible `Sub2API` branding remains on the home page.
- Confirm no page-level horizontal overflow.
- Compare source and local screenshots at matching viewports for layout rhythm, typography scale, borders, spacing, and responsive behavior.
- Check browser console for new errors.

## Acceptance Criteria

- The page is immediately recognizable as following the current Vercel home page's structural and visual language.
- All visible branding and product messaging belongs to OwnAPI.
- Existing OwnAPI behavior and localization continue to work.
- No Vercel trademark, customer logo, screenshot, proprietary illustration, tracking code, or copied marketing copy is shipped.
- Desktop and mobile browser checks pass with no new blocking visual or interaction defects.
