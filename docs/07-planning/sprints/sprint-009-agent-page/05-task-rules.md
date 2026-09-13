# Sprint 009 — Task Rules and Validation

Companion to [04-sprint-plan-tasks.md](04-sprint-plan-tasks.md).

## Task rules

- Execute in order. Each task changes only its named component and that
  component's own tests. Tasks 4 and 5 share `agent.js` and stay
  separate so each carries its own failing test first.
- Task 1 starts with the smallest failing test; the RED and GREEN
  commands are recorded. Tasks 2 to 5 have no automated coverage — see
  the gap below — so each records what was checked by hand instead.
- A correction needing a second component becomes a new ordered task and
  needs Pablo's approval before it is written.
- No `vista-*` module is imported. The reviewer dashboard, the
  `/inspections` and VISTA contracts, and `analysis-contracts.js` are
  not modified.
- Sprint 008's correction set is implemented and verified before task 1
  begins. Three of those corrections touch `agent.js`.

## What stays unauthorized

Deployment, production data, retention policy, iPhone work, catalog
matching, video, overlays, localization, and any queue or second
runtime. A commit, push, or merge is Pablo's act.

## Validation after task 6

- `npm --prefix server test` — full suite, real counts recorded,
  including the `sharp` failures if the run is not on macOS.
- `./e2e/server/run.zsh` — the whole suite, PASS or FAIL as it comes.
- Owner isolation: a second authenticated caller receives 404 from the
  source route for the first caller's analysis.
- The source route sets `Cache-Control: private, no-store` and never
  serves bytes to an unauthenticated caller.
- At 1440 px no column is capped at 25 rem; at 900 px the image stacks
  above the rows and nothing overflows horizontally.
- The reviewer dashboard renders identically to `main`, evidenced by a
  before-and-after screenshot pair.
- `git diff --check`.

## Known gap carried into this sprint

There is still no client-side end-to-end gate, per
`docs/00-sdlc2-governance/end-to-end-happy-path-gate.md`. Sprint 008
recorded it; this sprint adds four page tasks and closes none of it. The
page is checked by hand, and this sprint records that rather than
claiming the page is proven.
