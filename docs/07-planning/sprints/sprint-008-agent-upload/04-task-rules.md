# Sprint 008 — Task Rules and Validation

Companion to [03-sprint-plan-tasks.md](03-sprint-plan-tasks.md).

## Task rules

- Execute in order. Each task changes only its named component and that
  component's own tests.
- Every behavioural task starts with the smallest failing test, and the
  RED and GREEN commands are recorded.
- A correction that needs a second component becomes a new ordered task
  and needs Pablo's approval before it is written.
- Tasks 1 to 7 are server work; task 8 is the page; task 9 proves the
  assembled system. Task 9 is not optional and is not deferred.
- No `vista-*` module is imported and no VISTA record or object is read
  or written, in any task.
- The existing `/inspections` and VISTA contracts are not modified.

## What stays unauthorized

Deployment, production data, retention or deletion policy, iPhone work,
catalog matching, video, and any queue or second runtime. A commit,
push, or merge is Pablo's act, not the implementing agent's.

## Validation after task 9

- `npm --prefix server test` — full suite, real counts recorded,
  including the 20 pre-existing `sharp` failures if the run is not on
  macOS. That gap is reported, not hidden.
- `./e2e/server/run.zsh` — the whole suite, PASS or FAIL as it comes.
- Owner isolation: a second authenticated caller cannot list, read, or
  run analysis on the first caller's records.
- Immutability: a re-run does not overwrite stored source bytes.
- Failure paths: oversized file, non-JPEG file, missing file part, and
  a provider failure each produce their own state and stable code.
- Redaction: no token, no base64, and no raw bytes appear in logs.
- `git diff --check`.

## Evidence

A delivered-scope report records the exact commit, commands, real
results, environment, limitations, and anything not done. A green build
is not evidence of review, deployment, or usefulness.

## Known gap carried into this sprint

There is no client-side end-to-end gate, per
`docs/00-sdlc2-governance/end-to-end-happy-path-gate.md`. Task 8 adds a
page with no automated coverage; task 9 covers the server path only.
This sprint records that gap rather than claiming the page is proven.
