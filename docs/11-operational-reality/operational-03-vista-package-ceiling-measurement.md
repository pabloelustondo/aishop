# VISTA Package Ceiling Measurement

HumanReviewerInitials:

Status: `AWAITING_INDEPENDENT_REVIEW`

## Environment and deployment — 2026-08-13

- Authorized target: Firebase test project `aishop-99d36`; no production exists.
- Worktree: `/private/tmp/aishop-sprint-005-vista-package-ingest`; branch
  `codex/sprint-005-vista-package-ingest`; starting commit `74597ce`.
- `packageBytes` and `VISTA_MAX_PACKAGE_BYTES` changed only from 26,214,400 to
  104,857,600; all per-artifact and part-count limits stayed unchanged.
- RED: the focused config gate reported 3 pass, 1 expected failure because
  runtime still returned 26,214,400. GREEN: focused 16/16; full suite 158/158.
- Local retained-100-MiB probes peaked at 301,613,056 B (287.641 MiB) and
  299,646,976 B (285.766 MiB), both below the 700 MiB stop threshold.
- Deploy: `firebase deploy --only functions:api --project aishop-99d36` passed
  predeploy and updated only `api`. Live revision `api-00011-xes` is ACTIVE with
  1,024 MiB, 30 s timeout, and `VISTA_MAX_PACKAGE_BYTES=104857600`.

## Exact locally validated packages

| Target | Body bytes | JPEGs | Audit / manifest bytes | Body SHA-256 |
|---|---:|---:|---:|---|
| 25 MiB | 26,214,400 | 5 | 6,914 / 2,040 | `8780384f3cb3edf476154c1ee981dad35d54a079c7301a98045335299eeb5723` |
| 60 MiB | 62,914,560 | 12 | 14,471 / 3,756 | `625cd62fe3c91306f8488091a1b031600f6e72dc7b627dd21bf5d94e06d918a7` |
| 100 MiB | 104,857,600 | 20 | 23,111 / 5,718 | `aaf866a3de1b69f84b2cc4481a6ded9819e057a61ac80ca64acb1d111b840ca7` |

Each package used 4,096×4,096 JPEGs at or below 5,242,880 B, exact artifact
hashes, a C07-consistent chained audit, a schema-valid manifest, and passed the
production `readVistaPackageRequest` plus `validateVistaArtifacts` path locally.

## Live blocker and unmeasured evidence

- Anonymous Identity Toolkit signup returned HTTP 400 `ADMIN_ONLY_OPERATION`.
- Admin config confirms `signIn.anonymous` is absent/disabled; Email/Password is
  enabled and password-required. No anonymous account or ID token was created.
- Consequently zero package bytes were sent. HTTP upload status/time, deployed
  peak memory, receipt retry, Firestore count, and Storage count are unmeasured.
- Gen2's non-increasable 32 MB HTTP ceiling independently means the valid 60 and
  100 MiB bodies cannot reach this handler even after authentication is enabled.

## Review decision required

Independent review must decide whether to authorize anonymous sign-in in the
test project and how to resolve the 32 MB platform ceiling. Do not raise memory;
the 100 MiB survival question is not measurable through this HTTP architecture.
