# Sprint 005 — Approval Transcription and Vendored Integrity Exception

HumanReviewerInitials: PME

HumanReviewDate: 2026-08-11

## Decision

Pablo explicitly authorized Codex on 2026-08-11 to transcribe `PME` and stage
the exact approved Sprint 005 documentation and contract inputs because he
could not do so locally. This is a one-time administrative exception, not
agent self-approval.

## Approved scope

- Preserve the approved [Plan](01-sprint-plan.md) and
  [Tasks](02-sprint-plan-tasks.md) at their exact approved hashes.
- Add `PME` only to the nine project-owned integration-guide files that still
  had blank reviewer fields, then stage the complete guide.
- Stage the checksum-protected endpoint handoff under
  `server/contracts/vista-server-endpoint-agent-handoff-v0.1/` unchanged.
- Exclude the two unrelated, pending Sprint 004 documentation revisions.

## Vendored integrity exception

The immutable handoff contains upstream trailing whitespace, so an unscoped
`git diff --cached --check` reports those vendored lines. Normalizing them
would invalidate `SHA256SUMS.txt`. The bundle remains byte-identical; its
`node scripts/verify-handoff.mjs` check passes. Diff-check validation for
project-owned Sprint 005 files must exclude this exact vendored directory.

## Consequences and limits

This exception creates no precedent and authorizes no executable-code change,
branch switch, commit, push, merge, deployment, production write, or release.
Any later content change invalidates the affected approval normally.
