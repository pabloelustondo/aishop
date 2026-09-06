# Remediation Steps

Ordered. Each step ends with Pablo, because each one is an approval.

## Step 1 — Commit the governance fix

`AGENTS.md` and the two `docs/articles/byClaude/` files are rewritten to
the commit model and sit unstaged. Read the diff; commit approves it.
Nothing below is safe until this lands: the current `AGENTS.md` tells an
agent to write initials and to push a sprint branch.

## Step 2 — Commit or reject this folder

These five documents are the audit the handoff asked for. Committing
them makes the findings part of the record; rejecting them says the
findings are wrong and should be redone.

## Step 3 — Settle the two Sprint 006 drafts

`exact-hash-approval-identity.md` and `work-item-authorization.md` are
blank drafts describing mechanisms built on retired rules. Rewrite,
discard, or explicitly park each. Parking is a valid answer, but it
should be written down rather than left implied by a blank field.

## Step 4 — Answer D1 through D5

[04-open-decisions.md](04-open-decisions.md). D2 and D3 shape what
Increment 0 is; D1, D4 and D5 shape where its output goes. Answering
these in chat is enough — Claude records them as a decision document in
the sprint folder, and your commit of that document is the approval.

## Step 5 — Reconcile Sprint 007 in the record

Per D1: either a superseding note in `sprint-007-server-recognition/`
naming the new sprint, or a revision. Include what was already built
against it, so the analyse route is not left as code with no plan.

## Step 6 — Draft the Increment 0 Sprint Plan

Goal, scope, exclusions, evidence, decision gates, affected components,
and the end-to-end suite it extends. One document, unstaged, for review.

## Step 7 — Stop

No Sprint Plan Tasks and no branch until Step 6 is committed. Tasks are
a separate document and a separate approval.
