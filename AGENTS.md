# AI Shop Agent Rules

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

- Approval is Pablo's commit of the exact reviewed contents. See [Document Review](docs/00-sdlc2-governance/document-review.md).
- An agent writes, and may stage. An agent never commits, pushes, merges, rebases, or amends.
- Uncommitted work, staged or not, is a proposal; a later edit is unapproved until its own commit.
- An agent may delete a governed file and stage the deletion; Pablo's commit approves it.
- `HumanReviewerInitials:` is retired. No new document carries one, and no agent writes initials into any file for any reason.
- Surviving initials fields are historical record of approvals already given; remove one only when its document is next revised.
- If a governed Markdown file the work depends on is uncommitted, executable code changes are blocked.
- Never infer approval from praise, silence, or unrelated acceptance. An agent that believes a commit is needed says so and stops.

## Execution

- No sprint coding may start until Pablo has committed every governed Markdown file the sprint depends on.
- Every sprint requires an approved Sprint Plan followed by a separate approved Sprint Plan Tasks document before coding begins.
- After both commits, create and switch to a dedicated sprint branch before coding; Pablo merges it into `main` through the normal reviewed workflow.
- Each implementation task names exactly one approved component and modifies only that component; split multi-component work into ordered tasks.
- Sprint authorization covers its approved tasks, branch creation, routine changes, builds, tests, and simulator checks; proceed autonomously without intermediate permission.
- Do not ask between routine, reversible, in-scope steps or before advancing to the next approved task.
- Ask only before changing approved scope, deploying to production, releasing, or risking external data, secrets, money, security, or irreversible damage.
- Planning, implementation, validation, review, production deployment, merge, and release remain distinct states.

## Git and external systems

- Every Git act that publishes or rewrites — commit, push, merge, rebase, amend, branch deletion — is Pablo's alone.
- Existing Firebase POC resources may be read, tested, updated, and deployed; ask before billing, deletion, destructive data, IAM, security, or secret changes.
- Google Workspace may be read and summarized; ask before writing, deleting, sharing, or sending.
