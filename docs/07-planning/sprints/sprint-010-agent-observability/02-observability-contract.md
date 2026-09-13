# Sprint 010 — Proposed Observability Contract

Date: 2026-09-08. Status: PROPOSED; companion to [the plan](01-sprint-plan.md).

## Correlation and event envelope

- Server generates `requestId`; returns it in a response header and safe error body.
- Assign immutable `runId` when a run is reserved; bind `analysisId`, `runNumber` and provider `attempt`.
- Use server references in the page; no new client event collection in this increment.
- Events carry schema version, UTC timestamp, severity, event name, environment, service and release commit.
- Explicitly map validated platform trace/span context into structured log fields; verify linkage live.
- Include available request/run IDs, method and fixed route template; absent IDs stay null for rejected requests.

## Events and timing

- `request.started/completed`, `run.started/completed/failed`, `stage.started/completed/failed`.
- `provider.completed/failed`, `persistence.failed`; inspect overdue persisted runs with a read-only procedure.
- Stage names are a finite allowlist; durations use a monotonic clock in milliseconds.
- Request completion carries HTTP status; run completion carries business outcome, independent of HTTP status.
- A terminal run event represents durable settlement; a settlement failure is reported separately.
- Preserve original failure class and secondary persistence failure class without raw exception serialization.
- No success sampling in TEST initially; bound event count and payload size per request.

## Provider and configuration fields

- Requested/returned model, mode, timeout, output-token limit and reasoning setting when configured.
- Prompt/schema versions, preprocessing version or not-applicable, and release commit.
- Provider HTTP status, bounded allowlisted error code/type, request ID, response ID and retry-after metadata.
- Transport/timeout/HTTP/refusal/incomplete/JSON/schema categories; retain safe response status and incomplete reason.
- Input/output and available cached/reasoning tokens with documented non-overlapping accounting.
- Usage and actual model are nullable; retain available metadata before report validation, including partial failures.
- Cost estimation is deferred; token usage alone is not a monetary cost or proof of output truncation.
- Report summary: product-row count, facing total, uncertainty count; none measures correctness.

## Persistence, client and data boundaries

- Persist compact per-run diagnostics; defaults support legacy records.
- Logs contain no keys, tokens, user IDs, owner hashes, image bytes, filenames, notes or report/evidence text.
- Never log raw provider bodies, headers, URLs or exception messages; sanitize selected fields and enforce length limits.
- Opaque correlation IDs remain restricted operational metadata; never use them as metric labels.
- Preserve existing analyzer callers through an explicit compatible diagnostics interface, with regression tests.
- Network failures without a server response may lack a reference; explain this honestly in the page.
- Structured logging must carry explicit severity and trace fields; a logger import alone is not acceptance.

## Investigation queries and deferred work

- Provide queries for request/run IDs, failure classes and stage/provider durations, with example evidence.
- Document data freshness and missing usage; missing events or no traffic are not evidence of success.
- Document read-only inspection of analyzing runs older than 5 minutes; do not auto-retry paid work.
- Dashboards, log-based metrics, alerts and client collection require later scope; saved queries create none of them.
