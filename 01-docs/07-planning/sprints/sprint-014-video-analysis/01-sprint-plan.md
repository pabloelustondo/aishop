# Sprint 014 — Shelf Video Analysis

Date: 2026-09-14. Status: PROPOSED; approval requires Pablo's commit.

## Goal

An authorized Agent user uploads one shelf video and receives one durable, consolidated product-and-facing report derived from representative video frames.

## User experience

- The Agent page accepts JPEG photographs plus MP4 and QuickTime videos.
- Upload progress appears immediately; duplicate submission is disabled.
- Refresh, closure or reconnect resumes from durable server state after acceptance.
- My Runs and All Runs identify video evidence, show progress and play the source.

## Scope

- Authorize a private resumable Cloud Storage upload and validate its type, signature, container, duration and dimensions before AI spend.
- Support common iPhone QuickTime/H.264 and browser MP4/H.264 evidence in TEST.
- Extract a bounded, deterministic set of JPEG frames in a separate server-owned processing step.
- Persist original-video identity, extraction manifest, progress, failures and derived-frame references server-side.
- Send the selected frames together through the existing strict-schema, stored background response path.
- Consolidate overlapping views into one report without knowingly counting the same visible facing twice.
- Keep task delivery and settlement idempotent; refresh or retry creates no duplicate provider request.
- Preserve owner/admin authorization, private evidence, redacted diagnostics and existing JPEG behavior.
- Derive initial size, duration and frame ceilings from platform limits and recorded real shelf-video QA evidence.

## Acceptance

- A real iPhone MOV and a real MP4 complete from selection through report in TEST.
- One recorded test is at least 60 seconds or 150 MB; any lower rejection boundary is evidenced and documented.
- Closing the page during upload can resume the transfer; closing it after acceptance cannot stop processing.
- Repeated finalize, task and refresh operations do not duplicate evidence, frames, provider work or settlement.
- Invalid, truncated and unsupported videos fail with useful messages before provider spend.
- A repeated or overlapping view fixture demonstrates the consolidation rule and exposes sampled timestamps.
- Authorized owners and admins can play the private source; other accounts cannot read it.
- Existing photograph upload, background processing, My Runs and All Runs regressions pass.
- TEST evidence correlates the upload, stored object, extraction, provider response and terminal record.

## Boundaries and estimate

No live camera streaming, audio analysis, transcription, native iOS change, automatic video editing or production deployment.
Recognition-quality benchmarking remains separate; this sprint proves the video path and honest traceability.
Expected implementation: 4–7 engineering days, driven by resumable transfer, safe server extraction and recovery—not the file-picker UI.
New storage processing, IAM, billing, TEST deployment and retention changes require separate approval.

## Gates

Pablo commits this plan first. Then create and approve a separate component-scoped Sprint Plan Tasks document on this branch.
Coding starts only after both approvals.
