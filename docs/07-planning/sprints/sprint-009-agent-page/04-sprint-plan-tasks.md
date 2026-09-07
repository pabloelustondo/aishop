# Sprint 009 — Sprint Plan Tasks

Created: Claude 2026-09-07. Drafted alongside
[01-sprint-plan.md](01-sprint-plan.md), which is itself uncommitted.
`AGENTS.md` wants the plan approved before these exist, so read this as
a proposal attached to that one: coding begins only after Pablo commits
the plan **and** this document. Rules and validation in
[05-task-rules.md](05-task-rules.md).

## Fixed decisions

- Layout, upload behaviour and the table are settled in
  [02](02-layout-decisions.md) and [03](03-table-decisions.md), and shown
  in [the mockup](../../../06-solution-design-and-architecture/mockups/agent-page-full-width.html).
- Route `GET /v1/agent/analyses/{id}/source`. No contract or schema
  change; the response is bytes, not JSON.
- The reviewer dashboard is not edited, and human review does not appear
  on this page in any form.

## Ordered tasks

1. **Agent API handler — serve the stored source.**
   `agent-api-handler.js`. A fifth operation reading the caller's own
   evidence and answering with `sendBytes`; another owner's analysis is
   `analysis_not_found`, an unreadable object is `storage_unavailable`.
   The handler already holds the evidence store; nothing new is injected.
2. **Agent page stylesheet.** New `dashboard/styles/agent.css`, and
   `agent.html` stops loading `styles/layout.css`. This is the task that
   ends the shared-`main` coupling; the reviewer dashboard must render
   unchanged after it.
3. **Agent page markup.** `dashboard/agent.html`: slim header carrying
   the collapsed upload control, the expandable upload row, the
   work area, and the empty state.
4. **Page script — upload control states.** `dashboard/scripts/agent.js`.
   Collapsed by default, expanded on request, and the whole page when no
   analysis exists.
5. **Page script — render one analysis.** Same component. Image beside
   the rows; three columns with the confidence badge carrying its
   evidence on hover and focus; uncertain items with their reasons; run
   history with the note behind each run; the metadata the record holds.
6. **Verification pass.** No component change. A recorded check at
   1440 px and at 900 px, the reviewer dashboard compared against `main`,
   and keyboard traversal of one analysis.

## Sequencing

Task 1 lands before 5: the page cannot show an image nothing serves.
Task 2 lands before 3, or the markup is written against a layout that is
about to be replaced.
