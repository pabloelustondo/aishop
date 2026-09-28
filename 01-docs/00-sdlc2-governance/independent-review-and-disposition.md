# Independent Review and Human Disposition

HumanReviewerInitials:

DRAFT — Sprint 006 candidate; not authoritative until approved.

Origin: VISTA review templates and process, retrofitted 2026-08-12.

## Independence

The implementing agent never approves its own work. An independent
reviewer reproduces the evidence — commands, counts, hashes — rather
than trusting the implementer's self-checks, and separates reproduced
facts from interpretation. Unavailable checks are reported honestly.

## Findings first

Reviews open with findings ordered `Blocker`, `Major`, `Minor`, each
with exact file/line or artifact evidence and a concrete failure mode.
No findings are invented to fill a template; "No findings" is a valid
result. A gate-by-gate table records PASS / FAIL / BLOCKED for scope,
correctness, tests, evidence integrity, security, and documentation.

## Fixed decision vocabularies

- Reviewer recommendation and human sprint decision:
  `ACCEPT | ACCEPT WITH CONDITIONS | CHANGES REQUIRED | REJECT |
  BLOCKED`.
- Independent QA verdict: `PASS | PASS WITH FINDINGS | FAIL | BLOCKED`.

## The reviewer recommends; Pablo decides

A recommendation carries no authority. The human disposition
dispositions every Blocker and condition explicitly, ratifies or
rejects any recorded exception by exact hashes, and records each
follow-on action in a per-action authority table — stage, branch,
commit, push, PR, merge, deploy, publish, release — individually
`AUTHORIZED` or `NOT AUTHORIZED`. Acceptance authorizes none of them
by implication.

## Correction loop

`CHANGES REQUIRED` creates a new bounded correction task and a new
immutable prompt identity. Intended-scope changes reapprove the Plan
first; execution-detail changes reapprove Tasks. Original activated
artifacts are never rewritten, and a correction inherits no acceptance
or Git authority from the earlier attempt. Corrections repeat
delivered-scope reconciliation, proportionate QA, independent review,
and human disposition.
