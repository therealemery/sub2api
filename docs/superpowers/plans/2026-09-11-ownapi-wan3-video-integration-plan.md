# OwnAPI Wan 3.0 Video Integration Plan

## Goal

Ship `wan3.0-video` and `wan3.0-video-prime` through OwnAPI's existing opaque video API, with US-list-price × 0.8 customer billing, quoted Alibaba upstream-cost accounting, complete public documentation, and no upstream disclosure.

## Implementation sequence

1. Add failing backend tests for the Alibaba provider constant, managed-account validation, text-scheduler exclusion, exact-model account selection, request translation, status normalization, opaque task routing, error sanitization, content proxying, and customer/upstream cost calculation.
2. Add the Alibaba managed provider and generic video-account routing primitives. Preserve legacy H3 task envelopes by treating a missing adapter as DC-API.
3. Implement the DashScope Wan create/retrieve/content adapter and strict validation for duration, resolution, ratio, optional controls, and media-combination limits.
4. Extend video usage creation with duration, resolution, normalized upstream account cost, inbound endpoint, and private upstream endpoint metadata. Add focused billing assertions.
5. Add failing frontend catalog tests for both Wan models, all three US list-price tiers, and 0.8 prices; then add catalog records and Alibaba family presentation metadata.
6. Generalize the authenticated video generator and code examples by model capability. Preserve H3 behavior while adding Wan controls and request shapes.
7. Expand public Docs and localized copy with the shared lifecycle and model-specific Wan parameters, limits, polling, and download examples.
8. Add Alibaba as an admin managed-upstream choice with safe base-URL normalization, exact two-model whitelist, and removal of text-only flags. Verify create/edit payloads.
9. Run focused Go and frontend tests, the full frontend suite, Vue type checking, lint, production build, migration tests where applicable, `gofmt`, and `git diff --check`.
10. Update `AGENTS.md`, commit the verified implementation, and present the exact lowest-cost paid smoke test for confirmation before sending it upstream.
11. Configure the production Alibaba account outside Git, run the confirmed smoke test through OwnAPI, reconcile customer charge and account cost, push `main`, deploy through the existing workflow, and verify public and authenticated production routes.

## Checkpoints

- Backend protocol and billing tests pass before frontend changes are considered complete.
- H3 regression tests remain green after generic video routing is introduced.
- No credential, Workspace key, upstream task ID, or result URL appears in Git, customer JSON, browser requests, or logs.
- No paid task is sent until the user confirms the stated minimum test price.
