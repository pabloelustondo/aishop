# Sprint 010 — Capacity Observability Tasks

Date: 2026-09-08. PROPOSED; Pablo's commit approves these exact tasks.
The [capacity amendment](06-capacity-observability-plan-amendment.md) was approved in `ee76d8d`.
Continue on `codex/sprint-010-agent-observability`; [component ownership](05-component-ownership.md) still applies.

## Ordered component tasks

1. **Diagnostic formatter.** Extend the closed schema for memory, limits, dimensions and process context.
   Permit only bounded numeric counters, validated timestamps, booleans and opaque process IDs; retain unknowns as null.
   Test nested private markers, malformed values and independent memory counters; no process reads in the formatter.
2. **AI Analysis Adapter.** Parse request/token/project-token limit, remaining and reset headers before body decoding.
   Record the response observation time with safe values; preserve them if HTTP handling or JSON decoding fails.
   Test success, 429, malformed/missing headers and compound reset durations; keep retry behavior unchanged.
3. **Agent analysis store.** Persist validated image width/height on create and expose nulls for legacy records.
   Copy source dimensions/byte length into reserved-run diagnostics; retain safe memory/limit/process summaries on settlement.
   Test legacy reads, failure settlement and rejection of unsafe diagnostic fields at the store boundary.
4. **Agent analysis runner.** Own a per-run sampler using injected memory-read/timer functions for tests.
   Sample at stage boundaries and every 250 ms; keep aggregate counters rather than an expanding sample array.
   Stop periodic sampling after 120 seconds as a hard ceiling, and always clean up in `finally`.
   Persist baseline, final-before-settlement, sampled maxima, interval/count and configured memory limit.
   Record post-settlement samples in logs; a write cannot contain a measurement taken after that write.
   Test sampler failures, exceptions, early exits and cancellation cleanup without hiding the original outcome.
5. **Agent API handler.** Forward validated width/height on upload and trusted process context to run diagnostics.
   Capture safe request/upload-stage memory snapshots; do not trust caller headers for process or queue measurements.
   Test uploads, failed validation, missing process context and forged client metadata.
6. **Firebase agent composition.** Centralize the existing 1 GiB configuration and its numeric byte limit.
   Initialize a process ID once; count all shared API invocations, including non-agent routes, at the common entry.
   Propagate invocation sequence, first-request flag, uptime and memory limit through internal request context.
   Test non-agent-before-agent ordering and reuse across requests; preserve all existing routes and deployment limits.
7. **Emulator suite.** Extend step 06 with rate-limit fixtures and persisted dimensions/memory/process context assertions.
   Prove successful and failed runs preserve the new fields, redact private markers and release sampler resources.
   Explicitly label fixture-provider and sampler tests; do not claim emulation proves platform startup or queue latency.
8. **Operational evidence.** Verify available TEST metric descriptors/time series through read-only cloud access.
   Document pending/startup latency, memory and concurrency/request-count views with metric names and time range.
   Distinguish missing data from unavailable metrics; record gaps without inventing per-run queue or cold-start duration.

## Validation and completion

Run focused component tests, then `npm --prefix server test` and `./e2e/server/run.zsh`.
Check diagnostic details render at 1440/900 px with legacy and enriched fixtures; keep reviewer assets unchanged.
Record actual checks, sample overhead and measurement limitations in the delivered-scope evidence.
Platform metric availability is a read-only acceptance check; no load generation, dashboards or alerts are created.
No paid inference, backfill, secret/IAM change, automatic retry, deployment or capacity-setting change is authorized.
After review/commit and separate deployment authorization, verify populated hosted fields and live metric evidence.
Agents do not commit; implementation begins after Pablo commits this task document.
