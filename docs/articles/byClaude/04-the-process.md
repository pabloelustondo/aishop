# SDLC2: How the Project Builds Itself

HumanReviewerInitials: PME

What stood out most while reading this repository wasn't the camera app
or the server — it was the process the project imposes on itself,
documented in [AGENTS.md](../../../AGENTS.md).

## The rules, in effect

Every document under `docs/` and every root Markdown file carries a
`HumanReviewerInitials:` field. Blank means unapproved. Only Pablo, as
the sole name listed under "Project collaborators" in the root README,
can approve one — by typing his initials into the exact reviewed text
and staging it in Git. An agent editing a governed document must clear
that field first; even a one-character fix invalidates a prior approval.
If any governed document is unapproved, code changes and commits are
blocked outright. Every file is also capped at 50 physical lines, which
forces ideas to be split into small, named, single-purpose documents
rather than compressed into fewer, denser ones.

## What this buys the project

It makes "who approved this, and approved exactly what" a Git-verifiable
fact rather than a claim. An agent (or a person) cannot quietly slip a
change past review, because approval is bound to literal staged content,
not intent or a prior conversation. It also means the project's own
history is unusually legible — small files, small diffs, explicit
sign-off — at the cost of more files and more procedural overhead than a
typical solo side project would normally carry.

## The parallel to the product

It's a deliberate echo of the audit architecture described in
[03-auditability.md](03-auditability.md): the same "don't trust it until
a human confirms it, and keep the confirmation attributable" discipline
that AI Shop applies to grocery-shelf findings, the project applies to
its own documents and code. This document, being agent-authored, is
itself unapproved until Pablo reviews and initials it.
