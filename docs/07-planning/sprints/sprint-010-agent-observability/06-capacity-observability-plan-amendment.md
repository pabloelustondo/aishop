# Sprint 010 — Capacity Observability Amendment

Date: 2026-09-08. PROPOSED; approval requires Pablo's commit before extension tasks and code.
Extends [01](01-sprint-plan.md) before deployment, following Pablo and Claude's capacity review.

## Goal

Explain resource pressure and startup/pending latency alongside each run's existing failure diagnostics.

## Memory

Capture process RSS, heap used/total, external and array-buffer bytes at request/run/stage boundaries.
During a run, take bounded periodic samples; persist baseline, final and sampled maximum with sample count/interval.
Call this a sampled process maximum, never the run's exact peak or total container usage.
External/array-buffer counters overlap; do not sum them into a fictional total.
Record the configured container memory limit from the same configuration used by the function.
Sampling failure cannot break analysis; timers must stop on success, failure and cancellation.
Abrupt termination may prevent final diagnostics; retain start events and use platform memory/startup evidence.

## Provider limits

Read only allowlisted limit/remaining/reset headers for requests, tokens and project tokens when present.
Capture on successful and failed HTTP responses before body decoding; retain alongside existing retry-after.
Parse bounded nonnegative counts and duration values; missing/malformed values remain null, not zero.
Keep the provider response's timestamp/model/request ID: these are shared-limit snapshots, not quota reserved for this run.
Persist safe values in run diagnostics; do not log raw header maps or add retries, throttling or billing changes.

## Image size

Persist validated width/height with existing byte length on upload; include them in subsequent run diagnostics.
Legacy records return null dimensions; do not fetch/rewrite old images for backfill.

## Process startup and pending requests

Record a process-scoped instance reference, invocation sequence, uptime and `firstRequestOnProcess` at the shared API entry.
Propagate to agent events/runs; do not confuse first agent invocation with first invocation of the shared function.
This identifies a first request, not measured container cold-start delay; use platform startup evidence for that delay.
Document read-only Cloud Monitoring views for pending latency, startup latency, memory and request concurrency/counts.
Verify actual metric availability for TEST `aishop-99d36`; unavailable metrics are an explicit acceptance gap.
Do not derive exact queue time from handler duration, subtract aggregate percentiles, or trust caller timestamps.
Platform pending latency includes capacity wait and startup; it is an aggregate, not a per-run queue measurement.

## Acceptance and sequencing

Fixture tests cover missing/malformed limit headers, memory-sampler cleanup, dimensions and first/subsequent shared-API requests.
Extend the offline E2E gate to prove new safe fields survive successful/failed runs without paid provider calls.
After this plan amendment is committed, draft its task amendment; code follows approval of that task document.
Before deployment acceptance, verify cloud metric availability and populated hosted fields; no load test or config changes implied.

Sources: [OpenAI headers](https://developers.openai.com/api/docs/guides/rate-limits#rate-limits-in-headers), [Cloud Run metrics](https://docs.cloud.google.com/monitoring/api/metrics_gcp_p_z#run).
