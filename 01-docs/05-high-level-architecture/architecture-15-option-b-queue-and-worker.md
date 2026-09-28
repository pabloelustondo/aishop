# Option B — Server-Owned Cloud Tasks Collector

**Status: SELECTED.** Pablo selected this design on 2026-09-13. It supersedes
browser collection in [14](architecture-14-option-a-provider-background-mode.md).

## Durable flow

1. The authenticated API reserves a run and starts one stored OpenAI background response.
2. One Firestore transaction stores its opaque ID, `analyzing` state and next collection time.
3. The API enqueues a private Cloud Task and returns the durable record promptly.
4. The task claims a short Firestore lease and retrieves provider state.
5. Intermediate state records the next collection time and schedules another task.
6. Terminal state is validated and settled idempotently before best-effort provider deletion.
7. A scheduled reconciler enqueues overdue records, repairing missed dispatches or crashes.
8. Pages poll read-only owner/admin APIs or later subscribe; they never collect provider work.

## Invariants

- Firestore is authoritative for status, attempts, schedule, lease, report and diagnostics.
- Task payload contains only owner key, analysis ID and run ID; provider ID stays in Firestore.
- At-least-once delivery cannot create a second run or duplicate terminal settlement.
- Lease and run identity make concurrent or stale task delivery a harmless no-op.
- Reconciliation, not a browser session, guarantees another collection opportunity.
- Cleanup follows durable settlement and never precedes it.

## Infrastructure boundary

Use Firebase v2 `onTaskDispatched` in Montréal (`northamerica-northeast1`) with
bounded retries and rate limits, plus a scheduled reconciler there. The live
2026-09-13 deployment proved Cloud Tasks and Scheduler do not accept the public
API's Toronto region (`northamerica-northeast2`). The API remains in Toronto;
only private background infrastructure crosses that regional boundary. First
deployment may create a queue and needs explicit billing/IAM/deployment approval.
The runtime, model, prompt, schema, authentication and public target stay unchanged.

## Accepted residual risk

OpenAI does not document an idempotency key for Responses creation. A transport
failure after provider acceptance but before its ID is durably stored can still
orphan one response. It must be diagnosed; it must never trigger automatic start.
