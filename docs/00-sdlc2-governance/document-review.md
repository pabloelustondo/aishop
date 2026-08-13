# Document Review

Supersedes the reviewer-initials mechanism, by Pablo's decision of
2026-08-13. Approved by the commit that introduces it.

## Scope

These rules apply to every project-owned Markdown file at the
repository root and under `docs/`, including `AGENTS.md` and every
`README.md`. Markdown elsewhere does not use this mechanism unless
governance explicitly adds it.

## Approval is the commit

Git already records what changed, when, and by whom. The only fact it
cannot infer is that Pablo read the change and accepted it. So the
commit carries that fact, and nothing else needs to.

- An agent writes, and may stage. **An agent never commits, pushes,
  merges, rebases, or amends.**
- Pablo commits after reviewing the diff. That commit approves those
  exact contents.
- Uncommitted work, staged or not, is a proposal. Staging is how an
  agent offers work for review; it never implies approval.
- A later edit is unapproved until its own commit.

## Attribution is the weak point

Git attributes a commit to whoever runs it, and this machine's config
names Pablo. The mechanism therefore holds only while agents never
commit. An agent that believes a commit is needed says so and stops.

## Deletions

An agent may delete a file and stage the deletion. Pablo's commit
approves it. An uncommitted deletion is a proposal.

## Retired: reviewer initials

`HumanReviewerInitials:` is superseded. No new document carries one,
and no agent may write initials into any file for any reason. Fields
surviving in existing documents are historical record of approvals
already given; they are removed as those documents are next revised.

## Limits

Document approval is separate from implementation, testing, deployment,
publication, and release. Each is separately authorized, and a commit
approving a document authorizes none of them.
