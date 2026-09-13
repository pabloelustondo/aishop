# Sprint 013 — Server-Owned Background Analysis

Date: 2026-09-13. Status: PROPOSED revision; approval requires Pablo's commit.
The previously approved browser-collection scope is rejected and authorizes no further code.

## Goal

Complete dense-shelf analysis beyond HTTP deadlines while Firestore and private
server processes—not any browser—own progression and terminal state.

## Scope

- Start one stored OpenAI background response without `max_output_tokens`.
- Persist provider ID, run identity, status, lease and next collection time server-side.
- Enqueue a private Firebase Cloud Task after provider-ID persistence.
- Retrieve and settle through an idempotent task with 15-second provider-call deadlines.
- Re-enqueue intermediate responses after 15 seconds; use bounded queue retry/rate limits.
- Reconcile overdue `analyzing` records on a server schedule to repair dispatch gaps.
- Delete provider responses best-effort only after durable terminal settlement.
- Make My Runs and All Runs read durable state only; page refresh cannot advance work.
- Preserve strict schemas, diagnostics, redaction, authorization and TEST target.

## Acceptance

- Closing or refreshing every browser cannot stop or duplicate server progression.
- Repeated, concurrent and stale task deliveries create no duplicate run or settlement.
- A missed enqueue or crashed task is recovered by the reconciler without user action.
- Pages show state loaded from owner/admin APIs and never call a provider-collection route.
- Provider IDs and task internals never serialize publicly.
- Emulator E2E proves start, intermediate, recovery, terminal, cleanup and authorization.
- TEST completes Ignacio's image and correlates Firestore, task and provider diagnostics.

## Boundaries and authority

No Python, Cloud Run, Pub/Sub, model/prompt/schema/auth, VISTA or iOS change.
An uncertain provider start remains a diagnosed orphan and is never auto-retried.
Cloud Tasks/Scheduler creation, IAM, billing and TEST deployment require separate approval.

## Gates

After Pablo commits this revision, replace and approve the obsolete Sprint Plan
Tasks in a separate commit. Only then resume coding on the Sprint 013 branch.
Pablo alone commits, publishes, deploys, merges or releases.
