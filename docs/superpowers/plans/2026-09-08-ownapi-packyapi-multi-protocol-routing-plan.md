# OwnAPI PackyAPI Multi-Protocol Routing Implementation Plan

## Goal

Keep one customer-facing OwnAPI `POST /v1/chat/completions` contract while routing each verified
Packy model through its token group's supported private protocol, preserving USD billing and never
exposing Packy account or credential details.

## Task 1: Lock the protocol table with unit tests

Files:

- Modify `backend/internal/pkg/openai_compat/upstream_capability.go`.
- Modify `backend/internal/pkg/openai_compat/upstream_capability_test.go`.

Steps:

1. Define explicit protocol values for OpenAI Chat, OpenAI Responses, and Anthropic Messages.
2. Add the verified 2026-09-08 profitable model intersection with exact names.
3. Prefer raw Chat where the selected Packy token group supports it; use Responses for the
   `codex`, `grok-sale`, and other Responses-only entries; use Anthropic Messages for `cc-sale` and
   the retained Claude entries from `cc`.
4. Return unknown for every model not in the table and test case/whitespace normalization.

## Task 2: Reuse the existing Anthropic conversion pipeline for Packy accounts

Files:

- Modify `backend/internal/service/openai_gateway_chat_completions.go`.
- Add focused service tests beside the existing Packy routing tests.

Steps:

1. Dispatch managed Packy requests by the explicit protocol table before the existing raw/Responses
   branch.
2. Implement a Packy Anthropic forwarding adapter using the existing Chat → Responses → Anthropic
   conversion and Anthropic SSE → Chat response conversion behavior.
3. Build the Packy URL as the validated account base root plus `/messages`, replace customer
   authorization with the managed token, and send required Anthropic headers.
4. Preserve streaming usage collection, model mapping, failover semantics, billing fields, and
   response-header filtering.
5. Fail closed without contacting Packy when the model has no protocol entry.

## Task 3: Make operations and billing metadata reflect the actual endpoint

Files:

- Modify `backend/internal/handler/openai_chat_completions.go`.
- Modify focused handler tests.

Steps:

1. Resolve the recorded upstream endpoint from the Packy protocol table.
2. Keep the public inbound endpoint `/v1/chat/completions` and customer model unchanged.
3. Verify usage records keep the selected account, upstream model, customer USD charge, and account
   cost while recording `/v1/messages`, `/v1/responses`, or `/v1/chat/completions` accurately.
4. Verify Packy hostnames, account labels, groups, tokens, and raw errors are absent from customer
   responses.

## Task 4: Verify and deploy safely

1. Run focused protocol, OpenAI gateway, handler, scheduler-cache, and managed-upstream tests.
2. Run the affected backend package tests and `git diff --check`.
3. Update `AGENTS.md`, commit, push to `main`, and deploy with the existing workflow.
4. Keep all four Packy accounts unschedulable until their correct tokens are safely re-entered.
5. Enable and smoke-test one account at a time with the minimum-cost request; reconcile OwnAPI usage,
   Packy consumption, customer balance delta, account cost, profit, and sanitization.
6. Add the three omitted Core GLM models before enabling Core.
7. Leave MiniMax H3 and the DC-API account unchanged.
8. Rotate all four Packy tokens after final verification because earlier UI inspection exposed them
   in a tool snapshot.
