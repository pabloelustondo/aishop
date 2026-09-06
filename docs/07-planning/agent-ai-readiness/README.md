# Agent AI Readiness

Created: Claude 2026-09-06. Unapproved until Pablo commits it.

## Why this folder exists

The VISTA Agent AI handoff of 2026-09-06 asks for systematic product
recognition and counting, and instructs Claude to audit the repository,
draft an Increment 0 Sprint Plan, and stop for approval.

The audit found conditions that would make that Sprint Plan wrong if
written today: stale governance, an unapproved Sprint 007 that was
partly built anyway, and a contracts directory the handoff describes as
something it is not. This folder records those findings and proposes an
ordered way to clear them before any Increment 0 task is defined.

Nothing here authorizes implementation.

## Contents

- [01-repository-audit.md](01-repository-audit.md) — what the server is
  today, and how far it sits from the proposed architecture.
- [02-contract-inventory.md](02-contract-inventory.md) — which schemas
  actually exist, and where.
- [03-governance-gaps.md](03-governance-gaps.md) — rules that contradict
  each other, and which are already fixed.
- [04-open-decisions.md](04-open-decisions.md) — what only Pablo can
  settle, separated into blocking and deferrable.
- [05-remediation-steps.md](05-remediation-steps.md) — the ordered
  proposal.

## Source documents

The handoff and its three required specifications live in Google Drive,
not in this repository. They are proposals to AI Shop, not AI Shop
governance: where they disagree with the rules under
[docs/00-sdlc2-governance](../../00-sdlc2-governance/README.md), the
repository governs and the disagreement is recorded in
[03-governance-gaps.md](03-governance-gaps.md).
