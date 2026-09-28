# Sprint 014 — Sprint Plan Tasks

Date: 2026-09-14. Status: PROPOSED; approval requires Pablo's commit.
Prerequisite: Sprint Plan approved at `13f5c86`.

## Fixed implementation decisions

- Keep Node/Firebase as the control and processing runtime; add no Python or Cloud Run service.
- A private task function runs a bundled FFmpeg executable; if its deployment or real fixture probe fails, stop and amend the plan.
- The authorized API reserves one owner-scoped analysis and initiates one Cloud Storage resumable session.
- The browser transfers chunks to the opaque HTTPS session URI; the URI is never listed, logged or stored in public analysis data.
- Original video and derived frames remain private immutable objects under the analysis identity.
- Video lifecycle is `uploading → processing → analyzing → analyzed | failed`; photograph lifecycle remains unchanged.
- Frame selection is deterministic, ordered and bounded by a server configuration justified with recorded QA evidence.
- One provider background request receives all selected frames with timestamps and the existing strict area-scan schema.
- A separate video instruction treats frames as one continuous shelf scan and counts each physical facing once across overlapping views.
- Existing owner/admin GET routes expose durable progress and a sanitized frame manifest, never task or provider secrets.

## Ordered component-scoped tasks

1. **Video extraction runtime.** Add the pinned FFmpeg dependency, executable probe and small MOV/MP4 fixtures; prove local extraction and record package/runtime size before other code.
2. **Video upload record.** Extend the analysis store and tests with upload/processing states, expected metadata, immutable object identity and idempotent transitions.
3. **Resumable upload API.** Add authenticated create/status/complete operations and tests; bind owner, object path, declared metadata and origin to one expiring session.
4. **Video transfer presentation.** Extend Agent HTML/script/styles and behavior tests with MOV/MP4 selection, chunk progress, retry/resume state and duplicate-submit prevention.
5. **Video evidence validator.** Add a server component and tests that distrust metadata, inspect completed bytes/container, enforce evidenced ceilings and reject before provider spend.
6. **Frame extractor.** Add a pure adapter and tests that selects deterministic timestamps, invokes FFmpeg safely and writes ordered JPEG frames plus hashes without overwriting.
7. **Video processing task.** Add a private task composition and tests that leases work, validates, extracts once, records the manifest and dispatches analysis idempotently.
8. **Video prompt contract.** Add and test a versioned instruction for ordered frames, timestamps, overlap, duplicate avoidance, uncertainty and sampled-video limitations; keep photograph prompts unchanged.
9. **Multi-frame provider adapter.** Extend background-start tests and request construction to send ordered timestamped image inputs while preserving strict output and control-call deadlines.
10. **Video run orchestration.** Extend the runner and tests to read verified frames, start one provider response, preserve retry/refine inputs and settle through the existing collector.
11. **Source evidence API.** Extend owner/admin source handlers and tests to stream the original media with its verified content type and no public Storage URL.
12. **Video results presentation.** Render playable private video, processing/waiting states and sampled timestamps in My Runs and All Runs; refresh reconstructs server state.
13. **Operational configuration.** Add versioned CORS/config validation and deployment notes; any bucket CORS, IAM, billing or function deployment remains separately approved.
14. **Reference contract.** Update Agent API and architecture references with upload session security, states, media support, sampling semantics, limits and failure recipes.
15. **E2E gate.** Extend the emulator composition for interrupted/resumed upload, invalid media, duplicate events/tasks, extraction, one provider start, authorization and JPEG regression.

## Validation and release boundary

Run server unit tests, dashboard behavior tests, the complete emulator E2E gate, FFmpeg fixture probes, diff checks and governed-file line checks.
Then perform approved TEST deployment with real iPhone MOV and MP4 evidence, including the large/long acceptance case and an overlapping shelf view.
Deployment, bucket CORS, IAM, billing, merge and release remain separate approvals.

## Gate

Pablo reviews and commits this document before coding begins on this branch.
