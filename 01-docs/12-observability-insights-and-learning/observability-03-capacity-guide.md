# Capacity and Startup Diagnostics

Sprint 010 capacity extension, 2026-09-08. Application fields become available after deployment.
Use the [request/run query guide](observability-02-agent-query-guide.md) to find the relevant attempt.

## Per-run fields

- `memory.baseline`, `memory.final`, `memory.sampledMax`: process RSS, heap, external and array-buffer bytes.
- `memory.sampleCount`, `sampleIntervalMs`, `samplingFailures`: sampling coverage and gaps.
- `memoryLimitBytes`: the same configured limit used by the function, currently 1 GiB.
- `rateLimits.requests`, `.tokens`, `.projectTokens`: available limit, remaining and reset milliseconds.
- `providerObservedAt`: when that provider-response snapshot was observed; limits may be shared with other callers.
- `imageWidth`, `imageHeight`, `imageByteLength`: validated source descriptors; legacy dimensions remain unknown.
- `processInstanceId`, `invocationSequence`, `firstRequestOnProcess`, `processUptimeMs`: shared-function process context.

## Interpretation

Memory is sampled every 250 ms and at stage boundaries; periodic sampling has a 120-second ceiling.
The saved final sample precedes settlement; later request/stage samples are in logs.
Maxima are observed process values, not exact per-run peaks or total container consumption.
Do not sum overlapping external/array-buffer counters or interpret RSS alone as full container headroom.
Missing/malformed rate-limit values are null, not zero; no automatic retries or throttling were added.
A first-request flag is not measured cold-start latency; startup can occur before application code executes.

## Platform views

Open [Metrics Explorer](https://console.cloud.google.com/monitoring/metrics-explorer?project=aishop-99d36).
Filter resource `cloud_run_revision`, service `api`, region `northamerica-northeast2` and the relevant revision.
Use these metric types (prefix each with `run.googleapis.com/`):

| Concern | Metric suffix |
| --- | --- |
| Waiting for capacity/startup | `request_latency/pending` |
| Instance startup | `container/startup_latencies` |
| Container memory utilization | `container/memory/utilizations` |
| Observed instance concurrency | `container/max_request_concurrencies` |
| Traffic | `request_count` |

All five had descriptors and data for revision `api-00021-kil` in the seven-day window ending 2026-09-08 14:57 UTC.
See the [read-only availability evidence](../09-build-and-test/sprint-010-capacity-evidence/platform-metric-availability.json).
The probed `container/memory/bytes_used` name was unavailable; use the verified utilization metric.
These shared-service aggregates can include VISTA/reviewer traffic and cannot attribute queue time to an individual run.
Pending latency includes startup and capacity wait; do not subtract aggregate percentiles to infer a queue duration.
The evidence proves existing-platform availability, not that the new application fields are deployed.

## Remaining limits

No browser/network end-to-end timing, load test, new dashboard, alert, billing change or backfill is included.
Recheck populated application fields and metric data after an authorized deployment of the reviewed commit.
