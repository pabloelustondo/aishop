# Agent observability: findings and proposed response

Date: 2026-09-08. Status: proposal; no instrumentation implemented.

## Evidence from the current agent path

- Cloud request logs expose method, status, duration and platform trace ID.
- The inspected 24-hour sample contained 29 agent requests, all with latency and trace.
- At 2026-09-07 20:04:25 UTC, a run POST returned 502 after 7.0888 seconds.
- That is the latest agent POST in the inspected sample, not proof of its underlying cause.
- Handler errors contain a safe code, status and route template via `console.error`.
- Queried application entries did not expose structured code/status/route or trace fields.
- Firestore retains run status, context, timestamps, report and generic failure reason.
- Run history is bounded to 25 entries per analysis; it is not a telemetry archive.

## Diagnostic gaps

- No shared request/run reference joins browser, application events and provider calls.
- No run or stage start/completion events; overall HTTP latency hides the slow stage.
- The provider adapter discards HTTP status, request ID and response usage metadata.
- Non-timeout provider failures collapse to `provider_failed` at the agent boundary.
- JSON, schema, transport and provider refusals cannot be reliably distinguished afterward.
- Model metadata is written on success; failed attempts lack equivalent configuration evidence.
- If failure persistence fails too, a second exception can hide the original failure.
- Request logs cannot establish recognition accuracy or whether a refinement was respected.
- Cloud alert policies, retention and dashboard configuration were not audited in this review.

## Desired investigation experience

Copy a diagnostic reference from the page and find the request, run, stages,
provider outcome and database outcome in one query. Identify the failed stage,
its duration and a safe actionable failure class without reading private input.
For a successful run, see the actual model, versioned configuration and usage.
Keep recognition-quality assessment attached to benchmark evidence, separately.

## Proposed next step

[Sprint 010](../07-planning/sprints/sprint-010-agent-observability/01-sprint-plan.md)
defines acceptance. Its [event contract](../07-planning/sprints/sprint-010-agent-observability/02-observability-contract.md)
defines the proposed fields. Approval, implementation, TEST deployment and live
verification remain separate; creating these documents changes no runtime.

## Source pointers

- `server/src/agent-api-handler.js`: boundary logging and safe responses.
- `server/src/agent-analysis-runner.js`: execution and failure persistence.
- `server/src/openai-analyzer.js`: provider handling and discarded metadata.
- `server/src/agent-analysis-store.js`: persistent run history.
