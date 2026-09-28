# Sprint 005 Implementation Evidence

HumanReviewerInitials: PME

## Scope and identity

- Branch: `codex/sprint-005-vista-package-ingest`.
- Base: `f02e976d00877fe3fb39aa4c97fe5cc669c18baf`.
- Worktree: `/private/tmp/aishop-sprint-005-vista-package-ingest`.
- Implemented: authenticated multipart ingest, real JPEG validation, immutable
  evidence, transactionally idempotent receipt, Firebase route, and rewrite.
- Not implemented: VISTA iPhone changes, analysis, retrieval, review, retention,
  production configuration, deployment, or merge.

## RED then GREEN evidence

- Tasks 1–5 began with focused missing-module or behavioral failures.
- Corrective REDs reproduced false JPEG acceptance, precedence, startup and
  auth failures, excess allocation, and missing Firebase integration evidence.
- Node 22 full suite: 158/158 pass; 0 fail, skip, cancel, or TODO.
- Handoff verifier: PASS with the golden manifest and artifact hashes.
- Exact direct packages: Ajv 8.20.0, Ajv Formats 3.0.1, Busboy 1.6.0,
  Sharp 0.35.3; Firebase Admin resolved 14.2.0 and Functions 7.3.2.
- Node 22 resource checks retained 25 MiB: 39 compact max-axis JPEGs peaked
  at 219856896 B/7.58 s; five dense JPEGs peaked at 221822976 B/1.19 s.
- Firestore + Storage emulators: concurrent identical requests returned
  `[200,201]`, one receipt, one `received` record, and three private objects.

## Known conditions

- Shared `api` startup intentionally remains coupled to nine exact VISTA limits.
- Real-project read-only checks found regional Toronto Firestore/Storage,
  uniform bucket access, public-access prevention, and no public IAM principal.
- Resume-only diagnostics do not detect abandoned stale reservations without a
  request; an explicit contract exception or monitoring policy remains needed.
- Before deployment: test a maximum legal package end-to-end below 30 seconds;
  recheck IAM, privacy, residency, retention, and production configuration.
- No production request, deployment, executable staging, commit, push, or merge.

## Recommendation

**ACCEPT WITH CONDITIONS** after Pablo approves resume-only stale diagnostics
as bounded debt and reapproves this evidence plus the revised component card.
Deployment remains separately blocked by the qualification checks above.
