# Sprint 015 — Scope, Ownership and Compatibility

Status: proposed companion to [Tasks](02-sprint-plan-tasks.md); approve together.
Ownership uses the [approved components](../../../06-solution-design-and-architecture/components/component-architecture.md).

## Reading boundary

Start with a saved JPEG and a verified Agent caller. Follow only the POST `/run`
request, background recognition and durable result; GET reads observe that result.
Background collection/reconciliation are necessary dependencies, not new endpoints.

## Owned code and allowed changes

Paths below are relative to `server/src/`; corresponding tests stay in `server/test/`.
Each component owns its own guide sections/tests; consumer guides may link across components.

| Approved component | Allowed implementation work |
| --- | --- |
| Inspection API | Extract only `readContext` from `agent-api-handler.js` to `agent/api/run-context.js`. |
| Inspection API | Move `agent-analysis-runner.js` and `agent-analysis-collector.js` to `agent/analysis/`, keeping basenames. |
| AI Analysis Adapter | In `openai-analyzer.js`, delegate background body building/interpreting to `recognition/background/request-body.js` and `response-interpreter.js`. |
| Evidence Store | Characterization tests and photo-source documentation for `agent-evidence-store.js`; executable source unchanged. |
| Inspection Record Store | Characterization tests and state documentation for `agent-analysis-store.js`; executable source unchanged. |

Keep named-export facades at both moved files' original paths for existing callers.
Test export identity and behavior through old paths; avoid duplicate implementations.
Keep sampler exports and all factory/method signatures. Do not rewrite video branches.
The adapter keeps its synchronous path, background factory, control methods and exports.
Pass existing shared helpers into extracted logic as needed; avoid copies/circular imports.
Keep `analysis-contracts.js` and the exact `areaScan` instruction/schema unchanged.
Add a README to every new folder, including parents, scoped to the code actually present.
Tests for affected shared paths include existing video/synchronous callers unchanged.

## Dependencies to explain, not relocate or redesign

`firebase.js`, `firebase-agent-handler.js`, `firebase-agent-background.js`,
`firebase-services.js`, `firebase-agent-config.js`, `firebase-api-router.js`;
`agent-task-enqueuer.js`, `agent-background-functions.js`, `agent-due-work-reader.js`;
`agent-diagnostics.js`, error types, `http-json.js` and the upload-owned context limit.
Keep these files, auth checks, queues, timing, regions, evidence paths and data shapes intact.

## Test and documentation contract

Use existing handler/runner/collector/store/evidence/adapter tests before adding focused cases.
Use saved-photo fixtures, not upload-plus-run, for the target E2E assertion; setup stays setup.
Preserve lease/settlement semantics, redaction, context limits and error/status mapping.
Mark example outputs versus observed results; do not invent successful curl evidence.
Manual scripts take existing credentials/ID in memory; local fixture validation only here.
Guides show function names plus full repository-relative code paths; verify destinations/lines.
Any need to modify another component or excluded flow pauses that task for a scope amendment.
