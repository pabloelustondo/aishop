# Sprint 011 — Experimental Capacity Correction

Date: 2026-09-11. Status: PROPOSED; approval requires Pablo's commit.

## Problem

Ignacio's original 750 x 1000 shelf image failed four times. A later screenshot
containing that image also failed. Every provider response was HTTP 200 and
ended at exactly 1,200 output tokens with `max_output_tokens`.

The Agent path still imposes a 1,200-token response cap and aborts after 20
seconds. Those limits prevent realistic dense-shelf discovery during TEST.

## Goal

Let the selected model and the Firebase invocation envelope determine practical
capacity while preserving strict structured output, diagnostics and failure
recording.

## Scope

- Omit `max_output_tokens` from Agent Responses API requests.
- Remove the Agent provider transport's separate 20-second abort.
- Retain Firebase's unavoidable 120-second function deadline.
- Keep `maxInstances: 1`, `concurrency: 1`, authentication and owner isolation.
- Keep recording observed tokens, duration, provider status and memory.
- Apply the correction only to the Agent analyzer and its tests.

## Acceptance

- The provider request contains no application-supplied output-token cap.
- Agent transport is not aborted by the previous 20-second timer.
- Output-limit and timeout responses remain accurately classified if the
  provider or platform still imposes them.
- Existing target-product and area-scan schemas remain unchanged.
- Unit tests and the full emulator E2E gate pass.
- In TEST, retry Ignacio's original immutable image once and correlate its run,
  provider response, token usage, duration and final status.

## Boundaries

No prompt, schema, model, UI, authentication, storage, Firestore or VISTA change.
No production environment exists. Deployment remains separately authorized.
This experiment deliberately accepts higher latency and token cost so observed
real-image behavior can inform later production limits.

## Sequence

Pablo commits this plan after review. Only then draft and commit a separate
component-scoped correction task document. Coding starts only after both commits.
