# Server-Side End-to-End Testing

HumanReviewerInitials: PME

This folder explains how AI Shop automatically tests the server side end
to end: real HTTP requests into the real function, running against local
Firebase emulators, with real Firestore transactions, real Storage
writes, real Auth tokens, and real JPEG decoding. No in-memory fake is
involved; the composition under test is the production composition.

## Why this exists

The unit and component suites prove each contract in isolation with
in-memory collaborators. Only an end-to-end run proves the assembled
system: routing, environment loading, multipart transport, emulator
persistence, and the receipt a client would actually receive.

## Contents

- [Environment and safety](01-environment-and-safety.md) — emulator-only
  execution, offline demo project, secrets handling, prerequisites.
- [Runbook](02-runbook.md) — the exact command, expected output, current
  coverage, and how each new step is added.

## Executable location

The scripts live in `e2e/server/` at the repository root, with their own
isolated `firebase.e2e.json` configuration so the end-to-end run never
modifies the deployable `firebase.json`.

## Cadence

Run the suite before every review handoff, after every correction that
touches the server, and before any separately authorized deployment.
A failing or skipped run is recorded in the sprint evidence, never
worked around.

## Growth plan

Steps are added one file at a time, each with one concern. Per Pablo's
2026-08-12 direction, happy paths come first; adversarial steps wait.
Done: `step-01` golden receipt and idempotent retry; `step-02` manifest
conflict protection; `step-03` persisted evidence matches the receipt.

Next happy paths: a maximum-size valid package (many photos) is
accepted; `/inspections` continues to work in the same run.

Deferred (adversarial/robustness): corrupt JPEG entropy, oversized
`413` refusals, concurrent submission convergence.
