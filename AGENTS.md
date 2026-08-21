# AI Shop Agent Rules

HumanReviewerInitials:PME

These rules are mandatory throughout this repository.

## Mandatory governance

- Before changing documentation, plans, code, tests, or releases, read [SDLC2-Governance](docs/00-sdlc2-governance/README.md).
- Follow its document-review rules before editing root-level Markdown or any Markdown file under `docs/`.
- Follow its workflow rules before planning, implementing, reviewing, or releasing work.
- Changes to `AGENTS.md` require Pablo's explicit instruction.

## File size

- Decision documents contain at most 50 physical lines: root Markdown, everything under `docs/00-` through `docs/08-`, and any Markdown carrying an approval field.
- Split them into focused files; never compress content into dense or unreadable lines.
- Every other file has no line limit, including evidence, reference material, source code, tests, schemas, generated reports, artifacts, and third-party files.
- Existing violations must be split before the file is otherwise modified.
- Verify decision-document line counts before treating work as complete.

## Human review

- Every root-level Markdown file and every Markdown file under `docs/` must contain the standard `HumanReviewerInitials:` field.
- Only a human may enter initials registered in the root `README.md`; a blank field means unapproved.
- A changed governed Markdown file is approved only when it has registered initials and its exact reviewed contents are staged in Git.
- Any unapproved or partially staged governed Markdown file found staged must be unstaged immediately.
- Before any agent edit, unstage the file and clear its reviewer initials; even a one-character edit invalidates approval.
- Never request approval for a proposed revision until its exact content exists unstaged with blank initials and the provided link opens that revision.
- Never present an unchanged approved document as pending approval; identify the missing revision and create it first when authorized.
- The agent leaves governed Markdown deletions unstaged; only a human approves a deletion by staging it during final Git review.
- If any governed Markdown file is not human-approved, executable code changes and Git commits are blocked.
- Never infer approval from praise, silence, or unrelated acceptance.

## Execution

- No sprint coding may start until every governed Markdown file is human-approved and every changed governed Markdown file is fully staged.
- Every sprint requires an approved Sprint Plan followed by a separate approved Sprint Plan Tasks document before coding begins.
- After both approvals, create and switch to a dedicated sprint branch before coding; merge it into `main` through the normal reviewed workflow.
- Each implementation task names exactly one approved component and modifies only that component; split multi-component work into ordered tasks.
- Sprint authorization covers its approved tasks, branch creation, routine changes, builds, tests, simulator checks, local commits, and pushing the sprint branch; proceed autonomously without intermediate permission.
- Do not ask between routine, reversible, in-scope steps or before advancing to the next approved task.
- Ask only before changing approved scope, deploying to production, merging into `main`, releasing, or risking external data, secrets, money, security, or irreversible damage.
- Planning, implementation, validation, review, production deployment, merge, and release remain distinct states.

## Git and external systems

- Never force-push, rewrite shared history, or delete shared branches without Pablo's explicit authorization.
- Existing Firebase POC resources may be read, tested, updated, and deployed; ask before billing, deletion, destructive data, IAM, security, or secret changes.
- Google Workspace may be read and summarized; ask before writing, deleting, sharing, or sending.
