# Agent Video Analysis

**Status: IMPLEMENTED IN SPRINT 014; TEST deployment pending.**

## Durable flow

1. An authenticated Agent reserves a record in `uploading` with name, media type and expected bytes.
2. The server creates an origin-bound resumable Cloud Storage session and returns only its opaque URI.
3. The browser sends MP4 or MOV bytes directly to private Storage and can query the session offset after interruption.
4. Completion verifies the stored object and advances Firestore to `processing` before dispatching a private task.
5. The task validates H.264, size, duration and dimensions with bundled FFmpeg, then extracts bounded JPEG samples at deterministic timestamps.
6. Immutable frame metadata is stored before the record becomes `analyzing` and starts one stored OpenAI background response.
7. The [server-owned collector](architecture-15-option-b-queue-and-worker.md) validates the video schema and settles `analyzed` or `failed` idempotently.
8. My Runs and All Runs read Firestore state; refresh never restarts upload, processing or provider work.

## Invariants and boundaries

- Firestore is authoritative for `uploading → processing → analyzing → analyzed|failed`, frame manifest, provider mode and report.
- Source video, extracted frames, resumable URI, Storage names and provider response ID remain private.
- The provider receives ordered sampled frames with timestamps, never the video container.
- `videoAreaScan` tells the model to use motion and adjacent samples, deduplicate overlap and state uncertainty; it returns the existing strict area report.
- At-least-once video and collection task delivery cannot create a second provider response.
- JPEG upload and analysis retain their existing route and behavior.
- Current acceptance is MP4/QuickTime, H.264, at most 250 MiB, 120 seconds and 4096 px per axis; at most 12 frames are sampled.
- Applying bucket CORS, deploying functions/hosting and any resulting IAM or billing action remain separately approved operational steps.
