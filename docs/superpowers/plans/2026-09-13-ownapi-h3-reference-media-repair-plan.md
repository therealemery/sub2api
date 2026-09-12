# OwnAPI MiniMax H3 Reference Media Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore MiniMax H3 reference image, video, audio, and frame requests without regressing verified text-only JSON generation or the independent Wan adapter.

**Architecture:** Parse customer JSON and multipart bodies into a bounded internal H3 request with typed media items. Route media-free H3 creates through the existing JSON forwarder and media-bearing creates through a multipart encoder; the frontend sends real `File` objects with `FormData`, while URL-only callers retain the JSON convenience contract.

**Tech Stack:** Go 1.24, Gin, `mime/multipart`, Vue 3, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-13-ownapi-h3-reference-media-repair-design.md`

## Global Constraints

- Keep `POST /v1/videos`, OwnAPI API keys, opaque task IDs, polling, and content download stable.
- Keep 768p/2K text-only H3 requests on JSON.
- Use multipart upstream whenever H3 reference media or frames are present.
- Support HTTPS URLs, Base64 data URIs, and uploaded PNG/JPEG, MP4, and MP3 files.
- Enforce nine images, three videos, three audio files, twelve total inputs, per-type byte limits, audio-with-image, and frame exclusivity before calling or billing.
- Do not expose DC-API credentials, hostname, raw errors, or private task IDs.
- Do not alter Wan request encoding, routing, prices, or production credentials.
- Do not rewrite historical usage. Do not run a paid production test more than once.

---

### Task 1: Bounded H3 customer request parser

**Files:**
- Create: `backend/internal/handler/h3_media.go`
- Create: `backend/internal/handler/h3_media_test.go`
- Modify: `backend/internal/handler/video_handler.go`

**Interfaces:**
- Produces: `parseVideoCreateRequest(*http.Request) (map[string]any, *h3MediaRequest, error)` and `h3MediaRequest.HasMedia() bool`.
- Produces: typed media values containing either an HTTPS text value or bounded bytes, MIME type, and safe filename.
- Consumes: existing model aliases and duration/resolution normalization.

- [ ] **Step 1: Write failing parser tests**

Add table tests proving JSON strings/arrays/object URLs, direct multipart repeated fields, file uploads, data-URI decoding, and scalar aliases normalize into one representation. Add explicit failures for malformed Base64, HTTP URLs, bad MIME/signature, oversize files, count limits, audio without an image, and frames mixed with reference media.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `cd backend && go test ./internal/handler -run 'Test(ParseVideoCreateRequest|ValidateH3Media)' -count=1`

Expected: compile/test failure because the parser does not yet exist.

- [ ] **Step 3: Implement the bounded parser**

Use `http.MaxBytesReader`/`multipart.Reader`, `io.LimitReader`, `mime.ParseMediaType`, Base64 streaming decode, `http.DetectContentType`, and exact allowlists:

```go
const (
    maxH3ImageBytes = 20 << 20
    maxH3VideoBytes = 50 << 20
    maxH3AudioBytes = 15 << 20
)

type h3MediaValue struct {
    Text string
    Data []byte
    MIME string
    Name string
}

type h3MediaRequest struct {
    Images, Videos, Audios, FirstFrames, LastFrames []h3MediaValue
}
```

Return customer-safe typed validation errors so `VideosCreate` can respond with 400 before account selection.

- [ ] **Step 4: Run parser tests**

Run: `cd backend && go test ./internal/handler -run 'Test(ParseVideoCreateRequest|ValidateH3Media)' -count=1`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handler/h3_media.go backend/internal/handler/h3_media_test.go backend/internal/handler/video_handler.go
git commit -m "fix: parse H3 reference media safely"
```

### Task 2: Conditional DC-API encoding and billing protection

**Files:**
- Modify: `backend/internal/handler/h3_media.go`
- Modify: `backend/internal/handler/h3_media_test.go`
- Modify: `backend/internal/handler/video_handler.go`
- Modify: `backend/internal/handler/video_handler_test.go`
- Modify: `backend/internal/service/gateway_service.go`
- Test: `backend/internal/service/managed_upstream_test.go`

**Interfaces:**
- Consumes: `h3MediaRequest` from Task 1.
- Produces: `buildH3UpstreamRequest(map[string]any, *h3MediaRequest, int, string) ([]byte, string, error)` returning body and content type.
- Uses: `GatewayService.ForwardDCVideoWithContentType` without changing authentication or URL selection.

- [ ] **Step 1: Write failing encoder and handler tests**

Assert text-only creates return `application/json`; URL/file/data-URI media returns `multipart/form-data` with repeated fields and correct file MIME. Add a handler test where a 2xx create body has `{status:"failed"}` and assert no usage creation is attempted. Assert queued responses still create exactly one usage row. Assert Wan continues to send JSON through `ForwardAlibabaVideo`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd backend && go test ./internal/handler ./internal/service -run 'Test(H3Upstream|VideosCreate|AlibabaVideoRouting)' -count=1`

Expected: FAIL because H3 always forwards JSON and terminal create failures currently reach billing.

- [ ] **Step 3: Implement conditional encoding**

Build the control fields exactly once. If `HasMedia()` is false, marshal the current JSON payload. Otherwise encode controls and normalized media with `multipart.Writer`; write URLs as repeated text fields and bytes as file parts with an explicit `Content-Disposition` and `Content-Type`.

Call:

```go
resp, err = h.gatewayService.ForwardDCVideoWithContentType(
    ctx, account, http.MethodPost, "/v1/videos", upstreamBody, upstreamContentType,
)
```

After decoding a successful create response, reject `status == "failed"` before sealing the task or creating usage. Preserve sanitization.

- [ ] **Step 4: Run handler and service tests**

Run: `cd backend && go test ./internal/handler ./internal/service -run 'Test(H3Upstream|VideosCreate|AlibabaVideoRouting|ForwardDCVideo)' -count=1`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handler/h3_media.go backend/internal/handler/h3_media_test.go backend/internal/handler/video_handler.go backend/internal/handler/video_handler_test.go backend/internal/service/gateway_service.go backend/internal/service/managed_upstream_test.go
git commit -m "fix: forward H3 media as multipart"
```

### Task 3: Browser file uploads use FormData

**Files:**
- Modify: `frontend/src/components/models/MiniMaxVideoGenerator.vue`
- Modify: `frontend/src/components/models/__tests__/MiniMaxVideoGenerator.spec.ts`

**Interfaces:**
- Sends real browser `File` objects in `FormData` for H3 upload controls.
- Keeps JSON for media-free H3 and all Wan requests.
- Keeps bearer authentication but omits a manual `Content-Type` header for `FormData`.

- [ ] **Step 1: Write failing component tests**

Mock `fetch` and assert a selected H3 PNG, MP4, or MP3 produces `FormData` containing `input_reference`, `reference_videos`, or `reference_audios`; URL-only and text-only H3 requests remain valid; a multipart request has no manually supplied `Content-Type`. Assert Wan still posts JSON.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd frontend && node_modules/.bin/vitest run src/components/models/__tests__/MiniMaxVideoGenerator.spec.ts`

Expected: FAIL because uploads are currently converted to Base64 and JSON.

- [ ] **Step 3: Store File objects and build the correct request body**

Replace upload `FileReader` state with `File | null`. Add a small request builder that chooses `FormData` only for H3 requests containing local files, appends URL fields and aliases consistently, and returns bearer-only headers for multipart. Keep JSON for text/URL convenience calls and Wan.

- [ ] **Step 4: Run focused frontend tests**

Run: `cd frontend && node_modules/.bin/vitest run src/components/models/__tests__/MiniMaxVideoGenerator.spec.ts src/views/public/__tests__/ModelDetailView.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/models/MiniMaxVideoGenerator.vue frontend/src/components/models/__tests__/MiniMaxVideoGenerator.spec.ts
git commit -m "fix: upload H3 media with FormData"
```

### Task 4: Documentation, regression verification, and deployment

**Files:**
- Modify: `frontend/src/components/models/ModelCodeExamples.vue`
- Modify: `frontend/src/views/public/DocsView.vue`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh.ts`
- Modify: `AGENTS.md`
- Test: relevant model detail/docs tests.

**Interfaces:**
- Documents JSON for URL inputs and multipart for local file uploads.
- Records exact commits, validation, deployment run, and production result without credentials.

- [ ] **Step 1: Add documentation regression assertions**

Assert H3 examples show the unchanged OwnAPI URL/key boundary, valid multipart upload examples for PNG/MP4/MP3, polling, and download; assert no DC-API credential or private task endpoint appears.

- [ ] **Step 2: Update examples and copy**

Show one runnable URL-based JSON example and one multipart file example. State that reference audio must be paired with an image and list the count/size limits.

- [ ] **Step 3: Run complete local verification**

Run:

```bash
cd backend && gofmt -w internal/handler/h3_media.go internal/handler/h3_media_test.go internal/handler/video_handler.go internal/handler/video_handler_test.go internal/service/gateway_service.go internal/service/managed_upstream_test.go
cd backend && go test ./internal/handler ./internal/service ./internal/server -count=1
cd frontend && node_modules/.bin/vitest run src/components/models/__tests__/MiniMaxVideoGenerator.spec.ts src/views/public/__tests__/ModelDetailView.spec.ts
cd frontend && node_modules/.bin/vue-tsc --noEmit
cd frontend && node_modules/.bin/vite build
git diff --check
```

Expected: all commands PASS; known unrelated warnings may remain non-fatal.

- [ ] **Step 4: Commit and push**

```bash
git add frontend/src/components/models/ModelCodeExamples.vue frontend/src/views/public/DocsView.vue frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh.ts AGENTS.md
git commit -m "docs: document H3 media uploads"
git push origin HEAD
```

- [ ] **Step 5: Integrate to main and deploy**

Fast-forward the verified commits to `origin/main` without staging protected untracked files. Monitor the existing Build and Deploy workflow, confirm the commit-tagged container is healthy, and preserve the prior image for rollback.

- [ ] **Step 6: Production verification**

Run the non-billing H3 account connection check first. Then issue exactly one authorized cheapest H3 request: 5 seconds, 768p, one small PNG reference, short safe prompt. Confirm task creation, polling, completion, OwnAPI content download, one usage row, correct customer charge, and no private upstream data exposure. Do not repeat the paid request if it succeeds.

- [ ] **Step 7: Record deployment checkpoint**

Update `AGENTS.md` with the deployed revision, Actions run/image, validation results, paid test cost/result, and rollback state; commit and push that checkpoint.
