# Sprint 008 — Run Decision and Correction Tasks

Written by Claude 2026-09-07. Unapproved until Pablo commits it.
Companion to [03-sprint-plan-tasks.md](03-sprint-plan-tasks.md), which
it extends; that document is not edited.

## Added fixed decisions

- **Who fires the run.** The page fires the first run automatically on
  a successful upload. A `failed` record offers **Retry** — the same
  input, justified because nothing was produced. An `analyzed` record
  offers no bare re-run: repeating an identical call spends money for
  the same rows. A second run against a successful record is a
  **Refine**, and earns its cost only because the input differs, via an
  optional `context` note the person supplies.
- **Consequently** a record holds runs as a list, each with its own
  context and report, and `analyzed` reopens to `analyzing`. Rationale:
  [architecture-05](../../../06-solution-design-and-architecture/architecture-05-agent-run-decision.md).
- A second image of the same shelf is several images in one scan, not a
  re-run. Out of scope.

## Added ordered tasks

These reopen components already built and green, so under
[04-task-rules.md](04-task-rules.md) each is its own ordered task. They
run after task 4 and before task 5.

- **4a. Analysis run history** — the record stores `runs` as an
  appended list, each entry carrying its own context, report, model,
  mode, outcome and timestamps; `analyzed` reopens to `analyzing`.
  Changes the analysis store and its own tests only.
- **4b. Analysis context in the provider call** — `analyzeProduct`
  accepts an optional `context` string, appended as a second
  instruction after the contract's own. Additive: the VISTA and
  `/inspections` callers pass nothing and their request bodies are
  unchanged, which a test asserts. Changes the OpenAI adapter and its
  own tests only.
- **4c. Runner carries the context** — the runner takes an optional
  `context`, passes it to the provider, and records it on the run entry.
  Changes the runner and its own tests only.

## Revision to task 8

Task 8's page gains: automatic first run, **Retry** on `failed`, and
**Refine** with a context note on `analyzed`. No bare re-run control is
offered anywhere.
