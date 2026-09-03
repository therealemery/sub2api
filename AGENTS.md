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

- Working directory: `/Users/owen/apizhongzhuan/sub2api`
- Active branch: `codex/public-models-docs`
- Latest source/deployment-build checkpoint: `c00e8927`
- The tracked product work is committed. The worktree still contains untracked local QA/cache/workspace artifacts (`.codex-qa/`, `.vite/`, and `frontend/pnpm-workspace.yaml`); inspect them before deciding whether they belong in Git and do not discard them blindly.
- A frontend-only Vite server was used for QA at `http://127.0.0.1:3000`; do not assume it is still running in a later session.

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

## Required Reading

- Product design: `docs/superpowers/specs/2026-08-28-ownapi-public-models-docs-design.md`
- Implementation plan: `docs/superpowers/plans/2026-08-28-ownapi-public-models-docs.md`
- Handoff policy: `docs/superpowers/specs/2026-08-31-project-handoff-continuity-design.md`
- Visual QA log: `design-qa.md`

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

## Work in Progress

The public Models and Docs implementation and local QA are complete. Production deployment is now successful; remaining work is post-deploy verification and future upstream integrations:

1. Discover or obtain the public production domain, then verify `/home`, `/models`, `/models/gpt-5-4`, `/docs`, login, and payment flows and record the result below.
2. Continue the PackyAPI upstream integration for language-model calls.
3. Implement DC-API H3 video generation, including authenticated access, reference images, duration/resolution options, and billing.

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
- Production URL: not yet confirmed (server IP `18.181.192.3`; application mapped on port 3000).
- Hosting method: Docker Compose on the existing server at `/opt/ownapi/deploy`.
- Credentials: never store here.
- Last deployed revision: `c00e89274aa7dc669beb4755b80559045a2e4e42` (image `ownapi:c00e89274aa7`).
- Rollback revision: prior image remains available on the server; `.env` backup is created per deployment as `.env.backup.<short-sha>`.
- Production verification: SSH recovered using the configured `SERVER_SSH_KEY`; `ownapi` is healthy and server-local `/health` and `/home` return HTTP 200.
- Source backup remote: `https://github.com/therealemery/sub2api.git`; commits through `7d7b69c1` are on both `main` and `codex/public-models-docs`.
- CI: run `33352960936` passed frontend, Go lint, backend unit tests, and backend integration tests for the full feature set.
- Deployment build: run `33726735975` built and deployed image `ownapi:c00e89274aa7`; the job was marked failed because its health check ran before startup completed. A retry loop has now been added to `.github/workflows/deploy.yml`.

Before deploying, determine the existing website's host, domain, deployment directory or service, environment-variable location, and rollback method. Do not create a new hosting target when an existing one is intended.

## Checkpoint Log

### 2026-09-03 — Production SSH recovery and deployment

- Updated GitHub Secrets `SERVER_SSH_KEY`, `SERVER_HOST`, and `SERVER_USER` using the user's authorized Lightsail key (secret values are not recorded here).
- Build and Deploy run `33726735975` successfully built and transferred `ownapi:c00e89274aa7` to `ubuntu@18.181.192.3` and recreated only the `ownapi` container.
- PostgreSQL and Redis remained running; `ownapi` reached `healthy` after startup. Server-local `/health` and `/home` returned HTTP 200.
- Added a bounded health-check retry loop to `.github/workflows/deploy.yml` so normal startup time does not produce a false workflow failure.

### 2026-09-02 — Admin docs entry and local console preview

- Verified `frontend/src/components/layout/AppSidebar.vue` bottom 文档入口 already targets the public `/docs` route, which resolves to `frontend/src/views/public/DocsView.vue`; no source change was necessary.
- Confirmed the local Vite preview is responding at `http://127.0.0.1:3000`.
- Opened `http://127.0.0.1:3000/admin/dashboard`; authentication guard correctly redirected the unauthenticated browser session to `/login?redirect=/admin/dashboard`.
- Follow-up diagnosis: login requests return HTTP 500 because the Vite proxy targets `http://localhost:8080`, but no backend is listening locally; Docker, PostgreSQL, and Redis are also unavailable on this machine. No frontend login defect was identified.
- Installed local development dependencies with Homebrew (Go, PostgreSQL 16, Redis), initialized the local `sub2api` database, and started the backend on `127.0.0.1:8080`; `/health` and the local admin login endpoint both return 200. The local admin test account is configured outside Git and credentials are not recorded here.

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

## Recovery Checklist

1. Read this file and the three required design/plan documents.
2. Run `git status --short` and `git log -5 --oneline --decorate`.
3. Do not clean or reset the worktree.
4. Inspect the files relevant to the current task before editing.
5. Run the focused validation for the current task.
6. Continue from the exact next task in the checkpoint log.
7. Update this file after completing a meaningful checkpoint.
