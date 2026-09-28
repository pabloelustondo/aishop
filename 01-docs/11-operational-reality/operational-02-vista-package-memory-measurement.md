# VISTA Package Memory Measurement

HumanReviewerInitials:

Status: `AWAITING_INDEPENDENT_REVIEW`

## Observed sequence — 2026-08-13

- Changed `api` from `256MiB` to `1GiB` and updated its assertion.
- `npm test -- --test-name-pattern='exports the Firebase v2 HTTP function'`
  passed 73 tests with no failures or skips.
- The authorized `firebase deploy --only functions:api` uploaded 269.52 KB and
  the first captured stream ended while the function update was still running.
- An immediate read during that update still showed 256 MiB.
- Later live verification confirmed the update completed at 1,024 MiB; revision
  `api-00010-jeh` was active before the package-limit follow-up began.

## Measurement disposition

No package was submitted under the original prompt. The later 100 MiB limit
change and authentication finding are recorded in
`operational-03-vista-package-ceiling-measurement.md`.
