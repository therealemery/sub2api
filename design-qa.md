# Video reference-media QA — 2026-09-16

## Production evidence

- Wan 3 and Wan 3 Prime both completed with reference image plus reference video.
- MiniMax H3 completed with a public HTTPS reference image and with a local PNG multipart upload.
  The local PNG task is Usage `3325`; it charged `$0.2798507465` and returned a valid
  1,055,082-byte MP4.
- MiniMax H3 failed with both a public reference-video URL and a local MP4 multipart upload. The
  local file was a valid 2.000-second H.264 MP4 at 854×480 and 30 fps. DC-API fetched the entire
  staged OwnAPI URL with HTTP 200, then returned terminal failure. No usage row or balance deduction
  was created for that failed request.

## Diagnosis and product correction

- DC-API's current frontend declares `reference_videos` compatible with both `{url}[]` and
  `String[]`; changing between those shapes is not an evidence-based fix.
- MiniMax's official H3 V2 API supports reference video, but DC-API's legacy `/v1/videos` adapter
  does not currently translate or execute that path successfully.
- OwnAPI now rejects H3 reference-video inputs before staging or contacting the upstream, returns a
  clear 400 response, hides the H3 reference-video controls, and removes the unsupported field from
  examples. Wan reference-video inputs remain available.

## Verification

- Backend handler, service, and routes packages passed.
- Frontend: 115 test files / 699 tests, Vue type checking, focused ESLint, and the production build
  passed. Only the repository's existing Browserslist, mixed-import, and chunk-size warnings remain.
- CI run `35045539349` passed. Deploy run `35045875650` installed
  `ownapi:d47d5d147c2c`; `/health` returned 200 and an invalid input token returned 404.
- No paid request was submitted while verifying the fail-closed correction.

final result: verified supported paths and safely disabled the failing H3 reference-video path

# Conditional Text Pricing QA — 2026-09-15

## Local browser evidence

- Local frontend and backend were running at `http://127.0.0.1:3000` and
  `http://127.0.0.1:8080`; backend `/health` returned `{"status":"ok"}`.
- At 1440 × 900, `/models` rendered 42 models across nine nonempty providers.
  `/models/deepseek-v4-1-flash` showed the structured weekday peak windows and `2×`
  multiplier without publishing DeepSeek Pro or any private Packy account, host, or alias.
- `/models/gpt-6-astra` showed the long-context tier as input tokens strictly greater than
  272,000. Both detail pages had no page-level horizontal overflow.
- At 390 × 844, the DeepSeek page retained the complete peak-pricing disclosure without
  horizontal overflow. The removed `gemini-3-pro-preview` route rendered the public model 404.
- SPA navigation `/models` → `/docs` → `/models` completed without a reload, empty content,
  or blank-route state.
- `/api/v1/settings/model-display` returned only the sanitized provider-neutral rule projection:
  canonical OwnAPI model, Asia/Shanghai schedule, weekdays, windows, customer multiplier, and
  bilingual names. It exposed no Packy identity, upstream cost multiplier, private alias, host,
  account, or credential.
- Authenticated `/usage` and admin usage required a local login, so their `1×`/`2×`, audit
  timestamp, rule label, and export behavior were verified by component tests rather than by
  modifying the local database or using production credentials.

final result: passed

## Production Video Reference-Media QA — 2026-09-15

- Explicitly authorized lowest-cost paid tests used one reference image and one reference video on
  both Wan models at 480P / two seconds. Both tasks completed and their customer content endpoints
  returned valid MP4 files (1,859,624 and 1,625,989 bytes).
- MiniMax H3 completed at 768p / five seconds with one public HTTPS reference image and returned a
  valid 1,255,566-byte MP4. The H3 public HTTPS reference-video request returned provider
  `service_unavailable`; combined image+video behaved the same. Local multipart PNG and MP4 inputs
  reached DC-API but returned upstream 400 before task creation.
- Successful customer usage IDs 3322–3324 charged `$0.4476203465` in total. Balance movement matched
  exactly. Failed H3 customer attempts created no usage row and deducted no balance.
- One sanitized provider-direct image diagnostic was accepted outside OwnAPI billing and may have
  used provider credit; it was not repeated and no private ID or credential was retained.

final result: Wan 3 and Wan 3 Prime passed image+video; H3 passed HTTPS image only and failed video/uploads

## Conditional Text Pricing Production QA — 2026-09-15

### Deployment and data evidence

- CI run `34937659145` passed all frontend, Go unit/integration, and lint jobs. Deploy run
  `34938306793` completed successfully for commit `71d0c624` and image `ownapi:71d0c624efff`.
- The container reports `running` and `healthy`; `/health`, `/home`, `/models`,
  `/models/deepseek-v4-1-flash`, `/models/gpt-6-astra`, and `/docs` all returned successfully from
  the production host.
- Migrations `142_add_usage_pricing_audit.sql` and
  `143_correct_text_pricing_and_packy_scopes.sql` each appear once in `schema_migrations`; their
  recorded checksums match the repository's trimmed embedded SQL.
- The three usage-audit columns exist. All 83 usage rows predating this deployment retain a neutral
  condition multiplier and null rule ID, so the rollout did not re-rate historical usage.
- DeepSeek Pro has no customer-price record. DeepSeek Flash has the reviewed 70-percent customer
  price. GPT-6 Astra has contiguous `(0,272000]` and `(272000,+inf]` tiers, so 272,000 remains short
  and 272,001 selects long.
- `Packy / Core` no longer maps the four Codex models. No `Packy / Codex` account exists, so those
  routes fail closed; the unique `Packy / DeepSeek Sale` account and its exact cost rule remain.

### Public disclosure and limits

- The public model-display response contains the provider-neutral DeepSeek weekday schedule,
  Beijing half-open windows, and customer multiplier. It contains no Packy name, private model alias,
  base URL, API key, account identifier, or account-cost field.
- No paid DeepSeek or Codex request was submitted. Browser automation could not access a reusable
  authenticated session because its Codex auth token was unavailable; post-deploy customer/admin
  Usage-page rendering was therefore not rechecked. DTO, component, export, and integration behavior
  remains covered by the passing CI suites.

final result: passed with the documented authenticated-browser limitation

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

## Public Models and Docs QA — 2026-08-31

### Evidence

- Models desktop: `.codex-qa/models-ownapi-desktop.png` at 1440 × 900.
- Models mobile: `.codex-qa/models-ownapi-mobile.png` at 390 × 844.
- Model detail desktop: `.codex-qa/model-detail-ownapi-desktop.png` at 1440 × 900.
- Docs desktop: `.codex-qa/docs-ownapi-desktop.png` at 1440 × 900.
- Docs mobile: `.codex-qa/docs-ownapi-mobile.png` at 390 × 844.
- State: frontend-only local development with curated catalog fallback because the backend was not running.

### Findings and fixes

- Fixed the public-header login label, which referenced the missing `common.login` translation instead of `home.login`.
- Fixed GPT family artwork resolution. GPT models now use `/model-art/gpt.jpg` while retaining `/brand/openai.svg` as the provider logo.
- No remaining horizontal overflow at either 1440 px or 390 px.
- No remaining broken model artwork, missing component, route, syntax, or dynamic-import errors.
- The only recurring browser error is the expected public-settings request failure while running without the backend; Models falls back to the curated catalog and all three public views remain usable.

### Interaction checks

- Models search, provider/capability filters, sort control, mobile filter affordance, card navigation, and fallback notice render and respond.
- Model detail has working model-ID copy, Python/TypeScript/cURL tabs, code copy, related-model links, and production-domain-derived API examples.
- Docs has working section navigation, quick links, Python/TypeScript/cURL tabs, code copy, responsive documentation navigation, and resource links.
- Mobile navigation opens and closes with correct expanded state.
- English/Chinese switching works and the Chinese selection persists after reload.
- Models, model detail, and Docs all render without horizontal overflow; model images have non-zero natural dimensions.

final result: passed
