# Server-Side End-to-End Testing

This folder explains how AI Shop automatically tests the server side end
to end: real HTTP requests into the real function, running against local
Firebase emulators, with real Firestore transactions, real Storage
writes, Firebase-format Auth tokens, and real media processing.

## Why this exists

Unit and component tests prove contracts in isolation. This gate proves
that the real server components work together over HTTP and persist state
through the official Firebase Auth, Functions, Firestore, and Storage
emulators.

OpenAI and Cloud Tasks are outside that local Firebase composition.
Provider responses are disabled or deterministic fixtures, and background
tasks are captured and delivered to the real handlers in process.

## Contents

- [Environment and safety](01-environment-and-safety.md) — emulator-only
  execution, offline demo project, secrets handling, prerequisites.
- [Runbook](02-runbook.md) — the exact command, expected output, current
  coverage, and how each new step is added.
- [Executable harness](../../../e2e/server/README.md) — what is real,
  what is simulated, and the boundaries of the result.
- [Historical evidence](history/README.md) — dated reports and approval
  records retained as snapshots, not current operating instructions.

## Executable location

The scripts live in [`e2e/server/`](../../../e2e/server/) with their own
isolated `firebase.e2e.json` configuration so the end-to-end run never
modifies the deployable `firebase.json`.

## Cadence

Run the suite before every review handoff, after every correction that
touches the server, and before any separately authorized deployment.
A failing or skipped run is recorded in the sprint evidence, never
worked around.

The server gate does not operate a browser. Hosted-page testing remains a
separate acceptance activity until a client-side E2E harness exists.
