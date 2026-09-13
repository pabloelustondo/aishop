# Long-Running Analysis — Decision

**Status: SELECTED.** Pablo selected Option A on 2026-09-12. Option B is
deferred for possible future analysis. See [14](architecture-14-option-a-provider-background-mode.md)
and [15](architecture-15-option-b-queue-and-worker.md).

## Evidence

Ignacio's 750 x 1000 shelf failed four times in TEST. Every provider
answer was HTTP 200 ending at exactly 1,200 output tokens with
`max_output_tokens`. Removing that cap and the Agent's 20-second abort
removes limits imposed by this application, but does not make a long
provider call safe inside one HTTP request.

`server/src/firebase.js` sets `timeoutSeconds: 120`. Agent routes are also
reached through a Firebase Hosting rewrite reportedly limited to roughly 60
seconds; that number remains unverified in AI Shop. A provider request may then
finish and be billed without the application recording its result.

Option A makes Agent calls short, but the same possible ceiling still matters
to synchronous `/inspections` and VISTA package ingestion. Raising only the
function timeout would not remove a shorter Hosting boundary.

## Decision

Use the OpenAI Responses API background mode. One request starts analysis and
stores the provider response identifier. Later short requests retrieve the
provider status and settle the AI Shop record when the response is terminal.

The Agent remains responsive while dense-shelf work continues. The strict
structured-output contract, authorization, ownership, diagnostics and
idempotent record transitions remain mandatory.

## Consequence

Option A uses provider-stored response state and therefore carries an explicit
retention decision. AI Shop will delete the provider response after a terminal
result is durably settled, while recognizing that default platform retention
and abuse-monitoring rules still apply.

Option B remains a future alternative if contractual privacy, reliability,
video processing or workload evidence justifies owning a queue and worker.
