# Home Page Content Expansion Design

## Goal

Turn the standard Sub2API home page into a complete developer-focused acquisition page. A first-time visitor should understand what the service provides, how to integrate it, where to verify pricing and status, and which action to take next without relying on unsupported claims.

## Constraints

- Keep the existing visual language and avoid a visual redesign or new motion system.
- Keep all new content bilingual through the existing English and Chinese locale files.
- Reuse existing routes and capabilities instead of adding backend work.
- Do not publish invented uptime, latency, customer-count, savings, trial-credit, or testimonial claims.
- Preserve configured custom-home-content modes without injecting the standard landing content into them.

## Information Architecture

The standard page will use this order:

1. Header navigation
2. Developer-focused hero with integration sample
3. Verifiable trust capabilities
4. Primary model overview and pricing entry
5. Product advantages
6. Four-step integration flow
7. Audience-specific use cases
8. High-volume business offer
9. Frequently asked questions
10. Secondary agent recruitment offer
11. Final conversion call to action
12. Expanded footer

## Sections

### Header

- Add `Models`, `Docs`, and `Status` links.
- Keep the locale switcher and authentication action.
- Remove agent recruitment from the primary navigation and expose it later in the page and footer.
- Route links to existing project destinations. Routes that require authentication may use the existing router redirect behavior.

### Hero

- Use one clear promise: one API for reliable ChatGPT and Claude access.
- Support the promise with `OpenAI compatible`, `pay as you go`, and `no silent model substitutions` signals.
- Use `Get API Key` as the primary action and `View Pricing` as the secondary action.
- Show a concise Python OpenAI SDK request using a deployment-aware `/v1` base URL.
- Provide a copy button with localized idle and success states.
- Do not promise signup credit or no-credit-card onboarding unless the backend exposes a reliable public setting for it.

### Trust And Models

- Replace purely promotional trust claims with capabilities users can inspect: OpenAI-compatible requests, traceable usage details, and transparent model handling.
- Link to the existing documentation, model pricing, and channel status routes.
- Keep ChatGPT and Claude as the primary models and explain their strongest common use cases.
- Do not hard-code price values on the home page; direct users to the maintained pricing page.

### Integration Flow And Use Cases

- Explain four steps: create an account, create an API key, replace the base URL, and monitor usage while scaling.
- Describe three target audiences: individual developers and coding tools, teams and internal automation, and API tool providers.
- Write outcome-based copy instead of feature-only labels.

### Business, FAQ, And Final CTA

- Keep the existing high-volume business offer but rename its action to `Contact Sales` and retain the current email-copy behavior.
- Keep agent recruitment after the main product path so it does not compete with the primary purchase decision.
- Add native disclosure-based FAQ items for protocol support, billing, balances, model substitutions, failed-request charging, data handling, and support. Answers must reflect repository-supported behavior and avoid unsupported legal guarantees.
- Repeat the primary API-key and pricing actions at the end of the page, with a separate enterprise contact action.

### Footer

- Add links for models, documentation, channel status, support/contact, agent recruitment, privacy, and terms when destinations exist.
- Keep GitHub and copyright information.
- Use existing legal routes for privacy and terms only when the corresponding identifiers are available; otherwise omit the links rather than creating broken destinations.

## Components And Data

- Keep `HomeView.vue` as the composition point.
- Extract the code example and FAQ data into local computed values or constants when that keeps the template readable; do not create a new abstraction for one-off static sections.
- Derive the example API base URL from `window.location.origin` and append `/v1`.
- Reuse the existing clipboard fallback and create independent copied states for the code sample and contact email.
- Use the existing site name, logo, subtitle, documentation URL, contact information, authentication state, and public settings.

## Error Handling

- If clipboard access fails, use the existing textarea fallback.
- If optional configured URLs or legal destinations are absent, hide their links.
- If public settings fail to load, use current branding and contact fallbacks.
- Static explanatory content remains usable without the backend; authenticated destinations may continue to redirect through existing router behavior.

## Responsive And Accessibility Requirements

- Preserve a visible language control and primary account action at mobile widths.
- Avoid horizontal overflow in the hero code sample and expanded navigation.
- Use semantic headings, sections, lists, code, buttons, links, and native `details`/`summary` FAQ controls.
- Localize visible copy, button state text, section labels, and accessible names.
- Ensure copy feedback is visible in button text; no motion-dependent communication.

## Verification

- Extend locale-contract tests for every new English and Chinese key.
- Add a unit test for deployment-aware code-example construction; verify clipboard success state in the local browser.
- Run targeted Vitest tests, Vue TypeScript checking, ESLint, and whitespace checks.
- Verify the English default, Chinese switch, copy control, FAQ expansion, destination links, and desktop/mobile reflow in the local browser.
- Treat unrelated existing full-suite failures as baseline findings and report them separately.

## Out Of Scope

- Backend endpoints or authentication changes.
- New pricing, status, enterprise, legal, or documentation pages.
- Dynamic uptime, latency, savings, user-count, or price metrics.
- Invented testimonials, customer logos, or trial-credit promises.
- Visual restyling, animation redesign, or CometAPI cloning.
