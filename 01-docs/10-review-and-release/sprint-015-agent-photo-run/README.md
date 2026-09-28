# Sprint 015 — Validation evidence

Scope: refactor and explain the saved-JPEG `POST /v1/agent/analyses/{id}/run` flow.
Environment: local tests and isolated `demo-aishop-e2e` emulators only.
Provider responses and task dispatch are simulated; no paid recognition or deployment.

## Baseline — 2026-09-16

- Branch: `codex/sprint-015-agent-photo-run-refactor`; baseline commit `14be18b`.
- Plan: `71c8de7`; separately committed Tasks/scope: `14be18b`.
- `bash scripts/agent-photo-run-tests/server-tests.sh`: **417/417 PASS**, zero failures/skips.
- `bash scripts/agent-photo-run-tests/server-e2e.sh`: **FAIL to start**, Firestore port 8080 occupied by another local process. That process was left alone.
- `bash scripts/agent-photo-run-tests/server-e2e-isolated.sh`: **FAIL**, after steps 01–05 passed. Uses the same gate with separate local ports, not a reduced replacement gate.
- First application-test failure: `server/scripts/e2e-agent-observability.mjs:142` calls the collection task handler without `attemptId`.
- `server/src/agent-background-functions.js` requires exactly `ownerKey`, `analysisId`, `runId`, `attemptId`. Its payload guard rejects that fixture before collection.
- This failure predates every production-source edit in this sprint. The full E2E gate is not green; later steps did not run in that invocation.

Raw local logs (temporary, not committed): `/tmp/aishop-s015-baseline-unit.log`,
`/tmp/aishop-s015-baseline-e2e.log`, `/tmp/aishop-s015-baseline-e2e-isolated.log`.

## Post-refactor — 2026-09-16

| Command (from repository root) | Observed result |
| --- | --- |
| `bash scripts/agent-photo-run-tests/evidence-store-tests.sh` | PASS 12/12; store executable source unchanged. |
| `bash scripts/agent-photo-run-tests/record-store-tests.sh` | PASS 36/36; store executable source unchanged. |
| `bash scripts/agent-photo-run-tests/adapter-tests.sh` | PASS 33/33 before and after extraction; includes synchronous/video consumers. |
| `bash scripts/agent-photo-run-tests/handler-tests.sh` | PASS 45/45 before/after extraction. |
| `bash scripts/agent-photo-run-tests/runner-tests.sh` | PASS 10/10 after moving; new export-identity test first failed on absent module. |
| `bash scripts/agent-photo-run-tests/collector-tests.sh` | PASS 10/10 after moving; new export-identity test first failed on absent module. |
| `bash scripts/agent-photo-run-tests/curl-fixture-tests.sh` | PASS 7/7 including subtests; actual curl against local HTTP fixture, not a cloud result. |
| `bash scripts/agent-photo-run-tests/photo-e2e.sh` | PASS saved-JPEG `/run` and refinement through the real server composition. |
| `bash scripts/agent-photo-run-tests/server-tests.sh` | PASS **435/435**, zero failures/skips, about 14.2 seconds. |
| `bash scripts/agent-photo-run-tests/server-e2e-isolated.sh` | FAIL at the same pre-existing observability fixture; steps 01–05 PASS. |
| `bash scripts/agent-photo-run-tests/static-checks.sh` | PASS 241 documentation links, exact facade identity, moved code equivalence, syntax, scope and decision line limits. |

The handler's first post-extraction run caught an accidentally removed constant
also used by the unchanged video reservation reader. Restoring that constant
restored all 45 tests. This regression was not left in the delivered code.

## What the focused E2E actually demonstrated

`e2e/server/step-07-agent-programmatic.mjs` uses real Firebase Agent factories
and emulated Auth, Firestore and Storage; only provider HTTP and task dispatch
are fixtures. It runs against the demo project, not `aishop-99d36`.

- Setup uploads without `run`; the target exercise starts with status `uploaded`.
- POST `/run` reads the exact stored JPEG, starts the provider once and returns `analyzing`.
- Duplicate POST returns 409, GET does not call the provider, pending collection requeues.
- Terminal collection persists the report and duplicate delivery is a no-op.
- Refinement creates a distinct run ID, trims its note and retains both run reports.
- Missing claim returns 403, another owner's POST returns 404 without a provider call, revocation returns 401.
- Its existing task fixture was updated to include `attemptId: null`, matching the unchanged private-task contract. No production payload validation was relaxed.

The full gate still stops earlier in `server/scripts/e2e-agent-observability.mjs`.
That script was not changed: its pre-existing payload fixtures need a separate
test-harness correction/review. Consequently steps 08–09 were not reached by
the full gate, and the focused PASS is **not** a full-system PASS.

Additional temporary logs: `/tmp/aishop-s015-photo-e2e.log`,
`/tmp/aishop-s015-final-unit.log`, `/tmp/aishop-s015-final-e2e.log`.

## Review and acceptance boundary

- [Personal review entry point](../../guides/vision-agent-photo-analysis/README.md).
- [Task-by-task handoff](handoff.md).
- No provider spend, cloud deployment, UI change, prompt/schema change, or persistence migration.
- No Git commit or push by the agent. Changes remain proposals for Pablo/Claude review.
- The full E2E failure remains an acceptance gap, alongside Pablo's personal walkthrough.
