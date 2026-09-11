# OwnAPI Wan 3.0 Video Integration Design

## Objective

Add `wan3.0-video` and `wan3.0-video-prime` as production video models while preserving OwnAPI as the only customer-visible gateway. Customers authenticate with an OwnAPI API key and use the existing OwnAPI video lifecycle:

```text
POST /v1/videos
GET /v1/videos/{task_id}
GET /v1/videos/{task_id}/content
```

Alibaba Cloud credentials, Workspace identifiers, hostnames, task identifiers, errors, and result URLs must remain private.

## Scope

The release includes:

- Public catalog entries and model detail pages for both Wan models.
- Authenticated playground support on both model pages.
- OwnAPI documentation and Python, TypeScript, and cURL lifecycle examples.
- A private Alibaba DashScope video adapter for create, retrieve, and content download.
- Exact per-resolution customer billing and upstream-cost reporting.
- Admin account support for a dedicated Alibaba video account.
- Local automated verification, a minimum-cost upstream smoke test after explicit confirmation, and production deployment.

The release does not add a customer-visible Alibaba-compatible endpoint, expose smart duration, or mix Wan traffic with the MiniMax H3 account.

## Customer Contract

### Create request

The existing JSON endpoint accepts these Wan fields:

- `model`: `wan3.0-video` or `wan3.0-video-prime`.
- `prompt`: conditionally required; either a non-empty prompt or at least one media input must be present.
- `duration`: required whole number from 2 through 30 seconds.
- `resolution`: `480P`, `720P`, or `1080P`.
- `ratio`: `adaptive`, `16:9`, `4:3`, `1:1`, `3:4`, or `9:16`.
- `audio`: optional boolean, default `true`.
- `seed`: optional integer from `-1` through `2147483647`.
- `prompt_extend`: optional boolean, default `true`.
- `watermark`: optional boolean, default `false`.
- `first_frame_image` and `last_frame_image` for first/last-frame generation.
- `reference_images`, `reference_videos`, and `reference_audios` for reference generation.
- `file` or `link` for the provider's additional multimodal input forms.

The API accepts URL or data-URI media values where the existing OwnAPI request-size limit permits them. The handler enforces provider combination rules before sending a paid request:

- At most 10 reference images.
- At most 5 reference videos.
- At most 5 reference audio files.
- At most 20 multimodal reference items in total.
- First/last-frame inputs cannot be combined with reference, file, or link inputs.
- First/last-frame mode cannot include any other media type. The output-audio parameter may still be set because it controls generated audio rather than an input asset.
- `file` and `link` are mutually exclusive.

The first release rejects `duration=-1`. Smart duration cannot be billed accurately before task creation and therefore requires a future completion-time adjustment design.

### Response lifecycle

Create returns an encrypted OwnAPI task ID. The task envelope binds the task to the creating user, managed account, requested model, adapter kind, and expiry. Existing MiniMax H3 envelopes without an adapter field remain readable as DC-API tasks.

Alibaba statuses are normalized as follows:

| Alibaba status | OwnAPI status |
| --- | --- |
| `PENDING` | `queued` |
| `RUNNING` | `in_progress` |
| `SUCCEEDED` | `completed` |
| `FAILED`, `CANCELED`, `UNKNOWN` | `failed` |

Completed retrieve responses expose only an OwnAPI content URL. The content endpoint looks up the upstream result server-side and streams the bytes to the customer. It never redirects to or returns Alibaba's temporary `video_url`.

## Backend Architecture

### Provider identity and account validation

Add a dedicated managed-upstream provider identifier for Alibaba DashScope video. The account uses the OpenAI platform only as an existing admin/account storage category; it is excluded from every text scheduler.

Credentials contain a private API key, a Workspace `/api/v1` base URL, and an exact `model_mapping` whitelist containing only the two Wan model IDs. Validation rejects compatible-mode `/v1` roots, service resource paths, wildcard mappings, unknown models, missing credentials, and non-HTTPS URLs.

The production key is entered through protected account configuration. It is never stored in Git, migrations, fixtures, logs, or browser state.

### Adapter boundary

The video handler selects an adapter from the requested model:

- `MiniMax-H3` uses the existing DC-API adapter.
- Both Wan model IDs use the Alibaba DashScope adapter.
- Every other model fails closed.

Each adapter owns request translation, upstream create and retrieve paths, task-ID extraction, status normalization, result-content retrieval, and response sanitization. Selection and retrieval validate the account provider and exact model whitelist again, so a stale or edited account cannot cross-route a task.

### Alibaba request translation

Create is sent to:

```text
POST {workspace_api_root}/services/aigc/video-generation/video-synthesis
```

with server-managed `Authorization`, `X-DashScope-Async: enable`, and JSON headers. OwnAPI translates the stable request into Alibaba's `input.prompt`, optional `input.media`, and `parameters` object.

Retrieve is sent to:

```text
GET {workspace_api_root}/tasks/{upstream_task_id}
```

The adapter extracts `output.video_url` only after `SUCCEEDED`. Content download uses a restricted server-side HTTP fetch of that exact returned HTTPS URL with redirect and private-network protections. The URL is never serialized into a customer response or usage record.

All non-success Alibaba bodies are replaced by generic OwnAPI errors. Logs contain only safe request identifiers, account IDs, model IDs, status codes, and task-state metadata.

## Pricing and Billing

Public comparison prices use the current US (Virginia) manufacturer list prices. Both models display an OwnAPI price of list price multiplied by `0.8`; Alibaba's temporary discount on the standard model does not change this basis.

| Model | Resolution | US list price | OwnAPI base price |
| --- | ---: | ---: | ---: |
| `wan3.0-video` | 480P | $0.041256/s | $0.0330048/s |
| `wan3.0-video` | 720P | $0.082513/s | $0.0660104/s |
| `wan3.0-video` | 1080P | $0.165025/s | $0.1320200/s |
| `wan3.0-video-prime` | 480P | $0.0636/s | $0.05088/s |
| `wan3.0-video-prime` | 720P | $0.127199/s | $0.1017592/s |
| `wan3.0-video-prime` | 1080P | $0.254399/s | $0.2035192/s |

Customer charge is:

```text
duration × OwnAPI base price × resolved customer/model multiplier
```

The existing precedence remains unchanged: customer/model override, then customer/group override, then group multiplier, then `1.0`.

Upstream account cost uses the quoted RMB prices independently of customer pricing, normalized at `6.7 CNY = 1 USD`:

| Model | Resolution | Quoted upstream cost | Normalized account cost |
| --- | ---: | ---: | ---: |
| `wan3.0-video` | 480P | ¥0.165/s | $0.0246268657/s |
| `wan3.0-video` | 720P | ¥0.330/s | $0.0492537313/s |
| `wan3.0-video` | 1080P | ¥0.660/s | $0.0985074627/s |
| `wan3.0-video-prime` | 480P | ¥0.2925/s | $0.0436567164/s |
| `wan3.0-video-prime` | 720P | ¥0.585/s | $0.0873134328/s |
| `wan3.0-video-prime` | 1080P | ¥1.170/s | $0.1746268657/s |

Billing is finalized only after a successful upstream task creation, matching MiniMax H3 behavior. Insufficient balance is rejected before the paid upstream request. Usage history records the public task ID, requested model, customer charge, account cost, multiplier, resolution, and duration without upstream identifiers.

## Frontend and Documentation

The public catalog adds both Wan entries under Alibaba and Video. Cards and detail pricing show the US list price, the 8-discount label, and all three resolution prices.

The authenticated playground reuses the video-generation experience but renders capabilities from the selected model. Wan exposes duration 2–30, three resolutions, ratio, audio, seed, prompt extension, watermark, and compatible reference inputs. H3 retains its existing limits and controls.

The public Docs video section becomes provider-neutral and documents the shared lifecycle first, then model-specific parameters and media constraints. Detail-page code examples generate filenames from the selected model and include only fields that model supports.

## Failure Handling

- Unsupported model or invalid parameter combinations fail before account selection.
- Missing or unschedulable Alibaba accounts return `video_unavailable` without naming the provider.
- Upstream authentication, validation, throttling, and server errors return sanitized OwnAPI errors.
- A successfully created task whose billing write fails returns the existing billing-finalization error and is logged for reconciliation.
- Expired or foreign task IDs return `video_not_found`.
- Missing or expired upstream video content returns a sanitized content-unavailable response.

## Verification and Release

Backend tests cover account validation, scheduler exclusion, model-to-adapter routing, request translation, parameter/media validation, task sealing compatibility, status mapping, error sanitization, content proxying, customer billing, account cost, and usage history.

Frontend tests cover catalog lookup/filtering, 8-discount pricing, model-specific playground controls, request construction, polling/download, localized documentation, and code examples. Run the focused suites, full frontend suite, Vue type checking, production build, relevant Go packages, migration tests, and `git diff --check`.

After local automated checks pass, configure the Alibaba account outside Git. Before a paid smoke test, state the exact lowest-cost request and obtain confirmation. Verify that the task reaches Alibaba, completes, downloads through OwnAPI, charges the expected customer amount, records the expected account cost, appears in usage history, and exposes no upstream information. Then push `main`, deploy through the existing workflow, verify health and public/authenticated routes, and repeat only the minimum production check needed.
