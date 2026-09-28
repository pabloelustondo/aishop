# Sprint 014 — Cancelling and Restarting an Analysis

Status: Proposed; approval is Pablo's commit. Companion to
[03](03-upload-recovery-plan.md). Goal: one Cancel that works wherever a
record is, and a Restart that re-runs a stuck or cancelled analysis on
stored evidence.

## The rule

Whichever transition is saved first wins. Cancel saved first rejects every
later result; completion saved first makes Cancel report that the analysis
already finished, changing nothing.

Status alone cannot enforce this: after a restart the record is `analyzing`
again, and a worker from the previous attempt would see the status it
expects and apply a stale result. So every attempt carries an identifier,
and every write that settles a stage — upload complete, frame extraction,
provider settlement — is a compare-and-set on status *and* current attempt;
any other attempt's result is discarded.

## What cancelling does at each stage

- `uploaded` — nothing is in flight. Transition only.
- `processing` — delete the queued Cloud Task by the name stored on the
  record. A running task is not killed; it checks status and attempt before
  writing and discards its frames.
- `analyzing` — cancel the provider background response by its stored
  identifier, then delete it as Sprint 013 established.
- `analyzed` and `failed` — terminal. Cancel is not offered.

Cancellation starts no new work; running work may finish and be charged,
and its result is then discarded. It is owner-scoped, idempotent, and
durable before cleanup; a failed cleanup is reported.

## Restart analysis

Re-enters at the earliest stage whose output is missing — `processing` or
`analyzing` — as a new attempt with a new identifier. Allowed once the
source object is complete, which the record reached at `processing`. A
record cancelled during `uploading` has no evidence; see Start fresh in [03](03-upload-recovery-plan.md).

## Acceptance

- Cancel from `uploaded`, `processing` and `analyzing` leaves the record
  `cancelled`, starts no new work, and shows in history.
- A late result from a cancelled or superseded attempt is not applied;
  Cancel after completion reports the completion and alters nothing.
- Restart re-runs on stored evidence without a new upload and is refused
  where none exists. Owner isolation holds. Emulator E2E covers each stage's
  cancel, one late-attempt rejection, and one restart.
