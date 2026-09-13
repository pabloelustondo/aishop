# Agent diagnostic queries

Sprint 010 implementation guide, 2026-09-08. Available after deployment, not retroactive.
Open [Logs Explorer](https://console.cloud.google.com/logs/query?project=aishop-99d36) and choose the incident time range.

## Find the request copied from the page

```text
resource.type="cloud_run_revision"
resource.labels.service_name="api"
jsonPayload.service="agent"
jsonPayload.requestId="PASTE_REFERENCE"
```

Use `jsonPayload.runId="RUN_ID"` for a run, or `jsonPayload.analysisId="ANALYSIS_ID"` for its upload and attempts.
The structured `logging.googleapis.com/trace` field links events with available platform request traces.

## Find explicit output-limit failures

```text
resource.labels.service_name="api"
jsonPayload.event="provider.failed"
jsonPayload.failureClass="provider_output_limit"
```

Inspect `providerStatus`, `responseStatus`, `incompleteReason`, `maxOutputTokens`,
`usage`, `providerRequestId`, requested/returned model and version fields.
HTTP 200 can contain an incomplete response; high usage alone does not prove truncation.

## Other useful filters

- All failed runs: `jsonPayload.event="run.failed"`.
- Failure to save an outcome: `jsonPayload.event="persistence.failed"`.
- Provider timings: `jsonPayload.event="provider.completed"`; inspect `durations.provider` (whole stage) and `durations.provider_transport` (transport/body decode).
- Stage timings: `jsonPayload.event="stage.completed"`; inspect `stage` and `durationMs`.
- HTTP outcomes: `jsonPayload.event="request.completed"`; inspect `httpStatus` and `errorCode`.
- A completed run is a saved business outcome; request completion only describes its HTTP response.

## Started but never settled

Open the owner's `agentAnalyses/{owner}/analyses/{analysisId}` Firestore record.
If `status=analyzing`, compare the latest run's `startedAt` with current UTC time.
Older than five minutes warrants investigation; query its run/request ID and look for persistence failures.
Inspect the durable record too; missing logs prove no outcome. Do not automatically retry paid work.

## Deployment prerequisite and limits

`release` uses a valid `AGENT_RELEASE_COMMIT`, otherwise `K_REVISION`; `releaseKind` distinguishes commit from revision.
Verify a populated release identity, structured fields, request-reference UI and platform trace linkage live before acceptance.
No dashboards, metrics resources, alerts, private payload capture or automatic retry are installed by this sprint.
