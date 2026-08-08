# Document Review

HumanReviewerInitials:PME

## Scope

These rules apply to every project-owned Markdown file at the repository root and under `docs/`, including `AGENTS.md` and every `README.md`.

Markdown elsewhere in the repository does not use this approval mechanism unless governance explicitly adds it.

## Standard entry

Every document contains exactly one `HumanReviewerInitials:` field near its title.

## Decisions

- Only a human may enter initials listed under **Project collaborators** in the root [README](../../README.md).
- A blank field means the document is unapproved.
- Human initials mean the exact document contents are approved.
- When changes are requested, the field remains blank until revision and approval.
- Praise, silence, or acceptance elsewhere never changes the entry.

If any governed Markdown file is not approved, the agent must not create or modify executable code or create a Git commit.

## Git staging

- Unstaged document changes are pending human review.
- Registered initials plus the exact staged contents mean a changed document is approved and awaiting commit.
- A partially staged document is unapproved.
- A clean committed document retains the approval recorded in its contents.
- Any unapproved or partially staged governed document found staged must be unstaged immediately.

## Deletions

- A deleted document cannot contain reviewer initials.
- The agent leaves governed Markdown deletions unstaged.
- A human approves a deletion by staging it during final Git review.
- An unstaged governed Markdown deletion is pending and blocks a commit.

## Revision rule

Approval applies only to the exact reviewed contents. Before any edit, the agent unstages the document and clears its initials. Any later change, including formatting or typo correction, invalidates approval. Git history retains the earlier decision and its date.

Document approval is separate from implementation, testing, deployment, publication, and release authorization.
