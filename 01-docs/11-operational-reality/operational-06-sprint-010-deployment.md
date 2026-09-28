# Sprint 010 TEST deployment

## Deployment

- Date: 2026-09-08; environment: TEST; project: `aishop-99d36`.
- Pablo authorized deployment after committing the reviewed changes.
- Deployed commit: `3acbd8984cb07b7a3d3be3016769d47120024043`.
- Branch: `codex/sprint-010-agent-observability`; clean before deployment.
- Command: `firebase deploy --only functions,hosting --project aishop-99d36`.
- Result: exit 0; Functions update and Hosting release both succeeded.
- Node.js 22 function: `api`, region `northamerica-northeast2`.
- Observed Cloud Run revision: `api-00022-joq`.
- Agent: <https://aishop-99d36.web.app/agent.html>.

## Live verification

- Hosted `agent.html`, `scripts/agent.js`, `styles/agent.css`, and `styles/base.css` matched local files byte for byte.
- Anonymous `GET /v1/agent/analyses` returned the expected 401.
- Response header and error body carried the same diagnostic request ID.
- Request ID: `727c8077-a45f-4019-a98d-a5640658d703`.
- Cloud Logging contained `request.started` and `request.completed` at 15:49:44 UTC.
- Both events identified TEST and release `api-00022-joq`, with release kind `revision`.
- Both included process ID, invocation sequence, uptime, first-request flag, memory limit, and memory counters.
- The completion event recorded the matched route, 401, `unauthorized`, and duration.
- Both correlated to trace `c1eb1232c3ad49b8a3ade9bd913fdd20`.
- Automated live assertions passed; the smoke request made no provider call.

## Evidence boundaries

- Pre-deployment validation is recorded in [capacity validation](../09-build-and-test/sprint-010-capacity-validation.md).
- Provider rate limits, token usage, run memory samples, image dimensions, and output-limit failures were exercised with fixtures and emulators.
- Those provider/run fields still need observation during real shelf-photo QA on this deployment.
- Deployment does not establish recognition accuracy or diagnose the original benchmark failure retroactively.
- This post-deployment evidence document is newly written for Pablo's review; no agent commit was made.
