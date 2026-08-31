# Project Handoff and Continuity Design

## Goal

Make the OwnAPI customization of Sub2API recoverable by another coding model without relying on this Codex conversation. Keep the repository source code and Git history as the authoritative implementation, and maintain one repository-level handoff document that explains how to understand, verify, continue, and deploy the project.

## Source of Truth

- Application source code remains in its normal repository files.
- Git commits preserve stable checkpoints and make every completed stage recoverable.
- `AGENTS.md` is the single handoff entry point for coding agents.
- `AGENTS.md` must not contain duplicate copies of complete source files. It points to the authoritative files and records why they changed.
- Uncommitted work must be identified explicitly so another model does not mistake it for completed work.

## Handoff Document Structure

The repository-root `AGENTS.md` will contain:

1. Project purpose and current product direction.
2. Technology stack and important directories.
3. Active branch and stable checkpoint commits.
4. Current implementation status by feature.
5. A concise change log listing affected source files and behavioral changes.
6. Important architecture and design decisions that should not be rediscovered or accidentally reversed.
7. Local setup, build, test, and browser-verification commands.
8. Deployment target and deployment procedure once confirmed.
9. Known issues, incomplete work, and the exact next recommended task.
10. A recovery checklist for a new model starting with no conversation history.

## Update Policy

Update `AGENTS.md` at each meaningful checkpoint, not after every shell command. A checkpoint occurs when a feature, fix, test pass, design decision, or deployment stage is completed.

Each checkpoint entry records:

- Date and objective.
- Files added or changed.
- User-visible behavior.
- Validation performed and its result.
- Git commit identifier when committed.
- Remaining risks or follow-up work.

Commands are recorded when they are required to reproduce setup, validation, or deployment. Routine inspection commands are omitted.

## Git Checkpoint Policy

- Preserve the user's existing worktree changes.
- Commit only coherent, reviewed stages.
- Do not mix unrelated changes in one commit.
- Before a checkpoint commit, run the relevant focused tests and `git diff --check`.
- Record the checkpoint commit in `AGENTS.md` after it exists; when necessary, use the immediately preceding commit plus a clear note for the documentation-only follow-up commit.
- Never treat `AGENTS.md` as a substitute for Git history or backups.

## Current Takeover Baseline

The active work is on `codex/public-models-docs` and continues the OwnAPI public-site redesign.

Stable completed checkpoints:

- `2cd76001` — design for the public Models and Docs experience.
- `14cf1cc6` — implementation plan.
- `74460be6` — public model catalog domain and tests.
- `0ce0bb11` — model-family artwork and catalog adjustments.

The worktree also contains uncommitted homepage, localization, routing, store, test, utility, public-component, and QA changes. These changes must be inspected and validated before they are grouped into a commit. They must not be discarded or overwritten.

The remaining product objective is to finish the public `/models`, `/models/:modelId`, and `/docs` experience, verify the complete public site, and deploy the completed project to the user's website.

## Deployment Continuity

Deployment is a required delivery stage, but it must use the user's actual existing website target rather than an assumed host.

Before deployment:

- Discover and document the current hosting method, production domain, deployment commands, environment variables, and rollback mechanism from repository configuration or user-provided access.
- Build and test the exact revision that will be deployed.
- Do not expose secrets in `AGENTS.md`, commits, terminal output, or chat. Record only secret names and where they are configured.
- Preserve a known-good revision for rollback.

After deployment:

- Record the deployed Git revision, production URL, deployment time, verification results, and rollback reference in `AGENTS.md`.
- Verify the public homepage, Models catalog, model detail, Docs page, authentication boundaries, and critical API behavior on the production domain.

## Recovery Workflow for Another Model

A new model should be able to continue by:

1. Reading `AGENTS.md`.
2. Checking the branch, `git status`, and recent commits.
3. Reading only the design and implementation documents linked from `AGENTS.md`.
4. Running the documented focused validation commands.
5. Starting from the recorded next task without depending on prior chat history.
6. Updating `AGENTS.md` at the next meaningful checkpoint.

## Success Criteria

- Another model can identify the current goal, stable work, uncommitted work, key files, validation commands, and next task from the repository alone.
- No complete source file is duplicated in the handoff document.
- Stable stages are recoverable through Git commits.
- Deployment configuration is documented without secrets.
- The final production revision and verification status are recorded after the site is deployed.
