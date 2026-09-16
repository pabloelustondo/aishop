# Sprint 014 — Upload Cancellation and Recovery Addendum

Status: Proposed; approval is Pablo's commit. Extends the Sprint 014 plan.

## Goal

Give users a clear exit from interrupted video uploads and let administrators
resolve abandoned upload records without a backend restart. This covers the
`uploading` stage; [04](04-analysis-cancellation-plan.md) covers every later one.

## User actions

- Cancel upload stops this page's transfer and atomically cancels an owned
  record only while its server state is `uploading`.
- Start fresh cancels the interrupted upload, clears its browser session,
  and reserves a new analysis with a new object path for the selected file.
- Resume upload is explicit; the page never silently chooses a saved session.
- Cancellation clears the saved session in the acting browser; other browsers
  discard a stale one when they next check server state.
- Cancelled records remain visible as history with no activity spinner.

## Administrator cleanup

- An admin-only action previews unfinished uploads with no recorded server
  activity for at least 24 hours; the preview lists identities and timestamps.
- Server inactivity cannot prove a direct Storage transfer has stopped;
  the preview states this and the administrator selects the records to cancel.
- Confirmation submits exact selected identities and record versions.
- The server rechecks admin authority, version and `uploading` state for each
  selected record and reports cancelled, changed, skipped and failed outcomes.
- Cleanup cancels records; it does not delete stored evidence or history.

## State and race handling

- Cancellation is durable, authorized and idempotent.
- Cancellation and completion compete atomically; only one transition wins.
- A cancelled record cannot renew, finalize, enqueue processing or spend on AI.
- Attempt to invalidate its Storage session; report cleanup failures without
  reverting cancellation. Late bytes cannot revive a cancelled analysis.
- Backend state remains authoritative after refresh and across browser tabs.

## Acceptance and gates

- Test owner/admin isolation, repeated cancellation, completion races, stale
  previews, rejected sessions, fresh object identity and JPEG regressions.
- Verify resume, cancel, start fresh and confirmed cleanup through the UI.
- Preserve existing upload diagnostics; this does not claim to fix Storage 400.
- No live cleanup occurs as part of implementation or deployment.
- After Pablo commits this addendum, draft a separate component-scoped task
  addendum; its commit is required before implementing this added scope.
