# OwnAPI MiniMax H3 Reference Media Repair Design

## Status

Approved in conversation on 2026-09-13. This document defines the repair boundary before implementation.

## Problem

OwnAPI's MiniMax H3 text-to-video path still works at both 768p and 2K, but requests containing a reference image fail immediately. Production evidence shows that these requests reach `POST /v1/videos`, create customer usage rows, and then return a sanitized `task_failed / Video generation failed` response.

The current browser uploads media as a Base64 data URI. The backend places that value in a JSON `input_reference` field and sends JSON to DC-API. The current MiniMax H3 media contract instead requires `multipart/form-data`: reference images must be HTTPS text fields or PNG/JPEG file parts, and reference video/audio must be repeated text or file parts. This mismatch affects both the website playground and customers calling OwnAPI directly.

An earlier production probe established that DC-API accepts JSON for text-only H3 requests while a text-only multipart probe returned an upstream 500. The repair must therefore preserve the verified JSON path for text-only traffic and use multipart only when the request contains media.

## Goals

- Keep the public OwnAPI endpoint and customer API keys unchanged.
- Preserve working 768p and 2K text-to-video requests.
- Support H3 reference images, reference videos, reference audio, and first/last frames.
- Accept both OwnAPI JSON convenience requests and direct customer multipart requests.
- Accept reference media as public HTTPS URLs, Base64 data URIs, or uploaded files where the media type permits it.
- Keep DC-API credentials, hostname, task IDs, and raw errors private.
- Avoid charging a customer when the create response is already terminally failed.
- Leave the independent Wan 3 Alibaba JSON adapter unchanged.

## Non-Goals

- No production credential or account changes.
- No automatic edits to historical usage or balance records.
- No paid production smoke test without separate approval.
- No change to H3 or Wan customer prices.
- No change to task polling, opaque task envelopes, or OwnAPI content download URLs except as required by regression fixes.

## Customer Contract

`POST /v1/videos` continues to authenticate with the customer's OwnAPI API key.

### JSON input

The existing JSON contract remains supported:

- `model`: `MiniMax-H3`
- `prompt`
- `duration` or `seconds`
- `resolution` (`768p` or `2K`) or an accepted explicit `size`
- `reference_images` or `input_reference`
- `reference_videos`
- `reference_audios`
- `first_frame_image` or `first_frame`
- `last_frame_image` or `last_frame`

Media values may be a string, a repeated array of strings, or an object containing `url`. HTTPS URLs stay text values. Supported Base64 data URIs are decoded into real multipart file parts before forwarding.

### Multipart input

Customers may send `multipart/form-data` directly to the same endpoint. Scalar controls may use either OwnAPI convenience names (`duration`, `resolution`) or provider-compatible names (`seconds`, `size`). Media fields may be repeated and may contain either text values or uploaded files.

The server normalizes both customer encodings into one internal H3 request representation. It never forwards the customer Authorization header upstream.

## Routing and Transformation

The H3 adapter chooses the upstream encoding after parsing and validation:

1. A request containing no media uses the existing verified JSON request to DC-API.
2. A request containing any reference image, reference video, reference audio, first frame, or last frame uses `multipart/form-data`.
3. HTTPS media values become repeated multipart text fields.
4. Base64 data URIs become typed file parts with generated safe filenames.
5. Customer-uploaded files are streamed/copied into typed upstream multipart file parts.
6. Reference image aliases normalize to upstream `input_reference`; first/last-frame aliases normalize to `first_frame` and `last_frame`.
7. Wan models continue through the existing Alibaba JSON adapter and must never enter the H3 multipart transformer.

The DC-API base URL and server-side API key continue to come only from the managed `dc-api` account. Responses remain sanitized and customer task IDs remain encrypted OwnAPI envelopes.

## Validation and Limits

Validation occurs before selecting or calling an upstream account:

- Prompt is required.
- Duration is a whole number from 5 through 15 seconds.
- Resolution/size must map to a documented H3 size. The existing defaults remain `1344x768` for 768p and `2544x1456` for 2K.
- Reference images: PNG or JPEG, at most nine, at most 20 MiB per uploaded/decoded file.
- Reference videos: MP4, at most three, at most 50 MiB per uploaded/decoded file.
- Reference audio: MP3, at most three, at most 15 MiB per uploaded/decoded file.
- Total reference inputs: at most twelve.
- Reference audio requires at least one reference image.
- First/last frames accept PNG and cannot be mixed with reference image, video, or audio fields.
- URL inputs must be direct HTTPS values. OwnAPI does not fetch customer URLs during request parsing; DC-API resolves them.
- Declared MIME type, data-URI MIME type, filename extension, and sniffed file signature are checked where bytes are available. Unsupported or malformed media returns a customer-safe 400 before any upstream request or charge.

Provider-side duration/codec checks for remote URLs remain authoritative because OwnAPI does not download arbitrary customer URLs merely to inspect them.

## Billing and Failure Semantics

The existing preflight balance check remains unchanged. A usage row and balance deduction occur only after DC-API returns a successful create response containing a task ID.

If that same create response is already terminally `failed`, OwnAPI returns the sanitized failure without creating usage or deducting balance. A queued/running task that fails later keeps the existing billing semantics because provider charging for asynchronous work is not known at create time; changing that policy requires a separate reconciliation design.

Historical failed usage rows are not modified automatically.

## Error Handling and Privacy

- Parsing and media validation errors return specific OwnAPI 400-class errors without contacting DC-API.
- Missing schedulable H3 accounts return the existing sanitized availability error.
- DC-API transport and non-2xx responses remain sanitized.
- Raw DC-API bodies may be recorded only in server-side structured logs with secrets removed; they must not appear in customer responses, usage pages, or frontend state.
- The generic customer failure response may include a stable OwnAPI error code, but never the upstream hostname, credential, or private task ID.

## Frontend

The H3 playground keeps its current controls. Uploaded images, videos, audio, and frames are sent as browser `FormData` instead of being embedded in JSON. URL-only and text-only usage remains supported. The frontend must not set a multipart `Content-Type` boundary manually.

The displayed task state must distinguish request validation errors from asynchronous task failures. It must not claim a task was submitted when the server rejected it before upstream creation.

## Verification

Backend tests must cover:

- text-only 768p and 2K requests remain JSON;
- HTTPS reference images become repeated multipart text fields;
- Base64 PNG/JPEG references become valid multipart file parts;
- HTTPS, data-URI, and uploaded MP4 reference video inputs;
- HTTPS, data-URI, and uploaded MP3 reference audio paired with an image;
- multipart customer requests with repeated media fields;
- first/last-frame aliases and exclusivity;
- MIME, Base64, count, size, duration, resolution, and audio-without-image rejection;
- immediate failed create responses do not create usage or deduct balance;
- queued/success create responses still create one idempotent usage row;
- customer and upstream credentials remain separated;
- Wan 3 requests remain JSON and use only the Alibaba adapter.

Frontend tests must cover `FormData` construction for each upload type, URL-only requests, text-only requests, error rendering, and no manual multipart boundary.

Local verification includes focused Go tests, the full affected backend handler/service tests, focused frontend tests, Vue type checking, production frontend build, formatting, and `git diff --check`. Production verification begins with a non-billing account connection check. Any paid H3 request requires separate user approval and must use the cheapest case that exercises the repaired media path.
