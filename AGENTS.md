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
- Handoff design checkpoint: `e3be2797`
- The worktree contains valuable uncommitted homepage, localization, routing, store, test, utility, public-component, workspace, and visual-QA changes. Inspect `git status` before editing and do not discard them.
- No Sub2API development server was running at the time this handoff was created.

## Stable Checkpoints

- `2cd76001` — approved public Models and Docs design.
- `14cf1cc6` — public Models and Docs implementation plan.
- `74460be6` — tested model catalog domain.
- `0ce0bb11` — nine original model-family artworks and catalog mapping adjustments.
- `e3be2797` — project handoff and deployment-continuity design.

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

## Work in Progress

The public Models and Docs implementation is incomplete. Resume from Task 3 of the implementation plan:

1. Inspect and finish the shared public-site shell without losing the existing homepage design.
2. Build public `/models` and `/models/:modelId` views using `modelCatalog.ts` and live model-display data.
3. Build the functional public `/docs` view with structured navigation and copyable examples.
4. Run targeted tests, type checking, lint checks, production build, and `git diff --check`.
5. Perform desktop and `390 × 844` browser QA and update `design-qa.md`.
6. Commit coherent checkpoints separately.
7. Discover the user's real production website target, deploy the exact verified revision, verify production routes, and record the deployment below.

## Local Validation

Run from `frontend/` unless otherwise noted:

```bash
pnpm vitest run src/data/__tests__/modelCatalog.spec.ts src/router/__tests__/guards.spec.ts src/router/__tests__/title.spec.ts src/i18n/__tests__/defaultLocale.spec.ts src/i18n/__tests__/homeLocales.spec.ts src/utils/__tests__/homeCodeExample.spec.ts
pnpm vue-tsc --noEmit
pnpm lint:check
pnpm build
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
- Production verification: pending.

Before deploying, determine the existing website's host, domain, deployment directory or service, environment-variable location, and rollback method. Do not create a new hosting target when an existing one is intended.

## Checkpoint Log

### 2026-08-31 — Conversation-independent takeover

- Added a repository-level handoff design and this agent entry point.
- Recovered the prior task from local thread history after its WebSocket response stream repeatedly disconnected.
- Confirmed that project-code errors were not the cause of the old conversation failure.
- Confirmed the active branch, stable commits, dirty worktree, and remaining Models/Docs objective.
- Next task: audit the uncommitted shared public-shell changes against Task 3, run focused tests, and complete the shell checkpoint.

## Recovery Checklist

1. Read this file and the three required design/plan documents.
2. Run `git status --short` and `git log -5 --oneline --decorate`.
3. Do not clean or reset the worktree.
4. Inspect the files relevant to the current task before editing.
5. Run the focused validation for the current task.
6. Continue from the exact next task in the checkpoint log.
7. Update this file after completing a meaningful checkpoint.
