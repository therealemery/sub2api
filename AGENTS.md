# OwnAPI / Sub2API Agent Handoff

## Purpose

This repository is being customized into the OwnAPI product. The active objective is to finish the public, Vercel-inspired website experience and deploy the verified result to the user's existing website. Do not depend on prior chat history; this file and the Git repository are the recovery sources.

## Non-Negotiable Working Rules

- Treat the real repository files and Git history as the only source of truth. Do not duplicate full source files in this document.
- Preserve all user changes and unrelated dirty-worktree changes. Never reset, discard, or overwrite them.
- Keep `/home`, `/models`, `/models/:modelId`, and `/docs` public. Account, key, usage, billing, dashboard, and admin routes remain protected.
- Keep the public visual language restrained and Vercel-inspired: black and white, clear hierarchy, borders, generous whitespace, minimal motion.
- English is the default locale; Chinese must remain available and locale choices must persist.
- Do not copy CometAPI branding, prose, logos, artwork, or proprietary assets.
- Update this file at each meaningful implementation, verification, commit, or deployment checkpoint.
- Do not record credentials or secret values here. Record only variable names and where they are configured.

## Current Repository State

- Canonical/main checkout: `/Users/owen/apizhongzhuan/sub2api`, branch `codex/public-models-docs`, HEAD `bd19ddda`. This checkout does **not** contain the completed pricing/status feature yet. Its known untracked artifacts are `.codex-qa/`, `.vite/`, and `frontend/pnpm-workspace.yaml`; preserve and inspect them rather than cleaning blindly.
- Active isolated feature worktree: `/Users/owen/apizhongzhuan/sub2api/.worktrees/model-pricing-motion`, branch `codex/model-pricing-motion`. The branch is published as `origin/codex/model-pricing-motion`; use this checkout for review or continuation of the pricing/status work and do not accidentally edit the parent checkout and assume the feature is present there.
- Latest committed catalog checkpoint: `1ab80f67` (`fix: remove loss-making catalog models`). The provider-grouped model expansion Tasks 1–7 and public/user motion Tasks 1–5 are complete. Motion Tasks 6–8 and final integrated QA remain.
- The catalog now intentionally contains 44 models: loss-making `glm-5.3-flash` and `MiniMax-M3` were removed from the public seed on 2026-09-01 after comparing current manufacturer pricing with PackyAPI costs. The worktree is clean except for the pre-existing untracked `frontend/pnpm-workspace.yaml`, which must not be changed or committed.
- A Vite preview from this worktree was verified at `http://127.0.0.1:3000` on 2026-09-01; confirm the current process before relying on it.
- Remote `origin/main` and `origin/codex/public-models-docs` were last observed at `ee96f156`; neither includes the isolated feature commits. The complete committed feature history through the payment conversion implementation plan is available on `origin/codex/model-pricing-motion`. Integrate/review that branch before attempting a `main` deployment.

## Stable Checkpoints

- `2cd76001` — approved public Models and Docs design.
- `14cf1cc6` — public Models and Docs implementation plan.
- `74460be6` — tested model catalog domain.
- `0ce0bb11` — nine original model-family artworks and catalog mapping adjustments.
- `e3be2797` — project handoff and deployment-continuity design.
- `c0b90cde` — repository-level agent handoff entry point.
- `737d31d0` — verified OwnAPI homepage foundations and shared public-site shell.
- `47faf485` — public Models catalog and model detail experience.
- `58aebe72` — public documentation experience.
- `a19d27cb` — browser-QA fixes and Models/Docs QA record.
- `9cc01e91` — updated conversation-independent handoff after Models/Docs QA.
- `d9cc9b06` — restored the previously successful traceable production deployment workflow.
- `7d7b69c1` — pinned Docker builds to pnpm 9.15.9; the complete production image then built successfully.
- `604b7963` — approved model pricing and Status-navigation design.
- `dfa59bc5` — pricing/status and public/user-motion implementation plans.
- `bd19ddda` — isolated-worktree boundary; current parent checkout checkpoint.
- `ff43cc4e` and `68a5104a` — traceable pricing domain with backend availability kept separate.
- `dd5efd26` and `048dde15` — exact verified 16-model catalog and corrected Haiku context metadata.
- `12e6def5`, `bddc4cfa`, and `a31e4a02` — public pricing filters/cards and valid, crop-safe card markup.
- `36fc770f` and `95afbdde` — detail pricing/source disclosure and clarified price semantics.
- `21b1b7f7` — public Status links removed while authenticated `/monitor` remains protected.
- `a861bdaf` — final verified pricing sources/caveats and unsupported health-claim removal.
- `b4009355` — durable Task 6 verification and handoff record.
- `b03f7cde`, `b0ecf130`, and `4bbcfb1d` — accessible global motion tokens/primitives and Reduced Motion corrections.
- `a6ed6622` — one-time IntersectionObserver reveal primitive with no-JS/reduced-motion fallbacks.
- `741d9f59` and `a6d658e2` — public/user route transitions, mobile navigation motion, and query-only navigation remount protection.
- `7ec99a26` and `d8ee4ba1` — restrained homepage motion and session-once Hero behavior.
- `0792a4a8` and `37967265` — Models/Docs motion, real Docs copy feedback, and single moving Docs indicator.
- `23eaca7a` and `ebda251f` — approved 46-model expansion design and implementation plan.
- `0db8fcbf` — public pricing disclosure for free, unpublished, tiered, and generic prices.
- `61119191` — homepage provider strip synchronized with the expanded catalog.
- `1ab80f67` — loss-making GLM 5.3 Flash and MiniMax M3 entries removed from the public catalog.
- `docs/superpowers/specs/2026-09-01-ownapi-packyapi-llm-upstream-design.md` — approved architecture for customer OwnAPI keys, OwnAPI base prices already set to manufacturer list × 0.7, a standard 1.0 billing group, per-account Packy token groups, model-restricted routing, and separate upstream cost accounting; pending written-spec review and implementation planning.
- `docs/superpowers/specs/2026-09-01-ownapi-payment-currency-conversion-design.md` — approved CNY/USD balance-recharge conversion design: CNY converts at 6.7:1, USD at 1:1, and the existing recharge multiplier applies only after conversion.
- `docs/superpowers/plans/2026-09-01-ownapi-payment-currency-conversion-plan.md` — test-first implementation sequence for backend order semantics, frontend previews/currency formatting, documentation, and local QA.

## Required Reading

- Product design: `docs/superpowers/specs/2026-08-28-ownapi-public-models-docs-design.md`
- Implementation plan: `docs/superpowers/plans/2026-08-28-ownapi-public-models-docs.md`
- Handoff policy: `docs/superpowers/specs/2026-08-31-project-handoff-continuity-design.md`
- Model pricing/status design: `docs/superpowers/specs/2026-08-31-ownapi-model-pricing-status-design.md`
- Model pricing/status plan: `docs/superpowers/plans/2026-08-31-ownapi-model-pricing-status-plan.md`
- Visual QA log: `design-qa.md`
- Public/user motion design: `docs/superpowers/specs/2026-08-31-ownapi-public-user-motion-design.md`
- Public/user motion plan: `docs/superpowers/plans/2026-08-31-ownapi-public-user-motion-plan.md`
- 46-model expansion design: `docs/superpowers/specs/2026-08-31-ownapi-50-percent-model-expansion-design.md`
- 46-model expansion plan: `docs/superpowers/plans/2026-08-31-ownapi-50-percent-model-expansion-plan.md`

## Architecture Map

- `frontend/src/views/HomeView.vue` — public homepage and custom-home override.
- `frontend/src/components/public/` — shared public header, footer, and layout under active development.
- `frontend/src/data/modelCatalog.ts` — curated model metadata, API merge, filtering, lookup, and related-model logic.
- `frontend/src/data/__tests__/modelCatalog.spec.ts` — catalog-domain tests.
- `frontend/src/views/public/ModelsCatalogView.vue` and `ModelDetailView.vue` — public model discovery and model detail routes.
- `frontend/src/views/public/DocsView.vue` and `frontend/src/data/docsContent.ts` — public documentation route and structured content.
- `frontend/public/model-art/` — original family artwork for GPT, Claude, Gemini, DeepSeek, Grok, Qwen, GLM, Kimi, and OwnAPI fallback.
- `frontend/src/router/index.ts` — public and authenticated route boundaries.
- `frontend/src/i18n/locales/en.ts` and `zh.ts` — public-site copy.
- `frontend/src/api/modelDisplay.ts` — live model-display configuration and pricing input.
- `frontend/src/utils/homeCodeExample.ts` — localized homepage code example.
- `backend/` — Go API server; production builds can embed the frontend.
- `deploy/` — Docker, binary, and local deployment resources.

## Completed Product Work

- The public homepage was rebuilt in the OwnAPI/Vercel-inspired direction and previously passed targeted tests, type checking, linting, build, and browser QA before later work began.
- The model catalog data layer supports curated fallback entries, live API pricing merges, normalized family metadata, search/filter/sort helpers, slug lookup, and related models.
- Nine family artwork files exist under `frontend/public/model-art/` and were visually inspected for crop safety and absence of text, trademarks, and watermarks.
- Public `/models`, `/models/:modelId`, and `/docs` are implemented with the shared public-site shell, responsive layouts, localized content, functional filters/tabs/copy controls, and curated fallback behavior when live pricing is unavailable.
- Browser QA passed at 1440 × 900 and 390 × 844. The login translation and GPT artwork-path findings discovered during QA were fixed in `a19d27cb`.
- Public motion Tasks 1–5 are implemented and independently reviewed: route/mobile-menu transitions, a session-once homepage Hero, meaningful one-time section reveals, bounded model-list/card/tier motion, a moving Docs active indicator, and 1500ms stable-width copy feedback. Reduced Motion removes delays/transforms and keeps final content visible. No admin view was modified.

## Work in Progress

The pricing/status implementation, 44-model catalog expansion, and public motion Tasks 1–5 are complete on the isolated `codex/model-pricing-motion` branch, but that branch has not been integrated into the canonical parent checkout or pushed to `main`. Remaining work, in order:

1. Review the written payment-currency conversion spec, write its implementation plan, and implement the approved CNY/USD recharge conversion before resuming PackyAPI work.
2. Review and approve `docs/superpowers/specs/2026-09-01-ownapi-packyapi-llm-upstream-design.md`, then write its implementation plan. The design reuses the existing OwnAPI group multiplier and per-user override: channel prices are already manufacturer list × 0.7, customers default to one standard 1.0 group, and Packy token groups remain account-level upstream routing/cost metadata.
3. Implement the approved PackyAPI upstream accounts/channel, exact model mappings, USD customer billing, and normalized USD account-cost reporting. The six selected Packy token groups cover only part of the 44-model catalog; only the verified, profitable intersection is callable.
4. Execute public/user motion Tasks 6–8: animated user statistics/loading, authenticated user interaction feedback, full normal/reduced-motion QA, and final durable handoff. Administrator UI remains excluded.
5. Review and integrate the current HEAD of `codex/model-pricing-motion` into the intended parent branch, then push the approved result to `main`. Do not treat `/Users/owen/apizhongzhuan/sub2api` at `bd19ddda` as already containing this work.
6. Repair production SSH authentication. The server is reachable, but GitHub Actions secret `SERVER_SSH_KEY` is no longer accepted for `SERVER_USER` (`Permission denied (publickey)`). Update the secret with a currently authorized private key or correct the authorized key/user on the server.
7. Re-run the `Build and Deploy` workflow on the integrated `main`, then verify the confirmed production domain and record the result below.

## Local Validation

Run from `frontend/` unless otherwise noted. The generated `frontend/pnpm-workspace.yaml` caused the pnpm wrapper to fail during the final run, so the verified commands used the already-installed local binaries:

```bash
node_modules/.bin/vitest run src/data/__tests__/modelCatalog.spec.ts src/router/__tests__/guards.spec.ts src/router/__tests__/title.spec.ts src/i18n/__tests__/defaultLocale.spec.ts src/i18n/__tests__/homeLocales.spec.ts src/utils/__tests__/homeCodeExample.spec.ts
node_modules/.bin/vue-tsc --noEmit
node_modules/.bin/eslint src/components/public/*.vue src/components/models/*.vue src/components/docs/*.vue src/data/modelCatalog.ts src/data/docsContent.ts src/data/__tests__/modelCatalog.spec.ts src/views/HomeView.vue src/views/public/ModelsCatalogView.vue src/views/public/ModelDetailView.vue src/views/public/DocsView.vue src/router/index.ts
node_modules/.bin/vue-tsc -b && node_modules/.bin/vite build
cd .. && git diff --check
```

Local frontend preview:

```bash
cd frontend
pnpm dev
```

The standard local URL is `http://127.0.0.1:3000/home` when Vite is configured on port 3000. Confirm the actual terminal output rather than assuming the port.

## Deployment Status

- Required: yes.
- Production URL: not yet confirmed.
- Hosting method: not yet confirmed; repository supports Docker Compose and embedded Go binary deployment.
- Credentials: never store here.
- Last deployed revision: not yet recorded.
- Rollback revision: not yet recorded.
- Production verification: blocked before server-side execution by rejected SSH public-key authentication; the existing online container was not replaced.
- Source backup remote: `https://github.com/therealemery/sub2api.git`; commits through `7d7b69c1` are on both `main` and `codex/public-models-docs`.
- CI: run `33352960936` passed frontend, Go lint, backend unit tests, and backend integration tests for the full feature set.
- Deployment build: run `33353391215` successfully built image `ownapi:7d7b69c1c3fd`, then failed at SSH authentication before `docker load` or Compose execution.

Before deploying, determine the existing website's host, domain, deployment directory or service, environment-variable location, and rollback method. Do not create a new hosting target when an existing one is intended.

## Checkpoint Log

### 2026-08-31 — Conversation-independent takeover

- Added a repository-level handoff design and this agent entry point.
- Recovered the prior task from local thread history after its WebSocket response stream repeatedly disconnected.
- Confirmed that project-code errors were not the cause of the old conversation failure.
- Confirmed the active branch, stable commits, dirty worktree, and remaining Models/Docs objective.
- Result: superseded by the completed shared-shell checkpoint below.

### 2026-08-31 — Shared public-site shell

- Commit: `737d31d0`.
- Consolidated the completed homepage foundations, OwnAPI branding/default language behavior, localized code example, tests, and visual QA record.
- Added and integrated `PublicSiteHeader.vue`, `PublicSiteFooter.vue`, and `PublicSiteLayout.vue` without changing the custom-home override.
- Validation passed: 11 focused Vitest tests, Vue type checking, focused ESLint, production Vite build, and `git diff --check`.
- Build emitted only existing chunk-size and mixed static/dynamic import warnings; no build error occurred.
- Next task: implement the public Models catalog and model detail routes from Task 4.

### 2026-08-31 — Public Models, Docs, and responsive QA

- Commits: `47faf485`, `58aebe72`, and `a19d27cb`.
- Implemented public model catalog, model detail, documentation content, responsive navigation, code examples, copy controls, public routing, and backend-mode allowances.
- Browser QA passed for Models, GPT-5.4 detail, and Docs at 1440 × 900 and 390 × 844; no horizontal overflow or broken artwork remains.
- English/Chinese switching persisted through reload; search/filter/sort, mobile menu, tabs, copy controls, anchors, and related links were exercised.
- Validation passed: 6 Vitest files / 52 tests, Vue type checking, focused ESLint, production Vite build, and `git diff --check`.
- Build emitted only existing mixed-import, chunk-size, and stale Browserslist-data warnings.
- At that checkpoint the deployment target had not yet been recovered; the later source-upload/deployment checkpoint below supersedes this status.

### 2026-08-31 — Source upload and production deployment attempt

- Pushed the complete source and handoff record to both `origin/codex/public-models-docs` and `origin/main`.
- Restored the historical `Build and Deploy` workflow that previously completed successfully on 2026-05-11 and uses repository secrets `SERVER_HOST`, `SERVER_USER`, and `SERVER_SSH_KEY` for `/opt/ownapi/deploy`.
- Full GitHub CI passed in run `33352960936`.
- First deployment run `33353242909` exposed pnpm-major drift in Docker (`pnpm@latest` rejected dependency build scripts); fixed by pinning Docker to the CI-compatible pnpm 9.15.9 in `7d7b69c1`.
- Second deployment run `33353391215` built the complete commit-tagged Docker image successfully. The reachable server then rejected the configured SSH key for the configured user. Because authentication failed, no image was loaded and no production container, `.env`, or data was changed.
- Exact recovery action: update `SERVER_SSH_KEY` (or correct `SERVER_USER`/server `authorized_keys`), then dispatch `.github/workflows/deploy.yml` with branch `main` and verify the public routes.

### 2026-08-31 — Baseline B2 repair

- Repaired pending OAuth EmailVerify account creation so separately stored OAuth affiliate data is preserved and absent invitation/adoption fields are omitted from the request.
- Made admin auth-source-default serialization handle incomplete source maps with the existing declared defaults.
- Restored the current system page-size default as the authoritative read value over stale browser storage.
- Focused B2 tests passed: 3 files / 11 tests. Vue type checking and `git diff --check` passed.
- The full frontend suite has two remaining GroupDistributionChart failures and one DashboardView unhandled rejection, each caused by `formatCost` calling `toFixed` on undefined; these are outside B2. See `.superpowers/sdd/2026-08-31-ownapi-model-pricing-status-plan/baseline-b2-report.md`.
- Review fix round 1 preserved `undefined` for missing pending OAuth adoption-decision fields; a partial decision can no longer serialize an unselected field as `false`. Focused EmailVerifyView and B2 suites passed (8 and 12 tests respectively).

### 2026-08-31 — Baseline B3 repair

- Made GroupDistributionChart and the admin dashboard tolerate legacy statistics payloads that omit account-cost fields, as well as non-finite rendered cost values.
- Preserved existing valid cost thresholds and precision while displaying unavailable costs as `$0.0000`; the corresponding DashboardView render no longer creates an unhandled rejection.
- Validation passed: focused chart/dashboard tests (2 files / 4 tests), Vue type checking, `git diff --check`, and the full frontend suite (100 files / 590 tests). The full suite still emits its existing `router-link` test-stub and intentionally exercised error-path warnings, but reports no failures or unhandled errors.
- See `.superpowers/sdd/2026-08-31-ownapi-model-pricing-status-plan/baseline-b3-report.md`.

### 2026-08-31 — Verified 16-model pricing and public Status separation

- Branch/worktree: `codex/model-pricing-motion` in `.worktrees/model-pricing-motion`; latest fully verified implementation commit before this handoff record is `a861bdaf` (`fix: complete public pricing disclosures`).
- Completed behavior: `/models` contains the exact 16 approved OpenAI, Anthropic, and xAI IDs; all customer prices derive from official standard API prices through the single `official * 0.7` calculator; cards expose input, cached input, and output pricing; Grok exposes the `>=200K` tier; detail pages expose source/date/alias and provider pricing caveats; missing prices never become `$0`.
- Public Status boundary: public Header, Footer, Home, and Docs do not link to `/monitor`; unsupported “All systems operational” claims were removed. `/monitor` remains authenticated and redirects an anonymous visitor to `/login?redirect=/monitor`; user/admin monitoring implementation and permissions were not changed.
- Pricing sources, all checked `2026-08-31`: OpenAI GPT-5.4 `https://developers.openai.com/api/docs/models/gpt-5.4`; GPT-5.4 Mini `https://developers.openai.com/api/docs/models/gpt-5.4-mini`; GPT-5.5 `https://developers.openai.com/api/docs/models/gpt-5.5`; GPT-5.6 Luna/Sol/Terra `https://developers.openai.com/api/docs/models/compare`; Codex alias rate card `https://help.openai.com/en/articles/20001415`; Anthropic standard pricing `https://platform.claude.com/docs/en/about-claude/pricing`; Claude Sonnet 5 release note `https://platform.claude.com/docs/en/release-notes/overview`; xAI pricing `https://docs.x.ai/developers/pricing`; PackyAPI scope reference `https://www.packyapi.com/pricing`.
- Pricing integrity: the catalog test asserts the 16 IDs, unique slugs, exact official rates, exact source URL assignments, `0.7` multiplier, `2026-08-31` checked date, nonzero derived prices, GPT-5.4-backed Codex alias, Haiku 200K context, and both Grok long-context tiers. Manual comparison against the approved design found zero remaining official-price or derived-price discrepancies.
- Browser QA passed at 1440 × 900 and 390 × 844 for `/models`, `/models/gpt-5-4`, `/models/claude-opus-4-6`, `/models/grok-4-6`, `/docs`, `/home`, and anonymous `/monitor`. Provider filters, price sorting, Grok tier controls, external source links, responsive overflow, image loads, public Status links, health claims, and `$0` fallbacks were checked.
- Full frontend verification from `frontend/` passed with direct installed binaries: `node_modules/.bin/eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts`; `node_modules/.bin/vue-tsc --noEmit`; `node_modules/.bin/vitest run` (103 files / 608 tests); `node_modules/.bin/vue-tsc -b && node_modules/.bin/vite build` (859 modules); and repository `git diff --check`. Existing non-fatal warnings remain for stale Browserslist data, mixed static/dynamic imports, large chunks, and intentionally exercised test stderr.
- The `pnpm` wrapper still stops during its automatic install with `ERR_PNPM_IGNORED_BUILDS` for `esbuild@0.21.5` and `vue-demi@0.14.10`; do not alter or commit the unrelated untracked `frontend/pnpm-workspace.yaml`. Use the installed binaries above until the wrapper policy is repaired.
- Exact implementation files across this pricing/status work: `frontend/src/data/modelCatalog.ts`, `frontend/src/data/__tests__/modelCatalog.spec.ts`, `frontend/src/views/public/ModelsCatalogView.vue`, `frontend/src/views/public/__tests__/ModelsCatalogView.spec.ts`, `frontend/src/views/public/ModelDetailView.vue`, `frontend/src/views/public/__tests__/ModelDetailView.spec.ts`, `frontend/src/components/public/PublicSiteHeader.vue`, `frontend/src/components/public/PublicSiteFooter.vue`, `frontend/src/components/public/__tests__/PublicNavigation.spec.ts`, `frontend/src/views/HomeView.vue`, `frontend/src/views/public/DocsView.vue`, `frontend/src/router/__tests__/guards.spec.ts`, and `frontend/src/i18n/locales/en.ts` / `zh.ts`.
- Deployment remains blocked exactly as before: GitHub Actions can build the production image, but `SERVER_SSH_KEY` is rejected for `SERVER_USER`. Repair the secret or the server user’s `authorized_keys`, rerun `.github/workflows/deploy.yml` from `main`, then verify `/home`, `/models`, `/models/gpt-5-4`, and `/docs` on the confirmed production domain. No deployment was attempted from this branch.

### 2026-09-01 — Public motion Tasks 1–5 approved

- Motion foundations: CSS tokens/transitions, `useReducedMotion`, and `useInViewReveal` are accessible, progressively enhanced, and safe when `IntersectionObserver` is absent.
- Public/user navigation: ordinary routes crossfade; every `/admin` path bypasses motion. Route keys use `route.path`, so query/hash-only changes do not remount Payment or other user pages. The mobile public menu uses a real Vue transition while preserving focus, keyboard activation, immediate navigation, and ARIA state.
- Homepage: Hero layers enter at 0/60/120/180ms with the complete sequence under 600ms, only once per SPA session. Eight meaningful sections reveal once in view; provider/capability hover and native FAQ disclosure stay within approved transform/scale limits. Custom home HTML/URL overrides remain unchanged.
- Models and Docs: model filtering uses bounded list motion with stable keys and delays only on the first six visible cards; card/tier feedback remains subtle. Docs uses one vertically moving active indicator and the real copy component uses a stable 82px label area, crossfade, exact 1500ms reset, and timer cleanup.
- Independent review fixes are included in `a6d658e2`, `d8ee4ba1`, and `37967265`. Latest public-motion report checkpoint: `cd577adf`.
- Verification: Task 3 related routing/navigation tests 55/55; Task 4 focused/related homepage tests 14/14; Task 5 focused/related public tests 19/19; focused ESLint, `vue-tsc --noEmit`, and range `git diff --check` passed for each approved task. In-app browser checks on the live local worktree confirmed `/home`, `/models`, `/docs`, and the Docs 1500ms copy reset.
- No administrator view changed. The pre-existing untracked `frontend/pnpm-workspace.yaml` remains untouched.
- The exact 46-model, provider-grouped, ranked-search expansion is designed/planned but not yet implemented; continue from `docs/superpowers/plans/2026-08-31-ownapi-50-percent-model-expansion-plan.md`. Approved follow-up Task 7 replaces the homepage's hard-coded ChatGPT/Claude/Gemini/DeepSeek/Qwen/Mistral strip with the eight nonempty catalog families: ChatGPT, Claude, Grok, Gemini, Qwen, GLM, Kimi, and MiniMax, using real vendor marks and no “Soon” badges.

### 2026-09-01 — Loss-making catalog entries removed

- The user approved USD customer balances and deductions with a recharge rate of `6.7 CNY = 1 USD`; PackyAPI billing remains an upstream cost and must not define customer deductions.
- Current manufacturer pricing and PackyAPI card costs showed that `glm-5.3-flash` and `MiniMax-M3` would lose money at the required manufacturer-price × 0.7 customer rate, so both were removed from the public catalog seed.
- The curated catalog now contains 44 models. Z.AI and MiniMax each contain two public entries; all eight provider sections remain present.
- Focused validation passed: model catalog, catalog view, and model detail tests (3 files / 30 tests), `vue-tsc --noEmit`, `git diff --check`, and browser verification of the 44-model count and removed MiniMax detail route.
- The unrelated untracked `frontend/pnpm-workspace.yaml` remains untouched.

### 2026-09-01 — Payment currency conversion design

- The user approved USD-denominated customer balances with `6.7 CNY = 1 USD` and `1 USD = 1 USD` recharge conversion.
- The selected design calculates credited USD only after selecting the concrete payment instance currency, applies `BALANCE_RECHARGE_MULTIPLIER` after conversion, excludes fees from credited balance, and rejects non-CNY/USD balance recharge instances.
- Existing subscription behavior, gateway-currency webhook validation, and proportional/full refund behavior remain unchanged.
- The written specification was approved and the implementation plan was recorded; implementation starts with backend conversion tests.

### 2026-09-01 — Feature branch published for deployment preparation

- Removed the uncommitted, partially implemented payment-conversion code before publishing; the approved design and implementation plan remain committed, but the exchange-rate behavior is not yet implemented and must not be described as production-ready.
- Published the complete committed pricing, 44-model catalog, public motion Tasks 1–5, PackyAPI design, and payment conversion design/plan history to `origin/codex/model-pricing-motion`.
- Full frontend validation passed immediately before publication: ESLint, `vue-tsc --noEmit`, 103 Vitest files / 608 tests, `vue-tsc -b`, and the Vite production build. Existing non-fatal router-link test-stub, stale Browserslist data, mixed-import, and large-chunk warnings remain.
- GitHub Actions CI run `33489605102` started for the published branch. Record its final status before merging.
- Do not deploy this branch as if the CNY/USD recharge conversion were complete. Merge the reviewed completed feature subset or finish and verify payment conversion first.
- Production deployment remains blocked by the rejected `SERVER_SSH_KEY` for `SERVER_USER`; pushing source does not repair server authentication.

## Recovery Checklist

1. Read this file, every document listed under Required Reading, and `design-qa.md`.
2. Run `git status --short` and `git log -5 --oneline --decorate`.
3. Do not clean or reset the worktree.
4. Inspect the files relevant to the current task before editing.
5. Run the focused validation for the current task.
6. Continue from the exact next task in the checkpoint log.
7. Update this file after completing a meaningful checkpoint.
