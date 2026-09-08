# Sprint 010 — Component Ownership

Date: 2026-09-08. Status: PROPOSED; approval is Pablo's commit.
Companion to [the task plan](04-sprint-plan-tasks.md); defines file ownership before coding.

## Existing boundaries

The [component model](../../../06-solution-design-and-architecture/components/component-architecture.md)
defines the AI Analysis Adapter and Inspection API. Sprint 008 introduced the
[agent path](../../../06-solution-design-and-architecture/architecture-04-agent-upload-path.md)
and its handler, runner, store and page. This allocation keeps those boundaries.
Only the diagnostic formatter is a new internal component; no new service is proposed.

| Component | Owned implementation surface |
| --- | --- |
| Diagnostic formatter | New `server/src/agent-diagnostics.js`; pure allowlists, envelopes and safe sink wrapper. |
| AI Analysis Adapter | `server/src/openai-analyzer.js`, provider-error type in `errors.js`; provider-specific metadata and classification. |
| Agent analysis store | `server/src/agent-analysis-store.js`; transaction identity, trigger, safe stored diagnostics and legacy summaries. |
| Agent analysis runner | `server/src/agent-analysis-runner.js`; stage orchestration and settlement outcomes. |
| Agent API handler | `server/src/agent-api-handler.js`, `agent-api-error.js`; request context, upload stages and response references. |
| Firebase agent composition | Agent wiring in `firebase-agent-handler.js`, `firebase-agent-config.js`, `firebase.js`; logger and release context. |
| Agent page | `dashboard/agent.html`, `dashboard/scripts/agent.js`, `dashboard/styles/agent.css`; agent-only diagnostics presentation. |
| Emulator suite | `e2e/server/`, `server/scripts/e2e-agent-*.mjs` and test-only provider fixtures; composed offline verification. |
| Operational evidence | Sprint 010 evidence under `docs/09-build-and-test/` and operational queries under `docs/12-observability-insights-and-learning/`. |

## Ownership rules

Associated unit tests belong to the component under test; integration harness changes belong to the emulator suite.
Shared-file edits are confined to the named responsibility; unrelated VISTA/reviewer behavior must remain intact.
If implementation needs another component or file responsibility, revise this allocation before changing that component.
The formatter cannot fetch data, call providers, alter business outcomes or choose retry policy.
Composition supplies the sink; formatter tests need no Firebase credentials or live service.
Diagnostic observers remain optional for existing adapter callers and must never expose raw provider payloads.
The store retains only the approved sanitized diagnostic fields, not arbitrary adapter objects.
Formatter, adapter and store tests enforce their own boundary rather than relying on caller sanitization alone.
Fixture transport is restricted to the offline emulator composition; deployed TEST cannot select it by request input.
No task changes retention, IAM, secret values, token limits, model choice or automated retry behavior.
