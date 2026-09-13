# Sprint 012 — Admin All runs page
Date: 2026-09-11. Status: PROPOSED; approval is Pablo's commit. Numbered from the proposal
[agent-all-runs](../../proposals/agent-all-runs/01-sprint-plan.md) (committed 2026-09-10, implementation
authorized 2026-09-11 with Sprint 011). Drafted by Claude.

## Goal and user stories

An account Pablo has explicitly given the admin role can examine every saved agent analysis, from every
owner, read-only: who uploaded it, when, its current status, the image, GPT's products and counts, and each
recorded attempt — initial, retry, refinement — with its note, result and sanitized diagnostics, failures
included. My runs is unchanged; All runs is a separate page reached by a link only admins see.

## What already exists, and is reused

Sprint 011's claim gate and administrator tool (`--role admin` is accepted and grants nothing on the agent
routes); the analysis store's record shape, the evidence store's `readSource`, the diagnostics envelope,
and the agent page's card rendering and stylesheet.

## Scope

1. Authorization: every All-runs route requires a verified token carrying `admin: true`; else `403`.
2. Cross-owner reader: newest first, stable tie-breaker, bounded cursor pagination, filters by owner,
   creation-date range and current status. Legacy records with missing fields are returned with `null`s.
3. Owner identity resolver: an owner key becomes a verified account label (email, or a Google display
   name), an explicit "anonymous", or "unresolved" — never a uid, never a guess.
4. Routes: `GET /v1/admin/analyses`, `GET /v1/admin/analyses/{ownerKey}/{analysisId}`, and `…/source`.
   No other method on any of them.
5. Redacted access diagnostics per request: actor reference, operation, target reference, request id,
   outcome. Nothing else about the actor or the target reaches a log line.
6. Page `allruns.html`: one row per uploaded image, expandable attempt history, filters, next/previous
   pages, image beside products and counts; sign-in and not-authorized states; an admin-only link on the
   agent page.
7. Hosting rewrite for `/v1/admin/**`; Firestore collection-group indexes the listing needs.
8. E2E step 08 on the emulators; operator recipe for granting the admin role; delivered-scope report.

## Acceptance

- Missing or invalid token: `401`. Any valid non-admin token, agent and reviewer included: `403` on every
  All-runs route, source included. A forged `owner` filter or a guessed key exposes nothing a non-admin could
  not already see, because every route checks the claim before reading anything.
- An admin lists both test owners' records, opens each, sees every attempt, and reads the stored image.
- Filters combine; tied timestamps page correctly; an invalid cursor is `400 cursor_invalid`; a page past the
  end is an empty list with no cursor. Missing legacy fields are `null`, never invented.
- No route mutates a record, calls the provider, or writes evidence: there is no POST.
- The reviewer dashboard and My runs render unchanged.

## Boundaries and sequencing

No VISTA change, anonymous-user cleanup, recognition change, bulk export, raw Cloud Logging access or admin
self-service. Tasks: [04](04-sprint-plan-tasks.md); rules: [05](05-task-rules.md). Deployment needs authorization.
