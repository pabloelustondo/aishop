# Sprint 010 — Capacity Extension Validation

Date: 2026-09-08. Approved baseline `fd96df7`; branch `codex/sprint-010-agent-observability`.
Implementation is local and uncommitted; deployment remains pending.

## Implemented

- Closed diagnostic fields for memory, optional rate limits, source dimensions and shared-process context.
- Provider limit/remaining/reset headers captured before body decoding, including project-token headers when present.
- Malformed/absent header values remain null; no arbitrary headers or private response text are retained.
- Source width/height persisted on upload and copied into each run; legacy dimensions stay null.
- Run memory baseline/final/sample maxima from stage-boundary and 250 ms samples, bounded to 120 seconds for periodic work.
- Timer cleanup on success, failure, reservation refusal and abort; read failures are diagnostic gaps, not business failures.
- Shared API invocation tracking includes non-agent requests, with process ID, sequence, uptime and first-request flag.
- One 1 GiB configuration supplies both deployment memory and diagnostic byte limit; no capacity setting changed.

## Verification

- Full server suite: 285 tests, 285 pass, zero failures on local Node 26.
- Final sampler failure-state refinement: focused runner suite passes, 12 tests.
- Offline `./e2e/server/run.zsh`: all six steps pass; process exit 0.
- Step 06 verifies dimensions, memory summaries, process context and rate-limit fields on successful/failed runs.
- Existing upload/refine/retry, output-limit classification, correlation, concurrency and redaction checks still pass.
- Fixtures test malformed compound reset durations, missing headers, memory sampling failure, abort and deadline cleanup.
- Browser fixture checks pass at 1440/900 px with enriched and legacy runs; no horizontal overflow or page errors.
- Reviewer signed-in/out screenshots match pre-extension `fd96df7`; no dashboard assets changed.
- [Browser and platform evidence](sprint-010-capacity-evidence/) contains enriched views and safe cloud metadata.
- Sampling microbenchmark: 1,000 real local memory reads/aggregations took 1.92 ms, about 0.0019 ms each.
- That microbenchmark excludes logging, persistence and cloud-runtime behavior; it is not a total overhead claim.
- `git diff --check` passes; approved plan/task documents are unchanged.

## Live read-only platform check

- Queried Cloud Monitoring descriptors and one available time series per metric for `api-00021-kil`.
- Pending latency, startup latency, memory utilization, concurrency and request count all have data in the selected seven-day window.
- The evidence records an available sample per metric, not all series or proof of current saturation.
- The candidate memory-bytes metric name was unavailable; the operator guide uses verified memory utilization instead.
- [Operator guide](../12-observability-insights-and-learning/observability-03-capacity-guide.md) explains how to inspect these metrics.

## Acceptance limits

- First request on a process is a startup hint, not measured container cold-start duration.
- Platform pending latency combines capacity wait/startup and is not a per-run queue measurement.
- Sampled RSS is process memory; saved final values precede settlement and do not capture a true instantaneous peak.
- Live application field verification awaits review, commit and authorized deployment; no paid provider calls were made.
