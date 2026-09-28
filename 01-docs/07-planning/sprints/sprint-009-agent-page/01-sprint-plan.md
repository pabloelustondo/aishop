# Sprint 009 — Agent Page Layout

Created: Claude 2026-09-07. Unapproved until Pablo commits it. Runs after
Sprint 008's [corrections](../sprint-008-agent-upload/06-correction-tasks.md).

## Goal

Give the agent page the whole window: upload, status, and the analysis
beside the photograph it came from. It stops borrowing the reviewer
dashboard's layout and starts showing the data it already receives.

## Why now

`styles/layout.css` sets a bare `main { display: grid;
grid-template-columns: minmax(17rem, 25rem) 1fr; }`, written for the
reviewer dashboard. `agent.html` loads it, so its `<main>` became a
two-column grid: the upload card is trapped in a 25 rem column and the
results wrap underneath it.

The page also discards data: every row carries `confidence` and
`visibleEvidence`, every uncertain item a `description` and `reason`, the
record returns the whole `runs` array, and none of it is shown. Nor can a
report show its own photograph — nothing serves the bytes back.

## In scope

1. **Own layout.** The page stops loading the reviewer dashboard's layout
   rules, so neither page can reshape the other by accident.
2. **Full-width work area**, per [the mockup](../../../06-solution-design-and-architecture/mockups/agent-page-full-width.html).
   The upload control collapses to a header button once any analysis
   exists; with an empty list it is the page.
3. **Serve the stored image back** — a new owner-scoped
   `GET /v1/agent/analyses/{id}/source`. One handler operation and tests.
4. **Show what the report carries** — the image beside the rows,
   confidence and evidence per row, uncertain items with their reasons,
   runs with the note behind each, and the metadata the record holds.

## Out of scope

Human review in any form; it stays on its own page. Any contract or
schema change — the read endpoint is the one server task. Charts,
overlays, localization, and the [benchmark 04](../../../04-benchmarks-test-strategy-and-success-criteria/benchmark-04-zero-context-recognition-baseline.md) contract questions.

## Acceptance

- At 1440 px the table uses the full width, nothing is capped at 25 rem,
  and the reviewer dashboard renders as it does today.
- A report shows its own photograph, and no caller can fetch another's.
- Every returned field is shown, or excluded on the record in
  [02](02-layout-decisions.md) and [03](03-table-decisions.md).
