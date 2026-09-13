# Sprint 013 — Background Analysis

Date: 2026-09-12. Status: PROPOSED; approval requires Pablo's commit.

## Problem and goal

Dense-shelf responses reached AI Shop's 1,200-token cap. Removing that cap and
the 20-second abort still leaves synchronous analysis exposed to HTTP and
function deadlines. Implement selected
[Option A](../../../06-solution-design-and-architecture/architecture-14-option-a-provider-background-mode.md)
so long analysis starts and completes across separate short requests.

## Scope

- Start Responses API work with `background: true`, `store: true`, and no
  supplied `max_output_tokens`.
- Give each short provider start, retrieve and delete call a 15-second transport
  deadline; it does not limit the background analysis itself.
- Store the opaque provider response ID and collect status server-side.
- Preserve strict schemas and settle every terminal outcome idempotently.
- Delete terminal provider responses after durable settlement, best-effort.
- Poll the selected `analyzing` record every 15 seconds for at most 10 minutes;
  stop on terminal state, deselection, hidden/unloaded page, or elapsed ceiling.
- Preserve diagnostics, redaction, authorization and the existing deploy target.

## Acceptance

- Starting a run returns `analyzing` promptly and cannot duplicate on refresh.
- Collection represents every intermediate and terminal state honestly.
- Provider-control timeouts fail honestly and never trigger an automatic retry.
- Polling stops under every declared condition and then offers manual refresh.
- TEST verifies strict `json_schema` enforcement in background mode.
- Provider cleanup follows durable settlement, never precedes it.
- Unit and emulator E2E suites prove authorization and state transitions.
- TEST completes Ignacio's original image and correlates IDs, usage and timing.
- TEST records the effective Hosting rewrite deadline for synchronous routes.

## Accepted boundaries

No queue, worker, sweeper, new function, prompt/model/schema, authentication,
VISTA, iOS, automatic retry or production deployment. If a timed-out start was
accepted upstream, or nobody collects, a billed provider response may remain
stored and its AI Shop run may remain `analyzing`. TEST accepts that orphan
case. Option B remains deferred.

## Sequence

Pablo commits this plan and its architecture dependencies first. Only then may
the separate component-scoped tasks be drafted and committed. After both gates,
create the Sprint 013 branch before coding. Pablo alone publishes or releases.
