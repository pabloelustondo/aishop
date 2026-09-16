# Agent API — 4. Analysing one video

Video uses a three-stage resumable protocol so large bytes do not cross Firebase Hosting or the API function. Base: `https://aishop-99d36.web.app` (TEST). Obtain the Firebase ID token from [01](01-getting-a-token.md).

## 1. Reserve an upload

`POST /v1/agent/video-uploads`, with `Authorization: Bearer {idToken}`, `Content-Type: application/json`, and the browser's exact `Origin` header:

```json
{"fileName":"shelf.mov","mediaType":"video/quicktime","byteLength":154701233}
```

MP4 uses `video/mp4`. A `201` response contains `analysis.status: "uploading"`, `analysis.analysisId`, and `upload.uri`. The URI is a temporary write capability: keep it private, never log it, and persist it locally only when resume is required.

## 2. Transfer directly to Storage

Send ordered byte ranges to `upload.uri` with `PUT`, the declared media type, and `Content-Range: bytes {first}-{last}/{total}`. Production resumable uploads answer `308` until complete and report committed bytes in `Range`; the final chunk answers `200` or `201`. After interruption, query the same URI with `PUT`, `Content-Length: 0`, and `Content-Range: bytes */{total}`, then continue after the returned range. Do not reserve another analysis unless the session is irrecoverably expired.

The shipped Agent page uses 8 MiB chunks and identifies a resumable local entry by file name, size, media type and last-modified time. The session is still server-bound to the authenticated owner, analysis record, expected bytes and web origin.

## 3. Complete and observe

After Storage accepts all bytes, call `POST /v1/agent/video-uploads/{analysisId}/complete` with the Firebase token. The answer is the durable analysis, normally `processing`. Repeating completion or a private task is safe; it cannot start a second provider response.

Poll `GET /v1/agent/analyses/{analysisId}` every 15 seconds while status is `uploading`, `processing` or `analyzing`. Stop on `analyzed` or `failed`. Firestore owns progression, so refresh, page closure or another authorized page changes only observation. `GET .../{analysisId}/source` streams the private original video with `Cache-Control: private, no-store`.

## Server processing and report

The private video task downloads the original once, validates it with bundled FFmpeg, and deterministically samples at most 12 JPEG frames across its duration. Frame paths, timestamps, hashes and dimensions become an immutable private manifest before one OpenAI background response starts. Ordered timestamped frames use `videoAreaScan`: the prompt deduplicates products visible in overlapping samples and treats motion, position, neighbours and packaging as evidence while recording ambiguity.

The final strict report has the same shape as a photograph: `summary`, `identifiedProducts[]` (`name`, `count`, `confidence`, `visibleEvidence[]`) and `uncertainItems[]`. It describes sampled evidence, not a frame-perfect inventory of everything that may occur between samples.
