# Long-Running Analysis — Decision

**Status: REVISED.** Pablo rejected browser-driven progression on 2026-09-13
and selected the server-owned design in [15](architecture-15-option-b-queue-and-worker.md).

## Evidence

Ignacio's dense shelf reached AI Shop's 1,200-token output cap. Removing that
cap and the 20-second abort does not make a long provider call safe inside one
Hosting request. A completed, billed response can outlive that request.

Provider background mode solves the request-duration problem, but a browser
calling `collect` does not solve ownership of progress. A closed or refreshed
page can leave a completed provider response and an AI Shop record disagreeing.

## Decision

Keep OpenAI background responses, but move every retrieve and settlement step
to private Firebase Cloud Tasks. Firestore owns the provider reference, status,
lease, schedule, report and diagnostics. A scheduled reconciler repairs missed
dispatches. Browser and iPhone clients only create work and read durable state.

## Consequences

- Client lifetime cannot stop analysis progression or create another response.
- Task delivery may repeat, so claims and terminal settlement are idempotent.
- Cloud Tasks, a task function, a scheduled reconciler, IAM and small operating
  cost are now explicit infrastructure.
- The existing public API remains the authentication and ownership boundary.
- Synchronous VISTA and `/inspections` retain their independent Hosting limit.
