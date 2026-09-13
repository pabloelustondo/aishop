# Sprint 013 — Sprint Plan Tasks

Date: 2026-09-13. Status: PROPOSED revision; approval requires Pablo's commit.
Prerequisites: revised plan and architectures 12–15 approved at `13e1fca`.

## Fixed interfaces

- Public run returns the durable `analyzing` record; no public `collect` route exists.
- Private task payload is exactly `ownerKey`, `analysisId`, and `runId`.
- Firestore privately owns provider ID, next collection time and lease metadata.
- Task collection never creates or retries a run and never trusts payload provider state.
- Browser polling uses only existing owner/admin GET routes and cannot advance work.
- Provider start, retrieve and delete calls each have a 15-second transport deadline.

## Ordered component-scoped tasks

1. **Provider adapter.** `openai-analyzer.js` and tests: background/store true,
   strict schema, no output cap, and bounded start, retrieve and delete operations.
2. **Analysis record.** `agent-analysis-store.js` and tests: private provider state,
   transactional lease, due time, run fencing, idempotent settlement and public redaction.
3. **Task enqueuer.** Add one Cloud Tasks adapter and tests: enqueue only the fixed
   payload for `collectAgentAnalysis`, delayed 15 seconds, with no credential leakage.
4. **Start orchestration.** `agent-analysis-runner.js` and tests: reserve, read source,
   start once, persist provider state, enqueue after persistence and return `analyzing`.
5. **Collection orchestration.** Add one collector component and tests: claim lease,
   retrieve, reschedule intermediate state, settle terminal state, then clean up provider.
6. **Reconciliation reader.** Add one Firestore due-work reader and tests: find overdue
   active runs and ignore terminal, leased, malformed, superseded or not-yet-due records.
7. **Task function.** Add private v2 `collectAgentAnalysis` composition and tests with
   bounded retry/rate settings, shared secret access, diagnostics and Toronto region.
8. **Reconciler function.** Add scheduled `reconcileAgentAnalyses` composition and
   tests: enqueue due work idempotently; one record failure cannot stop the remaining scan.
9. **Public APIs.** Owner/Admin handlers and tests: remove provider collection routes,
   preserve authorization and make run/upload-start responses return promptly.
10. **Web presentation.** My Runs/All Runs scripts and behavior tests: poll only GET
    state every 15 seconds while visible; reload resumes observation without causing work.
11. **Reference.** Update Agent API pages 02–03 with server-owned progression, read-only
    polling, honest start uncertainty and no public provider/task identifiers.
12. **E2E gate.** Extend `./e2e/server/run.zsh`: simulate queue dispatch while invoking
    real task composition; prove refresh independence, missed-dispatch recovery, duplicate
    delivery, lease fencing, intermediate/terminal states, cleanup ordering and claims.

## Validation and release boundary

Run all server unit tests, the complete emulator E2E gate, diff and line checks.
Deployment is excluded: queue/Scheduler creation, IAM, billing and TEST proof require
separate approval. Pablo alone commits, publishes, deploys, merges or releases.
