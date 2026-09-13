# Sprint 013 — Sprint Plan Tasks

Date: 2026-09-12. Status: PROPOSED; approval requires Pablo's commit.
Prerequisites: approved [plan](01-sprint-plan.md) and architecture 13–15 at `c5aab89`.

## Fixed interfaces

- Owner collection: `POST /v1/agent/analyses/{analysisId}/collect`.
- Admin collection: `POST /v1/admin/analyses/{ownerKey}/{analysisId}/collect`.
- Collection returns the current record, starts no run, and spends no new model call.
- Direct run start answers `202`; upload-and-run remains `201`; both return `analyzing`.
- Provider job identifiers stay server-side; public records never serialize them.
- Every provider control call has a 15-second deadline and no automatic retry.

## Ordered component-scoped tasks

1. **Provider adapter.** `openai-analyzer.js` and its test: RED then GREEN start,
   retrieve and delete; background/store true, no output cap, strict schema, all statuses and deadlines.
2. **Analysis record.** `agent-analysis-store.js` and its test: persist the opaque job reference,
   expose a server-only pending read, redact public summaries, and settle the same run idempotently.
3. **Analysis orchestration.** `agent-analysis-runner.js` and its test: start and return promptly;
   collect pending/terminal outcomes, settle once, then attempt deletion and preserve diagnostics.
4. **Owner API.** `agent-api-handler.js` and its test: add the authenticated collect POST,
   return 202 from run start, preserve owner isolation, and never expose the provider reference.
5. **Admin collection API.** `admin-api-handler.js` and its test: add only the admin collect POST;
   it may settle existing work but cannot create, retry, refine, or delete an AI Shop record.
6. **Firebase composition.** `firebase-agent-handler.js`, `firebase-admin-handler.js`,
   `firebase-services.js` and their tests: inject one background-capable runner into both gates.
7. **My runs presentation.** `dashboard/scripts/agent.js` and its behavior test: poll the run
   initiated by this page every 15 seconds, stop under the plan rules, then offer manual refresh.
8. **All runs presentation.** `dashboard/scripts/allruns.js` and its behavior test: treat one
   opened analyzing row as selected; opening another stops the first poll; use admin collection.
9. **Programmatic API reference.** `docs/reference/agent-api/02-analysing-one-photograph.md`
   and `03-errors-and-limits.md`: replace synchronous promises with the start/collect contract.
10. **End-to-end gate.** Extend the Agent/Admin E2E steps and `run.zsh`: prove claims, isolation,
    queued/in-progress/completed/failure, duplicate collection, cleanup ordering and redaction.

## Final validation and TEST evidence

Run the complete server unit suite and `./e2e/server/run.zsh`; run `git diff --check` and line checks.
After separate deployment approval, prove strict schema behavior and Ignacio's original image; correlate
server-side IDs, usage and timing, and measure the effective Hosting ceiling without changing VISTA.
No task changes the model, prompt, schema, auth policy, VISTA, iOS, deploy target, queue or worker.
After this commit, create the Sprint 013 branch before Task 1; Pablo alone publishes or releases.
