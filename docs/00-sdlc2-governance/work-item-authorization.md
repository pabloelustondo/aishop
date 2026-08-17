# Work-Item Authorization

HumanReviewerInitials:

DRAFT — Sprint 006 candidate; not authoritative until approved.

Origin: VISTA's agentic execution protocol, retrofitted 2026-08-12.

## The problem this solves

File names, timestamps, sprint numbers, and folder order cannot safely
tell an agent what work is authorized. A review may be newer than its
prompt; a prompt may be a draft. Selection by recency is forbidden.

## The pointer

One file, `docs/07-planning/NEXT_WORK_ITEM.md`, names the single
authorized work item. A `READY` record binds, at minimum: approved
Sprint Plan and Tasks paths with their exact SHA-256 hashes, one task
identifier, exactly one component, the immutable prompt path and
SHA-256, the authorized work branch and base commit, the response path
(which must not yet exist), the stop state, and explicit Git authority.

Only a human activates `READY`. A non-`READY` state stops the agent
without edits. The agent may change only the state field:
`READY → IN_PROGRESS → AWAITING_INDEPENDENT_REVIEW`, or to `BLOCKED`
on failure or ambiguity. Every other field is immutable in flight.

## One component per task

Each implementation task names exactly one approved component and
modifies only that component; cross-component work becomes ordered
tasks with stable interfaces. A required scope change moves the item
to `BLOCKED` and enters the correction loop — it is never absorbed.

## The immutable prompt

The approved Tasks artifact binds each task to one prompt by path and
SHA-256. The activated prompt is an execution specification, not a
third approval gate, and the implementing agent must never edit it.
Changing execution detail requires a revised, reapproved Tasks artifact
and a new prompt identity; activated artifacts remain as evidence.

## States

`READY`, `IN_PROGRESS`, `AWAITING_INDEPENDENT_REVIEW`, `BLOCKED`,
`ACCEPTED` (human only), `CLOSED` (human-authorized records complete).
Markdown records state but provides no locking: one active agent, one
work item at a time.
