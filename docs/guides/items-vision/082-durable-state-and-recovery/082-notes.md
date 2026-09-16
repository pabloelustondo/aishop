# 082 - Vision Agent Durable State and Recovery

This slide explains how the Agent prevents stale asynchronous work from
overwriting a cancelled or restarted analysis.
It also separates recovery of unfinished byte transfer from processing recovery.

## Durable states
Video reservation creates an uploading analysis record.
After source verification, complete moves it to processing.
The worker may briefly mark uploaded after frame preparation.
Background model work marks analyzing, then analyzed with a report.
Failed and cancelled are recorded terminal outcomes.
GET detail exposes the current state and safe diagnostics.
The browser can restore that state after refresh without re-creating the record.

## Version and attempt fences
Each persisted transition increments a record version.
The client should GET the latest version before versioned cancel or restart.
A stale version can return an outcome of changed even with HTTP 200.
Each video attempt has an attempt ID carried to the worker and task payload.
Frame paths include that ID. Provider runs have their own run identifiers.
Store transitions check attempt and run identity before accepting late results.
Cancellation clears the active attempt; restart creates a new attempt.
Late work from the cancelled attempt must not settle the restarted record.

## Recovery operations
`POST /v1/agent/video-uploads/{id}/session` renews an uploading Storage session.
It does not promise to retain bytes from the previous session.
If the first transfer never finished, the client may need to select the file again.
`POST /v1/agent/analyses/{id}/cancel` retains evidence and history.
Cancellation requests best-effort task/provider cleanup after state settlement.
Running external work might still cost money.
For a cancelled video whose source is complete, `POST /{id}/restart`
re-enters processing with a new attempt and re-extracts frames.
It is not a generic image restart or repair for missing upload bytes.
A fresh start after an incomplete upload is client orchestration with a new ID.

## Current gaps
The reconciler only reschedules overdue provider collection.
It is not a stalled-upload or processing sweeper.
Video retry/refinement through the public `/run` route is an open attempt-ID gap.
The recorded live video source GET returned 500; do not promise playback.
The current browser recovery action needs its own hosted acceptance check.

## Sources
- `docs/guides/vision-agent-api/08-recovery.md`
- `docs/guides/vision-agent-api/11-limits-and-gaps.md`
- `docs/guides/vision-agent-api/12-architecture-implementation.md`
- `docs/guides/vision-agent-api/developer-guide.md` (draft)
- `server/src/agent-analysis-store.js`, `server/src/agent-api-handler.js`
