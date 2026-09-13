# Option A — Provider Background Mode

**Status: SELECTED.** Pablo selected this design on 2026-09-12. Option B in
[15](architecture-15-option-b-queue-and-worker.md) is deferred.

## Provider contract

The Responses API accepts `background: true` and returns a response identifier.
`GET /v1/responses/{id}` reports `queued`, `in_progress`, or a terminal state.
OpenAI documents background mode with structured output, but AI Shop has not
yet verified strict `json_schema` enforcement in its own live request.

AI Shop will explicitly set `store: true` so an abandoned browser session can
collect the result later. OpenAI documents at least 30 days of application-state
retention for stored responses. After AI Shop durably settles a terminal result,
it will request deletion of that provider response. Deletion is best-effort and
does not override applicable abuse-monitoring retention.

## AI Shop flow

1. The authenticated run route reserves a run and starts a background response.
2. It stores the opaque provider response ID and returns `analyzing` promptly.
3. The authenticated status route retrieves the provider response server-side.
4. `queued` and `in_progress` leave the AI Shop record unchanged.
5. A terminal response is validated, settled exactly once, and then deleted
   from provider application state on a best-effort basis.
6. The dashboard polls status while the selected run remains `analyzing`.

The OpenAI credential and provider response ID never go to browser code.
Firestore remains the durable system of record for users and reviewers.

## Component impact

- Analyzer: start, retrieve, validate and delete provider responses.
- Store: persist the provider job reference and idempotent settlement state.
- Runner: separate start from collection.
- HTTP handler: expose an authenticated collection/status operation.
- Dashboard: poll and render progress without duplicate runs.

No queue, worker, service account, runtime or new deploy target is introduced.

TEST accepts one orphan limitation: without a later collection request, a
completed billed response can remain at the provider and its AI Shop record can
remain `analyzing`. No automatic sweeper is included in this sprint.

## Required proof

TEST must prove prompt and image submission, immediate ID return, strict-schema
completion, polling across intermediate states, one-time settlement, safe page
reload, provider cleanup, and honest terminal failure diagnostics.
