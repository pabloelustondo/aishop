# Option A — Browser-Collected Background Mode

**Status: REJECTED.** Pablo rejected this design on 2026-09-13 because browser
lifetime must not control server work. [15](architecture-15-option-b-queue-and-worker.md)
supersedes it.

## What remains useful

The Responses API accepts `background: true` and returns a response identifier.
`GET /v1/responses/{id}` reports intermediate or terminal state. AI Shop keeps
`store: true`, validates the strict output, and requests deletion only after
durable terminal settlement.

The OpenAI credential and response identifier remain server-only. Firestore
remains the durable system of record.

## Why this option failed

The proposed dashboard called an authenticated `collect` endpoint every 15
seconds. Refresh, page closure or no reviewer meant no collection. OpenAI could
finish while Firestore remained `analyzing`, so the page was part of the
processing topology rather than a representation of server state.

Automatically restarting browser polling after refresh would hide, not remove,
that dependency. No browser route may advance provider processing in the
selected architecture.
