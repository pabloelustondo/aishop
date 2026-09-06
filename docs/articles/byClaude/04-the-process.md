# SDLC2: How the Project Builds Itself

What stood out most while reading this repository wasn't the camera app
or the server — it was the process the project imposes on itself,
documented in [AGENTS.md](../../../AGENTS.md) and the rules under
[docs/00-sdlc2-governance](../../00-sdlc2-governance/README.md).

## The rules, in effect

Approval is a Git commit, and only Pablo makes one. An agent writes;
it never commits, pushes, merges, rebases, or amends. So uncommitted
work — however finished it looks — is a proposal, and the diff Pablo
reads before committing is the review. A later edit is unapproved
until its own commit. If a governed document the work depends on is
still uncommitted, code changes are blocked outright. Decision
documents are also capped at 50 physical lines, which forces ideas to
be split into small, named, single-purpose files rather than
compressed into fewer, denser ones.

An earlier version of this rule had reviewers type their initials into
a `HumanReviewerInitials:` field. That was retired in August 2026: Git
already records what changed, when, and by whom, so the commit is made
to carry the one fact Git cannot infer — that Pablo read the change and
accepted it. Fields surviving in older documents are historical record
of approvals already given.

## What this buys the project

It makes "who approved this, and approved exactly what" a Git-verifiable
fact rather than a claim. An agent (or a person) cannot quietly slip a
change past review, because approval is bound to literal committed
content, not intent or a prior conversation. It also means the project's
own history is unusually legible — small files, small diffs, explicit
sign-off — at the cost of more files and more procedural overhead than a
typical solo side project would normally carry.

## The parallel to the product

It's a deliberate echo of the audit architecture described in
[03-auditability.md](03-auditability.md): the same "don't trust it until
a human confirms it, and keep the confirmation attributable" discipline
that AI Shop applies to grocery-shelf findings, the project applies to
its own documents and code. This document, being agent-authored, is
itself unapproved until Pablo commits it.
