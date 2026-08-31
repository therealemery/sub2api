# OwnAPI Home Page Design QA

## Comparison Target

- Source visual truth: `.codex-qa/vercel-desktop.png` and `.codex-qa/vercel-mobile.png`
- Implementation: `http://127.0.0.1:3000/home`
- Implementation captures: `.codex-qa/ownapi-desktop.png` and `.codex-qa/ownapi-mobile-final.png`
- Side-by-side evidence: `.codex-qa/comparison-desktop.png` and `.codex-qa/comparison-mobile-final.png`
- Desktop viewport and pixels: 1440 × 900 CSS px, 1440 × 900 captured pixels, 1× normalized comparison
- Mobile viewport and pixels: 390 × 844 CSS px, 390 × 844 captured pixels, 1× normalized comparison
- State: public home page, English, light theme, mobile menu closed

## Full-view Comparison Evidence

The desktop comparison confirms the intended structural match: compact sticky header, centered announcement row, unusually spacious three-part hero, large tightly tracked headline, restrained black and outlined CTAs, and a thin-border strip entering at the fold. OwnAPI uses its own logo, provider assets, product claims, links, and gateway visual instead of Vercel trademarks, customer marks, or proprietary Canvas artwork.

The mobile comparison confirms the reference rhythm: logo/menu header, centered announcement, visual mark, centered multiline headline, short outcome line, two full-width pill CTAs, and the next content strip entering at the bottom of the 390 × 844 viewport.

## Focused-region Comparison Evidence

- Header: matching compact height, edge alignment, sparse navigation, bordered secondary action, and black primary action.
- Hero: matching oversized neutral typography, generous whitespace, centered mobile layout, and black/white CTA hierarchy.
- Product storytelling: source alternates oversized headings with bordered product demonstrations; OwnAPI uses the same pattern with a real SDK example, integration path, and audience grid.
- Lower page: source bordered product cards and dense directory footer are reflected in the OwnAPI capability grid, FAQ rows, conversion area, and compact footer.

## Required Fidelity Surfaces

- Fonts and typography: Geist-first local stack with system fallbacks; display sizes, tight tracking, moderate weight, and short UI labels match the reference hierarchy. No Vercel font asset is hotlinked.
- Spacing and layout rhythm: desktop whitespace, asymmetric hero, large section gaps, bordered stages, and mobile stacking are consistent with the reference. OwnAPI is intentionally longer because approved FAQ and agent-program content remain.
- Colors and visual tokens: off-white page, near-black text, neutral gray secondary text, one-pixel borders, black primary actions, and white surfaces match the source palette. OwnAPI orange appears only in the supplied brand mark.
- Image quality and asset fidelity: all visible provider and OwnAPI marks use existing project assets. No placeholder, copied Vercel image, customer logo, handmade SVG, or hotlinked asset is present.
- Copy and content: every product claim, route, CTA, model label, FAQ, and agent-program message belongs to OwnAPI and is available in English and Chinese.

## Findings

No actionable P0, P1, or P2 findings remain.

- P3: the OwnAPI gateway motif is sharper and more geometric than Vercel's blurred Canvas field. This is an intentional product/asset substitution required by the approved scope and does not alter the composition.
- P3: the OwnAPI page continues below the reference page's approximate length because it retains the approved FAQ and agent-program sections.

## Interaction and Runtime Checks

- Desktop and mobile render without page-level horizontal overflow.
- Mobile menu opens and closes with accessible labels and expanded state.
- English/Chinese switching works; locale state persists through reload.
- Code-copy control changes to its success state.
- Native FAQ rows expand correctly.
- Document title resolves to `Home - OwnAPI` and legacy `Sub2API` is absent from the rendered home page.
- Browser logs contain no 404, dynamic-import, Vue compilation, unresolved-component, syntax, or router errors.
- A public-settings request reports the existing backend-unavailable error in frontend-only local development; the page uses defaults and remains fully rendered.

## Comparison History

1. Initial mobile comparison found a P2 fold mismatch: the taller OwnAPI hero pushed the second CTA below the 844 px viewport.
2. Reduced mobile announcement/hero height, removed the duplicate mobile eyebrow and supporting paragraph, tightened headline scale, and reduced visual spacing.
3. Recaptured at 390 × 844. Both CTAs and the start of the model strip now appear in the first viewport, with no horizontal overflow.

## Implementation Checklist

- [x] Vercel-inspired desktop structure and rhythm
- [x] OwnAPI-specific content and assets
- [x] Responsive mobile navigation and hero
- [x] English and Chinese locale coverage
- [x] Existing routes, auth behavior, code copy, FAQ, and contact actions
- [x] Desktop/mobile browser comparison and runtime inspection

final result: passed
