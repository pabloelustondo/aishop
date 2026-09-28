# Proposed Sprint — Admin All runs page

Status: DRAFT, 2026-09-10. No sprint number, implementation, grant or deployment authorized.
Intent: Pablo specified a separate read-only All runs page accessible only to users with the admin role.
Repository: AI Shop; inspected branch `codex/sprint-010-agent-observability`, commit `8b814a0`.

## Goal and scope

Any user explicitly assigned the admin role can examine saved Agent analyses; no hardcoded email allowlist.
Keep My runs unchanged; provide a separate All runs page with an admin-only navigation link.
One row represents one uploaded image; expandable history contains its initial, retry and refinement attempts.
Show owner identity, creation time, current status and the original image beside GPT products and counts.
Show every recorded attempt's status, context, result and available sanitized diagnostics, including failures.
Filters: owner, creation-date range and current analysis status; label that status filter precisely.
Use bounded cursor pagination, newest first, with a stable tie-breaker; older saved records remain reachable.
Unavailable images, missing diagnostics and unresolved owners are explicit, never invented or silently hidden.

## Components and read boundaries

- All-runs authorization: verifies Firebase identity and the server-issued `admin: true` claim on each request.
- All-runs reader: cross-owner list/detail, scoped filters, stable cursors and record-bound source lookup.
- Owner identity resolver: returns a verified account label or an unresolved/anonymous owner reference.
- All-runs presentation: renders authorized data; it owns no permission policy or analysis decisions.

Browser -> authorized read endpoint -> existing Agent records/evidence; no call to the GPT runner.
List, detail, source and identity reads all require admin server-side; hiding the link is not security.
This increment adds no upload, retry, refinement, review, deletion or account-administration power.
Existing owner-only routes retain their isolation; this does not broaden `agent` or legacy `reviewer` roles.

## Acceptance and test-first evidence

Extend `./e2e/server/run.zsh` with real composition, emulator accounts/storage and a fixture GPT edge.
First prove failure without the feature; then test owners A/B, an admin and non-admin agent/reviewer users.
The admin sees both owners' records, images, saved reports and every recorded retry/refinement attempt.
Missing/invalid identity returns 401; any valid non-admin identity returns 403 on every admin read endpoint.
Direct page URLs show sign-in/access denied for non-admins; forged claims or owner IDs cannot expose data.
Read-only access cannot mutate a foreign record, invoke GPT or change any saved evidence/history.
Test filters, tied timestamps, multiple pages, invalid cursors, missing legacy fields and unavailable storage.
Test permission revocation, sign-out/account switching, stale responses and clearing cached cross-owner images.
Emit redacted access diagnostics: actor reference, operation, target reference, request ID and outcome.
Record exact results plus browser QA; live TEST access with the approved account is a separate acceptance step.

## Decisions and delivery gate

Before tasks: specify trusted admin-role provisioning, revocation semantics and safe legacy identity resolution.
Verify the deployed authentication baseline and reconcile with Sprint 011 before choosing interfaces.
Admin assignment is a separate approved operation, never self-service; no specific email is a design prerequisite.
Exclude VISTA changes, anonymous-user cleanup, recognition changes, bulk export and raw Cloud Logging access.
Pablo reviews and commits this plan first; only then draft separate component-scoped Sprint Plan Tasks.
Code requires both approved documents and explicit implementation authority; security grants need exact approval.
