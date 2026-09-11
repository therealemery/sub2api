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

- Active checkout: `/Users/owen/apizhongzhuan/sub2api`, branch `codex/video-usage-history`; the H3 usage-history feature commit `c21871b3` and cleanup history are on `origin/main`.
- Production is running image `ownapi:171ec90e7907`. The private Wan 3.0 gateway, customer/model rate overrides, and the admin modal's model-source correction are deployed and verified.
- The verified local and production catalog contains 44 models after adding `wan3.0-video` and `wan3.0-video-prime`. The two Packy `cc`-only models are intentionally excluded because OwnAPI is a third-party gateway; the six `cc-sale` Claude models remain published.
- Preserve the pre-existing untracked `.codex-qa/`, `.vite/`, `LightsailDefaultKey-ap-northeast-1.pem`, and `frontend/pnpm-workspace.yaml`; none belongs to the video-history change and none should be committed.
- Local frontend and backend were restored and verified on 2026-09-07 at `http://127.0.0.1:3000` and `http://127.0.0.1:8080`. Confirm the current processes before relying on them.

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
- `55ec8016` — added a keyed user-route transition shell; production QA later showed `mode="out-in"` could still leave authenticated pages blank during lazy route switches.
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

### 2026-09-11 — DeepSeek Sale and GPT-6 pricing design ready for review

- Drafted the approved direction for `deepseek-v4.1-flash` (privately mapped to Packy's
  `deepseek-v4-flash`) and `deepseek-v4-pro` on a dedicated `Packy / DeepSeek Sale` account. Both
  customer models use official `$0.15/$0.60/$0.003` input/output/cache-read prices multiplied by
  `0.75`; no official Packy group or existing Packy account may serve them.
- GPT-6 Astra's corrected official short tier is `$10/$50/$12.50/$1` for
  input/output/cache-write/cache-read and the existing long tier is `$20/$75/$25/$2`. Customer
  billing remains official price multiplied by `0.7`, with the existing 200,000-token boundary.
- Design: `docs/superpowers/specs/2026-09-11-ownapi-deepseek-sale-gpt6-pricing-design.md`. No pricing,
  routing, account, production data, or secret has been modified at this checkpoint.

### 2026-09-11 — Wan detail-page code examples corrected, deployed, and verified

- Corrected the Wan Python examples to use native `True`/`False` values. The previous JSON-style
  lowercase booleans caused an immediate Python `NameError` when copied verbatim.
- Both Wan model pages now default to a prompt-only request that can be submitted as shown after the
  customer sets `OWNAPI_API_KEY`. Reference image, video, and audio fields remain visible as optional
  commented templates and no longer send invalid `example.com` placeholders by default. TypeScript
  and cURL use the same prompt-only request while retaining valid JSON/JavaScript booleans.
- New component coverage verifies both `wan3.0-video` and `wan3.0-video-prime` across Python,
  TypeScript, and cURL. All 113 frontend test files / 679 tests, Vue type checks, focused ESLint,
  production frontend build, and `git diff --check` pass.
- Commit `71318190` was pushed to `origin/main` and deployed by Actions run `34592604921` as image
  `ownapi:71318190cd6b`. The container and public health endpoint are healthy. Production browser QA
  confirmed the corrected Python examples on both Wan pages and the valid TypeScript/cURL examples
  on the Prime page. No paid task was created during this documentation-only verification.

### 2026-09-11 — Public model filter category switching deployed and verified

- Reproduced the apparent all-provider empty state: a model class or endpoint selected farther down
  the sticky rail remained active while the user clicked a provider, so every provider could appear
  empty until `Reset all` or a full page reload cleared the hidden condition.
- Provider, model-class, and endpoint radio selections now act as mutually exclusive category
  switches. Selecting one clears the search and the other two category filters while preserving the
  chosen sort order. Explicit `All` selections follow the same predictable switching rule.
- Added interaction coverage for search -> video -> Anthropic -> videos and verified the expected
  3 -> 6 -> 3 model results without reloading. Focused catalog/view tests (28), all 112 frontend test
  files / 677 tests, Vue type checks, focused ESLint, production frontend build, and
  `git diff --check` pass.
- Commit `69565437` was pushed to `origin/main` and deployed by Actions run `34588561790` as image
  `ownapi:695654376a84`. Production browser QA then switched, without any reload, through video
  (3 models), Anthropic (6), xAI (2), Alibaba (2), and the videos endpoint (3). Each switch cleared
  the other hidden category selections, and no empty or `0 models` state occurred.

### 2026-09-11 — Wan 3.0 integration deployed and production verified

- Added private Alibaba Workspace routing for `wan3.0-video` and `wan3.0-video-prime` behind the
  existing OwnAPI video lifecycle. Customer credentials and responses expose only OwnAPI; account
  selection is exact-model and Alibaba video accounts are excluded from text scheduling.
- Wan task envelopes bind user, account, model, adapter, and expiry. Retrieve responses normalize
  provider states, and completed content is streamed server-side only after the initial result URL
  and every redirect pass HTTPS, Alibaba-domain, and public-IP validation. Existing H3 envelopes
  without an adapter remain compatible.
- Customer billing uses US manufacturer list × 0.8 at 480P, 720P, and 1080P, with customer/model
  overrides applied. Independent account cost uses the quoted RMB rates normalized at 6.7 CNY/USD.
  Usage history records the public endpoint, model, resolution, requested generation duration,
  customer cost, and account cost without private upstream identifiers.
- The public catalog, model details, authenticated playground, lifecycle code examples, Docs model
  switcher, admin account editor, and customer/model multiplier modal now include both Wan models.
  The account editor normalizes `/compatible-mode/v1` to the Workspace `/api/v1` root and locks the
  exact two-model whitelist. Both account update paths validate the fully merged managed-upstream
  state so a credentials-only admin request cannot bypass the restriction.
- Validation passed: backend service/handler/repository packages; all 112 frontend test files / 676
  tests; Vue type checking; focused ESLint; production frontend build; Go formatting;
  `git diff --check`; and credential-pattern scanning. The known unit-tag test-stub compilation
  issue in the pre-existing user-group-rate tests remains unchanged.
- Commit `171ec90e` was fast-forwarded to `origin/main` and deployed successfully by Actions run
  `34578849249`. Production is healthy on image `ownapi:171ec90e7907`.
- Created the production `Alibaba / Wan 3` managed account through the authenticated admin UI with
  the Workspace `/api/v1` root, exact two-model whitelist, and the existing `OwnAPI` 1x group. The
  credential remains only in encrypted production account storage. The non-billing connection test
  passed before any paid request was attempted.
- The single approved minimum paid test used `wan3.0-video`, 480P, 2 seconds, text only. It progressed
  `queued` -> `in_progress` -> `completed` and downloaded a 2,743,354-byte ISO MP4 at 854x480 with a
  two-second duration. Usage log 3282 records customer charge `$0.0660096000`, normalized account
  cost `$0.0492537314`, multiplier `1.0000`, API key 52, account 13, and public endpoint `/v1/videos`.
  The usage page shows the same model, endpoint, duration, and `$0.066010` charge.
- The customer task token is a 184-character `video_` encrypted OwnAPI envelope; the browser and
  customer-facing usage data do not expose the Alibaba task ID, Workspace hostname, credential, or
  result URL. Production logs contain no Alibaba hostname, billing failure, or upstream failure for
  the verified request. Do not repeat this paid smoke test unless a later change requires it.
- Design: `docs/superpowers/specs/2026-09-11-ownapi-wan3-video-integration-design.md`; plan:
  `docs/superpowers/plans/2026-09-11-ownapi-wan3-video-integration-plan.md`.

### 2026-09-11 — Wan 3.0 implementation plan approved for execution

- The user approved the written design. The implementation sequence is recorded in
  `docs/superpowers/plans/2026-09-11-ownapi-wan3-video-integration-plan.md`.
- Work proceeds test-first across the private Alibaba adapter, billing/account-cost reporting,
  public catalog, authenticated playground, account editor, and Docs. Paid upstream testing remains
  gated on a separate confirmation of the exact minimum charge.

### 2026-09-10 — H3 upstream protocol correction in progress

- A lowest-cost production smoke test showed that the configured `console.dc-api.com` account accepts JSON at `/v1/videos` and returns a task, while multipart requests return a generic 500 before task creation. The H3 gateway was temporarily changed to multipart in `530c9337`; restore the upstream JSON protocol while retaining OwnAPI's private media-field mapping before the next deployment.
- Do not repeat paid smoke tests until this correction is deployed. Two direct, invalid-duration JSON probes created upstream tasks outside OwnAPI billing; they were not created through the customer gateway.

### 2026-09-10 — H3 JSON protocol fix deployed and verified

- Restored JSON forwarding to the configured `console.dc-api.com` H3 account after confirming multipart returned a provider-side 500 while JSON was accepted.
- Commit `b3172225` was pushed to `origin/main` and deployed successfully by Actions run `34433065226`.
- One minimum-cost OwnAPI smoke test (768p, 5 seconds, text-only) returned HTTP 200, completed successfully, and downloaded a valid MP4 through the opaque OwnAPI task and content endpoints. No upstream host or task ID was exposed to the customer.

### 2026-09-10 — MiniMax H3 lifecycle examples completed

- The public MiniMax H3 model-page code panel now documents the complete OwnAPI lifecycle in Python, TypeScript, and cURL: create an asynchronous task, poll `GET /v1/videos/{task_id}` until completion, then download the MP4 from `GET /v1/videos/{task_id}/content`.
- Examples include reference image/video/audio and first/last-frame inputs while keeping the private DC-API upstream hidden.
- Local Vue type checking, Model Detail tests, production frontend build, and `git diff --check` pass. The change is ready to commit and deploy.

The pricing/status implementation, 43-model published catalog (48 verified seeds before profitability filtering), public motion Tasks 1–5, and production deployment are complete. Remaining work, in order:

### 2026-09-08 — Packy multi-protocol routing ready for deployment

- The user approved one customer-facing OwnAPI `POST /v1/chat/completions` contract with private
  per-model Packy protocol routing. Packy's signed-in model marketplace was checked by token group
  and endpoint, not inferred from provider names.
- The four production token sets require three private routes: Codex and Grok sale models use OpenAI
  Responses; Claude models use Anthropic Messages; GPT-5.4, GLM, MiniMax, Kimi, Qwen, and Gemini use
  OpenAI Chat Completions when their selected token group supports it. Gemini's native endpoint is
  not needed for this release because `gemini-slb` exposes OpenAI Chat.
- Added an exact, fail-closed Packy model-to-protocol table. Unknown models cannot fall back to a
  guessed protocol. Usage records now report the real private endpoint.
- Reused the existing Chat → Responses → Anthropic and Anthropic SSE → Chat converters for Packy
  Claude routes. The Packy `/v1/messages` request uses the managed server-side Bearer token; customer
  credentials remain replaced and private.
- Packy Anthropic error bodies are always replaced with a generic customer error, preventing the
  Packy hostname, token, token-group name, or raw error from escaping.
- Validation passed: protocol tests, Packy Anthropic URL/auth/usage/sanitization tests, endpoint
  metadata tests, full unit-tagged service and handler packages, server package, and
  `git diff --check`.
- All four Packy accounts remain unschedulable pending deployment and credential verification.
  After deployment, safely refill and enable one account at a time, add the three omitted Core GLM
  mappings, run minimum-cost routing/billing smoke tests, and rotate the four Packy tokens.

### 2026-09-07 — MiniMax H3 video integration checkpoint

- Added `MiniMax-H3` to the public model catalog as a Video model with reference-image capabilities. The screenshot's public 8 折 prices imply official rates of `$0.10/s` (768p) and `$0.1625/s` (2K); OwnAPI displays and bills at official 75%: `$0.075/s` and `$0.121875/s`.
- Added authenticated `POST /v1/videos`, `GET /v1/videos/:taskID`, and `GET /v1/videos/:taskID/content` routes. The backend selects only the DC-API managed account whose private model credential is `MiniMax-H3`, uses the customer's OwnAPI API key for authentication/billing, seals upstream task IDs with the JWT secret, and sanitizes upstream responses/errors and content URLs.
- Added the authenticated model-detail generator with prompt, duration, resolution, reference URL/upload, task polling, and video playback/download. The browser never receives the DC-API base URL or key.
- Local validation passed: backend handler/service/routes tests, the full frontend suite (108 files / 655 tests), Vue type checking, frontend production build, and `git diff --check`. The full backend suite has one environment-only failure in `ent/schema` under local Go 1.27.1 (`package \"context\" without types`), which reproduces unchanged on `main`; all H3-related backend packages pass. Commit `1f299e79` is on `origin/main`. Deployment run `34118545773` built the image but could not reach the server on SSH port 22, so production was not changed; do not modify or recreate the existing DC-API account.
- A fresh local SPA check searched for MiniMax H3 on `/models`, clicked the result, and reached `/models/minimax-h3` without a reload or blank route. The rendered page had the expected H3 heading and complete content. No paid generation request was submitted.

### 2026-09-07 — Packy live pricing and token-group checkpoint

- Rechecked Packy's signed-in pricing page. Current visible discounts include GPT-5.4 at 28% off (7.2 折), GPT-5.4 Mini/GPT-5.5/GPT-5.6/GPT-6 Astra at 93% off, Claude Opus/Sonnet 4.6+ at 88% off, Gemini at 57% off, and current GLM/Qwen/MiniMax/Kimi sale entries at 50% off.
- Public catalog pricing now derives the OwnAPI multiplier from Packy's displayed discount: `0.7` at 40% off or better, `0.8` from 28% through 39% off, and unpublished below 28% off. Cards and detail pages show the matching 7 折 or 8 折 label.
- Updated GPT-5.4 and Claude discount snapshots. Focused catalog/view tests (31 tests), Vue type checking, targeted Packy routing/validation Go tests, and `git diff --check` pass.
- Four Packy tokens now cover the compatible group sets without storing their secret values in Git: the core token (`codex`, `minimax-officially`, `glm-sale`, `grok-sale`, `cc-sale`, `gemini-slb`), expansion token (`bailian`, `cc`, `grok-officially`, `image`), Z.AI token (`zai-officially`), and GPT-5.4 token (`azure-officially`). Packy disables overlapping groups in one token, so each token must be configured as a separate model-scoped OwnAPI upstream account.
- Packy managed accounts now require a non-empty, exact-name `model_mapping` whitelist and reject wildcard/empty mappings. Scheduling enforces this whitelist even if OpenAI passthrough is accidentally enabled. Packy models known to require Responses (`gpt-5.6-luna`, `codex-auto-review`) use that endpoint; other Packy models retain raw Chat Completions forwarding.
- Remaining: deploy the account-form/backend changes, configure the four Packy accounts with exact model whitelists, run authenticated routing/billing smoke tests, add image-request pricing support, then start DC-API MiniMax H3.

### 2026-09-07 — Packy pricing refresh and GPT-6 Astra catalog entry

- Added `gpt-6-astra` to the curated public model catalog with Short Context pricing (`$5/$0.5/$25`) and Long Context pricing (`$20/$2/$75`). OwnAPI display pricing remains the official rate multiplied by `0.7`.
- Refreshed catalog pricing metadata timestamps to `2026-09-07` and verified the model catalog/detail tests (23 tests) plus Vue type checking.
- Packy’s public `ratio_config` endpoint was read-only inspected. Do not use its raw `model_ratio` or account-group multiplier to infer a customer-facing discount: Packy’s displayed discount already incorporates its RMB/USD conversion convention. Model pruning uses the displayed discount: retain models at 6 折 or lower, represented in seed metadata as at least 40% off. The current 44-model snapshot is all 5 折 or lower; GPT-6 Astra is approximately 0.7 折 (93% off).
- The admin account editor now preserves and edits the PackyAPI provider flag for existing OpenAI API-key accounts, so a configured Packy account can be maintained without losing its managed-upstream routing metadata.

1. Review the written payment-currency conversion spec, write its implementation plan, and implement the approved CNY/USD recharge conversion before resuming PackyAPI work.
2. Review and approve `docs/superpowers/specs/2026-09-01-ownapi-packyapi-llm-upstream-design.md`, then write its implementation plan. The design reuses the existing OwnAPI group multiplier and per-user override: channel prices are already manufacturer list × 0.7, customers default to one standard 1.0 group, and Packy token groups remain account-level upstream routing/cost metadata.
3. Implement the approved PackyAPI upstream accounts/channel, exact model mappings, USD customer billing, and normalized USD account-cost reporting. The six selected Packy token groups cover only part of the 44-model catalog; only the verified, profitable intersection is callable.
4. Execute public/user motion Tasks 6–8: animated user statistics/loading, authenticated user interaction feedback, full normal/reduced-motion QA, and final durable handoff. Administrator UI remains excluded.
5. Verify the confirmed production domain and record `/home`, `/models`, `/models/gpt-5-4`, `/docs`, login, and payment results below.
6. Verify authenticated sidebar navigation after the non-blocking user-route transition fix is deployed.

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

- Required: no for the current committed feature set.
- Production URL: `https://ownapi.dev` and `https://www.ownapi.dev`; both resolve to server IP `13.159.10.43`.
- Hosting method: Docker Compose on the existing server at `/opt/ownapi/deploy`.
- Credentials: never store here.
- Last deployed revision: `71318190` (image `ownapi:71318190cd6b`, deployed by run `34592604921`).
- Rollback revision: prior image remains available; `.env.backup.<short-sha>` is created per deployment.
- Production verification: healthy on 2026-09-11. The container health check and fixed-IP `/health`
  request pass; both Wan model pages are deployed. The `Alibaba / Wan 3` account is normal and
  schedulable, and the minimum `wan3.0-video` lifecycle, MP4 download, customer charge, account cost,
  usage history, and private-upstream boundary were verified end to end. Public model filtering was
  also verified across five consecutive category switches without a reload or empty result state.
- Source backup remote: `https://github.com/therealemery/sub2api.git`; commits through `7d7b69c1` are on both `main` and `codex/public-models-docs`.
- CI: run `33352960936` passed frontend, Go lint, backend unit tests, and backend integration tests for the full feature set.
- Deployment build: run `34592604921` successfully built and deployed current `main` to `13.159.10.43`; the application health check passed.

Before deploying, determine the existing website's host, domain, deployment directory or service, environment-variable location, and rollback method. Do not create a new hosting target when an existing one is intended.

## Checkpoint Log

### 2026-09-11 — DeepSeek Sale and GPT-6 implementation approved

- The user approved the written design in
  `docs/superpowers/specs/2026-09-11-ownapi-deepseek-sale-gpt6-pricing-design.md`.
- The implementation plan is recorded in
  `docs/superpowers/plans/2026-09-11-ownapi-deepseek-sale-gpt6-pricing-plan.md`.
- Implementation will add public `deepseek-v4.1-flash` and `deepseek-v4-pro` at 75 percent of the
  supplied official USD price, route them only through a future dedicated `Packy / DeepSeek Sale`
  account, and privately map flash to Packy's `deepseek-v4-flash` ID.
- GPT-6 Astra short/long customer billing will be corrected to the approved 70-percent values,
  including cache-read and cache-write charges. No paid request is authorized at this checkpoint.

### 2026-09-11 — DeepSeek Sale and GPT-6 implementation pushed

- Commit `6f329354` adds public `deepseek-v4.1-flash` and `deepseek-v4-pro`, explicit 75-percent
  catalog pricing, Packy OpenAI Chat routing, private flash alias rewriting, and migration 141.
- GPT-6 Astra now exposes official short `$10/$1/$50` plus cache-write `$12.5` pricing and long
  `$20/$2/$75` pricing; public and customer prices are multiplied by 0.7 and migration 141 updates
  both channel defaults and complete context intervals.
- Migration 141 is idempotent, never creates accounts or stores tokens, and only configures the
  exact `Packy / DeepSeek Sale` account if it already exists. DeepSeek remains unavailable until a
  valid `deepseek-sale` token is entered and that dedicated account is created/configured.
- Validation passed: all 113 frontend test files / 679 tests, Vue type checking, production build,
  focused Go protocol/mapping/migration tests, the PostgreSQL Packy migration integration test, and
  `git diff --check`. Changes were pushed to `origin/codex/video-usage-history`; protected untracked
  files remain untouched.

### 2026-09-11 — Public model filter switching production verification

- Commit `69565437` deployed successfully in Actions run `34588561790`; production is healthy on
  image `ownapi:695654376a84`.
- On `https://www.ownapi.dev/models`, one uninterrupted browser session switched from video model
  class (3 models) to Anthropic (6), xAI (2), Alibaba (2), and videos endpoint (3). No reload was
  used, no `0 models` result appeared, and each category selection reset the other category radios
  to their `All` values as designed.

### 2026-09-11 — Wan 3.0 production deployment and minimum paid verification

- Fast-forwarded the approved design, plan, and implementation commits through `171ec90e` to
  `origin/main`; Actions run `34578849249` built and deployed `ownapi:171ec90e7907` successfully.
- Created and non-billing-tested the model-scoped `Alibaba / Wan 3` production account without
  exposing or committing its credential. It is bound only to the `OwnAPI` 1x group and the exact
  `wan3.0-video` / `wan3.0-video-prime` mappings.
- One explicitly approved 480P, two-second `wan3.0-video` request completed through the customer
  OwnAPI lifecycle. The downloaded MP4 is 2,743,354 bytes, 854x480, and two seconds long.
- Production billing reconciliation passed exactly: `$0.0660096000` customer charge,
  `$0.0492537314` normalized upstream account cost, and `1.0000` effective customer multiplier.
  The customer usage table shows the request as `/v1/videos`; the stored task token is an encrypted
  OwnAPI envelope and no upstream identifier or host is present in customer-visible records.

### 2026-09-11 — Complete model-rate modal source ready for deployment

- Replaced the modal's static public-catalog model list with the union of real pricing models from
  every active channel bound to the selected standard group. This keeps each group's configurable
  list aligned with its backend channel pricing instead of the public website seed snapshot.
- The `OwnAPI` group additionally includes the independent `MiniMax-H3` video model, while existing
  user/model overrides remain visible after a model leaves channel pricing so administrators can
  explicitly clear stale entries. Model IDs are deduplicated case-insensitively and public catalog
  metadata is used only for friendly names and ordering.
- No production customer multiplier was changed. Focused tests cover multiple matching channels,
  unrelated-channel exclusion, H3 inclusion, stale override preservation, and invalid-value safety.
  The focused suite, Vue type checking, focused ESLint, the full frontend suite, production build,
  and `git diff --check` pass. Commit `950cb96c` was pushed to `origin/main`; deployment run
  `34556009483` completed successfully. Read-only checks of `/health`, `/home`, `/models`,
  `/models/minimax-h3`, `/docs`, and `/admin/users` return HTTP 200 on the new image.

### 2026-09-11 — Customer × model multiplier deployed

- Added `user_model_rate_overrides` migration and fail-safe resolver. A customer/model override now
  takes precedence over the existing customer-group or group-default multiplier for text and
  MiniMax H3 video requests; missing or unavailable overrides fall back to that existing multiplier.
- Added authenticated admin endpoints for reading/replacing a user's model overrides within a
  selected group, plus a Users-page "模型倍率" modal that lists curated models, supports per-model
  values, clearing to inheritance, and saving the complete replacement.
- Model override replacement is transaction-protected and validates the full input before deleting
  existing rows. Model overrides are read without a process-local cache so a saved billing change
  takes effect on the next request. Existing untracked QA/build/key/workspace files remain untouched.
- Validation passed: relevant backend packages and migration tests; all 111 frontend test files / 668 tests; Vue type checking; focused ESLint; production frontend build; and `git diff --check`. The full local backend suite retains the known Go 1.27.1-only `ent/schema` type-loading failure that reproduces on unchanged main.
- Commit `e1149101` was pushed to `origin/main` and deployed by Actions run `34554653380`. Production is healthy on image `ownapi:e1149101c0f9`, migration 140 is present, and public/admin route checks pass. Production customer-rate data and upstream accounts were not modified.

### 2026-09-09 — Claude Code-only Packy models removed and deployed

- Packy's group documentation confirms that `cc` is restricted to the Claude Code client and may suspend third-party integrations, while `cc-sale` explicitly permits third-party API clients with an occasional prompt-cache instability caveat.
- Removed `claude-haiku-4-5-20251001` and `claude-sonnet-4-5-20250929` from the curated and live-config public catalog paths. The public catalog now has 42 entries and six Anthropic models.
- Added migration `139_remove_claude_code_only_packy_models.sql` to remove both models from OwnAPI customer pricing, Packy account-cost pricing, and every managed Packy account whitelist. After migration, the `OwnAPI LLM` channel has 37 callable text models.
- Kept all six `cc-sale` Claude models and added localized detail-page guidance that OwnAPI-compatible third-party clients are supported and transient prompt-cache failures should be retried.
- Canonicalized model identity punctuation so live dotted aliases such as `Claude-Opus-4.7` merge into the curated hyphenated entry instead of creating duplicate public cards.
- Focused frontend tests (27/27), Vue type checks, focused lint, the production frontend build, migration tests, and `git diff --check` pass. The Docker-backed integration harness was unavailable locally because Docker Desktop was not running and correctly skipped outside CI.
- Commits `2aae65af` and `84d60a57` are on `origin/main`. Deployment run `34346283759` succeeded; production is healthy on image `ownapi:84d60a57100c`.
- Read-only production verification confirmed migration 139 is applied, `OwnAPI LLM` contains 37 callable text models, and no restricted customer-pricing row or Packy model mapping remains. Core, Expansion, and GPT-5.4 stayed active/schedulable; ZAI stayed paused in error as intended.
- Browser verification confirmed 42 public models, six Anthropic models, zero search results for both restricted IDs, and the new third-party/cache guidance on a retained Claude detail page.

### 2026-09-09 — Packy pricing-cache fix deployed; final billing check pending SSH

- Commit `f51337ee` added migration `138_backfill_account_stats_tier_labels.sql` and a repository-side `COALESCE` safeguard. The production deployment workflow `34321863987` completed successfully and replaced the application image.
- The previous zero-charge test was traced to `channel_account_stats_pricing_intervals.tier_label` being NULL, which caused channel-cache construction to fail while the upstream request itself still succeeded. The fix is designed to restore channel ID, customer pricing, and Packy account-cost resolution without modifying historical usage rows or balances.
- The administrator UI now shows `Packy / Core` normal and schedulable after the new token was entered. Expansion, GPT-5.4, and ZAI remain disabled/error until their tokens are replaced and verified.
- Two bounded direct SSH checks to `13.159.10.43:22` after deployment timed out. Do not claim the post-fix customer charge, account cost, or profit until server SSH access returns and the minimum-cost Core smoke request is reconciled from production data.

### 2026-09-09 — Packy pricing migration deployed; upstream credentials invalid

- Commit `58df872f` was pushed to `origin/main` and deployed successfully by Actions run `34304164749`; the production container is healthy as `ownapi:58df872f20c3`.
- Production read-only verification confirmed migration `137_seed_ownapi_packy_text_pricing.sql` is applied, `OwnAPI LLM` is active with `channel_mapped` billing, 39 distinct callable text models are present, and four Packy account-cost rules were created. The five fail-closed models remain absent, including `MiniMax-H3`, which stays on the independent DC-API video route.
- All four Packy credentials currently return upstream HTTP 401 `无效的令牌`; the scheduler has made them non-schedulable (`Packy / Core` status remains active but `schedulable=false`; Expansion, GPT-5.4, and ZAI are in error). Do not enable, test, or change production account data until the user supplies newly issued valid tokens. ZAI remains paused by policy.
- Public production checks passed: `/health`, `/home`, `/models`, `/models/minimax-h3`, and `/docs` returned HTTP 200 (with the expected `/docs` redirect).

### 2026-09-08 — Packy customer pricing and normalized cost rules

- Added migration `137_seed_ownapi_packy_text_pricing.sql`, which creates the fail-closed `OwnAPI LLM` channel, binds the existing `OwnAPI` OpenAI customer group at its existing `1x` multiplier, and seeds 39 callable Packy text models at the approved customer prices. GPT-5.4 uses manufacturer list × `0.8`; the remaining callable models use manufacturer list × `0.7`.
- Kept `glm-5`, `glm-5.2`, `gemini-3-pro-preview`, and `kimi-k2.5` outside the callable text channel. The latter three lack confirmed manufacturer prices; `glm-5` is excluded because the current `zai-officially` output cost, normalized to USD, exceeds OwnAPI's 70%-of-list output price. The `Packy / ZAI` account must remain paused. MiniMax H3 remains on the independent DC-API video path.
- Re-read Packy's public live `/api/pricing` data on 2026-09-08. Account-statistics rules use the exact token-group scopes of `Packy / Core`, `Packy / Expansion`, and `Packy / GPT-5.4`; Packy CNY cost is normalized to USD with `/6.7`. The low-price account-statistics columns were widened to 12 decimal places so normalization does not introduce material rounding error.
- Added complete customer and upstream-cost tiers for the verified context breakpoints. Fixed account-cost tier selection to use input plus cache-read context, matching customer billing and upstream behavior; output/cache-write tokens can no longer prematurely select a higher cost tier.
- Validation passed: migration model-set/price assertions, relevant service/repository/handler/protocol tests, unit-tag suites, a real PostgreSQL migration double-execution test with four mock Packy accounts, and `git diff --check` pending final commit. All real Packy accounts remain paused until deployment and one-account-at-a-time smoke tests.

### 2026-09-08 — Packy production accounts and scheduler-cache fix

- Created four production Packy managed-upstream accounts without changing the existing DC-API MiniMax H3 account: `Packy / Core`, `Packy / Expansion`, `Packy / ZAI`, and `Packy / GPT-5.4`. They use the documented `https://cf.api.fan/v1` OpenAI-compatible base URL, exact non-wildcard model whitelists, and the existing `OwnAPI` customer group at `1x`. Secret values remain only in production account credentials.
- The account scopes are non-overlapping: Core owns the profitable Codex, MiniMax M3, Grok sale, Claude sale, and Gemini SLB routes; Expansion owns the profitable Bailian and legacy CC routes; ZAI owns only `glm-5`; GPT-5.4 owns only `gpt-5.4`. Image groups remain excluded until image-request pricing is implemented.
- Production smoke tests exposed a scheduler metadata bug: `filterSchedulerCredentials` discarded managed `base_url`, and `filterSchedulerExtra` discarded `upstream_provider`. Cached Packy accounts therefore fell back to the official OpenAI URL and were treated as ordinary OpenAI accounts even though the full database account was correct.
- Added both routing fields to the deliberately slim scheduler metadata allowlists with unit and Redis integration regression coverage. Targeted repository unit tests, the scheduler-cache integration test, Packy/managed-upstream service tests, and `git diff --check` pass.
- All four Packy accounts were paused while this code fix awaits deployment. MiniMax H3 remains active. After deployment, refresh scheduler snapshots, enable the four accounts, then repeat one low-cost request per account and reconcile customer charge, Packy consumption, account cost, and upstream sanitization.

### 2026-09-08 — MiniMax H3 usage history repair ready for deployment

- Root cause of the empty authenticated `/usage` table: H3 usage rows legitimately store `duration_ms = NULL`, while `UsageView.vue` called `toFixed()` on that value during rendering. The page now renders missing duration as `-` and safely formats nullable cost fields.
- Added an owner-scoped video-history mapping table keyed by usage-log ID. New H3 usage creation stores the sealed OwnAPI video task token in the same billing transaction; the general usage DTO still does not expose that token.
- Added authenticated console endpoints that accept only a numeric usage ID, verify the logged-in user owns the mapping and the sealed task envelope, then proxy status/content through OwnAPI. The browser receives neither the DC-API account, base URL, credential, nor upstream task ID.
- The usage page now refreshes after returning to it and offers `查看视频` / `View video` for H3 rows. Completed video bytes are fetched with the user's JWT and played from a revocable local Blob URL; polling and stale requests are bounded and cleaned up.
- Three historical H3 task tokens were recovered locally and can be backfilled after deployment by matching their existing SHA-256 billing request IDs. The backfill must insert mappings only, without changing usage rows or balances, and must not print task tokens in CI logs.
- Validation passed: focused H3 usage tests (5/5), full frontend suite (110 files / 665 tests), Vue type checking, focused ESLint, production frontend build (868 modules), targeted backend handler/service/routes tests, owner-scope unit test, migration runner tests, and `git diff --check`. Existing non-fatal frontend test/build warnings remain unchanged.
- Feature commit `c21871b3` was fast-forwarded to `origin/main` and deployment run `34211297259` succeeded. Production is healthy on image `ownapi:c21871b3746e` and migration `136_add_usage_log_video_task_id.sql` applied during startup.
- A read-only production check verified three H3 usage rows and initially zero video mappings. A one-time workflow then matched all three recovered task tokens to their existing SHA-256 request IDs and verified exactly three H3 mappings. It did not alter balances or usage rows. The temporary task-ID GitHub secret was deleted and the temporary workflow was removed from source.

### 2026-09-07 — New Lightsail IP recovery and H3 production deployment

- The Lightsail public IP changed from `18.181.192.3` to `13.159.10.43`. The server and existing OwnAPI deployment were healthy on the new IP; the outage was caused by Cloudflare DNS still pointing at the old address.
- Cloudflare DNS for `ownapi.dev` and `www.ownapi.dev` was updated by the domain owner to `13.159.10.43`. Both names now resolve correctly, and HTTPS health/home checks return HTTP 200.
- Updated the GitHub repository secret `SERVER_HOST` to the new address without changing or exposing the SSH key. Run `34131515881` deployed commit `21a4d697` successfully.
- Production verification passed for `/health`, `/home`, `/models`, `/models/minimax-h3`, and the authenticated H3 route boundary. No paid video request was submitted. Bind a Lightsail Static IP to prevent another address change after future stop/start cycles.

### 2026-09-07 — MiniMax H3 deployment blocked by server reachability

- Pushed H3 commit `17c1eb4d` to `origin/codex/public-models-docs`, cherry-picked it cleanly onto current `main` as `1f299e79`, reran the full frontend suite/type/build plus H3 backend package tests, and pushed `origin/main`.
- GitHub Actions run `34118545773` successfully built the commit-tagged Docker image and configured SSH, but `18.181.192.3:22` timed out before the remote shell started. A bounded local SSH check and TCP checks for ports 22, 80, 443, and 3000 also timed out; `ownapi.dev` still resolves to that IP.
- Because the remote command never started, no image was loaded and no `.env`, container, database, or production data changed. Restore the Lightsail instance/network/firewall reachability, then rerun `Build and Deploy` from `main` and verify `/health`, `/models`, and `/models/minimax-h3`.

### 2026-09-03 — Production SSH recovery and deployment

- Updated GitHub Secrets `SERVER_SSH_KEY`, `SERVER_HOST`, and `SERVER_USER` with the authorized Lightsail key (secret values are not recorded).
- Run `33726735975` built and transferred `ownapi:c00e89274aa7` to `ubuntu@18.181.192.3` and recreated only `ownapi`; PostgreSQL and Redis remained running.
- `ownapi` reached `healthy`; server-local `/health` and `/home` returned HTTP 200.
- Added a bounded health-check retry loop to `.github/workflows/deploy.yml`.

### 2026-09-03 — Homepage FAQ answer clipping fix

- Fixed the expanded FAQ answer text in `frontend/src/views/HomeView.vue` by replacing its negative top margin with a 12px positive gap, preventing the first line from being clipped by the animated overflow container.
- Validation passed: Vue type checking, focused ESLint, `git diff --check`, and live browser measurement on `/home` in Chinese (`12px` gap and full first-line height).

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

### 2026-09-01 — Payment currency conversion implementation

- Implemented USD-denominated balance crediting after concrete payment-instance selection: CNY converts at `6.7:1`, USD at `1:1`, then the configured operational multiplier applies.
- Balance recharge rejects payment instances outside CNY/USD. Gateway fees remain excluded from credited balance; subscriptions, webhook validation, and refunds retain their existing semantics.
- Updated customer previews, order/payment amount formatting, administrator wording, payment documentation, and focused backend/frontend conversion tests.
- Local validation passed: focused payment tests (10/10), ESLint, `vue-tsc --noEmit`, the full frontend suite (108 files / 653 tests), production Vite build (864 modules), and `git diff --check`. Existing non-fatal test stderr, stale Browserslist, mixed-import, and large-chunk warnings remain.
- Browser verification confirmed unauthenticated `/purchase` redirects to `/login?redirect=/purchase`. The frontend-only server had no backend session or payment configuration, so no real or mocked provider order was submitted; CNY/USD previews remain covered by focused tests.
- This host has no Go toolchain or active Docker daemon. GitHub CI run `33502901887` passed Go lint, Go unit tests, Go integration tests, and the frontend job for implementation commit `a6c51542` after retrying one external golangci-lint JSON Schema timeout. The unrelated `frontend/pnpm-workspace.yaml` remains untouched.

### 2026-09-04 — Authenticated route blank-state fix

- Reproduced on production: sidebar URLs and active states changed, but `<main>` became empty after navigating between authenticated user pages; refreshing restored the page and no console errors were reported.
- Removed `mode="out-in"` from `UserRouteTransition.vue` while retaining the keyed route shell and fade transition. This allows the lazy-loaded destination component to mount without an intermediate empty state.
- Updated the focused transition test; `UserRouteTransition.spec.ts` passed (8 tests), `vue-tsc --noEmit` passed, and `git diff --check` passed. The change is ready to commit and deploy.

### 2026-09-06 — Managed upstream configuration and Packy routing

- Added managed upstream provider identifiers and backend validation for control-panel configured PackyAPI/DC-API accounts. Legacy accounts remain compatible; managed accounts require `base_url` and `api_key`, while DC-API accounts also require an explicit model.
- Added a PackyAPI provider selector to the OpenAI API-key account creation form. It stores only the provider metadata; no real credential is committed or exposed to the client.
- PackyAPI accounts are forced through the raw OpenAI Chat Completions forwarder, replacing the customer Authorization header with the server-side account credential. DC-API-marked accounts are excluded from the text OpenAI scheduler.
- Validation passed: targeted Go service tests, Vue type checking, and `git diff --check`. Commits `3506d7af`, `e0f86896`, and `d76b0742` are pushed to `main`.
- DC-API H3 request/response mapping remains pending authenticated documentation verification; do not guess endpoint fields or configure production credentials until the official schema is confirmed.

### 2026-09-10 — MiniMax H3 pricing and media contract update ready to commit

- Corrected MiniMax H3 pricing to the user-confirmed official rates of `0.5 CNY/s` for 768p and `0.8 CNY/s` for 2K. OwnAPI converts at `6.7 CNY = 1 USD` and charges 75% of the converted list price: approximately `$0.0559701493/s` and `$0.0895522388/s` respectively.
- Updated both the public model catalog/detail pricing and the authenticated video billing constants; existing user/group rate multipliers still apply on top of the corrected OwnAPI unit price.
- Verified CometAPI's MiniMax H3 create contract from `https://apidoc.cometapi.com/api/video/minimax-h3/create.md`: multipart upstream fields include `seconds`, `size`, `input_reference`, `reference_videos`, `reference_audios`, `first_frame`, and `last_frame`, with documented media limits.
- OwnAPI's `/v1/videos` customer contract remains JSON and now converts privately to multipart for DC-API. Model-page controls and code examples cover reference images, reference video, reference audio, first frame, and last frame; task polling and content download remain OwnAPI-proxied.
- Focused backend handler/service tests, model catalog/detail tests, Vue type checking, frontend production build, and `git diff --check` passed. No upstream credentials or untracked key/temp files were staged.

### 2026-09-10 — MiniMax H3 Docs lifecycle split

- Public Docs now presents H3 as three explicit steps: create (`POST /v1/videos`), retrieve/poll (`GET /v1/videos/{task_id}`), and download (`GET /v1/videos/{task_id}/content`).
- The Docs page lists reference image/video/audio and first/last-frame fields, provider media limits, and the rule that frame inputs cannot be mixed with other reference media.
- English and Chinese copy were added for the lifecycle steps; responsive Docs styling keeps the cards readable on mobile. Vue type checking, H3 model-detail tests, production build, and `git diff --check` passed.

## Recovery Checklist

1. Read this file, every document listed under Required Reading, and `design-qa.md`.
2. Run `git status --short` and `git log -5 --oneline --decorate`.
3. Do not clean or reset the worktree.
4. Inspect the files relevant to the current task before editing.
5. Run the focused validation for the current task.
6. Continue from the exact next task in the checkpoint log.
7. Update this file after completing a meaningful checkpoint.
